
import { Teacher, ReportData, ObservationItem, LegacyReportOptions, InspectorProfile } from '../types';
import { DEFAULT_OBSERVATION_TEMPLATE, INITIAL_REPORT_STATE } from '../constants';
import { MODERN_RANKS, MODERN_DEGREES } from '../modernConstants';

declare const XLSX: any;

const generateId = () => Math.random().toString(36).substr(2, 9);

// Exported so it can be used in DatabaseManager for JSON restoration
export const normalizeDate = (val: any): string => {
    if (!val) return '';
    
    // Handle ISO Format (e.g., 2024-06-30T00:00:00.000Z)
    const str = String(val).trim();
    if (str.includes('T')) {
        return str.split('T')[0];
    }

    // Handle Excel Serial Numbers
    if (typeof val === 'number' && val > 20000) {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    // Regex allows / . - as separators
    const parts = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (parts) {
        const d = parts[1].padStart(2, '0');
        const m = parts[2].padStart(2, '0');
        let y = parts[3];
        if (y.length === 2) y = '20' + y; 
        return `${y}-${m}-${d}`;
    }
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
         return str;
    }
    return str; 
};

/**
 * دالة مساعدة لتحويل التاريخ من صيغة النظام (YYYY-MM-DD)
 * إلى صيغة العرض العربية (DD/MM/YYYY)
 */
export const formatDateForDisplay = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    
    // Check if it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [year, month, day] = str.split('-');
        return `${day}/${month}/${year}`;
    }
    
    // If it's already DD-MM-YYYY or DD/MM/YYYY, ensure slashes
    return str.replace(/-/g, '/');
};

// --- SMART NORMALIZATION FUNCTIONS ---

const normalizeRank = (input: string): string => {
    if (!input) return "أستاذ المدرسة الابتدائية";
    const text = input.trim().toLowerCase(); // Normalize input

    // 1. أستاذ مميز
    if (text.includes("مميز") || text.includes("متميز")) {
        return "أستاذ مميز في المدرسة الابتدائية";
    }
    
    // 2. أستاذ مكون
    if (text.includes("مكون")) {
        return "أستاذ مكون في المدرسة الابتدائية";
    }

    // 3. قسم ثان (ق2, 2, ثان)
    if (text.includes("ثان") || text.includes("ثاني") || text.includes("ق2") || text.includes("قسم 2") || /\b2\b/.test(text)) {
        return "أستاذ المدرسة الابتدائية قسم ثان";
    }

    // 4. قسم أول (ق1, 1, أول)
    if (text.includes("أول") || text.includes("اول") || text.includes("ق1") || text.includes("قسم 1") || /\b1\b/.test(text)) {
        return "أستاذ المدرسة الابتدائية قسم أول";
    }

    // Default
    return "أستاذ المدرسة الابتدائية";
};

const normalizeDegree = (input: string): string => {
    if (!input || input.trim() === '') return "ليسانس"; // Default Minimum Requirement
    const text = input.trim().toLowerCase();

    if (text.includes("ماستر") || text.includes("ماجستير") || text.includes("master")) {
        return "ماستر";
    }
    
    if (text.includes("عليا") || text.includes("ens")) {
        return "خريج(ة) المدرسة العليا للأساتذة";
    }

    if (text.includes("معهد") || text.includes("ite")) {
        return "خريج(ة) المعهد التكنولوجي";
    }

    if (text.includes("تطبيقية") || text.includes("deua")) {
        return "شهادة الدراسات الجامعية التطبيقية";
    }

    if (text.includes("دكتوراه") || text.includes("ما بعد") || text.includes("دراسات عليا")) {
        return "شهادة الدراسات العليا";
    }

    // Default catch-all for anything else containing 'licence' or generic
    return "ليسانس";
};

const normalizeLevel = (input: string): string => {
    if (!input) return "";
    const text = input.trim();

    if (text.includes("تحضيري") || text.includes("ت ح")) return "التربية التحضيرية";
    
    // Check for numbers 1-5
    if (text.includes("1") || text.includes("أول") || text.includes("اول")) return "السنة الأولى";
    if (text.includes("2") || text.includes("ثاني")) return "السنة الثانية";
    if (text.includes("3") || text.includes("ثالث")) return "السنة الثالثة";
    if (text.includes("4") || text.includes("رابع")) return "السنة الرابعة";
    if (text.includes("5") || text.includes("خامس")) return "السنة الخامسة";

    return text; // Return as is if no match found
};

