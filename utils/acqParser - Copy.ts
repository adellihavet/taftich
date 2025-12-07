
import { AcqStudent, AcquisitionRating } from '../types/acquisitions';

declare const XLSX: any;

// Helper to normalize grades to Arabic letters
// FIXED: Strictly check length to avoid confusing names starting with 'ب' or 'د' as grades
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
 * Universal Parser that doesn't rely on headers.
 * It hunts for rows that look "Student Data".
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
        // Logic: Find the longest text string that IS NOT a grade and IS NOT a summary keyword
        let potentialNameIdx = -1;
        
        for (let j = 0; j < Math.min(row.length, 6); j++) {
            const cellVal = String(row[j] || '').trim();
            
            // Skip numbers (IDs, dates)
            if (/^[\d\/\-\.]+$/.test(cellVal)) continue;
            
            // Skip empty or very short junk
            if (cellVal.length < 3) continue;

            // Skip strict grades (The fix in mapArabicGrade handles the name collision)
            if (mapArabicGrade(cellVal)) continue;

            // Stop if summary
            if (isSummaryRow(cellVal)) {
                nameCandidate = ''; 
                break; 
            }

            // Found a candidate text (Name)
            // Check if next column is also text (Last + First split)
            // Sometimes names are split: [Last Name] [First Name]
            const nextVal = String(row[j+1] || '').trim();
            const nextIsGrade = !!mapArabicGrade(nextVal);
            const nextIsNumber = /^[\d\/\-\.]+$/.test(nextVal);
            
            if (nextVal.length > 2 && !nextIsGrade && !isSummaryRow(nextVal) && !nextIsNumber) {
                // Merge columns
                nameCandidate = cleanName(cellVal + ' ' + nextVal);
            } else {
                nameCandidate = cleanName(cellVal);
            }
            
            if (nameCandidate) {
                potentialNameIdx = j;
                break; // Found the name, stop looking for name in this row
            }
        }

        // Filter out Headers explicitly
        if (nameCandidate.includes('اللقب') || nameCandidate.includes('الاسم') || nameCandidate.includes('Nom')) continue;
        if (isSummaryRow(nameCandidate)) continue;

        // 2. If we found a potential name, look for grades in the REST of the row
        if (nameCandidate) {
            for (let k = 0; k < row.length; k++) {
                // Don't read the name cells as grades. 
                // Skip columns close to where we found the name to avoid reading parts of name as grade 
                // (though mapArabicGrade length check > 3 prevents most of this now)
                if (k <= potentialNameIdx + 1) continue;

                const g = mapArabicGrade(row[k]);
                if (g) grades.push(g);
            }

            // 3. Validation Logic based on Level/Subject
            
            // Case A: 2AP Arabic (8 Criteria expected)
            if (level === '2AP' && subject.includes('العربية')) {
                if (grades.length >= 4) { // Allow partial
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'reading_performance': {
                                1: grades[0] || null,
                                2: grades[1] || null,
                                3: grades[2] || null
                            },
                            'written_comprehension': {
                                1: grades[3] || null,
                                2: grades[4] || null,
                                3: grades[5] || null,
                                4: grades[6] || null,
                                5: grades[7] || null
                            }
                        }
                    });
                }
            } 
            // Case B: 2AP Math (6 Criteria expected)
            else if (level === '2AP' && subject.includes('الرياضيات')) {
                if (grades.length >= 3) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'control_numbers': {
                                1: grades[0] || null,
                                2: grades[1] || null
                            },
                            'problem_solving': {
                                1: grades[2] || null,
                                2: grades[3] || null,
                                3: grades[4] || null,
                                4: grades[5] || null
                            }
                        }
                    });
                }
            }
            // Case C: 4AP Arabic (19 Criteria expected)
            else if (level === '4AP' && subject.includes('العربية')) {
                if (grades.length >= 10) { 
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'oral_comms': {
                                1: grades[0] || null, 2: grades[1] || null, 3: grades[2] || null, 4: grades[3] || null, 5: grades[4] || null
                            },
                            'reading_perf': {
                                1: grades[5] || null, 2: grades[6] || null, 3: grades[7] || null, 4: grades[8] || null
                            },
                            'written_comp': {
                                1: grades[9] || null, 2: grades[10] || null, 3: grades[11] || null, 4: grades[12] || null, 5: grades[13] || null
                            },
                            'written_prod': {
                                1: grades[14] || null, 2: grades[15] || null, 3: grades[16] || null, 4: grades[17] || null, 5: grades[18] || null
                            }
                        }
                    });
                }
            }
            // Case D: 4AP Math (7 Criteria expected)
            else if (level === '4AP' && subject.includes('الرياضيات')) {
                if (grades.length >= 4) {
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'control_resources': {
                                1: grades[0] || null,
                                2: grades[1] || null,
                                3: grades[2] || null
                            },
                            'methodological_solving': {
                                1: grades[3] || null,
                                2: grades[4] || null,
                                3: grades[5] || null,
                                4: grades[6] || null
                            }
                        }
                    });
                }
            }
            // Case E: 5AP Arabic (26 Criteria expected)
            else if (level === '5AP' && subject.includes('العربية')) {
                if (grades.length >= 15) { // Threshold to accept row
                    students.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fullName: nameCandidate,
                        results: {
                            'oral_comms': {
                                1: grades[0] || null, 2: grades[1] || null, 3: grades[2] || null, 4: grades[3] || null, 5: grades[4] || null, 6: grades[5] || null
                            },
                            'reading_perf': {
                                1: grades[6] || null, 2: grades[7] || null, 3: grades[8] || null, 4: grades[9] || null
                            },
                            'written_comp': {
                                1: grades[10] || null, 2: grades[11] || null, 3: grades[12] || null, 4: grades[13] || null, 
                                5: grades[14] || null, 6: grades[15] || null, 7: grades[16] || null, 8: grades[17] || null, 9: grades[18] || null
                            },
                            'written_prod': {
                                1: grades[19] || null, 2: grades[20] || null, 3: grades[21] || null, 4: grades[22] || null, 
                                5: grades[23] || null, 6: grades[24] || null, 7: grades[25] || null
                            }
                        }
                    });
                }
            }
            // Fallback
            else {
                if (grades.length >= 2) {
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
