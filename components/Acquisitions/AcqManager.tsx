
import React, { useState, useRef, useMemo } from 'react';
import { Upload, Save, Check, ArrowLeftRight, School, Users, FileSpreadsheet, AlertTriangle, BarChart2, Layers, BookOpen, Filter, Trash2, PieChart, Database, Download, FileJson, RefreshCcw, Map, Info, AlertOctagon, X, Search } from 'lucide-react';
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
        'اللغة العربية', 'الرياضيات', 'التربية الإسلامية', 'التاريخ', 'التربية المدنية',
        'التربية العلمية', 'الجغرافيا', 'اللغة الفرنسية',
        'اللغة الأمازيغية', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية'
    ]
};

const CLASS_OPTIONS = [
    "فوج وحيد (المدرسة بها فوج واحد)",
    "فوج 1", "فوج 2", "فوج 3", "فوج 4", "فوج 5",
    "فوج 6", "فوج 7", "فوج 8", "فوج 9", "فوج 10"
];

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

    // --- Modal State for Duplicates ---
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [duplicateRecordId, setDuplicateRecordId] = useState<string | null>(null);

    // --- Table Filtering State (Local) ---
    const [tableFilterSchool, setTableFilterSchool] = useState('');
    const [tableFilterSubject, setTableFilterSubject] = useState('');

    const availableSubjects = useMemo(() => {
        if (!selectedLevel) return [];
        return LEVEL_SUBJECTS[selectedLevel] || [];
    }, [selectedLevel]);

    // --- FILTER LOGIC (For Dashboard Sidebar) ---
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


    // --- TABLE FILTERING LOGIC ---
    const filteredTableRecords = useMemo(() => {
        return records.filter(r => {
            if (tableFilterSchool && r.schoolName !== tableFilterSchool) return false;
            if (tableFilterSubject && r.subject !== tableFilterSubject) return false;
            return true;
        });
    }, [records, tableFilterSchool, tableFilterSubject]);

    const tableSchoolOptions = useMemo(() => Array.from(new Set(records.map(r => r.schoolName))).sort(), [records]);
    const tableSubjectOptions = useMemo(() => Array.from(new Set(records.map(r => r.subject))).sort(), [records]);


    // --- EXCEL PARSING ---
    const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: Ensure Context is Selected BEFORE processing
        if (!selectedSchool || !selectedLevel || !selectedSubject || !className) {
            alert("تنبيه: يجب اختيار جميع الحقول (المدرسة، المستوى، المادة، والفوج) أولاً.");
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

    // --- CHECK & SAVE ---
    const initiateSave = () => {
        if (!selectedSchool || !selectedLevel || !selectedSubject || !className || previewStudents.length === 0) {
            alert("يرجى إكمال جميع الحقول ورفع الملف.");
            return;
        }

        // Check for duplicates
        const existingRecord = records.find(r => 
            r.schoolName === selectedSchool &&
            r.level === selectedLevel &&
            r.className === className &&
            r.subject === selectedSubject
        );

        if (existingRecord) {
            setDuplicateRecordId(existingRecord.id);
            setShowOverwriteModal(true);
        } else {
            performSave();
        }
    };

    const performSave = (overwriteId: string | null = null) => {
        if (overwriteId) {
            deleteAcqRecord(overwriteId);
        }

        const newRecord: AcqClassRecord = {
            id: Math.random().toString(36).substr(2, 9),
            schoolName: selectedSchool,
            className: className,
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
        setPreviewStudents([]);
        setFileName('');
        setShowOverwriteModal(false);
        setDuplicateRecordId(null);
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
        <div className="h-full flex flex-col bg-slate-50/50 w-full animate-in fade-in relative">
            
            {/* --- OVERWRITE MODAL --- */}
            {showOverwriteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <div className="bg-amber-100 p-3 rounded-full"><AlertOctagon size={24}/></div>
                            <h3 className="text-lg font-bold">تنبيه: بيانات مكررة</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                            لقد قمت باختيار <strong>{selectedSchool} - {className} ({selectedSubject})</strong>.
                            <br/>
                            هناك بيانات محفوظة مسبقاً لهذا الفوج. هل تريد استبدالها بالملف الجديد؟
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => { setShowOverwriteModal(false); setDuplicateRecordId(null); }}
                                className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={() => performSave(duplicateRecordId)}
                                className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-md transition-colors"
                            >
                                نعم، استبدال البيانات
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                    <div className="flex flex-wrap gap-3 items-center flex-1">
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
                                        <button onClick={handleExportDB} className="bg-white border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs" title="حفظ نسخة كاملة من البيانات">
                                            <Download size={16} /> نسخة احتياطية
                                        </button>
                                        
                                        <div className="relative">
                                            <input type="file" ref={jsonInputRef} accept=".json" onChange={handleImportDB} className="hidden" />
                                            <button onClick={() => jsonInputRef.current?.click()} className="bg-white border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs" title="استرجاع البيانات">
                                                <RefreshCcw size={16} /> استرجاع
                                            </button>
                                        </div>

                                        <button onClick={() => setDataSubView('upload')} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2 font-bold text-sm mr-2">
                                            <Upload size={18} /> استيراد ملف جديد
                                        </button>
                                    </div>
                                </div>

                                {records.length === 0 ? (
                                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-teal-200 transition-all" onClick={() => setDataSubView('upload')}>
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4"><FileSpreadsheet size={32} /></div>
                                        <h3 className="text-lg font-bold text-slate-600">لا توجد بيانات محفوظة</h3>
                                        <p className="text-slate-400 text-xs mt-1">ابدأ باستيراد ملفات الرقمنة (Excel).</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* --- TABLE FILTER BAR --- */}
                                        <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                <Filter size={16} />
                                                تصفية النتائج:
                                            </div>
                                            
                                            <div className="relative flex-1 w-full md:w-auto">
                                                <select 
                                                    value={tableFilterSchool}
                                                    onChange={(e) => setTableFilterSchool(e.target.value)}
                                                    className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                                                >
                                                    <option value="">جميع المدارس</option>
                                                    {tableSchoolOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <School size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>

                                            <div className="relative flex-1 w-full md:w-auto">
                                                <select 
                                                    value={tableFilterSubject}
                                                    onChange={(e) => setTableFilterSubject(e.target.value)}
                                                    className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                                                >
                                                    <option value="">جميع المواد</option>
                                                    {tableSubjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <BookOpen size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>

                                            {(tableFilterSchool || tableFilterSubject) && (
                                                <button 
                                                    onClick={() => { setTableFilterSchool(''); setTableFilterSubject(''); }}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                                >
                                                    <X size={14} /> إلغاء التصفية
                                                </button>
                                            )}
                                        </div>

                                        {/* --- TABLE VIEW --- */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            {filteredTableRecords.length > 0 ? (
                                                <table className="w-full text-right">
                                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-6 py-4">المدرسة</th>
                                                            <th className="px-6 py-4">المستوى / الفوج</th>
                                                            <th className="px-6 py-4">المادة</th>
                                                            <th className="px-6 py-4 text-center">التلاميذ</th>
                                                            <th className="px-6 py-4">تاريخ الاستيراد</th>
                                                            <th className="px-6 py-4 text-center">إجراءات</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {filteredTableRecords.map(rec => (
                                                            <tr key={rec.id} className="hover:bg-slate-50 transition-colors group">
                                                                <td className="px-6 py-4 font-bold text-slate-700 text-sm flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"><School size={16}/></div>
                                                                    {rec.schoolName}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-slate-800">{rec.className}</span>
                                                                        <span className="text-[10px] text-slate-400">{rec.level}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${
                                                                        rec.subject.includes('العربية') ? 'bg-green-50 text-green-700 border-green-100' : 
                                                                        rec.subject.includes('إسلامية') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                        'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                                                        {rec.subject}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-mono text-sm text-slate-600">{rec.students.length}</td>
                                                                <td className="px-6 py-4 text-xs text-slate-400 font-mono">{rec.uploadDate}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <button 
                                                                        onClick={() => handleDelete(rec.id)} 
                                                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                                        title="حذف البيانات"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                                                    <Search size={32} className="mb-2 opacity-20"/>
                                                    <p className="text-sm font-bold">لا توجد نتائج مطابقة للتصفية</p>
                                                    <button 
                                                        onClick={() => { setTableFilterSchool(''); setTableFilterSubject(''); }}
                                                        className="mt-2 text-xs text-teal-600 hover:underline"
                                                    >
                                                        إلغاء التصفية وعرض الكل
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
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
                                        <p className="text-slate-400 text-xs mt-1">جميع الحقول إجبارية لضمان دقة البيانات</p>
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
                                                    <Users size={14} className="text-teal-600" /> الفوج <span className="text-red-500">*</span>
                                                </label>
                                                <select 
                                                    value={className}
                                                    onChange={e => setClassName(e.target.value)}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                                                >
                                                    <option value="">-- اختر رقم الفوج --</option>
                                                    {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 2. File Upload */}
                                        <div 
                                            onClick={() => {
                                                if (!selectedSchool || !selectedLevel || !selectedSubject || !className) {
                                                    alert("تنبيه: يجب اختيار جميع الحقول (المدرسة، المستوى، المادة، والفوج) أولاً.");
                                                } else {
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative
                                                ${(!selectedSchool || !selectedLevel || !selectedSubject || !className) ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed' : 
                                                fileName ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'}
                                            `}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                accept=".xls,.xlsx"
                                                onChange={handleFileRead}
                                                className="hidden" 
                                                disabled={!selectedSchool || !selectedLevel || !selectedSubject || !className}
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
                                                            {(!selectedSchool || !selectedLevel || !selectedSubject || !className) 
                                                                ? "أكمل اختيار الحقول أعلاه لتفعيل الرفع"
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
                                                
                                                <div className="mt-6 flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => { setPreviewStudents([]); setFileName(''); }}
                                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                                                    >
                                                        إلغاء
                                                    </button>
                                                    <button 
                                                        onClick={initiateSave}
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
