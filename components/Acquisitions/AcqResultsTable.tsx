
import React, { useMemo } from 'react';
import { AcqClassRecord, AcqGlobalRecord, AcqGlobalStudent } from '../../types/acquisitions';
import { YEAR2_ARABIC_DEF } from '../../constants/acqYear2Arabic';
import { YEAR2_MATH_DEF } from '../../constants/acqYear2Math';
import { YEAR4_ARABIC_DEF } from '../../constants/acqYear4Arabic';
import { YEAR4_MATH_DEF } from '../../constants/acqYear4Math';
import { YEAR5_ARABIC_DEF } from '../../constants/acqYear5Arabic';
import { YEAR5_MATH_DEF } from '../../constants/acqYear5Math';
import { YEAR5_ISLAMIC_DEF } from '../../constants/acqYear5Islamic';
import { YEAR5_HISTORY_DEF } from '../../constants/acqYear5History';
import { YEAR5_CIVICS_DEF } from '../../constants/acqYear5Civics';
import { AlertCircle, FileSpreadsheet, User, Grid } from 'lucide-react';

interface Props {
    mode?: 'detailed' | 'global';
    records?: AcqClassRecord[];
    globalRecords?: AcqGlobalRecord[];
    level?: string;
    subject?: string;
}

const AcqResultsTable: React.FC<Props> = ({ mode = 'detailed', records = [], globalRecords = [], level, subject }) => {

    // --- DETAILED VIEW LOGIC ---
    
    // 1. Determine Definition
    const definition = useMemo(() => {
        if (!level || !subject) return null;

        if (level === '2AP') {
            if (subject.includes('العربية')) return YEAR2_ARABIC_DEF;
            if (subject.includes('رياضيات')) return YEAR2_MATH_DEF;
        }
        if (level === '4AP') {
            if (subject.includes('العربية')) return YEAR4_ARABIC_DEF;
            if (subject.includes('رياضيات')) return YEAR4_MATH_DEF;
        }
        if (level === '5AP') {
            if (subject.includes('العربية')) return YEAR5_ARABIC_DEF;
            if (subject.includes('رياضيات')) return YEAR5_MATH_DEF;
            if (subject.includes('إسلامية')) return YEAR5_ISLAMIC_DEF;
            if (subject.includes('تاريخ')) return YEAR5_HISTORY_DEF;
            if (subject.includes('مدنية')) return YEAR5_CIVICS_DEF;
        }
        return null;
    }, [level, subject]);

    // 2. Flatten Students for Detailed
    const allDetailedStudents = useMemo(() => {
        return records.flatMap(r => r.students.map(s => ({
            ...s,
            className: r.className,
            schoolName: r.schoolName
        }))).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [records]);

    // --- GLOBAL VIEW LOGIC ---

    const allGlobalStudents = useMemo(() => {
        if (!globalRecords) return [];
        // Flatten all global records
        // IMPORTANT: We use the internal unique ID to distinguish rows, but we sort/display based on the original number
        return globalRecords.flatMap(r => r.students.map(s => ({
            ...s,
            schoolName: r.schoolName
        }))).sort((a, b) => {
            // Sort by School first, then by Original Number
            if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
            return a.number - b.number; 
        }); 
    }, [globalRecords]);

    // Get unique subjects from ALL students (to ensure Amazigh shows up even if first student doesn't have it)
    const globalSubjects = useMemo(() => {
        if (allGlobalStudents.length === 0) return [];
        const subjectSet = new Set<string>();
        allGlobalStudents.forEach(s => {
            Object.keys(s.subjects).forEach(k => subjectSet.add(k));
        });
        
        // Sort subjects to make sense (Arabic first, etc.)
        const ordered = Array.from(subjectSet).sort((a, b) => {
            const priority = (s: string) => {
                if (s.includes('عربية')) return 1;
                if (s.includes('أمازيغية') || s.includes('امازيغية')) return 2;
                if (s.includes('رياضيات')) return 3;
                if (s.includes('فرنسية')) return 4;
                return 10;
            };
            return priority(a) - priority(b);
        });

        return ordered;
    }, [allGlobalStudents]);


    // Helper for cell styling
    const getCellClass = (grade: string | null | undefined) => {
        switch (grade) {
            case 'A': return 'bg-emerald-100 text-emerald-800 font-bold';
            case 'B': return 'bg-blue-100 text-blue-800 font-bold';
            case 'C': return 'bg-orange-100 text-orange-800 font-bold';
            case 'D': return 'bg-red-100 text-red-800 font-bold';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    // Helper for Arabic Display
    const displayGrade = (grade: string | null | undefined) => {
        if (!grade) return '-';
        const map: Record<string, string> = { 'A': 'أ', 'B': 'ب', 'C': 'ج', 'D': 'د' };
        return map[grade] || grade;
    };

    // --- RENDER: DETAILED VIEW ---
    if (mode === 'detailed') {
        if (!level || !subject) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
                    <FileSpreadsheet size={64} className="mb-4 opacity-20" />
                    <p>يرجى اختيار المستوى والمادة من القائمة العلوية لعرض الجدول التفصيلي.</p>
                </div>
            );
        }

        if (!definition) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
                    <AlertCircle size={64} className="mb-4 opacity-20 text-amber-500" />
                    <p>عذراً، جدول هذه المادة ({subject} - {level}) غير متوفر للعرض التفصيلي حالياً.</p>
                </div>
            );
        }

        if (allDetailedStudents.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
                    <p>لا توجد بيانات تفصيلية محفوظة لهذه المادة في الفلاتر المختارة.</p>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <FileSpreadsheet size={20} className="text-teal-600"/>
                            شبكة التقييم التفصيلية
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            عرض النتائج وفق المعايير الرسمية لـ: <span className="font-bold text-teal-700">{definition.label}</span>
                        </p>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">أ: تحكم أقصى</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">ب: تحكم مقبول</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">ج: تحكم جزئي</span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">د: تحكم محدود</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <table className="w-full text-sm text-right border-collapse min-w-max">
                        <thead className="bg-slate-800 text-white sticky top-0 z-20 shadow-md">
                            <tr>
                                <th rowSpan={2} className="p-3 border-l border-slate-600 w-12 text-center bg-slate-900 sticky right-0 z-30">#</th>
                                <th rowSpan={2} className="p-3 border-l border-slate-600 min-w-[200px] text-right bg-slate-900 sticky right-12 z-30">
                                    اللقب والاسم
                                    <span className="block text-[10px] font-normal text-slate-400 mt-1">المدرسة / الفوج</span>
                                </th>
                                {definition.competencies.map(comp => (
                                    <th 
                                        key={comp.id} 
                                        colSpan={comp.criteria.length} 
                                        className="p-2 text-center border-l border-b border-slate-600 text-xs font-bold bg-slate-800"
                                    >
                                        {comp.label}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {definition.competencies.map(comp => (
                                    comp.criteria.map(crit => (
                                        <th 
                                            key={`${comp.id}-${crit.id}`}
                                            className="p-2 text-center border-l border-slate-600 w-12 bg-slate-700 hover:bg-slate-600 transition-colors group cursor-help relative"
                                        >
                                            {crit.id}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-normal leading-relaxed">
                                                {crit.label}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                            </div>
                                        </th>
                                    ))
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allDetailedStudents.map((student, idx) => (
                                <tr key={`${student.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2 text-center border-l border-slate-100 text-slate-400 font-mono text-xs sticky right-0 bg-white z-10">{idx + 1}</td>
                                    <td className="p-2 border-l border-slate-100 sticky right-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        <div className="font-bold text-slate-800">{student.fullName}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <User size={10}/> {student.schoolName} - {student.className}
                                        </div>
                                    </td>
                                    {definition.competencies.map(comp => (
                                        comp.criteria.map(crit => {
                                            const grade = student.results?.[comp.id]?.[crit.id];
                                            return (
                                                <td 
                                                    key={`${student.id}-${comp.id}-${crit.id}`}
                                                    className={`p-2 text-center border-l border-slate-100 text-xs font-serif ${getCellClass(grade)}`}
                                                >
                                                    {displayGrade(grade)}
                                                </td>
                                            );
                                        })
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- RENDER: GLOBAL VIEW ---
    if (mode === 'global') {
        if (allGlobalStudents.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
                    <Grid size={64} className="mb-4 opacity-20" />
                    <p>لا توجد بيانات شبكة إجمالية محفوظة للمدرسة المختارة.</p>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <div className="p-4 border-b bg-indigo-50 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                            <Grid size={20} className="text-indigo-600"/>
                            الشبكة التحليلية الإجمالية
                        </h2>
                        <p className="text-xs text-indigo-700 mt-1">
                             عرض شامل لتقديرات المواد لكل تلميذ (العدد الإجمالي: {allGlobalStudents.length})
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <table className="w-full text-sm text-right border-collapse min-w-max">
                        <thead className="bg-slate-900 text-white sticky top-0 z-20 shadow-md">
                            <tr>
                                <th className="p-3 border-l border-slate-700 w-16 text-center sticky right-0 bg-slate-900 z-30">الرقم</th>
                                {globalSubjects.map(subj => (
                                    <th key={subj} className="p-3 border-l border-slate-700 text-center font-bold text-xs whitespace-nowrap">
                                        {subj}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allGlobalStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-center border-l border-slate-100 font-mono text-slate-500 font-bold sticky right-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {student.number}
                                    </td>
                                    {globalSubjects.map(subj => {
                                        const grade = student.subjects[subj];
                                        return (
                                            <td key={subj} className={`p-2 text-center border-l border-slate-100 font-bold font-serif ${getCellClass(grade)}`}>
                                                {displayGrade(grade)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return null;
};

export default AcqResultsTable;