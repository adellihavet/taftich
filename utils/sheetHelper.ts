
import { Teacher, ReportData, ObservationItem, LegacyReportOptions } from '../types';
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

    // Try DD/MM/YYYY
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

// --- SMART NORMALIZATION FUNCTIONS ---

const normalizeRank = (input: string): string => {
    if (!input) return "أستاذ التعليم الابتدائي";
    const text = input.trim().toLowerCase(); // Normalize input

    // 1. أستاذ مميز
    if (text.includes("مميز") || text.includes("متميز")) {
        return "أستاذ مميز في التعليم الابتدائي";
    }
    
    // 2. أستاذ مكون
    if (text.includes("مكون")) {
        return "أستاذ مكون في التعليم الابتدائي";
    }

    // 3. قسم ثان (ق2, 2, ثان)
    if (text.includes("ثان") || text.includes("ثاني") || text.includes("ق2") || text.includes("قسم 2") || /\b2\b/.test(text)) {
        return "أستاذ التعليم الابتدائي قسم ثان";
    }

    // 4. قسم أول (ق1, 1, أول)
    if (text.includes("أول") || text.includes("اول") || text.includes("ق1") || text.includes("قسم 1") || /\b1\b/.test(text)) {
        return "أستاذ التعليم الابتدائي قسم أول";
    }

    // Default
    return "أستاذ التعليم الابتدائي";
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
    wb.Workbook = { Views: [{ RTL: true }] };

    // --- 3. CREATE DATA SHEET (HIDDEN) FIRST ---
    const wsData = XLSX.utils.aoa_to_sheet(dataSheetRows);
    XLSX.utils.book_append_sheet(wb, wsData, "Lists");

    // --- 4. CREATE MAIN SHEET ---
    const headers = [
        "اللقب والاسم",       // A
        "تاريخ الميلاد",      // B
        "مكان الميلاد",       // C
        "الشهادة",            // D
        "تاريخ الشهادة",      // E
        "تاريخ التوظيف",      // F
        "الرتبة",             // G
        "تاريخ التعيين في الرتبة", // H
        "الدرجة (رقم)",       // I (Force Text)
        "تاريخ الدرجة",       // J
        "الوضعية",            // K
        "آخر نقطة تفتيش",     // L (Force Text)
        "تاريخ آخر تفتيش",    // M
        "المدرسة الحالية",    // N
        "المستوى المسند"      // O
    ];

    const wsMain = XLSX.utils.aoa_to_sheet([headers]);

    // RTL View
    if(!wsMain['!views']) wsMain['!views'] = [];
    wsMain['!views'].push({ rightToLeft: true });

    // Column Widths
    wsMain['!cols'] = [
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
    ];

    // Data Validation
    const rangeLimit = 200; 

    wsMain['!dataValidation'] = [
        // Removed Dropdown for Degree to allow flexible typing -> Normalized later
        // { sqref: `D2:D${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$B$2:$B$${degrees.length + 1}`, showDropDown: true },
        // Removed Dropdown for Rank to allow free typing -> Normalized later
        // { sqref: `G2:G${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$A$2:$A$${ranks.length + 1}`, showDropDown: true },
        { sqref: `I2:I${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$D$2:$D$${echelons.length + 1}`, showDropDown: true },
        { sqref: `K2:K${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$C$2:$C$${status.length + 1}`, showDropDown: true },
        { sqref: `O2:O${rangeLimit}`, type: 'list', operator: 'equal', formula1: `'Lists'!$E$2:$E$${levels.length + 1}`, showDropDown: true }
    ];

    // Format Date Columns as Text to prevent Excel auto-formatting issues
    const dateCols = [1, 4, 5, 7, 9, 12]; 
    for(let R = 1; R < rangeLimit; ++R) {
        // Date Columns
        dateCols.forEach(C => {
            const cellRef = XLSX.utils.encode_cell({c: C, r: R});
            if(!wsMain[cellRef]) wsMain[cellRef] = { t: 's', v: '' }; 
        });

        // CRITICAL FIX: Force Echelon (Col I -> 8) and Mark (Col L -> 11) to be TEXT ('s')
        // This prevents "10" becoming a date.
        const echelonRef = XLSX.utils.encode_cell({c: 8, r: R});
        if(!wsMain[echelonRef]) wsMain[echelonRef] = { t: 's', v: '' };

        const markRef = XLSX.utils.encode_cell({c: 11, r: R});
        if(!wsMain[markRef]) wsMain[markRef] = { t: 's', v: '' };
    }

    XLSX.utils.book_append_sheet(wb, wsMain, "معلومات_الأساتذة");

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

// Modified to return BOTH Teachers and Reports (to capture School/Class)
export const parseSchoolExcel = (data: ArrayBuffer): { teachers: Teacher[], reports: Record<string, ReportData> } => {
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Stable Logic: Look for "معلومات_الأساتذة", if not found, take the SECOND sheet (index 1) because Index 0 is "Lists"
    let targetSheetName = "معلومات_الأساتذة";
    if (!workbook.SheetNames.includes(targetSheetName)) {
        if (workbook.SheetNames.length > 1) {
            targetSheetName = workbook.SheetNames[1]; // Assume Index 1 is data, Index 0 is lists
        } else {
            targetSheetName = workbook.SheetNames[0]; // Fallback
        }
    }

    const worksheet = workbook.Sheets[targetSheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }); 
    
    if (!rows || rows.length < 2) return { teachers: [], reports: {} };

    const teachers: Teacher[] = [];
    const reports: Record<string, ReportData> = {};

    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[0]) continue;

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
            fullName: String(row[0]).trim(),
            birthDate: normalizeDate(row[1]),
            birthPlace: String(row[2] || '').trim(),
            degree: normalizedDegree, // Use Normalized
            degreeDate: normalizeDate(row[4]),
            recruitmentDate: normalizeDate(row[5]),
            rank: normalizedRank, // Use Normalized
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
                    // If level exists, we can infer Group or leave empty
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
    reportsMap?: Record<string, ReportData>
): (string | number)[][] => {
    const basicHeaders = [
        'ID', 'الاسم_واللقب', 'تاريخ_الميلاد', 'مكان_الميلاد', 'الشهادة', 'تاريخ_الشهادة',
        'تاريخ_التوظيف', 'الرتبة', 'تاريخ_الرتبة', 'الدرجة', 'تاريخ_الدرجة',
        'تاريخ_آخر_تفتيش', 'النقطة_السابقة', 'الوضعية', 'تاريخ_التثبيت'
    ];

    const reportHeaders = [
        'الولاية', 'المقاطعة', 'المدرسة', 
        'تاريخ_الزيارة', 'المادة', 'الموضوع', 'المدة', 'المستوى', 'الفوج', 
        'عدد_التلاميذ', 'الغائبون', 'السبورة', 'العلامة_النهائية', 'العلامة_بالحروف', 'توجيهات_التقييم'
    ];

    const legacyHeaders = [
        'نوع_التقرير', 
        'اسم_المفتش',
        'الحالة_العائلية', 'معهد_التكوين', 'تاريخ_التخرج_من_المعهد', 'تاريخ_المؤهل_العلمي', 
        'السنة_الدراسية', 'الدائرة', 'البلدية',
        'القاعة_استماع', 'الإضاءة', 'التدفئة', 'التهوية', 'النظافة', 
        'إعداد_الدروس', 'قيمة_الإعداد', 'وسائل_أخرى', 'السبورة', 'التوزيع_والمعلقات', 
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

    // Variables to hold the "Last Known Good Value" for fill-down logic
    let lastWilaya = '';
    let lastDistrict = '';
    
    // First pass to find any global values if they exist
    if (currentReport?.wilaya) lastWilaya = currentReport.wilaya;
    if (currentReport?.district) lastDistrict = currentReport.district;

    const rows = teachers.map(t => {
        if(!t) return []; 
        let r: ReportData = INITIAL_REPORT_STATE;
        let hasReport = false;

        if (currentReport && currentReport.teacherId === t.id) {
            r = currentReport;
            hasReport = true;
        } else if (reportsMap && reportsMap[t.id]) {
            r = reportsMap[t.id];
            hasReport = true;
        }

        // Fill Down Logic: Update tracking variables if current row has data
        if (r.wilaya) lastWilaya = r.wilaya;
        if (r.district) lastDistrict = r.district;

        // Use tracked variables if current row is empty
        const effectiveWilaya = r.wilaya || lastWilaya;
        const effectiveDistrict = r.district || lastDistrict;

        const ld = r.legacyData || INITIAL_REPORT_STATE.legacyData!;

        const basicData = [
            t.id || '', t.fullName || '', t.birthDate || '', t.birthPlace || '', t.degree || '', t.degreeDate || '',
            t.recruitmentDate || '', t.rank || '', t.currentRankDate || '', t.echelon || '', t.echelonDate || '',
            t.lastInspectionDate || '', t.lastMark || '', t.status || '', t.tenureDate || ''
        ];

        const reportData = [
            effectiveWilaya,
            effectiveDistrict,
            hasReport ? r.school : '',
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
            hasReport ? (r.inspectorName || '') : '',
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
            hasReport ? ld.boardWork : '',
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

export const parseDatabaseRows = (values: any[][]): { teachers: Teacher[], reportsMap: Record<string, ReportData> } => {
    if (!values || values.length < 2) return { teachers: [], reportsMap: {} };

    const headerRow = values[0];
    const isLatestSchema = headerRow[14] && String(headerRow[14]).includes('تثبيت');
    const offset = isLatestSchema ? 1 : 0;
    const isNewFormat = headerRow[29 + offset] && (String(headerRow[29 + offset]).includes('نوع_التقرير') || String(headerRow[29 + offset]).includes('Legacy'));
    const isLatestLegacyFormat = isNewFormat && (String(headerRow[51 + offset]).includes('البرامج') || String(headerRow[51 + offset]).includes('scheduled'));

    const teachers: Teacher[] = [];
    const reportsMap: Record<string, ReportData> = {};

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;

        const getVal = (idx: number): string => {
            const val = row[idx];
            if (val === undefined || val === null) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val).trim();
        };

        if (!getVal(1)) continue;

        const id = getVal(0) || generateId();
        
        const teacher: Teacher = {
            id: id,
            fullName: getVal(1),
            birthDate: normalizeDate(getVal(2)),
            birthPlace: getVal(3),
            degree: getVal(4),
            degreeDate: normalizeDate(getVal(5)),
            recruitmentDate: normalizeDate(getVal(6)),
            rank: getVal(7),
            currentRankDate: normalizeDate(getVal(8)),
            echelon: getVal(9),
            echelonDate: normalizeDate(getVal(10)),
            lastInspectionDate: normalizeDate(getVal(11)),
            lastMark: parseFloat(getVal(12)) || 10,
            status: normalizeStatus(getVal(13)) as 'titulaire' | 'contractuel' | 'stagiere',
            tenureDate: isLatestSchema ? normalizeDate(getVal(14)) : ''
        };
        teachers.push(teacher);

        const hasReportData = getVal(14 + offset) || getVal(18 + offset); 

        if (hasReportData) { 
            let legacyData: LegacyReportOptions;
            let obsStartIndex = 65 + offset;

            if (isLatestLegacyFormat) {
                legacyData = {
                    familyStatus: getVal(31 + offset),
                    trainingInstitute: getVal(32 + offset),
                    trainingDate: normalizeDate(getVal(33 + offset)),
                    graduationDate: normalizeDate(getVal(34 + offset)),
                    schoolYear: getVal(35 + offset),
                    daira: getVal(36 + offset),
                    municipality: getVal(37 + offset),
                    classroomListening: getVal(38 + offset),
                    lighting: getVal(39 + offset),
                    heating: getVal(40 + offset),
                    ventilation: getVal(41 + offset),
                    cleanliness: getVal(42 + offset),
                    lessonPreparation: getVal(43 + offset),
                    preparationValue: getVal(44 + offset),
                    otherAids: getVal(45 + offset),
                    boardWork: getVal(46 + offset),
                    documentsAndPosters: getVal(47 + offset),
                    registers: getVal(48 + offset),
                    registersUsed: getVal(49 + offset),
                    registersMonitored: getVal(50 + offset),
                    scheduledPrograms: getVal(51 + offset),
                    progression: getVal(52 + offset),
                    duties: getVal(53 + offset),
                    lessonExecution: getVal(54 + offset),
                    informationValue: getVal(55 + offset),
                    objectivesAchieved: getVal(56 + offset),
                    studentParticipation: getVal(57 + offset),
                    applications: getVal(58 + offset),
                    applicationsSuitability: getVal(59 + offset),
                    notebooksCare: getVal(60 + offset),
                    notebooksMonitored: getVal(61 + offset),
                    homeworkCorrection: getVal(62 + offset),
                    homeworkValue: getVal(63 + offset),
                    generalAppreciation: getVal(64 + offset)
                };
                obsStartIndex = 65 + offset;
            } else if (isNewFormat) {
                legacyData = { ...INITIAL_REPORT_STATE.legacyData! };
                obsStartIndex = 62 + offset;
            } else {
                legacyData = { ...INITIAL_REPORT_STATE.legacyData! }; 
                obsStartIndex = 29;
            }

            const observations = JSON.parse(JSON.stringify(DEFAULT_OBSERVATION_TEMPLATE));
            
            let obsIndex = obsStartIndex; 
            observations.forEach((obs: ObservationItem) => {
                const scoreVal = getVal(obsIndex);
                const noteVal = getVal(obsIndex + 1);
                
                if (scoreVal === '0' || scoreVal === '1' || scoreVal === '2') {
                    obs.score = parseInt(scoreVal) as 0 | 1 | 2;
                } else {
                    obs.score = null;
                }
                
                obs.improvementNotes = noteVal || '';
                obsIndex += 2;
            });

            reportsMap[id] = {
                id: generateId(), 
                teacherId: id,
                reportModel: isNewFormat ? (getVal(29 + offset) === 'legacy' ? 'legacy' : 'modern') : 'modern',
                inspectorName: isNewFormat ? getVal(30 + offset) : '',
                wilaya: getVal(14 + offset),
                district: getVal(15 + offset),
                school: getVal(16 + offset),
                inspectionDate: normalizeDate(getVal(17 + offset)),
                subject: getVal(18 + offset),
                topic: getVal(19 + offset),
                duration: getVal(20 + offset),
                level: getVal(21 + offset),
                group: getVal(22 + offset),
                studentCount: parseInt(getVal(23 + offset)) || 0,
                absentCount: parseInt(getVal(24 + offset)) || 0,
                generalAssessment: getVal(25 + offset),
                finalMark: parseFloat(getVal(26 + offset)) || 0,
                markInLetters: getVal(27 + offset),
                assessmentKeywords: getVal(28 + offset),
                observations: observations,
                legacyData: legacyData
            };
        }
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
