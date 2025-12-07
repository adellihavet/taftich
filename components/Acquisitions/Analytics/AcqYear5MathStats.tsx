

import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_MATH_DEF } from '../../../constants/acqYear5Math';
import { 
    BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, 
    School, Scale, Activity, X, Info, Calculator, BrainCircuit, Microscope, 
    Puzzle, Stethoscope, PenTool, BookOpen, Ruler, Zap, Maximize2, Minimize2, 
    Edit, Save, RotateCcw, ChevronRight, Sigma, Filter
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

type AnalysisSection = 'gap' | 'matrix' | 'radar' | 'illiteracy' | 'funnel' | 'abstraction';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions for Focus Mode (Specific to Year 5 Math)
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string }> = {
    gap: {
        title: "الفجوة الديداكتيكية",
        concept: "مؤشر يقيس الفارق بين 'امتلاك الأدوات' (الحساب، الهندسة، القياس) والقدرة على 'توظيفها' (حل المشكلات، التناسبية).",
        method: "حساب معدل التحكم في الموارد (كفاءات 1, 2, 3) ومقارنته بمعدل التحكم في الكفاءة المنهجية (كفاءة 4)."
    },
    abstraction: {
        title: "التجريد الرياضي (تطور الفكر)",
        concept: "مدى انتقال التلميذ من التفكير المحسوس (الهندسة والقياس) إلى التفكير المجرد (التناسبية وتنظيم المعطيات).",
        method: "مقارنة نسب النجاح في كفاءات الهندسة والقياس (محسوس) مقابل كفاءة تنظيم المعطيات (مجرد)."
    },
    matrix: {
        title: "مصفوفة التوازن (آلية / منطق)",
        concept: "أداة تشخيصية تصنف التلاميذ حسب نمط تفكيرهم الرياضي: هل هم 'حاسبون آليون' أم 'مفكرون منطقيون'؟",
        method: "تقاطع معدل التحكم في 'الحساب والقياس' (محور ص) مع معدل 'تنظيم المعطيات والتناسبية' (محور س)."
    },
    radar: {
        title: "توازن الميادين",
        concept: "نظرة شمولية لمدى نمو الكفاءات الأربع بشكل متوازٍ، وكشف الميادين المهملة (غالباً الهندسة أو التناسبية).",
        method: "حساب معدل التحكم في كل ميدان (أعداد، هندسة، قياس، تنظيم معطيات) بشكل مستقل."
    },
    illiteracy: {
        title: "مؤشر الهشاشة القاعدية",
        concept: "تحديد نسبة التلاميذ الذين يفتقدون للحد الأدنى من الأدوات الرياضية اللازمة للمتوسط.",
        method: "حساب نسبة التلاميذ الذين حصلوا على تقدير (د) في 'الحساب' وفي 'تنظيم المعطيات' معاً."
    },
    funnel: {
        title: "قمع التفكير الرياضي",
        concept: "تتبع مسار التلميذ عبر مستويات التعقيد: من الحساب البسيط -> الهندسة -> القياس -> حل المشكلات المعقدة (التناسبية).",
        method: "تتبع عدد المتحكمين في كل مرحلة وتحديد نقطة الانكسار الكبرى."
    }
};

