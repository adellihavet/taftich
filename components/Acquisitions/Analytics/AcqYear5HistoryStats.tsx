import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_HISTORY_DEF } from '../../../constants/acqYear5History';
import { 
    Activity, Target, TrendingUp, AlertTriangle, Lightbulb, MapPin, School, 
    BookOpen, Zap, Moon, PenTool, Link2, 
    ArrowUpRight, X, Info, Maximize2, Minimize2, CheckCircle2, Microscope, 
    Edit, Save, RotateCcw, ChevronRight, Scale, ScatterChart, User, Ruler, HelpCircle,
    Hourglass, FileText, Search
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    allRecords: AcqClassRecord[]; // Needed to find Arabic records for cross-analysis
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

type AnalysisSection = 'identityIndex' | 'chronoAwareness' | 'crossLang' | 'nationalDepth';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string }> = {
    identityIndex: {
        title: "مؤشر الهوية والانتماء",
        concept: "يقيس مدى تشبع المتعلم بالتاريخ الوطني (المقاومة والثورة) كركيزة أساسية لبناء الشخصية الوطنية.",
        method: "حساب معدل التحكم في الكفاءة الثانية (تأصيل التاريخ الوطني) التي تضم 4 معايير."
    },
    chronoAwareness: {
        title: "الوعي الزمني (التاريخ العام)",
        concept: "قدرة المتعلم على التموقع في الزمن وفهم التحولات الكبرى (العصور، الاستعمار).",
        method: "حساب معدل التحكم في الكفاءة الأولى (فهم التحولات في التاريخ العام)."
    },
    nationalDepth: {
        title: "عمق الفهم التاريخي",
        concept: "تحليل جودة اكتساب المعارف التاريخية: هل هي مجرد حفظ للأحداث أم فهم للأسباب والنتائج (مثل أسباب الاحتلال)؟",
        method: "تحليل نتائج المعيار الأول من الكفاءة الثانية (إدراك أسباب الاحتلال)."
    },
    crossLang: {
        title: "مصفوفة العائق اللغوي",
        concept: "التاريخ يُدرس ويُقوم باللغة العربية. هذا المؤشر يكشف إن كان ضعف التلميذ في التاريخ سببه 'تاريخي' أم 'لغوي' (عجز عن قراءة السند).",
        method: "تقاطع معدل 'القراءة العربية' (محور السينات) مع معدل 'التاريخ' (محور العينات) لتصنيف التلاميذ."
    }
};

