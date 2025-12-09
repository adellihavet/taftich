
import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_CIVICS_DEF } from '../../../constants/acqYear5Civics';
import { 
    Activity, Target, TrendingUp, AlertTriangle, Lightbulb, Users, School, 
    BookOpen, Zap, Moon, PenTool, Link2, 
    ArrowUpRight, X, Info, Maximize2, Minimize2, CheckCircle2, Microscope, 
    Edit, Save, RotateCcw, ChevronRight, Scale, ScatterChart, User, Ruler, HelpCircle,
    Building2, HeartHandshake, Fingerprint
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

type AnalysisSection = 'citizenMatrix' | 'institutionalAwareness' | 'activeCitizenship' | 'democracyIndex';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string }> = {
    citizenMatrix: {
        title: "مصفوفة المواطنة (المعرفة / الممارسة)",
        concept: "أداة لقياس الفجوة بين 'الوعي المدني' (معرفة المؤسسات والقوانين) وبين 'السلوك المواطني' (الممارسة اليومية والمواقف).",
        method: "تقاطع معدل الكفاءات المعرفية (1+3) مع معدل الكفاءة السلوكية (2)."
    },
    institutionalAwareness: {
        title: "الوعي المؤسساتي",
        concept: "مدى إدراك المتعلم لدور مؤسسات الدولة والخدمات العمومية وكيفية التعامل مع وثائقها.",
        method: "حساب معدل التحكم في الكفاءة الأولى (التعايش مع المحيط)."
    },
    activeCitizenship: {
        title: "المواطنة الفاعلة",
        concept: "قدرة المتعلم على اتخاذ مواقف إيجابية واقتراح حلول للمشكلات (الانتقال من السلبية إلى الفاعلية).",
        method: "حساب معدل التحكم في الكفاءة الثانية (المشاركة في ترسيخ قيم المواطنة)."
    },
    democracyIndex: {
        title: "مؤشر الثقافة الديمقراطية",
        concept: "مدى استيعاب المتعلم لقواعد العيش المشترك، الحوار، واحترام الرأي الآخر والمؤسسات.",
        method: "حساب معدل التحكم في الكفاءة الثالثة (ترقية الممارسات الديمقراطية)."
    }
};

