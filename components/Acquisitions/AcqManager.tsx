
import React, { useState, useRef, useMemo } from 'react';
import { Upload, Save, Check, ArrowLeftRight, School, Users, FileSpreadsheet, AlertTriangle, BarChart2, Layers, BookOpen, Filter, Trash2, PieChart, Database, Download, FileJson, RefreshCcw, Map, Info } from 'lucide-react';
import { AcqStudent, AcqClassRecord, AcqFilterState } from '../../types/acquisitions';
import { parseAcqExcel } from '../../utils/acqParser';
import { saveAcqRecord, getAcqDB, deleteAcqRecord } from '../../services/acqStorage';
import AcqStatsDashboard from './AcqStatsDashboard';

interface AcqManagerProps {
    availableSchools: string[];
    onDataUpdated?: () => void;
    externalFilters: AcqFilterState; // Passed from App state
    onUpdateFilters: (updates: Partial<AcqFilterState>) => void; // New prop to update parent state
}

// Configuration for Subjects per Level
const LEVEL_SUBJECTS: Record<string, string[]> = {
    '2AP': ['اللغة العربية', 'الرياضيات'],
    '4AP': ['اللغة العربية', 'الرياضيات'], 
    '5AP': [
        'اللغة العربية', 'الرياضيات', 'التربية الإسلامية', 'التربية المدنية',
        'التربية العلمية', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية',
        'اللغة الأمازيغية', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية'
    ]
};