const AcqYear5HistoryStats: React.FC<Props> = ({ records, allRecords, scope, contextName }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, text: string, title?: string } | null>(null);
    
    // State specifically for Scatter Plot Tooltip
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, name: string, gap: number, arabic: number, history: number } | null>(null);
    const [hoveredQuad, setHoveredQuad] = useState<{ title: string, desc: string, x: string, y: string } | null>(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
    const [customAnalysis, setCustomAnalysis] = useState<Record<string, AnalysisContent>>({});

    useEffect(() => {
        const key = `mufattish_analysis_y5_history_${contextName}_${scope}`;
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
        localStorage.setItem(`mufattish_analysis_y5_history_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null);
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_y5_history_${contextName}_${scope}`, JSON.stringify(newAnalysis));
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

    // --- 2. ADVANCED METRICS ---

    // A. Identity Index (National History)
    const identityStats = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
            YEAR5_HISTORY_DEF.competencies[1].criteria.forEach(crit => {
                const g = getGrade(s, 'national_history', crit.id);
                if(g) {
                    max += 3;
                    if(g === 'A') score += 3; else if(g === 'B') score += 2; else if(g === 'C') score += 1;
                }
            });
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // B. Chrono Awareness (General History)
    const chronoStats = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
            YEAR5_HISTORY_DEF.competencies[0].criteria.forEach(crit => {
                const g = getGrade(s, 'general_history', crit.id);
                if(g) {
                    max += 3;
                    if(g === 'A') score += 3; else if(g === 'B') score += 2; else if(g === 'C') score += 1;
                }
            });
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // C. National Depth (Understanding Causes)
    const depthStats = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
             // Criterion 1 of National History: Causes of Occupation
             const g = getGrade(s, 'national_history', 1);
             if(g) {
                 max += 3;
                 if(g === 'A') score += 3; else if(g === 'B') score += 2; else if(g === 'C') score += 1;
             }
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // D. Cross-Subject Analysis (History vs Arabic Reading)
    const crossAnalysis = useMemo(() => {
        if (!allRecords || allRecords.length === 0) return null;

        const points: { x: number, y: number, name: string }[] = [];
        let correlationSum = 0;
        let count = 0;

        const arabicMap = new Map();

        allRecords.forEach(r => {
            if (r.level === '5AP' && r.subject.includes('العربية')) {
                const keyPrefix = `${r.schoolName}-${r.className}`.trim();
                r.students.forEach(s => {
                    const uniqueKey = `${keyPrefix}-${s.fullName.trim()}`;
                    arabicMap.set(uniqueKey, s);
                });
            }
        });

        records.forEach(historyRecord => {
            const keyPrefix = `${historyRecord.schoolName}-${historyRecord.className}`.trim();
            
            historyRecord.students.forEach(hStudent => {
                const uniqueKey = `${keyPrefix}-${hStudent.fullName.trim()}`;
                const aStudent = arabicMap.get(uniqueKey);

                if (aStudent) {
                    // Arabic Reading Score (Comp 2)
                    let aReadScore = 0, aReadMax = 0;
                    [1, 2, 3, 4].forEach(id => {
                        const g = aStudent.results['reading_perf']?.[id];
                        if(g) { 
                            aReadMax += 3; 
                            if (g==='A') aReadScore += 3; else if (g==='B') aReadScore += 2; else if (g==='C') aReadScore += 1;
                        }
                    });
                    const xVal = aReadMax > 0 ? Math.min(100, (aReadScore / aReadMax) * 100) : 0;

                    // History Total Score
                    let hScore = 0, hMax = 0;
                    YEAR5_HISTORY_DEF.competencies.forEach(comp => {
                        comp.criteria.forEach(crit => {
                            const g = getGrade(hStudent, comp.id, crit.id);
                            if(g) {
                                hMax += 3;
                                if (g==='A') hScore += 3; else if (g==='B') hScore += 2; else if (g==='C') hScore += 1;
                            }
                        });
                    });
                    const yVal = hMax > 0 ? Math.min(100, (hScore / hMax) * 100) : 0;

                    points.push({ x: xVal, y: yVal, name: hStudent.fullName });
                    correlationSum += Math.abs(xVal - yVal);
                    count++;
                }
            });
        });

        if (count === 0) return null;
        const avgGap = correlationSum / count;
        return { points, count, avgGap };
    }, [records, allRecords]);


    // --- 3. ANALYSIS GENERATION ---

    const getDefaultAnalysis = (section: string): AnalysisContent => {
        if (section === 'identityIndex') {
            return {
                reading: `مؤشر التحكم في كفاءة التأصيل الوطني بلغ ${identityStats.toFixed(1)}%.`,
                diagnosis: identityStats > 60 
                    ? "مستوى جيد يعكس نجاح المدرسة في ترسيخ الوعي التاريخي الوطني." 
                    : "مؤشر منخفض يستدعي مراجعة طرائق تقديم أحداث الثورة والمقاومة.",
                recommendation: "تعزيز الدروس بالشرائط الوثائقية والزيارات الميدانية للمتاحف لربط المتعلم بتاريخه عاطفياً."
            };
        }
        
        if (section === 'chronoAwareness') {
            return {
                reading: `نسبة التحكم في فهم التحولات التاريخية العامة هي ${chronoStats.toFixed(1)}%.`,
                diagnosis: "هذه الكفاءة تتطلب قدرة على التجريد (العصور، الاستعمار). انخفاضها يدل على صعوبة في تخيل الزمن الطويل.",
                recommendation: "استخدام الخرائط التاريخية والسلالم الزمنية (Frise Chronologique) بشكل دائم في القسم."
            };
        }

        if (section === 'nationalDepth') {
             return {
                reading: `نسبة الإدراك العميق لأسباب الأحداث التاريخية هي ${depthStats.toFixed(1)}%.`,
                diagnosis: depthStats > 50 
                    ? "التلاميذ يتجاوزون السرد إلى التحليل والتعليل." 
                    : "غلبة الحفظ الصم للأحداث دون فهم دوافعها (لماذا احتلت فرنسا الجزائر؟).",
                recommendation: "اعتماد منهجية 'الوضعية المشكلة' في التاريخ بدلاً من السرد الإلقائي."
            };
        }

        if (section === 'crossLang') {
            if (!crossAnalysis) return { reading: "لا توجد بيانات مشتركة.", diagnosis: "", recommendation: "" };
            
            const gap = crossAnalysis.avgGap;
            return {
                reading: `متوسط الفارق بين كفاءة القراءة (عربية) والتحصيل في التاريخ هو ${gap.toFixed(1)} نقطة.`,
                diagnosis: gap < 15 
                    ? "ارتباط وثيق. تحسن مستوى اللغة ينعكس إيجاباً على التاريخ." 
                    : "وجود 'عائق لغوي'. التلميذ قد يفشل في التاريخ ليس لعدم فهم الأحداث، بل لعجزه عن قراءة السندات وفهم المصطلحات.",
                recommendation: "تدريب التلاميذ على قراءة السندات التاريخية في حصص اللغة العربية (نصوص تاريخية)."
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
            title="تكبير للتحليل المعمق"
        >
            <Maximize2 size={18} />
        </button>
    );

    const handleMouseEnter = (e: React.MouseEvent, title: string, text: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredData({ x: rect.left + rect.width / 2, y: rect.top - 15, text, title });
    };

    const handleMouseLeave = () => setHoveredData(null);

    // --- EXPANDED VIEW RENDER ---
    const renderExpandedView = () => {
        if (!expandedSection) return null;
        const def = METRIC_DEFINITIONS[expandedSection];
        const activeAnalysis = getAnalysis(expandedSection);

        let content = null;
        let analysisIcon = null;

        switch (expandedSection) {
            case 'identityIndex':
                analysisIcon = <MapPin size={24} className="text-emerald-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="text-center space-y-4">
                            <span className="text-8xl font-bold text-emerald-400 font-serif">{identityStats.toFixed(0)}%</span>
                            <p className="text-emerald-200 text-xl">مستوى ترسيخ الهوية الوطنية</p>
                        </div>
                     </div>
                );
                break;
            
            case 'chronoAwareness':
                analysisIcon = <Hourglass size={24} className="text-blue-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="relative w-64 h-64">
                             <svg className="w-full h-full" viewBox="0 0 100 100">
                                 <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
                                 <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="10" 
                                    strokeDasharray={`${(chronoStats * 283) / 100} 283`} 
                                    transform="rotate(-90 50 50)" 
                                    strokeLinecap="round"
                                 />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-4xl font-bold text-blue-400">{chronoStats.toFixed(0)}%</span>
                             </div>
                        </div>
                     </div>
                );
                break;

            case 'nationalDepth':
                analysisIcon = <Microscope size={24} className="text-amber-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="w-full max-w-lg space-y-6">
                            <div>
                                <div className="flex justify-between mb-2 text-amber-200">
                                    <span>الفهم السطحي (حفظ)</span>
                                    <span>الفهم العميق (تحليل)</span>
                                </div>
                                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${depthStats}%` }}></div>
                                </div>
                                <p className="text-center mt-2 text-3xl font-bold text-amber-400">{depthStats.toFixed(0)}%</p>
                            </div>
                        </div>
                     </div>
                );
                break;

            case 'crossLang':
                 analysisIcon = <Link2 size={24} className="text-indigo-400" />;
                 content = (
                    <div className="h-full flex flex-col items-center justify-center w-full p-4 relative">
                        {crossAnalysis ? (
                            <>
                                {/* Point Tooltip - HIGH Z-INDEX */}
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
                                                        <span>اللغة العربية (القراءة)</span>
                                                        <span className="text-blue-400">{hoveredPoint.arabic.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${hoveredPoint.arabic}%` }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                        <span>التاريخ (الفهم)</span>
                                                        <span className="text-amber-400">{hoveredPoint.history.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500" style={{ width: `${hoveredPoint.history}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 items-center w-full max-w-5xl justify-center">
                                    <div className="relative w-[500px] h-[500px] bg-slate-800/50 rounded-2xl border border-slate-700 shadow-2xl shrink-0 overflow-hidden">
                                        
                                        {/* BACKGROUND QUADRANTS (z-10) */}
                                        <div className="absolute inset-0 z-10">
                                            {/* Top Right */}
                                            <div 
                                                className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-600/30 cursor-help hover:bg-white/5 transition-colors"
                                                onMouseEnter={() => setHoveredQuad({title: "تحكم شامل", desc: "يقرأ السند جيداً ويفهم التاريخ.", x: '75%', y: '25%'})}
                                                onMouseLeave={() => setHoveredQuad(null)}
                                            ></div>
                                            {/* Bottom Left */}
                                            <div 
                                                className="absolute bottom-0 left-0 w-1/2 h-1/2 border-t border-r border-slate-600/30 cursor-help hover:bg-white/5 transition-colors"
                                                onMouseEnter={() => setHoveredQuad({title: "تعثر شامل (العائق اللغوي)", desc: "ضعف القراءة يعيق فهم التاريخ.", x: '25%', y: '75%'})}
                                                onMouseLeave={() => setHoveredQuad(null)}
                                            ></div>
                                            {/* Top Left */}
                                            <div 
                                                className="absolute top-0 left-0 w-1/2 h-1/2 cursor-help hover:bg-white/5 transition-colors"
                                                onMouseEnter={() => setHoveredQuad({title: "ثقافة شفهية", desc: "يفهم التاريخ سماعياً لكن قراءته ضعيفة.", x: '25%', y: '25%'})}
                                                onMouseLeave={() => setHoveredQuad(null)}
                                            ></div>
                                            {/* Bottom Right */}
                                            <div 
                                                className="absolute bottom-0 right-0 w-1/2 h-1/2 cursor-help hover:bg-white/5 transition-colors"
                                                onMouseEnter={() => setHoveredQuad({title: "قارئ غير فاهم", desc: "يقرأ النص بطلاقة لكن لا يستوعب المفهوم التاريخي.", x: '75%', y: '75%'})}
                                                onMouseLeave={() => setHoveredQuad(null)}
                                            ></div>
                                        </div>

                                        {/* GRID (z-20) */}
                                        <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10%_10%]"></div>
                                        
                                        {/* CENTER LINES & DIAGONAL (z-20) */}
                                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-500/50 border-r border-dashed border-slate-500/50 pointer-events-none z-20"></div>
                                        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-500/50 border-b border-dashed border-slate-500/50 pointer-events-none z-20"></div>
                                        <div className="absolute bottom-0 left-0 w-[141%] h-0 border-t-2 border-dashed border-white/20 transform -rotate-45 origin-bottom-left pointer-events-none z-20"></div>

                                        {/* QUADRANT TOOLTIP (z-20) */}
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

                                        {/* POINTS (z-50 - MUST BE HIGHEST FOR HOVER) */}
                                        <div className="absolute inset-6 z-50 pointer-events-none">
                                            {crossAnalysis.points.map((p, i) => {
                                                const gap = Math.abs(p.x - p.y);
                                                const isCorrelated = gap < 15;
                                                const colorClass = isCorrelated ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-red-400 ring-4 ring-red-500/20';
                                                
                                                return (
                                                    <div 
                                                        key={i}
                                                        className="absolute w-8 h-8 -ml-4 -mb-4 flex items-center justify-center cursor-pointer group hover:z-[60] pointer-events-auto"
                                                        style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
                                                        onMouseEnter={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setHoveredPoint({ x: rect.left + rect.width/2, y: rect.top, name: p.name, gap, arabic: p.x, history: p.y });
                                                        }}
                                                        onMouseLeave={() => setHoveredPoint(null)}
                                                    >
                                                        <div className={`w-3 h-3 rounded-full shadow-md border border-white/50 transition-transform duration-200 group-hover:scale-150 ${colorClass}`}></div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Labels */}
                                        <div className="absolute bottom-1 right-2 text-[10px] text-blue-300 font-bold bg-slate-900/80 px-2 py-1 rounded z-30 pointer-events-none">
                                            القراءة (لغة عربية) →
                                        </div>
                                        <div className="absolute top-2 left-1 text-[10px] text-amber-300 font-bold bg-slate-900/80 px-2 py-1 rounded writing-vertical z-30 pointer-events-none">
                                            ↑ التاريخ
                                        </div>
                                    </div>

                                    {/* Legend - Simplified & Centered */}
                                    <div className="text-center w-full max-w-[500px] mt-4 bg-slate-800/80 p-3 rounded-2xl border border-slate-700 shadow-lg">
                                        <p className="text-xs font-bold text-slate-300 flex items-center justify-center gap-6">
                                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> توازن (تحكم لغوي وتاريخي)</span>
                                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span> تباين (مشكلة لغوية أو تاريخية)</span>
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-slate-500">لا توجد بيانات مشتركة للتحليل</div>}
                    </div>
                 );
                 break;
        }

        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col md:flex-row animate-in zoom-in-95 duration-300 overflow-hidden">
                <button onClick={() => setExpandedSection(null)} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full z-50 text-white transition-all">
                    <Minimize2 size={24} />
                </button>

                {/* Left Panel: Analysis Text (Scrollable) */}
                <div className="w-full md:w-[400px] lg:w-[35%] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl relative z-40 order-2 md:order-1 h-full">
                    {/* Fixed Header */}
                    <div className="p-8 pb-6 border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">{analysisIcon}</div>
                            <h2 className="text-2xl font-bold text-white font-serif">{def.title}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">تحليل استراتيجي للأداء التربوي</p>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                        <div className="space-y-8">
                            <div className="relative pl-4 border-r-2 border-slate-500/30 pr-4 bg-slate-800/30 p-4 rounded-l-xl">
                                    <h4 className="text-slate-300 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Info size={14}/> المفهوم التربوي</h4>
                                    <p className="text-slate-400 leading-relaxed text-xs text-justify font-light">{def.concept}</p>
                            </div>

                            {expandedSection === 'crossLang' && (
                                <div className="relative pl-4 border-r-2 border-blue-500/30 pr-4 bg-blue-900/10 p-4 rounded-l-xl">
                                    <h4 className="text-blue-300 font-bold uppercase text-xs mb-2 flex items-center gap-2"><HelpCircle size={14}/> دليل قراءة المربعات</h4>
                                    <ul className="text-slate-400 text-xs space-y-2 list-disc list-inside">
                                        <li><span className="text-emerald-400 font-bold">أعلى اليمين:</span> تحكم شامل (يقرأ ويفهم).</li>
                                        <li><span className="text-red-400 font-bold">أسفل اليسار:</span> تعثر شامل (العائق اللغوي).</li>
                                        <li><span className="text-yellow-400 font-bold">أعلى اليسار:</span> ثقافة شفهية (يفهم دون قراءة).</li>
                                        <li><span className="text-yellow-400 font-bold">أسفل اليمين:</span> قارئ غير فاهم.</li>
                                    </ul>
                                </div>
                            )}

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

                {/* Right Panel: Chart Area (Flex - SCROLLABLE FOR SMALL HEIGHTS) */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col relative order-1 md:order-2 h-full">
                     <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    
                     {/* Fixed Header in Chart Area */}
                    <div className="w-full z-20 p-4 shrink-0 flex justify-center pointer-events-none">
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

                    {/* Scrollable Container for Chart & Legend */}
                    <div className="relative z-10 w-full flex-1 overflow-y-auto p-4 custom-scrollbar">
                         <div className="min-h-full flex flex-col items-center justify-center">
                             {content}
                         </div>
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
            <div className="bg-gradient-to-r from-slate-900 to-amber-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><School size={300} /></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
                            <Target size={14}/>
                            تحليل الوعي التاريخي
                        </div>
                        <h2 className="text-3xl font-bold font-serif mb-2">التاريخ (نهاية الطور)</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2"><School size={16}/> {contextName}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. IDENTITY INDEX */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative"
                    onClick={() => setExpandedSection('identityIndex')}
                >
                    <ExpandBtn section="identityIndex" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><MapPin className="text-emerald-600" size={20}/> مؤشر الهوية والانتماء</h3>
                    </div>
                    <div className="flex items-center justify-center py-6">
                         <div className="relative w-48 h-24 bg-gray-100 rounded-t-full overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000" style={{ transform: `rotate(${(Math.min(identityStats, 100) / 100) * 180 - 90}deg)` }}>
                                <div className="w-2 h-full bg-emerald-600 mx-auto shadow-[0_0_15px_#059669]"></div>
                            </div>
                        </div>
                        <div className="absolute bottom-10 text-center">
                            <span className="text-4xl font-bold text-slate-800">{identityStats.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                {/* 2. CHRONO AWARENESS */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative"
                    onClick={() => setExpandedSection('chronoAwareness')}
                >
                    <ExpandBtn section="chronoAwareness" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Hourglass className="text-blue-600" size={20}/> الوعي الزمني (التحولات)</h3>
                    </div>
                    <div className="flex items-center justify-center py-6">
                         <div className="relative w-40 h-40">
                             <svg className="w-full h-full" viewBox="0 0 100 100">
                                 <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                 <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="10" 
                                    strokeDasharray={`${(chronoStats * 283) / 100} 283`} 
                                    transform="rotate(-90 50 50)" 
                                    strokeLinecap="round"
                                 />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-3xl font-bold text-blue-600">{chronoStats.toFixed(0)}%</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 3. CROSS-SUBJECT (LANGUAGE BARRIER) */}
                <div 
                    className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setExpandedSection('crossLang')}
                >
                    <ExpandBtn section="crossLang" />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Link2 className="text-indigo-600" size={20}/> مصفوفة العائق اللغوي</h3>
                            <p className="text-xs text-slate-400 mt-1">هل تعيق اللغة العربية فهم التاريخ؟</p>
                        </div>
                        {crossAnalysis ? (
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold">تم ربط: {crossAnalysis.count} تلميذ</span>
                        ) : (
                            <span className="bg-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-bold">بيانات العربية غير متوفرة</span>
                        )}
                    </div>

                    {crossAnalysis ? (
                        <div className="h-48 relative border-l border-b border-slate-300 mx-4 bg-white/50 rounded-tr-xl">
                            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500/5"></div>
                            <div className="absolute inset-0">
                                {crossAnalysis.points.map((p, i) => (
                                    <div 
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full"
                                        style={{ 
                                            left: `${p.x}%`, 
                                            bottom: `${p.y}%`,
                                            backgroundColor: Math.abs(p.x - p.y) < 15 ? '#10b981' : '#f43f5e',
                                            opacity: 0.6
                                        }}
                                    ></div>
                                ))}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-full border-t border-dashed border-slate-400/20 transform -rotate-45 origin-bottom-left pointer-events-none"></div>
                            <div className="absolute -bottom-6 w-full text-center text-[10px] text-slate-500 font-bold">القراءة (عربية)</div>
                            <div className="absolute -left-8 top-1/2 -rotate-90 text-[10px] text-slate-500 font-bold">التاريخ</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                            <Zap size={32} className="mb-2 opacity-20"/>
                            <p className="text-sm">يرجى استيراد ملف اللغة العربية لنفس القسم.</p>
                        </div>
                    )}
                </div>

                {/* 4. NATIONAL DEPTH */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative"
                    onClick={() => setExpandedSection('nationalDepth')}
                >
                    <ExpandBtn section="nationalDepth" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Microscope className="text-amber-600" size={20}/> عمق الفهم (أسباب الاحتلال)</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>فهم سطحي</span>
                            <span>فهم عميق (تعليل)</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                             <div className="h-full bg-amber-500" style={{ width: `${depthStats}%` }}></div>
                        </div>
                        <div className="text-center font-bold text-2xl text-amber-500">{depthStats.toFixed(0)}%</div>
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
                                <button onClick={() => setEditingSection('identityIndex')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مؤشر الهوية</span>
                                </button>
                                <button onClick={() => setEditingSection('chronoAwareness')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">الوعي الزمني</span>
                                </button>
                                <button onClick={() => setEditingSection('nationalDepth')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">عمق الفهم</span>
                                </button>
                                <button onClick={() => setEditingSection('crossLang')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">العائق اللغوي</span>
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

export default AcqYear5HistoryStats;