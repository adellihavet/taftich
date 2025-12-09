
import { AcqStudent, AcquisitionRating, AcqGlobalStudent } from '../types/acquisitions';

declare const XLSX: any;

// Helper to normalize grades to Arabic letters
const mapArabicGrade = (cell: any): AcquisitionRating => {
    if (cell === null || cell === undefined) return null;
    const str = String(cell).trim(); 
    
    // Safety check
    if (str.length > 5) return null; 

    // Arabic chars
    if (['أ', 'ا'].includes(str)) return 'A';
    if (['ب'].includes(str)) return 'B';
    if (['ج'].includes(str)) return 'C';
    if (['د'].includes(str)) return 'D';
    
    // Latin chars (just in case)
    if (str.toUpperCase() === 'A') return 'A';
    if (str.toUpperCase() === 'B') return 'B';
    if (str.toUpperCase() === 'C') return 'C';
    if (str.toUpperCase() === 'D') return 'D';
    
    return null;
};

const cleanName = (name: string): string => {
    if (!name) return '';
    return name.replace(/["']/g, '')
               .replace(/\s+/g, ' ')
               .trim();
};

// دالة لتنظيف النص وتوحيد الحروف العربية للمقارنة المرنة
const normalizeText = (text: string): string => {
    if (!text) return '';
    return String(text)
        .trim()
        .replace(/[أإآ]/g, 'ا') // توحيد الألف
        .replace(/ى/g, 'ي')     // توحيد الياء
        .replace(/ة/g, 'ه')     // توحيد التاء المربوطة
        .replace(/ـ/g, '')      // إزالة الكشيدة (التطويل)
        .replace(/\s+/g, ' ');  // توحيد المسافات
};

const isSummaryRow = (text: string): boolean => {
    if (!text) return false;
    const t = String(text).toLowerCase();
    return t.includes('مجموع') || t.includes('المجموع') || t.includes('نسبة') || t.includes('معدل') || t.includes('total') || t.includes('general');
};

/**
 * Universal Parser for Detailed Grids (Subject specific)
 */
export const parseAcqExcel = (data: ArrayBuffer, level: string, subject: string): AcqStudent[] => {
    if (typeof XLSX === 'undefined') {
        console.error("SheetJS not loaded.");
        return [];
    }

    const students: AcqStudent[] = [];
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length === 0) return [];

    // Brute force scan through every row
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue; 

        let nameCandidate = '';
        const grades: AcquisitionRating[] = [];
        
        let potentialNameIdx = -1;
        
        for (let j = 0; j < Math.min(row.length, 6); j++) {
            const cellVal = String(row[j] || '').trim();
            if (/^[\d\/\-\.]+$/.test(cellVal)) continue;
            if (cellVal.length < 3) continue;
            if (mapArabicGrade(cellVal)) continue;
            if (isSummaryRow(cellVal)) { nameCandidate = ''; break; }

            const nextVal = String(row[j+1] || '').trim();
            const nextIsGrade = !!mapArabicGrade(nextVal);
            
            if (nextVal.length > 2 && !nextIsGrade && !isSummaryRow(nextVal) && !/^[\d\/\-\.]+$/.test(nextVal)) {
                nameCandidate = cleanName(cellVal + ' ' + nextVal);
            } else {
                nameCandidate = cleanName(cellVal);
            }
            
            if (nameCandidate) {
                potentialNameIdx = j;
                break;
            }
        }

        if (nameCandidate.includes('اللقب') || nameCandidate.includes('الاسم') || isSummaryRow(nameCandidate)) continue;

        if (nameCandidate) {
            for (let k = 0; k < row.length; k++) {
                if (k <= potentialNameIdx) continue;
                const g = mapArabicGrade(row[k]);
                if (g) grades.push(g);
            }

            // --- MAPPING LOGIC (Existing logic for Year 2, 4, 5) ---
             // YEAR 2
             if (level === '2AP') {
                if (subject.includes('العربية') && grades.length >= 8) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'reading_performance': { 1: grades[0], 2: grades[1], 3: grades[2] },
                            'written_comprehension': { 1: grades[3], 2: grades[4], 3: grades[5], 4: grades[6], 5: grades[7] }
                        }
                    });
                } else if (subject.includes('الرياضيات') && grades.length >= 6) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'control_numbers': { 1: grades[0], 2: grades[1] },
                            'problem_solving': { 1: grades[2], 2: grades[3], 3: grades[4], 4: grades[5] }
                        }
                    });
                }
            } 
            // YEAR 4
            else if (level === '4AP') {
                if (subject.includes('العربية') && grades.length >= 19) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'oral_comms': { 1: grades[0], 2: grades[1], 3: grades[2], 4: grades[3], 5: grades[4] },
                            'reading_perf': { 1: grades[5], 2: grades[6], 3: grades[7], 4: grades[8] },
                            'written_comp': { 1: grades[9], 2: grades[10], 3: grades[11], 4: grades[12], 5: grades[13] },
                            'written_prod': { 1: grades[14], 2: grades[15], 3: grades[16], 4: grades[17], 5: grades[18] }
                        }
                    });
                } else if (subject.includes('الرياضيات') && grades.length >= 7) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'control_resources': { 1: grades[0], 2: grades[1], 3: grades[2] },
                            'methodological_solving': { 1: grades[3], 2: grades[4], 3: grades[5], 4: grades[6] }
                        }
                    });
                }
            }
            // YEAR 5
            else if (level === '5AP') {
                if (subject.includes('العربية') && grades.length >= 26) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'oral_comms': { 1: grades[0], 2: grades[1], 3: grades[2], 4: grades[3], 5: grades[4], 6: grades[5] },
                            'reading_perf': { 1: grades[6], 2: grades[7], 3: grades[8], 4: grades[9] },
                            'written_comp': { 1: grades[10], 2: grades[11], 3: grades[12], 4: grades[13], 5: grades[14], 6: grades[15], 7: grades[16], 8: grades[17], 9: grades[18] },
                            'written_prod': { 1: grades[19], 2: grades[20], 3: grades[21], 4: grades[22], 5: grades[23], 6: grades[24], 7: grades[25] }
                        }
                    });
                }
            }
        }
    }
    return students;
};

/**
 * PARSER FOR GLOBAL GRID (الشبكة الإجمالية)
 */
export const parseGlobalAcqExcel = (data: ArrayBuffer): { students: AcqGlobalStudent[], detectedColumns: string[] } => {
    if (typeof XLSX === 'undefined') return { students: [], detectedColumns: [] };

    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length === 0) return { students: [], detectedColumns: [] };

    // 1. Identify Columns (Header Mapping)
    let headerRowIndex = -1;
    const colMap: Record<string, number> = {};
    const detectedColumns: string[] = [];

    // KEYWORDS MAP: Maps a "Fuzzy Root" to the "Official Label"
    // Order matters! More specific terms first.
    const SUBJECT_KEYWORDS: Record<string, string> = {
        'بيولوج': 'البعد البيولوجي', // Specific Scientific dimension
        'تكنولوج': 'البعد التكنولوجي', // Specific Scientific dimension
        'مازيغ': 'اللغة الأمازيغية', // Amazigh
        'عربي': 'اللغة العربية',
        'فرنسي': 'اللغة الفرنسية',
        'انجليز': 'اللغة الإنجليزية',
        'رياضيات': 'الرياضيات',
        'اسلامي': 'التربية الإسلامية',
        // 'علمي': 'التربية العلمية', // Fallback, usually covered by bio/tech
        'مدني': 'التربية المدنية',
        'تاريخ': 'التاريخ',
        'جغرافي': 'الجغرافيا',
        'بدني': 'التربية البدنية',
        'فني': 'التربية الفنية',
        'تشكيل': 'التربية الفنية'
    };

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (!row) continue;
        
        let matchCount = 0;
        row.forEach((cell: any, colIdx: number) => {
            const cellStr = normalizeText(String(cell)); // Normalize the header cell
            
            // Check against keywords
            for (const [keyword, officialLabel] of Object.entries(SUBJECT_KEYWORDS)) {
                if (cellStr.includes(keyword)) {
                    // Check if we already have this official label mapped (e.g. duplicating)
                    if (!colMap[officialLabel]) {
                        colMap[officialLabel] = colIdx;
                        detectedColumns.push(officialLabel);
                        matchCount++;
                    }
                    break; // Stop checking other keywords if matched
                }
            }
        });

        if (matchCount >= 3) { // Found a row with at least 3 recognizable subjects
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error("لم يتم العثور على صف العناوين. تأكد أن الملف يحتوي على أسماء المواد (عربية، رياضيات...).");
    }

    const students: AcqGlobalStudent[] = [];

    // 2. Parse Data Rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const rawNum = String(row[0]).trim();
        
        // Skip explicitly summary rows
        if (isSummaryRow(rawNum) || isSummaryRow(String(row[1] || ''))) continue;

        const studentData: AcqGlobalStudent = {
            id: Math.random().toString(36).substr(2, 9) + '_' + i, 
            number: parseInt(rawNum) || 0,
            subjects: {}
        };

        let gradeCount = 0;

        Object.entries(colMap).forEach(([subjectName, colIdx]) => {
            const rawGrade = row[colIdx];
            const grade = mapArabicGrade(rawGrade);
            if (grade) {
                studentData.subjects[subjectName] = grade;
                gradeCount++;
            }
        });

        // Strict Check: Row must have at least 3 valid grades to be considered a student
        if (gradeCount >= 3) {
            students.push(studentData);
        }
    }

    return { students, detectedColumns };
};
