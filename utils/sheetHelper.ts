
import { Teacher, ReportData, ObservationItem, LegacyReportOptions } from '../types';
import { DEFAULT_OBSERVATION_TEMPLATE, INITIAL_REPORT_STATE } from '../constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Helper to convert various date formats to standard YYYY-MM-DD for HTML5 inputs
 */
const normalizeDate = (val: any): string => {
    if (!val) return '';
    const str = String(val).trim();
    
    // 1. Handle Excel Serial Numbers (e.g. 44562) which Google Sheets sometimes returns for dates
    if (/^\d+$/.test(str) && Number(str) > 20000) { 
        // 25569 is the offset between Excel (1900) and JS (1970) epochs
        const date = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }

    // 2. Handle DD/MM/YYYY (Common in Arab/French regions)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
        const [d, m, y] = str.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    
    // 3. Handle YYYY/MM/DD
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
         return str.replace(/\//g, '-');
    }

    // 4. Return as is (Assumes YYYY-MM-DD)
    return str;
};

/**
 * Helper to map Arabic or various status text to internal codes
 */
const normalizeStatus = (val: any): 'titulaire' | 'contractuel' | 'stagiere' => {
    const s = String(val).trim().toLowerCase();
    if (s.includes('متعاقد') || s.includes('contract')) return 'contractuel';
    if (s.includes('متربص') || s.includes('stag')) return 'stagiere';
    // Default to titulaire (مرسم) if unclear or matches 'titulaire'/'مرسم'
    return 'titulaire';
};

/**
 * Generates a 2D array (Rows x Columns) representing the database.
 * This format is directly accepted by the Google Sheets API.
 */
