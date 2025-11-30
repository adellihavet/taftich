import React, { useState } from 'react';
import { QuarterlyReportData, Teacher, ReportData, TenureReportData } from '../types';
import { Save, Printer, FileText, Calculator, RotateCw, Calendar } from 'lucide-react';
import PrintableQuarterlyReport from './PrintableQuarterlyReport';

interface QuarterlyReportEditorProps {
    report: QuarterlyReportData;
    onChange: (report: QuarterlyReportData) => void;
    onPrint: () => void;
    // Props needed for calculations
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    tenureReportsMap?: Record<string, TenureReportData>;
}

const QuarterlyReportEditor: React.FC<QuarterlyReportEditorProps> = ({ report, onChange, onPrint, teachers, reportsMap, tenureReportsMap }) => {
    
    // Generic update handler
    const update = (field: keyof QuarterlyReportData, value: any) => {
        onChange({ ...report, [field]: value });
    };

    // Update nested object (days, ranks, etc)
    const updateNested = (parent: 'days' | 'ranks' | 'levels' | 'subjects', key: string, value: string) => {
        const numVal = parseInt(value) || 0;
        onChange({
            ...report,
            [parent]: {
                ...report[parent],
                [key]: numVal
            }
        });
    };

    const calculateStatistics = () => {
        if (!report.startDate || !report.endDate) {
            alert("يرجى إدخال تاريخ بداية ونهاية الفصل أولاً.");
            return;
        }

        const start = new Date(report.startDate);
        const end = new Date(report.endDate);
        
        // Reset counters
        const stats = {
            visitsInspection: 0,
            visitsTenure: 0,
            days: { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0 },
            ranks: { stagiere: 0, primary: 0, class1: 0, class2: 0, distinguished: 0, contract: 0 },
            levels: { prep: 0, year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
            subjects: { arabic: 0, math: 0, islamic: 0, historyGeo: 0, civics: 0, science: 0, music: 0, art: 0 }
        };

        // 1. Process Inspection Visits (From ReportData)
        Object.values(reportsMap).forEach(r => {
            const visitDate = new Date(r.inspectionDate);
            if (visitDate >= start && visitDate <= end) {
                stats.visitsInspection++;
                
                // Day
                const day = visitDate.getDay();
                if (day === 0) stats.days.sun++;
                else if (day === 1) stats.days.mon++;
                else if (day === 2) stats.days.tue++;
                else if (day === 3) stats.days.wed++;
                else if (day === 4) stats.days.thu++;

                // Rank
                const teacher = teachers.find(t => t.id === r.teacherId);
                if (teacher) {
                    const status = teacher.status;
                    const rank = teacher.rank;
                    if (status === 'stagiere') stats.ranks.stagiere++;
                    else if (status === 'contractuel') stats.ranks.contract++;
                    else if (rank.includes('مميز')) stats.ranks.distinguished++;
                    else if (rank.includes('ثان')) stats.ranks.class2++;
                    else if (rank.includes('أول')) stats.ranks.class1++;
                    else stats.ranks.primary++;
                }

                // Level
                if (r.level.includes('تحضيري')) stats.levels.prep++;
                else if (r.level.includes('الأولى')) stats.levels.year1++;
                else if (r.level.includes('الثانية')) stats.levels.year2++;
                else if (r.level.includes('الثالثة')) stats.levels.year3++;
                else if (r.level.includes('الرابعة')) stats.levels.year4++;
                else if (r.level.includes('الخامسة')) stats.levels.year5++;

                // Subject
                if (r.subject.includes('رياضيات')) stats.subjects.math++;
                else if (r.subject.includes('إسلامية')) stats.subjects.islamic++;
                else if (r.subject.includes('تاريخ')) stats.subjects.historyGeo++;
                else if (r.subject.includes('مدنية')) stats.subjects.civics++;
                else if (r.subject.includes('علمية')) stats.subjects.science++;
                else if (r.subject.includes('موسيقية')) stats.subjects.music++;
                else if (r.subject.includes('تشكيلية') || r.subject.includes('الرسم')) stats.subjects.art++;
                else stats.subjects.arabic; // Default to arabic/language
            }
        });

        // 2. Process Tenure Visits (Strictly for Stagiere)
        teachers.forEach(t => {
            if (t.status === 'stagiere' && t.tenureDate) {
                const tDate = new Date(t.tenureDate);
                if (tDate >= start && tDate <= end) {
                    stats.visitsTenure++;
                }
            }
        });

        // Update Report State
        onChange({
            ...report,
            teachersTotal: teachers.length,
            teachersTrainee: teachers.filter(t => t.status === 'stagiere').length,
            // Manual fields remain untouched: teachersTenure, tasks...
            ...stats
        });
        
        alert("تم تحديث الإحصائيات بنجاح بناءً على تواريخ الزيارات.");
    };

    // Auto Calculations Display
    const totalDays = Object.values(report.days).reduce((a, b) => a + b, 0);
    const totalRanks = Object.values(report.ranks).reduce((a, b) => a + b, 0);
    const totalLevels = Object.values(report.levels).reduce((a, b) => a + b, 0);
    const totalSubjects = Object.values(report.subjects).reduce((a, b) => a + b, 0);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="bg-purple-900 text-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-2">
                    <FileText size={20} />
                    <h2 className="font-bold text-lg">تحرير حصيلة النشاطات الفصلية</h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={onPrint} className="flex items-center gap-2 bg-white text-purple-900 px-4 py-2 rounded-lg hover:bg-gray-100 font-bold shadow-sm transition-all">
                        <Printer size={18} />
                        طباعة
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    
                    {/* Auto-Generation Panel */}
                    <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-2 text-purple-800 font-bold text-lg whitespace-nowrap">
                            <Calendar size={24} />
                            <span>ضبط الحيز الزمني:</span>
                        </div>
                        <div className="flex items-center gap-4 w-full">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-purple-700 mb-1">من تاريخ:</label>
                                <input type="date" value={report.startDate} onChange={e => update('startDate', e.target.value)} className="w-full border border-purple-300 rounded p-2 text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-purple-700 mb-1">إلى تاريخ:</label>
                                <input type="date" value={report.endDate} onChange={e => update('endDate', e.target.value)} className="w-full border border-purple-300 rounded p-2 text-sm" />
                            </div>
                        </div>
                        <button 
                            onClick={calculateStatistics}
                            className="bg-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-transform active:scale-95 flex items-center gap-2 font-bold whitespace-nowrap"
                        >
                            <RotateCw size={18} />
                            جلب الإحصائيات آلياً
                        </button>
                    </div>

                    {/* Preview Section */}
                    <div className="bg-white p-1 rounded-lg shadow-sm border overflow-hidden">
                        <div className="bg-gray-100 p-2 text-center text-xs font-bold text-gray-500 border-b">معاينة التقرير (يتم التحديث تلقائياً)</div>
                        <div className="overflow-auto max-h-[500px] border-b bg-gray-500/10 p-4">
                            <div className="transform scale-75 origin-top-center">
                                <PrintableQuarterlyReport report={report} />
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-purple-800 border-b pb-2 mb-4 flex items-center gap-2">
                             1. المعلومات العامة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">اسم المفتش ولقبه</label>
                                 <input className="w-full border rounded p-2" value={report.inspectorName} onChange={e => update('inspectorName', e.target.value)} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">الرتبة / التخصص</label>
                                 <input className="w-full border rounded p-2" value={report.rank} onChange={e => update('rank', e.target.value)} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">المقاطعة</label>
                                 <input className="w-full border rounded p-2" value={report.district} onChange={e => update('district', e.target.value)} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">الولاية</label>
                                 <input className="w-full border rounded p-2" value={report.wilaya} onChange={e => update('wilaya', e.target.value)} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">الفصل</label>
                                 <select className="w-full border rounded p-2" value={report.term} onChange={e => update('term', e.target.value)}>
                                     <option value="الأول">الأول</option>
                                     <option value="الثاني">الثاني</option>
                                     <option value="الثالث">الثالث</option>
                                     <option value="السنوي">السنوي</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">السنة الدراسية</label>
                                 <input className="w-full border rounded p-2" value={report.schoolYear} onChange={e => update('schoolYear', e.target.value)} />
                             </div>
                        </div>

                        <h3 className="font-bold text-lg text-purple-800 border-b pb-2 mb-4 mt-6 flex items-center gap-2">
                             2. إحصائيات النشاطات (آلي + يدوي)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div className="bg-gray-100 p-2 rounded"><label className="block text-xs text-gray-600 font-bold">اجمالي الأساتذة (آلي)</label><input type="number" className="w-full border rounded p-1 bg-white" value={report.teachersTotal} readOnly /></div>
                            <div className="bg-gray-100 p-2 rounded"><label className="block text-xs text-gray-600 font-bold">المتربصين (آلي)</label><input type="number" className="w-full border rounded p-1 bg-white" value={report.teachersTrainee} readOnly /></div>
                            <div className="border border-purple-200 bg-purple-50 p-2 rounded"><label className="block text-xs text-purple-800 font-bold">المعنيين بالتثبيت (يدوي)</label><input type="number" className="w-full border border-purple-300 rounded p-1" value={report.teachersTenure} onChange={e => update('teachersTenure', parseInt(e.target.value))} /></div>
                            <div className="bg-gray-100 p-2 rounded"><label className="block text-xs text-gray-600 font-bold">زيارات التفتيش (آلي)</label><input type="number" className="w-full border rounded p-1 bg-white" value={report.visitsInspection} readOnly /></div>
                            
                            <div className="bg-gray-100 p-2 rounded"><label className="block text-xs text-gray-600 font-bold">زيارات التثبيت (آلي)</label><input type="number" className="w-full border rounded p-1 bg-white" value={report.visitsTenure} readOnly /></div>
                            <div className="border border-purple-200 bg-purple-50 p-2 rounded"><label className="block text-xs text-purple-800 font-bold">ندوات التكوين (يدوي)</label><input type="number" className="w-full border border-purple-300 rounded p-1" value={report.visitsTraining} onChange={e => update('visitsTraining', parseInt(e.target.value))} /></div>
                            <div className="border border-purple-200 bg-purple-50 p-2 rounded"><label className="block text-xs text-purple-800 font-bold">الاستفادة من التكوين (يدوي)</label><input type="number" className="w-full border border-purple-300 rounded p-1" value={report.visitsTrainingBenefit} onChange={e => update('visitsTrainingBenefit', parseInt(e.target.value))} /></div>
                            
                            <div className="border border-purple-200 bg-purple-50 p-2 rounded"><label className="block text-xs text-purple-800 font-bold">تأطير عمليات (يدوي)</label><input type="number" className="w-full border border-purple-300 rounded p-1" value={report.tasksSupervision} onChange={e => update('tasksSupervision', parseInt(e.target.value))} /></div>
                            <div className="border border-purple-200 bg-purple-50 p-2 rounded"><label className="block text-xs text-purple-800 font-bold">التحقيقات (يدوي)</label><input type="number" className="w-full border border-purple-300 rounded p-1" value={report.tasksInvestigations} onChange={e => update('tasksInvestigations', parseInt(e.target.value))} /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                            {/* Days Table */}
                            <div className="relative">
                                <h4 className="font-bold text-sm text-gray-700 mb-2 flex justify-between">
                                    <span>توزيع الأيام (يُحسب آلياً)</span>
                                    <span className="text-purple-600 text-xs flex items-center gap-1"><Calculator size={12}/> المجموع: {totalDays}</span>
                                </h4>
                                <div className="grid grid-cols-5 gap-2 opacity-80">
                                    <div><label className="text-[10px] block">الأحد</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.days.sun} readOnly /></div>
                                    <div><label className="text-[10px] block">الاثنين</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.days.mon} readOnly /></div>
                                    <div><label className="text-[10px] block">الثلاثاء</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.days.tue} readOnly /></div>
                                    <div><label className="text-[10px] block">الأربعاء</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.days.wed} readOnly /></div>
                                    <div><label className="text-[10px] block">الخميس</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.days.thu} readOnly /></div>
                                </div>
                            </div>

                            {/* Levels Table */}
                            <div className="relative">
                                <h4 className="font-bold text-sm text-gray-700 mb-2 flex justify-between">
                                    <span>توزيع المستويات (يُحسب آلياً)</span>
                                    <span className="text-purple-600 text-xs flex items-center gap-1"><Calculator size={12}/> المجموع: {totalLevels}</span>
                                </h4>
                                <div className="grid grid-cols-6 gap-2 opacity-80">
                                    <div><label className="text-[10px] block">تحضيري</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.levels.prep} readOnly /></div>
                                    <div><label className="text-[10px] block">س 1</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.levels.year1} readOnly /></div>
                                    <div><label className="text-[10px] block">س 2</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.levels.year2} readOnly /></div>
                                    <div><label className="text-[10px] block">س 3</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.levels.year3} readOnly /></div>
                                    <div><label className="text-[10px] block">س 4</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.levels.year4} readOnly /></div>
                                    <div><label className="text-[10px] block">س 5</label><input type="number" className="w-full border rounded p-1 text-center bg-gray-50" value={report.levels.year5} readOnly /></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                            {/* Ranks Table */}
                            <div className="relative">
                                <h4 className="font-bold text-sm text-gray-700 mb-2 flex justify-between">
                                    <span>توزيع الرتب (يُحسب آلياً)</span>
                                    <span className="text-purple-600 text-xs flex items-center gap-1"><Calculator size={12}/> المجموع: {totalRanks}</span>
                                </h4>
                                <div className="space-y-2 opacity-80">
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">متربص</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.ranks.stagiere} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">أستاذ م إ</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.ranks.primary} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">أ قسم أول</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.ranks.class1} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">أ قسم ثان</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.ranks.class2} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">مميز</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.ranks.distinguished} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">متعاقد</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.ranks.contract} readOnly /></div>
                                </div>
                            </div>

                            {/* Subjects Table */}
                            <div className="relative">
                                <h4 className="font-bold text-sm text-gray-700 mb-2 flex justify-between">
                                    <span>توزيع المواد (يُحسب آلياً)</span>
                                    <span className="text-purple-600 text-xs flex items-center gap-1"><Calculator size={12}/> المجموع: {totalSubjects}</span>
                                </h4>
                                <div className="space-y-2 opacity-80">
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">لغة عربية</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.subjects.arabic} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">رياضيات</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.subjects.math} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">ت إسلامية</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.subjects.islamic} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">تاريخ وجغرافيا</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.subjects.historyGeo} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">ت مدنية</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.subjects.civics} readOnly /></div>
                                    <div className="flex gap-2 items-center"><label className="text-xs w-24">ت علمية</label><input type="number" className="flex-1 border rounded p-1 bg-gray-50" value={report.subjects.science} readOnly /></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuarterlyReportEditor;