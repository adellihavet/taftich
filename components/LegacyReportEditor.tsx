import React, { useState, useRef } from 'react';
import { ReportData, Teacher, LegacyReportOptions } from '../types';
import { Printer, User, FileText, CheckSquare, Loader2, Wand2, Stamp } from 'lucide-react';
import VoiceTextarea from './VoiceTextarea';
import VoiceInput from './VoiceInput';
import { generateReportAssessment } from '../services/geminiService';
import { 
    LEGACY_SUBJECTS, LEGACY_DEGREES, LEGACY_LEVELS,
    LIST_CLASSROOM_STATUS, LIST_QUALITY_HIGH, LIST_QUALITY_AVAILABILITY, LIST_CLEANLINESS,
    LIST_PREPARATION_STATUS, LIST_PREPARATION_VALUE, LIST_DOCUMENTS, LIST_BOARD_WORK, LIST_OTHER_AIDS,
    LIST_REGISTERS_STATUS, LIST_REGISTERS_USED, LIST_MONITORING, LIST_PROGRAM_ADHERENCE, LIST_PROGRESSION, LIST_DUTIES_STATUS,
    LIST_INFO_VALUE, LIST_LESSON_SEQUENCE, LIST_OBJECTIVES, LIST_PARTICIPATION,
    LIST_APPLICATIONS, LIST_APPLICATIONS_SUITABILITY,
    LIST_NOTEBOOKS_CARE, LIST_HOMEWORK_VALUE, LIST_HOMEWORK_CORRECTION
} from '../legacyConstants';

