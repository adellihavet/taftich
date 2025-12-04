
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Presentation, Printer, Users, FileText, CheckSquare, X, School, MapPin } from 'lucide-react';
import { Teacher, ReportData } from '../types';
import VoiceInput from './VoiceInput';

interface SeminarsManagerProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    inspectorInfo: {
        name: string;
        district: string;
        wilaya: string;
    };
}

const AVAILABLE_LEVELS = [
    "التربية التحضيرية",
    "السنة الأولى",
    "السنة الثانية",
    "السنة الثالثة",
    "السنة الرابعة",
    "السنة الخامسة"
];

const SeminarsManager: React.FC<SeminarsManagerProps> = ({ teachers, reportsMap, inspectorInfo }) => {
    // Seminar Details
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [location, setLocation] = useState('');
    const [reference, setReference] = useState(''); 
    
    // Target Audience
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    
    // Absence Management
    const [absentTeachers, setAbsentTeachers] = useState<string[]>([]);
    const [inquiryTarget, setInquiryTarget] = useState<Teacher | null>(null);

    // Filter Logic
    const toggleLevel = (level: string) => {
        setSelectedLevels(prev => 
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    const targetTeachers = useMemo(() => {
        if (selectedLevels.length === 0) return [];
        
        return teachers.filter(t => {
            const report = reportsMap[t.id];
            const teacherLevel = report?.level || ''; 
            return selectedLevels.some(lvl => teacherLevel.includes(lvl));
        }).map(t => ({
            ...t,
            schoolName: reportsMap[t.id]?.school || 'غير محددة',
            levelName: reportsMap[t.id]?.level || 'غير محدد'
        })).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    }, [teachers, reportsMap, selectedLevels]);

    // --- PAGINATION LOGIC FOR ATTENDANCE LIST ---
    const attendancePages = useMemo(() => {
        const pages: (Teacher & { schoolName: string; levelName: string })[][] = [];
        // Keep limit at 18 as requested - it's a safe number for A4 with header
        const limit = 18; 

        if (targetTeachers.length === 0) return [];

        let remaining = [...targetTeachers];
        while (remaining.length > 0) {
            pages.push(remaining.slice(0, limit));
            remaining = remaining.slice(limit);
        }

        return pages;
    }, [targetTeachers]);

    const toggleAbsence = (id: string) => {
        setAbsentTeachers(prev => 
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOpenInquiry = (teacher: Teacher) => {
        setInquiryTarget(teacher);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            
            {/* --- INQUIRY MODAL (UI for Data Entry) --- */}
            {inquiryTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText size={20} className="text-red-600"/>
                                معاينة الاستفسار
                            </h3>
                            <button onClick={() => setInquiryTarget(null)}><X size={20} className="text-slate-500 hover:text-red-500"/></button>
                        </div>
                        
                        {/* Preview Content (Simplified for Screen) */}
                        <div className="p-8 overflow-y-auto bg-white flex-1">
                            <div className="text-center font-bold text-gray-400 mb-4 text-xs uppercase tracking-widest border-b pb-2">
                                معاينة فقط (اضغط طباعة للشكل النهائي)
                            </div>
                            
                            <div className="border p-4 rounded bg-gray-50 text-sm space-y-4">
                                <p><strong>إلى السيد(ة):</strong> {inquiryTarget.fullName}</p>
                                <p><strong>الموضوع:</strong> استفسار حول الغياب</p>
                                <p className="leading-loose text-gray-600">
                                    بناءً على ما جاء في الموضوع {reference ? 'والمرجع أعلاه' : 'أعلاه'}، يشرفني أن أطلب منكم موافاتي بتقرير مفصل ومبرر حول أسباب غيابكم عن الندوة التربوية التي عُقدت يوم <b>{date}</b> بـ: <b>{location}</b> تحت عنوان "<b>{title}</b>".
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                            <button onClick={() => setInquiryTarget(null)} className="px-4 py-2 rounded text-slate-600 hover:bg-slate-200 font-bold">إلغاء</button>
                            <button onClick={handlePrint} className="bg-red-600 text-white px-6 py-2 rounded shadow flex items-center gap-2 hover:bg-red-700 font-bold">
                                <Printer size={18}/> طباعة الاستفسار
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN INTERFACE (Screen Only) --- */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto print:hidden">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm border border-indigo-200">
                            <Presentation size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 font-serif">تنظيم الندوات التربوية</h1>
                        <p className="text-slate-500 mt-2">إعداد القوائم، طباعة ورقة الحضور، ومتابعة الغيابات آلياً</p>
                    </div>

                    {/* 1. Configuration Panel */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg text-indigo-800 mb-4 flex items-center gap-2">
                            <CheckSquare size={20}/> إعدادات الندوة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <VoiceInput label="عنوان الندوة" value={title} onChange={setTitle} placeholder="مثلاً: بيداغوجيا الإدماج..." />
                            <VoiceInput label="المكان (مدرسة، معهد...)" value={location} onChange={setLocation} placeholder="مثلاً: ابتدائية 1 نوفمبر / المعهد التكنولوجي..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <VoiceInput type="date" label="التاريخ" value={date} onChange={setDate} />
                            <VoiceInput label="المرجع (رزنامة/استدعاء - اختياري)" value={reference} onChange={setReference} placeholder="رقم .... المؤرخ في ...." />
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-bold text-slate-700 mb-3">الفئة المستهدفة (المستويات المعنية):</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_LEVELS.map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => toggleLevel(lvl)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                            selectedLevels.includes(lvl) 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Results & Actions */}
                    {targetTeachers.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-slate-500"/>
                                    <span className="font-bold text-slate-700">القائمة الاسمية ({targetTeachers.length} أستاذ)</span>
                                </div>
                                <button 
                                    onClick={handlePrint}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    <Printer size={16}/> طباعة ورقة الحضور
                                </button>
                            </div>
                            
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold">
                                    <tr>
                                        <th className="p-3 w-12">#</th>
                                        <th className="p-3">الاسم واللقب</th>
                                        <th className="p-3">المدرسة</th>
                                        <th className="p-3">المستوى</th>
                                        <th className="p-3 text-center w-32">تسجيل الغياب</th>
                                        <th className="p-3 w-32">إجراء إداري</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {targetTeachers.map((t, idx) => {
                                        const isAbsent = absentTeachers.includes(t.id);
                                        return (
                                            <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${isAbsent ? 'bg-red-50/50' : ''}`}>
                                                <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="p-3 font-bold text-slate-800">{t.fullName}</td>
                                                <td className="p-3 text-slate-600">{t.schoolName}</td>
                                                <td className="p-3 text-slate-500 text-xs">
                                                    <span className="bg-slate-100 px-2 py-1 rounded border">{t.levelName}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button 
                                                        onClick={() => toggleAbsence(t.id)}
                                                        className={`w-full py-1.5 rounded text-xs font-bold transition-all border ${
                                                            isAbsent 
                                                            ? 'bg-red-100 text-red-700 border-red-200' 
                                                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {isAbsent ? 'غائب' : 'حاضر'}
                                                    </button>
                                                </td>
                                                <td className="p-3">
                                                    {isAbsent && (
                                                        <button 
                                                            onClick={() => handleOpenInquiry(t)}
                                                            className="text-red-600 text-xs font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <FileText size={14}/>
                                                            استفسار
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <School size={48} className="mx-auto mb-3 opacity-20"/>
                            <p>يرجى اختيار مستوى واحد على الأقل لعرض قائمة الأساتذة المعنيين.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ##################################################################### */}
            {/* ################# PRINTABLE AREA (USING PORTAL) #################### */}
            {/* ##################################################################### */}

            {/* SCENARIO 1: PRINT ATTENDANCE (SPLIT PAGES MANUALLY - 18 Rows/Page to ensure safety) */}
            {!inquiryTarget && createPortal(
                <div className="hidden print:block absolute top-0 left-0 w-full h-auto bg-white z-[9999] text-black">
                    {attendancePages.map((pageTeachers, pageIndex) => (
                        <div 
                            key={pageIndex} 
                            className="a4-page relative flex flex-col justify-start" 
                            style={{ 
                                // CRITICAL FIX: Use AUTO height to prevent ghost pages.
                                // The a4-page class in index.html might force 296mm, so we override it here inline.
                                height: 'auto',
                                minHeight: '0', 
                                padding: '10mm 15mm',
                                // Only break after if it's NOT the last page
                                pageBreakAfter: pageIndex < attendancePages.length - 1 ? 'always' : 'auto',
                                marginBottom: '0' 
                            }}
                        >
                            
                            {/* Fixed Header on Every Page */}
                            <div className="text-center font-bold text-sm mb-4 space-y-1">
                                <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                                <p>وزارة التربية الوطنية</p>
                                <div className="flex justify-between items-end mt-4 px-2">
                                    <div className="text-right">
                                        <p>مديرية التربية لولاية {inspectorInfo.wilaya}</p>
                                        <p>مفتشية التعليم الابتدائي - المقاطعة: {inspectorInfo.district}</p>
                                    </div>
                                    <div className="text-left border border-black p-1 px-3 rounded">
                                        <p>السنة الدراسية: {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <h1 className="text-lg font-bold border-2 border-black inline-block px-6 py-1.5 bg-gray-50 shadow-[3px_3px_0px_0px_black]">
                                    ورقة الحضور للندوة التربوية {attendancePages.length > 1 ? `(صفحة ${pageIndex + 1})` : ''}
                                </h1>
                            </div>

                            <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2 text-xs font-bold bg-gray-50 p-2 rounded border border-gray-300">
                                <p><span className="underline ml-1">الموضوع:</span> {title || '................................'}</p>
                                <p><span className="underline ml-1">التاريخ:</span> {date}</p>
                                <p><span className="underline ml-1">المكان:</span> {location || '...........'}</p>
                            </div>

                            <table className="w-full border-collapse border border-black text-xs text-center" dir="rtl">
                                <thead className="bg-gray-100 h-8">
                                    <tr>
                                        <th className="border border-black p-1 w-10">رقم</th>
                                        <th className="border border-black p-1 w-1/4">اللقب والاسم</th>
                                        <th className="border border-black p-1 w-1/4">المدرسة</th>
                                        <th className="border border-black p-1">المستوى</th>
                                        <th className="border border-black p-1 w-24">الإمضاء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageTeachers.map((t, idx) => {
                                        // Calculate global index: 18 per page
                                        const globalIndex = (pageIndex * 18) + idx + 1;
                                        return (
                                            <tr key={t.id} style={{ height: '35px' }}>
                                                <td className="border border-black p-1">{globalIndex}</td>
                                                <td className="border border-black p-1 font-bold text-right pr-2">{t.fullName}</td>
                                                <td className="border border-black p-1 text-right pr-2">{t.schoolName}</td>
                                                <td className="border border-black p-1">{t.levelName}</td>
                                                <td className="border border-black p-1"></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>,
                document.body
            )}

            {/* SCENARIO 2: PRINT INQUIRY (Centered Header) */}
            {inquiryTarget && createPortal(
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-visible text-black font-serif top-0 left-0 w-full h-full">
                    <div className="p-12 max-w-[210mm] mx-auto h-full">
                        
                        {/* 1. Centered Republic/Ministry Header */}
                        <div className="text-center font-bold text-sm mb-4 space-y-1">
                            <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                            <p>وزارة التربية الوطنية</p>
                        </div>

                        {/* 2. Directorate / Inspectorate Split */}
                        <div className="flex justify-between items-start font-bold text-sm mb-8 px-2">
                            <div className="text-right">
                                <p>مديرية التربية لولاية {inspectorInfo.wilaya}</p>
                            </div>
                            <div className="text-left">
                                <p>مفتشية التعليم الابتدائي - المقاطعة: {inspectorInfo.district}</p>
                            </div>
                        </div>

                        {/* Recipient Block - Compact Margin */}
                        <div className="flex justify-end mt-4 pl-4 mb-6">
                            <div className="text-center w-80">
                                <p className="font-bold text-lg mb-1">إلى السيد(ة): {inquiryTarget.fullName}</p>
                                <p className="font-bold text-base mb-1">أستاذ(ة) بمدرسة: {reportsMap[inquiryTarget.id]?.school}</p>
                                <p className="font-bold text-sm">(ع/ط مدير(ة) المدرسة)</p>
                            </div>
                        </div>

                        <h1 className="text-center text-2xl font-bold underline mb-6 decoration-2 underline-offset-8">الموضوع: استفسار حول الغياب</h1>

                        <div className="text-justify text-lg leading-[2.2] px-4">
                            {/* Conditional Reference */}
                            {reference && (
                                <p className="mb-1">
                                    <span className="font-bold">المرجع:</span> {reference}
                                </p>
                            )}
                            
                            <p>
                                بناءً على ما جاء في الموضوع {reference ? 'والمرجع أعلاه' : 'أعلاه'}، يشرفني أن أطلب منكم موافاتي بتقرير مفصل ومبرر حول أسباب غيابكم عن الندوة التربوية التي عُقدت يوم <span className="font-bold">{date}</span> بـ: <span className="font-bold">{location}</span> تحت عنوان "<span className="font-bold">{title}</span>".
                            </p>
                            <p className="mt-2">
                                وذلك في أجل أقصاه 48 ساعة من تاريخ استلامكم لهذا الاستفسار.
                            </p>
                            <p className="mt-6 text-center font-bold">تقبلوا فائق التقدير والاحترام.</p>
                        </div>

                        {/* Footer: Date & Signature - Compact */}
                        <div className="mt-8 flex justify-between px-12 font-bold text-lg">
                            <div>
                                <p>حرر بـ: {inspectorInfo.wilaya}</p>
                                <p>في: {new Date().toLocaleDateString('ar-DZ')}</p>
                            </div>
                            <div className="text-center w-48">
                                <p className="underline mb-12">المفتش</p>
                                {/* Space for stamp */}
                            </div>
                        </div>

                        {/* Teacher's Reply Section with Visa at Bottom */}
                        <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                            <h3 className="font-bold underline text-lg mb-2 px-4">رد الأستاذ(ة):</h3>
                            
                            <div className="p-4 min-h-[220px] relative border-2 border-black rounded-lg">
                                {/* Dotted lines generator */}
                                <div className="space-y-10 mt-4">
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                </div>
                                
                                {/* Bottom Visa and Signature */}
                                <div className="absolute bottom-2 left-4 text-sm font-bold">
                                    تأشيرة المدير(ة):
                                </div>
                                <div className="absolute bottom-2 right-4 text-sm font-bold">
                                    التاريخ والإمضاء:
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SeminarsManager;
