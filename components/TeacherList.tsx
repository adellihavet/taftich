
import React, { useRef, useState, useMemo } from 'react';
import { Teacher, ReportData } from '../types';
import { User, Plus, Search, Trash2, ChevronDown, ChevronRight, ArrowUpCircle, Filter, School, BookOpen, FileSpreadsheet, Download, AlertCircle, Clock, CheckCircle2, FileEdit } from 'lucide-react';
import { generateSchoolTemplate, parseSchoolExcel } from '../utils/sheetHelper';

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

type GroupBy = 'none' | 'status' | 'rank' | 'priority';

const TeacherList: React.FC<TeacherListProps> = ({ 
    teachers, 
    reportsMap,
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
    
    const excelInputRef = useRef<HTMLInputElement>(null);

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    // --- Strict Priority Logic ---
    const getPriorityStatus = (teacher: Teacher, activeReport?: ReportData) => {
        // 1. Rule: If current report has a valid date, status clears (Teacher is being visited)
        if (activeReport && activeReport.inspectionDate && activeReport.inspectionDate.trim() !== '') {
            return { status: null, reason: '' };
        }

        // 2. Rule: High Priority (> 3 Years from last inspection)
        if (!teacher.lastInspectionDate) {
             return { status: 'urgent', reason: 'لم يزر من قبل (أولوية قصوى)' };
        }

        const lastDate = new Date(teacher.lastInspectionDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

        if (diffYears >= 3) {
            return { 
                status: 'urgent', 
                reason: `مرت ${diffYears.toFixed(1)} سنة على آخر زيارة (تجاوز 3 سنوات)` 
            };
        }

        // 3. Rule: Medium Priority (Mark < Average for Echelon based on Official Grid)
        // Formula derived from grid: Minimum "Medium" Mark = 9.5 + (Echelon * 0.5)
        const echelon = parseInt(teacher.echelon || '0');
        const minMediumMark = 9.5 + (echelon * 0.5); // The lower bound of 'Medium' (Moyen)
        
        if (teacher.lastMark < minMediumMark) {
            return { 
                status: 'medium', 
                reason: `النقطة (${teacher.lastMark}) أقل من الحد الأدنى للمتوسط (${minMediumMark})` 
            };
        }

        return { status: null, reason: '' };
    };

    const getPriorityStyles = (status: string | null) => {
        switch (status) {
            case 'urgent':
                return { 
                    border: 'border-r-4 border-r-rose-600 bg-rose-50/40', 
                    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
                    label: 'أولوية قصوى',
                    icon: AlertCircle
                };
            case 'medium':
                return { 
                    border: 'border-r-4 border-r-orange-400 bg-orange-50/30', 
                    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
                    label: 'أولوية متوسطة',
                    icon: Clock
                };
            default:
                return { border: '', badgeColor: '', label: '', icon: null };
        }
    };

    const isEligibleForPromotion = (t: Teacher) => {
        if (t.status !== 'titulaire' || !t.echelonDate || !t.echelon) return false;
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
            t.fullName.toLowerCase().includes(searchQuery.toLowerCase())
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
            } else if (groupBy === 'priority') {
                const { status } = getPriorityStatus(t, reportsMap[t.id]);
                key = status === 'urgent' ? 'أولوية قصوى (> 3 سنوات)' : status === 'medium' ? 'أولوية متوسطة (نقطة ضعيفة)' : 'وضعية عادية';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        if (groupBy === 'priority') {
            const orderedKeys = ['أولوية قصوى (> 3 سنوات)', 'أولوية متوسطة (نقطة ضعيفة)', 'وضعية عادية'];
            const orderedGroups: Record<string, Teacher[]> = {};
            orderedKeys.forEach(k => {
                if(groups[k]) orderedGroups[k] = groups[k];
            });
            return orderedGroups;
        }

        return groups;
    }, [filteredTeachers, groupBy, reportsMap]);

    // Download School Template (Excel)
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

    // Import School Excel File
    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result as ArrayBuffer;
            try {
                const result = parseSchoolExcel(data); 
                if (result.teachers.length > 0) {
                    const msg = `تم قراءة ${result.teachers.length} أستاذ من الملف.\nسيتم إضافتهم للقائمة ومزامنة البيانات تلقائياً.`;
                    if (window.confirm(msg)) {
                        onImport(result.teachers, result.reports); 
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
            {/* --- COMPACT HEADER --- */}
            <div className="p-3 border-b bg-white/80 backdrop-blur-sm z-10 space-y-2.5 shadow-sm">
                
                {/* Row 1: Actions */}
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
                    
                    {/* Excel Actions */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1 border border-gray-200">
                        <button 
                            onClick={handleDownloadTemplate}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white transition-all"
                            title="تحميل نموذج Excel للمدارس"
                        >
                            <Download size={18} />
                        </button>
                        <div className="w-px bg-gray-300 my-1"></div>
                        <button 
                            onClick={() => excelInputRef.current?.click()}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-white hover:shadow-sm transition-all"
                            title="رفع ملف مدرسة (Excel)"
                        >
                            <FileSpreadsheet size={18} />
                        </button>
                        <input type="file" ref={excelInputRef} accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel}/>
                    </div>

                    <button 
                        onClick={onAddNew} 
                        title="إضافة أستاذ جديد" 
                        className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Row 2: Filters */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all border shrink-0 ${showFilters || filterSchool || filterLevel ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter size={14} />
                            <span>تصفية</span>
                            {(filterSchool || filterLevel) && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>}
                        </button>

                        {/* Grouping Chips */}
                        <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200 shrink-0">
                            <button onClick={() => setGroupBy('none')} className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${groupBy === 'none' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الكل</button>
                            <button onClick={() => setGroupBy('status')} className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${groupBy === 'status' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الوضعية</button>
                            <button onClick={() => setGroupBy('priority')} className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${groupBy === 'priority' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>الأولوية</button>
                        </div>
                    </div>
                </div>

                {/* Collapsible Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                        <div className="relative group">
                            <School size={14} className="absolute top-2.5 right-2.5 text-indigo-400 pointer-events-none group-focus-within:text-indigo-600" />
                            <select 
                                value={filterSchool}
                                onChange={(e) => onSetFilterSchool(e.target.value)}
                                className={`w-full p-2 pr-8 text-[11px] rounded-lg border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors cursor-pointer ${filterSchool ? 'bg-indigo-100 border-indigo-300 font-bold text-indigo-900' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <option value="">جميع المدارس</option>
                                {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="relative group">
                            <BookOpen size={14} className="absolute top-2.5 right-2.5 text-indigo-400 pointer-events-none group-focus-within:text-indigo-600" />
                            <select 
                                value={filterLevel}
                                onChange={(e) => onSetFilterLevel(e.target.value)}
                                className={`w-full p-2 pr-8 text-[11px] rounded-lg border appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors cursor-pointer ${filterLevel ? 'bg-indigo-100 border-indigo-300 font-bold text-indigo-900' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <option value="">جميع المستويات</option>
                                {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- LIST AREA --- */}
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
                            <div 
                                onClick={() => toggleGroup(groupName)}
                                className="flex items-center justify-between px-3 py-1.5 mb-1 cursor-pointer hover:bg-white/80 rounded-lg select-none transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedGroups[groupName] ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{groupName}</span>
                                    <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 rounded-full min-w-[20px] text-center">{groupItems.length}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className={`${groupBy !== 'none' && expandedGroups[groupName] ? 'hidden' : 'block'} space-y-2`}>
                            {groupItems.map(t => {
                                const promotionDue = isEligibleForPromotion(t);
                                const isSelected = selectedId === t.id;
                                
                                const { status, reason } = getPriorityStatus(t, reportsMap[t.id]);
                                const styles = getPriorityStyles(status);
                                const PriorityIcon = styles.icon;

                                return (
                                <div
                                    key={t.id}
                                    onClick={() => onSelect(t)}
                                    className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group cursor-pointer relative overflow-visible shadow-sm
                                        ${isSelected 
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent shadow-md transform scale-[1.01] z-10' 
                                            : `bg-white hover:border-gray-300 hover:shadow-md ${styles.border}`
                                        }`}
                                >
                                    {/* ELEGANT TOOLTIP FOR PRIORITY */}
                                    {status && !isSelected && (
                                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 whitespace-nowrap border border-slate-600">
                                            {reason}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                    )}

                                    {/* Pulse Effect for Urgent */}
                                    {status === 'urgent' && !isSelected && (
                                        <div className="absolute top-2 left-2 w-2 h-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 overflow-hidden flex-1 relative z-10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors relative shadow-sm
                                                ${isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                            {t.fullName.charAt(0)}
                                            
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center
                                                ${t.status === 'titulaire' ? 'bg-emerald-500' : t.status === 'contractuel' ? 'bg-orange-500' : 'bg-blue-500'}`} 
                                            >
                                                {/* Tiny status icon */}
                                            </div>
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{t.fullName}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {/* Modern Status Badge */}
                                                {!isSelected && styles.label && (
                                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${styles.badgeColor}`}>
                                                        {PriorityIcon && <PriorityIcon size={9} />}
                                                        <span>{styles.label}</span>
                                                    </div>
                                                )}
                                                
                                                <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {t.rank}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex flex-col items-end gap-1 relative z-10">
                                        {promotionDue && (
                                            <div title="معني بالترقية">
                                                <ArrowUpCircle 
                                                    size={16} 
                                                    className={`${isSelected ? 'text-yellow-300' : 'text-amber-500'} animate-pulse`} 
                                                />
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(t.id);
                                            }}
                                            className={`p-1.5 rounded-full transition-all mt-1
                                                ${isSelected 
                                                    ? 'text-red-200 hover:bg-white/20 hover:text-white' 
                                                    : 'text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100'
                                                }`}
                                            title="حذف"
                                        >
                                            <Trash2 size={14} />
                                        </button>
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