export const generateDatabaseRows = (
    teachers: Teacher[], 
    currentReport?: ReportData,
    reportsMap?: Record<string, ReportData>
): (string | number)[][] => {
    // 1. Build Headers
    // Existing Headers (Indices 0-14) including New Tenure Date
    const basicHeaders = [
        'ID', 'الاسم_واللقب', 'تاريخ_الميلاد', 'مكان_الميلاد', 'الشهادة', 'تاريخ_الشهادة',
        'تاريخ_التوظيف', 'الرتبة', 'تاريخ_الرتبة', 'الدرجة', 'تاريخ_الدرجة',
        'تاريخ_آخر_تفتيش', 'النقطة_السابقة', 'الوضعية', 'تاريخ_التثبيت'
    ];

    // Report Headers (Indices 15-29)
    const reportHeaders = [
        'الولاية', 'المقاطعة', 'المدرسة', 
        'تاريخ_الزيارة', 'المادة', 'الموضوع', 'المدة', 'المستوى', 'الفوج', 
        'عدد_التلاميذ', 'الغائبون', 'السبورة', 'العلامة_النهائية', 'العلامة_بالحروف', 'توجيهات_التقييم'
    ];

    // Legacy & Meta Headers (Indices 30-65)
    const legacyHeaders = [
        'نوع_التقرير', // Index 30
        'اسم_المفتش',  // Index 31
        'الحالة_العائلية', 'معهد_التكوين', 'تاريخ_التخرج_من_المعهد', 'تاريخ_المؤهل_العلمي', // Personal extras
        'السنة_الدراسية', 'الدائرة', 'البلدية', // Admin extras
        'القاعة_استماع', 'الإضاءة', 'التدفئة', 'التهوية', 'النظافة', // Environment
        'إعداد_الدروس', 'قيمة_الإعداد', 'وسائل_أخرى', 'السبورة', 'التوزيع_والمعلقات', // Prep
        'السجلات', 'السجلات_مستعملة', 'السجلات_مراقبة', // Registers
        
        // New Fields matching the document strict structure
        'البرامج_المقررة', 'التدرج', 'الواجبات',

        'تسلسل_الدروس', 'قيمة_المعلومات', 'تحقق_الأهداف', 'مشاركة_التلاميذ', // Execution
        'التطبيقات', 'ملاءمة_التطبيقات', // Apps
        'العناية_بالدفاتر', 'مراقبة_الدفاتر', 'تصحيح_الواجبات', 'قيمة_التصحيح', // Notebooks
        'التقدير_العام_الكلاسيكي' // Index 65
    ];

    // Dynamic Observation Headers (Indices 66+)
    const obsHeaders: string[] = [];
    DEFAULT_OBSERVATION_TEMPLATE.forEach(obs => {
        obsHeaders.push(`معيار_${obs.id}_التقييم`); // Score
        obsHeaders.push(`معيار_${obs.id}_ملاحظات`); // Note
    });

    const allHeaders = [...basicHeaders, ...reportHeaders, ...legacyHeaders, ...obsHeaders];

    // 2. Build Rows
    const rows = teachers.map(t => {
        // Determine which report data to use for this teacher
        let r: ReportData = INITIAL_REPORT_STATE;
        let hasReport = false;

        if (currentReport && currentReport.teacherId === t.id) {
            // Priority: The one currently being edited in the UI
            r = currentReport;
            hasReport = true;
        } else if (reportsMap && reportsMap[t.id]) {
            // Secondary: The one stored in the local Map
            r = reportsMap[t.id];
            hasReport = true;
        }

        // Ensure legacyData object exists even if empty
        const ld = r.legacyData || INITIAL_REPORT_STATE.legacyData!;

        const basicData = [
            t.id, t.fullName, t.birthDate, t.birthPlace, t.degree, t.degreeDate || '',
            t.recruitmentDate, t.rank, t.currentRankDate || '', t.echelon || '', t.echelonDate || '',
            t.lastInspectionDate, t.lastMark, t.status, t.tenureDate || '' // Added tenureDate at index 14
        ];

        const reportData = [
            hasReport ? r.wilaya : '',
            hasReport ? r.district : '',
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
            
            // New Fields
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
            if (hasReport) {
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
 * Parses the 2D array from Google Sheets back into App Data.
 */
export const parseDatabaseRows = (values: any[][]): { teachers: Teacher[], reportsMap: Record<string, ReportData> } => {
    if (!values || values.length < 2) return { teachers: [], reportsMap: {} };

    // Row 0 is headers, start from 1
    const headerRow = values[0];
    
    // Check if this sheet has the new 'tenureDate' column (check header 14 or 15)
    // Old format: Index 14 was 'الولاية'
    // New format: Index 14 is 'تاريخ_التثبيت'
    const isLatestSchema = headerRow[14] && String(headerRow[14]).includes('تثبيت');
    
    // Offset for reading report data
    const offset = isLatestSchema ? 1 : 0;

    const isNewFormat = headerRow[29 + offset] && (String(headerRow[29 + offset]).includes('نوع_التقرير') || String(headerRow[29 + offset]).includes('Legacy'));
    const isLatestLegacyFormat = isNewFormat && (String(headerRow[51 + offset]).includes('البرامج') || String(headerRow[51 + offset]).includes('scheduled'));

    const teachers: Teacher[] = [];
    const reportsMap: Record<string, ReportData> = {};

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;

        // Helper to safely get value at index
        const getVal = (idx: number): string => {
            const val = row[idx];
            if (val === undefined || val === null) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val).trim();
        };

        // Basic Validation
        if (!getVal(1)) continue; // No name

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
            status: normalizeStatus(getVal(13)),
            tenureDate: isLatestSchema ? normalizeDate(getVal(14)) : '' // Read new field
        };
        teachers.push(teacher);

        // Reconstruct Report Data
        // Adjusted indices based on offset
        const hasReportData = getVal(14 + offset) || getVal(18 + offset); 

        if (hasReportData) { 
            
            let legacyData: LegacyReportOptions;
            let obsStartIndex = 65 + offset; // Default for Latest

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
                // Previous logic for mid-version (rare case now but safe to keep logic similar)
                // Simplified fallback:
                legacyData = { ...INITIAL_REPORT_STATE.legacyData! };
                obsStartIndex = 62 + offset;
            } else {
                legacyData = { ...INITIAL_REPORT_STATE.legacyData! }; 
                obsStartIndex = 29; // Very old format didn't have tenureDate so offset is 0 here anyway
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

/**
 * Generates the full CSV content with BOM for Excel Arabic support
 */
export const generateCSVContent = (
    teachers: Teacher[],
    currentReport?: ReportData,
    reportsMap?: Record<string, ReportData>
): string => {
    const rows = generateDatabaseRows(teachers, currentReport, reportsMap);
    
    // Convert to CSV
    const csv = rows.map(row => 
        row.map(cell => {
            const cellStr = String(cell || '').replace(/"/g, '""');
            // Force text mode by quoting
            return `"${cellStr}"`;
        }).join(',')
    ).join('\n');

    // Add BOM for Excel Arabic support
    return "\ufeff" + csv;
};

/**
 * Parses a CSV string into database rows
 */
export const parseCSVContent = (csvText: string) => {
    // Basic CSV parser that handles quoted strings
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
                i++; // Skip escaped quote
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
    // Push last cell/row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return parseDatabaseRows(rows);
};
