
import React, { useState, useRef, useMemo } from 'react';
import { Upload, Save, Check, ArrowLeftRight, School, Users, FileSpreadsheet, AlertTriangle, BarChart2, Layers, BookOpen, Filter, Trash2, PieChart, Database, Download, FileJson, RefreshCcw } from 'lucide-react';
import { AcqStudent, AcqClassRecord, AcqFilterState } from '../../types/acquisitions';
import { parseAcqExcel } from '../../utils/acqParser';
import { saveAcqRecord, getAcqDB, deleteAcqRecord } from '../../services/acqStorage';
import AcqStatsDashboard from './AcqStatsDashboard';

interface AcqManagerProps {
    availableSchools: string[];
    onDataUpdated?: () => void;
    externalFilters: AcqFilterState; // Passed from App state
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

const AcqManager: React.FC<AcqManagerProps> = ({ availableSchools, onDataUpdated, externalFilters }) => {
    // Main View State: 'data' (Upload/List) or 'stats' (Dashboard)
    // Default to 'stats' if we have data, else 'data'
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

    // --- EXCEL PARSING ---
    const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedLevel || !selectedSubject) {
            alert("يرجى اختيار المستوى والمادة قبل رفع الملف لضمان قراءة البيانات بشكل صحيح.");
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
        if (!selectedSchool || !selectedLevel || !selectedSubject || !className || previewStudents.length === 0) {
            alert("يرجى إكمال جميع الحقول ورفع ملف يحتوي على بيانات.");
            return;
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
        
        setClassName('');
        setPreviewStudents([]);
        setFileName('');
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
            <div className="bg-white border-b px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                        <BarChart2 className="text-teal-600" size={24} />
                        فضاء تقييم المكتسبات
                    </h1>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
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
                                                    <School size={14} /> المدرسة
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
                                                    <Layers size={14} /> المستوى
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
                                                    <BookOpen size={14} /> المادة
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
                                                    <Users size={14} /> الفوج
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={className}
                                                    onChange={e => setClassName(e.target.value)}
                                                    placeholder="مثلاً: 2أ"
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>

                                        {/* 2. File Upload */}
                                        <div 
                                            onClick={() => {
                                                if (!selectedSubject) alert("اختر المستوى والمادة أولاً");
                                                else fileInputRef.current?.click();
                                            }}
                                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative
                                                ${!selectedSubject ? 'opacity-50 border-slate-200 bg-slate-50' : 
                                                fileName ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'}
                                            `}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                accept=".xls,.xlsx"
                                                onChange={handleFileRead}
                                                className="hidden" 
                                                disabled={!selectedSubject}
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
                                                        <p className="text-slate-400 text-xs mt-1">يجب أن يطابق الملف: {selectedLevel || '...'} - {selectedSubject || '...'}</p>
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