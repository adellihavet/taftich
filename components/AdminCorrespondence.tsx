
import React, { useState, useMemo } from 'react';
import { Printer, ArrowRight, Building2, School, FileText, Paperclip, Hash } from 'lucide-react';
import { ReportData } from '../types';
import VoiceInput from './VoiceInput';
import VoiceTextarea from './VoiceTextarea';

interface AdminCorrespondenceProps {
    reportsMap: Record<string, ReportData>;
    inspectorName: string;
    wilaya: string;
    district: string;
    onBack: () => void;
}

const AdminCorrespondence: React.FC<AdminCorrespondenceProps> = ({ 
    reportsMap, inspectorName, wilaya, district, onBack
}) => {
    // --- STATE ---
    const [recipientMode, setRecipientMode] = useState<'school' | 'other'>('school');
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [customRecipient, setCustomRecipient] = useState<string>('');
    
    const [subject, setSubject] = useState<string>('');
    const [reference, setReference] = useState<string>('');
    const [attachments, setAttachments] = useState<string>('');
    const [body, setBody] = useState<string>(
        "يشرفني أن أوافيكم بـ..."
    );

    // --- DERIVED DATA ---
    // Extract unique schools from reports
    const availableSchools = useMemo(() => {
        const schools = new Set<string>();
        Object.values(reportsMap).forEach(r => { if(r.school) schools.add(r.school.trim()); });
        return Array.from(schools).sort();
    }, [reportsMap]);

    const handlePrint = () => {
        window.print();
    };

    // Render Recipient Block in Preview
    const renderRecipientPreview = () => {
        if (recipientMode === 'school') {
            return (
                <div className="text-center min-w-[250px]">
                    <p className="mb-1 text-sm">إلى السيد(ة):</p>
                    <div className="border-b border-black pb-1">
                        <p className="font-bold">مدير(ة) مدرسة {selectedSchool || '................'}</p>
                    </div>
                </div>
            );
        } else {
            // Split lines: First line bold, others smaller
            const lines = customRecipient.split('\n');
            const mainLine = lines[0];
            const subLines = lines.slice(1);

            return (
                <div className="text-center min-w-[250px]">
                    <p className="mb-1 text-sm">إلى السيد(ة):</p>
                    <div className="border-b border-black pb-1">
                        <p className="font-bold">{mainLine || '................................'}</p>
                        {subLines.map((line, idx) => (
                            <p key={idx} className="text-sm font-normal mt-0.5">{line}</p>
                        ))}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
            
            {/* 1. CONTROL PANEL (RIGHT) */}
            <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto print:hidden shadow-lg z-10">
                <div className="p-4 bg-slate-800 text-white shrink-0 flex items-center gap-3">
                    <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg">مراسلة إدارية</h2>
                        <p className="text-slate-400 text-[10px]">تحرير مراسلات رسمية حرة</p>
                    </div>
                </div>

                <div className="p-5 space-y-6 flex-1">
                    
                    {/* Step 1: Recipient */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase block">1. المرسل إليه</label>
                        
                        {/* Toggle Mode */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setRecipientMode('school')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${recipientMode === 'school' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                            >
                                <School size={14} /> مدرسة
                            </button>
                            <button 
                                onClick={() => setRecipientMode('other')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${recipientMode === 'other' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                            >
                                <Building2 size={14} /> جهة أخرى
                            </button>
                        </div>

                        {/* Input based on mode */}
                        {recipientMode === 'school' ? (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <select 
                                    value={selectedSchool}
                                    onChange={(e) => setSelectedSchool(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- اختر المدرسة --</option>
                                    {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] text-slate-400 mb-1 block">اضغط Enter لإضافة سطر جديد (مصلحة/قسم)</label>
                                <VoiceTextarea 
                                    value={customRecipient}
                                    onChange={setCustomRecipient}
                                    placeholder="مثلاً: السيد مدير التربية&#10;(مصلحة الموظفين)"
                                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Step 2: Meta Data */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase block">2. بيانات المراسلة</label>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><FileText size={10}/> الموضوع</label>
                            <VoiceInput value={subject} onChange={setSubject} placeholder="اكتب موضوع المراسلة..." />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Hash size={10}/> المرجع (اختياري)</label>
                            <VoiceInput value={reference} onChange={setReference} placeholder="رقم / سنة..." />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Paperclip size={10}/> المرفقات (اختياري)</label>
                            <VoiceInput value={attachments} onChange={setAttachments} placeholder="جداول، أقراص..." />
                        </div>
                    </div>

                    {/* Step 3: Body */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block">3. نص المراسلة</label>
                        <VoiceTextarea 
                            value={body} 
                            onChange={setBody} 
                            className="w-full p-3 border rounded-xl text-xs leading-relaxed min-h-[150px] resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="حرر محتوى المراسلة هنا..."
                        />
                    </div>

                    <button 
                        onClick={handlePrint}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-auto"
                    >
                        <Printer size={18} />
                        طباعة المراسلة
                    </button>
                </div>
            </div>

            {/* 2. PREVIEW AREA (LEFT) */}
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center items-start">
                
                {/* A4 Paper - Fixed Height for visual consistency, handled flex to avoid overflow */}
                <div className="bg-white shadow-2xl w-[210mm] h-[296mm] p-[15mm] relative text-black font-serif print:w-full print:h-full print:shadow-none print:m-0 flex flex-col justify-between">
                    
                    {/* Top Section Wrapper */}
                    <div>
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h3 className="font-bold text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                            <h3 className="font-bold text-sm mb-6">وزارة التربية الوطنية</h3>
                            
                            <div className="flex justify-between items-start text-sm font-bold px-2 border-b-2 border-black pb-4">
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

                        {/* Recipient */}
                        <div className="mb-8 text-lg pl-8 flex justify-end">
                            {renderRecipientPreview()}
                        </div>

                        {/* Subject, Ref, Attachments Block */}
                        <div className="mb-6 space-y-2">
                            <div className="flex gap-2 items-start">
                                <span className="font-bold underline text-base w-20 shrink-0">الموضوع:</span>
                                <span className="text-base font-bold leading-normal">{subject || '................................................................'}</span>
                            </div>
                            
                            {reference && (
                                <div className="flex gap-2 items-start">
                                    <span className="font-bold underline text-base w-20 shrink-0">المرجـع:</span>
                                    <span className="text-base leading-normal">{reference}</span>
                                </div>
                            )}

                            {attachments && (
                                <div className="flex gap-2 items-start">
                                    <span className="font-bold underline text-base w-20 shrink-0">المرفقات:</span>
                                    <span className="text-base leading-normal">{attachments}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body Text (Flex Grow) */}
                    <div className="flex-1 mb-4 text-justify text-lg leading-[2.2] font-medium indent-8 whitespace-pre-line overflow-hidden">
                        {body}
                    </div>

                    {/* Signature (Fixed Bottom) */}
                    <div className="flex justify-end pt-4 px-8 mt-auto shrink-0">
                        <div className="text-center w-64">
                            <p className="font-bold underline mb-8">مفتش المقاطعة</p>
                            {/* Signature Space */}
                            <div className="h-16 w-full"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminCorrespondence;