
import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_ARABIC_DEF } from '../../../constants/acqYear5Arabic';
import { 
    Activity, Target, TrendingUp, AlertTriangle, Lightbulb, Users, School, 
    BookOpen, Zap, BrainCircuit, PenTool, 
    AlertOctagon, ArrowUpRight, GraduationCap, X, Info,
    Scale, FileText, Maximize2, Minimize2, CheckCircle2, Microscope, Edit, Save, RotateCcw,
    Filter, Layers, ArrowDown, ChevronRight, Ruler
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

// Types for Analysis Structure
type AnalysisSection = 'gap' | 'textType' | 'radar' | 'illiteracy' | 'funnel';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions for Focus Mode (Displayed above chart)
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string }> = {
    gap: {
        title: "الفجوة الديداكتيكية",
        concept: "مؤشر يقيس الفارق بين 'الحفظ النظري' للقواعد (الموارد) والقدرة على 'تطبيقها' في وضعيات إنتاجية (الكفاءة).",
        method: "حساب معدل تحكم التلاميذ في معايير الموارد (نحو، صرف، إملاء) ومقارنته بمعدل التحكم في معايير الإنتاج (بناء النص، الانسجام)."
    },
    textType: {
        title: "تنفيذ المنهاج (أنماط النصوص)",
        concept: "مدى انتقال التلاميذ من الأنماط البسيطة (السرد/الوصف) إلى الأنماط المعقدة المستهدفة في السنة الخامسة (التفسير/الحجاج).",
        method: "مقارنة نسب النجاح في معايير الفهم والإنتاج المتعلقة بالسرد (مكتسبات سابقة) مع تلك المتعلقة بالحجاج والتفسير (تعلمات جديدة)."
    },
    radar: {
        title: "توازن الكفاءات",
        concept: "نظرة شمولية لمدى نمو الكفاءات الأربع بشكل متوازٍ دون طغيان جانب على آخر (مثل طغيان الشفوي على الكتابي).",
        method: "حساب معدل التحكم في كل ميدان (فهم المنطوق، تعبير شفوي، قراءة، كتابة) بشكل مستقل."
    },
    illiteracy: {
        title: "مؤشر الهشاشة القاعدية",
        concept: "تحديد نسبة التلاميذ المهددين بالفشل الدراسي الكلي بسبب عدم امتلاك أدوات التعلم الأساسية.",
        method: "حساب نسبة التلاميذ الذين حصلوا على تقدير (د) في القراءة (فك الرمز) وفي الكتابة (الإملاء/الإنتاج) معاً."
    },
    funnel: {
        title: "قمع النجاح (التسرب المعرفي)",
        concept: "تتبع مسار التلميذ عبر مستويات التعلم الهرمية: من القراءة البسيطة إلى الفهم، ثم الكتابة، وصولاً للإبداع.",
        method: "عدد التلاميذ المتحكمين في كل مستوى (قراءة -> فهم -> إنتاج -> إبداع) وتحديد أين ينخفض العدد بشكل حاد."
    }
};

const AcqYear5ArabicStats: React.FC<Props> = ({ records, scope, contextName }) => {
    // State for Expanded View (Focus Mode)
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    // State for Tooltips
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, text: string, title?: string } | null>(null);

    // --- MANUAL OVERRIDE STATE ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
    const [customAnalysis, setCustomAnalysis] = useState<Record<string, AnalysisContent>>({});

    // Load custom analysis from local storage on mount
    useEffect(() => {
        const key = `mufattish_analysis_${contextName}_${scope}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setCustomAnalysis(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load custom analysis", e);
            }
        }
    }, [contextName, scope]);

    // Save custom analysis to local storage
    const handleSaveAnalysis = (section: string, data: AnalysisContent) => {
        const newAnalysis = { ...customAnalysis, [section]: data };
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null); // Close edit form
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_${contextName}_${scope}`, JSON.stringify(newAnalysis));
    };

    // --- 1. DATA PREPARATION ---
    const allStudents = useMemo(() => {
        return records.flatMap(r => r.students);
    }, [records]);

    const totalStudents = allStudents.length;

    const getGrade = (student: any, compId: string, critId: number) => {
        if (!student.results) return null;
        const comp = student.results[compId];
        if (!comp) return null;
        return comp[critId] || comp[String(critId)];
    };

    // --- 2. ADVANCED METRICS CALCULATION ---

    // A. The Didactic Gap
    const didacticGap = useMemo(() => {
        let resourceScore = 0, resourceMax = 0;
        let competencyScore = 0, competencyMax = 0;

        allStudents.forEach(s => {
            // Resources: Grammar (Crit 8), Vocab (Crit 9), Reading Mech (Crit 1)
            const g_grammar = getGrade(s, 'written_comp', 8);
            const g_vocab = getGrade(s, 'written_comp', 9);
            const g_read_mech = getGrade(s, 'reading_perf', 1);

            [g_grammar, g_vocab, g_read_mech].forEach(g => {
                if(g) {
                    resourceMax += 3;
                    if(g === 'A') resourceScore += 3;
                    else if(g === 'B') resourceScore += 2;
                    else if(g === 'C') resourceScore += 1;
                }
            });

            // Competency: Structure (Crit 2), Coherence (Crit 3), Oral Interaction (Crit 4)
            const g_prod_struct = getGrade(s, 'written_prod', 2);
            const g_prod_cohere = getGrade(s, 'written_prod', 3);
            const g_oral_interact = getGrade(s, 'oral_comms', 4);

            [g_prod_struct, g_prod_cohere, g_oral_interact].forEach(g => {
                if(g) {
                    competencyMax += 3;
                    if(g === 'A') competencyScore += 3;
                    else if(g === 'B') competencyScore += 2;
                    else if(g === 'C') competencyScore += 1;
                }
            });
        });

        const rPct = resourceMax > 0 ? (resourceScore / resourceMax) * 100 : 0;
        const cPct = competencyMax > 0 ? (competencyScore / competencyMax) * 100 : 0;
        
        return { rPct, cPct, gap: rPct - cPct };
    }, [allStudents]);

    // B. Text Types Analysis
    const textTypeAnalysis = useMemo(() => {
        let complexScore = 0, complexMax = 0;
        let basicScore = 0, basicMax = 0;

        allStudents.forEach(s => {
            const g_explain = getGrade(s, 'written_comp', 4);
            const g_argue = getGrade(s, 'written_prod', 6);
            [g_explain, g_argue].forEach(g => {
                if(g) {
                    complexMax += 3;
                    if(g === 'A') complexScore += 3;
                    else if(g === 'B') complexScore += 2;
                    else if(g === 'C') complexScore += 1;
                }
            });

            const g_read = getGrade(s, 'reading_perf', 1);
            const g_copy = getGrade(s, 'written_prod', 7); 
            [g_read, g_copy].forEach(g => {
                if(g) {
                    basicMax += 3;
                    if(g === 'A') basicScore += 3;
                    else if(g === 'B') basicScore += 2;
                    else if(g === 'C') basicScore += 1;
                }
            });
        });

        return {
            complexPct: complexMax > 0 ? (complexScore / complexMax) * 100 : 0,
            basicPct: basicMax > 0 ? (basicScore / basicMax) * 100 : 0
        };
    }, [allStudents]);

    // C. The "Lost Generation"
    const criticalFailureRate = useMemo(() => {
        const failedStudents = allStudents.filter(s => {
            const g_read = getGrade(s, 'reading_perf', 1);
            const g_write = getGrade(s, 'written_prod', 4);
            return g_read === 'D' && g_write === 'D';
        }).length;
        
        return totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0;
    }, [allStudents, totalStudents]);

    // D. Skills Radar Data
    const radarData = useMemo(() => {
        const domains = [
            { key: 'oral', label: 'تواصل شفوي', compId: 'oral_comms' },
            { key: 'reading', label: 'أداء قرائي', compId: 'reading_perf' },
            { key: 'comp', label: 'فهم مكتوب', compId: 'written_comp' },
            { key: 'prod', label: 'إنتاج كتابي', compId: 'written_prod' },
        ];
        
        return domains.map(d => {
            let score = 0, max = 0;
            allStudents.forEach(s => {
                const compDef = YEAR5_ARABIC_DEF.competencies.find(c => c.id === d.compId);
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

    // E. The Learning Funnel
    const funnelData = useMemo(() => {
        const total = totalStudents;
        const readers = allStudents.filter(s => {
            const g = getGrade(s, 'reading_perf', 1);
            return g === 'A' || g === 'B';
        }).length;
        
        const comprehenders = allStudents.filter(s => {
             const g1 = getGrade(s, 'written_comp', 1); 
             const g2 = getGrade(s, 'written_comp', 2); 
             return g1 === 'A' || g1 === 'B' || g2 === 'A' || g2 === 'B';
        }).length;

        const writers = allStudents.filter(s => {
            const g = getGrade(s, 'written_prod', 2); 
            return g === 'A' || g === 'B';
        }).length;

        const creators = allStudents.filter(s => {
            const g = getGrade(s, 'written_prod', 6); 
            return g === 'A' || g === 'B';
        }).length;

        return [
            { label: 'المسجلون', count: total, color: 'bg-slate-300', text: 'text-slate-700', desc: "العدد الإجمالي للتلاميذ" },
            { label: 'يقرأون بطلاقة', count: readers, color: 'bg-blue-300', text: 'text-blue-900', desc: "تجاوزوا عقبة فك الرمز (القراءة)" },
            { label: 'يفهمون المقروء', count: comprehenders, color: 'bg-indigo-400', text: 'text-white', desc: "قادرون على استخلاص المعنى" },
            { label: 'ينتجون نصوصاً', count: writers, color: 'bg-purple-500', text: 'text-white', desc: "يتحكمون في هيكلة النص" },
            { label: 'يبدعون (رأي)', count: creators, color: 'bg-pink-600', text: 'text-white', desc: "وصلوا لمرحلة النقد وإبداء الرأي" },
        ];
    }, [allStudents, totalStudents]);

    // F. Struggling Students List
    const strugglingList = useMemo(() => {
        return allStudents
            .map(s => {
                let score = 0;
                let count = 0;
                YEAR5_ARABIC_DEF.competencies[3].criteria.forEach(c => {
                    const g = getGrade(s, 'written_prod', c.id);
                    if(g) {
                        count++;
                        if(g === 'A') score += 3;
                        else if(g === 'B') score += 2;
                        else if(g === 'C') score += 1;
                    }
                });
                const pct = count > 0 ? (score / (count * 3)) * 100 : 0;
                
                let worstCrit = 'أداء عام ضعيف';
                for (const c of YEAR5_ARABIC_DEF.competencies[3].criteria) {
                    if (getGrade(s, 'written_prod', c.id) === 'D') {
                        worstCrit = c.label;
                        break;
                    }
                }

                return { ...s, writePct: pct, worstCrit };
            })
            .filter(s => s.writePct < 40)
            .sort((a, b) => a.writePct - b.writePct)
            .slice(0, 6);
    }, [allStudents]);

    // --- TOOLTIP HANDLERS ---
    const handleMouseEnter = (e: React.MouseEvent, title: string, text: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Fixed positioning logic to avoid jitter
        setHoveredData({
            x: rect.left + rect.width / 2,
            y: rect.top - 15, // Increased padding
            text,
            title
        });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    // --- LOGIC: GENERATE DEFAULT ANALYSIS ---
    const getDefaultAnalysis = (section: string): AnalysisContent => {
        if (section === 'gap') {
            const gapSize = didacticGap.gap;
            return {
                reading: `نلاحظ فجوة بمقدار ${gapSize.toFixed(1)}% لصالح الموارد (الحفظ/القواعد). هذا يعني أن التلاميذ ينجحون في تمارين "املأ الفراغ" و"أعرب" لكنهم يجدون صعوبة عند وضعهم في وضعية إدماجية تتطلب التحرير.`,
                diagnosis: gapSize > 15 
                    ? "طغيان المنطق التلقيني. الأستاذ يركز على تدريس القواعد كهدف بحد ذاته وليس كوسيلة. التلميذ يحفظ القاعدة ولا يعرف متى يستخدمها." 
                    : "توازن مقبول، مما يشير إلى ممارسات صفية تدمج بين النظري والتطبيقي.",
                recommendation: "يجب إعادة توجيه الممارسات الصفية نحو 'المقاربة النصية'. كل حصة قواعد يجب أن تنتهي بإنتاج كتابي قصير (سند) لتوظيف الظاهرة فوراً."
            };
        }
        if (section === 'funnel') {
            const start = funnelData[0].count;
            const end = funnelData[4].count;
            const dropRate = start > 0 ? ((start - end) / start * 100).toFixed(0) : 0;
            return {
                reading: `من أصل ${start} تلميذ، يصل فقط ${end} لمرحلة الإبداع وإبداء الرأي. نسبة التسرب المعرفي هي ${dropRate}%.`,
                diagnosis: "الانكسار الأكبر يحدث عند الانتقال من 'الفهم' إلى 'الإنتاج'. التلاميذ يستهلكون المعرفة (قراءة) لكنهم لا ينتجونها (كتابة).",
                recommendation: "تكثيف حصص 'التعبير الكتابي' و 'المشروع الكتابي'. يجب أن يكتب التلميذ فقرة واحدة على الأقل يومياً."
            };
        }
        if (section === 'textType') {
            const isLagging = textTypeAnalysis.complexPct < 50;
            return {
                reading: `مؤشر التحكم في النصوص المعقدة (التفسير والحجاج) هو ${textTypeAnalysis.complexPct.toFixed(1)}%، بينما التحكم في الأساسيات (السرد) مرتفع ${textTypeAnalysis.basicPct.toFixed(1)}%.`,
                diagnosis: isLagging 
                    ? "هناك ركود في مستوى السنة الرابعة. التلميذ مازال مرتاحاً في السرد والوصف، لكنه يجد صعوبة كبيرة في التجريد والتعليل المطلوبين في السنة الخامسة." 
                    : "مؤشر ممتاز يدل على انتقال سلس من المحسوس (السرد) إلى المجرد (الحجاج).",
                recommendation: "تنظيم ورشات حول 'النص الحجاجي'. تدريب التلاميذ على استعمال روابط التعليل (لأن، بما أن، إذن) وأفعال الرأي (أعتقد، أرى أن)."
            };
        }
        if (section === 'radar') {
            const weakDomain = radarData.reduce((prev, curr) => prev.A < curr.A ? prev : curr);
            return {
                reading: "خريطة الكفاءات تظهر مستويات التحكم بين الميادين الأربعة.",
                diagnosis: `الميدان الأضعف هو "${weakDomain.subject}" بنسبة ${weakDomain.A.toFixed(1)}%. هذا الاختلال يهدد تماسك بناء الكفاءة الشاملة. اللغة كل لا يتجزأ.`,
                recommendation: `يجب تخصيص أسابيع الإدماج القادمة للتركيز حصرياً على أنشطة "${weakDomain.subject}".`
            };
        }
        if (section === 'illiteracy') {
            const isCritical = criticalFailureRate > 15;
            const isZero = criticalFailureRate === 0;
            
            if (isZero) {
                 return {
                    reading: `نسبة 0% من التلاميذ يعانون من تعثر شامل.`,
                    diagnosis: "نتائج ممتازة. القسم يتحكم في الكفاءات القاعدية (القراءة والكتابة) بشكل كلي.",
                    recommendation: "التركيز الآن على التميز والإبداع، وتنمية مهارات التفكير العليا (النقد، التحليل) بما أن الأساسيات مكتسبة."
                };
            }

            return {
                reading: `نسبة ${criticalFailureRate.toFixed(1)}% من التلاميذ يعانون من تعثر شامل (عجز في القراءة والكتابة معاً).`,
                diagnosis: isCritical
                    ? "هذا الرقم يمثل 'حالة طوارئ تربوية'. هؤلاء التلاميذ مهددون بالتسرب المدرسي عند الانتقال للمتوسط لأنهم لا يملكون أدوات التعلم الذاتي."
                    : "النسبة ضمن الحدود المقبولة إحصائياً، وتعكس حالات فردية خاصة.",
                recommendation: isCritical 
                    ? "تفعيل جهاز الدعم والمعالجة (PPRE) فوراً. التركيز على المهارات الدنيا (فك الرمز، النسخ) قبل المهارات العليا."
                    : "متابعة الحالات الفردية ضمن حصص المعالجة العادية."
            };
        }
        return { reading: '', diagnosis: '', recommendation: '' };
    };

    const getAnalysis = (section: string) => {
        return customAnalysis[section] || getDefaultAnalysis(section);
    };

    // --- HELPER COMPONENTS ---
    
    const ExpandBtn = ({ section }: { section: AnalysisSection }) => (
        <button 
            onClick={(e) => { e.stopPropagation(); setExpandedSection(section); }}
            className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 z-10 shadow-sm"
            title="تكبير للتحليل المعمق"
        >
            <Maximize2 size={18} />
        </button>
    );

    const renderExpandedView = () => {
        if (!expandedSection) return null;

        let content = null;
        let analysisIcon = null;
        
        const activeAnalysis = getAnalysis(expandedSection);
        const def = METRIC_DEFINITIONS[expandedSection];

        switch (expandedSection) {
            case 'gap':
                analysisIcon = <Scale size={24} className="text-indigo-400" />;
                content = (
                     <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="w-full max-w-lg space-y-8">
                            <div className="relative group">
                                <div className="flex justify-between text-lg font-bold mb-2 text-slate-300">
                                    <span className="flex items-center gap-2"><BookOpen size={24}/> اكتساب الموارد</span>
                                    <span className="text-indigo-400 text-2xl">{didacticGap.rPct.toFixed(1)}%</span>
                                </div>
                                <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" style={{ width: `${didacticGap.rPct}%` }}></div>
                                </div>
                                <p className="text-slate-400 mt-1 text-xs">قدرة التلميذ على استرجاع القواعد النظرية (نحو، صرف، إملاء) في تمارين معزولة.</p>
                            </div>
                            <div className="relative group">
                                <div className="flex justify-between text-lg font-bold mb-2 text-slate-300">
                                    <span className="flex items-center gap-2"><PenTool size={24}/> ممارسة الكفاءة</span>
                                    <span className="text-amber-400 text-2xl">{didacticGap.cPct.toFixed(1)}%</span>
                                </div>
                                <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(245,158,11,0.5)]" style={{ width: `${didacticGap.cPct}%` }}></div>
                                </div>
                                <p className="text-slate-400 mt-1 text-xs">قدرة التلميذ على تجنيد تلك الموارد لإنتاج خطاب (شفوي أو كتابي) سليم ومتسق.</p>
                            </div>
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

            case 'textType':
                analysisIcon = <FileText size={24} className="text-blue-400" />;
                content = (
                    <div className="h-full flex items-center justify-center p-4 w-full">
                        <div className="flex items-end gap-16 h-80 w-full max-w-2xl justify-center">
                            <div className="flex flex-col items-center gap-3 group w-1/3">
                                <span className="text-3xl font-bold text-blue-400">{textTypeAnalysis.complexPct.toFixed(0)}%</span>
                                <div className="w-full bg-slate-700 rounded-t-2xl relative overflow-hidden border-x border-t border-slate-600 shadow-2xl h-56">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-1000" style={{ height: `${textTypeAnalysis.complexPct}%` }}></div>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-blue-300 block mb-0.5">التفكير المجرد</span>
                                    <span className="text-xs text-slate-400">التفسير والحجاج</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3 group w-1/3">
                                <span className="text-3xl font-bold text-slate-300">{textTypeAnalysis.basicPct.toFixed(0)}%</span>
                                <div className="w-full bg-slate-700 rounded-t-2xl relative overflow-hidden border-x border-t border-slate-600 shadow-2xl h-56">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-500 to-slate-400 transition-all duration-1000" style={{ height: `${textTypeAnalysis.basicPct}%` }}></div>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-slate-300 block mb-0.5">المهارات القاعدية</span>
                                    <span className="text-xs text-slate-500">السرد والوصف</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                break;

            case 'radar':
                analysisIcon = <Activity size={24} className="text-purple-400" />;
                content = (
                    <div className="h-full flex items-center justify-center w-full">
                        <div className="relative w-[380px] h-[380px]"> {/* Reduced size for better fit */}
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
            
            case 'illiteracy':
                analysisIcon = <AlertOctagon size={24} className="text-red-400" />;
                const isCritical = criticalFailureRate > 15;
                const isZero = criticalFailureRate === 0;
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
                            {isZero ? "نتائج ممتازة! لا يوجد أي تلميذ يعاني من تعثر شامل في القراءة والكتابة." :
                             isCritical ? "تلاميذ يفتقدون للحد الأدنى من الكفاءات القاعدية (قراءة/كتابة)." : "تلاميذ يحتاجون لمتابعة عادية."}
                        </p>
                    </div>
                );
                break;
        }

        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Close Button */}
                <button 
                    onClick={() => setExpandedSection(null)}
                    className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full z-50 text-white transition-all"
                >
                    <Minimize2 size={24} />
                </button>

                {/* Right: The Analysis Panel (40%) */}
                <div className="w-[400px] lg:w-[35%] bg-slate-900 border-l border-slate-800 p-8 flex flex-col shadow-2xl relative z-40 overflow-y-auto">
                    <div className="mb-8 pb-6 border-b border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                                {analysisIcon}
                            </div>
                            <h2 className="text-2xl font-bold text-white font-serif">{def.title}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">تحليل معمق للكفاءات الختامية</p>
                    </div>

                    <div className="space-y-8 flex-1">
                        {/* 1. Reading */}
                        <div className="relative pl-4 border-r-2 border-indigo-500/50 pr-4">
                            <h4 className="text-indigo-400 font-bold uppercase text-xs mb-2 flex items-center gap-2">
                                <Activity size={14}/> قراءة في البيانات
                            </h4>
                            <p className="text-slate-300 leading-relaxed text-sm text-justify">
                                {activeAnalysis.reading}
                            </p>
                        </div>

                        {/* 2. Diagnosis */}
                        <div className="relative pl-4 border-r-2 border-amber-500/50 pr-4 bg-amber-500/5 p-4 rounded-l-xl">
                            <h4 className="text-amber-400 font-bold uppercase text-xs mb-2 flex items-center gap-2">
                                <Microscope size={14}/> التشخيص البيداغوجي
                            </h4>
                            <p className="text-slate-200 leading-relaxed text-sm font-medium text-justify">
                                {activeAnalysis.diagnosis}
                            </p>
                        </div>

                        {/* 3. Recommendation */}
                        <div className="relative pl-4 border-r-2 border-emerald-500/50 pr-4">
                            <h4 className="text-emerald-400 font-bold uppercase text-xs mb-2 flex items-center gap-2">
                                <CheckCircle2 size={14}/> التوصية والقرار
                            </h4>
                            <p className="text-slate-300 leading-relaxed text-sm text-justify">
                                {activeAnalysis.recommendation}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">نظام المفتش التربوي الذكي © 2025</p>
                    </div>
                </div>

                {/* Left: The Chart (60%) */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    
                    {/* NEW: Static Definition Card - Positioned at top of chart area, compacted */}
                    <div className="w-full max-w-3xl z-20 mb-4 mt-2 animate-in slide-in-from-top-4 shrink-0">
                         <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1.5 bg-indigo-500/20 rounded-bl-lg border-b border-l border-white/10">
                                <Info size={14} className="text-indigo-300"/>
                            </div>
                            <div className="space-y-2 pt-1">
                                 <div>
                                     <h4 className="text-[11px] font-bold text-indigo-300 uppercase mb-0.5">المفهوم التربوي</h4>
                                     <p className="text-xs text-white/90 leading-relaxed">{def.concept}</p>
                                 </div>
                                 <div className="pt-2 border-t border-white/10">
                                     <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 flex items-center gap-1"><Ruler size={10}/> المرجعية الحسابية</h4>
                                     <p className="text-[10px] text-slate-400 leading-relaxed font-mono opacity-80">{def.method}</p>
                                 </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-0">
                         {content}
                    </div>
                </div>
            </div>
        );
    };

    // Edit Analysis Modal
    const renderEditModal = () => {
        if (!editingSection || !isEditMode) return null;
        const currentData = getAnalysis(editingSection);
        
        return (
            <EditAnalysisForm 
                section={editingSection}
                initialData={currentData}
                onSave={(data) => handleSaveAnalysis(editingSection, data)}
                onReset={() => handleResetAnalysis(editingSection)}
                onClose={() => setEditingSection(null)}
            />
        );
    };

    // Radar Chart Path Generator
    const generateRadarPath = (data: any[]) => {
        if (data.length === 0) return '';
        const center = 100;
        const radius = 80;
        return data.map((point, i) => {
            const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
            const val = point.A / 100;
            const x = center + radius * val * Math.cos(angle);
            const y = center + radius * val * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات للتحليل</div>;

    const systemicDiag = {
        title: "نظام التحليل التفاعلي",
        desc: "يمكنك الآن تعديل القراءات والتشخيصات يدوياً بما يتوافق مع واقع المقاطعة."
    };

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
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700"></div>
                </div>
            )}

            {/* MODALS */}
            {renderExpandedView()}
            {renderEditModal()}

            {/* HEADER - STRATEGIC VIEW */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Activity size={300} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                            <Target size={14}/>
                            لوحة القيادة الاستراتيجية (نهاية الطور)
                        </div>
                        <h2 className="text-3xl font-bold font-serif mb-2">تحليل أداء المنظومة التربوية</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                            <School size={16}/> {contextName} <span className="mx-2">|</span> 
                            <Users size={16}/> {totalStudents} متعلم (عينة التحليل)
                        </p>
                    </div>
                    
                    {/* The Systemic Verdict Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-md cursor-pointer hover:bg-white/20 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white text-sm">حكم النظام الخبير</h3>
                            <ArrowUpRight size={16} className="text-white/70 group-hover:text-white transition-colors"/>
                        </div>
                        <p className="text-lg font-bold text-yellow-300 mb-1">{systemicDiag.title}</p>
                        <p className="text-xs text-white/80 line-clamp-2">{systemicDiag.desc}</p>
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
                                الفجوة الديداكتيكية (الموارد vs الكفاءة)
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">هل ينجح الأستاذ في تحويل "المعرفة النظرية" إلى "ممارسة عملية"؟</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${didacticGap.gap > 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            الفارق: {didacticGap.gap.toFixed(1)}%
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Resource Bar */}
                        <div 
                            className="relative pt-6"
                            onMouseEnter={(e) => handleMouseEnter(e, "اكتساب الموارد", `نسبة التحكم: ${didacticGap.rPct.toFixed(1)}%`)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-600 flex items-center gap-2"><BookOpen size={16}/> اكتساب الموارد (نحو/صرف/إملاء)</span>
                                <span className="text-indigo-600">{didacticGap.rPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${didacticGap.rPct}%` }}></div>
                            </div>
                        </div>

                        {/* Competency Bar */}
                        <div 
                            className="relative"
                            onMouseEnter={(e) => handleMouseEnter(e, "ممارسة الكفاءة", `نسبة التحكم: ${didacticGap.cPct.toFixed(1)}%`)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-600 flex items-center gap-2"><PenTool size={16}/> ممارسة الكفاءة (تحرير/تواصل)</span>
                                <span className="text-amber-500">{didacticGap.cPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${didacticGap.cPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. FUNCTIONAL ILLITERACY ALERT */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setExpandedSection('illiteracy')}
                    onMouseEnter={(e) => handleMouseEnter(e, "مؤشر الهشاشة", "نسبة التلاميذ الذين يعانون من تعثر مزدوج (قراءة + كتابة).")}
                    onMouseLeave={handleMouseLeave}
                >
                    <ExpandBtn section="illiteracy" />
                    <div className={`absolute inset-0 opacity-5 ${criticalFailureRate > 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    
                    <div 
                        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${criticalFailureRate > 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                    >
                        <AlertOctagon size={40} />
                    </div>
                    
                    <h3 className="font-bold text-2xl text-slate-800 mb-1">{criticalFailureRate.toFixed(1)}%</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">مؤشر الخطر (تعثر شامل)</p>
                    
                    <p className="text-sm text-slate-600 leading-relaxed px-4">
                        {criticalFailureRate > 10 
                            ? "نسبة مقلقة من التلاميذ ستنتقل للمتوسط دون التحكم في أبجديات اللغة." 
                            : "المؤشر في الحدود الطبيعية. المعالجة العادية كافية."}
                    </p>
                </div>
            </div>

            {/* 3. LEARNING FUNNEL (NEW) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setExpandedSection('funnel')}>
                <ExpandBtn section="funnel" />
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Filter size={20} className="text-pink-500"/>
                            قمع النجاح (التسرب المعرفي)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">تتبع مسار التلميذ من القراءة إلى الإبداع</p>
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
                                <div className="flex-1 bg-slate-100 rounded-r-lg h-8 relative overflow-hidden">
                                    <div 
                                        className={`h-full ${stage.color} flex items-center justify-end px-3 font-bold text-xs transition-all duration-1000`} 
                                        style={{ width: `${width}%` }}
                                    >
                                        <span className={stage.text}>{stage.count}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 4. RADAR CHART */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-1 group hover:shadow-md transition-shadow relative cursor-pointer"
                    onClick={() => setExpandedSection('radar')}
                >
                    <ExpandBtn section="radar" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-purple-600"/>
                        توازن الكفاءات الأربع
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
                                    className="cursor-help"
                                    onMouseEnter={(e) => handleMouseEnter(e, "توازن الكفاءات", "يوضح مدى توازن نمو الكفاءات الأربع.")}
                                    onMouseLeave={handleMouseLeave}
                                />
                                {radarData.map((d, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const x = 100 + 105 * Math.cos(angle);
                                    const y = 100 + 105 * Math.sin(angle);
                                    return (
                                        <g key={i} className="cursor-help" onMouseEnter={(e) => handleMouseEnter(e, d.subject, `نسبة التحكم: ${d.A.toFixed(1)}%`)} onMouseLeave={handleMouseLeave}>
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

                {/* 5. TEXT TYPES ANALYSIS */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 group hover:shadow-md transition-shadow relative cursor-pointer"
                    onClick={() => setExpandedSection('textType')}
                >
                    <ExpandBtn section="textType" />
                    <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                        <FileText size={20} className="text-blue-500"/>
                        مدى تنفيذ المنهاج (أنماط النصوص)
                    </h3>
                    <p className="text-xs text-slate-400 mb-8">هل يركز الأستاذ على نصوص السنة الخامسة (تفسيري/حجاجي) أم مازال في السرد؟</p>

                    <div className="flex flex-col gap-6">
                        <div 
                            className="flex items-center gap-4 p-2 rounded hover:bg-slate-50 transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, "التفكير المجرد", "النصوص المعقدة (تفسير/حجاج)")}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0"><BrainCircuit size={24}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">التفكير المجرد (التفسير والحجاج)</span>
                                    <span className="font-bold text-blue-600">{textTypeAnalysis.complexPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${textTypeAnalysis.complexPct}%` }}></div></div>
                            </div>
                        </div>
                        <div 
                            className="flex items-center gap-4 p-2 rounded hover:bg-slate-50 transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, "المهارات القاعدية", "النصوص البسيطة (سرد/وصف)")}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold shrink-0"><CheckCircle2 size={24}/></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">المهارات القاعدية (السرد والوصف)</span>
                                    <span className="font-bold text-slate-600">{textTypeAnalysis.basicPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400" style={{ width: `${textTypeAnalysis.basicPct}%` }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* 6. STRUGGLING STUDENTS LIST (SPOTLIGHT) */}
            {strugglingList.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-red-900 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-600"/>
                        كشاف المتعثرين (عينة للمتابعة)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {strugglingList.map((s, i) => (
                            <div 
                                key={i} 
                                className="bg-white p-3 rounded-xl border border-red-100 flex items-center gap-3 hover:shadow-md transition-shadow"
                                onMouseEnter={(e) => handleMouseEnter(e, s.fullName, `يعاني من تعثر في: ${s.worstCrit}`)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm shrink-0">
                                    {s.writePct.toFixed(0)}%
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{s.fullName}</p>
                                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                                        <ArrowDown size={10}/> تعثر في: {s.worstCrit}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 7. EDIT BUTTON FOOTER */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                 <button 
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl border-2 border-slate-700 hover:border-slate-600 hover:scale-105 group"
                 >
                    <Edit size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>تعديل التحليل</span>
                 </button>
            </div>

            {/* MANUAL EDIT MODE OVERLAY */}
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
                                    <span className="text-xs text-slate-400">تحليل الموارد vs الكفاءة</span>
                                </button>
                                <button onClick={() => setEditingSection('textType')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">أنماط النصوص</span>
                                    <span className="text-xs text-slate-400">تنفيذ المنهاج (سردي/حجاجي)</span>
                                </button>
                                <button onClick={() => setEditingSection('radar')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">رادار الكفاءات</span>
                                    <span className="text-xs text-slate-400">التوازن بين الميادين الأربعة</span>
                                </button>
                                <button onClick={() => setEditingSection('illiteracy')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مؤشر الهشاشة</span>
                                    <span className="text-xs text-slate-400">تحليل التعثر الشامل</span>
                                </button>
                                <button onClick={() => setEditingSection('funnel')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group col-span-2 flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-slate-700 block group-hover:text-indigo-700">قمع النجاح</span>
                                        <span className="text-xs text-slate-400">تحليل التسرب المعرفي</span>
                                    </div>
                                    <ChevronRight className="text-slate-300"/>
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
                     <ArrowUpRight size={12} className="rotate-180"/> عودة للقائمة
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
                    placeholder="يمكنك كتابة تحليل مفصل هنا..."
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

export default AcqYear5ArabicStats;