export const generateSchoolTemplate = () => {
    // --- 1. PREPARE DATA LISTS ---
    const ranks = MODERN_RANKS;
    const degrees = MODERN_DEGREES; 
    const status = ["مرسم", "متعاقد", "متربص"];
    const echelons = Array.from({length: 12}, (_, i) => (i + 1).toString()); 
    const levels = ["التربية التحضيرية", "السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة"];

    const maxLength = Math.max(ranks.length, degrees.length, status.length, echelons.length, levels.length);
    
    // Create Columns for the Hidden Sheet
    const dataSheetRows = [["قائمة_الرتب", "قائمة_الشهادات", "قائمة_الوضعية", "قائمة_الدرجات", "قائمة_المستويات"]];
    
    for (let i = 0; i < maxLength; i++) {
        dataSheetRows.push([
            ranks[i] || "",
            degrees[i] || "",
            status[i] || "",
            echelons[i] || "",
            levels[i] || ""
        ]);
    }

    // --- 2. CREATE WORKBOOK ---
    const wb = XLSX.utils.book_new();
    
    // --- 3. CREATE DATA SHEET (HIDDEN) ---
    const wsData = XLSX.utils.aoa_to_sheet(dataSheetRows);
    XLSX.utils.book_append_sheet(wb, wsData, "Lists");

    // --- 4. CREATE MAIN SHEET ---
    const headers = [
        "اللقب والاسم",       // A
        "تاريخ الميلاد",      // B
        "مكان الميلاد",       // C
        "الشهادة",            // D
        "تاريخ الشهادة",      // E
        "تاريخ التعيين",      // F
        "الرتبة",             // G
        "تاريخ التعيين في الرتبة", // H
        "الدرجة (رقم)",       // I
        "تاريخ الدرجة",       // J
        "الوضعية",            // K
        "آخر نقطة تفتيش",     // L
        "تاريخ آخر تفتيش",    // M
        "المدرسة الحالية",    // N
        "المستوى المسند"      // O
    ];

    // Add an example row to guide the user
    const exampleRow = [
        "مثال: محمد بن عبد الله", // Name
        "01/01/1990",           // Birth
        "الجزائر",               // Place
        "ليسانس",               // Degree
        "30/06/2012",           // Degree Date
        "01/09/2015",           // Recruit
        "أستاذ المدرسة الابتدائية", // Rank
        "01/09/2018",           // Rank Date
        "3",                    // Echelon
        "01/01/2021",           // Echelon Date
        "مرسم",                 // Status
        "15",                   // Mark
        "15/02/2023",           // Insp Date
        "مدرسة الأمير عبد القادر", // School
        "السنة الثالثة"          // Level
    ];

    const wsMain = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

    // Force RTL View for the sheet
    if(!wsMain['!views']) wsMain['!views'] = [];
    wsMain['!views'].push({ rightToLeft: true });

    // Column Widths
    wsMain['!cols'] = [
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
    ];

    // --- DATA VALIDATION (DROPDOWNS) ---
    const rangeLimit = 200; 

    // Dropdowns referencing the "Lists" sheet
    wsMain['!dataValidation'] = [
        { sqref: `D2:D${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$B$2:$B$${degrees.length + 1}`, showDropDown: true }, // Degrees
        { sqref: `G2:G${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$A$2:$A$${ranks.length + 1}`, showDropDown: true }, // Ranks
        { sqref: `I2:I${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$D$2:$D$${echelons.length + 1}`, showDropDown: true }, // Echelons
        { sqref: `K2:K${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$C$2:$C$${status.length + 1}`, showDropDown: true }, // Status
        { sqref: `O2:O${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$E$2:$E$${levels.length + 1}`, showDropDown: true }  // Levels
    ];

    // --- FORMATTING ---
    const dateCols = [1, 4, 5, 7, 9, 12]; // B, E, F, H, J, M
    for(let R = 1; R < rangeLimit; ++R) {
        // Force Text Format for Date Columns
        dateCols.forEach(C => {
            const cellRef = XLSX.utils.encode_cell({c: C, r: R});
            if(!wsMain[cellRef]) wsMain[cellRef] = { t: 's', v: '' }; // Create empty string cell if undefined
            wsMain[cellRef].z = '@'; // Excel Text Format
        });

        // Force Text Format for Echelon and Mark
        const echelonRef = XLSX.utils.encode_cell({c: 8, r: R}); // I
        if(!wsMain[echelonRef]) wsMain[echelonRef] = { t: 's', v: '' };
        wsMain[echelonRef].z = '@';

        const markRef = XLSX.utils.encode_cell({c: 11, r: R}); // L
        if(!wsMain[markRef]) wsMain[markRef] = { t: 's', v: '' };
        wsMain[markRef].z = '@';
    }

    XLSX.utils.book_append_sheet(wb, wsMain, "معلومات_الأساتذة");

    // --- WORKBOOK PROPERTIES (Configure RTL and Hidden Sheet) ---
    // This correctly initializes the workbook structure to hide the first sheet
    wb.Workbook = {
        Views: [{ RTL: true }],
        Sheets: [
            { Hidden: 1 }, // Index 0: "Lists" -> Hidden
            { Hidden: 0 }  // Index 1: "Main" -> Visible
        ]
    };
    
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

// Modified to return BOTH Teachers and Reports (to capture School/Class)
export const parseSchoolExcel = (data: ArrayBuffer): { teachers: Teacher[], reports: Record<string, ReportData> } => {
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Determine which sheet to read. We look for "معلومات_الأساتذة".
    let targetSheetName = "معلومات_الأساتذة";
    if (!workbook.SheetNames.includes(targetSheetName)) {
        // If not found, try the second sheet (index 1) assuming index 0 might be "Lists"
        if (workbook.SheetNames.length > 1) {
            targetSheetName = workbook.SheetNames[1]; 
        } else {
            targetSheetName = workbook.SheetNames[0]; 
        }
    }

    const worksheet = workbook.Sheets[targetSheetName];
    // raw: true gets values as stored (strings preferably)
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }); 
    
    if (!rows || rows.length < 2) return { teachers: [], reports: {} };

    const teachers: Teacher[] = [];
    const reports: Record<string, ReportData> = {};

    // Skip header row (index 0).
    // Also, DETECT and SKIP the Example Row if it exists.
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[0]) continue;

        const fullName = String(row[0]).trim();
        // Skip Example Row based on keyword "مثال" or "Example"
        if (fullName.includes("مثال") || fullName.includes("Example")) continue;

        const id = generateId();

        // Determine Status
        const rawStatus = String(row[10] || '').trim();
        let status: 'titulaire' | 'contractuel' | 'stagiere' = 'titulaire';
        if (rawStatus.includes('متعاقد')) status = 'contractuel';
        else if (rawStatus.includes('متربص')) status = 'stagiere';

        // Extract and Normalize Data
        const rawRank = String(row[6] || '').trim();
        const normalizedRank = normalizeRank(rawRank);

        const rawDegree = String(row[3] || '').trim();
        const normalizedDegree = normalizeDegree(rawDegree);

        const rawSchool = String(row[13] || '').trim(); // Column N
        const rawLevel = String(row[14] || '').trim();  // Column O
        const normalizedLevel = normalizeLevel(rawLevel);

        const teacher: Teacher = {
            id: id,
            fullName: fullName,
            birthDate: normalizeDate(row[1]),
            birthPlace: String(row[2] || '').trim(),
            degree: normalizedDegree, 
            degreeDate: normalizeDate(row[4]),
            recruitmentDate: normalizeDate(row[5]),
            rank: normalizedRank, 
            currentRankDate: normalizeDate(row[7]),
            echelon: String(row[8] || '').trim(),
            echelonDate: normalizeDate(row[9]),
            status: status,
            lastMark: parseFloat(row[11]) || 10,
            lastInspectionDate: normalizeDate(row[12]),
            tenureDate: '' 
        };
        
        if (teacher.fullName && teacher.fullName.length > 2) {
            teachers.push(teacher);

            // Create Initial Report Data to hold School & Level
            if (rawSchool || normalizedLevel) {
                reports[id] = {
                    ...INITIAL_REPORT_STATE,
                    id: generateId(),
                    teacherId: id,
                    school: rawSchool,
                    level: normalizedLevel,
                    group: '',
                };
            }
        }
    }

    return { teachers, reports };
};

