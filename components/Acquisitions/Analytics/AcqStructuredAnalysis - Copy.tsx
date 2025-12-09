import React, { useMemo } from 'react';
import { AcqGlobalRecord, AcqFilterState, AcqGlobalStudent } from '../../../types/acquisitions';
import { FileText, Target, Users, BarChart3, School, Map, BookOpen, Calculator } from 'lucide-react';

interface Props {
    globalRecords: AcqGlobalRecord[];
    filters: AcqFilterState;
}

const AcqStructuredAnalysis: React.FC<Props> = ({ globalRecords, filters }) => {
    
    // --- 1. FILTER DATA & BUILD STUDENT LIST WITH CONFIG ---
    // We attach the 'includeAmazigh' flag to every student based on their school record
    const processedStudents = useMemo(() => {
        let students: (AcqGlobalStudent & { includeAmazigh: boolean })[] = [];
        
        globalRecords.forEach(record => {
            if (filters.scope === 'district' || record.schoolName === filters.selectedSchool) {
                // Map students and attach the school's configuration
                const schoolStudents = record.students.map(s => ({
                    ...s,
                    includeAmazigh: record.includeAmazigh // Critical: Use the flag saved in DB for this school
                }));
                students = [...students, ...schoolStudents];
            }
        });
        
        return students;
    }, [globalRecords, filters]);

    const totalStudents = processedStudents.length;

    // --- 2. CALCULATE INDICATORS (PER STUDENT LOGIC) ---
    const stats = useMemo(() => {
        if (totalStudents === 0) return { general: 0, eliteCount: 0, successCount: 0, qualitative: 0, relative: 0, avgSubjects: 0 };

        let totalSubjectCount = 0; // Cumulative count of all subjects studied by all students
        let eliteCount = 0;
        let successCount = 0;

        processedStudents.forEach(student => {
            // Determine active subjects for THIS student
            const studentSubjects = Object.keys(student.subjects).filter(subj => {
                if (subj.includes('الأمازيغية') || subj.includes('امازيغية')) {
                    return student.includeAmazigh; // Only include if school flag is TRUE
                }
                return true; // All other subjects are always included
            });

            // General Satisfaction Accumulator
            totalSubjectCount += studentSubjects.length;

            // Qualitative (All A)
            // Must have grades for all active subjects AND all must be A
            const isElite = studentSubjects.length > 0 && studentSubjects.every(subj => student.subjects[subj] === 'A');
            if (isElite) eliteCount++;

            // Relative (No C or D) => (Only A or B)
            const isSuccess = studentSubjects.length > 0 && studentSubjects.every(subj => {
                const g = student.subjects[subj];
                return g === 'A' || g === 'B';
            });
            if (isSuccess) successCount++;
        });

        return {
            general: totalSubjectCount, // Total Volume of Competencies
            eliteCount: eliteCount,
            successCount: successCount,
            qualitative: (eliteCount / totalStudents) * 100,
            relative: (successCount / totalStudents) * 100,
            // Average subjects per student (for display context only)
            avgSubjects: Math.round(totalSubjectCount / totalStudents)
        };

    }, [processedStudents, totalStudents]);


    if (totalStudents === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>لا توجد بيانات شبكة إجمالية متوفرة للنطاق المختار.</p>
                <p className="text-xs mt-2">يرجى التأكد من رفع الشبكات الإجمالية للمدارس.</p>
            </div>
        );
    }

    return (
        <div className="h-full p-6 overflow-y-auto bg-slate-50/50 animate-in fade-in">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-serif flex items-center gap-2">
                        <Target className="text-indigo-600" />
                        المرحلة الأولى: تحليل المؤشرات
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        تحليل الرضا الاجتماعي والنجاعة البيداغوجية بناءً على النتائج الشاملة.
                    </p>
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Users size={14}/> {totalStudents} تلميذ</span>
                    <span className="h-4 w-px bg-slate-300"></span>
                    <span className="flex items-center gap-1"><BookOpen size={14}/> {stats.avgSubjects} مواد (المتوسط)</span>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. General Social Satisfaction */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-bold">كمي</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">الرضا الاجتماعي العام</h3>
                    <p className="text-xs text-slate-400 mb-6">حجم الكفاءات المحققة (شامل)</p>
                    
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-bold text-slate-800 font-mono">{stats.general.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 mb-1 font-bold">كفاءة</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mb-1">
                            <Calculator size={10}/> معادلة الحساب:
                        </div>
                        <p className="text-xs text-slate-700 font-mono dir-ltr text-right">
                             {totalStudents} (تلميذ) × {stats.avgSubjects} (مواد)
                        </p>
                    </div>
                </div>

                {/* 2. Qualitative Satisfaction */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <Target size={24} />
                        </div>
                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-bold">نوعي</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">الرضا الاجتماعي النوعي</h3>
                    <p className="text-xs text-slate-400 mb-6">نسبة النخبة (تحكم أقصى "أ" في كل المواد)</p>
                    
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-bold text-emerald-600 font-mono">{stats.qualitative.toFixed(2)}%</span>
                    </div>

                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 mb-1">
                            <Calculator size={10}/> معادلة الحساب:
                        </div>
                        <p className="text-xs text-slate-700 font-mono dir-ltr text-right">
                            ({stats.eliteCount} "أ" فقط × 100) ÷ {totalStudents}
                        </p>
                    </div>
                </div>

                {/* 3. Relative Efficiency */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <BarChart3 size={24} />
                        </div>
                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-bold">نسبي</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">النجاعة البيداغوجية النسبية</h3>
                    <p className="text-xs text-slate-400 mb-6">نسبة التحكم المقبول (دون أي "ج" أو "د")</p>
                    
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-bold text-amber-600 font-mono">{stats.relative.toFixed(2)}%</span>
                    </div>
                    
                    <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 mb-1">
                            <Calculator size={10}/> معادلة الحساب:
                        </div>
                        <p className="text-xs text-slate-700 font-mono dir-ltr text-right">
                            ({stats.successCount} "أ+ب" × 100) ÷ {totalStudents}
                        </p>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <School size={14} />
                    <span>نطاق التحليل: <strong>{filters.scope === 'district' ? 'المقاطعة' : filters.scope === 'school' ? filters.selectedSchool : 'فوج'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <Map size={14} />
                    <span>المصدر: <strong>الشبكة التحليلية الإجمالية</strong></span>
                </div>
            </div>
        </div>
    );
};

export default AcqStructuredAnalysis;