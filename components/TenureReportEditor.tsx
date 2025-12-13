
import React, { useState, useRef } from 'react';
import { TenureReportData, Teacher, TenureLesson } from '../types';
import { Save, Printer, User, BookOpen, MessageCircle, Gavel, Sparkles, ChevronDown, Stamp, Mic, Lock } from 'lucide-react';
import VoiceTextarea from './VoiceTextarea';
import VoiceInput from './VoiceInput';
import { suggestImprovement } from '../services/geminiService';

interface TenureReportEditorProps {
    report: TenureReportData;
    teacher: Teacher;
    onChange: (report: TenureReportData) => void;
    onPrint: () => void;
    isGoldMember: boolean;
    onUploadSignature?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isExpired?: boolean;
    onUpgradeClick?: () => void;
}

const TenureReportEditor: React.FC<TenureReportEditorProps> = ({ 
    report, teacher, onChange, onPrint, isGoldMember, onUploadSignature,
    isExpired = false, onUpgradeClick
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'lessons' | 'oral' | 'decision'>('info');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateField = (field: keyof TenureReportData, value: any) => {
        onChange({ ...report, [field]: value });
    };

    const updateOralField = (field: keyof typeof report.oralQuestions, value: string) => {
        onChange({
            ...report,
            oralQuestions: {
                ...report.oralQuestions,
                [field]: value
            }
        });
    };

    const updateLesson = (id: string, field: keyof TenureLesson, value: string) => {
        const newLessons = report.lessons.map(l => l.id === id ? { ...l, [field]: value } : l);
        onChange({ ...report, lessons: newLessons });
    };

    const suggestOralQuestions = async () => {
        // AI remains exclusive to Gold? Or open in Trial? The hook says isActive so it's open in trial.
        if (!isGoldMember && isExpired) return onUpgradeClick && onUpgradeClick();
        
        // Mock suggestions for now
        updateOralField('legislation', "ما هي حقوق وواجبات الموظف العمومي؟");
        updateOralField('psychology', "كيف تتعامل مع التلميذ المشاغب بأسلوب تربوي؟");
        updateOralField('educationScience', "عرف الوساطة المدرسية ودورها في العملية التعليمية.");
    };

    const handlePrint = () => {
        if (isExpired) {
            onUpgradeClick && onUpgradeClick();
        } else {
            onPrint();
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
             {/* Toolbar */}
             <div className="bg-[#4d6a4d] text-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex gap-2 text-xs md:text-sm">
                    <button onClick={() => setActiveTab('info')} className={`px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'bg-white text-[#4d6a4d]' : 'bg-[#3d5a3d] hover:bg-[#2d4a2d] text-green-100'}`}>
                        <User size={16}/> اللجنة والإداريات
                    </button>
                    <button onClick={() => setActiveTab('lessons')} className={`px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'lessons' ? 'bg-white text-[#4d6a4d]' : 'bg-[#3d5a3d] hover:bg-[#2d4a2d] text-green-100'}`}>
                        <BookOpen size={16}/> الدروس (3)
                    </button>
                    <button onClick={() => setActiveTab('oral')} className={`px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'oral' ? 'bg-white text-[#4d6a4d]' : 'bg-[#3d5a3d] hover:bg-[#2d4a2d] text-green-100'}`}>
                        <MessageCircle size={16}/> الشفهي
                    </button>
                    <button onClick={() => setActiveTab('decision')} className={`px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'decision' ? 'bg-white text-[#4d6a4d]' : 'bg-[#3d5a3d] hover:bg-[#2d4a2d] text-green-100'}`}>
                        <Gavel size={16}/> القرار
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                     {onUploadSignature && !isExpired && (
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
                                className="p-2 rounded-lg text-green-100 hover:bg-[#2d4a2d] hover:text-white transition-colors"
                                title="رفع صورة الإمضاء/الختم"
                            >
                                <Stamp size={20} />
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handlePrint} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm ${isExpired ? 'bg-gray-300 text-gray-600' : 'bg-white text-[#4d6a4d] hover:bg-gray-100'}`}
                    >
                        {isExpired ? <Lock size={18}/> : <Printer size={18} />}
                        طباعة
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                {/* Expired Warning Banner */}
                {isExpired && (
                    <div className="bg-red-500 text-white text-center py-2 px-4 rounded-lg mb-6 text-sm font-bold flex items-center justify-center gap-2 shadow-md">
                        <Lock size={16} />
                        <span>انتهت الفترة التجريبية. يمكنك التعديل لكن الطباعة تتطلب اشتراكاً.</span>
                    </div>
                )}
                
                {activeTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                             <h2 className="text-xl font-bold text-[#4d6a4d] border-b pb-2 mb-4">معلومات الامتحان واللجنة</h2>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                 <VoiceInput type="date" label="تاريخ الامتحان" value={report.examDate} onChange={v => updateField('examDate', v)} />
                                 <VoiceInput label="المدرسة (مركز الامتحان)" value={report.school} onChange={v => updateField('school', v)} />
                                 <VoiceInput label="المدينة (مكان إجراء الامتحان)" value={report.city} onChange={v => updateField('city', v)} />
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                 <VoiceInput label="مديرية التربية لولاية" value={report.wilaya} onChange={v => updateField('wilaya', v)} />
                                 <VoiceInput label="مفتشية التعليم الابتدائي (المقاطعة)" value={report.district} onChange={v => updateField('district', v)} />
                             </div>
                             
                             <h3 className="font-bold text-gray-600 mt-6 mb-2 border-b border-gray-100 pb-1">أعضاء اللجنة</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <VoiceInput label="رئيس اللجنة (المفتش)" value={report.inspectorName} onChange={v => updateField('inspectorName', v)} className="bg-green-50" />
                                 <VoiceInput label="العضو 1 (المدير)" value={report.directorName} onChange={v => updateField('directorName', v)} />
                                 <VoiceInput label="العضو 2 (الأستاذ)" value={report.teacherMemberName} onChange={v => updateField('teacherMemberName', v)} />
                             </div>

                             <h3 className="font-bold text-gray-600 mt-6 mb-2 border-b border-gray-100 pb-1">معلومات إدارية وتوظيف (للمترشح)</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="flex gap-2">
                                     <div className="flex-1"><VoiceInput label="رقم قرار التسمية" value={report.appointmentDecisionNumber} onChange={v => updateField('appointmentDecisionNumber', v)} /></div>
                                     <div className="w-32"><VoiceInput type="date" label="تاريخه" value={report.appointmentDecisionDate} onChange={v => updateField('appointmentDecisionDate', v)} /></div>
                                 </div>
                                 <div className="flex gap-2">
                                     <div className="flex-1"><VoiceInput label="رقم التأشيرة المالية" value={report.financialVisaNumber} onChange={v => updateField('financialVisaNumber', v)} /></div>
                                     <div className="w-32"><VoiceInput type="date" label="تاريخها" value={report.financialVisaDate} onChange={v => updateField('financialVisaDate', v)} /></div>
                                 </div>
                                 <VoiceInput label="الجامعة / المعهد الأصلي" value={report.university} onChange={v => updateField('university', v)} placeholder="جامعة عمار ثليجي بالأغواط..." />
                                 <div className="flex gap-2">
                                     <div className="flex-1">
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5">نوع التوظيف</label>
                                        <input list="recruitmentTypes" value={report.recruitmentType || ''} onChange={e => updateField('recruitmentType', e.target.value)} className="w-full border rounded-lg py-2 px-3 text-sm outline-none" placeholder="الناجح في المسابقة..." />
                                        <datalist id="recruitmentTypes">
                                            <option value="الناجح في المسابقة" />
                                            <option value="المدمج" />
                                            <option value="خريج المدرسة العليا" />
                                        </datalist>
                                     </div>
                                     <div className="w-32"><VoiceInput type="date" label="تاريخ المسابقة/التوظيف" value={report.contestDate} onChange={v => updateField('contestDate', v)} /></div>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'lessons' && (
                    <div className="space-y-6 animate-in fade-in">
                        {report.lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-[#4d6a4d] border-b pb-2 mb-4 flex justify-between items-center">
                                    <span>{idx === 0 ? 'الدرس الأول' : idx === 1 ? 'الدرس الثاني' : 'الدرس الثالث'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">التوقيت:</span>
                                        <input type="time" value={lesson.timeStart} onChange={e => updateLesson(lesson.id, 'timeStart', e.target.value)} className="border rounded px-1 text-sm" />
                                        <span>-</span>
                                        <input type="time" value={lesson.timeEnd} onChange={e => updateLesson(lesson.id, 'timeEnd', e.target.value)} className="border rounded px-1 text-sm" />
                                    </div>
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <VoiceInput label="المادة / النشاط" value={lesson.subject} onChange={v => updateLesson(lesson.id, 'subject', v)} />
                                    <VoiceInput label="الموضوع" value={lesson.topic} onChange={v => updateLesson(lesson.id, 'topic', v)} />
                                    <VoiceInput label="المستوى / القسم" value={lesson.level} onChange={v => updateLesson(lesson.id, 'level', v)} />
                                </div>

                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2"><BookOpen size={14}/> مراحل سير الدرس (للصفحة الثانية)</h4>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">1. مرحلة الانطلاق (وضعية الانطلاق)</label>
                                        <VoiceTextarea value={lesson.phaseLaunch} onChange={v => updateLesson(lesson.id, 'phaseLaunch', v)} className="w-full border rounded p-2 text-sm bg-white" minHeight="min-h-[40px]" placeholder="مثلاً: الحساب الذهني، مراجعة الحرف السابق..."/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">2. مرحلة بناء التعلمات</label>
                                        <VoiceTextarea value={lesson.phaseConstruction} onChange={v => updateLesson(lesson.id, 'phaseConstruction', v)} className="w-full border rounded p-2 text-sm bg-white" minHeight="min-h-[60px]" placeholder="أهم الأنشطة والمراحل..."/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">3. مرحلة الاستثمار (التطبيق)</label>
                                        <VoiceTextarea value={lesson.phaseInvestment} onChange={v => updateLesson(lesson.id, 'phaseInvestment', v)} className="w-full border rounded p-2 text-sm bg-white" minHeight="min-h-[40px]" placeholder="إنجاز التمارين، الوضعية الإدماجية..."/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'oral' && (
                     <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                             <div className="flex justify-between items-center border-b pb-2 mb-4">
                                <h2 className="text-xl font-bold text-[#4d6a4d]">المساءلة الشفهية</h2>
                                <button onClick={suggestOralQuestions} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-100">
                                    <Sparkles size={12} /> اقتراح أسئلة
                                </button>
                             </div>

                             <div className="space-y-6">
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2">1. أسئلة علوم التربية / البيداغوجيا</label>
                                     <VoiceTextarea 
                                        value={report.oralQuestions.educationScience} 
                                        onChange={v => updateOralField('educationScience', v)} 
                                        className="w-full border rounded-lg p-3 text-sm bg-blue-50/20" 
                                        placeholder="مثلاً: كيف تتعامل مع الفروق الفردية؟"
                                        minHeight="min-h-[80px]"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2">2. أسئلة علم النفس</label>
                                     <VoiceTextarea 
                                        value={report.oralQuestions.psychology} 
                                        onChange={v => updateOralField('psychology', v)} 
                                        className="w-full border rounded-lg p-3 text-sm bg-green-50/20" 
                                        placeholder="مثلاً: مراحل النمو عند بياجيه..."
                                        minHeight="min-h-[80px]"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2">3. أسئلة التشريع المدرسي</label>
                                     <VoiceTextarea 
                                        value={report.oralQuestions.legislation} 
                                        onChange={v => updateOralField('legislation', v)} 
                                        className="w-full border rounded-lg p-3 text-sm bg-orange-50/20" 
                                        placeholder="مثلاً: العطل الرسمية، الغيابات..."
                                        minHeight="min-h-[80px]"
                                     />
                                 </div>
                             </div>
                        </div>
                     </div>
                )}

                {activeTab === 'decision' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-[#4d6a4d] border-b pb-2 mb-6">التنقيط والقرار النهائي</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <label className="block text-sm font-bold text-gray-600 mb-2">العلامة البيداغوجية (الدروس)</label>
                                    <div className="flex items-center justify-center gap-2">
                                        <input 
                                            type="number" max="40" 
                                            value={report.pedagogyMark} 
                                            onChange={e => {
                                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                onChange({ ...report, pedagogyMark: val, totalMark: val + (report.oralMark || 0) });
                                            }} 
                                            className="w-20 text-center text-3xl font-bold border-b-2 border-green-500 bg-transparent focus:outline-none"
                                        />
                                        <span className="text-gray-400 font-bold text-xl">/ 40</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <label className="block text-sm font-bold text-gray-600 mb-2">علامة المساءلة الشفهية</label>
                                    <div className="flex items-center justify-center gap-2">
                                        <input 
                                            type="number" max="20" 
                                            value={report.oralMark} 
                                            onChange={e => {
                                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                onChange({ ...report, oralMark: val, totalMark: (report.pedagogyMark || 0) + val });
                                            }} 
                                            className="w-20 text-center text-3xl font-bold border-b-2 border-blue-500 bg-transparent focus:outline-none"
                                        />
                                        <span className="text-gray-400 font-bold text-xl">/ 20</span>
                                    </div>
                                </div>

                                <div className="bg-[#2d4a2d] text-white p-4 rounded-xl shadow-lg transform scale-105 flex flex-col justify-center">
                                    <label className="block text-xs font-bold text-green-200 mb-2">المجموع النهائي</label>
                                    <div className="text-5xl font-bold">
                                        {report.totalMark} <span className="text-lg text-green-300">/ 60</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">قيمة المترشح الثقافية</label>
                                    <select value={report.culturalValue} onChange={e => updateField('culturalValue', e.target.value)} className="w-full border p-2 rounded">
                                        <option value="ممتازة">ممتازة</option>
                                        <option value="جيدة جداً">جيدة جداً</option>
                                        <option value="جيدة">جيدة</option>
                                        <option value="متوسطة">متوسطة</option>
                                        <option value="مرضية">مرضية</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">قيمة المترشح التربوية</label>
                                    <select value={report.pedagogicalValue} onChange={e => updateField('pedagogicalValue', e.target.value)} className="w-full border p-2 rounded">
                                        <option value="ممتازة">ممتازة</option>
                                        <option value="جيدة جداً">جيدة جداً</option>
                                        <option value="جيدة">جيدة</option>
                                        <option value="متوسطة">متوسطة</option>
                                        <option value="مرضية">مرضية</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 border-t pt-6">
                                <label className="block text-lg font-bold text-center mb-4">قرار اللجنة النهائي</label>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => updateField('finalDecision', 'confirmed')} className={`px-8 py-4 rounded-xl border-2 font-bold text-lg transition-all ${report.finalDecision === 'confirmed' ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200'}`}>نجاح (تثبيت)</button>
                                    <button onClick={() => updateField('finalDecision', 'deferred')} className={`px-8 py-4 rounded-xl border-2 font-bold text-lg transition-all ${report.finalDecision === 'deferred' ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200'}`}>تأجيل</button>
                                     <button onClick={() => updateField('finalDecision', 'failed')} className={`px-8 py-4 rounded-xl border-2 font-bold text-lg transition-all ${report.finalDecision === 'failed' ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200'}`}>إخفاق</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TenureReportEditor;
