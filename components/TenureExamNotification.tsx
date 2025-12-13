import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ArrowRight, User, Calendar, FileText, School, Lock } from 'lucide-react';
import { Teacher, ReportData, TenureReportData } from '../types';
import VoiceInput from './VoiceInput';
import VoiceTextarea from './VoiceTextarea';
import { addMailRecord } from '../services/mailStorage';

interface TenureExamNotificationProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    inspectorName: string;
    wilaya: string;
    district: string;
    onBack: () => void;
    signature?: string; // Added prop
    isExpired?: boolean;
    onUpgradeClick?: () => void;
}

const TenureExamNotification: React.FC<TenureExamNotificationProps> = ({ 
    teachers, reportsMap, inspectorName, wilaya, district, onBack, signature,
    isExpired = false, onUpgradeClick
}) => {
    // --- STATE ---
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState<string>('');
    const [customBody, setCustomBody] = useState<string>(
        "يشرفني أن أنهي إلى علمكم أنه تقرر برمجة امتحان التثبيت الخاص بكم في التاريخ والمكان المحددين أدناه. \nيرجى منكم اتخاذ كافة التدابير التربوية والتنظيمية اللازمة، وتحضير الوثائق البيداغوجية المطلوبة لتقديمها للجنة الامتحان."
    );

    // --- DERIVED DATA ---
    const traineeTeachers = useMemo(() => {
        return teachers.filter(t => t.status === 'stagiere').map(t => ({
            ...t,
            schoolName: reportsMap[t.id]?.school || 'غير محددة'
        }));
    }, [teachers, reportsMap]);

    const selectedTeacher = useMemo(() => {
        return traineeTeachers.find(t => t.id === selectedTeacherId);
    }, [traineeTeachers, selectedTeacherId]);

    const handlePrint = () => {
        if (isExpired && onUpgradeClick) {
            onUpgradeClick();
        } else {
            window.print();
            // Auto Archive (With No Number)
            if (confirm("هل تريد حفظ الإشعار في سجل الصادر (بدون رقم)؟")) {
                const recipient = selectedTeacher ? `الأستاذ ${selectedTeacher.fullName} (مدرسة ${selectedTeacher.schoolName})` : 'أستاذ متربص';
                const subject = "إشعار باجتياز امتحان التثبيت";
                // Force IsNoNumber = true
                addMailRecord('outgoing', recipient, subject, true);
                alert("تم الحفظ.");
            }
        }
    };

    // --- PAPER CONTENT (Shared) ---
    const PaperContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="text-center mb-6 shrink-0">
                <h3 className="font-bold text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                <h3 className="font-bold text-sm mb-4">وزارة التربية الوطنية</h3>
                
                <div className="flex justify-between items-start text-sm font-bold px-2 border-b-2 border-black pb-3">
                    <div className="text-right w-1/2 space-y-1">
                        <p>مديرية التربية لولاية {wilaya}</p>
                        <p>مفتشية التعليم الابتدائي</p>
                        <p>المقاطعة: {district}</p>
                    </div>
                    <div className="text-left w-1/2">
                        <p>{wilaya} في: {new Date().toLocaleDateString('ar-DZ')}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 flex flex-col">
                
                {/* Title Box */}
                <div className="flex justify-center mb-8 shrink-0">
                    <div className="border-[3px] border-black px-10 py-2 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h1 className="text-2xl font-bold tracking-wide">إشعار باجتياز امتحان التثبيت</h1>
                    </div>
                </div>

                {/* Recipient */}
                <div className="mb-8 text-base leading-relaxed font-bold shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-32 whitespace-nowrap">إلى السيد(ة):</span>
                        <span className="border-b border-dotted border-black flex-1 inline-block">{selectedTeacher?.fullName || '................................'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-32 whitespace-nowrap">أستاذ(ة) بمدرسة:</span>
                        <span className="border-b border-dotted border-black flex-1 inline-block">{selectedTeacher?.schoolName || '................................'}</span>
                    </div>
                    <div className="mt-4 text-center w-full">
                        <span className="underline decoration-1 underline-offset-4">عن طريق السيد(ة) مدير(ة) المدرسة</span>
                    </div>
                </div>

                {/* Subject & Reference */}
                <div className="mb-6 border border-black p-3 rounded-lg shrink-0">
                    <div className="flex gap-2 mb-2">
                        <span className="font-bold underline text-base w-20">الموضوع:</span>
                        <span className="text-base font-bold">إشعار باجتياز امتحان التثبيت (الترسيم).</span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <span className="font-bold underline text-base w-20">المرجـع:</span>
                        <span className="text-base flex-1 leading-relaxed">{reference || '................................................................'}</span>
                    </div>
                </div>

                {/* Body Text */}
                <div className="mb-8 text-justify text-base leading-loose font-medium indent-8 flex-1">
                    <p className="whitespace-pre-line">
                        {customBody}
                    </p>
                    <p className="mt-3">
                        وعليــه، تقـرر إجراء الامتحان يوم: <span className="font-bold bg-gray-100 px-2 border border-gray-300 mx-1">{new Date(examDate).toLocaleDateString('ar-DZ')}</span> بمدرسة عملكم، ابتداءً من الساعة الثامنة (08:00) صباحاً.
                    </p>
                </div>

                {/* Signature */}
                <div className="flex justify-between items-start mt-auto pt-4 shrink-0">
                    <div className="text-center w-1/3">
                        <p className="font-bold underline mb-2">إمضاء المعني(ة) بالأمر</p>
                        <p className="text-xs text-gray-400 mb-8">(بتاريخ الاستلام)</p>
                    </div>
                    
                    <div className="text-center w-1/3">
                        <p className="font-bold underline mb-2">إمضاء مدير(ة) المدرسة</p>
                    </div>

                    <div className="text-center w-1/3 relative">
                        <p className="font-bold underline mb-8">مفتش المقاطعة</p>
                        <div className="h-24 w-full"></div>
                        
                        {/* SIGNATURE OVERLAY */}
                        {signature && (
                            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-40 h-28 pointer-events-none mix-blend-multiply">
                                <img src={signature} className="w-full h-full object-contain opacity-90 -rotate-6" alt="Signature" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
            
            {/* 1. CONTROL PANEL */}
            <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto print:hidden shadow-lg z-10">
                <div className="p-4 bg-slate-800 text-white shrink-0 flex items-center gap-3">
                    <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg">إشعار بالتثبيت</h2>
                        <p className="text-slate-400 text-[10px]">خاص بالأساتذة المتربصين</p>
                    </div>
                </div>

                <div className="p-5 space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block">1. اختيار المتربص</label>
                        {traineeTeachers.length > 0 ? (
                            <div className="space-y-2">
                                {traineeTeachers.map(t => (
                                    <div key={t.id} onClick={() => setSelectedTeacherId(t.id)} className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedTeacherId === t.id ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedTeacherId === t.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}><User size={16} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{t.fullName}</p>
                                            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1"><School size={10} /> {t.schoolName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 text-slate-400 text-xs">لا يوجد أساتذة متربصون</div>}
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase block">2. بيانات الامتحان</label>
                        <VoiceInput type="date" label="تاريخ الامتحان" value={examDate} onChange={setExamDate} />
                        <VoiceInput label="المرجع (قرار التأهيل)" placeholder="مثلاً: القرار رقم ... بتاريخ ..." value={reference} onChange={setReference} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block">3. نص الإشعار</label>
                        <VoiceTextarea value={customBody} onChange={setCustomBody} className="w-full p-3 border rounded-xl text-xs leading-relaxed min-h-[120px] resize-none focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>

                    <button onClick={handlePrint} disabled={!selectedTeacherId} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-auto">
                        {isExpired ? <Lock size={18} /> : <Printer size={18} />} طباعة الإشعار
                    </button>
                </div>
            </div>

            {/* 2. PREVIEW AREA (SCREEN) */}
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center items-start print:hidden">
                <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[15mm] relative text-black font-serif flex flex-col">
                    {PaperContent}
                </div>
            </div>

            {/* 3. PRINT AREA (PORTAL) */}
            {createPortal(
                <div className="hidden print:flex fixed inset-0 w-full h-full bg-white z-[9999] p-[15mm] flex-col text-black font-serif">
                    {PaperContent}
                </div>,
                document.body
            )}
        </div>
    );
};

export default TenureExamNotification;
