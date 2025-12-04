
import React, { useState, useEffect, useRef } from 'react';
import { QuarterlyReportData, Teacher, ReportData, TenureReportData } from '../types';
import { Save, Printer, FileText, Calculator, RotateCw, Calendar, ArrowRight, Wand2, Stamp, MapPin } from 'lucide-react';
import PrintableQuarterlyReport from './PrintableQuarterlyReport';

interface QuarterlyReportEditorProps {
    report: QuarterlyReportData;
    onChange: (report: QuarterlyReportData) => void;
    onPrint: () => void;
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    tenureReportsMap?: Record<string, TenureReportData>;
    signature?: string;
    onUploadSignature?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const QuarterlyReportEditor: React.FC<QuarterlyReportEditorProps> = ({ 
    report, onChange, onPrint, teachers, reportsMap, tenureReportsMap, signature, onUploadSignature
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // --- AUTO CALCULATE SCHOOL YEAR & FETCH GLOBAL SETTINGS ---
    useEffect(() => {
        const updates: Partial<QuarterlyReportData> = {};
        
        // 1. School Year
        if (!report.schoolYear || report.schoolYear.length < 5) {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            updates.schoolYear = month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
        }

        // 2. Auto-fetch Wilaya/District from existing reports if missing
        if (!report.wilaya || !report.district) {
            // Find first report with valid data
            const sourceReport = Object.values(reportsMap).find(r => r.wilaya && r.wilaya.trim() !== '');
            if (sourceReport) {
                if (!report.wilaya) updates.wilaya = sourceReport.wilaya;
                if (!report.district) updates.district = sourceReport.district;
            }
        }

        if (Object.keys(updates).length > 0) {
            onChange({ ...report, ...updates });
        }
    }, [reportsMap]); // Run when reportsMap loads/changes

    // --- HELPER: NORMALIZE SUBJECT ---
    const getSubjectKey = (subjectStr: string): keyof typeof report.subjects | null => {
        const s = subjectStr.trim().toLowerCase();
        if (s.includes('عربية') || s.includes('لغة') || s.includes('قراءة') || s.includes('تعبير') || s.includes('كتابة') || s.includes('إملاء')) return 'arabic';
        if (s.includes('رياضيات') || s.includes('حساب')) return 'math';
        if (s.includes('إسلامية') || s.includes('قرآن')) return 'islamic';
        if (s.includes('تاريخ') || s.includes('جغرافيا')) return 'historyGeo';
        if (s.includes('مدنية')) return 'civics';
        if (s.includes('علمية') || s.includes('تكنولوجية')) return 'science';
        if (s.includes('موسيقية') || s.includes('موسيقى') || s.includes('إنشاد')) return 'music';
        if (s.includes('تشكيلية') || s.includes('رسم') || s.includes('فنية')) return 'art';
        return null;
    };

    // --- CORE CALCULATION LOGIC ---
    const calculateStatistics = () => {
        if (!report.startDate || !report.endDate) {
            alert("يرجى تحديد فترة الحصيلة (من - إلى) أولاً.");
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

        Object.values(reportsMap).forEach(r => {
            if (!r.inspectionDate) return;
            const visitDate = new Date(r.inspectionDate);
            if (visitDate >= start && visitDate <= end) {
                stats.visitsInspection++;
                
                const dayIndex = visitDate.getDay(); 
                if (dayIndex === 0) stats.days.sun++;
                else if (dayIndex === 1) stats.days.mon++;
                else if (dayIndex === 2) stats.days.tue++;
                else if (dayIndex === 3) stats.days.wed++;
                else if (dayIndex === 4) stats.days.thu++;

                const teacher = teachers.find(t => t.id === r.teacherId);
                if (teacher) {
                    const status = teacher.status;
                    const rank = teacher.rank || '';
                    if (status === 'stagiere') stats.ranks.stagiere++;
                    else if (status === 'contractuel') stats.ranks.contract++;
                    else if (rank.includes('مميز')) stats.ranks.distinguished++;
                    else if (rank.includes('ثان')) stats.ranks.class2++;
                    else if (rank.includes('أول')) stats.ranks.class1++;
                    else stats.ranks.primary++; 
                }

                const lvl = r.level || '';
                if (lvl.includes('تحضيري')) stats.levels.prep++;
                else if (lvl.includes('الأولى') || lvl.includes('1')) stats.levels.year1++;
                else if (lvl.includes('الثانية') || lvl.includes('2')) stats.levels.year2++;
                else if (lvl.includes('الثالثة') || lvl.includes('3')) stats.levels.year3++;
                else if (lvl.includes('الرابعة') || lvl.includes('4')) stats.levels.year4++;
                else if (lvl.includes('الخامسة') || lvl.includes('5')) stats.levels.year5++;

                const subjKey = getSubjectKey(r.subject || '');
                if (subjKey) stats.subjects[subjKey]++;
                else stats.subjects.arabic++; 
            }
        });

        if (tenureReportsMap) {
            Object.values(tenureReportsMap).forEach(tr => {
                if (tr.examDate) {
                    const tDate = new Date(tr.examDate);
                    if (tDate >= start && tDate <= end) {
                        stats.visitsTenure++;
                    }
                }
            });
        }
        
        onChange({
            ...report,
            ...stats,
            teachersTotal: teachers.length,
            teachersTrainee: teachers.filter(t => t.status === 'stagiere').length,
        });
    };

    const update = (field: keyof QuarterlyReportData, value: any) => {
        onChange({ ...report, [field]: value });
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            
            {/* 1. CONTROL BAR (TOP) */}
            <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-20">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <RotateCw size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">الحصيلة الفصلية</h2>
                            <p className="text-xs text-slate-500">توليد آلي للإحصائيات بناءً على تقارير الزيارة</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:w-auto bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center">
                        <div className="flex items-center gap-2 px-2 w-full md:w-auto">
                            <Calendar size={16} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">الفترة:</span>
                        </div>
                        <input 
                            type="date" 
                            className="w-full md:w-auto bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={report.startDate}
                            onChange={e => update('startDate', e.target.value)}
                        />
                        <span className="text-slate-300 font-bold">إلى</span>
                        <input 
                            type="date" 
                            className="w-full md:w-auto bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={report.endDate}
                            onChange={e => update('endDate', e.target.value)}
                        />
                        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                        <select 
                            value={report.term} 
                            onChange={e => update('term', e.target.value)}
                            className="w-full md:w-32 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="الأول">الفصل 1</option>
                            <option value="الثاني">الفصل 2</option>
                            <option value="الثالث">الفصل 3</option>
                            <option value="السنوي">السنوي</option>
                        </select>
                        
                        <button 
                            onClick={calculateStatistics}
                            className="w-full md:w-auto bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Wand2 size={16} />
                            حساب الإحصائيات
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {onUploadSignature && (
                            <div className="relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={onUploadSignature} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-2.5 rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
                                    title="رفع صورة الإمضاء/الختم"
                                >
                                    <Stamp size={20} />
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={onPrint}
                            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
                        >
                            <Printer size={18} />
                            طباعة
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT (Split View) */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                
                {/* LEFT: PREVIEW (Dominant) */}
                <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center">
                    <div className="transform scale-90 origin-top shadow-2xl">
                        <PrintableQuarterlyReport report={report} signature={signature} />
                    </div>
                </div>

                {/* RIGHT: MANUAL INPUTS (Sidebar) */}
                <div className="w-full md:w-80 bg-white border-l border-slate-200 overflow-y-auto z-10 shadow-lg">
                    <div className="p-4 border-b bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <FileText size={16}/> بيانات إدارية وتكميلية
                        </h3>
                    </div>
                    
                    <div className="p-4 space-y-6">
                        
                        {/* Administration Info (ADDED) */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase block flex items-center gap-1">
                                <MapPin size={12}/> البيانات الإدارية
                            </label>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">الولاية</label>
                                    <input 
                                        type="text" 
                                        value={report.wilaya} 
                                        onChange={e => update('wilaya', e.target.value)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold placeholder:font-normal"
                                        placeholder="مثلاً: الأغواط"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">المقاطعة</label>
                                    <input 
                                        type="text" 
                                        value={report.district} 
                                        onChange={e => update('district', e.target.value)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold placeholder:font-normal"
                                        placeholder="مثلاً: المقاطعة الثانية"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Manual Stats */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase block">نشاطات التكوين والندوات</label>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">ندوات التكوين (تأطير)</label>
                                    <input 
                                        type="number" 
                                        value={report.visitsTraining} 
                                        onChange={e => update('visitsTraining', parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">الاستفادة من التكوين</label>
                                    <input 
                                        type="number" 
                                        value={report.visitsTrainingBenefit} 
                                        onChange={e => update('visitsTrainingBenefit', parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase block">مهام أخرى</label>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">تأطير الامتحانات/عمليات</label>
                                    <input 
                                        type="number" 
                                        value={report.tasksSupervision} 
                                        onChange={e => update('tasksSupervision', parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">التحقيقات الإدارية</label>
                                    <input 
                                        type="number" 
                                        value={report.tasksInvestigations} 
                                        onChange={e => update('tasksInvestigations', parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase block">تعديل التعداد (عند الحاجة)</label>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1">عدد المعنيين بالتثبيت</label>
                                    <input 
                                        type="number" 
                                        value={report.teachersTenure} 
                                        onChange={e => update('teachersTenure', parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold"
                                    />
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