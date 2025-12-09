
import React, { useMemo, useState } from 'react';
import { AcqClassRecord, AcqFilterState } from '../../types/acquisitions';
import { BarChart2, PieChart, FileText } from 'lucide-react';
import AcqYear2ArabicStats from './Analytics/AcqYear2ArabicStats';
import AcqYear2MathStats from './Analytics/AcqYear2MathStats';
import AcqYear4ArabicStats from './Analytics/AcqYear4ArabicStats';
import AcqYear4MathStats from './Analytics/AcqYear4MathStats';
import AcqYear5ArabicStats from './Analytics/AcqYear5ArabicStats';
import AcqYear5MathStats from './Analytics/AcqYear5MathStats';
import AcqYear5IslamicStats from './Analytics/AcqYear5IslamicStats';
import AcqYear5HistoryStats from './Analytics/AcqYear5HistoryStats';
import AcqYear5CivicsStats from './Analytics/AcqYear5CivicsStats';
import AcqTeacherProfile from './Analytics/AcqTeacherProfile';

interface AcqStatsDashboardProps {
    records: AcqClassRecord[];
    availableSchools: string[];
    filters: AcqFilterState; 
}

const AcqStatsDashboard: React.FC<AcqStatsDashboardProps> = ({ records, filters }) => {
    const { scope, selectedSchool, selectedLevel, selectedClass, selectedSubject } = filters;

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (selectedLevel && r.level !== selectedLevel) return false;
            if (selectedSubject && r.subject !== selectedSubject) return false;
            
            if (scope === 'district') return true; 
            if (scope === 'school' || scope === 'class') {
                if (r.schoolName !== selectedSchool) return false;
            }
            if (scope === 'class') {
                if (r.className !== selectedClass) return false;
            }
            return true;
        });
    }, [records, scope, selectedSchool, selectedLevel, selectedClass, selectedSubject]);

    const classSiblingRecords = useMemo(() => {
        if (scope !== 'class' || !selectedSchool || !selectedClass || !selectedLevel) return [];
        return records.filter(r => 
            r.schoolName === selectedSchool && 
            r.className === selectedClass && 
            r.level === selectedLevel
        );
    }, [records, scope, selectedSchool, selectedClass, selectedLevel]);

    const isReadyToAnalyze = useMemo(() => {
        if (!selectedLevel || !selectedSubject) return false;
        if (scope === 'school' && !selectedSchool) return false;
        if (scope === 'class' && (!selectedSchool || !selectedClass)) return false;
        return true;
    }, [scope, selectedSchool, selectedLevel, selectedClass, selectedSubject]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            
            <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm shrink-0">
                <div className="text-sm text-slate-500">
                    <span className="font-bold text-slate-700">النطاق الحالي:</span> {scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} / ${selectedClass}`}
                </div>
                {/* Button removed as requested */}
            </div>

            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                {isReadyToAnalyze ? (
                    <div className="max-w-[1600px] mx-auto animate-in zoom-in-95 duration-500">
                        
                        {scope === 'class' && (
                            <AcqTeacherProfile 
                                records={classSiblingRecords}
                                className={selectedClass}
                                schoolName={selectedSchool}
                            />
                        )}

                        {selectedLevel === '2AP' && selectedSubject.includes('العربية') ? (
                            <AcqYear2ArabicStats 
                                records={filteredRecords} 
                                scope={scope} 
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '2AP' && selectedSubject.includes('الرياضيات') ? (
                            <AcqYear2MathStats
                                records={filteredRecords}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '4AP' && selectedSubject.includes('العربية') ? (
                            <AcqYear4ArabicStats
                                records={filteredRecords}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '4AP' && selectedSubject.includes('الرياضيات') ? (
                            <AcqYear4MathStats
                                records={filteredRecords}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '5AP' && selectedSubject.includes('العربية') ? (
                            <AcqYear5ArabicStats
                                records={filteredRecords}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '5AP' && selectedSubject.includes('الرياضيات') ? (
                            <AcqYear5MathStats
                                records={filteredRecords}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '5AP' && selectedSubject.includes('إسلامية') ? (
                            <AcqYear5IslamicStats
                                records={filteredRecords}
                                allRecords={records}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '5AP' && selectedSubject.includes('تاريخ') ? (
                            <AcqYear5HistoryStats
                                records={filteredRecords}
                                allRecords={records}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : selectedLevel === '5AP' && selectedSubject.includes('مدنية') ? (
                            <AcqYear5CivicsStats
                                records={filteredRecords}
                                scope={scope}
                                contextName={scope === 'district' ? 'المقاطعة' : scope === 'school' ? selectedSchool : `${selectedSchool} - ${selectedClass}`}
                            />
                        ) : (
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                                <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold font-serif mb-1">
                                            {`تحليل نتائج: ${selectedSubject}`}
                                        </h2>
                                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">{selectedLevel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
                                    <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                                        <BarChart2 size={48} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 mb-2">قيد التطوير</h3>
                                    <p className="text-slate-500">
                                        النموذج التحليلي الخاص بـ <b>{selectedSubject} - {selectedLevel}</b> قيد الإنجاز.
                                        <br/>
                                        حالياً، النظام يدعم التحليل التفصيلي لـ:
                                        <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
                                            <li>اللغة العربية (السنة الثانية)</li>
                                            <li>الرياضيات (السنة الثانية)</li>
                                            <li>اللغة العربية (السنة الرابعة)</li>
                                            <li>الرياضيات (السنة الرابعة)</li>
                                            <li>اللغة العربية (السنة الخامسة)</li>
                                            <li>الرياضيات (السنة الخامسة)</li>
                                            <li>التربية الإسلامية (السنة الخامسة)</li>
                                            <li>التاريخ (السنة الخامسة)</li>
                                            <li>التربية المدنية (السنة الخامسة)</li>
                                        </ul>
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
                        <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mb-6 opacity-50 animate-pulse">
                            <PieChart size={64} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">بانتظار تحديد معايير التحليل</h3>
                        <p className="text-slate-400 max-w-sm text-center mb-6">
                            يرجى استخدام <b>القائمة العلوية</b> لاختيار النطاق، المدرسة، والمادة لعرض التحليل الدقيق.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcqStatsDashboard;