const AcqYear5MathStats: React.FC<Props> = ({ records, scope, contextName }) => {
    
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, text: string, title?: string } | null>(null);
    const [hoveredMatrixZone, setHoveredMatrixZone] = useState<string | null>(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
    const [customAnalysis, setCustomAnalysis] = useState<Record<string, AnalysisContent>>({});

    // Load custom analysis
    useEffect(() => {
        const key = `mufattish_analysis_y5_math_${contextName}_${scope}`;
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
        localStorage.setItem(`mufattish_analysis_y5_math_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null);
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_y5_math_${contextName}_${scope}`, JSON.stringify(newAnalysis));
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

    // A. Didactic Gap
    const didacticGap = useMemo(() => {
        let resourceScore = 0, resourceMax = 0; // Calc + Geom + Measure
        let methodScore = 0, methodMax = 0; // Data Org

        allStudents.forEach(s => {
            // Resources: Comp 1, 2, 3
            ['control_numbers', 'geometry_space', 'measurements'].forEach(compId => {
                const comp = YEAR5_MATH_DEF.competencies.find(c => c.id === compId);
                comp?.criteria.forEach(crit => {
                    const g = getGrade(s, compId, crit.id);
                    if (g) {
                        resourceMax += 3;
                        if(g === 'A') resourceScore += 3;
                        else if(g === 'B') resourceScore += 2;
                        else if(g === 'C') resourceScore += 1;
                    }
                });
            });

            // Methodology: Comp 4 (Data Org)
            const compDef = YEAR5_MATH_DEF.competencies.find(c => c.id === 'data_org');
            compDef?.criteria.forEach(crit => {
                const g = getGrade(s, 'data_org', crit.id);
                if (g) {
                    methodMax += 3;
                    if(g === 'A') methodScore += 3;
                    else if(g === 'B') methodScore += 2;
                    else if(g === 'C') methodScore += 1;
                }
            });
        });

        const rPct = resourceMax > 0 ? (resourceScore / resourceMax) * 100 : 0;
        const mPct = methodMax > 0 ? (methodScore / methodMax) * 100 : 0;
        
        return { rPct, mPct, gap: rPct - mPct };
    }, [allStudents]);

    // B. Critical Failure (Math Illiteracy)
    const criticalFailureRate = useMemo(() => {
        const failedStudents = allStudents.filter(s => {
            // Fails basic calc (Comp 1 Crit 2) AND fails problem solving (Comp 4 Crit 4)
            const g_calc = getGrade(s, 'control_numbers', 2);
            const g_prob = getGrade(s, 'data_org', 4);
            return g_calc === 'D' && g_prob === 'D';
        }).length;
        
        return totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0;
    }, [allStudents, totalStudents]);

    // C. Radar Data
    const radarData = useMemo(() => {
        const domains = [
            { key: 'numbers', label: 'أعداد وحساب', compId: 'control_numbers' },
            { key: 'geom', label: 'هندسة وفضاء', compId: 'geometry_space' },
            { key: 'measure', label: 'مقادير وقياس', compId: 'measurements' },
            { key: 'data', label: 'تنظيم معطيات', compId: 'data_org' },
        ];
        
        return domains.map(d => {
            let score = 0, max = 0;
            allStudents.forEach(s => {
                const compDef = YEAR5_MATH_DEF.competencies.find(c => c.id === d.compId);
                compDef?.criteria.forEach(crit => {
                    const g = getGrade(s, d.compId, crit.id);
                    if(g) {
                        max += 3;
                        if(g === 'A') score += 3;
                        else if(g === 'B') score += 2;
                        else if(g === 'C') score += 1;
                    }
                });
            });
            return { subject: d.label, A: max > 0 ? (score / max) * 100 : 0, fullMark: 100 };
        });
    }, [allStudents]);

    // D. Math Funnel (Hierarchy of Skills)
    const funnelData = useMemo(() => {
        const total = totalStudents;
        
        // Level 1: Basic Calc
        const calcPass = allStudents.filter(s => {
            const g = getGrade(s, 'control_numbers', 2);
            return g === 'A' || g === 'B';
        }).length;
        
        // Level 2: Geometry/Measure
        const geomPass = allStudents.filter(s => {
             const g1 = getGrade(s, 'geometry_space', 2); 
             const g2 = getGrade(s, 'measurements', 1); 
             return g1 === 'A' || g1 === 'B' || g2 === 'A' || g2 === 'B';
        }).length;

        // Level 3: Proportionality
        const propPass = allStudents.filter(s => {
            const g = getGrade(s, 'data_org', 2); 
            return g === 'A' || g === 'B';
        }).length;

        // Level 4: Complex Problem Solving
        const solvPass = allStudents.filter(s => {
            const g = getGrade(s, 'data_org', 4); 
            return g === 'A' || g === 'B';
        }).length;

        return [
            { label: 'المسجلون', count: total, color: 'bg-slate-300', text: 'text-slate-700', desc: "العدد الإجمالي" },
            { label: 'يحسبون (آلية)', count: calcPass, color: 'bg-blue-300', text: 'text-blue-900', desc: "تحكم في العمليات الأربع" },
            { label: 'أدوات (هندسة)', count: geomPass, color: 'bg-indigo-400', text: 'text-white', desc: "تحكم في الخواص والمقادير" },
            { label: 'تناسبية', count: propPass, color: 'bg-purple-500', text: 'text-white', desc: "إدراك العلاقات الخطية" },
            { label: 'حل مشكلات', count: solvPass, color: 'bg-pink-600', text: 'text-white', desc: "تجنيد الموارد في وضعية مركبة" },
        ];
    }, [allStudents, totalStudents]);

    // E. Abstraction Analysis (Concrete vs Abstract)
    const abstractionAnalysis = useMemo(() => {
        let concreteScore = 0, concreteMax = 0;
        let abstractScore = 0, abstractMax = 0;

        allStudents.forEach(s => {
            // Concrete: Geom + Measure
            ['geometry_space', 'measurements'].forEach(compId => {
                const comp = YEAR5_MATH_DEF.competencies.find(c => c.id === compId);
                comp?.criteria.forEach(crit => {
                    const g = getGrade(s, compId, crit.id);
                    if(g) {
                        concreteMax += 3;
                        if(g === 'A') concreteScore += 3;
                        else if(g === 'B') concreteScore += 2;
                        else if(g === 'C') concreteScore += 1;
                    }
                });
            });

            // Abstract: Data Org (Proportionality)
            const comp = YEAR5_MATH_DEF.competencies.find(c => c.id === 'data_org');
            comp?.criteria.forEach(crit => {
                const g = getGrade(s, 'data_org', crit.id);
                if(g) {
                    abstractMax += 3;
                    if(g === 'A') abstractScore += 3;
                    else if(g === 'B') abstractScore += 2;
                    else if(g === 'C') abstractScore += 1;
                }
            });
        });

        const cPct = concreteMax > 0 ? (concreteScore / concreteMax) * 100 : 0;
        const aPct = abstractMax > 0 ? (abstractScore / abstractMax) * 100 : 0;

        return { concretePct: cPct, abstractPct: aPct };
    }, [allStudents]);


    // F. Student Analysis for Matrix (Individual Scores)
    const studentScores = useMemo(() => {
        return allStudents.map(s => {
            let resScore = 0, resMax = 0;
            let methScore = 0, methMax = 0;

            YEAR5_MATH_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) {
                        const pts = g === 'A' ? 3 : g === 'B' ? 2 : g === 'C' ? 1 : 0;
                        if (comp.id === 'data_org') {
                            methScore += pts; methMax += 3;
                        } else {
                            resScore += pts; resMax += 3;
                        }
                    }
                });
            });

            return { 
                ...s, 
                resPct: resMax > 0 ? (resScore / resMax) * 100 : 0, 
                methPct: methMax > 0 ? (methScore / methMax) * 100 : 0 
            };
        });
    }, [allStudents]);

    const performanceMatrix = useMemo(() => {
        const counts = { balanced: 0, rote: 0, logic_error: 0, struggling: 0, total: 0 };
        studentScores.forEach(s => {
            const highRes = s.resPct >= 50;
            const highMeth = s.methPct >= 50;
            
            if (highRes && highMeth) counts.balanced++;
            else if (highRes && !highMeth) counts.rote++; // High Res, Low Meth
            else if (!highRes && highMeth) counts.logic_error++; // Low Res, High Meth
            else counts.struggling++;
            
            counts.total++;
        });
        return counts;
    }, [studentScores]);

    // --- 3. ANALYSIS GENERATION ---

    const getDefaultAnalysis = (section: string): AnalysisContent => {
        if (section === 'gap') {
            const gapSize = didacticGap.gap;
            return {
                reading: `الفجوة الديداكتيكية تبلغ ${gapSize.toFixed(1)}% لصالح الموارد. التلاميذ يتقنون الحساب والهندسة (موارد) أفضل من حل المشكلات (كفاءة).`,
                diagnosis: gapSize > 15 
                    ? "طغيان المقاربة بالمحتوى (تلقين القواعد). الأستاذ يركز على 'كيف نحسب' ويهمل 'متى ولماذا نحسب'." 
                    : "توازن جيد. الأستاذ ينجح في توظيف الموارد لبناء الكفاءة.",
                recommendation: "التركيز على 'ترييض المشكلات' (Mathématisation) كنشاط محوري، وتقليص التمارين الآلية المعزولة."
            };
        }
        
        if (section === 'funnel') {
            const start = funnelData[0].count;
            const end = funnelData[4].count;
            const dropRate = start > 0 ? ((start - end) / start * 100).toFixed(0) : 0;
            return {
                reading: `نسبة التسرب المعرفي هي ${dropRate}%. الانكسار الأكبر يقع عند الانتقال إلى 'التناسبية'.`,
                diagnosis: "التلاميذ يواجهون صعوبة في الانتقال من التفكير الجمعي (Additif) إلى التفكير الضربي (Multiplicatif) الذي تتطلبه التناسبية.",
                recommendation: "إعادة بناء مفهوم 'الخطية' (Linearity) باستخدام جداول من الواقع المعيش، والابتعاد عن تطبيق القاعدة الثلاثية بشكل آلي."
            };
        }

        if (section === 'abstraction') {
            const gap = abstractionAnalysis.concretePct - abstractionAnalysis.abstractPct;
            return {
                reading: `مؤشر التجريد: تحكم في المحسوس ${abstractionAnalysis.concretePct.toFixed(1)}% مقابل ${abstractionAnalysis.abstractPct.toFixed(1)}% في المجرد.`,
                diagnosis: gap > 15 
                    ? "التلاميذ مازالوا مرتبطين بالأشياء الملموسة (رسم، قياس) ويجدون صعوبة في التعامل مع العلاقات المجردة (النسب، السرعة)."
                    : "انتقال سلس وناجح نحو التفكير الرياضي المجرد.",
                recommendation: "تكثيف الوضعيات التي تتطلب 'نمذجة' رياضية دون استخدام أدوات هندسية، للتدريب على التجريد."
            };
        }

        if (section === 'matrix') {
            const total = performanceMatrix.total || 1;
            const q_rote = Math.round((performanceMatrix.rote / total) * 100);
            return {
                reading: `نسبة 'الحفظ الآلي' هي ${q_rote}%. هؤلاء تلاميذ يحسبون جيداً لكن يفشلون في الوضعيات.`,
                diagnosis: q_rote > 20 
                    ? "الرياضيات تُدرّس كمجموعة خوارزميات للحفظ. هذا يهدد بفشل ذريع في المتوسط حيث يتطلب الأمر تجريداً أعلى." 
                    : "توازن مطمئن بين التحكم الإجرائي والفهم المنطقي.",
                recommendation: "الاهتمام بـ 'وضعية الانطلاق' (Problem Solving) لبناء المعنى قبل تقديم القاعدة."
            };
        }

        if (section === 'radar') {
            const weakDomain = radarData.reduce((prev, curr) => prev.A < curr.A ? prev : curr);
            return {
                reading: `الميدان الأضعف هو "${weakDomain.subject}" بنسبة ${weakDomain.A.toFixed(1)}%.`,
                diagnosis: `اختلال في بناء الكفاءة الرياضية الشاملة. ضعف ${weakDomain.subject} قد يعيق التقدم في الفيزياء والتكنولوجيا لاحقاً.`,
                recommendation: `تخصيص أنشطة علاجية مكثفة في ${weakDomain.subject} خلال الفترة المتبقية.`
            };
        }

        if (section === 'illiteracy') {
            const isCritical = criticalFailureRate > 15;
            const isZero = criticalFailureRate === 0;

            if (isZero) {
                 return {
                    reading: `نسبة 0% من التلاميذ يعانون من تعثر مزدوج.`,
                    diagnosis: "نتائج ممتازة. القسم يمتلك الحد الأدنى من الأدوات الرياضية الأساسية.",
                    recommendation: "الانتقال لمستوى الإبداع وحل المشكلات المعقدة (أولمبياد الرياضيات)."
                };
            }

            return {
                reading: `نسبة ${criticalFailureRate.toFixed(1)}% من التلاميذ يعانون من تعثر مزدوج (حساب + حل مشكلات).`,
                diagnosis: isCritical
                    ? "مؤشر خطر. هؤلاء التلاميذ يفتقدون للحد الأدنى من المنطق الرياضي، مما يجعل انتقالهم للمتوسط مجازفة."
                    : "النسبة مقبولة وتعكس حالات فردية خاصة تحتاج لمرافقة.",
                recommendation: isCritical 
                    ? "العودة للمحسوس (Manipulatives) لهذه الفئة، والتركيز على العمليات الأساسية في الأعداد الطبيعية."
                    : "المعالجة الفردية داخل القسم."
            };
        }
        return { reading: '', diagnosis: '', recommendation: '' };
    };

    const getAnalysis = (section: string) => {
        return customAnalysis[section] || getDefaultAnalysis(section);
    };

    // --- RENDER HELPERS ---
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
        setHoveredData({
            x: rect.left + rect.width / 2,
            y: rect.top - 15,
            text,
            title
        });
    };

    const handleMouseLeave = () => setHoveredData(null);
    
    const generateRadarPath = (data: any[]) => {
        if (data.length === 0) return '';
        const center = 100; 
        const radius = 80;
        return data.map((point, i) => {
            const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
            const val = isNaN(point.A) ? 0 : point.A / 100;
            const x = center + radius * val * Math.cos(angle);
            const y = center + radius * val * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    // --- EXPANDED VIEW RENDER ---
    const renderExpandedView = () => {
        if (!expandedSection) return null;
        const def = METRIC_DEFINITIONS[expandedSection];
        const activeAnalysis = getAnalysis(expandedSection);
        let content = null;
        let analysisIcon = null;

        switch (expandedSection) {
            case 'gap':
                analysisIcon = <Scale size={24} className="text-indigo-400" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="w-full max-w-lg space-y-8">
                            <div className="relative group">
                                <div className="flex justify-between text-lg font-bold mb-2 text-slate-300">
                                    <span className="flex items-center gap-2"><BookOpen size={24}/> امتلاك الموارد</span>
                                    <span className="text-indigo-400 text-2xl">{didacticGap.rPct.toFixed(1)}%</span>
                                </div>
                                <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" style={{ width: `${didacticGap.rPct}%` }}></div>
                                </div>
                                <p className="text-slate-400 mt-1 text-xs">القدرة على الحساب، معرفة القوانين، حفظ الجداول.</p>
                            </div>
                            <div className="relative group">
                                <div className="flex justify-between text-lg font-bold mb-2 text-slate-300">
                                    <span className="flex items-center gap-2"><BrainCircuit size={24}/> الكفاءة المنهجية</span>
                                    <span className="text-amber-400 text-2xl">{didacticGap.mPct.toFixed(1)}%</span>
                                </div>
                                <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(245,158,11,0.5)]" style={{ width: `${didacticGap.mPct}%` }}></div>
                                </div>
                                <p className="text-slate-400 mt-1 text-xs">القدرة على توظيف الموارد لحل مشكلات معقدة.</p>
                            </div>
                        </div>
                     </div>
                );
                break;
            case 'abstraction':
                 analysisIcon = <BrainCircuit size={24} className="text-blue-400" />;
                 content = (
                    <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="flex items-end gap-16 h-80 w-full max-w-2xl justify-center">
                            <div className="flex flex-col items-center gap-3 group w-1/3">
                                <span className="text-3xl font-bold text-blue-400">{abstractionAnalysis.abstractPct.toFixed(0)}%</span>
                                <div className="w-full bg-slate-700 rounded-t-2xl relative overflow-hidden border-x border-t border-slate-600 shadow-2xl h-56">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-1000" style={{ height: `${abstractionAnalysis.abstractPct}%` }}></div>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-blue-300 block mb-0.5">التفكير المجرد</span>
                                    <span className="text-xs text-slate-400">التناسبية / التنظيم</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3 group w-1/3">
                                <span className="text-3xl font-bold text-slate-300">{abstractionAnalysis.concretePct.toFixed(0)}%</span>
                                <div className="w-full bg-slate-700 rounded-t-2xl relative overflow-hidden border-x border-t border-slate-600 shadow-2xl h-56">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-500 to-slate-400 transition-all duration-1000" style={{ height: `${abstractionAnalysis.concretePct}%` }}></div>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-slate-300 block mb-0.5">التفكير المحسوس</span>
                                    <span className="text-xs text-slate-500">الهندسة / القياس</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 );
                 break;
            case 'matrix':
                analysisIcon = <Puzzle size={24} className="text-teal-400" />;
                content = (
                    <div className="h-full flex items-center justify-center w-full">
                        <div className="aspect-square w-[400px] relative bg-slate-700/30 rounded-2xl border border-slate-600 p-4 grid grid-cols-2 grid-rows-2 gap-2">
                             {/* Q1: Low Res / High Meth */}
                            <div className="bg-blue-500/20 rounded flex flex-col items-center justify-center border border-blue-500/30">
                                <span className="text-2xl font-bold text-blue-400">{Math.round((performanceMatrix.logic_error / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-blue-300">تعثر إجرائي</span>
                            </div>
                            {/* Q2: High Res / High Meth */}
                            <div className="bg-emerald-500/20 rounded flex flex-col items-center justify-center border border-emerald-500/30">
                                <span className="text-2xl font-bold text-emerald-400">{Math.round((performanceMatrix.balanced / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-emerald-300">تحكم شامل</span>
                            </div>
                            {/* Q3: Low Res / Low Meth */}
                            <div className="bg-red-500/20 rounded flex flex-col items-center justify-center border border-red-500/30">
                                <span className="text-2xl font-bold text-red-400">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-red-300">تعثر شامل</span>
                            </div>
                            {/* Q4: High Res / Low Meth */}
                            <div className="bg-yellow-500/20 rounded flex flex-col items-center justify-center border border-yellow-500/30">
                                <span className="text-2xl font-bold text-yellow-400">{Math.round((performanceMatrix.rote / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-yellow-300">حفظ آلي</span>
                            </div>
                        </div>
                    </div>
                );
                break;
            case 'radar':
                analysisIcon = <Activity size={24} className="text-purple-400" />;
                content = (
                    <div className="h-full flex items-center justify-center w-full">
                         <div className="relative w-[380px] h-[380px]">
                            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                                {[20, 40, 60, 80, 100].map(r => (
                                    <circle key={r} cx="100" cy="100" r={r * 0.8} fill="none" stroke="#334155" strokeDasharray="4 4" />
                                ))}
                                {radarData.map((_, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const x = 100 + 80 * Math.cos(angle);
                                    const y = 100 + 80 * Math.sin(angle);
                                    return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#475569" />;
                                })}
                                <polygon 
                                    points={generateRadarPath(radarData)} 
                                    fill="rgba(139, 92, 246, 0.4)" 
                                    stroke="#a78bfa" 
                                    strokeWidth="3"
                                    className="drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                                />
                                {radarData.map((d, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const x = 100 + 95 * Math.cos(angle);
                                    const y = 100 + 95 * Math.sin(angle);
                                    return (
                                        <g key={i} className="group">
                                            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[8px] font-bold fill-slate-300 uppercase tracking-widest">
                                                {d.subject}
                                            </text>
                                            <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-purple-400">
                                                {d.A.toFixed(0)}%
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                );
                break;
             case 'funnel':
                analysisIcon = <Filter size={24} className="text-pink-500" />;
                content = (
                    <div className="h-full flex items-center justify-center p-4 w-full flex-col">
                        <div className="w-full max-w-2xl space-y-3">
                            {funnelData.map((stage, i) => {
                                const width = totalStudents > 0 ? (stage.count / totalStudents) * 100 : 0;
                                return (
                                    <div key={i} className="flex items-center gap-4 animate-in slide-in-from-left-4" style={{ animationDelay: `${i*100}ms` }}>
                                        <div className="w-32 text-right font-bold text-slate-400 text-xs">{stage.label}</div>
                                        <div className="flex-1 bg-slate-800/50 rounded-r-lg h-12 relative overflow-hidden flex items-center shadow-lg border border-slate-700">
                                            <div 
                                                className={`h-full ${stage.color.replace('bg-', 'bg-gradient-to-r from-').replace('300', '500').replace('400', '600')} flex items-center justify-end px-4 transition-all duration-1000 absolute left-0 top-0 opacity-80`} 
                                                style={{ width: `${width}%` }}
                                            ></div>
                                            <span className="relative z-10 text-white font-bold text-xl px-4">{stage.count}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                );
                break;
            case 'illiteracy':
                 analysisIcon = <AlertTriangle size={24} className="text-red-400" />;
                 const isCritical = criticalFailureRate > 15;
                 content = (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center w-full">
                        <div className={`relative w-64 h-64 flex items-center justify-center rounded-full border-[10px] ${isCritical ? 'border-red-500/30' : 'border-emerald-500/30'} bg-slate-800`}>
                            <div className={`absolute inset-0 rounded-full animate-pulse opacity-10 ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                            <div>
                                <span className={`text-7xl font-bold block ${isCritical ? 'text-red-500' : 'text-emerald-500'}`}>{criticalFailureRate.toFixed(1)}%</span>
                                <span className="text-slate-400 text-lg uppercase tracking-widest mt-2 block">نسبة الخطر</span>
                            </div>
                        </div>
                        <p className="mt-8 text-lg text-slate-300 max-w-xl leading-relaxed font-light">
                             {isCritical ? "فشل مزدوج (حساب + حل مشكلات). هؤلاء التلاميذ يحتاجون تدخل عاجل." : "النسبة ضمن الحدود المقبولة."}
                        </p>
                    </div>
                 );
                 break;
        }

        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex animate-in zoom-in-95 duration-300 overflow-hidden">
                <button onClick={() => setExpandedSection(null)} className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full z-50 text-white transition-all">
                    <Minimize2 size={24} />
                </button>

                <div className="w-[400px] lg:w-[35%] bg-slate-900 border-l border-slate-800 p-8 flex flex-col shadow-2xl relative z-40 overflow-y-auto">
                    <div className="mb-8 pb-6 border-b border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                                {analysisIcon}
                            </div>
                            <h2 className="text-2xl font-bold text-white font-serif">{def.title}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">تحليل معمق للكفاءات الختامية (الرياضيات)</p>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div className="relative pl-4 border-r-2 border-indigo-500/50 pr-4">
                            <h4 className="text-indigo-400 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Activity size={14}/> قراءة في البيانات</h4>
                            <p className="text-slate-300 leading-relaxed text-sm text-justify">{activeAnalysis.reading}</p>
                        </div>
                        <div className="relative pl-4 border-r-2 border-amber-500/50 pr-4 bg-amber-500/5 p-4 rounded-l-xl">
                            <h4 className="text-amber-400 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Microscope size={14}/> التشخيص البيداغوجي</h4>
                            <p className="text-slate-200 leading-relaxed text-sm font-medium text-justify">{activeAnalysis.diagnosis}</p>
                        </div>
                        <div className="relative pl-4 border-r-2 border-emerald-500/50 pr-4">
                            <h4 className="text-emerald-400 font-bold uppercase text-xs mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> التوصية والقرار</h4>
                            <p className="text-slate-300 leading-relaxed text-sm text-justify">{activeAnalysis.recommendation}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    
                    <div className="w-full max-w-3xl z-20 mb-4 mt-2 animate-in slide-in-from-top-4 shrink-0">
                         <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1.5 bg-indigo-500/20 rounded-bl-lg border-b border-l border-white/10"><Info size={14} className="text-indigo-300"/></div>
                            <div className="space-y-2 pt-1">
                                 <div><h4 className="text-[11px] font-bold text-indigo-300 uppercase mb-0.5">المفهوم التربوي</h4><p className="text-xs text-white/90 leading-relaxed">{def.concept}</p></div>
                                 <div className="pt-2 border-t border-white/10"><h4 className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 flex items-center gap-1"><Ruler size={10}/> المرجعية الحسابية</h4><p className="text-[10px] text-slate-400 leading-relaxed font-mono opacity-80">{def.method}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-0">{content}</div>
                </div>
            </div>
        );
    };

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

            {/* HEADER - STRATEGIC VIEW */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Sigma size={300} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                            <Target size={14}/>
                            تحليل الرياضيات (نهاية الطور)
                        </div>
                        <h2 className="text-3xl font-bold font-serif mb-2">{YEAR5_MATH_DEF.label}</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                            <School size={16}/> {contextName} <span className="mx-2">|</span> 
                            <Zap size={16}/> تشخيص الأداء المنظومي
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. THE DIDACTIC GAP */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 relative group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setExpandedSection('gap')}
                >
                    <ExpandBtn section="gap" />
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Scale className="text-indigo-600" size={20}/>
                                الفجوة الديداكتيكية (موارد vs كفاءة)
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">هل ينجح التلميذ في توظيف الحساب لحل المشكلات؟</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${didacticGap.gap > 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            الفارق: {didacticGap.gap.toFixed(1)}%
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Resource Bar */}
                        <div 
                            className="relative pt-6"
                            onMouseEnter={(e) => handleMouseEnter(e, "امتلاك الموارد", `نسبة التحكم: ${didacticGap.rPct.toFixed(1)}%`)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-600 flex items-center gap-2"><Calculator size={16}/> امتلاك الموارد (حساب/هندسة)</span>
                                <span className="text-indigo-600">{didacticGap.rPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" style={{ width: `${didacticGap.rPct}%` }}></div>
                            </div>
                        </div>

                        {/* Competency Bar */}
                        <div 
                            className="relative"
                            onMouseEnter={(e) => handleMouseEnter(e, "الكفاءة المنهجية", `نسبة التحكم: ${didacticGap.mPct.toFixed(1)}%`)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-600 flex items-center gap-2"><BrainCircuit size={16}/> الكفاءة المنهجية (حل المشكلات)</span>
                                <span className="text-amber-500">{didacticGap.mPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${didacticGap.mPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. ILLITERACY ALERT */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setExpandedSection('illiteracy')}
                >
                    <ExpandBtn section="illiteracy" />
                    <div className={`absolute inset-0 opacity-5 ${criticalFailureRate > 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    
                    <div 
                        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${criticalFailureRate > 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                    >
                        <AlertTriangle size={40} />
                    </div>
                    
                    <h3 className="font-bold text-2xl text-slate-800 mb-1">{criticalFailureRate.toFixed(1)}%</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">مؤشر الهشاشة (تعثر مزدوج)</p>
                    
                    <p className="text-sm text-slate-600 leading-relaxed px-4">
                        {criticalFailureRate > 10 
                            ? "نسبة حرجة من التلاميذ تفتقد للحد الأدنى من المنطق الرياضي." 
                            : "المؤشر طبيعي. لا توجد حالة طوارئ."}
                    </p>
                </div>
            </div>

            {/* 3. LEARNING FUNNEL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative group cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => setExpandedSection('funnel')}
                >
                    <ExpandBtn section="funnel" />
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Filter size={20} className="text-pink-500"/>
                                قمع التفكير الرياضي (التسرب المعرفي)
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">تتبع المسار من الحساب البسيط إلى التناسبية</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {funnelData.map((stage, i) => {
                            const width = totalStudents > 0 ? (stage.count / totalStudents) * 100 : 0;
                            return (
                                <div 
                                    key={i} 
                                    className="flex items-center gap-3"
                                    onMouseEnter={(e) => handleMouseEnter(e, stage.label, stage.desc)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="w-24 text-left font-bold text-slate-500 text-xs">{stage.label}</div>
                                    <div className="flex-1 bg-slate-100 rounded-r-lg h-8 relative overflow-hidden flex items-center shadow-lg border border-slate-700">
                                        <div 
                                            className={`h-full ${stage.color.replace('bg-', 'bg-gradient-to-r from-').replace('300', '500').replace('400', '600')} flex items-center justify-end px-3 font-bold text-xs transition-all duration-1000 absolute left-0 top-0 opacity-80`} 
                                            style={{ width: `${width}%` }}
                                        ></div>
                                        <span className="relative z-10 text-white font-bold text-xl px-4">{stage.count}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 4. MATRIX CARD - ADDED AS REQUESTED */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-teal-300 transition-all group relative"
                    onClick={() => setExpandedSection('matrix')}
                >
                    <ExpandBtn section="matrix" />
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Puzzle size={20} className="text-teal-500"/> مصفوفة التوازن (آلية/منطق)</h3>
                        <Info size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors"/>
                    </div>
                    
                    <div className="flex gap-6 items-center justify-center relative">
                        {/* Tooltip for Matrix */}
                        {hoveredMatrixZone && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 text-white p-2 rounded-xl text-xs w-48 text-center animate-in zoom-in-95 duration-200 shadow-xl border border-slate-600">
                                <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-slate-200">
                                    {hoveredMatrixZone === 'q1' && "ذكاء منطقي / ضعف حسابي"}
                                    {hoveredMatrixZone === 'q2' && "تحكم شامل (متوازن)"}
                                    {hoveredMatrixZone === 'q3' && "تعثر في المكتسبات القبلية"}
                                    {hoveredMatrixZone === 'q4' && "حفظ آلي / غياب المعنى"}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    {hoveredMatrixZone === 'q1' && "يفهم المشكلة لكن يخطئ في التنفيذ"}
                                    {hoveredMatrixZone === 'q2' && "تحكم جيد في الأدوات واستعمالها"}
                                    {hoveredMatrixZone === 'q3' && "صعوبات جذرية في المفاهيم"}
                                    {hoveredMatrixZone === 'q4' && "يتقن الحساب لكن يعجز عن الحل"}
                                </div>
                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800/90 rotate-45 border-r border-b border-slate-600"></div>
                            </div>
                        )}

                        <div className="aspect-square w-52 relative bg-slate-50 rounded-xl border border-slate-200 p-2 grid grid-cols-2 grid-rows-2 gap-1 shrink-0">
                            {/* Q1 */}
                            <div className="bg-blue-100 rounded flex flex-col items-center justify-center hover:bg-blue-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q1')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-blue-800">{Math.round((performanceMatrix.knowledge_gap / performanceMatrix.total)*100)}%</span>
                            </div>
                            {/* Q2 */}
                            <div className="bg-emerald-100 rounded flex flex-col items-center justify-center hover:bg-emerald-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q2')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-emerald-800">{Math.round((performanceMatrix.balanced / performanceMatrix.total)*100)}%</span>
                            </div>
                            {/* Q3 */}
                            <div className="bg-red-100 rounded flex flex-col items-center justify-center hover:bg-red-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q3')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-red-800">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                            </div>
                            {/* Q4 */}
                            <div className="bg-yellow-100 rounded flex flex-col items-center justify-center hover:bg-yellow-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q4')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-yellow-800">{Math.round((performanceMatrix.rote / performanceMatrix.total)*100)}%</span>
                            </div>
                            
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 font-bold tracking-widest">منهجية الحل</div>
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest">المعارف</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RADAR & EDIT BUTTONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 5. ABSTRACTION */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 group hover:shadow-md transition-shadow relative cursor-pointer"
                    onClick={() => setExpandedSection('abstraction')}
                >
                    <ExpandBtn section="abstraction" />
                    <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                        <BrainCircuit size={20} className="text-blue-500"/>
                        التجريد الرياضي (تطور الفكر)
                    </h3>
                    <p className="text-xs text-slate-400 mb-8">هل انتقل القسم من التفكير المحسوس (هندسة) إلى المجرد (تناسبية)؟</p>

                    <div className="flex flex-col gap-6">
                        {/* Abstract */}
                        <div className="flex items-center gap-4 p-2 rounded hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0"><BrainCircuit size={24}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">التفكير المجرد (التناسبية/التنظيم)</span>
                                    <span className="font-bold text-blue-600">{abstractionAnalysis.abstractPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${abstractionAnalysis.abstractPct}%` }}></div></div>
                            </div>
                        </div>

                        {/* Concrete */}
                        <div className="flex items-center gap-4 p-2 rounded hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold shrink-0"><CheckCircle2 size={24}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">التفكير المحسوس (هندسة/قياس)</span>
                                    <span className="font-bold text-slate-600">{abstractionAnalysis.concretePct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400" style={{ width: `${abstractionAnalysis.concretePct}%` }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. RADAR */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-1 group hover:shadow-md transition-shadow relative cursor-pointer"
                    onClick={() => setExpandedSection('radar')}
                >
                    <ExpandBtn section="radar" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-purple-600"/>
                        خريطة الكفاءات الأربع
                    </h3>
                    
                    <div className="flex justify-center py-4">
                        <div className="relative w-64 h-64">
                            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                                {[20, 40, 60, 80, 100].map(r => (
                                    <circle key={r} cx="100" cy="100" r={r * 0.8} fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
                                ))}
                                {radarData.map((_, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const x = 100 + 80 * Math.cos(angle);
                                    const y = 100 + 80 * Math.sin(angle);
                                    return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#cbd5e1" />;
                                })}
                                <polygon 
                                    points={generateRadarPath(radarData)} 
                                    fill="rgba(124, 58, 237, 0.2)" 
                                    stroke="#7c3aed" 
                                    strokeWidth="2" 
                                />
                                {radarData.map((d, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const x = 100 + 105 * Math.cos(angle);
                                    const y = 100 + 105 * Math.sin(angle);
                                    return (
                                        <g key={i}>
                                            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-600">
                                                {d.subject}
                                            </text>
                                            <text x={x} y={y + 12} textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-bold fill-purple-600">
                                                {d.A.toFixed(0)}%
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
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
                                <p className="text-xs text-slate-500 mt-1">يمكن للسيد المفتش تغيير التحليل أو إثراؤه بما يراه مناسباً</p>
                            </div>
                            <button onClick={() => setIsEditMode(false)} className="text-slate-400 hover:text-red-500"><X/></button>
                        </div>
                        
                        {!editingSection ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setEditingSection('gap')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">الفجوة الديداكتيكية</span>
                                </button>
                                <button onClick={() => setEditingSection('matrix')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مصفوفة التوازن</span>
                                </button>
                                <button onClick={() => setEditingSection('radar')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">رادار الكفاءات</span>
                                </button>
                                <button onClick={() => setEditingSection('illiteracy')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مؤشر الهشاشة</span>
                                </button>
                                <button onClick={() => setEditingSection('funnel')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">قمع النجاح</span>
                                </button>
                                 <button onClick={() => setEditingSection('abstraction')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">التجريد الرياضي</span>
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

// Internal Component for Editing Analysis
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
                 <label className="block text-xs font-bold text-slate-700 mb-1">قراءة في الأرقام</label>
                 <VoiceTextarea 
                    value={formData.reading} 
                    onChange={(v) => setFormData({...formData, reading: v})} 
                    className="w-full border rounded-lg p-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 max-h-60 overflow-y-auto"
                    minHeight="min-h-[120px]"
                 />
             </div>

             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">الخلاصة والتشخيص</label>
                 <VoiceTextarea 
                    value={formData.diagnosis} 
                    onChange={(v) => setFormData({...formData, diagnosis: v})} 
                    className="w-full border rounded-lg p-3 text-sm bg-amber-50 focus:bg-white focus:ring-2 focus:ring-amber-500 max-h-60 overflow-y-auto"
                    minHeight="min-h-[120px]"
                 />
             </div>

             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">التوصيات والقرارات</label>
                 <VoiceTextarea 
                    value={formData.recommendation} 
                    onChange={(v) => setFormData({...formData, recommendation: v})} 
                    className="w-full border rounded-lg p-3 text-sm bg-emerald-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 max-h-60 overflow-y-auto"
                    minHeight="min-h-[120px]"
                 />
             </div>

             <div className="flex justify-between pt-4 border-t">
                 <button onClick={onReset} className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline">
                     <RotateCcw size={12}/> استرجاع النص الأصلي (الآلي)
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

export default AcqYear5MathStats;
