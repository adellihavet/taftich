
import React, { useMemo } from 'react';
import { AcqFilterState, AcqClassRecord } from '../../types/acquisitions';
import { Map, School, Users, Layers, BookOpen, Filter } from 'lucide-react';

interface AcqSidebarProps {
    records: AcqClassRecord[];
    availableSchools: string[];
    filters: AcqFilterState;
    onUpdateFilters: (updates: Partial<AcqFilterState>) => void;
}

const AcqSidebar: React.FC<AcqSidebarProps> = ({ records, availableSchools, filters, onUpdateFilters }) => {
    
    // --- Dynamic Options Computation ---
    const activeLevels = useMemo(() => {
        const levels = new Set<string>();
        records.forEach(r => {
            if (filters.scope === 'district' || r.schoolName === filters.selectedSchool) {
                levels.add(r.level);
            }
        });
        return Array.from(levels).sort();
    }, [records, filters.scope, filters.selectedSchool]);

    const activeClasses = useMemo(() => {
        if (filters.scope !== 'class' || !filters.selectedSchool || !filters.selectedLevel) return [];
        const classes = new Set<string>();
        records.forEach(r => {
            if (r.schoolName === filters.selectedSchool && r.level === filters.selectedLevel) {
                classes.add(r.className);
            }
        });
        return Array.from(classes).sort();
    }, [records, filters.scope, filters.selectedSchool, filters.selectedLevel]);

    const activeSubjects = useMemo(() => {
        if (!filters.selectedLevel) return [];
        const subjects = new Set<string>();
        records.forEach(r => {
            if (r.level === filters.selectedLevel) {
                if (filters.scope === 'district') {
                    subjects.add(r.subject);
                } else if (filters.selectedSchool && r.schoolName === filters.selectedSchool) {
                    subjects.add(r.subject);
                }
            }
        });
        return Array.from(subjects).sort();
    }, [records, filters.scope, filters.selectedSchool, filters.selectedLevel]);

    return (
        <div className="h-full flex flex-col p-3 animate-in slide-in-from-left-4 bg-white/50">
            
            {/* 1. Scope Selection (Horizontal Tabs) */}
            <div className="bg-slate-100 p-1 rounded-xl flex mb-4 shadow-inner">
                <button 
                    onClick={() => onUpdateFilters({ scope: 'district', selectedSchool: '', selectedClass: '', selectedSubject: '' })}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${filters.scope === 'district' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Map size={14} />
                    <span>المقاطعة</span>
                </button>
                <div className="w-px bg-slate-200 my-1 mx-1"></div>
                <button 
                    onClick={() => onUpdateFilters({ scope: 'school', selectedClass: '', selectedSubject: '' })}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${filters.scope === 'school' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <School size={14} />
                    <span>المدرسة</span>
                </button>
                <div className="w-px bg-slate-200 my-1 mx-1"></div>
                <button 
                    onClick={() => onUpdateFilters({ scope: 'class', selectedSubject: '' })}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${filters.scope === 'class' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Users size={14} />
                    <span>القسم</span>
                </button>
            </div>

            {/* 2. Dropdowns Stack */}
            <div className="space-y-3">
                
                {/* School Dropdown */}
                <div className={`relative ${filters.scope === 'district' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="relative">
                        <select 
                            value={filters.selectedSchool}
                            onChange={(e) => onUpdateFilters({ selectedSchool: e.target.value, selectedLevel: '', selectedSubject: '', selectedClass: '' })}
                            className="w-full p-2.5 pl-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        >
                            <option value="">{filters.scope === 'district' ? 'تحليل شامل للمقاطعة' : '-- اختر المدرسة --'}</option>
                            {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <School size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Level Dropdown */}
                <div className="relative">
                    <div className="relative">
                        <select 
                            value={filters.selectedLevel}
                            onChange={(e) => onUpdateFilters({ selectedLevel: e.target.value, selectedSubject: '' })}
                            className="w-full p-2.5 pl-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        >
                            <option value="">-- المستوى الدراسي --</option>
                            {activeLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <Layers size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Class Dropdown */}
                {filters.scope === 'class' && (
                    <div className="relative animate-in fade-in slide-in-from-top-1">
                        <div className="relative">
                            <select 
                                value={filters.selectedClass}
                                onChange={(e) => onUpdateFilters({ selectedClass: e.target.value, selectedSubject: '' })}
                                className="w-full p-2.5 pl-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            >
                                <option value="">-- الفوج التربوي --</option>
                                {activeClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <Users size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Subject Dropdown */}
                <div className={`relative ${!filters.selectedLevel ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="relative">
                        <select 
                            value={filters.selectedSubject}
                            onChange={(e) => onUpdateFilters({ selectedSubject: e.target.value })}
                            className="w-full p-2.5 pl-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        >
                            <option value="">-- المادة / النشاط --</option>
                            {activeSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <BookOpen size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

            </div>
            
            {/* Status Footer */}
            <div className="mt-auto pt-4 border-t border-slate-200 text-center">
               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${filters.selectedSubject ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                   <div className={`w-2 h-2 rounded-full ${filters.selectedSubject ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                   {filters.selectedSubject ? 'التحليل جاهز للعرض' : 'بانتظار الاختيار...'}
               </span>
            </div>
        </div>
    );
};

export default AcqSidebar;
