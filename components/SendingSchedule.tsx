
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Check, School, Building2, ArrowRight, Settings, Lock, Hash, History, FolderPlus, Plus, Trash2, User } from 'lucide-react';
import { Teacher, ReportData, TenureReportData } from '../types';
import VoiceInput from './VoiceInput';
import { addMailRecord, getNextMailNumber } from '../services/mailStorage';

interface SendingScheduleProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    tenureReportsMap: Record<string, TenureReportData>;
    inspectorName: string;
    wilaya: string;
    district: string;
    onBack: () => void;
    signature?: string; 
    isExpired?: boolean;
    onUpgradeClick?: () => void;
}

type RecipientType = 'school_director' | 'education_director' | 'other_entity';
type DocType = 'visit_report' | 'tenure_report' | 'other_docs';

interface CustomDoc {
    id: string;
    name: string;
    count: string;
}

const DEPARTMENTS = [
    "مصلحة الموظفين والتفتيش",
    "مصلحة الدراسة والامتحانات",
    "مصلحة التكوين والتفتيش",
    "مصلحة التمدرس",
    "مصلحة الامتحانات",
    "الأمانة العامة"
];

const SendingSchedule: React.FC<SendingScheduleProps> = ({ 
    teachers, reportsMap, tenureReportsMap, inspectorName, wilaya, district, onBack, signature,
    isExpired = false, onUpgradeClick
}) => {
    // --- STATE ---
    const [recipientType, setRecipientType] = useState<RecipientType>('education_director');
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('مصلحة الموظفين والتفتيش');
    const [otherEntityName, setOtherEntityName] = useState<string>(''); // For custom recipient

    const [docType, setDocType] = useState<DocType>('visit_report');
    
    // Custom Docs State
    const [customDocs, setCustomDocs] = useState<CustomDoc[]>([]);
    const [newDocName, setNewDocName] = useState('');
    const [newDocCount, setNewDocCount] = useState('1');

    // Header Reference Number
    const [refNumber, setRefNumber] = useState<string>('');
    const currentYear = new Date().getFullYear();
    const [suggestedNum, setSuggestedNum] = useState<string>('');

    const [copyCount, setCopyCount] = useState<string>('03'); 
    const [notes, setNotes] = useState<string>('يرجى موافاتنا بنسخة مؤشرة من هذا الجدول');

    const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());

    // --- AUTO NUMBERING LOGIC ---
    useEffect(() => {
        const next = getNextMailNumber('outgoing', currentYear);
        setSuggestedNum(next);
        if (!refNumber) {
            setRefNumber(next);
        }
    }, [currentYear]);

    // --- DERIVED DATA ---
    const availableSchools = useMemo(() => {
        const schools = new Set<string>();
        Object.values(reportsMap).forEach((r: ReportData) => { if(r.school) schools.add(r.school.trim()); });
        return Array.from(schools).sort();
    }, [reportsMap]);

    const eligibleTeachers = useMemo(() => {
        return teachers.filter(t => {
            if (recipientType === 'school_director' && selectedSchool) {
                const teacherSchool = reportsMap[t.id]?.school || tenureReportsMap[t.id]?.school;
                if (teacherSchool !== selectedSchool) return false;
            }
            if (docType === 'visit_report') {
                const report = reportsMap[t.id];
                return report && report.inspectionDate && report.inspectionDate.trim() !== '';
            } else if (docType === 'tenure_report') {
                const tenureReport = tenureReportsMap[t.id];
                return (t.tenureDate && t.tenureDate.trim() !== '') || (tenureReport && tenureReport.examDate);
            }
            return false;
        }).map(t => ({
            ...t,
            schoolName: reportsMap[t.id]?.school || tenureReportsMap[t.id]?.school || 'غير محددة',
            reportDate: docType === 'visit_report' ? reportsMap[t.id]?.inspectionDate : (tenureReportsMap[t.id]?.examDate || t.tenureDate)
        }));
    }, [teachers, reportsMap, tenureReportsMap, recipientType, selectedSchool, docType]);

    // --- HANDLERS ---
    const toggleTeacher = (id: string) => {
        const newSet = new Set(selectedTeacherIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTeacherIds(newSet);
    };

    const selectAll = () => {
        const allIds = eligibleTeachers.map(t => t.id);
        setSelectedTeacherIds(new Set(allIds));
    };

    const deselectAll = () => {
        setSelectedTeacherIds(new Set());
    };

    const handleAddCustomDoc = () => {
        if (!newDocName) return;
        const newDoc: CustomDoc = {
            id: Math.random().toString(36).substr(2, 9),
            name: newDocName,
            count: newDocCount
        };
        setCustomDocs([...customDocs, newDoc]);
        setNewDocName('');
        setNewDocCount('1');
    };

    const handleDeleteCustomDoc = (id: string) => {
        setCustomDocs(customDocs.filter(d => d.id !== id));
    };

    const handlePrint = () => {
        if (isExpired && onUpgradeClick) {
            onUpgradeClick();
        } else {
            window.print();
            // Auto Archive
            if (confirm("هل تريد حفظ هذا الجدول تلقائياً في سجل الصادر؟")) {
                let recipient = '';
                if (recipientType === 'education_director') recipient = `مدير التربية (${selectedDepartment})`;
                else if (recipientType === 'school_director') recipient = `مدير مدرسة ${selectedSchool}`;
                else recipient = otherEntityName || 'جهة أخرى';

                let subject = '';
                if (docType === 'visit_report') subject = "جدول إرسال (تقارير تفتيش)";
                else if (docType === 'tenure_report') subject = "جدول إرسال (تقارير تثبيت)";
                else subject = "جدول إرسال (وثائق إدارية)";
                
                addMailRecord('outgoing', recipient, subject, false);
                alert("تم الحفظ في سجل الصادر.");
            }
        }
    };

    // --- RENDER CONTENT (Shared between Screen and Print) ---
    const selectedTeachersList = eligibleTeachers.filter(t => selectedTeacherIds.has(t.id));
    
    // Calculate Grand Total
    let grandTotal = 0;
    if (docType === 'other_docs') {
        grandTotal = customDocs.reduce((acc, doc) => acc + (parseInt(doc.count) || 0), 0);
    } else {
        const teachersCount = selectedTeachersList.length;
        const copiesPerTeacher = parseInt(copyCount) || 0;
        grandTotal = teachersCount * copiesPerTeacher;
    }

    const PaperContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="text-center mb-8 shrink-0">
                <h3 className="font-bold text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                <h3 className="font-bold text-sm mb-4">وزارة التربية الوطنية</h3>
                
                <div className="flex justify-between items-start text-xs font-bold px-2 mt-6">
                    <div className="text-right">
                        <p>مديرية التربية لولاية {wilaya}</p>
                        <p>مفتشية التعليم الابتدائي</p>
                        <p>المقاطعة: {district}</p>
                        <p className="mt-1">الرقم: <span className="font-mono text-sm">{refNumber || '....'}</span> / {currentYear}</p>
                    </div>
                    
                    <div className="text-center pt-6 pl-4">
                        <p>مفتش المقاطعة</p>
                        <p>إلى السيد:</p>
                        <div className="flex flex-col items-center">
                            <p className="text-sm mt-1 mb-1 font-bold">
                                {recipientType === 'education_director' ? 'مدير التربية' : 
                                 recipientType === 'school_director' ? `مدير مدرسة ${selectedSchool}` :
                                 otherEntityName || '...........................'}
                            </p>
                            {recipientType === 'education_director' && (
                                <p className="text-xs font-normal">({selectedDepartment})</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8 shrink-0">
                <h1 className="text-2xl font-bold underline decoration-2 underline-offset-8">جــــدول إرســــال</h1>
            </div>

            {/* Table */}
            <div className="border-2 border-black flex-1 flex flex-col min-h-0">
                <div className="flex border-b-2 border-black bg-gray-100 text-center font-bold text-sm shrink-0">
                    <div className="w-16 border-l-2 border-black py-2">الرقم</div>
                    <div className="flex-1 border-l-2 border-black py-2">بيان الوثائق المرسلة</div>
                    <div className="w-20 border-l-2 border-black py-2">العدد</div>
                    <div className="w-36 py-2">ملاحظات</div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Number Col */}
                    <div className="w-16 border-l-2 border-black text-center py-4 font-bold text-sm">
                        {docType === 'other_docs' ? (
                            <div className="space-y-3">
                                {customDocs.map((_, idx) => <div key={idx} className="h-6">{String(idx + 1).padStart(2, '0')}</div>)}
                            </div>
                        ) : '01'}
                    </div>
                    
                    {/* Content Col */}
                    <div className="flex-1 border-l-2 border-black p-4 text-sm font-bold leading-loose overflow-visible">
                        
                        {/* Fixed Introductory Phrase */}
                        <p className="mb-6 text-base">تجدون رفقة هذا الجدول الوثائق التالية:</p>

                        {docType === 'other_docs' ? (
                            <div className="space-y-3 mr-4">
                                {customDocs.map(doc => (
                                    <div key={doc.id} className="h-6">- {doc.name}</div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <p className="mb-4 text-sm underline underline-offset-4">
                                    {docType === 'visit_report' 
                                        ? 'تقارير التفتيش الخاصة بالأساتذة المذكورة أسماؤهم أدناه:' 
                                        : 'تقارير التثبيت الخاصة بالأساتذة المذكورة أسماؤهم أدناه:'}
                                </p>
                                
                                <div className="space-y-3 mr-4">
                                    {selectedTeachersList.map(t => (
                                        <div key={t.id} className="h-6 flex items-center">
                                            <span>- {t.fullName}</span>
                                            {recipientType === 'education_director' && (
                                                <span className="text-[10px] font-normal mx-2 text-gray-600">({t.schoolName})</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Count Col */}
                    <div className="w-20 border-l-2 border-black pt-4 pb-4 flex flex-col">
                        {docType === 'other_docs' ? (
                             <div className="space-y-3 text-center text-sm font-bold pt-10">
                                {customDocs.map(doc => (
                                    <div key={doc.id} className="h-6">{parseInt(doc.count) > 9 ? doc.count : `0${doc.count}`}</div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="h-10 mb-4"></div>
                                <div className="space-y-3 text-center text-sm font-bold pt-6">
                                    {selectedTeachersList.map(t => (
                                        <div key={t.id} className="h-6 flex items-center justify-center">
                                            {copyCount.padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Notes Col */}
                    <div className="w-36 p-2 text-center text-xs font-bold leading-relaxed flex items-center justify-center">
                        {notes}
                    </div>
                </div>

                {/* Total Row */}
                <div className="flex border-t-2 border-black h-10 font-bold text-sm shrink-0">
                    <div className="flex-1 border-l-2 border-black flex items-center justify-center bg-gray-50">المجمــــوع الكلي</div>
                    <div className="w-20 border-l-2 border-black flex items-center justify-center text-lg">
                        {grandTotal > 0 ? String(grandTotal).padStart(2, '0') : ''}
                    </div>
                    <div className="w-36 bg-gray-50"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-between px-8 shrink-0">
                <div className="text-center font-bold text-sm">
                    <p>المستلم</p>
                </div>
                <div className="text-center font-bold text-sm w-1/3 relative">
                    <p className="mb-8">{wilaya} في: {new Date().toLocaleDateString('ar-DZ')}</p>
                    <p className="mb-2">مفتش المقاطعة</p>
                    <p className="text-xs text-gray-400 mt-8"></p>
                    
                    {/* SIGNATURE OVERLAY */}
                    {signature && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-28 pointer-events-none mix-blend-multiply mt-4">
                            <img src={signature} className="w-full h-full object-contain opacity-90 -rotate-6" alt="Signature" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
            
            {/* 1. CONTROL PANEL (RIGHT) */}
            <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto print:hidden shadow-lg z-10">
                <div className="p-4 bg-slate-800 text-white shrink-0 flex items-center gap-3">
                    <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg">جدول الإرسال</h2>
                        <p className="text-slate-400 text-[10px]">إعداد وطباعة الجداول</p>
                    </div>
                </div>

                <div className="p-5 space-y-6 flex-1">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase block">1. المرسل إليه</label>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-2">
                             <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Hash size={10}/> رقم الجدول التسلسلي</label>
                                {suggestedNum && (
                                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                        <History size={8}/> التالي: {suggestedNum}
                                    </span>
                                )}
                             </div>
                             <VoiceInput value={refNumber} onChange={setRefNumber} placeholder="مثلاً: 45" className="w-full" />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => { setRecipientType('education_director'); }}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${recipientType === 'education_director' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Building2 size={18} />
                                <span className="text-[10px] font-bold">مدير التربية</span>
                            </button>
                            <button 
                                onClick={() => { setRecipientType('school_director'); }}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${recipientType === 'school_director' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                                <School size={18} />
                                <span className="text-[10px] font-bold">مدير مدرسة</span>
                            </button>
                            <button 
                                onClick={() => { setRecipientType('other_entity'); }}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${recipientType === 'other_entity' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                                <User size={18} />
                                <span className="text-[10px] font-bold">جهة أخرى</span>
                            </button>
                        </div>

                        {recipientType === 'education_director' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                </select>
                            </div>
                        )}
                        {recipientType === 'school_director' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <select value={selectedSchool} onChange={(e) => { setSelectedSchool(e.target.value); setSelectedTeacherIds(new Set()); }} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- اختر المدرسة --</option>
                                    {availableSchools.map(sch => <option key={sch} value={sch}>{sch}</option>)}
                                </select>
                            </div>
                        )}
                        {recipientType === 'other_entity' && (
                             <div className="animate-in fade-in slide-in-from-top-2">
                                 <VoiceInput value={otherEntityName} onChange={setOtherEntityName} placeholder="اكتب اسم الجهة هنا..." className="w-full" />
                             </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase block">2. محتوى الإرسال</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                            <button onClick={() => { setDocType('visit_report'); setSelectedTeacherIds(new Set()); }} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${docType === 'visit_report' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>تقرير زيارة</button>
                            <button onClick={() => { setDocType('tenure_report'); setSelectedTeacherIds(new Set()); }} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${docType === 'tenure_report' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>تقرير تثبيت</button>
                            <button onClick={() => { setDocType('other_docs'); }} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${docType === 'other_docs' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>وثائق أخرى</button>
                        </div>
                    </div>

                    {docType !== 'other_docs' && (
                        <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Settings size={14}/> إعدادات النسخ</label>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 mb-1">عدد النسخ لكل أستاذ</label>
                                <input type="number" min="1" value={copyCount} onChange={(e) => setCopyCount(e.target.value)} className="w-full p-2 border rounded text-sm font-bold text-center" />
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">الملاحظات (العمود الرابع)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded text-xs h-16 resize-none" />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        {docType === 'other_docs' ? (
                             <div className="space-y-3 border-t pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><FolderPlus size={14}/> إضافة وثائق</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <VoiceInput value={newDocName} onChange={setNewDocName} placeholder="اسم الوثيقة..." className="w-full" />
                                    </div>
                                    <div className="w-16">
                                        <input type="number" min="1" value={newDocCount} onChange={(e) => setNewDocCount(e.target.value)} className="w-full p-2 border rounded text-sm font-bold text-center h-[38px]" placeholder="العدد" />
                                    </div>
                                    <button onClick={handleAddCustomDoc} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 h-[38px] w-[38px] flex items-center justify-center">
                                        <Plus size={20}/>
                                    </button>
                                </div>
                                
                                <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto">
                                    {customDocs.map((doc, idx) => (
                                        <div key={doc.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-slate-400">{idx + 1}.</span>
                                                <span className="font-bold text-slate-700">{doc.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-white px-2 py-0.5 rounded border font-mono font-bold">{doc.count}</span>
                                                <button onClick={() => handleDeleteCustomDoc(doc.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {customDocs.length === 0 && <p className="text-center text-xs text-slate-400 py-2">لم تتم إضافة وثائق بعد</p>}
                                </div>
                             </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">تحديد المعنيين ({eligibleTeachers.length})</label>
                                    <div className="flex gap-1">
                                        <button onClick={selectAll} className="text-[10px] text-blue-600 hover:underline">الكل</button>
                                        <span className="text-slate-300">|</span>
                                        <button onClick={deselectAll} className="text-[10px] text-slate-400 hover:text-slate-600">لا أحد</button>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-lg flex-1 overflow-y-auto p-2 bg-white min-h-[150px]">
                                    {eligibleTeachers.length > 0 ? eligibleTeachers.map(t => (
                                        <div key={t.id} onClick={() => toggleTeacher(t.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 transition-colors ${selectedTeacherIds.has(t.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTeacherIds.has(t.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{selectedTeacherIds.has(t.id) && <Check size={12} className="text-white" />}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{t.fullName}</p>
                                                <p className="text-[10px] text-slate-500 flex justify-between"><span>{t.schoolName}</span><span>{t.reportDate}</span></p>
                                            </div>
                                        </div>
                                    )) : <div className="text-center py-8 text-slate-400 text-xs">لا توجد نتائج مطابقة للشروط</div>}
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={handlePrint} disabled={docType !== 'other_docs' && selectedTeacherIds.size === 0} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                        {isExpired ? <Lock size={18} /> : <Printer size={18} />}
                        طباعة الجدول
                    </button>
                </div>
            </div>

            {/* 2. PREVIEW AREA (SCREEN) */}
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center items-start print:hidden">
                <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[15mm] relative text-black font-serif flex flex-col">
                    {PaperContent}
                </div>
            </div>

            {/* 3. PRINT AREA (PORTAL - GUARANTEED VISIBILITY) */}
            {createPortal(
                <div className="hidden print:flex fixed inset-0 w-full h-full bg-white z-[9999] p-[15mm] flex-col text-black font-serif">
                    {PaperContent}
                </div>,
                document.body
            )}
        </div>
    );
};

export default SendingSchedule;