const AcqManager: React.FC<AcqManagerProps> = ({ availableSchools, onDataUpdated, externalFilters, onUpdateFilters }) => {
    // Main View State: 'data' (Upload/List) or 'stats' (Dashboard)
    const [mainView, setMainView] = useState<'data' | 'stats'>('stats');
    const [dataSubView, setDataSubView] = useState<'list' | 'upload'>('list');
    
    const [records, setRecords] = useState<AcqClassRecord[]>(getAcqDB().records);
    
    // --- Upload State ---
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [className, setClassName] = useState('');
    
    const [previewStudents, setPreviewStudents] = useState<AcqStudent[]>([]);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);

    const availableSubjects = useMemo(() => {
        if (!selectedLevel) return [];
        return LEVEL_SUBJECTS[selectedLevel] || [];
    }, [selectedLevel]);

    // --- FILTER LOGIC (Moved from Sidebar) ---
    const activeLevels = useMemo(() => {
        const levels = new Set<string>();
        records.forEach(r => {
            if (externalFilters.scope === 'district' || r.schoolName === externalFilters.selectedSchool) {
                levels.add(r.level);
            }
        });
        return Array.from(levels).sort();
    }, [records, externalFilters.scope, externalFilters.selectedSchool]);

    const activeClasses = useMemo(() => {
        if (externalFilters.scope !== 'class' || !externalFilters.selectedSchool || !externalFilters.selectedLevel) return [];
        const classes = new Set<string>();
        records.forEach(r => {
            if (r.schoolName === externalFilters.selectedSchool && r.level === externalFilters.selectedLevel) {
                classes.add(r.className);
            }
        });
        return Array.from(classes).sort();
    }, [records, externalFilters.scope, externalFilters.selectedSchool, externalFilters.selectedLevel]);

    const activeSubjects = useMemo(() => {
        if (!externalFilters.selectedLevel) return [];
        const subjects = new Set<string>();
        records.forEach(r => {
            if (r.level === externalFilters.selectedLevel) {
                if (externalFilters.scope === 'district') {
                    subjects.add(r.subject);
                } else if (externalFilters.selectedSchool && r.schoolName === externalFilters.selectedSchool) {
                    subjects.add(r.subject);
                }
            }
        });
        return Array.from(subjects).sort();
    }, [records, externalFilters.scope, externalFilters.selectedSchool, externalFilters.selectedLevel]);


    // --- EXCEL PARSING ---
    const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: Ensure Context is Selected BEFORE processing
        if (!selectedSchool || !selectedLevel || !selectedSubject) {
            alert("تنبيه: يجب اختيار المدرسة، المستوى، والمادة أولاً لضمان توجيه البيانات بشكل صحيح.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result as ArrayBuffer;
            try {
                const parsed = parseAcqExcel(data, selectedLevel, selectedSubject);
                if (parsed.length === 0) {
                    alert("لم يتم العثور على تلاميذ. تأكد أن الملف يحتوي على قائمة تلاميذ وتقييمات (أ، ب، ج، د).");
                }
                setPreviewStudents(parsed);
            } catch (err) {
                console.error(err);
                alert("حدث خطأ أثناء قراءة الملف. تأكد أنه ملف Excel صالح.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // --- SAVE RECORD ---
    const handleSave = () => {
        // Strict Validation for Context Fields
        if (!selectedSchool || !selectedLevel || !selectedSubject || previewStudents.length === 0) {
            alert("يرجى إكمال الحقول الإجبارية (المدرسة، المستوى، المادة) ورفع ملف يحتوي على بيانات.");
            return;
        }

        // Warning for Class Name (Optional but Recommended)
        let finalClassName = className.trim();
        if (!finalClassName) {
            if (!confirm("تنبيه: لم تقم بتسمية الفوج (مثلاً: 2أ أو الفوج 1).\n\nإذا كانت المدرسة تحتوي على أكثر من فوج في هذا المستوى، فقد تختلط البيانات.\nهل تريد المتابعة وحفظه بدون اسم؟")) {
                return; // User Cancelled
            }
            finalClassName = "فوج بدون اسم";
        }

        const newRecord: AcqClassRecord = {
            id: Math.random().toString(36).substr(2, 9),
            schoolName: selectedSchool,
            className: finalClassName,
            level: selectedLevel,
            subject: selectedSubject,
            academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            uploadDate: new Date().toISOString().split('T')[0],
            students: previewStudents
        };

        saveAcqRecord(newRecord);
        setRecords(getAcqDB().records);
        setDataSubView('list');
        
        // Notify Parent to update sidebar logic
        if (onDataUpdated) onDataUpdated();
        
        // Reset Form
        setClassName('');
        setPreviewStudents([]);
        setFileName('');
        // Keep School/Level selected for easier consecutive uploads
    };

    // --- DELETE RECORD ---
    const handleDelete = (id: string) => {
        if (confirm("هل أنت متأكد من حذف بيانات هذا القسم؟")) {
            deleteAcqRecord(id);
            setRecords(getAcqDB().records);
            if (onDataUpdated) onDataUpdated();
        }
    };

    // --- BACKUP & RESTORE (JSON) ---
    const handleExportDB = () => {
        const db = getAcqDB();
        const dataStr = JSON.stringify(db, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Acq_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if(!confirm("تحذير: سيتم استبدال جميع بيانات المكتسبات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد؟")) {
            if (jsonInputRef.current) jsonInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.records && Array.isArray(json.records)) {
                    localStorage.setItem('mufattish_acq_db', JSON.stringify(json));
                    setRecords(json.records);
                    if (onDataUpdated) onDataUpdated();
                    alert("تم استرجاع قاعدة بيانات المكتسبات بنجاح.");
                } else {
                    alert("الملف غير صالح. تأكد من اختيار ملف النسخة الاحتياطية الصحيح.");
                }
            } catch (err) {
                console.error(err);
                alert("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.");
            }
            if (jsonInputRef.current) jsonInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50 w-full animate-in fade-in">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b px-6 py-3 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-20 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                        <BarChart2 className="text-teal-600" size={24} />
                        فضاء تقييم المكتسبات
                    </h1>
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setMainView('data')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${mainView === 'data' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Database size={16} />
                            إدارة البيانات
                        </button>
                        <button 
                            onClick={() => setMainView('stats')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${mainView === 'stats' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <PieChart size={16} />
                            اللوحة الإحصائية
                        </button>
                    </div>
                </div>
            </div>

            {/* --- NEW: TOP FILTER BAR (Replaces Sidebar) --- */}
            {mainView === 'stats' && (
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col lg:flex-row gap-4 items-start lg:items-center animate-in slide-in-from-top-2 relative z-10">
                    
                    {/* Scope Switcher */}
                    <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-1 shrink-0">
                        <button 
                            onClick={() => onUpdateFilters({ scope: 'district', selectedSchool: '', selectedClass: '', selectedSubject: '' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${externalFilters.scope === 'district' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Map size={14} />
                            <span>المقاطعة</span>
                        </button>
                        <div className="w-px bg-slate-200 my-1 mx-1"></div>
                        <button 
                            onClick={() => onUpdateFilters({ scope: 'school', selectedClass: '', selectedSubject: '' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${externalFilters.scope === 'school' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <School size={14} />
                            <span>المدرسة</span>
                        </button>
                        <div className="w-px bg-slate-200 my-1 mx-1"></div>
                        <button 
                            onClick={() => onUpdateFilters({ scope: 'class', selectedSubject: '' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${externalFilters.scope === 'class' ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users size={14} />
                            <span>القسم</span>
                        </button>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-3 items-center flex-1">
                        
                        {/* School */}
                        <div className={`relative min-w-[200px] ${externalFilters.scope === 'district' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            <School size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={externalFilters.selectedSchool}
                                onChange={(e) => onUpdateFilters({ selectedSchool: e.target.value, selectedLevel: '', selectedSubject: '', selectedClass: '' })}
                                className="w-full py-2 pr-9 pl-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                            >
                                <option value="">{externalFilters.scope === 'district' ? 'تحليل شامل للمقاطعة' : '-- اختر المدرسة --'}</option>
                                {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Level */}
                        <div className="relative min-w-[160px]">
                            <Layers size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={externalFilters.selectedLevel}
                                onChange={(e) => onUpdateFilters({ selectedLevel: e.target.value, selectedSubject: '' })}
                                className="w-full py-2 pr-9 pl-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                            >
                                <option value="">-- المستوى الدراسي --</option>
                                {activeLevels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        {/* Class (Conditional) */}
                        {externalFilters.scope === 'class' && (
                            <div className="relative min-w-[140px] animate-in fade-in slide-in-from-right-2">
                                <Users size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select 
                                    value={externalFilters.selectedClass}
                                    onChange={(e) => onUpdateFilters({ selectedClass: e.target.value, selectedSubject: '' })}
                                    className="w-full py-2 pr-9 pl-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                                >
                                    <option value="">-- الفوج --</option>
                                    {activeClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Subject */}
                        <div className={`relative min-w-[180px] ${!externalFilters.selectedLevel ? 'opacity-50 pointer-events-none' : ''}`}>
                            <BookOpen size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={externalFilters.selectedSubject}
                                onChange={(e) => onUpdateFilters({ selectedSubject: e.target.value })}
                                className="w-full py-2 pr-9 pl-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                            >
                                <option value="">-- المادة / النشاط --</option>
                                {activeSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="hidden lg:block">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${externalFilters.selectedSubject ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${externalFilters.selectedSubject ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            {externalFilters.selectedSubject ? 'جاهز للعرض' : 'بانتظار الاختيار'}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                {/* --- VIEW: STATS DASHBOARD --- */}
                {mainView === 'stats' && (
                    <AcqStatsDashboard 
                        records={records} 
                        availableSchools={availableSchools}
                        filters={externalFilters}
                    />
                )}

                {/* --- VIEW: DATA MANAGEMENT --- */}
                {mainView === 'data' && (
                    <div className="h-full overflow-y-auto p-6 md:p-8">
                        {dataSubView === 'list' ? (
                            <>
                                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-700">الأقسام والبيانات المحجوزة</h2>
                                        <p className="text-slate-400 text-xs mt-1">قائمة بجميع الملفات التي تم استيرادها للنظام</p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleExportDB}
                                            className="bg-white border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs"
                                            title="حفظ نسخة كاملة من البيانات في جهازك"
                                        >
                                            <Download size={16} />
                                            نسخة احتياطية
                                        </button>
                                        
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                ref={jsonInputRef}
                                                accept=".json"
                                                onChange={handleImportDB}
                                                className="hidden"
                                            />
                                            <button 
                                                onClick={() => jsonInputRef.current?.click()}
                                                className="bg-white border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs"
                                                title="استرجاع البيانات من ملف محفوظ سابقاً"
                                            >
                                                <RefreshCcw size={16} />
                                                استرجاع
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => setDataSubView('upload')}
                                            className="bg-teal-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2 font-bold text-sm mr-2"
                                        >
                                            <Upload size={18} />
                                            استيراد ملف جديد (Excel)
                                        </button>
                                    </div>
                                </div>

                                {records.length === 0 ? (
                                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-teal-200 transition-all" onClick={() => setDataSubView('upload')}>
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileSpreadsheet size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-600">لا توجد بيانات محفوظة</h3>
                                        <p className="text-slate-400 text-xs mt-1">ابدأ باستيراد ملفات الرقمنة (Excel) حسب المستوى والمادة.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {records.map(rec => (
                                            <div key={rec.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group overflow-hidden">
                                                <div className="p-5">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rec.level}</span>
                                                            <span className="font-bold text-teal-700 text-sm">{rec.subject}</span>
                                                        </div>
                                                        <button onClick={() => handleDelete(rec.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                            <School size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{rec.schoolName}</h4>
                                                            <p className="text-[10px] text-slate-500">القسم: <span className="font-bold text-slate-700">{rec.className}</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                                                        <span className="text-xs font-medium text-slate-500">{rec.students.length} تلميذ</span>
                                                        <div className="text-[10px] text-slate-300">{rec.uploadDate}</div>
                                                    </div>
                                                </div>
                                                <div className={`h-1 w-full ${rec.level === '5AP' ? 'bg-purple-500' : rec.level === '4AP' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* --- UPLOAD FORM --- */
                            <div className="w-full max-w-5xl mx-auto animate-in slide-in-from-right-4">
                                <button onClick={() => setDataSubView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs mb-6 transition-colors">
                                    <ArrowLeftRight size={14}/> العودة للقائمة
                                </button>

                                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                                        <h2 className="text-xl font-bold font-serif">استيراد بيانات تقييم المكتسبات</h2>
                                        <p className="text-slate-400 text-xs mt-1">يرجى اختيار الإعدادات بدقة لضمان معالجة الملف بشكل صحيح</p>
                                    </div>

                                    <div className="p-6 md:p-8 space-y-8">
                                        {/* 1. Context Selection */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                                    <School size={14} className="text-teal-600" /> المدرسة <span className="text-red-500">*</span>
                                                </label>
                                                <select 
                                                    value={selectedSchool} 
                                                    onChange={e => setSelectedSchool(e.target.value)}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                                                >
                                                    <option value="">-- اختر المدرسة --</option>
                                                    {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                                    <Layers size={14} className="text-teal-600" /> المستوى <span className="text-red-500">*</span>
                                                </label>
                                                <select 
                                                    value={selectedLevel} 
                                                    onChange={e => {
                                                        setSelectedLevel(e.target.value);
                                                        setSelectedSubject(''); 
                                                        setPreviewStudents([]);
                                                        setFileName('');
                                                    }}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                                                >
                                                    <option value="">-- اختر المستوى --</option>
                                                    <option value="2AP">السنة الثانية (2AP)</option>
                                                    <option value="4AP">السنة الرابعة (4AP)</option>
                                                    <option value="5AP">السنة الخامسة (5AP)</option>
                                                </select>
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                                    <BookOpen size={14} className="text-teal-600" /> المادة <span className="text-red-500">*</span>
                                                </label>
                                                <select 
                                                    value={selectedSubject} 
                                                    onChange={e => {
                                                        setSelectedSubject(e.target.value);
                                                        setPreviewStudents([]);
                                                        setFileName('');
                                                    }}
                                                    disabled={!selectedLevel}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">-- اختر المادة --</option>
                                                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                                    <Users size={14} className="text-teal-600" /> الفوج
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={className}
                                                    onChange={e => setClassName(e.target.value)}
                                                    placeholder="مثلاً: 2أ"
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                                                />
                                                <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-400 leading-tight">
                                                    <Info size={10} className="mt-0.5 shrink-0" />
                                                    <span>يجب تعيين الرقم إذا كانت المدرسة بها أكثر من فوج في نفس المستوى.</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. File Upload */}
                                        <div 
                                            onClick={() => {
                                                if (!selectedSchool || !selectedLevel || !selectedSubject) {
                                                    alert("تنبيه: يجب اختيار المدرسة، المستوى، والمادة أولاً لضمان توجيه البيانات بشكل صحيح.");
                                                } else {
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative
                                                ${(!selectedSchool || !selectedLevel || !selectedSubject) ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed' : 
                                                fileName ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'}
                                            `}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                accept=".xls,.xlsx"
                                                onChange={handleFileRead}
                                                className="hidden" 
                                                disabled={!selectedSchool || !selectedLevel || !selectedSubject}
                                            />
                                            
                                            <div className="flex flex-col items-center">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
                                                    ${fileName ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-400'}
                                                `}>
                                                    <FileSpreadsheet size={24} />
                                                </div>
                                                {fileName ? (
                                                    <>
                                                        <h3 className="font-bold text-teal-800 text-sm">{fileName}</h3>
                                                        <p className="text-teal-600 text-xs mt-1">تمت قراءة الملف بنجاح</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="font-bold text-slate-700 text-sm">اضغط هنا لرفع ملف Excel</h3>
                                                        <p className="text-slate-400 text-xs mt-1">
                                                            {(!selectedSchool || !selectedLevel || !selectedSubject) 
                                                                ? "يرجى تحديد المدرسة والمستوى والمادة أولاً"
                                                                : `يجب أن يطابق الملف: ${selectedLevel} - ${selectedSubject}`
                                                            }
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Preview */}
                                        {previewStudents.length > 0 && (
                                            <div className="animate-in slide-in-from-bottom-4">
                                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                                        <Check className="bg-green-500 text-white rounded-full p-0.5" size={14} /> 
                                                        تم العثور على {previewStudents.length} تلميذ
                                                    </h3>
                                                </div>
                                                
                                                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[400px] custom-scrollbar">
                                                    {/* Table Content... */}
                                                </div>

                                                <div className="mt-6 flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => { setPreviewStudents([]); setFileName(''); }}
                                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                                                    >
                                                        إلغاء
                                                    </button>
                                                    <button 
                                                        onClick={handleSave}
                                                        className="bg-slate-900 text-white px-8 py-2.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all font-bold flex items-center gap-2"
                                                    >
                                                        <Save size={18} />
                                                        حفظ البيانات
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcqManager;
