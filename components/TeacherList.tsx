
import React, { useRef, useState, useMemo } from 'react';
import { Teacher, ReportData } from '../types';
import { User, Plus, Download, Upload, Search, Trash2, Layers, ChevronDown, ChevronRight, ArrowUpCircle, Filter, School, BookOpen, X, MoreVertical, FileSpreadsheet } from 'lucide-react';
import { generateCSVContent, parseCSVContent, generateSchoolTemplate, parseSchoolExcel } from '../utils/sheetHelper';

interface TeacherListProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>; 
    currentReport?: ReportData; 
    onSelect: (t: Teacher) => void;
    selectedId: string;
    onAddNew: () => void;
    onImport: (teachers: Teacher[], reportsMap: Record<string, ReportData>) => void; 
    onDelete: (id: string) => void;
    
    availableSchools: string[];
    availableLevels: string[];
    filterSchool: string;
    filterLevel: string;
    onSetFilterSchool: (s: string) => void;
    onSetFilterLevel: (l: string) => void;
}

type GroupBy = 'none' | 'status' | 'rank';

const TeacherList: React.FC<TeacherListProps> = ({ 
    teachers, 
    reportsMap,
    currentReport,
    onSelect, 
    selectedId, 
    onAddNew, 
    onImport, 
    onDelete,
    availableSchools,
    availableLevels,
    filterSchool,
    filterLevel,
    onSetFilterSchool,
    onSetFilterLevel
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [groupBy, setGroupBy] = useState<GroupBy>('status'); 
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [showFilters, setShowFilters] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    
    const csvInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const isEligibleForPromotion = (t: Teacher) => {
        if (!t || t.status !== 'titulaire' || !t.echelonDate || !t.echelon) return false;
        const currentYear = new Date().getFullYear();
        const echelonDate = new Date(t.echelonDate);
        if (isNaN(echelonDate.getTime())) return false;
        
        const twoYearsMark = new Date(echelonDate);
        twoYearsMark.setFullYear(echelonDate.getFullYear() + 2);
        const cutOffDate = new Date(currentYear, 11, 31);
        
        if (twoYearsMark > cutOffDate) return false;
        
        const currentEchelon = parseInt(t.echelon);
        const maxAllowedMark = 13 + (currentEchelon * 0.5);
        
        if (t.lastMark >= maxAllowedMark) return false;

        const activeReport = reportsMap[t.id];
        if (activeReport) {
            const isDateFilled = activeReport.inspectionDate && activeReport.inspectionDate.trim() !== '';
            const isMarkFilled = activeReport.finalMark !== undefined && activeReport.finalMark > 0;
            if (isDateFilled && isMarkFilled) return false;
        }

        return true;
    };

    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => 
            t && t.fullName && t.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teachers, searchQuery]);

    const groupedTeachers = useMemo(() => {
        if (groupBy === 'none') return { 'الكل': filteredTeachers };

        const groups: Record<string, Teacher[]> = {};
        
        filteredTeachers.forEach(t => {
            let key = '';
            if (groupBy === 'status') {
                key = t.status === 'titulaire' ? 'مرسم' : t.status === 'contractuel' ? 'متعاقد' : 'متربص';
            } else if (groupBy === 'rank') {
                key = t.rank || 'بدون رتبة';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        return groups;
    }, [filteredTeachers, groupBy]);

    const handleExportBackup = () => {
        const csvContent = generateCSVContent(teachers, currentReport, reportsMap);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'teachers_full_db.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const data = generateSchoolTemplate();
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'نموذج_معلومات_الاساتذة_للمدارس.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            try {
                const { teachers: newTeachers, reportsMap: newReports } = parseCSVContent(text);
                if (newTeachers.length > 0) {
                    if (window.confirm(`تم العثور على ${newTeachers.length} أستاذ. هل تريد استبدال/تحديث القائمة الحالية؟`)) {
                        onImport(newTeachers, newReports);
                    }
                }
            } catch (error) {
                alert('خطأ في قراءة ملف النسخة الاحتياطية.');
            }
            if (csvInputRef.current) csvInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result as ArrayBuffer;
            try {
                const newTeachers = parseSchoolExcel(data);
                if (newTeachers.length > 0) {
                    const msg = `تم قراءة ${newTeachers.length} أستاذ من الملف.\nسيتم دمجهم مع القائمة الحالية. في حال تكرار الاسم سيتم تحديث المعلومات.`;
                    if (window.confirm(msg)) {
                        onImport(newTeachers, {}); 
                    }
                } else {
                    alert("لم يتم العثور على بيانات في الملف. تأكد من استخدام النموذج الصحيح.");
                }
            } catch (error) {
                console.error(error);
                alert('خطأ في قراءة ملف Excel. تأكد أنه ملف صالح.');
            }
            if (excelInputRef.current) excelInputRef.current.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-white/80 backdrop-blur-sm z-10 space-y-2.5 shadow-sm">
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="بحث عن أستاذ..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                    <button onClick={onAddNew} title="إضافة أستاذ جديد" className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all border ${showFilters || filterSchool || filterLevel ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            <Filter size={14} />
                            <span>تصفية</span>
                            {(filterSchool || filterLevel) && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>}
                        </button>
                        <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200">
                            <button onClick={() => setGroupBy('none')} className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${groupBy === 'none' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الكل</button>
                            <button onClick={() => setGroupBy('status')} className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${groupBy === 'status' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الوضعية</button>
                            <button onClick={() => setGroupBy('rank')} className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${groupBy === 'rank' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الرتبة</button>
                        </div>
                    </div>

                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className={`p-1.5 rounded-lg transition-colors ${showMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
                            <MoreVertical size={18} />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 shadow-xl rounded-xl w-56 z-20 overflow-hidden flex flex-col py-1 text-xs font-bold text-gray-600 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-3 py-2 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">ملفات المدارس (Excel)</div>
                                    <button onClick={() => { handleDownloadTemplate(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 hover:text-green-700 w-full text-right transition-colors text-green-600">
                                        <FileSpreadsheet size={14} /> تحميل نموذج للمدارس
                                    </button>
                                    <button onClick={() => { excelInputRef.current?.click(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 hover:text-green-700 w-full text-right transition-colors text-green-600 border-b border-gray-50">
                                        <Upload size={14} /> رفع ملف مدرسة (Excel)
                                    </button>

                                    <div className="px-3 py-2 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50 mt-1">قاعدة البيانات (Backup)</div>
                                    <button onClick={() => { handleExportBackup(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 w-full text-right transition-colors">
                                        <Download size={14} /> تصدير كامل (CSV)
                                    </button>
                                    <button onClick={() => { csvInputRef.current?.click(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 hover:text-orange-700 w-full text-right transition-colors">
                                        <Upload size={14} /> استيراد كامل (CSV)
                                    </button>
                                    
                                    <input type="file" ref={csvInputRef} accept=".csv" className="hidden" onChange={handleImportCSV}/>
                                    <input type="file" ref={excelInputRef} accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel}/>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                        <div className="relative group">
                            <School size={14} className="absolute top-2.5 right-2.5 text-indigo-400 pointer-events-none group-focus-within:text-indigo-600" />
                            <select value={filterSchool} onChange={(e) => onSetFilterSchool(e.target.value)} className={`w-full p-2 pr-8 text-[11px] rounded-lg border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors cursor-pointer ${filterSchool ? 'bg-indigo-100 border-indigo-300 font-bold text-indigo-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                                <option value="">جميع المدارس</option>
                                {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="relative group">
                            <BookOpen size={14} className="absolute top-2.5 right-2.5 text-indigo-400 pointer-events-none group-focus-within:text-indigo-600" />
                            <select value={filterLevel} onChange={(e) => onSetFilterLevel(e.target.value)} className={`w-full p-2 pr-8 text-[11px] rounded-lg border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors cursor-pointer ${filterLevel ? 'bg-indigo-100 border-indigo-300 font-bold text-indigo-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                                <option value="">جميع المستويات</option>
                                {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/30 scroll-smooth">
                {Object.keys(groupedTeachers).length === 0 && (
                     <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
                        <User size={48} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">لا توجد نتائج</p>
                        <p className="text-xs mt-1 opacity-70">جرب تغيير معايير البحث أو التصفية</p>
                    </div>
                )}

                {Object.entries(groupedTeachers).map(([groupName, groupItems]) => (
                    <div key={groupName} className="mb-2">
                        {groupBy !== 'none' && (
                            <div onClick={() => toggleGroup(groupName)} className="flex items-center justify-between px-3 py-1.5 mb-1 cursor-pointer hover:bg-white/80 rounded-lg select-none transition-colors group">
                                <div className="flex items-center gap-2">
                                    {expandedGroups[groupName] ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{groupName}</span>
                                    <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 rounded-full min-w-[20px] text-center">{groupItems.length}</span>
                                </div>
                            </div>
                        )}
                        <div className={`${groupBy !== 'none' && expandedGroups[groupName] ? 'hidden' : 'block'} space-y-1.5`}>
                            {groupItems.map(t => {
                                if (!t || !t.id) return null; // Safety check
                                const promotionDue = isEligibleForPromotion(t);
                                const isSelected = selectedId === t.id;
                                return (
                                <div key={t.id} onClick={() => onSelect(t)} className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 group cursor-pointer relative overflow-hidden ${isSelected ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-md transform scale-[1.01]' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden flex-1 relative z-10">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors relative shadow-sm ${isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                            {t.fullName ? t.fullName.charAt(0) : '?'}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${t.status === 'titulaire' ? 'bg-emerald-500' : t.status === 'contractuel' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{t.fullName}</p>
                                                {promotionDue && <ArrowUpCircle size={14} className={`${isSelected ? 'text-yellow-300' : 'text-amber-500'} animate-pulse shrink-0 ml-1`} />}
                                            </div>
                                            <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{t.rank}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center relative z-10">
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className={`p-1.5 rounded-full transition-all ${isSelected ? 'text-red-200 hover:bg-white/20 hover:text-white' : 'text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100'}`} title="حذف">
                                            <Trash2 size={14} />
                                        </button>
                                        {isSelected && <ChevronDown size={14} className="text-white/50 -rotate-90 mr-1" />}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherList;
