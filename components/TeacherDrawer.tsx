
import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import { X, Calendar, User, Award, History, ArrowRight, TrendingUp, Clock, AlertCircle, GraduationCap, FileText, Star, ShieldCheck, Briefcase, ScrollText, CheckCircle2, Lock, Save } from 'lucide-react';

interface TeacherDrawerProps {
    teacher: Teacher | null;
    isOpen: boolean;
    onClose: () => void;
    onStartInspection: (t: Teacher) => void;
    onStartLegacyInspection?: (t: Teacher) => void;
    onStartTenure?: (t: Teacher) => void;
    onUpdateTeacher?: (t: Teacher) => void; 
}

const TeacherDrawer: React.FC<TeacherDrawerProps> = ({ teacher, isOpen, onClose, onStartInspection, onStartLegacyInspection, onStartTenure, onUpdateTeacher }) => {
    
    // Local state for tenure date editing
    const [tenureDate, setTenureDate] = useState('');
    const [privateNotes, setPrivateNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        if (teacher) {
            setTenureDate(teacher.tenureDate || '');
            setPrivateNotes(teacher.privateNotes || '');
        }
    }, [teacher]);

    if (!teacher) return null;

    const handleSaveTenureDate = () => {
        if (onUpdateTeacher) {
            onUpdateTeacher({ ...teacher, tenureDate });
        }
    };

    const handleSaveNotes = () => {
        setIsSavingNotes(true);
        if (onUpdateTeacher) {
            onUpdateTeacher({ ...teacher, privateNotes });
        }
        setTimeout(() => setIsSavingNotes(false), 500);
    };

    // Helper to format dates
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'غير محدد';
        return new Date(dateStr).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Calculate seniority
    const calculateYears = (dateStr: string) => {
        if (!dateStr) return 0;
        const start = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const seniority = calculateYears(teacher.recruitmentDate);

    // Calculate Next Promotion Date (approximate)
    let nextPromoDate = null;
    if (teacher.echelonDate) {
        const d = new Date(teacher.echelonDate);
        d.setFullYear(d.getFullYear() + 2); // Minimum 2 years
        nextPromoDate = d;
    }

    const isDueForPromo = nextPromoDate ? nextPromoDate <= new Date() : false;

    return (
        <div 
            className={`fixed inset-0 z-[100] flex justify-end transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop with blur */}
            <div 
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div 
                className={`relative w-full max-w-md bg-gray-50 h-full shadow-2xl transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col border-l border-white/10 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                dir="rtl"
            >
                {/* Header Section */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6 pb-8 relative overflow-hidden shrink-0">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    <button 
                        onClick={onClose} 
                        className="absolute top-5 left-5 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80 hover:text-white backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="relative z-10 flex flex-col items-center text-center mt-2">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 bg-white text-blue-900 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-white/20 backdrop-blur-sm">
                                {teacher.fullName.charAt(0)}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-7 h-7 rounded-full border-4 border-slate-900 flex items-center justify-center text-white text-[10px]
                                ${teacher.status === 'titulaire' ? 'bg-emerald-500' : teacher.status === 'contractuel' ? 'bg-orange-500' : 'bg-blue-500'}`} 
                                title={teacher.status === 'titulaire' ? 'مرسم' : 'غير مرسم'}
                            >
                                <ShieldCheck size={14} />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold font-serif tracking-wide">{teacher.fullName}</h2>
                        <div className="flex items-center gap-2 mt-2 text-blue-200 text-xs font-medium bg-blue-950/50 px-3 py-1 rounded-full border border-blue-800/50">
                            <Briefcase size={12} />
                            <span>{teacher.rank}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Row - Floating intersection */}
                <div className="px-6 -mt-6 relative z-20 grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">الدرجة</span>
                        <span className="text-xl font-bold text-slate-800">{teacher.echelon || '-'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">النقطة</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className={`text-xl font-bold ${teacher.lastMark >= 16 ? 'text-emerald-600' : teacher.lastMark >= 13 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {teacher.lastMark}
                            </span>
                            <span className="text-[10px] text-gray-400">/20</span>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">الخبرة</span>
                        <span className="text-xl font-bold text-indigo-700">{seniority} <span className="text-[10px] font-normal text-gray-400">سنة</span></span>
                    </div>
                </div>

                {/* Body - Timeline */}
                <div className="flex-1 overflow-y-auto p-6">
                    
                    {/* Private Notes Section */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mb-8 relative group focus-within:ring-2 focus-within:ring-amber-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                <Lock size={14} className="text-amber-600"/>
                                ملاحظات سرية
                            </div>
                            {privateNotes !== teacher.privateNotes && (
                                <button 
                                    onClick={handleSaveNotes}
                                    className="text-[10px] bg-amber-500 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-600 transition-colors"
                                >
                                    <Save size={10} /> حفظ
                                </button>
                            )}
                        </div>
                        <textarea 
                            value={privateNotes}
                            onChange={(e) => setPrivateNotes(e.target.value)}
                            onBlur={handleSaveNotes}
                            className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none placeholder:text-gray-400/70"
                            placeholder="اكتب ملاحظات خاصة عن هذا الأستاذ لا تظهر في التقارير (ظروف اجتماعية، وعود، نقاط متابعة)..."
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <History size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">المسار المهني</h3>
                    </div>
                    
                    <div className="relative border-r-2 border-indigo-100 mr-3 space-y-8 pb-2">
                        {/* 1. Recruitment */}
                        <div className="relative pr-8 group">
                            <div className="absolute -right-[9px] top-1 w-4 h-4 bg-white rounded-full border-[3px] border-gray-300 group-hover:border-indigo-500 transition-colors z-10"></div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-indigo-100 group-hover:translate-x-[-4px]">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-gray-800 text-sm">تاريخ التوظيف</p>
                                    <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{formatDate(teacher.recruitmentDate)}</span>
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <User size={12} className="text-gray-400"/>
                                    بداية المسار المهني
                                </p>
                            </div>
                        </div>

                        {/* Tenure Date Input (FIXED: Only for Stagiere) */}
                        {teacher.status === 'stagiere' && (
                            <div className="relative pr-8 group">
                                <div className="absolute -right-[9px] top-1 w-4 h-4 bg-white rounded-full border-[3px] border-blue-300 group-hover:border-blue-500 transition-colors z-10"></div>
                                <div className="bg-blue-50/30 p-4 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-all group-hover:translate-x-[-4px]">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-blue-900 text-sm flex items-center gap-1">
                                            <GraduationCap size={14} /> تاريخ زيارة التثبيت
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input 
                                            type="date" 
                                            value={tenureDate} 
                                            onChange={(e) => setTenureDate(e.target.value)} 
                                            onBlur={handleSaveTenureDate}
                                            className="bg-white border border-blue-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400 flex-1"
                                        />
                                    </div>
                                    <p className="text-[9px] text-blue-600 mt-1">يُحتسب في الحصيلة الفصلية كزيارة تثبيت</p>
                                </div>
                            </div>
                        )}

                        {/* 2. Rank Date */}
                        {teacher.currentRankDate && (
                            <div className="relative pr-8 group">
                                <div className="absolute -right-[9px] top-1 w-4 h-4 bg-white rounded-full border-[3px] border-purple-300 group-hover:border-purple-500 transition-colors z-10"></div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-purple-100 group-hover:translate-x-[-4px]">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-gray-800 text-sm">التعيين في الرتبة الحالية</p>
                                        <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{formatDate(teacher.currentRankDate)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Award size={12} className="text-purple-400"/>
                                        {teacher.rank}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 3. Last Inspection */}
                        {teacher.lastInspectionDate && (
                            <div className="relative pr-8 group">
                                <div className="absolute -right-[9px] top-1 w-4 h-4 bg-blue-100 rounded-full border-[3px] border-blue-500 z-10 shadow-sm"></div>
                                <div className="bg-blue-50/50 p-4 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-all group-hover:translate-x-[-4px]">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-blue-900 text-sm">آخر زيارة تفتيش</p>
                                        <span className="text-[10px] font-mono bg-white text-blue-700 px-2 py-0.5 rounded-full shadow-sm border border-blue-100">{formatDate(teacher.lastInspectionDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-blue-100">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-xs font-bold text-gray-700">{teacher.lastMark}</span>
                                        </div>
                                        <span className="text-[10px] text-blue-400">نقطة تربوية</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Future: Promotion */}
                        {nextPromoDate && teacher.status === 'titulaire' && (
                            <div className="relative pr-8 group">
                                <div className={`absolute -right-[9px] top-1 w-4 h-4 rounded-full border-[3px] z-10 ${isDueForPromo ? 'bg-orange-100 border-orange-500 animate-pulse' : 'bg-gray-100 border-gray-300'}`}></div>
                                <div className={`p-4 rounded-2xl border border-dashed transition-all group-hover:translate-x-[-4px] ${isDueForPromo ? 'bg-orange-50/50 border-orange-300' : 'bg-transparent border-gray-300'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`font-bold text-sm ${isDueForPromo ? 'text-orange-800' : 'text-gray-500'}`}>
                                            الترقية القادمة (الدرجة {parseInt(teacher.echelon || '0') + 1})
                                        </p>
                                        {isDueForPromo && <AlertCircle size={14} className="text-orange-500" />}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Clock size={12} />
                                        أقدمية الدرجة الحالية: {formatDate(teacher.echelonDate || '')}
                                    </p>
                                    {isDueForPromo && (
                                        <p className="text-[10px] font-bold text-orange-600 mt-2 bg-white/50 inline-block px-2 py-1 rounded">
                                            مستحق للزيارة (أكثر من سنتين)
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-30">
                    
                    {/* Primary Action: New Inspection */}
                    <button 
                        onClick={() => onStartInspection(teacher)}
                        className="w-full bg-slate-900 text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] group"
                    >
                        <span className="group-hover:translate-x-1 transition-transform">بدء تقرير تفتيش جديد</span>
                        <ArrowRight size={18} className="text-blue-400" />
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Secondary: Legacy Report (IMPROVED STYLE) */}
                        {onStartLegacyInspection && (
                             <button 
                                onClick={() => onStartLegacyInspection(teacher)}
                                className="w-full bg-amber-500 text-white font-bold text-xs py-3 rounded-xl shadow-md hover:bg-amber-600 transition-all flex items-center justify-center gap-2 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 group"
                            >
                                <ScrollText size={18} className="text-amber-100 group-hover:rotate-12 transition-transform"/>
                                <span>نموذج كلاسيكي</span>
                            </button>
                        )}

                        {/* Conditional: Tenure Exam */}
                        {teacher.status === 'stagiere' && onStartTenure ? (
                            <button 
                                onClick={() => onStartTenure(teacher)}
                                className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1"
                            >
                                <GraduationCap size={16} />
                                <span>امتحان التثبيت</span>
                            </button>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="w-full text-slate-400 font-bold text-xs py-3 hover:text-slate-600 transition-colors"
                            >
                                إغلاق النافذة
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDrawer;