interface LegacyReportEditorProps {
    report: ReportData;
    teacher: Teacher;
    onChange: (report: ReportData) => void;
    onTeacherChange?: (teacher: Teacher) => void;
    onPrint: () => void;
    isGoldMember: boolean;
    onUpgradeClick: () => void;
    onUploadSignature?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LegacyReportEditor: React.FC<LegacyReportEditorProps> = ({ 
    report, teacher, onChange, onTeacherChange, onPrint, isGoldMember, onUpgradeClick, onUploadSignature
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'grid' | 'evaluation'>('info');
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateField = (field: keyof ReportData, value: any) => {
        onChange({ ...report, [field]: value });
    };

    const updateLegacyField = (field: keyof LegacyReportOptions, value: string) => {
        onChange({
            ...report,
            legacyData: { ...report.legacyData!, [field]: value }
        });
    };

    const updateTeacherField = (field: keyof Teacher, value: any) => {
        if (onTeacherChange) onTeacherChange({ ...teacher, [field]: value });
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
        } catch (e) {
            alert("تعذر توليد التقييم");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="bg-gray-800 text-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                 <div className="flex gap-2">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <User size={18}/> المعلومات
                    </button>
                    <button onClick={() => setActiveTab('grid')} className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'grid' ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <CheckSquare size={18}/> الظروف والإنجاز
                    </button>
                    <button onClick={() => setActiveTab('evaluation')} className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'evaluation' ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <FileText size={18}/> التقييم والقرار
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">نموذج كلاسيكي</span>
                    
                    {onUploadSignature && (
                        <div className="relative">
                            <input type="file" ref={fileInputRef} onChange={onUploadSignature} className="hidden" accept="image/*" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="رفع صورة الإمضاء/الختم">
                                <Stamp size={20} />
                            </button>
                        </div>
                    )}

                    <button onClick={onPrint} className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 font-bold shadow-sm">
                        <Printer size={18} />
                        طباعة
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
                
                {/* 1. INFO */}
                {activeTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">المعلومات الإدارية والشخصية</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                                <VoiceInput label="الولاية" value={report.wilaya} onChange={v => updateField('wilaya', v)} />
                                <VoiceInput label="الدائرة" value={report.legacyData?.daira || ''} onChange={v => updateLegacyField('daira', v)} />
                                <VoiceInput label="البلدية" value={report.legacyData?.municipality || ''} onChange={v => updateLegacyField('municipality', v)} />
                                <VoiceInput label="المقاطعة" value={report.district} onChange={v => updateField('district', v)} />
                                <VoiceInput label="المدرسة" value={report.school} onChange={v => updateField('school', v)} />
                                <VoiceInput label="السنة الدراسية" value={report.legacyData?.schoolYear || ''} onChange={v => updateLegacyField('schoolYear', v)} />
                            </div>
                            <hr className="my-4"/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <VoiceInput label="الاسم واللقب" value={teacher.fullName} onChange={v => updateTeacherField('fullName', v)} />
                                <VoiceInput label="العائلية/الحالة" value={report.legacyData?.familyStatus || ''} onChange={v => updateLegacyField('familyStatus', v)} options={['متزوج(ة)', 'عازب(ة)', 'مطلق(ة)']} />
                                <VoiceInput type="date" label="تاريخ الميلاد" value={teacher.birthDate} onChange={v => updateTeacherField('birthDate', v)} />
                                <VoiceInput label="مكان الميلاد" value={teacher.birthPlace} onChange={v => updateTeacherField('birthPlace', v)} />
                                <VoiceInput type="date" label="تاريخ أول تعيين" value={teacher.recruitmentDate} onChange={v => updateTeacherField('recruitmentDate', v)} />
                                <VoiceInput label="الإطار (الرتبة)" value={teacher.rank} onChange={v => updateTeacherField('rank', v)} options={["أستاذ المدرسة الابتدائية", "أستاذ المدرسة الابتدائية قسم أول", "أستاذ المدرسة الابتدائية قسم ثان", "أستاذ مكون", "أستاذ مميز"]}/>
                                <VoiceInput label="الدرجة" value={teacher.echelon || ''} onChange={v => updateTeacherField('echelon', v)} options={Array.from({length: 12}, (_, i) => (i + 1).toString())} />
                                <VoiceInput type="date" label="تاريخ الدرجة" value={teacher.echelonDate || ''} onChange={v => updateTeacherField('echelonDate', v)} />
                                <VoiceInput label="المؤهل العلمي" value={teacher.degree} onChange={v => updateTeacherField('degree', v)} options={LEGACY_DEGREES} />
                                <VoiceInput type="date" label="تاريخه" value={teacher.degreeDate || report.legacyData?.graduationDate || ''} onChange={v => { updateLegacyField('graduationDate', v); updateTeacherField('degreeDate', v); }} />
                                <VoiceInput label="المعهد التكنولوجي" value={report.legacyData?.trainingInstitute || ''} onChange={v => updateLegacyField('trainingInstitute', v)} />
                                <VoiceInput type="date" label="تاريخ التخرج" value={report.legacyData?.trainingDate || ''} onChange={v => updateLegacyField('trainingDate', v)} />
                                <VoiceInput type="date" label="تاريخ آخر تفتيش" value={teacher.lastInspectionDate} onChange={v => updateTeacherField('lastInspectionDate', v)} />
                                <VoiceInput label="العلامة السابقة" value={teacher.lastMark.toString()} onChange={v => updateTeacherField('lastMark', parseFloat(v))} type="number" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GRID - EXACT MATCH WITH PRINTABLE DOC */}
                {activeTab === 'grid' && (
                    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in" dir="rtl">
                        
                        {/* RIGHT COLUMN */}
                        <div className="flex-1 space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">ظروف التفتيش</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <VoiceInput type="date" label="التاريخ" value={report.inspectionDate} onChange={v => updateField('inspectionDate', v)} />
                                    <VoiceInput label="المدة" value={report.duration} onChange={v => updateField('duration', v)} />
                                    <VoiceInput label="القسم" value={report.level} onChange={v => updateField('level', v)} options={LEGACY_LEVELS} />
                                    <VoiceInput type="number" label="عدد التلاميذ" value={report.studentCount.toString()} onChange={v => updateField('studentCount', parseInt(v))} />
                                </div>
                                <div className="mt-3 space-y-3">
                                    <VoiceInput label="القاعة هل هي صالحة من حيث الإستماع؟" value={report.legacyData?.classroomListening || ''} onChange={v => updateLegacyField('classroomListening', v)} options={LIST_CLASSROOM_STATUS} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <VoiceInput label="الإضاءة" value={report.legacyData?.lighting || ''} onChange={v => updateLegacyField('lighting', v)} options={LIST_QUALITY_HIGH} />
                                        <VoiceInput label="النظافة" value={report.legacyData?.cleanliness || ''} onChange={v => updateLegacyField('cleanliness', v)} options={LIST_CLEANLINESS} />
                                        <VoiceInput label="التدفئة" value={report.legacyData?.heating || ''} onChange={v => updateLegacyField('heating', v)} options={LIST_QUALITY_AVAILABILITY} />
                                        <VoiceInput label="التهوية" value={report.legacyData?.ventilation || ''} onChange={v => updateLegacyField('ventilation', v)} options={LIST_QUALITY_HIGH} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">تحضير الدروس</h3>
                                <div className="space-y-3">
                                    <VoiceInput label="نوع الدروس" value={report.subject} onChange={v => updateField('subject', v)} options={LEGACY_SUBJECTS} />
                                    <VoiceInput label="مواضيعها" value={report.topic} onChange={v => updateField('topic', v)} />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <VoiceInput label="التوزيع والوثائق والمعلقات" value={report.legacyData?.documentsAndPosters || ''} onChange={v => updateLegacyField('documentsAndPosters', v)} options={LIST_DOCUMENTS} />
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
                                <VoiceInput label="إعداد الدروس (الحالة)" value={report.legacyData?.lessonPreparation || ''} onChange={v => updateLegacyField('lessonPreparation', v)} options={LIST_PREPARATION_STATUS} />
                                <VoiceInput label="قيمة الإعداد" value={report.legacyData?.preparationValue || ''} onChange={v => updateLegacyField('preparationValue', v)} options={LIST_PREPARATION_VALUE} />
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
                                <VoiceInput label="السجلات" value={report.legacyData?.registers || ''} onChange={v => updateLegacyField('registers', v)} options={LIST_REGISTERS_STATUS} />
                                <VoiceInput label="هل هي مستعملة حسب التوجيهات؟" value={report.legacyData?.registersUsed || ''} onChange={v => updateLegacyField('registersUsed', v)} options={LIST_REGISTERS_USED} />
                                
                                <div className="bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                                    <label className="block text-[11px] font-bold text-blue-800 mb-2">هل هي مراقبة من حيث:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <VoiceInput label="البرامج المقررة؟" value={report.legacyData?.scheduledPrograms || ''} onChange={v => updateLegacyField('scheduledPrograms', v)} options={LIST_PROGRAM_ADHERENCE} />
                                        <VoiceInput label="التدرج؟" value={report.legacyData?.progression || ''} onChange={v => updateLegacyField('progression', v)} options={LIST_PROGRESSION} />
                                    </div>
                                </div>
                                
                                <VoiceInput label="الواجبات" value={report.legacyData?.duties || ''} onChange={v => updateLegacyField('duties', v)} options={LIST_DUTIES_STATUS} />
                            </div>
                        </div>

                        {/* LEFT COLUMN */}
                        <div className="flex-1 space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">إنجاز الدروس</h3>
                                <div className="space-y-3">
                                    <VoiceInput label="المعلومات، قيمتها" value={report.legacyData?.informationValue || ''} onChange={v => updateLegacyField('informationValue', v)} options={LIST_INFO_VALUE} />
                                    <VoiceInput label="هل تسلسلها منطقي؟" value={report.legacyData?.lessonExecution || ''} onChange={v => updateLegacyField('lessonExecution', v)} options={LIST_LESSON_SEQUENCE} />
                                    <VoiceInput label="هل حققت الدروس أهدافها؟" value={report.legacyData?.objectivesAchieved || ''} onChange={v => updateLegacyField('objectivesAchieved', v)} options={LIST_OBJECTIVES} />
                                    <VoiceInput label="مشاركة التلاميذ" value={report.legacyData?.studentParticipation || ''} onChange={v => updateLegacyField('studentParticipation', v)} options={LIST_PARTICIPATION} />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">التطبيقات</h3>
                                <div className="space-y-3">
                                    <VoiceInput label="هل توجد تطبيقات على الدروس؟" value={report.legacyData?.applications || ''} onChange={v => updateLegacyField('applications', v)} options={LIST_APPLICATIONS} />
                                    <VoiceInput label="هل هي مناسبة؟" value={report.legacyData?.applicationsSuitability || ''} onChange={v => updateLegacyField('applicationsSuitability', v)} options={LIST_APPLICATIONS_SUITABILITY} />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">الوسائل التعليمية</h3>
                                <div className="space-y-3">
                                    <VoiceInput label="السبورة" value={report.legacyData?.boardWork || ''} onChange={v => updateLegacyField('boardWork', v)} options={LIST_BOARD_WORK} />
                                    <div className="bg-gray-100 p-2 rounded border text-sm text-gray-600 font-bold flex justify-between items-center">
                                        <span>الكتاب:</span>
                                        <span>متوفر</span>
                                    </div>
                                    <VoiceInput label="وسائل أخرى" value={report.legacyData?.otherAids || ''} onChange={v => updateLegacyField('otherAids', v)} options={LIST_OTHER_AIDS} />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">أعمال التلاميذ</h3>
                                <div className="space-y-3">
                                    <VoiceInput label="دفاتر التلاميذ هل هي مراقبة؟" value={report.legacyData?.notebooksMonitored || ''} onChange={v => updateLegacyField('notebooksMonitored', v)} options={LIST_MONITORING} />
                                    <VoiceInput label="هل يعتني بها التلاميذ؟" value={report.legacyData?.notebooksCare || ''} onChange={v => updateLegacyField('notebooksCare', v)} options={LIST_NOTEBOOKS_CARE} />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-md text-gray-800 border-b pb-2 mb-3 bg-gray-50 p-2 rounded">الفروض المنزلية</h3>
                                <div className="space-y-3">
                                    <VoiceInput label="هل هي كافية ومناسبة؟" value={report.legacyData?.homeworkValue || ''} onChange={v => updateLegacyField('homeworkValue', v)} options={LIST_HOMEWORK_VALUE} />
                                    <VoiceInput label="هل هي مصححة؟" value={report.legacyData?.homeworkCorrection || ''} onChange={v => updateLegacyField('homeworkCorrection', v)} options={LIST_HOMEWORK_CORRECTION} />
                                    <VoiceInput label="قيمة التصحيح" value={report.legacyData?.homeworkValue || ''} onChange={v => updateLegacyField('homeworkValue', v)} options={['جيدة', 'متوسطة', 'ضعيفة']} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. EVALUATION */}
                {activeTab === 'evaluation' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">التقويم والقرار</h2>
                            
                            <div className="mb-6 relative">
                                <label className="block text-sm font-bold text-gray-700 mb-2">1. تقويم الدروس المشاهدة (النقد والتوجيه)</label>
                                <VoiceTextarea 
                                    value={report.generalAssessment} 
                                    onChange={v => updateField('generalAssessment', v)} 
                                    className="w-full border rounded-lg p-4 leading-relaxed bg-gray-50 text-sm" 
                                    minHeight="min-h-[200px]"
                                    placeholder="اكتب النقد البيداغوجي والتوجيهات هنا..."
                                />
                                <button 
                                    onClick={handleGenerateAssessment}
                                    disabled={isGenerating}
                                    className="absolute bottom-4 left-14 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-black transition-colors shadow-md flex items-center gap-2"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                                    توليد
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">2. التقدير العام (بعد المناقشة والإطلاع على الملف)</label>
                                <VoiceTextarea 
                                    value={report.legacyData?.generalAppreciation || ''} 
                                    onChange={v => updateLegacyField('generalAppreciation', v)} 
                                    className="w-full border rounded-lg p-4 leading-relaxed bg-white text-sm" 
                                    minHeight="min-h-[100px]"
                                    placeholder="اكتب التقدير العام النهائي هنا..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">العلامة بالأرقام (/20)</label>
                                    <input type="number" step="0.25" max="20" className="w-full border p-2 rounded text-2xl font-bold text-center" value={report.finalMark} onChange={e => updateField('finalMark', parseFloat(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">العلامة بالحروف</label>
                                    <VoiceInput value={report.markInLetters} onChange={v => updateField('markInLetters', v)} className="w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ تحرير التقرير</label>
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

export default LegacyReportEditor;