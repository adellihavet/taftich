
import React, { useState, useEffect, useRef } from 'react';
import { QuarterlyReportData, Teacher, ReportData, TenureReportData } from '../types';
import { Printer, RotateCw, Calendar, RefreshCw, Stamp, Settings2, Loader2 } from 'lucide-react';
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
    inspectorName: string;
    globalWilaya: string;
    globalDistrict: string;
}

const QuarterlyReportEditor: React.FC<QuarterlyReportEditorProps> = ({ 
    report, onChange, onPrint, teachers, reportsMap, tenureReportsMap, signature, onUploadSignature,
    inspectorName, globalWilaya, globalDistrict
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showManualStats, setShowManualStats] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    
    // --- AUTOMATION EFFECT ---
    useEffect(() => {
        const updates: Partial<QuarterlyReportData> = {};
        let needsUpdate = false;

        if (inspectorName && report.inspectorName !== inspectorName) {
            updates.inspectorName = inspectorName;
            needsUpdate = true;
        }
        if (globalWilaya && report.wilaya !== globalWilaya) {
            updates.wilaya = globalWilaya;
            needsUpdate = true;
        }
        if (globalDistrict && report.district !== globalDistrict) {
            updates.district = globalDistrict;
            needsUpdate = true;
        }
        if (!report.schoolYear || report.schoolYear.length < 5) {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            if (month >= 9) {
                updates.schoolYear = `${year}/${year + 1}`;
            } else {
                updates.schoolYear = `${year - 1}/${year}`;
            }
            needsUpdate = true;
        }

        if (needsUpdate) {
            onChange({ ...report, ...updates });
        }
    }, [inspectorName, globalWilaya, globalDistrict]);

    const getSubjectKey = (subjectStr: string): keyof typeof report.subjects | null => {
        const s = subjectStr.trim().toLowerCase();
        if (s.includes('تاريخ')) return 'history';
        if (s.includes('جغرافيا')) return 'geo';
        if (s.includes('مدنية')) return 'civics';
        if (s.includes('إسلامية') || s.includes('قرآن')) return 'islamic';
        if (s.includes('علمية') || s.includes('تكنولوجية')) return 'science';
        if (s.includes('رياضيات') || s.includes('حساب')) return 'math';
        if (s.includes('عربية') || s.includes('لغة') || s.includes('قراءة') || s.includes('تعبير')) return 'arabic';
        if (s.includes('فنية') || s.includes('تشكيلية') || s.includes('موسيقية') || s.includes('رسم') || s.includes('بدنية')) return 'art';
        return null;
    };

    const calculateStatistics = () => {
        if (!report.startDate || !report.endDate) {
            alert("يرجى تحديد فترة الحصيلة (من - إلى) أولاً.");
            return;
        }

        setIsCalculating(true);

        // Slight delay to allow UI to show loading state
        setTimeout(() => {
            const start = new Date(report.startDate);
            const end = new Date(report.endDate);
            // Reset time part to ensure inclusive comparison
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            const stats = {
                visitsInspection: 0,
                visitsTenure: 0,
                days: { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0 },
                ranks: { stagiere: 0, primary: 0, class1: 0, class2: 0, distinguished: 0, contract: 0 },
                levels: { prep: 0, year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
                subjects: { arabic: 0, math: 0, islamic: 0, history: 0, geo: 0, civics: 0, science: 0, art: 0 }
            };

            // 1. Process Inspection Visits (Modern & Legacy)
            Object.values(reportsMap).forEach(r => {
                if (!r.inspectionDate) return;
                
                // Parse date safely
                const visitDate = new Date(r.inspectionDate);
                // Check if valid date
                if (isNaN(visitDate.getTime())) return;

                if (visitDate >= start && visitDate <= end) {
                    stats.visitsInspection++;
                    
                    // Days
                    const dayIndex = visitDate.getDay(); 
                    if (dayIndex === 0) stats.days.sun++;
                    else if (dayIndex === 1) stats.days.mon++;
                    else if (dayIndex === 2) stats.days.tue++;
                    else if (dayIndex === 3) stats.days.wed++;
                    else if (dayIndex === 4) stats.days.thu++;

                    // Ranks & Levels
                    const teacher = teachers.find(t => t.id === r.teacherId);
                    if (teacher) {
                        const status = teacher.status || '';
                        const rank = (teacher.rank || '').trim();
                        
                        if (status === 'stagiere') stats.ranks.stagiere++;
                        else if (status === 'contractuel') stats.ranks.contract++;
                        else {
                            if (rank.includes('مميز')) stats.ranks.distinguished++;
                            else if (rank.includes('ثان') || rank.includes('قسم 2') || rank.includes('2')) stats.ranks.class2++;
                            else if (rank.includes('أول') || rank.includes('قسم 1') || rank.includes('1')) stats.ranks.class1++;
                            else stats.ranks.primary++;
                        }
                    }

                    const lvl = r.level || '';
                    if (lvl.includes('تحضيري')) stats.levels.prep++;
                    else if (lvl.includes('الأولى') || lvl.includes('1')) stats.levels.year1++;
                    else if (lvl.includes('الثانية') || lvl.includes('2')) stats.levels.year2++;
                    else if (lvl.includes('الثالثة') || lvl.includes('3')) stats.levels.year3++;
                    else if (lvl.includes('الرابعة') || lvl.includes('4')) stats.levels.year4++;
                    else if (lvl.includes('الخامسة') || lvl.includes('5')) stats.levels.year5++;

                    // Subjects
                    const subjKey = getSubjectKey(r.subject || '');
                    if (subjKey) {
                        stats.subjects[subjKey]++;
                    } else {
                        // If no specific key found but subject exists, default to Arabic or ignore?
                        // Let's default to Arabic to ensure it's counted somewhere if it's a main subject
                        if(r.subject) stats.subjects.arabic++;
                    }
                }
            });

            // 2. Process Tenure Visits (From Teacher Profile or Tenure Reports)
            teachers.forEach(t => {
                let tenureDateObj: Date | null = null;

                // Priority 1: Check Tenure Reports Map (if exam happened)
                if (tenureReportsMap && tenureReportsMap[t.id] && tenureReportsMap[t.id].examDate) {
                    tenureDateObj = new Date(tenureReportsMap[t.id].examDate);
                } 
                // Priority 2: Check Teacher Profile Date
                else if (t.tenureDate && t.tenureDate.trim() !== '') {
                    tenureDateObj = new Date(t.tenureDate);
                }

                if (tenureDateObj && !isNaN(tenureDateObj.getTime())) {
                    if (tenureDateObj >= start && tenureDateObj <= end) {
                        stats.visitsTenure++;
                    }
                }
            });
            
            // 3. Count Totals
            const totalTeachers = teachers.length;
            const trainees = teachers.filter(t => t.status === 'stagiere').length;
            // Tenure Candidates: Any stagiere is technically a candidate for tenure visit
            const tenureCandidates = trainees; 

            onChange({
                ...report,
                ...stats,
                teachersTotal: totalTeachers,
                teachersTrainee: trainees,
                teachersTenure: tenureCandidates 
            });

            setIsCalculating(false);
        }, 500);
    };

    const update = (field: keyof QuarterlyReportData, value: any) => {
        onChange({ ...report, [field]: value });
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 p-2 shadow-sm z-20 flex flex-col gap-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                            <RotateCw size={18} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm hidden md:inline">الحصيلة الفصلية</span>
                    </div>

                    <div className="flex-1 w-full md:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-2 items-center justify-center">
                        <div className="flex items-center gap-1 px-1">
                            <Calendar size={14} className="text-slate-400"/>
                            <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">الفترة</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500">من:</span>
                            <input 
                                type="date" 
                                className="w-full md:w-32 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                                value={report.startDate}
                                onChange={e => update('startDate', e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500">إلى:</span>
                            <input 
                                type="date" 
                                className="w-full md:w-32 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                                value={report.endDate}
                                onChange={e => update('endDate', e.target.value)}
                            />
                        </div>

                        <div className="h-4 w-px bg-slate-200 mx-2 hidden md:block"></div>
                        <select 
                            value={report.term} 
                            onChange={e => update('term', e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="الأول">فصل 1</option>
                            <option value="الثاني">فصل 2</option>
                            <option value="الثالث">فصل 3</option>
                            <option value="السنوي">السنوي</option>
                        </select>
                        
                        <button 
                            onClick={calculateStatistics}
                            disabled={isCalculating}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-1.5 transition-colors disabled:opacity-70"
                        >
                            {isCalculating ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />}
                            {isCalculating ? 'جاري الحساب...' : 'تحديث'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowManualStats(!showManualStats)}
                            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors ${showManualStats ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                            <Settings2 size={16} />
                            <span>إضافات يدوية</span>
                        </button>

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
                                    className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100"
                                    title="رفع الختم"
                                >
                                    <Stamp size={16} />
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={onPrint}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-slate-900 flex items-center gap-2 text-xs"
                        >
                            <Printer size={16} />
                            طباعة
                        </button>
                    </div>
                </div>

                {showManualStats && (
                    <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 grid grid-cols-2 md:grid-cols-5 gap-3 animate-in slide-in-from-top-2">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-1">ندوات التكوين</label>
                            <input type="number" value={report.visitsTraining} onChange={e => update('visitsTraining', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-xs font-bold text-center" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-1">الاستفادة تكوين</label>
                            <input type="number" value={report.visitsTrainingBenefit} onChange={e => update('visitsTrainingBenefit', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-xs font-bold text-center" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-1">تأطير عمليات</label>
                            <input type="number" value={report.tasksSupervision} onChange={e => update('tasksSupervision', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-xs font-bold text-center" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-1">تحقيقات</label>
                            <input type="number" value={report.tasksInvestigations} onChange={e => update('tasksInvestigations', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-xs font-bold text-center" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-1">معنيون بالتثبيت ( حسب مقرر التأهيل)</label>
                            <input type="number" value={report.teachersTenure} onChange={e => update('teachersTenure', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-xs font-bold text-center" />
                        </div>
                    </div>
                )}
            </div>

            {/* Preview */}
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center items-start">
                <div className="transform scale-95 shadow-2xl origin-top">
                    <PrintableQuarterlyReport report={report} signature={signature} />
                </div>
            </div>
        </div>
    );
};

export default QuarterlyReportEditor;