export const generateDatabaseRows = (
    teachers: Teacher[], 
    currentReport?: ReportData,
    reportsMap?: Record<string, ReportData>,
    globalSettings?: InspectorProfile 
): (string | number)[][] => {
    const basicHeaders = [
        'ID', 'الاسم_واللقب', 'تاريخ_الميلاد', 'مكان_الميلاد', 'الشهادة', 'تاريخ_الشهادة',
        'تاريخ_التوظيف', 'الرتبة', 'تاريخ_الرتبة', 'الدرجة', 'تاريخ_الدرجة',
        'تاريخ_آخر_تفتيش', 'النقطة_السابقة', 'الوضعية', 'تاريخ_التثبيت'
    ];

    const reportHeaders = [
        'الولاية', 'المقاطعة', 'المدرسة', 
        'تاريخ_الزيارة', 'المادة', 'الموضوع', 'المدة', 'المستوى', 'الفوج', 
        'عدد_التلاميذ', 'الغائبون', 'نص_التقرير_العام', 'العلامة_النهائية', 'العلامة_بالحروف', 'توجيهات_التقييم'
    ];

    const legacyHeaders = [
        'نوع_التقرير', 
        'اسم_المفتش',
        'الحالة_العائلية', 'معهد_التكوين', 'تاريخ_التخرج_من_المعهد', 'تاريخ_المؤهل_العلمي', 
        'السنة_الدراسية', 'الدائرة', 'البلدية',
        'القاعة_استماع', 'الإضاءة', 'التدفئة', 'التهوية', 'النظافة', 
        'إعداد_الدروس', 'قيمة_الإعداد', 'وسائل_أخرى', 'السبورة_كلاسيكي', 'التوزيع_والمعلقات', 
        'السجلات', 'السجلات_مستعملة', 'السجلات_مراقبة', 
        'البرامج_المقررة', 'التدرج', 'الواجبات',
        'تسلسل_الدروس', 'قيمة_المعلومات', 'تحقق_الأهداف', 'مشاركة_التلاميذ', 
        'التطبيقات', 'ملاءمة_التطبيقات', 
        'العناية_بالدفاتر', 'مراقبة_الدفاتر', 'تصحيح_الواجبات', 'قيمة_التصحيح', 
        'التقدير_العام_الكلاسيكي'
    ];

    const obsHeaders: string[] = [];
    DEFAULT_OBSERVATION_TEMPLATE.forEach(obs => {
        obsHeaders.push(`معيار_${obs.id}_التقييم`); 
        obsHeaders.push(`معيار_${obs.id}_ملاحظات`); 
    });

    const allHeaders = [...basicHeaders, ...reportHeaders, ...legacyHeaders, ...obsHeaders];

    let lastWilaya = globalSettings?.wilaya || '';
    let lastDistrict = globalSettings?.district || '';
    let lastInspector = globalSettings?.fullName || '';
    
    if (currentReport?.wilaya) lastWilaya = currentReport.wilaya;
    if (currentReport?.district) lastDistrict = currentReport.district;
    if (currentReport?.inspectorName) lastInspector = currentReport.inspectorName;

    const rows = teachers.map(t => {
        if(!t) return []; 
        let r: ReportData = { ...INITIAL_REPORT_STATE, teacherId: t.id };
        let hasReport = false;

        if (currentReport && currentReport.teacherId === t.id) {
            r = currentReport;
            hasReport = true;
        } else if (reportsMap && reportsMap[t.id]) {
            r = reportsMap[t.id];
            hasReport = true;
        }

        if (r.wilaya) lastWilaya = r.wilaya;
        if (r.district) lastDistrict = r.district;
        if (r.inspectorName) lastInspector = r.inspectorName;

        const effectiveWilaya = r.wilaya || lastWilaya || globalSettings?.wilaya || '';
        const effectiveDistrict = r.district || lastDistrict || globalSettings?.district || '';
        const effectiveInspector = r.inspectorName || lastInspector || globalSettings?.fullName || '';

        const ld = r.legacyData || INITIAL_REPORT_STATE.legacyData!;

        const basicData = [
            t.id || '', t.fullName || '', t.birthDate || '', t.birthPlace || '', t.degree || '', t.degreeDate || '',
            t.recruitmentDate || '', t.rank || '', t.currentRankDate || '', t.echelon || '', t.echelonDate || '',
            t.lastInspectionDate || '', t.lastMark || '', t.status || '', t.tenureDate || ''
        ];

        // FIXED: Always write the school name if it exists in the report object, even if hasReport is weak.
        // Also used specific 'generalAssessment' instead of potentially conflicting names.
        const reportData = [
            effectiveWilaya,
            effectiveDistrict,
            r.school || '', // Always persist school
            hasReport ? r.inspectionDate : '',
            hasReport ? r.subject : '',
            hasReport ? r.topic : '',
            hasReport ? r.duration : '',
            hasReport ? r.level : '',
            hasReport ? r.group : '',
            hasReport ? r.studentCount : '',
            hasReport ? r.absentCount : '',
            hasReport ? r.generalAssessment : '', 
            hasReport ? r.finalMark : '',
            hasReport ? r.markInLetters : '',
            hasReport ? (r.assessmentKeywords || '') : ''
        ];

        const legacyDataCols = [
            hasReport ? (r.reportModel || 'modern') : 'modern',
            effectiveInspector,
            hasReport ? ld.familyStatus : '',
            hasReport ? ld.trainingInstitute : '',
            hasReport ? ld.trainingDate : '',
            hasReport ? ld.graduationDate : '',
            hasReport ? ld.schoolYear : '',
            hasReport ? ld.daira : '',
            hasReport ? ld.municipality : '',
            hasReport ? ld.classroomListening : '',
            hasReport ? ld.lighting : '',
            hasReport ? ld.heating : '',
            hasReport ? ld.ventilation : '',
            hasReport ? ld.cleanliness : '',
            hasReport ? ld.lessonPreparation : '',
            hasReport ? ld.preparationValue : '',
            hasReport ? ld.otherAids : '',
            hasReport ? ld.boardWork : '', // Legacy board
            hasReport ? ld.documentsAndPosters : '',
            hasReport ? ld.registers : '',
            hasReport ? ld.registersUsed : '',
            hasReport ? ld.registersMonitored : '',
            hasReport ? ld.scheduledPrograms : '',
            hasReport ? ld.progression : '',
            hasReport ? ld.duties : '',
            hasReport ? ld.lessonExecution : '',
            hasReport ? ld.informationValue : '',
            hasReport ? ld.objectivesAchieved : '',
            hasReport ? ld.studentParticipation : '',
            hasReport ? ld.applications : '',
            hasReport ? ld.applicationsSuitability : '',
            hasReport ? ld.notebooksCare : '',
            hasReport ? ld.notebooksMonitored : '',
            hasReport ? ld.homeworkCorrection : '',
            hasReport ? ld.homeworkValue : '',
            hasReport ? ld.generalAppreciation : ''
        ];

        const obsData: (string | number)[] = [];
        DEFAULT_OBSERVATION_TEMPLATE.forEach(tmpl => {
            if (hasReport && r.observations) {
                const found = r.observations.find(o => o.id === tmpl.id);
                const score = (found?.score != null) ? found.score : '';
                const note = found?.improvementNotes || '';
                obsData.push(score);
                obsData.push(note);
            } else {
                obsData.push('');
                obsData.push('');
            }
        });

        return [...basicData, ...reportData, ...legacyDataCols, ...obsData];
    });

    return [allHeaders, ...rows];
};

/**
 * Robust Parsing Function using Header Mapping
 */
export const parseDatabaseRows = (values: any[][]): { teachers: Teacher[], reportsMap: Record<string, ReportData> } => {
    if (!values || values.length < 2) return { teachers: [], reportsMap: {} };

    const headerRow = values[0];
    
    // Create Header Map (Name -> Index)
    const headers: Record<string, number> = {};
    headerRow.forEach((h, idx) => {
        if(typeof h === 'string') {
            headers[h.trim()] = idx;
        }
    });

    // Helper to get value by header name OR default index (fallback)
    const getVal = (row: any[], headerName: string, defaultIdx: number): string => {
        let idx = headers[headerName];
        if (idx === undefined) idx = defaultIdx;
        
        const val = row[idx];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val).trim();
    };

    const teachers: Teacher[] = [];
    const reportsMap: Record<string, ReportData> = {};

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;

        // Skip rows without name
        if (!getVal(row, 'الاسم_واللقب', 1)) continue;

        const id = getVal(row, 'ID', 0) || generateId();
        
        const teacher: Teacher = {
            id: id,
            fullName: getVal(row, 'الاسم_واللقب', 1),
            birthDate: normalizeDate(getVal(row, 'تاريخ_الميلاد', 2)),
            birthPlace: getVal(row, 'مكان_الميلاد', 3),
            degree: getVal(row, 'الشهادة', 4),
            degreeDate: normalizeDate(getVal(row, 'تاريخ_الشهادة', 5)),
            recruitmentDate: normalizeDate(getVal(row, 'تاريخ_التوظيف', 6)),
            rank: getVal(row, 'الرتبة', 7),
            currentRankDate: normalizeDate(getVal(row, 'تاريخ_الرتبة', 8)),
            echelon: getVal(row, 'الدرجة', 9),
            echelonDate: normalizeDate(getVal(row, 'تاريخ_الدرجة', 10)),
            lastInspectionDate: normalizeDate(getVal(row, 'تاريخ_آخر_تفتيش', 11)),
            lastMark: parseFloat(getVal(row, 'النقطة_السابقة', 12)) || 10,
            status: normalizeStatus(getVal(row, 'الوضعية', 13)) as 'titulaire' | 'contractuel' | 'stagiere',
            tenureDate: normalizeDate(getVal(row, 'تاريخ_التثبيت', 14))
        };
        teachers.push(teacher);

        // Always attempt to restore report data (especially School Name) even if not visited
        // FIX: Removed "if (inspectionDate)" check to ensure school name persists
        const reportType = getVal(row, 'نوع_التقرير', 29) || 'modern';
        
        let legacyData: LegacyReportOptions;

        if (reportType === 'legacy') {
            legacyData = {
                familyStatus: getVal(row, 'الحالة_العائلية', 31),
                trainingInstitute: getVal(row, 'معهد_التكوين', 32),
                trainingDate: normalizeDate(getVal(row, 'تاريخ_التخرج_من_المعهد', 33)),
                graduationDate: normalizeDate(getVal(row, 'تاريخ_المؤهل_العلمي', 34)),
                schoolYear: getVal(row, 'السنة_الدراسية', 35),
                daira: getVal(row, 'الدائرة', 36),
                municipality: getVal(row, 'البلدية', 37),
                classroomListening: getVal(row, 'القاعة_استماع', 38),
                lighting: getVal(row, 'الإضاءة', 39),
                heating: getVal(row, 'التدفئة', 40),
                ventilation: getVal(row, 'التهوية', 41),
                cleanliness: getVal(row, 'النظافة', 42),
                lessonPreparation: getVal(row, 'إعداد_الدروس', 43),
                preparationValue: getVal(row, 'قيمة_الإعداد', 44),
                otherAids: getVal(row, 'وسائل_أخرى', 45),
                boardWork: getVal(row, 'السبورة_كلاسيكي', 46), // FIX: Mapped to distinct legacy column
                documentsAndPosters: getVal(row, 'التوزيع_والمعلقات', 47),
                registers: getVal(row, 'السجلات', 48),
                registersUsed: getVal(row, 'السجلات_مستعملة', 49),
                registersMonitored: getVal(row, 'السجلات_مراقبة', 50),
                scheduledPrograms: getVal(row, 'البرامج_المقررة', 51),
                progression: getVal(row, 'التدرج', 52),
                duties: getVal(row, 'الواجبات', 53),
                lessonExecution: getVal(row, 'تسلسل_الدروس', 54),
                informationValue: getVal(row, 'قيمة_المعلومات', 55),
                objectivesAchieved: getVal(row, 'تحقق_الأهداف', 56),
                studentParticipation: getVal(row, 'مشاركة_التلاميذ', 57),
                applications: getVal(row, 'التطبيقات', 58),
                applicationsSuitability: getVal(row, 'ملاءمة_التطبيقات', 59),
                notebooksCare: getVal(row, 'العناية_بالدفاتر', 60),
                notebooksMonitored: getVal(row, 'مراقبة_الدفاتر', 61),
                homeworkCorrection: getVal(row, 'تصحيح_الواجبات', 62),
                homeworkValue: getVal(row, 'قيمة_التصحيح', 63),
                generalAppreciation: getVal(row, 'التقدير_العام_الكلاسيكي', 64)
            };
        } else {
            legacyData = { ...INITIAL_REPORT_STATE.legacyData! };
        }

        const observations = JSON.parse(JSON.stringify(DEFAULT_OBSERVATION_TEMPLATE));
        
        observations.forEach((obs: ObservationItem) => {
            const scoreKey = `معيار_${obs.id}_التقييم`;
            const noteKey = `معيار_${obs.id}_ملاحظات`;
            
            let scoreIdx = headers[scoreKey];
            let noteIdx = headers[noteKey];

            const scoreVal = scoreIdx !== undefined ? row[scoreIdx] : '';
            const noteVal = noteIdx !== undefined ? row[noteIdx] : '';
            
            if (scoreVal === '0' || scoreVal === '1' || scoreVal === '2' || scoreVal === 0 || scoreVal === 1 || scoreVal === 2) {
                obs.score = parseInt(scoreVal) as 0 | 1 | 2;
            } else {
                obs.score = null;
            }
            
            obs.improvementNotes = noteVal || '';
        });

        // SMART RECOVERY LOGIC:
        // Try to read 'نص_التقرير_العام'. If empty/missing, check if 'السبورة' exists and has content (backward compatibility)
        let generalAssessment = getVal(row, 'نص_التقرير_العام', 26);
        if (!generalAssessment || generalAssessment.trim() === '') {
            // Check legacy column name if it exists in the header map
            const legacyBoardIdx = headers['السبورة'];
            if (legacyBoardIdx !== undefined) {
                const legacyVal = row[legacyBoardIdx];
                if (legacyVal) generalAssessment = String(legacyVal).trim();
            }
        }

        reportsMap[id] = {
            id: generateId(), 
            teacherId: id,
            reportModel: reportType === 'legacy' ? 'legacy' : 'modern',
            inspectorName: getVal(row, 'اسم_المفتش', 30),
            wilaya: getVal(row, 'الولاية', 15),
            district: getVal(row, 'المقاطعة', 16),
            school: getVal(row, 'المدرسة', 17), // FIX: School persists now
            inspectionDate: normalizeDate(getVal(row, 'تاريخ_الزيارة', 18)),
            subject: getVal(row, 'المادة', 19),
            topic: getVal(row, 'الموضوع', 20),
            duration: getVal(row, 'المدة', 21),
            level: getVal(row, 'المستوى', 22),
            group: getVal(row, 'الفوج', 23),
            studentCount: parseInt(getVal(row, 'عدد_التلاميذ', 24)) || 0,
            absentCount: parseInt(getVal(row, 'الغائبون', 25)) || 0,
            generalAssessment: generalAssessment, // Updated logic
            finalMark: parseFloat(getVal(row, 'العلامة_النهائية', 27)) || 0,
            markInLetters: getVal(row, 'العلامة_بالحروف', 28),
            assessmentKeywords: getVal(row, 'توجيهات_التقييم', 29),
            observations: observations,
            legacyData: legacyData
        };
    }

    return { teachers, reportsMap };
};

export const generateCSVContent = (
    teachers: Teacher[],
    currentReport?: ReportData,
    reportsMap?: Record<string, ReportData>
): string => {
    const rows = generateDatabaseRows(teachers, currentReport, reportsMap);
    const csv = rows.map(row => 
        row.map(cell => {
            const cellStr = String(cell || '').replace(/"/g, '""');
            return `"${cellStr}"`;
        }).join(',')
    ).join('\n');
    return "\ufeff" + csv;
};

export const parseCSVContent = (csvText: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentCell);
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return parseDatabaseRows(rows);
};

const normalizeStatus = (val: any): string => {
    const s = String(val).trim().toLowerCase();
    if (s.includes('متعاقد') || s.includes('contract')) return 'contractuel';
    if (s.includes('متربص') || s.includes('stag')) return 'stagiere';
    return 'titulaire';
};