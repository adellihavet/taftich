import React, { useState, useEffect, useRef } from 'react';
import { ReportData, Teacher } from '../types';
import { generateReportAssessment, suggestImprovement } from '../services/geminiService';
import { Wand2, Printer, RefreshCcw, Loader2, Sparkles, Cloud, MapPin, User, Briefcase, BookOpen, Stamp, ChevronDown, PenTool } from 'lucide-react';
import { OBSERVATION_SUGGESTIONS, MODERN_SUBJECTS, MODERN_DEGREES, MODERN_RANKS, MODERN_LEVELS } from '../constants';
import VoiceTextarea from './VoiceTextarea';
import VoiceInput from './VoiceInput';

interface ReportEditorProps {
    report: ReportData;
    teacher: Teacher;
    onChange: (report: ReportData) => void;
    onTeacherChange?: (teacher: Teacher) => void;
    onPrint: () => void;
    isGoldMember: boolean;
    onUpgradeClick: () => void;
    onUploadSignature?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReportEditor: React.FC<ReportEditorProps> = ({ 
    report, 
    teacher, 
    onChange, 
    onTeacherChange, 
    onPrint,
    isGoldMember,
    onUpgradeClick,
    onUploadSignature
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'rubric' | 'result'>('info');
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
    const [editMode, setEditMode] = useState<'manual' | 'ai'>('manual');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
    const reportRef = useRef(report);

    useEffect(() => {
        reportRef.current = report;
    }, [report]);

    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            localStorage.setItem('mufattish_draft', JSON.stringify(report));
            setSaveStatus('saved');
        }, 1000);
        return () => clearTimeout(timer);
    }, [report]);

    useEffect(() => {
        if (editMode === 'ai' && !isGoldMember) {
            setEditMode('manual');
        }
    }, [isGoldMember, editMode]);

    const updateField = (field: keyof ReportData, value: any) => {
        onChange({ ...report, [field]: value });
    };
    
    const updateTeacherField = (field: keyof Teacher, value: any) => {
        if (onTeacherChange) {
            onTeacherChange({ ...teacher, [field]: value });
        }
    };

    const handleModeChange = (mode: 'manual' | 'ai') => {
        if (mode === 'ai' && !isGoldMember) {
            onUpgradeClick();
            return;
        }
        setEditMode(mode);
    };

    const updateScore = async (obsId: string, score: 2 | 1 | 0 | null) => {
        const newObservations = report.observations.map(o => o.id === obsId ? { ...o, score } : o);
        onChange({ ...report, observations: newObservations });
        
        if (editMode === 'ai' && score !== null && score < 2) {
            const targetObs = newObservations.find(o => o.id === obsId);
            if (targetObs && !targetObs.improvementNotes.trim()) {
                 setGeneratingIds(prev => new Set(prev).add(obsId));
                 try {
                     const note = await suggestImprovement(targetObs.criteria);
                     if(note) {
                         const currentReportState = reportRef.current;
                         const updatedWithNote = currentReportState.observations.map(o => 
                             o.id === obsId ? {...o, improvementNotes: note} : o
                         );
                         onChange({...currentReportState, observations: updatedWithNote});
                     }
                 } catch (error) {
                     console.error("Failed to generate suggestion", error);
                 } finally {
                     setGeneratingIds(prev => {
                         const next = new Set(prev);
                         next.delete(obsId);
                         return next;
                     });
                 }
            }
        }
    };

    const updateObsNote = (obsId: string, text: string) => {
        const newObservations = report.observations.map(o => 
            o.id === obsId ? { ...o, improvementNotes: text } : o
        );
        onChange({ ...report, observations: newObservations });
    };

    const handleGenerateAssessment = async () => {
        if (!isGoldMember) {
            onUpgradeClick();
            return;
        }
        setIsGenerating(true);
        try {
            const text = await generateReportAssessment(report, teacher);
            updateField('generalAssessment', text);
            const totalScore = report.observations.reduce((acc, curr) => acc + (curr.score || 0), 0);
            const maxScore = report.observations.length * 2;
            const computedMark = Math.round((totalScore / maxScore) * 20 * 10) / 10;
            updateField('finalMark', computedMark);
            setActiveTab('result');
        } catch (e) {
            alert("تعذر توليد التقييم، تأكد من مفتاح API");
        } finally {
            setIsGenerating(false);
        }
    };

    const categories = Array.from(new Set(report.observations.map(o => o.category)));

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>1. البيانات</button>
                    <button onClick={() => setActiveTab('rubric')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'rubric' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>2. الشبكة</button>
                    <button onClick={() => setActiveTab('result')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'result' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>3. القرار</button>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-medium transition-colors duration-500">
                        {saveStatus === 'saving' ? (
                            <>
                                <RefreshCcw size={14} className="animate-spin text-blue-500" />
                                <span className="text-blue-500 hidden md:inline">جاري الحفظ...</span>
                            </>
                        ) : (
                            <>
                                <Cloud size={14} className="text-green-600" />
                                <span className="text-green-600 hidden md:inline">تم الحفظ</span>
                            </>
                        )}
                    </div>
                    
                    {onUploadSignature && (
                        <div className="relative">
                            <input type="file" ref={fileInputRef} onChange={onUploadSignature} className="hidden" accept="image/*" />
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors" title="رفع صورة الختم/الإمضاء">
                                <Stamp size={18} />
                                <span className="hidden md:inline font-bold text-sm">ختم/إمضاء</span>
                            </button>
                        </div>
                    )}

                    <button onClick={onPrint} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900">
                        <Printer size={18} />
                        طباعة
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                
                {/* Tab 1: Info */}
                {activeTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* REMOVED overflow-hidden, ADDED rounded-tr-xl to icon to maintain shape */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                             <div className="absolute top-0 right-0 bg-blue-50 p-2 rounded-bl-xl rounded-tr-xl border-l border-b border-blue-100 text-blue-700">
                                <MapPin size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 pr-10">البيانات الإدارية</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <VoiceInput label="ولاية مديرية التربية" value={report.wilaya} onChange={v => updateField('wilaya', v)} />
                                <VoiceInput label="المقاطعة التفتيشية" value={report.district} onChange={v => updateField('district', v)} />
                                <VoiceInput label="المدرسة الابتدائية" value={report.school} onChange={v => updateField('school', v)} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                            <div className="absolute top-0 right-0 bg-indigo-50 p-2 rounded-bl-xl rounded-tr-xl border-l border-b border-indigo-100 text-indigo-700">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 pr-10">المعلومات الشخصية</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <VoiceInput label="الاسم واللقب" value={teacher.fullName} onChange={v => updateTeacherField('fullName', v)} />
                                </div>
                                <VoiceInput type="date" label="تاريخ الميلاد" value={teacher.birthDate} onChange={v => updateTeacherField('birthDate', v)} />
                                <VoiceInput label="مكان الميلاد" value={teacher.birthPlace} onChange={v => updateTeacherField('birthPlace', v)} />
                                <VoiceInput label="الشهادة العلمية" value={teacher.degree} onChange={v => updateTeacherField('degree', v)} options={MODERN_DEGREES} />
                                <VoiceInput type="date" label="تاريخ الشهادة" value={teacher.degreeDate || ''} onChange={v => updateTeacherField('degreeDate', v)} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                            <div className="absolute top-0 right-0 bg-green-50 p-2 rounded-bl-xl rounded-tr-xl border-l border-b border-green-100 text-green-700">
                                <Briefcase size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 pr-10">المعلومات المهنية</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <VoiceInput type="date" label="تاريخ أول تعيين" value={teacher.recruitmentDate} onChange={v => updateTeacherField('recruitmentDate', v)} />
                                <VoiceInput label="الرتبة الحالية" value={teacher.rank} onChange={v => updateTeacherField('rank', v)} options={MODERN_RANKS} />
                                <VoiceInput type="date" label="تاريخ التعيين في الرتبة" value={teacher.currentRankDate || ''} onChange={v => updateTeacherField('currentRankDate', v)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <VoiceInput label="الدرجة" value={teacher.echelon || ''} onChange={v => updateTeacherField('echelon', v)} options={Array.from({length: 12}, (_, i) => (i + 1).toString())} />
                                    <VoiceInput type="date" label="تاريخها" value={teacher.echelonDate || ''} onChange={v => updateTeacherField('echelonDate', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <VoiceInput type="date" label="تاريخ آخر تفتيش" value={teacher.lastInspectionDate} onChange={v => updateTeacherField('lastInspectionDate', v)} />
                                     <VoiceInput type="number" label="النقطة السابقة" value={teacher.lastMark.toString()} onChange={v => updateTeacherField('lastMark', parseFloat(v))} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">الوضعية المهنية</label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-lg border">
                                        <label className="flex-1 cursor-pointer">
                                            <input type="radio" name="status" value="titulaire" checked={teacher.status === 'titulaire'} onChange={() => updateTeacherField('status', 'titulaire')} className="hidden peer" />
                                            <div className="text-center py-2 text-sm rounded-md peer-checked:bg-green-500 peer-checked:text-white transition-colors text-gray-600 font-medium">مرسم</div>
                                        </label>
                                        <label className="flex-1 cursor-pointer">
                                            <input type="radio" name="status" value="contractuel" checked={teacher.status === 'contractuel'} onChange={() => updateTeacherField('status', 'contractuel')} className="hidden peer" />
                                            <div className="text-center py-2 text-sm rounded-md peer-checked:bg-orange-500 peer-checked:text-white transition-colors text-gray-600 font-medium">متعاقد</div>
                                        </label>
                                        <label className="flex-1 cursor-pointer">
                                            <input type="radio" name="status" value="stagiere" checked={teacher.status === 'stagiere'} onChange={() => updateTeacherField('status', 'stagiere')} className="hidden peer" />
                                            <div className="text-center py-2 text-sm rounded-md peer-checked:bg-blue-500 peer-checked:text-white transition-colors text-gray-600 font-medium">متربص</div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                            <div className="absolute top-0 right-0 bg-yellow-50 p-2 rounded-bl-xl rounded-tr-xl border-l border-b border-yellow-100 text-yellow-700">
                                <BookOpen size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 pr-10">المعلومات البيداغوجية للحصة</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <VoiceInput type="date" label="تاريخ الزيارة" value={report.inspectionDate} onChange={v => updateField('inspectionDate', v)} />
                                <VoiceInput label="النشاط / المادة" value={report.subject} onChange={v => updateField('subject', v)} options={MODERN_SUBJECTS} />
                                <VoiceInput label="الموضوع" value={report.topic} onChange={v => updateField('topic', v)} />
                                <VoiceInput label="التوقيت (المدة)" value={report.duration} onChange={v => updateField('duration', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <VoiceInput label="المستوى" value={report.level} onChange={v => updateField('level', v)} options={MODERN_LEVELS} />
                                    <VoiceInput label="الفوج" value={report.group} onChange={v => updateField('group', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <VoiceInput type="number" label="عدد التلاميذ (حاضرون)" value={report.studentCount.toString()} onChange={v => updateField('studentCount', parseInt(v))} />
                                    <VoiceInput type="number" label="عدد الغائبين" value={report.absentCount.toString()} onChange={v => updateField('absentCount', parseInt(v))} />
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Tab 2: Rubric */}
                {activeTab === 'rubric' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        
                        <div className="bg-white p-3 rounded-lg shadow-sm border mb-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700 flex items-center gap-2"><PenTool size={16}/> وضع التقييم:</span>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => handleModeChange('manual')} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${editMode === 'manual' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>يدوي</button>
                                    <button onClick={() => handleModeChange('ai')} className={`px-3 py-1 rounded-md text-sm font-bold transition-all flex items-center gap-1 ${editMode === 'ai' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                        <Sparkles size={12} /> ذكي (AI)
                                    </button>
                                </div>
                            </div>
                            {editMode === 'ai' && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1"><Sparkles size={10} /> سيتم اقتراح ملاحظات عند اختيار تقييم منخفض</span>}
                        </div>

                        {categories.map((category, idx) => (
                            // Removed overflow-hidden here too to prevent clipping if we add dropdowns later
                            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
                                    <h3 className="font-bold text-lg text-gray-800">{idx + 1}. {category}</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {report.observations.filter(o => o.category === category).map(obs => {
                                        const suggestions = OBSERVATION_SUGGESTIONS[obs.criteria] || [];
                                        return (
                                        <div key={obs.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 mb-1">{obs.criteria}</h4>
                                                    <p className="text-sm text-gray-500">{obs.indicators.join(' - ')}</p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={() => updateScore(obs.id, 2)} className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${obs.score === 2 ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 hover:bg-green-50'}`}>متحقق (2)</button>
                                                    <button onClick={() => updateScore(obs.id, 1)} className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${obs.score === 1 ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 hover:bg-yellow-50'}`}>جزئي (1)</button>
                                                    <button onClick={() => updateScore(obs.id, 0)} className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${obs.score === 0 ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 hover:bg-red-50'}`}>غير متحقق (0)</button>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className="relative mb-2">
                                                    <select onChange={(e) => { if(e.target.value) updateObsNote(obs.id, e.target.value); }} className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm cursor-pointer" value="">
                                                        <option value="">-- اختر ملاحظة توجيهية جاهزة ({suggestions.length} مقترح) --</option>
                                                        {suggestions.map((sugg, i) => <option key={i} value={sugg}>{sugg.length > 80 ? sugg.substring(0,80) + '...' : sugg}</option>)}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700"><ChevronDown size={14} /></div>
                                                </div>
                                                <VoiceTextarea value={obs.improvementNotes} onChange={(val) => updateObsNote(obs.id, val)} placeholder="ملاحظات وتوجيهات (يمكنك استخدام الميكروفون)..." className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50" />
                                                {generatingIds.has(obs.id) && <div className="flex items-center gap-1 text-xs text-indigo-500 animate-pulse mt-1"><Sparkles size={12} /> جاري اقتراح تحسين...</div>}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab 3: Result */}
                {activeTab === 'result' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">القرار النهائي</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">توجيهات إضافية للذكاء الاصطناعي (اختياري)</label>
                                <VoiceTextarea value={report.assessmentKeywords || ''} onChange={val => updateField('assessmentKeywords', val)} placeholder="مثلاً: التركيز على ضعف التحكم في القسم..." className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" minHeight="min-h-[40px]" />
                            </div>
                            <div className="mb-4 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">التقدير العام (نص التقرير)</label>
                                <VoiceTextarea value={report.generalAssessment} onChange={val => updateField('generalAssessment', val)} className="w-full border rounded-lg p-4 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed text-justify" placeholder="سيتم كتابة التقرير هنا..." minHeight="min-h-[250px]" />
                                <button onClick={handleGenerateAssessment} disabled={isGenerating} className="absolute bottom-4 left-14 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                    {report.generalAssessment ? 'إعادة الصياغة بالذكاء الاصطناعي' : 'توليد التقرير بالذكاء الاصطناعي'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">العلامة بالأرقام (/20)</label>
                                    <input type="number" min="0" max="20" step="0.25" value={report.finalMark} onChange={e => updateField('finalMark', parseFloat(e.target.value))} className="w-full border rounded-lg p-2 text-2xl font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">العلامة بالحروف</label>
                                    <VoiceInput value={report.markInLetters} onChange={v => updateField('markInLetters', v)} className="w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ تحرير التقرير</label>
                                    <VoiceInput type="date" value={report.inspectionDate} onChange={v => updateField('inspectionDate', v)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportEditor;