
import { AcqStudent, AcquisitionRating } from '../types/acquisitions';

declare const XLSX: any;

// Helper to normalize grades to Arabic letters
const mapArabicGrade = (cell: any): AcquisitionRating => {
    if (cell === null || cell === undefined) return null;
    const str = String(cell).trim(); 
    
    // Safety check: Grades are usually 1 character, rarely 2. 
    // Names are always longer.
    if (str.length > 3) return null; 

    // Strict checks (single chars)
    if (['أ', 'A', 'a'].includes(str)) return 'A';
    if (['ب', 'B', 'b'].includes(str)) return 'B';
    if (['ج', 'C', 'c'].includes(str)) return 'C';
    if (['د', 'D', 'd'].includes(str)) return 'D';
    
    // Fallback: starts with (ONLY if length is very short)
    if (str.length <= 2) {
        if (str.startsWith('أ') || str.toUpperCase().startsWith('A')) return 'A';
        if (str.startsWith('ب') || str.toUpperCase().startsWith('B')) return 'B';
        if (str.startsWith('ج') || str.toUpperCase().startsWith('C')) return 'C';
        if (str.startsWith('د') || str.toUpperCase().startsWith('D')) return 'D';
    }
    
    return null;
};

const cleanName = (name: string): string => {
    if (!name) return '';
    return name.replace(/["']/g, '')
               .replace(/\s+/g, ' ') // Collapse multiple spaces
               .trim();
};

const isSummaryRow = (text: string): boolean => {
    const t = text.toLowerCase();
    return t.includes('مجموع') || t.includes('المجموع') || t.includes('نسبة') || t.includes('معدل') || t.includes('total') || t.includes('moyenne') || t.includes('pourcentage');
};

/**
 * Universal Parser that relies on column count patterns to detect subject/level
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
    // Get ALL rows (header: 1 gives array of arrays)
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length === 0) return [];

    // Brute force scan through every row
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue; // Skip single column rows

        let nameCandidate = '';
        const grades: AcquisitionRating[] = [];
        
        // 1. Try to find the name in the first 5 columns
        let potentialNameIdx = -1;
        
        for (let j = 0; j < Math.min(row.length, 6); j++) {
            const cellVal = String(row[j] || '').trim();
            
            // Skip numbers (IDs, dates)
            if (/^[\d\/\-\.]+$/.test(cellVal)) continue;
            
            // Skip empty or very short junk
            if (cellVal.length < 3) continue;

            // Skip strict grades
            if (mapArabicGrade(cellVal)) continue;

            // Stop if summary
            if (isSummaryRow(cellVal)) {
                nameCandidate = ''; 
                break; 
            }

            // Found a candidate text (Name)
            const nextVal = String(row[j+1] || '').trim();
            const nextIsGrade = !!mapArabicGrade(nextVal);
            const nextIsNumber = /^[\d\/\-\.]+$/.test(nextVal);
            
            if (nextVal.length > 2 && !nextIsGrade && !isSummaryRow(nextVal) && !nextIsNumber) {
                // Merge columns (Nom + Prénom)
                nameCandidate = cleanName(cellVal + ' ' + nextVal);
            } else {
                nameCandidate = cleanName(cellVal);
            }
            
            if (nameCandidate) {
                potentialNameIdx = j;
                break; // Found the name
            }
        }

        // Filter out Headers explicitly
        if (nameCandidate.includes('اللقب') || nameCandidate.includes('الاسم') || nameCandidate.includes('Nom')) continue;
        if (isSummaryRow(nameCandidate)) continue;

        // 2. If we found a potential name, look for grades in the REST of the row
        if (nameCandidate) {
            for (let k = 0; k < row.length; k++) {
                // Look ahead for grades, but respect name position
                if (k <= potentialNameIdx) continue;

                const g = mapArabicGrade(row[k]);
                if (g) grades.push(g);
            }

            // 3. Validation Logic based on Level/Subject & Count
            
            // YEAR 2
            if (level === '2AP') {
                if (subject.includes('العربية')) {
                    // Expecting 8 criteria
                    if (grades.length >= 8) { 
                        students.push({
                            id: Math.random().toString(36).substr(2, 9),
                            fullName: nameCandidate,
                            results: {
                                'reading_performance': { 1: grades[0], 2: grades[1], 3: grades[2] },
                                'written_comprehension': { 1: grades[3], 2: grades[4], 3: grades[5], 4: grades[6], 5: grades[7] }
                            }
                        });
                    }
                } else if (subject.includes('الرياضيات')) {
                    // Expecting 6 criteria
                    if (grades.length >= 6) {
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
            } 
            
            // YEAR 4
            else if (level === '4AP') {
                if (subject.includes('العربية')) {
                    // Expecting 19 criteria (5+4+5+5)
                    if (grades.length >= 19) { 
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
                    }
                } else if (subject.includes('الرياضيات')) {
                    // Expecting 7 criteria (3+4)
                    if (grades.length >= 7) {
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
            }
            
            // YEAR 5
            else if (level === '5AP') {
                if (subject.includes('العربية')) {
                    // Expecting 26 criteria
                    if (grades.length >= 26) { 
                        students.push({
                            id: Math.random().toString(36).substr(2, 9),
                            fullName: nameCandidate,
                            results: {
                                'oral_comms': { 
                                    1: grades[0], 2: grades[1], 3: grades[2], 4: grades[3], 5: grades[4], 6: grades[5] 
                                },
                                'reading_perf': { 
                                    1: grades[6], 2: grades[7], 3: grades[8], 4: grades[9] 
                                },
                                'written_comp': { 
                                    1: grades[10], 2: grades[11], 3: grades[12], 4: grades[13], 5: grades[14], 
                                    6: grades[15], 7: grades[16], 8: grades[17], 9: grades[18]
                                },
                                'written_prod': { 
                                    1: grades[19], 2: grades[20], 3: grades[21], 4: grades[22], 5: grades[23], 
                                    6: grades[24], 7: grades[25]
                                }
                            }
                        });
                    }
                } else if (subject.includes('الرياضيات')) {
                    // Expecting 14 criteria
                    if (grades.length >= 14) {
                        students.push({
                            id: Math.random().toString(36).substr(2, 9),
                            fullName: nameCandidate,
                            results: {
                                'control_numbers': { 1: grades[0], 2: grades[1], 3: grades[2], 4: grades[3] },
                                'geometry_space': { 1: grades[4], 2: grades[5], 3: grades[6] },
                                'measurements': { 1: grades[7], 2: grades[8], 3: grades[9] },
                                'data_org': { 1: grades[10], 2: grades[11], 3: grades[12], 4: grades[13] }
                            }
                        });
                    }
                } else if (subject.includes('إسلامية')) {
                    // Expecting 12 criteria (3+3+3+3)
                    if (grades.length >= 12) {
                        students.push({
                            id: Math.random().toString(36).substr(2, 9),
                            fullName: nameCandidate,
                            results: {
                                'behavior': { 1: grades[0], 2: grades[1], 3: grades[2] },
                                'recitation': { 1: grades[3], 2: grades[4], 3: grades[5] },
                                'understanding': { 1: grades[6], 2: grades[7], 3: grades[8] },
                                'sira': { 1: grades[9], 2: grades[10], 3: grades[11] }
                            }
                        });
                    }
                } else if (subject.includes('تاريخ')) {
                    // Expecting 7 criteria (3+4)
                    if (grades.length >= 7) {
                        students.push({
                            id: Math.random().toString(36).substr(2, 9),
                            fullName: nameCandidate,
                            results: {
                                'general_history': { 1: grades[0], 2: grades[1], 3: grades[2] },
                                'national_history': { 1: grades[3], 2: grades[4], 3: grades[5], 4: grades[6] }
                            }
                        });
                    }
                }
            }
            
            // Fallback (Generic)
            else {
                if (grades.length >= 1) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: { 'generic': { 1: grades[0] || null } } 
                    });
                }
            }
        }
    }

    return students;
};