const AcqYear5CivicsStats: React.FC<Props> = ({ records, scope, contextName }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, text: string, title?: string } | null>(null);
    
    // Scatter Plot State
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, name: string, knowledge: number, practice: number } | null>(null);
    const [hoveredQuad, setHoveredQuad] = useState<{ title: string, desc: string, x: string, y: string } | null>(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
    const [customAnalysis, setCustomAnalysis] = useState<Record<string, AnalysisContent>>({});

    useEffect(() => {
        const key = `mufattish_analysis_y5_civics_${contextName}_${scope}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setCustomAnalysis(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, [contextName, scope]);

    const handleSaveAnalysis = (section: string, data: AnalysisContent) => {
        const newAnalysis = { ...customAnalysis, [section]: data };
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_y5_civics_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null);
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_y5_civics_${contextName}_${scope}`, JSON.stringify(newAnalysis));
    };

    // --- 1. DATA PREPARATION ---
    const allStudents = useMemo(() => {
        return records.flatMap(r => r.students.map(s => ({ ...s, className: r.className, schoolName: r.schoolName })));
    }, [records]);

    const totalStudents = allStudents.length;

    const getGrade = (student: any, compId: string, critId: number) => {
        if (!student.results) return null;
        const comp = student.results[compId];
        if (!comp) return null;
        return comp[critId] || comp[String(critId)];
    };

    // --- 2. METRICS ---

    // A. Institutional Awareness (Comp 1)
    const instAwareness = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
            YEAR5_CIVICS_DEF.competencies[0].criteria.forEach(crit => {
                const g = getGrade(s, 'coexistence', crit.id);
                if(g) {
                    max += 3;
                    if(g === 'A') score += 3; else if(g === 'B') score += 2; else if(g === 'C') score += 1;
                }
            });
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // B. Active Citizenship (Comp 2)
    const activeCitizenshipStats = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
            YEAR5_CIVICS_DEF.competencies[1].criteria.forEach(crit => {
                const g = getGrade(s, 'citizenship', crit.id);
                if(g) {
                    max += 3;
                    if(g === 'A') score += 3; else if(g === 'B') score += 2; else if(g === 'C') score += 1;
                }
            });
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // C. Democracy Index (Comp 3)
    const democracyStats = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
            YEAR5_CIVICS_DEF.competencies[2].criteria.forEach(crit => {
                const g = getGrade(s, 'democracy', crit.id);
                if(g) {
                    max += 3;
                    if(g === 'A') score += 3; else if(g === 'B') score += 2; else if(g === 'C') score += 1;
                }
            });
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // D. Citizenship Matrix (Knowledge vs Practice)
    const citizenMatrixData = useMemo(() => {
        const points: { x: number, y: number, name: string }[] = [];
        let count = 0;

        allStudents.forEach(s => {
            // Knowledge: Comp 1 + Comp 3
            let kScore = 0, kMax = 0;
            // Comp 1
            YEAR5_CIVICS_DEF.competencies[0].criteria.forEach(crit => {
                const g = getGrade(s, 'coexistence', crit.id);
                if(g) { kMax += 3; if(g==='A') kScore+=3; else if(g==='B') kScore+=2; else if(g==='C') kScore+=1; }
            });
            // Comp 3
            YEAR5_CIVICS_DEF.competencies[2].criteria.forEach(crit => {
                const g = getGrade(s, 'democracy', crit.id);
                if(g) { kMax += 3; if(g==='A') kScore+=3; else if(g==='B') kScore+=2; else if(g==='C') kScore+=1; }
            });
            const xVal = kMax > 0 ? (kScore / kMax) * 100 : 0;

            // Practice: Comp 2
            let pScore = 0, pMax = 0;
            YEAR5_CIVICS_DEF.competencies[1].criteria.forEach(crit => {
                const g = getGrade(s, 'citizenship', crit.id);
                if(g) { pMax += 3; if(g==='A') pScore+=3; else if(g==='B') pScore+=2; else if(g==='C') pScore+=1; }
            });
            const yVal = pMax > 0 ? (pScore / pMax) * 100 : 0;

            points.push({ x: xVal, y: yVal, name: s.fullName });
            count++;
        });

        return { points, count };
    }, [allStudents]);


    // --- 3. ANALYSIS GENERATION ---

    const getDefaultAnalysis = (section: string): AnalysisContent => {
        if (section === 'institutionalAwareness') {
            return {
                reading: `نسبة التحكم في الوعي المؤسساتي بلغت ${instAwareness.toFixed(1)}%.`,
                diagnosis: instAwareness > 60 
                    ? "التلاميذ يدركون جيداً دور المؤسسات (البريد، البلدية) وكيفية التعامل مع وثائقها."
                    : "نقص في الثقافة المؤسساتية. التلاميذ يجهلون أدوار المرافق العامة.",
                recommendation: "تنظيم زيارات ميدانية لمرافق عمومية أو محاكاة أدوار داخل القسم (مكتب بريد مصغر)."
            };
        }
        
        if (section === 'activeCitizenship') {
            return {
                reading: `مؤشر المواطنة الفاعلة (المواقف والسلوكات) هو ${activeCitizenshipStats.toFixed(1)}%.`,
                diagnosis: activeCitizenshipStats > 60
                    ? "التلاميذ قادرون على اقتراح حلول للمشاكل البيئية والاجتماعية."
                    : "المواطنة مازالت مفهوماً نظرياً. التلاميذ لا يبادرون بحلول عملية.",
                recommendation: "تفعيل نوادي البيئة والمواطنة وتكليف التلاميذ بمشاريع صغيرة (نظافة، تشجير)."
            };
        }

        if (section === 'democracyIndex') {
            return {
                reading: `مؤشر الثقافة الديمقراطية بلغ ${democracyStats.toFixed(1)}%.`,
                diagnosis: "يعكس مدى تشبع التلاميذ بقيم الحوار وانتخاب الممثلين.",
                recommendation: "ترسيخ السلوك الديمقراطي عبر انتخاب مندوبي القسم ومجلس التلاميذ."
            };
        }

        if (section === 'citizenMatrix') {
            return {
                reading: `تحليل العلاقة بين المعرفة المدنية والممارسة الميدانية.`,
                diagnosis: "هل التلميذ الذي يحفظ قوانين المرور يحترمها في الواقع؟",
                recommendation: "التركيز على تقييم المواقف والسلوكات أكثر من الحفظ الأصم للمواد القانونية."
            };
        }

        return { reading: '', diagnosis: '', recommendation: '' };
    };

    const getAnalysis = (section: string) => {
        return customAnalysis[section] || getDefaultAnalysis(section);
    };

    // --- HELPERS ---
    const ExpandBtn = ({ section }: { section: AnalysisSection }) => (
        <button 
            onClick={(e) => { e.stopPropagation(); setExpandedSection(section); }}
            className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 z-10 shadow-sm"
        >
            <Maximize2 size={18} />
        </button>
    );

    const handleMouseEnter = (e: React.MouseEvent, title: string, text: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredData({ x: rect.left + rect.width / 2, y: rect.top - 15, text, title });
    };

    const handleMouseLeave = () => setHoveredData(null);

    // --- EXPANDED VIEW ---
    const renderExpandedView = () => {
        if (!expandedSection) return null;
        const def = METRIC_DEFINITIONS[expandedSection];
        const activeAnalysis = getAnalysis(expandedSection);

        let content = null;
        let analysisIcon = null;

        switch (expandedSection) {
            case 'citizenMatrix':
                analysisIcon = <Users size={24} className="text-blue-500" />;
                content = (
                    <div className="h-full flex flex-col items-center justify-center w-full p-4 relative">
                        <div className="flex flex-col gap-4 items-center w-full max-w-5xl justify-center">
                            
                            {/* Point Tooltip */}
                            {hoveredPoint && (
                                <div 
                                    className={`fixed z-[9999] pointer-events-none transform -translate-x-1/2 mb-2 transition-all duration-200`}
                                    style={{ 
                                        left: hoveredPoint.x, 
                                        top: hoveredPoint.y,
                                        marginTop: hoveredPoint.y < 250 ? '20px' : '-100%', 
                                        transform: hoveredPoint.y < 250 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                                    }}
                                >
                                    <div className="bg-slate-900 border border-slate-500 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] p-4 w-64 text-white relative">
                                        <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{hoveredPoint.name.charAt(0)}</div>
                                            <div className="font-bold text-sm truncate">{hoveredPoint.name}</div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                    <span>المعرفة (مؤسسات/قوانين)</span>
                                                    <span className="text-blue-400">{hoveredPoint.knowledge.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${hoveredPoint.knowledge}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                    <span>الممارسة (سلوك/مواقف)</span>
                                                    <span className="text-emerald-400">{hoveredPoint.practice.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${hoveredPoint.practice}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative w-[500px] h-[500px] bg-slate-800/50 rounded-2xl border border-slate-700 shadow-2xl shrink-0 overflow-hidden">
                                
                                {/* Background Quadrants */}
                                <div className="absolute inset-0 z-10">
                                    <div 
                                        className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-600/30 cursor-help hover:bg-white/5 transition-colors"
                                        onMouseEnter={() => setHoveredQuad({title: "مواطن إيجابي (مسؤول)", desc: "يعرف حقوقه وواجباته ويمارسها بفعالية.", x: '75%', y: '25%'})}
                                        onMouseLeave={() => setHoveredQuad(null)}
                                    ></div>
                                    <div 
                                        className="absolute bottom-0 left-0 w-1/2 h-1/2 border-t border-r border-slate-600/30 cursor-help hover:bg-white/5 transition-colors"
                                        onMouseEnter={() => setHoveredQuad({title: "مواطن سلبي", desc: "ضعف في الوعي المدني وضعف في المشاركة.", x: '25%', y: '75%'})}
                                        onMouseLeave={() => setHoveredQuad(null)}
                                    ></div>
                                    <div 
                                        className="absolute top-0 left-0 w-1/2 h-1/2 cursor-help hover:bg-white/5 transition-colors"
                                        onMouseEnter={() => setHoveredQuad({title: "مواطن عفوي", desc: "سلوكه إيجابي بالفطرة لكن ينقصه الوعي القانوني.", x: '25%', y: '25%'})}
                                        onMouseLeave={() => setHoveredQuad(null)}
                                    ></div>
                                    <div 
                                        className="absolute bottom-0 right-0 w-1/2 h-1/2 cursor-help hover:bg-white/5 transition-colors"
                                        onMouseEnter={() => setHoveredQuad({title: "مواطن تنظيري", desc: "يحفظ القوانين نظرياً لكن لا يطبقها عملياً.", x: '75%', y: '75%'})}
                                        onMouseLeave={() => setHoveredQuad(null)}
                                    ></div>
                                </div>

                                {/* Grid & Lines */}
                                <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10%_10%]"></div>
                                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-500/50 border-r border-dashed border-slate-500/50 pointer-events-none z-10"></div>
                                <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-500/50 border-b border-dashed border-slate-500/50 pointer-events-none z-10"></div>

                                {/* Quad Tooltip */}
                                {hoveredQuad && !hoveredPoint && (
                                    <div 
                                        className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
                                        style={{ left: hoveredQuad.x, top: hoveredQuad.y }}
                                    >
                                        <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/50 rounded-xl p-3 shadow-2xl animate-in zoom-in-95 duration-200">
                                            <h4 className="text-indigo-300 font-bold text-lg mb-1">{hoveredQuad.title}</h4>
                                            <p className="text-xs text-slate-300 whitespace-nowrap">{hoveredQuad.desc}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Points */}
                                <div className="absolute inset-6 z-30 pointer-events-none">
                                    {citizenMatrixData.points.map((p, i) => {
                                        let colorClass = 'bg-slate-400';
                                        if (p.x >= 50 && p.y >= 50) colorClass = 'bg-emerald-400 ring-4 ring-emerald-500/20';
                                        else if (p.x < 50 && p.y < 50) colorClass = 'bg-red-400 ring-4 ring-red-500/20';
                                        else if (p.x >= 50 && p.y < 50) colorClass = 'bg-yellow-400 ring-4 ring-yellow-500/20';
                                        else colorClass = 'bg-blue-400 ring-4 ring-blue-500/20';

                                        return (
                                            <div 
                                                key={i}
                                                className="absolute w-8 h-8 -ml-4 -mb-4 flex items-center justify-center cursor-pointer group z-30 hover:z-50 pointer-events-auto"
                                                style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredPoint({ x: rect.left + rect.width/2, y: rect.top, name: p.name, knowledge: p.x, practice: p.y });
                                                }}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            >
                                                <div className={`w-3 h-3 rounded-full shadow-md border border-white/50 transition-transform duration-200 group-hover:scale-150 ${colorClass}`}></div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Labels */}
                                <div className="absolute bottom-1 right-2 text-[10px] text-blue-300 font-bold bg-slate-900/80 px-2 py-1 rounded z-10 pointer-events-none">
                                    الوعي المعرفي (مؤسسات/قوانين) →
                                </div>
                                <div className="absolute top-2 left-1 text-[10px] text-emerald-300 font-bold bg-slate-900/80 px-2 py-1 rounded writing-vertical z-10 pointer-events-none">
                                    ↑ السلوك والممارسة
                                </div>
                            </div>
                        </div>
                    </div>
                );
                break;
            
            case 'institutionalAwareness':
                analysisIcon = <Building2 size={24} className="text-blue-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="text-center space-y-4">
                            <span className="text-8xl font-bold text-blue-500 font-serif">{instAwareness.toFixed(0)}%</span>
                            <p className="text-blue-200 text-xl">مستوى الثقافة المؤسساتية</p>
                        </div>
                     </div>
                );
                break;

            case 'activeCitizenship':
                analysisIcon = <HeartHandshake size={24} className="text-emerald-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="text-center space-y-4">
                            <span className="text-8xl font-bold text-emerald-500 font-serif">{activeCitizenshipStats.toFixed(0)}%</span>
                            <p className="text-emerald-200 text-xl">مؤشر المواطنة الفاعلة</p>
                        </div>
                     </div>
                );
                break;

            case 'democracyIndex':
                analysisIcon = <Fingerprint size={24} className="text-purple-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="text-center space-y-4">
                            <span className="text-8xl font-bold text-purple-500 font-serif">{democracyStats.toFixed(0)}%</span>
                            <p className="text-purple-200 text-xl">مؤشر الوعي الديمقراطي</p>
                        </div>
                     </div>
                );
                break;
        }

        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col md:flex-row animate-in zoom-in-95 duration-300 overflow-hidden">
                <button onClick={() => setExpandedSection(null)} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full z-50 text-white transition-all">
                    <Minimize2 size={24} />
                </button>

                <div className="w-full md:w-[400px] lg:w-[35%] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl relative z-40 order-2 md:order-1 h-full">
                    <div className="p-8 pb-6 border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">{analysisIcon}</div>
                            <h2 className="text-2xl font-bold text-white font-serif">{def.title}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">تحليل استراتيجي للأداء التربوي</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                        <div className="space-y-8">
                             <div className="relative pl-4 border-r-2 border-slate-500/30 pr-4 bg-slate-800/30 p-4 rounded-l-xl">
                                    <h4 className="text-slate-300 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Info size={14}/> المفهوم التربوي</h4>
                                    <p className="text-slate-400 leading-relaxed text-xs text-justify font-light">{def.concept}</p>
                            </div>
                            <div className="relative pl-4 border-r-2 border-indigo-500/50 pr-4">
                                <h4 className="text-indigo-400 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Activity size={14}/> قراءة في البيانات</h4>
                                <p className="text-slate-300 leading-relaxed text-sm text-justify">{activeAnalysis.reading}</p>
                            </div>
                            <div className="relative pl-4 border-r-2 border-amber-500/50 pr-4 bg-amber-500/5 p-4 rounded-l-xl">
                                <h4 className="text-amber-400 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Microscope size={14}/> التشخيص البيداغوجي</h4>
                                <p className="text-slate-200 leading-relaxed text-sm font-medium text-justify">{activeAnalysis.diagnosis}</p>
                            </div>
                            <div className="relative pl-4 border-r-2 border-emerald-500/50 pr-4">
                                <h4 className="text-emerald-400 font-bold uppercase text-xs mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> التوصية</h4>
                                <p className="text-slate-300 leading-relaxed text-sm text-justify">{activeAnalysis.recommendation}</p>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                            <p className="text-xs text-slate-500">نظام المفتش التربوي الذكي © 2025</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col relative overflow-hidden order-1 md:order-2 h-full">
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    <div className="w-full z-20 p-4 shrink-0 flex justify-center">
                         <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 relative overflow-hidden max-w-xl w-full flex items-center gap-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg border border-white/10">
                                <Ruler size={16} className="text-indigo-300"/>
                            </div>
                             <div>
                                 <h4 className="text-[10px] font-bold text-indigo-300 uppercase mb-0.5">المرجعية الحسابية</h4>
                                 <p className="text-xs text-slate-300 leading-relaxed font-mono opacity-90">{def.method}</p>
                             </div>
                        </div>
                    </div>
                    <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-0 p-4 overflow-hidden">
                         {content}
                    </div>
                </div>
            </div>
        );
    };

    // --- MANUAL EDIT MODAL ---
    const renderEditModal = () => {
        if (!editingSection || !isEditMode) return null;
        return (
            <EditAnalysisForm 
                section={editingSection}
                initialData={getAnalysis(editingSection)}
                onSave={(data) => handleSaveAnalysis(editingSection, data)}
                onReset={() => handleResetAnalysis(editingSection)}
                onClose={() => setEditingSection(null)}
            />
        );
    };

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات للتحليل</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 relative">
            
            {/* TOOLTIP OVERLAY */}
            {hoveredData && (
                <div 
                    className="fixed z-[9999] pointer-events-none bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs max-w-xs border border-slate-700"
                    style={{ left: hoveredData.x, top: hoveredData.y, transform: 'translate(-50%, -100%)' }}
                >
                    {hoveredData.title && <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-yellow-400">{hoveredData.title}</div>}
                    <div>{hoveredData.text}</div>
                </div>
            )}

            {/* MODALS */}
            {renderExpandedView()}
            {renderEditModal()}

            {/* HEADER */}
            <div className="bg-gradient-to-r from-slate-900 to-cyan-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 size={300} /></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                            <Target size={14}/>
                            تحليل الوعي المدني
                        </div>
                        <h2 className="text-3xl font-bold font-serif mb-2">التربية المدنية (نهاية الطور)</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2"><School size={16}/> {contextName}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. CITIZEN MATRIX */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative lg:col-span-2"
                    onClick={() => setExpandedSection('citizenMatrix')}
                >
                    <ExpandBtn section="citizenMatrix" />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users className="text-blue-600" size={20}/> مصفوفة المواطنة (المعرفة vs الممارسة)</h3>
                            <p className="text-xs text-slate-400 mt-1">تصنيف التلاميذ حسب الوعي والسلوك</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">تحليل شامل</span>
                    </div>

                    <div className="h-48 relative border-l border-b border-slate-300 mx-4 bg-white/50 rounded-tr-xl">
                        {/* Preview Logic for Matrix */}
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500/5"></div>
                        
                        <div className="absolute inset-0">
                            {citizenMatrixData.points.map((p, i) => (
                                <div 
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{ 
                                        left: `${p.x}%`, 
                                        bottom: `${p.y}%`,
                                        backgroundColor: (p.x >= 50 && p.y >= 50) ? '#10b981' : (p.x < 50 && p.y < 50) ? '#f43f5e' : (p.x >= 50) ? '#facc15' : '#60a5fa',
                                        opacity: 0.6
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="absolute -bottom-6 w-full text-center text-[10px] text-slate-500 font-bold">الوعي المعرفي (القانوني)</div>
                        <div className="absolute -left-8 top-1/2 -rotate-90 text-[10px] text-slate-500 font-bold">السلوك (الممارسة)</div>
                    </div>
                </div>

                {/* 2. INSTITUTIONAL AWARENESS */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative"
                    onClick={() => setExpandedSection('institutionalAwareness')}
                >
                    <ExpandBtn section="institutionalAwareness" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Building2 className="text-blue-600" size={20}/> الوعي المؤسساتي</h3>
                    </div>
                    <div className="text-center py-6">
                        <span className="text-5xl font-bold text-blue-600 font-serif">{instAwareness.toFixed(0)}%</span>
                        <p className="text-xs text-slate-400 mt-2">معرفة المؤسسات والوثائق</p>
                    </div>
                </div>

                {/* 3. ACTIVE CITIZENSHIP */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative"
                    onClick={() => setExpandedSection('activeCitizenship')}
                >
                    <ExpandBtn section="activeCitizenship" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><HeartHandshake className="text-emerald-600" size={20}/> المواطنة الفاعلة</h3>
                    </div>
                    <div className="text-center py-6">
                        <span className="text-5xl font-bold text-emerald-600 font-serif">{activeCitizenshipStats.toFixed(0)}%</span>
                        <p className="text-xs text-slate-400 mt-2">المبادرة وحل المشكلات</p>
                    </div>
                </div>

                {/* 4. DEMOCRACY INDEX */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative lg:col-span-2"
                    onClick={() => setExpandedSection('democracyIndex')}
                >
                    <ExpandBtn section="democracyIndex" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Fingerprint className="text-purple-600" size={20}/> مؤشر الثقافة الديمقراطية</h3>
                    </div>
                    <div className="relative pt-2 px-4">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-slate-600">احترام الرأي والمؤسسات</span>
                            <span className="text-purple-600">{democracyStats.toFixed(1)}%</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${democracyStats}%` }}></div>
                        </div>
                    </div>
                </div>

            </div>

             {/* EDIT BUTTON FOOTER */}
             <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                 <button 
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl border-2 border-slate-700 hover:border-slate-600 hover:scale-105 group"
                 >
                    <Edit size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>تعديل التحليل</span>
                 </button>
            </div>

             {/* MANUAL EDIT MODAL */}
             {isEditMode && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                    <Edit size={24} className="text-indigo-600"/>
                                    تعديل التحليل الآلي
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">تخصيص القراءة التربوية للمؤشرات</p>
                            </div>
                            <button onClick={() => setIsEditMode(false)} className="text-slate-400 hover:text-red-500"><X/></button>
                        </div>
                        
                        {!editingSection ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setEditingSection('citizenMatrix')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group col-span-2">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مصفوفة المواطنة</span>
                                </button>
                                <button onClick={() => setEditingSection('institutionalAwareness')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">الوعي المؤسساتي</span>
                                </button>
                                <button onClick={() => setEditingSection('activeCitizenship')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">المواطنة الفاعلة</span>
                                </button>
                                <button onClick={() => setEditingSection('democracyIndex')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group col-span-2">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">المؤشر الديمقراطي</span>
                                </button>
                            </div>
                        ) : (
                             <EditAnalysisForm 
                                section={editingSection}
                                initialData={getAnalysis(editingSection)}
                                onSave={(data) => handleSaveAnalysis(editingSection, data)}
                                onReset={() => handleResetAnalysis(editingSection)}
                                onClose={() => setEditingSection(null)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const EditAnalysisForm: React.FC<{
    section: AnalysisSection;
    initialData: AnalysisContent;
    onSave: (data: AnalysisContent) => void;
    onReset: () => void;
    onClose: () => void;
}> = ({ section, initialData, onSave, onReset, onClose }) => {
    const [formData, setFormData] = useState(initialData);

    const getTitle = () => {
        return METRIC_DEFINITIONS[section].title;
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
                 <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
                     <ChevronRight size={12} className="rotate-180"/> عودة للقائمة
                 </button>
                 <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{getTitle()}</span>
             </div>

             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">قراءة في البيانات</label>
                 <VoiceTextarea 
                    value={formData.reading} 
                    onChange={(v) => setFormData({...formData, reading: v})} 
                    className="w-full border rounded-lg p-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 max-h-60 overflow-y-auto"
                    minHeight="min-h-[120px]"
                 />
             </div>

             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">التشخيص البيداغوجي</label>
                 <VoiceTextarea 
                    value={formData.diagnosis} 
                    onChange={(v) => setFormData({...formData, diagnosis: v})} 
                    className="w-full border rounded-lg p-3 text-sm bg-amber-50 focus:bg-white focus:ring-2 focus:ring-amber-500 max-h-60 overflow-y-auto"
                    minHeight="min-h-[120px]"
                 />
             </div>

             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">التوصيات</label>
                 <VoiceTextarea 
                    value={formData.recommendation} 
                    onChange={(v) => setFormData({...formData, recommendation: v})} 
                    className="w-full border rounded-lg p-3 text-sm bg-emerald-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 max-h-60 overflow-y-auto"
                    minHeight="min-h-[120px]"
                 />
             </div>

             <div className="flex justify-between pt-4 border-t">
                 <button onClick={onReset} className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline">
                     <RotateCcw size={12}/> استرجاع النص الأصلي
                 </button>
                 <div className="flex gap-2">
                     <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">إلغاء</button>
                     <button onClick={() => onSave(formData)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2">
                         <Save size={16}/> حفظ التعديلات
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default AcqYear5CivicsStats;
