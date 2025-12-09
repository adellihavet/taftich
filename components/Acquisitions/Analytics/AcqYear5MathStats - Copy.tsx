
import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_MATH_DEF } from '../../../constants/acqYear5Math';
import { 
    BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, 
    School, Scale, Activity, X, Info, Calculator, BrainCircuit, Microscope, 
    Puzzle, Stethoscope, PenTool, BookOpen, Ruler, Zap, Maximize2, Minimize2, 
    Edit, Save, RotateCcw, ChevronRight, Sigma, Filter, MessageSquare, Shapes
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

type AnalysisSection = 'communication' | 'abstractTriangle' | 'matrix' | 'radar' | 'illiteracy' | 'funnel';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions for Focus Mode (Specific to Year 5 Math)
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string }> = {
    communication: {
        title: "مؤشر الفصاحة الرياضياتية (الأخرس الرياضياتي)",
        concept: "قياس قدرة التلميذ على التبرير، الشرح، واستخدام المصطلحات الدقيقة، وليس فقط الوصول للنتيجة الصامتة. هذا المعيار موجود الآن في نهاية كل كفاءة.",
        method: "تجميع معدلات النجاح في معايير 'التبليغ' الأربعة (معيار 4 في العد، معيار 3 في الهندسة، معيار 3 في القياس، معيار 4 في البيانات)."
    },
    abstractTriangle: {
        title: "مثلث المفاهيم المجردة",
        concept: "تحليل الترابط المفاهيمي بين (الكسور - الأعداد العشرية - النسبة المئوية). هذه المفاهيم مترابطة، وأي خلل في أحدها يؤدي لانهيار البقية.",
        method: "مقارنة نسب النجاح في: الكسور (ك1.م2)، الأعداد العشرية (ك1.م1)، والنسبة المئوية (ك4.م3)."
    },
    matrix: {
        title: "مصفوفة التوازن (آلية / منطق)",
        concept: "أداة تشخيصية تصنف التلاميذ حسب نمط تفكيرهم الرياضي: هل هم 'حاسبون آليون' أم 'مفكرون منطقيون'؟",
        method: "تقاطع معدل التحكم في 'العمليات الأربع' (ك1.م3) مع معدل 'التناسبية' (ك4.م2)."
    },
    radar: {
        title: "توازن الميادين",
        concept: "نظرة شمولية لمدى نمو الكفاءات الأربع بشكل متوازٍ، وكشف الميادين المهملة (غالباً الهندسة أو القياس).",
        method: "حساب معدل التحكم في كل ميدان (أعداد، هندسة، قياس، تنظيم معطيات) بشكل مستقل."
    },
    illiteracy: {
        title: "مؤشر الهشاشة القاعدية",
        concept: "تحديد نسبة التلاميذ الذين يفتقدون للحد الأدنى من الأدوات الرياضية اللازمة للمتوسط.",
        method: "حساب نسبة التلاميذ الذين حصلوا على تقدير (د) في 'العمليات الأربع' وفي 'المساحات والمحيطات' معاً."
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
        const key = `mufattish_analysis_y5_math_v2_${contextName}_${scope}`;
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
        localStorage.setItem(`mufattish_analysis_y5_math_v2_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null);
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_y5_math_v2_${contextName}_${scope}`, JSON.stringify(newAnalysis));
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

    // A. Communication Index (الفصاحة الرياضياتية)
    const commIndex = useMemo(() => {
        let score = 0, max = 0;
        allStudents.forEach(s => {
            // "التبليغ" exists in all 4 competencies
            // Comp 1 Crit 4
            const c1 = getGrade(s, 'control_numbers', 4);
            // Comp 2 Crit 3
            const c2 = getGrade(s, 'geometry_space', 3);
            // Comp 3 Crit 3
            const c3 = getGrade(s, 'measurements', 3);
            // Comp 4 Crit 4
            const c4 = getGrade(s, 'data_org', 4);

            [c1, c2, c3, c4].forEach(g => {
                if (g) {
                    max += 3;
                    if(g === 'A') score += 3;
                    else if(g === 'B') score += 2;
                    else if(g === 'C') score += 1;
                }
            });
        });
        return max > 0 ? (score / max) * 100 : 0;
    }, [allStudents]);

    // B. Abstract Triangle (Fractions, Decimals, Percentages)
    const abstractTriangle = useMemo(() => {
        let fracScore = 0, fracMax = 0;
        let decScore = 0, decMax = 0;
        let percScore = 0, percMax = 0;

        allStudents.forEach(s => {
            // Fractions: Comp 1 Crit 2
            const gFrac = getGrade(s, 'control_numbers', 2);
            if(gFrac) {
                fracMax += 3;
                if(gFrac === 'A') fracScore += 3; else if(gFrac === 'B') fracScore += 2; else if(gFrac === 'C') fracScore += 1;
            }

            // Decimals: Comp 1 Crit 1
            const gDec = getGrade(s, 'control_numbers', 1);
            if(gDec) {
                decMax += 3;
                if(gDec === 'A') decScore += 3; else if(gDec === 'B') decScore += 2; else if(gDec === 'C') decScore += 1;
            }

            // Percentages: Comp 4 Crit 3
            const gPerc = getGrade(s, 'data_org', 3);
            if(gPerc) {
                percMax += 3;
                if(gPerc === 'A') percScore += 3; else if(gPerc === 'B') percScore += 2; else if(gPerc === 'C') percScore += 1;
            }
        });

        return {
            fractions: fracMax > 0 ? (fracScore / fracMax) * 100 : 0,
            decimals: decMax > 0 ? (decScore / decMax) * 100 : 0,
            percentages: percMax > 0 ? (percScore / percMax) * 100 : 0
        };
    }, [allStudents]);

    // C. Critical Failure (Math Illiteracy)
    const criticalFailureRate = useMemo(() => {
        const failedStudents = allStudents.filter(s => {
            // Fails basic calc (Comp 1 Crit 3: العمليات الأربع) 
            // AND fails Geometry (Comp 3 Crit 1: المحيط والمساحة)
            const g_calc = getGrade(s, 'control_numbers', 3);
            const g_geom = getGrade(s, 'measurements', 1);
            return g_calc === 'D' && g_geom === 'D';
        }).length;
        
        return totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0;
    }, [allStudents, totalStudents]);

    // D. Radar Data (4 Domains)
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

    // E. Math Funnel (Hierarchy of Skills)
    const funnelData = useMemo(() => {
        const total = totalStudents;
        
        // Level 1: Basic Operations (Comp 1 Crit 3)
        const calcPass = allStudents.filter(s => {
            const g = getGrade(s, 'control_numbers', 3);
            return g === 'A' || g === 'B';
        }).length;
        
        // Level 2: Area/Perimeter (Comp 3 Crit 1) -- Note: Moved to Measurement based on new update
        const measurePass = allStudents.filter(s => {
             const g = getGrade(s, 'measurements', 1); 
             return g === 'A' || g === 'B';
        }).length;

        // Level 3: Fractions (Comp 1 Crit 2)
        const fractionPass = allStudents.filter(s => {
            const g = getGrade(s, 'control_numbers', 2); 
            return g === 'A' || g === 'B';
        }).length;

        // Level 4: Proportionality (Comp 4 Crit 2)
        const propPass = allStudents.filter(s => {
            const g = getGrade(s, 'data_org', 2); 
            return g === 'A' || g === 'B';
        }).length;

        return [
            { label: 'المسجلون', count: total, color: 'bg-slate-300', text: 'text-slate-700', desc: "العدد الإجمالي" },
            { label: 'العمليات الأربع', count: calcPass, color: 'bg-blue-300', text: 'text-blue-900', desc: "الجمع، الطرح، الضرب، القسمة" },
            { label: 'محيط ومساحة', count: measurePass, color: 'bg-indigo-400', text: 'text-white', desc: "تطبيق قوانين القياس" },
            { label: 'الكسور', count: fractionPass, color: 'bg-purple-500', text: 'text-white', desc: "مفهوم الكسر والعمليات عليه" },
            { label: 'التناسبية', count: propPass, color: 'bg-pink-600', text: 'text-white', desc: "خواص الخطية والمرور للوحدة" },
        ];
    }, [allStudents, totalStudents]);

    // F. Student Analysis for Matrix (Individual Scores)
    const studentScores = useMemo(() => {
        return allStudents.map(s => {
            let opsScore = 0, opsMax = 0; // Operations
            let propScore = 0, propMax = 0; // Proportionality

            // Operations: Comp 1 Crit 3
            const gOps = getGrade(s, 'control_numbers', 3);
            if (gOps) {
                opsMax += 3;
                if(gOps === 'A') opsScore += 3; else if(gOps === 'B') opsScore += 2; else if(gOps === 'C') opsScore += 1;
            }

            // Proportionality: Comp 4 Crit 2
            const gProp = getGrade(s, 'data_org', 2);
            if (gProp) {
                propMax += 3;
                if(gProp === 'A') propScore += 3; else if(gProp === 'B') propScore += 2; else if(gProp === 'C') propScore += 1;
            }

            return { 
                ...s, 
                opsPct: opsMax > 0 ? (opsScore / opsMax) * 100 : 0, 
                propPct: propMax > 0 ? (propScore / propMax) * 100 : 0 
            };
        });
    }, [allStudents]);

    const performanceMatrix = useMemo(() => {
        const counts = { balanced: 0, rote: 0, logic_error: 0, struggling: 0, total: 0 };
        studentScores.forEach(s => {
            const highOps = s.opsPct >= 50;
            const highProp = s.propPct >= 50;
            
            if (highOps && highProp) counts.balanced++;
            else if (highOps && !highProp) counts.rote++; // High Calc, Low Prop
            else if (!highOps && highProp) counts.logic_error++; // Low Calc, High Prop (Rare but possible)
            else counts.struggling++;
            
            counts.total++;
        });
        return counts;
    }, [studentScores]);

    // --- 3. ANALYSIS GENERATION ---

    const getDefaultAnalysis = (section: string): AnalysisContent => {
        if (section === 'communication') {
            return {
                reading: `معدل الفصاحة الرياضياتية هو ${commIndex.toFixed(1)}%. هذا المؤشر يقيس قدرة التلميذ على التبرير، الشرح، واستخدام لغة الرياضيات (وليس فقط الحساب الصامت).`,
                diagnosis: commIndex < 50 
                    ? "ظاهرة 'الأخرس الرياضياتي': التلميذ يحل العمليات ببراعة لكنه يعجز عن شرح 'كيف' و 'لماذا'. هذا يدل على تعليم يركز على الآلية ويهمل بناء المعنى." 
                    : "مستوى جيد من التواصل الرياضي. التلاميذ يمتلكون القدرة على البرهنة والتبليغ.",
                recommendation: "تفعيل الوضعيات التي تتطلب 'تبرير الإجابة' و 'صياغة الحل بجملة تامة' وليس مجرد كتابة النتيجة."
            };
        }
        
        if (section === 'abstractTriangle') {
            const { fractions, decimals, percentages } = abstractTriangle;
            return {
                reading: `مثلث المفاهيم المجردة: الكسور (${fractions.toFixed(0)}%) -> الأعداد العشرية (${decimals.toFixed(0)}%) -> النسبة المئوية (${percentages.toFixed(0)}%).`,
                diagnosis: Math.abs(fractions - percentages) > 20
                    ? "انكسار في سلسلة التجريد. التلميذ لم يربط بين الكسر (1/2) والعدد العشري (0.5) والنسبة (50%). هو يتعامل معها كدروس منفصلة."
                    : "ترابط مفاهيمي ممتاز. التلميذ يدرك أن هذه المفاهيم الثلاثة هي وجوه لعملة واحدة.",
                recommendation: "استخدام 'اللوحة المئوية' و 'الأشرطة' لربط هذه المفاهيم بصرياً وحسياً."
            };
        }

        if (section === 'funnel') {
            const start = funnelData[1].count; // Operations
            const end = funnelData[4].count;   // Proportionality
            const dropRate = start > 0 ? ((start - end) / start * 100).toFixed(0) : 0;
            return {
                reading: `نسبة التسرب المعرفي بين 'الحساب' و 'التناسبية' هي ${dropRate}%.`,
                diagnosis: "الانتقال من التفكير الجمعي (العمليات) إلى التفكير التناسبي (الضربي) يشكل العائق الأكبر.",
                recommendation: "التركيز على جداول التناسبية المستمدة من الواقع (المقادير والأسعار) لتنمية الحس التناسبي."
            };
        }

        if (section === 'matrix') {
            const total = performanceMatrix.total || 1;
            const q_rote = Math.round((performanceMatrix.rote / total) * 100);
            return {
                reading: `نسبة 'الحساب الآلي' هي ${q_rote}%. هؤلاء تلاميذ يتقنون الجمع والضرب لكن يفشلون في التناسبية.`,
                diagnosis: q_rote > 25 
                    ? "التعليم يركز على 'الإجراءات' (كيف أحسب) ويهمل 'المفاهيم' (متى أستعمل هذا الحساب). خطر حقيقي في المتوسط." 
                    : "توازن مطمئن بين التحكم في الآلية وفهم المعنى.",
                recommendation: "تقليص التمارين الروتينية وتكثيف الوضعيات التي تتطلب اختيار العملية المناسبة."
            };
        }

        if (section === 'radar') {
            const weakDomain = radarData.reduce((prev, curr) => prev.A < curr.A ? prev : curr);
            return {
                reading: `الميدان الأضعف هو "${weakDomain.subject}" بنسبة ${weakDomain.A.toFixed(1)}%.`,
                diagnosis: `اختلال في بناء الكفاءة الرياضية الشاملة. ضعف ${weakDomain.subject} قد يعيق التقدم لاحقاً.`,
                recommendation: `تخصيص أنشطة علاجية مكثفة في ${weakDomain.subject}.`
            };
        }

        if (section === 'illiteracy') {
            const isCritical = criticalFailureRate > 10;
            return {
                reading: `نسبة ${criticalFailureRate.toFixed(1)}% من التلاميذ يعانون من تعثر مزدوج (عمليات + مساحات).`,
                diagnosis: isCritical
                    ? "مؤشر خطر. هؤلاء التلاميذ يفتقدون للحد الأدنى من الأدوات، مما يجعل انتقالهم للمتوسط مجازفة."
                    : "النسبة مقبولة وتعكس حالات فردية.",
                recommendation: "المعالجة الفردية داخل القسم والتركيز على الأساسيات."
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
            case 'communication':
                analysisIcon = <MessageSquare size={24} className="text-blue-500" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="text-center space-y-6">
                            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="88" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                    <circle cx="96" cy="96" r="88" fill="none" stroke="#3b82f6" strokeWidth="12" 
                                        strokeDasharray={`${(commIndex * 553) / 100} 553`} 
                                        strokeLinecap="round" 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-bold text-blue-600">{commIndex.toFixed(0)}%</span>
                                    <span className="text-sm text-slate-400 font-bold uppercase mt-1">مؤشر الفصاحة</span>
                                </div>
                            </div>
                            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                                يعكس هذا الرقم قدرة التلاميذ على "التعبير الرياضي" (Communication Mathématique) في كافة الميادين.
                            </p>
                        </div>
                     </div>
                );
                break;
            case 'abstractTriangle':
                 analysisIcon = <Shapes size={24} className="text-purple-500" />;
                 const { fractions, decimals, percentages } = abstractTriangle;
                 content = (
                    <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="relative w-[400px] h-[350px]">
                            {/* Triangle Shape */}
                            <svg viewBox="0 0 400 350" className="w-full h-full overflow-visible">
                                <path d="M200 50 L350 300 L50 300 Z" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5 5"/>
                                <path d="M200 50 L350 300 L50 300 Z" fill="rgba(168, 85, 247, 0.1)" stroke="none"/>
                                
                                {/* Vertices Circles */}
                                <g className="group">
                                    <circle cx="200" cy="50" r={fractions/2.5} fill="#a855f7" opacity="0.8" className="transition-all duration-1000"/>
                                    <text x="200" y="30" textAnchor="middle" className="text-xs font-bold fill-slate-600">الكسور ({fractions.toFixed(0)}%)</text>
                                </g>
                                <g className="group">
                                    <circle cx="350" cy="300" r={percentages/2.5} fill="#ec4899" opacity="0.8" className="transition-all duration-1000"/>
                                    <text x="350" y="330" textAnchor="middle" className="text-xs font-bold fill-slate-600">النسبة المئوية ({percentages.toFixed(0)}%)</text>
                                </g>
                                <g className="group">
                                    <circle cx="50" cy="300" r={decimals/2.5} fill="#3b82f6" opacity="0.8" className="transition-all duration-1000"/>
                                    <text x="50" y="330" textAnchor="middle" className="text-xs font-bold fill-slate-600">الأعداد العشرية ({decimals.toFixed(0)}%)</text>
                                </g>

                                {/* Connections - Strength indicated by opacity/width */}
                                <line x1="200" y1="50" x2="350" y2="300" stroke="#a855f7" strokeWidth={Math.min(fractions, percentages)/20} opacity="0.5"/>
                                <line x1="350" y1="300" x2="50" y2="300" stroke="#a855f7" strokeWidth={Math.min(percentages, decimals)/20} opacity="0.5"/>
                                <line x1="50" y1="300" x2="200" y2="50" stroke="#a855f7" strokeWidth={Math.min(decimals, fractions)/20} opacity="0.5"/>
                            </svg>
                        </div>
                    </div>
                 );
                 break;
            case 'matrix':
                analysisIcon = <Puzzle size={24} className="text-teal-400" />;
                content = (
                    <div className="h-full flex items-center justify-center w-full">
                        <div className="aspect-square w-[400px] relative bg-slate-700/30 rounded-2xl border border-slate-600 p-4 grid grid-cols-2 grid-rows-2 gap-2">
                             {/* Q1: Low Calc / High Prop */}
                            <div className="bg-blue-500/20 rounded flex flex-col items-center justify-center border border-blue-500/30">
                                <span className="text-2xl font-bold text-blue-400">{Math.round((performanceMatrix.logic_error / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-blue-300">منطق سليم / خطأ حسابي</span>
                            </div>
                            {/* Q2: High Calc / High Prop */}
                            <div className="bg-emerald-500/20 rounded flex flex-col items-center justify-center border border-emerald-500/30">
                                <span className="text-2xl font-bold text-emerald-400">{Math.round((performanceMatrix.balanced / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-emerald-300">تحكم شامل</span>
                            </div>
                            {/* Q3: Low Calc / Low Prop */}
                            <div className="bg-red-500/20 rounded flex flex-col items-center justify-center border border-red-500/30">
                                <span className="text-2xl font-bold text-red-400">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-red-300">تعثر شامل</span>
                            </div>
                            {/* Q4: High Calc / Low Prop */}
                            <div className="bg-yellow-500/20 rounded flex flex-col items-center justify-center border border-yellow-500/30">
                                <span className="text-2xl font-bold text-yellow-400">{Math.round((performanceMatrix.rote / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-yellow-300">حساب آلي (حفظ)</span>
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
                 const isCritical = criticalFailureRate > 10;
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
                             {isCritical ? "فشل مزدوج (عمليات + مساحات). هؤلاء التلاميذ يحتاجون تدخل عاجل." : "النسبة ضمن الحدود المقبولة."}
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
            {hoveredData && (
                <div className="fixed z-[9999] pointer-events-none bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs max-w-xs border border-slate-700" style={{ left: hoveredData.x, top: hoveredData.y, transform: 'translate(-50%, -100%)' }}>
                    {hoveredData.title && <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-yellow-400">{hoveredData.title}</div>}
                    <div>{hoveredData.text}</div>
                </div>
            )}

            {renderExpandedView()}
            {renderEditModal()}

            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Sigma size={300} /></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                            <Target size={14}/>
                            تحليل الرياضيات (نهاية الطور)
                        </div>
                        <h2 className="text-3xl font-bold font-serif mb-2">{YEAR5_MATH_DEF.label}</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2"><School size={16}/> {contextName} <span className="mx-2">|</span> <Zap size={16}/> تشخيص الأداء المنظومي</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. COMMUNICATION INDEX (NEW) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative" onClick={() => setExpandedSection('communication')}>
                    <ExpandBtn section="communication" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><MessageSquare className="text-blue-600" size={20}/> الفصاحة الرياضياتية</h3>
                    </div>
                    <div className="flex items-center justify-center py-6">
                         <div className="relative w-48 h-24 bg-gray-100 rounded-t-full overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000" style={{ transform: `rotate(${(Math.min(commIndex, 100) / 100) * 180 - 90}deg)` }}>
                                <div className="w-2 h-full bg-blue-600 mx-auto shadow-[0_0_15px_#2563eb]"></div>
                            </div>
                        </div>
                        <div className="absolute bottom-10 text-center">
                            <span className="text-4xl font-bold text-slate-800">{commIndex.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                {/* 2. ABSTRACT TRIANGLE (NEW) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative" onClick={() => setExpandedSection('abstractTriangle')}>
                    <ExpandBtn section="abstractTriangle" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Shapes className="text-purple-600" size={20}/> مثلث المفاهيم المجردة</h3>
                    </div>
                    <div className="flex items-center justify-center py-2 h-40">
                        {/* Mini Triangle Preview */}
                        <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
                            <circle cx="50" cy="10" r="8" fill="#a855f7" className="animate-pulse"/>
                            <circle cx="10" cy="90" r="8" fill="#3b82f6"/>
                            <circle cx="90" cy="90" r="8" fill="#ec4899"/>
                            <path d="M50 10 L10 90 L90 90 Z" fill="none" stroke="#cbd5e1" strokeWidth="2"/>
                        </svg>
                        <div className="mr-6 space-y-2 text-xs font-bold text-slate-500">
                            <p><span className="text-purple-500">●</span> كسور</p>
                            <p><span className="text-blue-500">●</span> أعداد عشرية</p>
                            <p><span className="text-pink-500">●</span> نسبة مئوية</p>
                        </div>
                    </div>
                </div>

                {/* 3. RADAR & ILLITERACY */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative" onClick={() => setExpandedSection('radar')}>
                    <ExpandBtn section="radar" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Activity size={20} className="text-indigo-600"/> توازن الميادين الأربعة</h3>
                    <div className="flex justify-center py-4">
                        <div className="relative w-40 h-40">
                            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                                <polygon points={generateRadarPath(radarData)} fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg transition-all group relative" onClick={() => setExpandedSection('illiteracy')}>
                    <ExpandBtn section="illiteracy" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500"/> الهشاشة القاعدية</h3>
                    <div className="text-center py-8">
                        <span className="text-5xl font-bold text-red-500">{criticalFailureRate.toFixed(1)}%</span>
                        <p className="text-slate-400 text-xs mt-2 font-bold uppercase">نسبة الخطر</p>
                    </div>
                </div>

            </div>

            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                 <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl border-2 border-slate-700 hover:border-slate-600 hover:scale-105 group">
                    <Edit size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>تعديل التحليل</span>
                 </button>
            </div>

            {isEditMode && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="font-bold text-xl text-slate-800">تعديل التحليل الآلي</h3>
                            <button onClick={() => setIsEditMode(false)} className="text-slate-400 hover:text-red-500"><X/></button>
                        </div>
                        {!editingSection ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setEditingSection('communication')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl font-bold text-slate-700">الفصاحة</button>
                                <button onClick={() => setEditingSection('abstractTriangle')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl font-bold text-slate-700">المثلث المجرد</button>
                                <button onClick={() => setEditingSection('radar')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl font-bold text-slate-700">الرادار</button>
                                <button onClick={() => setEditingSection('illiteracy')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl font-bold text-slate-700">الهشاشة</button>
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
    const getTitle = () => METRIC_DEFINITIONS[section].title;

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
                 <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"><ChevronRight size={12} className="rotate-180"/> عودة</button>
                 <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{getTitle()}</span>
             </div>
             <div><label className="block text-xs font-bold text-slate-700 mb-1">قراءة</label><VoiceTextarea value={formData.reading} onChange={(v) => setFormData({...formData, reading: v})} className="w-full border rounded-lg p-3 text-sm" minHeight="min-h-[100px]"/></div>
             <div><label className="block text-xs font-bold text-slate-700 mb-1">تشخيص</label><VoiceTextarea value={formData.diagnosis} onChange={(v) => setFormData({...formData, diagnosis: v})} className="w-full border rounded-lg p-3 text-sm bg-amber-50" minHeight="min-h-[100px]"/></div>
             <div><label className="block text-xs font-bold text-slate-700 mb-1">توصيات</label><VoiceTextarea value={formData.recommendation} onChange={(v) => setFormData({...formData, recommendation: v})} className="w-full border rounded-lg p-3 text-sm bg-emerald-50" minHeight="min-h-[100px]"/></div>
             <div className="flex justify-between pt-4 border-t">
                 <button onClick={onReset} className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline"><RotateCcw size={12}/> استرجاع</button>
                 <div className="flex gap-2">
                     <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">إلغاء</button>
                     <button onClick={() => onSave(formData)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"><Save size={16}/> حفظ</button>
                 </div>
             </div>
        </div>
    );
};

export default AcqYear5MathStats;
