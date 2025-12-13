
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, Save, Check, ArrowLeftRight, School, Users, FileSpreadsheet, AlertTriangle, BarChart2, Layers, BookOpen, Filter, Trash2, PieChart, Database, Download, FileJson, RefreshCcw, Map, Info, AlertOctagon, X, Search, Table2, Grid, FileText, Printer, CheckSquare, XCircle, ToggleLeft, ToggleRight, Cloud, CloudDownload, CloudUpload } from 'lucide-react';
import { AcqStudent, AcqClassRecord, AcqFilterState, AcqGlobalRecord } from '../../types/acquisitions';
import { parseAcqExcel, parseGlobalAcqExcel } from '../../utils/acqParser';
import { saveAcqRecord, getAcqDB, deleteAcqRecord, saveGlobalAcqRecord, getGlobalAcqDB, deleteGlobalAcqRecord } from '../../services/acqStorage';
import AcqStatsDashboard from './AcqStatsDashboard';
import AcqResultsTable from './AcqResultsTable';
import AcqStructuredAnalysis from './Analytics/AcqStructuredAnalysis';
import { syncWithScript, readFromScript } from '../../services/sheetsService';

interface AcqManagerProps {
    availableSchools: string[];
    onDataUpdated?: () => void;
    externalFilters: AcqFilterState; 
    onUpdateFilters: (updates: Partial<AcqFilterState>) => void;
}

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
    // Navigation State
    const [mainView, setMainView] = useState<'data' | 'results' | 'stats' | 'remediation' | 'print'>('stats');
    const [dataSubView, setDataSubView] = useState<'list' | 'upload'>('list');
    
    // List Mode: 'detailed' vs 'global'
    const [listMode, setListMode] = useState<'detailed' | 'global'>('detailed');

    // Results View Mode (Detailed vs Global)
    const [resultsViewMode, setResultsViewMode] = useState<'detailed' | 'global'>('detailed');

    // Import Mode State (Detailed vs Global)
    const [importType, setImportType] = useState<'detailed' | 'global'>('detailed');

    // Data State
    const [records, setRecords] = useState<AcqClassRecord[]>([]);
    const [globalRecords, setGlobalRecords] = useState<AcqGlobalRecord[]>([]);
    
    // Sync State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    
    // Initial Load & Refresh
    useEffect(() => {
        setRecords(getAcqDB().records);
        setGlobalRecords(getGlobalAcqDB().records);
    }, [mainView, dataSubView]); 

    // --- Upload Form State ---
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [className, setClassName] = useState('');
    
    // Preview Data
    const [previewStudents, setPreviewStudents] = useState<AcqStudent[]>([]);
    const [previewGlobalCount, setPreviewGlobalCount] = useState<number>(0);
    const [previewGlobalSubjects, setPreviewGlobalSubjects] = useState<string[]>([]);
    const [globalParsedData, setGlobalParsedData] = useState<any[]>([]); 
    
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


    const filteredTableRecords = useMemo(() => {
        return records.filter(r => {
            if (tableFilterSchool && r.schoolName !== tableFilterSchool) return false;
            if (tableFilterSubject && r.subject !== tableFilterSubject) return false;
            return true;
        });
    }, [records, tableFilterSchool, tableFilterSubject]);

    // Filter for Global Records
    const filteredGlobalRecordsList = useMemo(() => {
        return globalRecords; 
    }, [globalRecords]);

    const resultsTableRecords = useMemo(() => {
        return records.filter(r => {
            if (externalFilters.selectedLevel && r.level !== externalFilters.selectedLevel) return false;
            if (externalFilters.selectedSubject && r.subject !== externalFilters.selectedSubject) return false;
            if (externalFilters.scope === 'district') return true; 
            if (externalFilters.scope === 'school' || externalFilters.scope === 'class') {
                if (r.schoolName !== externalFilters.selectedSchool) return false;
            }
            if (externalFilters.scope === 'class') {
                if (r.className !== externalFilters.selectedClass) return false;
            }
            return true;
        });
    }, [records, externalFilters]);
    
    const filteredGlobalRecords = useMemo(() => {
        if (!externalFilters.selectedSchool) return globalRecords; 
        return globalRecords.filter(r => r.schoolName === externalFilters.selectedSchool);
    }, [globalRecords, externalFilters.selectedSchool]);

    // --- FILE PROCESSING ---
    const handleUploadClick = () => {
        if (importType === 'detailed') {
            if (!selectedSchool || !selectedLevel || !selectedSubject || !className) {
                alert("تنبيه: جميع الحقول إجبارية لاستيراد الشبكة التفصيلية.");
                return;
            }
        }
        else if (importType === 'global') {
            if (!selectedSchool) {
                alert("تنبيه: يجب اختيار المدرسة لاستيراد الشبكة الإجمالية.");
                return;
            }
        }
        fileInputRef.current?.click();
    };

    const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const data = event.target?.result as ArrayBuffer;
            try {
                if (importType === 'detailed') {
                    const parsed = parseAcqExcel(data, selectedLevel, selectedSubject);
                    if (parsed.length === 0) alert("لم يتم العثور على تلاميذ.");
                    setPreviewStudents(parsed);
                } else {
                    // GLOBAL IMPORT
                    const { students, detectedColumns } = parseGlobalAcqExcel(data);
                    if (students.length === 0) alert("لم يتم العثور على بيانات.");
                    setGlobalParsedData(students);
                    setPreviewGlobalCount(students.length);
                    setPreviewGlobalSubjects(detectedColumns); // Save detected columns for preview
                }
            } catch (err: any) {
                console.error(err);
                alert(`خطأ في قراءة الملف: ${err.message}`);
                setFileName('');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // --- SAVE LOGIC ---
    const initiateSave = () => {
        if (importType === 'detailed') {
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
        } else {
            // Global
            const existingGlobal = globalRecords.find(r => r.schoolName === selectedSchool);
            if (existingGlobal) {
                 if (confirm(`يوجد ملف شبكة إجمالية سابق لمدرسة ${selectedSchool}. هل تريد استبداله؟`)) {
                     performGlobalSave();
                 }
            } else {
                performGlobalSave();
            }
        }
    };

    const performSave = (overwriteId: string | null = null) => {
        if (overwriteId) deleteAcqRecord(overwriteId);

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
        finalizeSave();
    };

    const performGlobalSave = () => {
        const newRecord: AcqGlobalRecord = {
            id: Math.random().toString(36).substr(2, 9),
            schoolName: selectedSchool,
            academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            uploadDate: new Date().toISOString().split('T')[0],
            totalStudents: previewGlobalCount,
            students: globalParsedData
        };
        
        saveGlobalAcqRecord(newRecord);
        alert(`تم حفظ الشبكة الإجمالية لمدرسة ${selectedSchool}.`);
        
        // Reset preview states
        setGlobalRecords(getGlobalAcqDB().records);
        setGlobalParsedData([]);
        setPreviewGlobalCount(0);
        setPreviewGlobalSubjects([]);
        setFileName('');
        setDataSubView('list');
        setListMode('global'); 
        if (onDataUpdated) onDataUpdated();
    };

    const finalizeSave = () => {
        setRecords(getAcqDB().records);
        setDataSubView('list');
        if (onDataUpdated) onDataUpdated();
        setPreviewStudents([]);
        setFileName('');
        setShowOverwriteModal(false);
        setDuplicateRecordId(null);
    };

    const handleDelete = (id: string, type: 'detailed' | 'global') => {
        if (confirm("هل أنت متأكد من الحذف؟")) {
            if (type === 'detailed') {
                deleteAcqRecord(id);
                setRecords(getAcqDB().records);
            } else {
                deleteGlobalAcqRecord(id);
                setGlobalRecords(getGlobalAcqDB().records);
            }
            if (onDataUpdated) onDataUpdated();
        }
    };

    // --- CLOUD SYNC LOGIC ---
    
    const handleCloudUpload = async () => {
        const scriptUrl = localStorage.getItem('mufattish_script_url');
        if (!scriptUrl) {
            alert("لم يتم ربط التطبيق بقاعدة بيانات Google Sheets. يرجى الذهاب لقسم 'قاعدة البيانات' أولاً.");
            return;
        }
        
        // We sync ALL records (Detailed + Global)
        // Note: For simplicity and performance in this demo, we might just sync detailed for now, or bundle them.
        // Let's bundle detailed records as they are the most critical.
        
        setIsSyncing(true);
        setSyncMessage('جاري رفع بيانات المكتسبات...');
        
        try {
            const allDetailed = getAcqDB().records;
            const allGlobal = getGlobalAcqDB().records;
            
            // We combine them into a single array of objects for the sheet
            // We need a common structure or we just dump raw JSON.
            // The sheet logic expects an array of objects.
            // Let's send them as separate rows where each row is a record.
            
            const payload = [
                ...allDetailed, 
                ...allGlobal.map(r => ({...r, type: 'GLOBAL_RECORD'})) // Mark globals
            ];

            await syncWithScript(scriptUrl, payload, 'SYNC_ACQ');
            setSyncMessage('تم الحفظ في السحابة بنجاح!');
            setTimeout(() => setSyncMessage(''), 3000);
        } catch (e: any) {
            console.error(e);
            setSyncMessage('فشل الرفع: ' + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCloudDownload = async () => {
        const scriptUrl = localStorage.getItem('mufattish_script_url');
        if (!scriptUrl) {
            alert("لم يتم ربط التطبيق بقاعدة بيانات Google Sheets.");
            return;
        }

        if(!confirm("تحذير: استرجاع البيانات من السحابة سيقوم بدمجها مع البيانات الحالية. هل تريد المتابعة؟")) return;

        setIsSyncing(true);
        setSyncMessage('جاري جلب البيانات...');

        try {
            const data = await readFromScript(scriptUrl, 'READ_ACQ');
            if (Array.isArray(data)) {
                let addedCount = 0;
                // Process each record
                data.forEach((rec: any) => {
                    if (rec.type === 'GLOBAL_RECORD') {
                         saveGlobalAcqRecord(rec);
                    } else {
                         saveAcqRecord(rec);
                    }
                    addedCount++;
                });
                
                // Refresh View
                setRecords(getAcqDB().records);
                setGlobalRecords(getGlobalAcqDB().records);
                if (onDataUpdated) onDataUpdated();

                setSyncMessage(`تم استرجاع ${addedCount} سجل بنجاح.`);
                setTimeout(() => setSyncMessage(''), 3000);
            } else {
                setSyncMessage('لم يتم العثور على بيانات صالحة.');
            }
        } catch (e: any) {
            setSyncMessage('فشل الاسترجاع: ' + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportDB = () => {
         const db = getAcqDB();
         const dataStr = JSON.stringify(db, null, 2);
         const blob = new Blob([dataStr], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `Acq_Backup.json`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
    };
    
    const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
             const json = JSON.parse(event.target?.result as string);
             if (json.records) {
                 localStorage.setItem('mufattish_acq_db', JSON.stringify(json));
                 setRecords(json.records);
                 if(onDataUpdated) onDataUpdated();
             }
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50 w-full animate-in fade-in relative">
            
            {showOverwriteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <div className="bg-amber-100 p-3 rounded-full"><AlertOctagon size={24}/></div>
                            <h3 className="text-lg font-bold">تنبيه: بيانات مكررة</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                            هناك بيانات محفوظة مسبقاً لهذا الفوج. هل تريد استبدالها؟
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowOverwriteModal(false); setDuplicateRecordId(null); }} className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">تراجع</button>
                            <button onClick={() => performSave(duplicateRecordId)} className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-md transition-colors">نعم، استبدال</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Nav */}
            <div className="bg-white border-b px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-20 shadow-sm gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-serif shrink-0">
                        <BarChart2 className="text-teal-600" size={24} />
                        فضاء تقييم المكتسبات
                    </h1>
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button onClick={() => setMainView('data')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${mainView === 'data' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><Database size={14} /> إدارة البيانات</button>
                        <button onClick={() => setMainView('results')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${mainView === 'results' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Table2 size={14} /> جدول النتائج</button>
                        <button onClick={() => setMainView('stats')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${mainView === 'stats' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}><PieChart size={14} /> اللوحة الإحصائية</button>
                        <button onClick={() => setMainView('remediation')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${mainView === 'remediation' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'}`}><FileText size={14} /> المعالجة المهيكلة</button>
                        <button onClick={() => setMainView('print')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${mainView === 'print' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}><Printer size={14} /> طباعة التقرير</button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            {(mainView === 'stats' || mainView === 'results' || mainView === 'remediation') && (
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col lg:flex-row gap-4 items-start lg:items-center animate-in slide-in-from-top-2 relative z-10">
                     <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-1 shrink-0">
                        <button onClick={() => onUpdateFilters({ scope: 'district' })} className={`px-3 py-1.5 rounded-md text-xs font-bold ${externalFilters.scope === 'district' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}><Map size={14}/> المقاطعة</button>
                        <button onClick={() => onUpdateFilters({ scope: 'school' })} className={`px-3 py-1.5 rounded-md text-xs font-bold ${externalFilters.scope === 'school' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}><School size={14}/> المدرسة</button>
                        <button onClick={() => onUpdateFilters({ scope: 'class' })} className={`px-3 py-1.5 rounded-md text-xs font-bold ${externalFilters.scope === 'class' ? 'bg-teal-50 text-teal-700' : 'text-slate-500'}`}><Users size={14}/> القسم</button>
                    </div>
                     <div className="flex flex-wrap gap-3 items-center flex-1">
                        <select value={externalFilters.selectedSchool} onChange={(e) => onUpdateFilters({ selectedSchool: e.target.value })} className="p-2 border rounded-lg text-xs font-bold"><option value="">-- المدرسة --</option>{availableSchools.map(s=><option key={s} value={s}>{s}</option>)}</select>
                        
                        <select value={externalFilters.selectedLevel} onChange={(e) => onUpdateFilters({ selectedLevel: e.target.value })} className="p-2 border rounded-lg text-xs font-bold"><option value="">-- المستوى --</option>{activeLevels.map(l=><option key={l} value={l}>{l}</option>)}</select>
                        {externalFilters.scope === 'class' && <select value={externalFilters.selectedClass} onChange={(e) => onUpdateFilters({ selectedClass: e.target.value })} className="p-2 border rounded-lg text-xs font-bold"><option value="">-- الفوج --</option>{activeClasses.map(c=><option key={c} value={c}>{c}</option>)}</select>}
                        <select value={externalFilters.selectedSubject} onChange={(e) => onUpdateFilters({ selectedSubject: e.target.value })} className="p-2 border rounded-lg text-xs font-bold"><option value="">-- المادة --</option>{activeSubjects.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    </div>

                    {mainView === 'results' && (
                        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shrink-0 ml-auto">
                             <button onClick={() => setResultsViewMode('detailed')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ${resultsViewMode === 'detailed' ? 'bg-teal-100 text-teal-800' : 'text-slate-500'}`}>
                                 <FileSpreadsheet size={14}/> تفصيلي
                             </button>
                             <button onClick={() => setResultsViewMode('global')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ${resultsViewMode === 'global' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500'}`}>
                                 <Grid size={14}/> إجمالي
                             </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                {mainView === 'stats' && <AcqStatsDashboard records={records} availableSchools={availableSchools} filters={externalFilters} />}
                
                {mainView === 'results' && (
                    <div className="h-full p-6">
                        <AcqResultsTable 
                            mode={resultsViewMode}
                            records={resultsTableRecords} 
                            globalRecords={filteredGlobalRecords}
                            level={externalFilters.selectedLevel} 
                            subject={externalFilters.selectedSubject} 
                        />
                    </div>
                )}

                {mainView === 'remediation' && (
                    <AcqStructuredAnalysis 
                        globalRecords={filteredGlobalRecords} 
                        detailedRecords={records}
                        filters={externalFilters}
                    />
                )}

                {mainView === 'print' && (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
                        <Printer size={64} className="mb-4 opacity-20" />
                        <h3 className="text-2xl font-bold">طباعة التقرير</h3>
                        <span className="mt-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">قيد التطوير</span>
                    </div>
                )}
                
                {/* --- DATA VIEW --- */}
                {mainView === 'data' && (
                    <div className="h-full overflow-y-auto p-6 md:p-8">
                        {dataSubView === 'list' ? (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                     <div>
                                        <h2 className="font-bold text-slate-700 text-lg">الأقسام والبيانات المحفوظة</h2>
                                        <p className="text-xs text-slate-500">إدارة قاعدة بيانات المكتسبات المحلية والسحابية</p>
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                         {/* CLOUD SYNC BUTTONS */}
                                         <button 
                                            onClick={handleCloudUpload}
                                            disabled={isSyncing}
                                            className="px-4 py-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded shadow-sm text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                            title="رفع البيانات إلى Google Sheet"
                                         >
                                            <CloudUpload size={16}/> {isSyncing ? 'جاري الرفع...' : 'حفظ سحابي'}
                                         </button>
                                         <button 
                                            onClick={handleCloudDownload}
                                            disabled={isSyncing}
                                            className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded shadow-sm text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                            title="جلب البيانات من Google Sheet"
                                         >
                                            <CloudDownload size={16}/> {isSyncing ? 'جاري الجلب...' : 'استرجاع سحابي'}
                                         </button>
                                         <div className="w-px bg-slate-300 mx-1"></div>
                                         <button onClick={handleExportDB} className="px-4 py-2 bg-white border rounded shadow-sm text-xs font-bold">نسخة احتياطية</button>
                                         <button onClick={() => jsonInputRef.current?.click()} className="px-4 py-2 bg-white border rounded shadow-sm text-xs font-bold">استيراد نسخة</button>
                                         <input type="file" ref={jsonInputRef} accept=".json" onChange={handleImportDB} className="hidden" />
                                         <button onClick={() => setDataSubView('upload')} className="bg-slate-900 text-white px-5 py-2 rounded-xl shadow font-bold text-sm flex gap-2 items-center"><Upload size={18}/> استيراد ملف جديد</button>
                                     </div>
                                </div>
                                
                                {syncMessage && (
                                    <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <Info size={16}/> {syncMessage}
                                    </div>
                                )}

                                <div className="flex bg-white border p-1 rounded-xl shadow-sm w-fit mb-4">
                                    <button onClick={() => setListMode('detailed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${listMode === 'detailed' ? 'bg-teal-50 text-teal-700' : 'text-slate-500'}`}>الشبكات التفصيلية</button>
                                    <button onClick={() => setListMode('global')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${listMode === 'global' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>الشبكات الإجمالية</button>
                                </div>
                                
                                {listMode === 'detailed' ? (
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <table className="w-full text-right">
                                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold">
                                                <tr><th className="p-4">المدرسة</th><th className="p-4">القسم</th><th className="p-4">المادة</th><th className="p-4">التلاميذ</th><th className="p-4">حذف</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredTableRecords.map(r => (
                                                    <tr key={r.id} className="hover:bg-slate-50">
                                                        <td className="p-4 font-bold text-slate-700">{r.schoolName}</td>
                                                        <td className="p-4 text-xs">{r.level} / {r.className}</td>
                                                        <td className="p-4 text-xs font-bold text-indigo-600">{r.subject}</td>
                                                        <td className="p-4 font-mono">{r.students.length}</td>
                                                        <td className="p-4"><button onClick={() => handleDelete(r.id, 'detailed')} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    // GLOBAL GRID LIST (Simplified without Amazigh checks)
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <table className="w-full text-right">
                                            <thead className="bg-indigo-50 text-indigo-900 text-xs font-bold">
                                                <tr>
                                                    <th className="p-4">المدرسة</th>
                                                    <th className="p-4 text-center">عدد التلاميذ</th>
                                                    <th className="p-4 text-center">حذف</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredGlobalRecordsList.map(r => {
                                                    return (
                                                        <tr key={r.id} className="hover:bg-slate-50">
                                                            <td className="p-4 font-bold text-slate-700">{r.schoolName}</td>
                                                            <td className="p-4 text-center font-mono">{r.totalStudents}</td>
                                                            <td className="p-4 text-center">
                                                                <button onClick={() => handleDelete(r.id, 'global')} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* --- UPLOAD FORM --- */
                            <div className="w-full max-w-5xl mx-auto animate-in slide-in-from-right-4">
                                {/* ... Upload Form Content ... */}
                                <button onClick={() => setDataSubView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs mb-6 transition-colors">
                                    <ArrowLeftRight size={14}/> العودة للقائمة
                                </button>
                                
                                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                     <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                                        <h2 className="text-xl font-bold font-serif">استيراد بيانات تقييم المكتسبات</h2>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-8">
                                         {/* Import Type */}
                                         <div className="flex gap-4 mb-6">
                                                <button onClick={() => setImportType('detailed')} className={`flex-1 p-4 rounded-xl border-2 ${importType==='detailed' ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>شبكة تفصيلية</button>
                                                <button onClick={() => setImportType('global')} className={`flex-1 p-4 rounded-xl border-2 ${importType==='global' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>شبكة إجمالية</button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                 <label className="block text-xs font-bold text-slate-600 mb-2">المدرسة <span className="text-red-500">*</span></label>
                                                 <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                                                    <option value="">-- اختر المدرسة --</option>
                                                    {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            {importType === 'detailed' && (
                                                <>
                                                    {/* Other fields for Detailed... */}
                                                     <div><label className="block text-xs font-bold text-slate-600 mb-2">المستوى</label><select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl"><option value="">--</option><option value="2AP">2AP</option><option value="4AP">4AP</option><option value="5AP">5AP</option></select></div>
                                                     <div><label className="block text-xs font-bold text-slate-600 mb-2">المادة</label><select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl"><option value="">--</option>{availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                                     <div><label className="block text-xs font-bold text-slate-600 mb-2">الفوج</label><select value={className} onChange={e => setClassName(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl"><option value="">--</option>{CLASS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                                </>
                                            )}
                                        </div>

                                        <div onClick={handleUploadClick} className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50">
                                            <input type="file" ref={fileInputRef} accept=".xls,.xlsx" onChange={handleFileRead} className="hidden" />
                                            <div className="flex flex-col items-center">
                                                 <FileSpreadsheet size={24} className="mb-2 text-slate-400"/>
                                                 <p>{fileName || "اضغط لرفع الملف"}</p>
                                            </div>
                                        </div>
                                        
                                        {/* DETAILED SAVE */}
                                        {importType === 'detailed' && previewStudents.length > 0 && (
                                            <button onClick={initiateSave} className="w-full bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold">حفظ البيانات</button>
                                        )}

                                        {/* GLOBAL PREVIEW & SAVE */}
                                        {importType === 'global' && globalParsedData.length > 0 && (
                                            <div className="space-y-4">
                                                {/* Preview Box */}
                                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                                    <h3 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                                                        <Info size={16}/> تقرير المعاينة
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <span className="text-slate-500 block">عدد التلاميذ:</span>
                                                            <span className="font-bold text-slate-800 text-lg">{previewGlobalCount}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-indigo-200">
                                                        <span className="text-slate-500 block mb-1">المواد التي تم التعرف عليها:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {previewGlobalSubjects.map(sub => (
                                                                <span key={sub} className="bg-white px-2 py-1 rounded border text-indigo-700 font-bold text-[10px]">{sub}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button onClick={initiateSave} className="w-full bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold">حفظ الشبكة الإجمالية</button>
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
