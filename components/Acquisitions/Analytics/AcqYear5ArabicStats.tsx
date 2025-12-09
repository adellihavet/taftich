import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_ARABIC_DEF } from '../../../constants/acqYear5Arabic';
import { 
    Activity, Target, TrendingUp, AlertTriangle, Lightbulb, Users, School, 
    BookOpen, Zap, BrainCircuit, PenTool, 
    AlertOctagon, ArrowUpRight, GraduationCap, X, Info,
    Scale, FileText, Maximize2, Minimize2, CheckCircle2, Microscope, Edit, Save, RotateCcw,
    Filter, Layers, ArrowDown, ChevronRight, Ruler, BarChart3, Target as TargetIcon,
    Heart, Shield, TrendingDown, Clock, Award, Sparkles, Brain, Cpu, GitBranch
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

// Types for Analysis Structure
type AnalysisSection = 'gap' | 'textType' | 'radar' | 'illiteracy' | 'funnel' | 'patterns' | 'sustainability';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions for Focus Mode
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string, icon: React.ReactNode }> = {
    gap: {
        title: "الفجوة الديداكتيكية (النحو والتوظيف)",
        concept: "مؤشر يقيس الفارق بين 'فهم القواعد' نظرياً (العلاقات التركيبية) والقدرة على 'توظيفها' عملياً في الإنتاج.",
        method: "مقارنة معدل التحكم في المعيارين 4 و 5 من فهم المكتوب (النحو) مع معدل التحكم في المعيار 4 من الإنتاج الكتابي.",
        icon: <Scale size={24} />
    },
    textType: {
        title: "مهارات التفكير العليا",
        concept: "مدى قدرة المتعلم على الانتقال من الفهم السطحي (استخراج معلومات) إلى الفهم العميق (التفسير، التبرير، الرأي).",
        method: "مقارنة نسب النجاح في المعلومات الصريحة (معيار 2 و 3) مع نسب التفسير والرأي (معيار 6 و 9).",
        icon: <BrainCircuit size={24} />
    },
    radar: {
        title: "توازن الكفاءات",
        concept: "نظرة شمولية لمدى نمو الكفاءات الأربع بشكل متوازٍ دون طغيان جانب على آخر (مثل طغيان الشفوي على الكتابي).",
        method: "حساب معدل التحكم في كل ميدان (فهم المنطوق، تعبير شفوي، قراءة، كتابة) بشكل مستقل.",
        icon: <Activity size={24} />
    },
    illiteracy: {
        title: "مؤشر الهشاشة القاعدية",
        concept: "تحديد نسبة التلاميذ المهددين بالفشل الدراسي الكلي بسبب عدم امتلاك أدوات التعلم الأساسية.",
        method: "حساب نسبة التلاميذ الذين حصلوا على تقدير (د) في القراءة (فك الرمز) وفي الكتابة (الإملاء/الإنتاج) معاً.",
        icon: <AlertOctagon size={24} />
    },
    funnel: {
        title: "قمع النجاح (التسرب المعرفي)",
        concept: "تتبع مسار التلميذ: من القراءة -> استخراج المعلومة -> فهم العلاقات (النحو) -> إبداء الرأي.",
        method: "عدد التلاميذ المتحكمين في كل مستوى هرمي من مستويات فهم المكتوب (من المعيار 1 إلى المعيار 9).",
        icon: <Filter size={24} />
    },
    patterns: {
        title: "أنماط التعلم السائدة",
        concept: "تحليل توزيع التلاميذ حسب أنماط اكتسابهم للمهارات (لفظي/كتابي/متوازن/تحليلي).",
        method: "تصنيف التلاميذ بناءً على فروق الأداء بين الكفاءات المختلفة.",
        icon: <GitBranch size={24} />
    },
    sustainability: {
        title: "مؤشر التعلم المستدام",
        concept: "قياس مدى رسوخ التعلم من خلال التحكم المتوازن في المهارات الأساسية والمتقدمة.",
        method: "عدد التلاميذ المتحكمين في المهارات الأساسية للقراءة والفهم والكتابة معاً.",
        icon: <Shield size={24} />
    }
};

// تعريفات مستويات التحكم
const CONTROL_LEVELS = {
    'A': { 
        label: 'تحكم أقصى', 
        color: '#10b981',
        score: 3,
        description: 'يتقن المهارة بإتقان تام ويطبقها في سياقات جديدة'
    },
    'B': { 
        label: 'تحكم مقبول', 
        color: '#3b82f6',
        score: 2,
        description: 'يتقن المهارة في سياقات مألوفة'
    },
    'C': { 
        label: 'تحكم جزئي', 
        color: '#f59e0b',
        score: 1,
        description: 'يتقن جزئياً ويحتاج إلى توجيه'
    },
    'D': { 
        label: 'تحكم محدود', 
        color: '#ef4444',
        score: 0,
        description: 'لا يمتلك أساسيات المهارة'
    }
};

// مستويات الكفاءة
type CompetencyLevel = 'تأسيسي' | 'ناشئ' | 'متوسط' | 'متقدم' | 'متميز';

const getCompetencyLevel = (percentage: number): CompetencyLevel => {
    if (percentage >= 96) return 'متميز';
    if (percentage >= 81) return 'متقدم';
    if (percentage >= 61) return 'متوسط';
    if (percentage >= 41) return 'ناشئ';
    return 'تأسيسي';
};

const getLevelColor = (level: CompetencyLevel): string => {
    switch (level) {
        case 'متميز': return 'bg-gradient-to-r from-emerald-500 to-teal-600';
        case 'متقدم': return 'bg-gradient-to-r from-blue-500 to-indigo-600';
        case 'متوسط': return 'bg-gradient-to-r from-yellow-500 to-amber-600';
        case 'ناشئ': return 'bg-gradient-to-r from-orange-500 to-red-500';
        case 'تأسيسي': return 'bg-gradient-to-r from-red-500 to-pink-600';
    }
};

const AcqYear5ArabicStats: React.FC<Props> = ({ records, scope, contextName }) => {
    // State for Expanded View
    const [expandedSection, setExpandedSection] = useState<AnalysisSection | null>(null);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, text: string, title?: string } | null>(null);
    
    // Manual Override State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
    const [customAnalysis, setCustomAnalysis] = useState<Record<string, AnalysisContent>>({});

    // Load custom analysis
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

    const handleSaveAnalysis = (section: string, data: AnalysisContent) => {
        const newAnalysis = { ...customAnalysis, [section]: data };
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null);
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_${contextName}_${scope}`, JSON.stringify(newAnalysis));
    };

    // --- DATA PREPARATION ---
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

    const getGradeScore = (grade: string | null): number => {
        if (!grade) return 0;
        return CONTROL_LEVELS[grade as keyof typeof CONTROL_LEVELS]?.score || 0;
    };

    // --- ADVANCED METRICS CALCULATION ---

    // A. The Didactic Gap
    const didacticGap = useMemo(() => {
        let resourceScore = 0, resourceMax = 0;
        let competencyScore = 0, competencyMax = 0;

        allStudents.forEach(s => {
            const g_syntax_a = getGrade(s, 'written_comp', 4);
            const g_syntax_b = getGrade(s, 'written_comp', 5);

            [g_syntax_a, g_syntax_b].forEach(g => {
                if(g) {
                    resourceMax += 3;
                    resourceScore += getGradeScore(g);
                }
            });

            const g_prod_grammar = getGrade(s, 'written_prod', 4);
            if(g_prod_grammar) {
                competencyMax += 3;
                competencyScore += getGradeScore(g_prod_grammar);
            }
        });

        const rPct = resourceMax > 0 ? (resourceScore / resourceMax) * 100 : 0;
        const cPct = competencyMax > 0 ? (competencyScore / competencyMax) * 100 : 0;
        const gap = rPct - cPct;
        
        return { 
            rPct, 
            cPct, 
            gap,
            rLevel: getCompetencyLevel(rPct),
            cLevel: getCompetencyLevel(cPct),
            gapSeverity: Math.abs(gap) > 15 ? 'عالية' : Math.abs(gap) > 8 ? 'متوسطة' : 'منخفضة'
        };
    }, [allStudents]);

    // B. Text Types Analysis
    const textTypeAnalysis = useMemo(() => {
        let complexScore = 0, complexMax = 0;
        let basicScore = 0, basicMax = 0;

        allStudents.forEach(s => {
            const g_explain = getGrade(s, 'written_comp', 6);
            const g_justify = getGrade(s, 'written_comp', 8);
            const g_opinion = getGrade(s, 'written_comp', 9);
            
            [g_explain, g_justify, g_opinion].forEach(g => {
                if(g) {
                    complexMax += 3;
                    complexScore += getGradeScore(g);
                }
            });

            const g_explicit_a = getGrade(s, 'written_comp', 2);
            const g_explicit_b = getGrade(s, 'written_comp', 3);
            
            [g_explicit_a, g_explicit_b].forEach(g => {
                if(g) {
                    basicMax += 3;
                    basicScore += getGradeScore(g);
                }
            });
        });

        const complexPct = complexMax > 0 ? (complexScore / complexMax) * 100 : 0;
        const basicPct = basicMax > 0 ? (basicScore / basicMax) * 100 : 0;
        
        return {
            complexPct,
            basicPct,
            complexLevel: getCompetencyLevel(complexPct),
            basicLevel: getCompetencyLevel(basicPct),
            gap: basicPct - complexPct
        };
    }, [allStudents]);

    // C. Critical Failure
    const criticalFailureRate = useMemo(() => {
        const failedStudents = allStudents.filter(s => {
            const g_read = getGrade(s, 'reading_perf', 1);
            const g_write = getGrade(s, 'written_prod', 3);
            return g_read === 'D' && g_write === 'D';
        }).length;
        
        const percentage = totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0;
        
        return {
            percentage,
            count: failedStudents,
            level: percentage > 15 ? 'حرج' : percentage > 8 ? 'مرتفع' : 'مقبول'
        };
    }, [allStudents, totalStudents]);

    // D. Radar Data
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
                        score += getGradeScore(g);
                    }
                });
            });
            const percentage = max > 0 ? (score / max) * 100 : 0;
            return { 
                subject: d.label, 
                A: percentage, 
                fullMark: 100,
                level: getCompetencyLevel(percentage)
            };
        });
    }, [allStudents]);

    // E. The Learning Funnel
    const funnelData = useMemo(() => {
        const total = totalStudents;
        
        const readers = allStudents.filter(s => {
            const g = getGrade(s, 'reading_perf', 1);
            return g === 'A' || g === 'B';
        }).length;
        
        const explicit = allStudents.filter(s => {
             const g1 = getGrade(s, 'written_comp', 2);
             const g2 = getGrade(s, 'written_comp', 3);
             return (g1 === 'A' || g1 === 'B') && (g2 === 'A' || g2 === 'B');
        }).length;

        const syntax = allStudents.filter(s => {
            const g1 = getGrade(s, 'written_comp', 4);
            const g2 = getGrade(s, 'written_comp', 5);
            return (g1 === 'A' || g1 === 'B') && (g2 === 'A' || g2 === 'B');
        }).length;

        const critical = allStudents.filter(s => {
            const g1 = getGrade(s, 'written_comp', 8);
            const g2 = getGrade(s, 'written_comp', 9);
            return (g1 === 'A' || g1 === 'B') || (g2 === 'A' || g2 === 'B');
        }).length;

        return [
            { 
                label: 'القراءة المسترسلة', 
                count: readers, 
                color: 'bg-slate-300', 
                text: 'text-slate-700', 
                desc: "القدرة على فك الرمز والنطق السليم",
                percentage: total > 0 ? (readers / total) * 100 : 0
            },
            { 
                label: 'المعلومات الصريحة', 
                count: explicit, 
                color: 'bg-blue-300', 
                text: 'text-blue-900', 
                desc: "استخراج معلومات ظاهرة في النص أ و ب",
                percentage: total > 0 ? (explicit / total) * 100 : 0
            },
            { 
                label: 'العلاقات التركيبية', 
                count: syntax, 
                color: 'bg-indigo-400', 
                text: 'text-white', 
                desc: "فهم وظيفة الكلمة وعلاقتها بغيرها (النحو)",
                percentage: total > 0 ? (syntax / total) * 100 : 0
            },
            { 
                label: 'الرأي والتبرير', 
                count: critical, 
                color: 'bg-pink-600', 
                text: 'text-white', 
                desc: "إبداء الرأي الشخصي وتبرير الاختيار",
                percentage: total > 0 ? (critical / total) * 100 : 0
            },
        ];
    }, [allStudents, totalStudents]);

    // F. Learning Patterns Analysis
    const learningPatterns = useMemo(() => {
        let verbalDominant = 0;
        let writtenDominant = 0;
        let balanced = 0;
        let comprehensionFocused = 0;
        let productionChallenged = 0;

        allStudents.forEach(student => {
            const getCompScore = (compId: string) => {
                let score = 0, max = 0;
                const compDef = YEAR5_ARABIC_DEF.competencies.find(c => c.id === compId);
                compDef?.criteria.forEach(crit => {
                    const g = getGrade(student, compId, crit.id);
                    if(g) {
                        max += 3;
                        score += getGradeScore(g);
                    }
                });
                return max > 0 ? (score / max) * 100 : 0;
            };

            const oralScore = getCompScore('oral_comms');
            const writtenScore = getCompScore('written_prod');
            const readingScore = getCompScore('reading_perf');
            const compScore = getCompScore('written_comp');

            // تحديد النمط
            if (oralScore > 75 && writtenScore < 50) {
                verbalDominant++;
            } else if (writtenScore > 75 && oralScore < 50) {
                writtenDominant++;
            } else if (Math.abs(oralScore - writtenScore) < 20 && 
                      Math.abs(readingScore - compScore) < 20) {
                balanced++;
            } else if (compScore > readingScore + 25) {
                comprehensionFocused++;
            } else if (writtenScore < 40) {
                productionChallenged++;
            } else {
                balanced++; // Default
            }
        });

        return {
            verbalDominant,
            writtenDominant,
            balanced,
            comprehensionFocused,
            productionChallenged,
            total: totalStudents
        };
    }, [allStudents, totalStudents]);

    // G. Sustainable Learning Index
    const sustainableLearningIndex = useMemo(() => {
        const sustainableLearners = allStudents.filter(student => {
            const basicSkills = [
                { comp: 'reading_perf', crit: 1 }, // القراءة المسترسلة
                { comp: 'written_comp', crit: 2 }, // المعلومات الصريحة
                { comp: 'written_prod', crit: 3 }, // تسلسل الأفكار
            ];
            
            return basicSkills.every(skill => {
                const grade = getGrade(student, skill.comp, skill.crit);
                return grade === 'A' || grade === 'B';
            });
        }).length;

        const percentage = (sustainableLearners / totalStudents) * 100;
        
        return {
            count: sustainableLearners,
            percentage,
            level: percentage > 70 ? 'ممتاز' : percentage > 50 ? 'جيد' : 'ضعيف',
            atRisk: totalStudents - sustainableLearners
        };
    }, [allStudents, totalStudents]);

    // H. Overall Performance Health
    const performanceHealth = useMemo(() => {
        const metrics = [
            didacticGap.gapSeverity,
            criticalFailureRate.level,
            sustainableLearningIndex.level,
            textTypeAnalysis.gap > 30 ? 'ضعيف' : textTypeAnalysis.gap > 15 ? 'متوسط' : 'جيد'
        ];

        const excellentCount = metrics.filter(m => m === 'ممتاز').length;
        const goodCount = metrics.filter(m => m === 'جيد').length;
        const mediumCount = metrics.filter(m => m === 'متوسط').length;
        const weakCount = metrics.filter(m => m === 'ضعيف').length;

        const healthScore = (excellentCount * 4 + goodCount * 3 + mediumCount * 2 + weakCount * 1) / (metrics.length * 4) * 100;

        return {
            score: healthScore,
            level: healthScore > 75 ? 'ممتاز' : healthScore > 60 ? 'جيد' : healthScore > 40 ? 'متوسط' : 'ضعيف',
            color: healthScore > 75 ? 'text-emerald-600' : healthScore > 60 ? 'text-blue-600' : healthScore > 40 ? 'text-amber-600' : 'text-red-600',
            bgColor: healthScore > 75 ? 'bg-emerald-100' : healthScore > 60 ? 'bg-blue-100' : healthScore > 40 ? 'bg-amber-100' : 'bg-red-100'
        };
    }, [didacticGap, criticalFailureRate, sustainableLearningIndex, textTypeAnalysis]);

    // --- LOGIC: GENERATE DEFAULT ANALYSIS ---
    const getDefaultAnalysis = (section: AnalysisSection): AnalysisContent => {
        switch (section) {
            case 'gap':
                const gapSize = didacticGap.gap;
                return {
                    reading: `الفجوة الديداكتيكية تبلغ ${Math.abs(gapSize).toFixed(1)}%. ${gapSize > 0 ? 'النحو النظري' : 'التطبيق العملي'} يتفوق بـ ${Math.abs(gapSize).toFixed(1)}%.`,
                    diagnosis: gapSize > 15 
                        ? "انفصال وظيفي: التلميذ ينجح في تمارين 'الإعراب والتحويل' المعزولة، لكنه يرتكب نفس الأخطاء عندما يكتب بحرية." 
                        : gapSize > 8
                        ? "توازن مقبول مع هامش تحسين"
                        : "تكامل جيد: القواعد النحوية تُدرس وظيفياً، والتلميذ يستحضر القاعدة أثناء الكتابة.",
                    recommendation: gapSize > 15 
                        ? "الابتعاد عن إعراب الكلمات المعزولة، والتركيز على 'الإنتاج الموجه' الذي يفرض استخدام الظاهرة النحوية."
                        : "تعزيز الربط بين الدروس النحوية والأنشطة الكتابية التطبيقية."
                };
            
            case 'funnel':
                const start = funnelData[1].count;
                const end = funnelData[3].count;
                const dropRate = start > 0 ? ((start - end) / start * 100).toFixed(0) : '0';
                return {
                    reading: `نسبة التسرب المعرفي ${dropRate}%. ${funnelData[3].count} تلميذاً فقط وصلوا لمرحلة 'إبداء الرأي' من أصل ${start}.`,
                    diagnosis: "التعليم يركز على 'الحفظ والاسترجاع' (المستوى الأدنى)، ويهمل مهارات التفكير العليا (التحليل، التبرير، الرأي).",
                    recommendation: "تفعيل الوضعيات التي تتطلب 'تبرير الإجابة' و 'الدفاع عن الرأي' شفوياً وكتابياً."
                };
            
            case 'textType':
                const isLagging = textTypeAnalysis.complexPct < textTypeAnalysis.basicPct - 20;
                return {
                    reading: `التحكم في المهارات القاعدية ${textTypeAnalysis.basicPct.toFixed(1)}% مقابل ${textTypeAnalysis.complexPct.toFixed(1)}% في المهارات العليا (فارق ${textTypeAnalysis.gap.toFixed(1)}%).`,
                    diagnosis: isLagging 
                        ? "صعوبة في التعامل مع الأسئلة المركبة (لماذا؟ كيف؟ ما رأيك؟). التلميذ يبحث عن الجواب الجاهز في النص." 
                        : "مؤشر إيجابي يدل على قدرة التلاميذ على الغوص في عمق النص.",
                    recommendation: "تدريب التلاميذ على صياغة الإجابة الشخصية بدلاً من النسخ الحرفي من النص."
                };
            
            case 'radar':
                const weakDomain = radarData.reduce((prev, curr) => prev.A < curr.A ? prev : curr);
                const strongDomain = radarData.reduce((prev, curr) => prev.A > curr.A ? prev : curr);
                return {
                    reading: `خريطة الكفاءات تظهر تبايناً بين ${weakDomain.subject} (${weakDomain.A.toFixed(1)}%) و ${strongDomain.subject} (${strongDomain.A.toFixed(1)}%).`,
                    diagnosis: `الميدان الأضعف "${weakDomain.subject}" يحتاج إلى تدخل عاجل.`,
                    recommendation: `تخصيص حصص المعالجة القادمة لدعم معايير "${weakDomain.subject}" بشكل حصري.`
                };
            
            case 'illiteracy':
                return {
                    reading: `مؤشر الهشاشة ${criticalFailureRate.percentage.toFixed(1)}% (${criticalFailureRate.count} تلميذ).`,
                    diagnosis: criticalFailureRate.percentage > 15 
                        ? "نسبة حرجة تدل على فشل النظام في تعليم المهارات الأساسية لشريحة من التلاميذ."
                        : "المؤشر ضمن الحدود المقبولة لكنه يحتاج للمتابعة.",
                    recommendation: criticalFailureRate.percentage > 15 
                        ? "برنامج علاجي مكثف فردي للطلاب المعرضين للخطر."
                        : "تعزيز برامج الدعم للتلاميذ الضعاف."
                };
            
            case 'patterns':
                const dominantPattern = Object.entries({
                    'لفظي': learningPatterns.verbalDominant,
                    'كتابي': learningPatterns.writtenDominant,
                    'متوازن': learningPatterns.balanced,
                    'تحليلي': learningPatterns.comprehensionFocused
                }).reduce((a, b) => a[1] > b[1] ? a : b)[0];
                
                return {
                    reading: `النمط السائد هو '${dominantPattern}' بنسبة ${((learningPatterns[dominantPattern === 'لفظي' ? 'verbalDominant' : 
                        dominantPattern === 'كتابي' ? 'writtenDominant' : 
                        dominantPattern === 'متوازن' ? 'balanced' : 'comprehensionFocused'] / totalStudents) * 100).toFixed(0)}%.`,
                    diagnosis: dominantPattern === 'متوازن' 
                        ? "بيئة تعليمية متنوعة تلبي مختلف أنماط التعلم."
                        : "الحاجة إلى تنويع استراتيجيات التدريس لملاءمة جميع الأنماط.",
                    recommendation: "تصميم أنشطة متنوعة تشمل الجوانب الشفوية والكتابية والتحليلية."
                };
            
            case 'sustainability':
                return {
                    reading: `مؤشر التعلم المستدام ${sustainableLearningIndex.percentage.toFixed(1)}% (${sustainableLearningIndex.count} تلميذ).`,
                    diagnosis: sustainableLearningIndex.level === 'ضعيف'
                        ? "ضعف في ترسيخ المهارات الأساسية لدى شريحة واسعة من التلاميذ."
                        : "قدرة جيدة على بناء تعلم مستدام.",
                    recommendation: sustainableLearningIndex.level === 'ضعيف'
                        ? "إعادة هيكلة المنهج لضمان تراكمية المهارات."
                        : "تعزيز الربط بين المهارات الأساسية والمتقدمة."
                };
            
            default:
                return { reading: '', diagnosis: '', recommendation: '' };
        }
    };

    const getAnalysis = (section: AnalysisSection) => {
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

    const LevelBadge = ({ level, text = '' }: { level: CompetencyLevel, text?: string }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(level)} text-white`}>
            {text || level}
        </span>
    );

    // FIX: HealthIndicator component now integrated, removed fixed positioning
    const HealthIndicator = () => (
        <div className={`flex items-center gap-2 ${performanceHealth.bgColor} px-4 py-2 rounded-full shadow-lg border border-white/20 backdrop-blur-sm`}>
            <Heart size={18} className={performanceHealth.color} />
            <span className={`font-bold ${performanceHealth.color} text-xs md:text-sm`}>
                صحة النظام: {performanceHealth.level}
            </span>
            <div className="w-12 md:w-16 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${performanceHealth.color.replace('text-', 'bg-')} rounded-full`}
                    style={{ width: `${performanceHealth.score}%` }}
                ></div>
            </div>
        </div>
    );

    const ControlLevelsLegend = () => (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {Object.entries(CONTROL_LEVELS).map(([key, level]) => (
                <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }}></div>
                    <span className="text-xs md:text-sm font-medium text-slate-600">{level.label}</span>
                    <span className="text-[10px] text-slate-400">({key})</span>
                </div>
            ))}
        </div>
    );

    // --- RENDER EXPANDED VIEW ---
    const renderExpandedView = () => {
        if (!expandedSection) return null;

        const activeAnalysis = getAnalysis(expandedSection);
        const def = METRIC_DEFINITIONS[expandedSection];

        let content = null;
        
        switch (expandedSection) {
            case 'gap':
                content = (
                    <div className="w-full max-w-lg space-y-8 py-10">
                        <div className="relative group">
                            <div className="flex justify-between text-lg font-bold mb-2 text-slate-300">
                                <span className="flex items-center gap-2"><BookOpen size={24}/> فهم العلاقات التركيبية</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-indigo-400 text-2xl">{didacticGap.rPct.toFixed(1)}%</span>
                                    <LevelBadge level={didacticGap.rLevel} />
                                </div>
                            </div>
                            <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                                        style={{ width: `${didacticGap.rPct}%` }}>
                                </div>
                            </div>
                            <p className="text-slate-400 mt-1 text-xs">{CONTROL_LEVELS.A.description}</p>
                        </div>
                        
                        <div className="relative group">
                            <div className="flex justify-between text-lg font-bold mb-2 text-slate-300">
                                <span className="flex items-center gap-2"><PenTool size={24}/> الالتزام بالقواعد (تطبيقي)</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-2xl">{didacticGap.cPct.toFixed(1)}%</span>
                                    <LevelBadge level={didacticGap.cLevel} />
                                </div>
                            </div>
                            <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(245,158,11,0.5)]" 
                                        style={{ width: `${didacticGap.cPct}%` }}>
                                </div>
                            </div>
                            <p className="text-slate-400 mt-1 text-xs">{CONTROL_LEVELS.B.description}</p>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-slate-700">
                            <div className="text-center">
                                <div className={`text-3xl font-bold mb-2 ${didacticGap.gap > 0 ? 'text-indigo-400' : 'text-amber-400'}`}>
                                    {Math.abs(didacticGap.gap).toFixed(1)}%
                                </div>
                                <div className="text-sm text-slate-400">
                                    {didacticGap.gap > 0 ? 'تفوق النحو النظري' : 'تفوق التطبيق العملي'}
                                </div>
                                <div className={`mt-2 px-4 py-1 rounded-full inline-block text-sm font-bold ${
                                    didacticGap.gapSeverity === 'عالية' ? 'bg-red-500/20 text-red-400' :
                                    didacticGap.gapSeverity === 'متوسطة' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                    {didacticGap.gapSeverity === 'عالية' ? 'فجوة حرجة' : 
                                        didacticGap.gapSeverity === 'متوسطة' ? 'فجوة متوسطة' : 'توازن جيد'}
                                </div>
                            </div>
                        </div>
                    </div>
                );
                break;
            
            case 'funnel':
                content = (
                    <div className="w-full max-w-2xl space-y-3 py-10">
                        {funnelData.map((stage, i) => {
                            const prevCount = i > 0 ? funnelData[i-1].count : totalStudents;
                            const retentionRate = prevCount > 0 ? (stage.count / prevCount) * 100 : 0;
                            
                            return (
                                <div key={i} className="flex items-center gap-4 animate-in slide-in-from-left-4" 
                                        style={{ animationDelay: `${i*100}ms` }}>
                                    <div className="w-40 text-right font-bold text-slate-400 text-sm">
                                        <div>{stage.label}</div>
                                        <div className="text-xs text-slate-500">{stage.desc}</div>
                                    </div>
                                    <div className="flex-1 bg-slate-800/50 rounded-r-lg h-16 relative overflow-hidden flex items-center shadow-lg border border-slate-700">
                                        <div 
                                            className={`h-full ${stage.color.replace('bg-', 'bg-gradient-to-r from-').replace('300', '500').replace('400', '600')} flex items-center justify-end px-4 transition-all duration-1000 absolute left-0 top-0 opacity-80`} 
                                            style={{ width: `${stage.percentage}%` }}
                                        ></div>
                                        <div className="relative z-10 px-4 w-full flex justify-between items-center">
                                            <div>
                                                <span className="text-white font-bold text-2xl">{stage.count}</span>
                                                <span className="text-slate-300 text-sm mr-2">تلميذ</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-bold text-lg">{stage.percentage.toFixed(1)}%</div>
                                                {i > 0 && (
                                                    <div className="text-xs text-slate-400">
                                                        احتفاظ: {retentionRate.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700 max-w-2xl">
                            <h4 className="text-lg font-bold text-white mb-3">تحليل التسرب المعرفي</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                                    <div className="text-3xl font-bold text-red-400">
                                        {totalStudents - funnelData[3].count}
                                    </div>
                                    <div className="text-sm text-slate-300">لم يصلوا للتفكير النقدي</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-400">
                                        {funnelData[0].count > 0 ? 
                                            ((funnelData[0].count - funnelData[3].count) / funnelData[0].count * 100).toFixed(1) : 0}%
                                    </div>
                                    <div className="text-sm text-slate-300">نسبة التسرب الكلي</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                break;

            case 'textType':
                content = (
                    <div className="w-full flex flex-col items-center py-10">
                        <div className="flex items-end gap-8 md:gap-16 h-80 w-full max-w-2xl justify-center">
                            <div className="flex flex-col items-center gap-3 group w-1/3">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold text-blue-400">{textTypeAnalysis.complexPct.toFixed(0)}%</span>
                                    <LevelBadge level={textTypeAnalysis.complexLevel} />
                                </div>
                                <div className="w-full bg-slate-700 rounded-t-2xl relative overflow-hidden border-x border-t border-slate-600 shadow-2xl h-56">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-1000" 
                                         style={{ height: `${textTypeAnalysis.complexPct}%` }}>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-blue-300 block mb-0.5">مهارات عليا</span>
                                    <span className="text-xs text-slate-400">تفسير، تبرير، ورأي</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3 group w-1/3">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold text-slate-300">{textTypeAnalysis.basicPct.toFixed(0)}%</span>
                                    <LevelBadge level={textTypeAnalysis.basicLevel} />
                                </div>
                                <div className="w-full bg-slate-700 rounded-t-2xl relative overflow-hidden border-x border-t border-slate-600 shadow-2xl h-56">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-500 to-slate-400 transition-all duration-1000" 
                                         style={{ height: `${textTypeAnalysis.basicPct}%` }}>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <span className="text-lg font-bold text-slate-300 block mb-0.5">مهارات دنيا</span>
                                    <span className="text-xs text-slate-500">استخراج معلومات صريحة</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <div className={`px-6 py-3 rounded-xl backdrop-blur-sm border inline-block ${
                                textTypeAnalysis.gap > 30 ? 'bg-red-500/20 border-red-500/30' :
                                textTypeAnalysis.gap > 15 ? 'bg-yellow-500/20 border-yellow-500/30' :
                                'bg-emerald-500/20 border-emerald-500/30'
                            }`}>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                        {textTypeAnalysis.gap.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        {textTypeAnalysis.gap > 0 ? 'تفوق المهارات الأساسية' : 'تفوق المهارات العليا'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                break;

            case 'radar':
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
                
                content = (
                    <div className="w-full flex items-center justify-center py-10">
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
                                            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" 
                                                  className="text-[8px] font-bold fill-slate-300 uppercase tracking-widest">
                                                {d.subject}
                                            </text>
                                            <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="middle" 
                                                  className="text-[10px] font-bold fill-purple-400">
                                                {d.A.toFixed(0)}%
                                            </text>
                                            <text x={x} y={y + 16} textAnchor="middle" dominantBaseline="middle" 
                                                  className="text-[8px] fill-slate-400">
                                                {d.level}
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
                const isCritical = criticalFailureRate.percentage > 15;
                content = (
                    <div className="w-full flex flex-col items-center justify-center text-center py-10">
                        <div className={`relative w-72 h-72 flex items-center justify-center rounded-full border-[12px] ${
                            isCritical ? 'border-red-500/30' : 'border-emerald-500/30'
                        } bg-slate-800`}>
                            <div className={`absolute inset-0 rounded-full animate-pulse opacity-10 ${
                                isCritical ? 'bg-red-500' : 'bg-emerald-500'
                            }`}></div>
                            <div>
                                <span className={`text-7xl font-bold block ${
                                    isCritical ? 'text-red-500' : 'text-emerald-500'
                                }`}>
                                    {criticalFailureRate.percentage.toFixed(1)}%
                                </span>
                                <span className="text-slate-400 text-lg uppercase tracking-widest mt-2 block">مؤشر الهشاشة</span>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold text-white">
                                        {criticalFailureRate.count}
                                    </span>
                                    <span className="text-slate-400 mr-2">تلميذ معرض</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl">
                            <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl font-bold text-amber-400">
                                    {allStudents.filter(s => getGrade(s, 'reading_perf', 1) === 'D').length}
                                </div>
                                <div className="text-sm text-slate-300">ضعف في القراءة</div>
                            </div>
                            <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl font-bold text-amber-400">
                                    {allStudents.filter(s => getGrade(s, 'written_prod', 3) === 'D').length}
                                </div>
                                <div className="text-sm text-slate-300">ضعف في الكتابة</div>
                            </div>
                            <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                                <div className={`text-2xl font-bold ${
                                    criticalFailureRate.level === 'حرج' ? 'text-red-400' :
                                    criticalFailureRate.level === 'مرتفع' ? 'text-yellow-400' : 'text-emerald-400'
                                }`}>
                                    {criticalFailureRate.level}
                                </div>
                                <div className="text-sm text-slate-300">مستوى الخطر</div>
                            </div>
                        </div>
                    </div>
                );
                break;
            
            case 'patterns':
                const patternData = [
                    { label: 'متوازن', value: learningPatterns.balanced, color: 'bg-emerald-500' },
                    { label: 'لفظي', value: learningPatterns.verbalDominant, color: 'bg-blue-500' },
                    { label: 'كتابي', value: learningPatterns.writtenDominant, color: 'bg-purple-500' },
                    { label: 'تحليلي', value: learningPatterns.comprehensionFocused, color: 'bg-amber-500' },
                    { label: 'صعوبات إنتاج', value: learningPatterns.productionChallenged, color: 'bg-red-500' },
                ];
                
                content = (
                    <div className="w-full max-w-2xl py-10">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            {patternData.map((pattern, i) => (
                                <div key={i} className="text-center p-4 bg-slate-800/50 rounded-xl">
                                    <div className={`w-12 h-12 rounded-full ${pattern.color} flex items-center justify-center mx-auto mb-2`}>
                                        <span className="text-white font-bold">
                                            {((pattern.value / totalStudents) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-lg font-bold text-white mb-1">{pattern.label}</div>
                                    <div className="text-sm text-slate-300">{pattern.value} تلميذ</div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-xl p-6">
                            <h4 className="text-lg font-bold text-white mb-4">توصيات حسب الأنماط</h4>
                            <div className="space-y-3">
                                {learningPatterns.verbalDominant > learningPatterns.total * 0.3 && (
                                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
                                        <Lightbulb size={20} className="text-blue-400 mt-1" />
                                        <div>
                                            <div className="font-bold text-blue-300">الأنماط اللفظية</div>
                                            <div className="text-sm text-slate-300">تحويل المهارات الشفوية إلى كتابية عبر أنشطة تسجيل وتحويل</div>
                                        </div>
                                    </div>
                                )}
                                
                                {learningPatterns.productionChallenged > 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg">
                                        <AlertTriangle size={20} className="text-red-400 mt-1" />
                                        <div>
                                            <div className="font-bold text-red-300">صعوبات الإنتاج</div>
                                            <div className="text-sm text-slate-300">برنامج تدريبي مكثف للكتابة مع استخدام القوالب والنماذج</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
                break;
            
            case 'sustainability':
                content = (
                    <div className="w-full flex flex-col items-center justify-center py-10">
                        <div className="relative w-64 h-64 mb-8">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="2" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="1" />
                                
                                {/* Sustainable learners arc */}
                                <path
                                    d="M50,5 A45,45 0 1,1 50,95 A45,45 0 1,1 50,5"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${sustainableLearningIndex.percentage * 2.83} 283`}
                                    transform="rotate(-90 50 50)"
                                />
                                
                                {/* At risk arc */}
                                <path
                                    d="M50,5 A45,45 0 1,1 50,95 A45,45 0 1,1 50,5"
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(100 - sustainableLearningIndex.percentage) * 2.83} 283`}
                                    strokeDashoffset={`${-sustainableLearningIndex.percentage * 2.83}`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-white">
                                    {sustainableLearningIndex.percentage.toFixed(1)}%
                                </span>
                                <span className="text-slate-300 text-sm">تعلم مستدام</span>
                                <span className="text-slate-400 text-xs mt-1">{sustainableLearningIndex.level}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 max-w-xl">
                            <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <div className="text-2xl font-bold text-emerald-600">
                                    {sustainableLearningIndex.count}
                                </div>
                                <div className="text-sm text-slate-600">متعلم مستدام</div>
                                <div className="text-xs text-emerald-300 mt-1">يحقق المهارات الأساسية</div>
                            </div>
                            
                            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                <div className="text-2xl font-bold text-red-400">
                                    {sustainableLearningIndex.atRisk}
                                </div>
                                <div className="text-sm text-slate-300">معرض للخطر</div>
                                <div className="text-xs text-red-300 mt-1">يحتاج تدخلاً عاجلاً</div>
                            </div>
                        </div>
                    </div>
                );
                break;
        }

        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col md:flex-row animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Close Button */}
                <button 
                    onClick={() => setExpandedSection(null)}
                    className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full z-50 text-white transition-all"
                >
                    <Minimize2 size={24} />
                </button>

                {/* Left Panel: Analysis (Scrollable) */}
                <div className="w-full md:w-[400px] lg:w-[35%] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl relative z-40 order-2 md:order-1 h-full">
                    {/* Fixed Header */}
                    <div className="p-8 pb-6 border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                                {React.isValidElement(def.icon) ? React.cloneElement(def.icon as React.ReactElement<any>, { size: 24 }) : null}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white font-serif">{def.title}</h2>
                                <p className="text-slate-400 text-sm">تحليل معمق للكفاءات الختامية</p>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                        <div className="space-y-8">
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
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-slate-400 mb-2">مستويات التحكم:</h4>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {Object.entries(CONTROL_LEVELS).map(([key, level]) => (
                                        <div key={key} className="flex items-center gap-1 text-xs">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }}></div>
                                            <span className="text-slate-300">{level.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center">نظام المفتش التربوي الذكي © 2025</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Chart (Scrollable) */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col relative order-1 md:order-2 h-full overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
                                  backgroundSize: '40px 40px' }}>
                    </div>
                    
                    {/* Definition Card (Fixed or part of flow? Part of flow is safer for scrolling) */}
                    {/* Wrapper for scrolling content */}
                    <div className="flex-1 overflow-y-auto p-8 w-full custom-scrollbar z-10">
                        <div className="min-h-full flex flex-col items-center justify-center gap-8">
                            
                            {/* Definition Card */}
                            <div className="w-full max-w-3xl shrink-0">
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
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 flex items-center gap-1">
                                                <Ruler size={10}/> المرجعية الحسابية
                                            </h4>
                                            <p className="text-[10px] text-slate-400 leading-relaxed font-mono opacity-80">
                                                {def.method}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Content */}
                            <div className="w-full flex justify-center">
                                {content}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Edit Analysis Modal
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

    // Generate smart recommendations
    const generateRecommendations = () => {
        const recs = [];
        
        if (didacticGap.gapSeverity === 'عالية') {
            recs.push({
                priority: 'عالية',
                title: 'سد الفجوة الديداكتيكية',
                action: 'تطبيق استراتيجية "الكتابة الموجهة بالنحو"',
                icon: <Scale size={16} />
            });
        }
        
        if (criticalFailureRate.level === 'حرج') {
            recs.push({
                priority: 'حرجة',
                title: 'معالجة الهشاشة القاعدية',
                action: 'برنامج علاجي مكثف للمهارات الأساسية',
                icon: <AlertOctagon size={16} />
            });
        }
        
        if (sustainableLearningIndex.level === 'ضعيف') {
            recs.push({
                priority: 'عالية',
                title: 'تعزيز التعلم المستدام',
                action: 'إعادة هيكلة المنهج لضمان تراكمية المهارات',
                icon: <Shield size={16} />
            });
        }
        
        if (textTypeAnalysis.gap > 30) {
            recs.push({
                priority: 'متوسطة',
                title: 'تنمية التفكير العالي',
                action: 'تفعيل حصص النقاش الموجه والتفكير النقدي',
                icon: <BrainCircuit size={16} />
            });
        }
        
        return recs;
    };

    const recommendations = generateRecommendations();

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
                    <Brain size={300} />
                </div>
                
                {/* Embedded Health Indicator */}
                <div className="absolute top-6 left-6 z-20">
                    <HealthIndicator />
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
                </div>
                
                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-slate-300 mb-1">متوسط الأداء</div>
                        <div className="text-2xl font-bold text-white">
                            {radarData.reduce((sum, d) => sum + d.A, 0) / radarData.length > 0 
                                ? (radarData.reduce((sum, d) => sum + d.A, 0) / radarData.length).toFixed(1) 
                                : '0'}%
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-slate-300 mb-1">أعلى كفاءة</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {radarData.reduce((prev, curr) => prev.A > curr.A ? prev : curr).subject}
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-slate-300 mb-1">أدنى كفاءة</div>
                        <div className="text-2xl font-bold text-amber-400">
                            {radarData.reduce((prev, curr) => prev.A < curr.A ? prev : curr).subject}
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-slate-300 mb-1">التعلم المستدام</div>
                        <div className="text-2xl font-bold text-blue-400">
                            {sustainableLearningIndex.percentage.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Levels Legend */}
            <ControlLevelsLegend />

            {/* Recommendations Bar (NEW) */}
            {recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <TargetIcon size={20} className="text-amber-600"/>
                        توصيات أولوية النظام
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recommendations.map((rec, index) => (
                            <div key={index} className={`p-4 rounded-xl border ${
                                rec.priority === 'حرجة' ? 'bg-red-50 border-red-200' :
                                rec.priority === 'عالية' ? 'bg-amber-50 border-amber-200' :
                                'bg-blue-50 border-blue-200'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                                        rec.priority === 'حرجة' ? 'bg-red-100 text-red-800' :
                                        rec.priority === 'عالية' ? 'bg-amber-100 text-amber-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        أولوية {rec.priority}
                                    </div>
                                    {rec.icon}
                                </div>
                                <h4 className="font-bold text-slate-800 mb-1">{rec.title}</h4>
                                <p className="text-sm text-slate-600">{rec.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. THE DIDACTIC GAP */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 relative group hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => setExpandedSection('gap')}
                >
                    <ExpandBtn section="gap" />
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Scale className="text-indigo-600" size={20}/>
                                الفجوة الديداكتيكية (النحو vs التطبيق)
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">قياس الفرق بين الفهم النظري والتطبيق العملي</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            didacticGap.gapSeverity === 'عالية' ? 'bg-red-100 text-red-600' :
                            didacticGap.gapSeverity === 'متوسطة' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                            {didacticGap.gapSeverity === 'عالية' ? 'فجوة حرجة' : 
                             didacticGap.gapSeverity === 'متوسطة' ? 'فجوة متوسطة' : 'توازن جيد'}
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {/* Resource Bar */}
                        <div className="relative pt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-600 flex items-center gap-2 text-sm font-bold">
                                    <BookOpen size={16}/> فهم العلاقات التركيبية
                                    <LevelBadge level={didacticGap.rLevel} />
                                </span>
                                <span className="text-indigo-600 font-bold">{didacticGap.rPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                                     style={{ width: `${didacticGap.rPct}%` }}>
                                </div>
                            </div>
                        </div>

                        {/* Competency Bar */}
                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-600 flex items-center gap-2 text-sm font-bold">
                                    <PenTool size={16}/> الالتزام بالقواعد (تطبيق)
                                    <LevelBadge level={didacticGap.cLevel} />
                                </span>
                                <span className="text-amber-500 font-bold">{didacticGap.cPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000" 
                                     style={{ width: `${didacticGap.cPct}%` }}>
                                </div>
                            </div>
                        </div>
                        
                        {/* Gap Summary */}
                        <div className="pt-4 border-t border-slate-100">
                            <div className="text-center">
                                <div className={`text-2xl font-bold mb-1 ${
                                    Math.abs(didacticGap.gap) > 15 ? 'text-red-600' :
                                    Math.abs(didacticGap.gap) > 8 ? 'text-yellow-600' : 'text-emerald-600'
                                }`}>
                                    {Math.abs(didacticGap.gap).toFixed(1)}% فارق
                                </div>
                                <div className="text-sm text-slate-500">
                                    {didacticGap.gap > 0 ? 'تفوق النحو النظري' : 'تفوق التطبيق العملي'}
                                </div>
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
                    
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg relative z-10 ${
                        criticalFailureRate.level === 'حرج' ? 'bg-red-100 text-red-600' :
                        criticalFailureRate.level === 'مرتفع' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-emerald-100 text-emerald-600'
                    }`}>
                        <AlertOctagon size={40} />
                    </div>
                    
                    <h3 className="font-bold text-2xl text-slate-800 mb-1 relative z-10">
                        {criticalFailureRate.percentage.toFixed(1)}%
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10">
                        مؤشر الهشاشة
                    </p>
                    
                    <div className="mb-4 relative z-10">
                        <div className="text-sm font-bold text-slate-600">
                            {criticalFailureRate.count} تلميذ معرض
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed px-4 relative z-10">
                        {criticalFailureRate.level === 'حرج' 
                            ? "نسبة حرجة تحتاج تدخل عاجل" 
                            : criticalFailureRate.level === 'مرتفع'
                            ? "نسبة مرتفعة تحتاج متابعة"
                            : "المؤشر ضمن الحدود المقبولة"}
                    </p>
                </div>
            </div>

            {/* 3. LEARNING FUNNEL (Hierarchy) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative group cursor-pointer hover:shadow-md transition-shadow overflow-hidden" 
                 onClick={() => setExpandedSection('funnel')}>
                <ExpandBtn section="funnel" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Filter size={20} className="text-pink-500"/>
                            قمع النجاح (التسرب المعرفي)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">تتبع مسار التعلم من الأساسيات إلى التفكير النقدي</p>
                    </div>
                    <div className="text-sm font-bold text-slate-600">
                        {totalStudents - funnelData[3].count} تلميذ تسربوا
                    </div>
                </div>

                <div className="space-y-2 relative z-10">
                    {funnelData.map((stage, i) => {
                        const width = totalStudents > 0 ? (stage.count / totalStudents) * 100 : 0;
                        const prevCount = i > 0 ? funnelData[i-1].count : totalStudents;
                        const retentionRate = prevCount > 0 ? (stage.count / prevCount) * 100 : 0;
                        
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-28 text-left font-bold text-slate-500 text-sm">
                                    <div>{stage.label}</div>
                                    <div className="text-xs text-slate-400">{stage.percentage.toFixed(1)}%</div>
                                </div>
                                <div className="flex-1 bg-slate-100 rounded-r-lg h-10 relative overflow-hidden">
                                    <div 
                                        className={`h-full ${stage.color.replace('bg-', 'bg-gradient-to-r from-').replace('300', '500').replace('400', '600')} flex items-center justify-between px-4 transition-all duration-1000 absolute left-0 top-0`} 
                                        style={{ width: `${width}%` }}
                                    >
                                        <span className={stage.text + " font-bold"}>{stage.count}</span>
                                        {i > 0 && (
                                            <span className="text-xs bg-white/30 px-2 py-1 rounded">
                                                {retentionRate.toFixed(0)}%
                                            </span>
                                        )}
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
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-1 group hover:shadow-md transition-shadow relative cursor-pointer overflow-hidden"
                    onClick={() => setExpandedSection('radar')}
                >
                    <ExpandBtn section="radar" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                        <Activity size={20} className="text-purple-600"/>
                        توازن الكفاءات الأربع
                    </h3>
                    
                    <div className="flex justify-center py-4 relative z-10">
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
                                
                                {/* Radar shape */}
                                <polygon 
                                    points={radarData.map((point, i) => {
                                        const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                        const val = point.A / 100;
                                        const x = 100 + 80 * val * Math.cos(angle);
                                        const y = 100 + 80 * val * Math.sin(angle);
                                        return `${x},${y}`;
                                    }).join(' ')} 
                                    fill="rgba(139, 92, 246, 0.2)" 
                                    stroke="#8b5cf6" 
                                    strokeWidth="2"
                                />
                                
                                {/* Points */}
                                {radarData.map((d, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const val = d.A / 100;
                                    const x = 100 + 80 * val * Math.cos(angle);
                                    const y = 100 + 80 * val * Math.sin(angle);
                                    
                                    return (
                                        <g key={i}>
                                            <circle cx={x} cy={y} r="4" fill="#8b5cf6" />
                                            <text x={x} y={y - 8} textAnchor="middle" className="text-xs font-bold fill-purple-600">
                                                {d.A.toFixed(0)}%
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
                        {radarData.map((d, i) => (
                            <div key={i} className="text-center p-2 bg-slate-50 rounded-lg">
                                <div className="text-sm font-bold text-slate-700">{d.subject}</div>
                                <div className="text-lg font-bold text-purple-600">{d.A.toFixed(1)}%</div>
                                <div className="text-xs text-slate-500">{d.level}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. TEXT TYPES ANALYSIS */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 group hover:shadow-md transition-shadow relative cursor-pointer overflow-hidden"
                    onClick={() => setExpandedSection('textType')}
                >
                    <ExpandBtn section="textType" />
                    <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2 relative z-10">
                        <BrainCircuit size={20} className="text-blue-500"/>
                        مهارات التفكير العليا والدنيا
                    </h3>
                    <p className="text-xs text-slate-400 mb-8 relative z-10">قياس قدرة الانتقال من الاسترجاع إلى التحليل</p>

                    <div className="flex flex-col gap-6 relative z-10">
                        <div className="flex items-center gap-4 p-2 rounded hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                <Brain size={24}/>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div>
                                        <span className="font-bold text-slate-700 text-sm">مهارات عليا (تفسير/رأي)</span>
                                        <LevelBadge level={textTypeAnalysis.complexLevel} />
                                    </div>
                                    <span className="font-bold text-blue-600">{textTypeAnalysis.complexPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" 
                                         style={{ width: `${textTypeAnalysis.complexPct}%` }}>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-2 rounded hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                <CheckCircle2 size={24}/>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div>
                                        <span className="font-bold text-slate-700 text-sm">مهارات دنيا (معلومة صريحة)</span>
                                        <LevelBadge level={textTypeAnalysis.basicLevel} />
                                    </div>
                                    <span className="font-bold text-slate-600">{textTypeAnalysis.basicPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-slate-400 to-slate-500" 
                                         style={{ width: `${textTypeAnalysis.basicPct}%` }}>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
                        <div className="text-center">
                            <div className={`text-xl font-bold mb-1 ${
                                textTypeAnalysis.gap > 30 ? 'text-red-600' :
                                textTypeAnalysis.gap > 15 ? 'text-yellow-600' : 'text-emerald-600'
                            }`}>
                                فارق {textTypeAnalysis.gap.toFixed(1)}%
                            </div>
                            <div className="text-sm text-slate-500">
                                {textTypeAnalysis.gap > 0 ? 'تفوق المهارات الأساسية' : 'تفوق المهارات العليا'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW ANALYSIS SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 6. LEARNING PATTERNS */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 group hover:shadow-md transition-shadow relative cursor-pointer overflow-hidden"
                    onClick={() => setExpandedSection('patterns')}
                >
                    <ExpandBtn section="patterns" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                        <GitBranch size={20} className="text-green-600"/>
                        أنماط التعلم السائدة
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        {[
                            { label: 'متوازن', value: learningPatterns.balanced, color: 'bg-emerald-500' },
                            { label: 'لفظي', value: learningPatterns.verbalDominant, color: 'bg-blue-500' },
                            { label: 'كتابي', value: learningPatterns.writtenDominant, color: 'bg-purple-500' },
                            { label: 'تحليلي', value: learningPatterns.comprehensionFocused, color: 'bg-amber-500' },
                            { label: 'صعوبات إنتاج', value: learningPatterns.productionChallenged, color: 'bg-red-500' },
                        ].map((pattern, i) => {
                            const percentage = totalStudents > 0 ? (pattern.value / totalStudents) * 100 : 0;
                            
                            return (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${pattern.color}`}></div>
                                        <span className="font-medium text-slate-700">{pattern.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${pattern.color}`} 
                                                 style={{ width: `${percentage}%` }}>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">
                                            {pattern.value} <span className="text-slate-400 text-xs">({percentage.toFixed(0)}%)</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl relative z-10">
                        <div className="text-sm text-slate-600">
                            <span className="font-bold text-slate-800">النمط السائد: </span>
                            {learningPatterns.balanced > learningPatterns.total * 0.4 
                                ? 'متوازن - بيئة تعليمية متنوعة' 
                                : 'حاجة لتنويع استراتيجيات التدريس'}
                        </div>
                    </div>
                </div>

                {/* 7. SUSTAINABLE LEARNING */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 group hover:shadow-md transition-shadow relative cursor-pointer overflow-hidden"
                    onClick={() => setExpandedSection('sustainability')}
                >
                    <ExpandBtn section="sustainability" />
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                        <Shield size={20} className="text-teal-600"/>
                        مؤشر التعلم المستدام
                    </h3>
                    
                    <div className="flex items-center justify-center mb-6 relative z-10">
                        <div className="relative w-48 h-48">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-teal-600">
                                        {sustainableLearningIndex.percentage.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">تعلم مستدام</div>
                                    <div className="text-xs text-slate-400 mt-1">{sustainableLearningIndex.level}</div>
                                </div>
                            </div>
                            
                            {/* Progress circle */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="88" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                <circle cx="96" cy="96" r="88" fill="none" stroke="#10b981" strokeWidth="12" 
                                        strokeLinecap="round"
                                        strokeDasharray={`${sustainableLearningIndex.percentage * 5.53} 553`} />
                            </svg>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="text-2xl font-bold text-emerald-600">
                                {sustainableLearningIndex.count}
                            </div>
                            <div className="text-sm text-slate-600">متعلم مستدام</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                                {sustainableLearningIndex.atRisk}
                            </div>
                            <div className="text-sm text-slate-600">معرض للخطر</div>
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
                            <button onClick={() => setIsEditMode(false)} className="text-slate-400 hover:text-red-500">
                                <X/>
                            </button>
                        </div>
                        
                        {!editingSection ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(METRIC_DEFINITIONS).map(([key, def]) => (
                                    <button 
                                        key={key}
                                        onClick={() => setEditingSection(key as AnalysisSection)}
                                        className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg text-slate-600">
                                                {React.cloneElement(def.icon as React.ReactElement<any>, { size: 20 })}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-slate-700 block group-hover:text-indigo-700 text-sm">
                                                    {def.title.split('(')[0].trim()}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-indigo-500"/>
                                    </button>
                                ))}
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
                <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                    {getTitle()}
                </span>
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
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">
                        إلغاء
                    </button>
                    <button onClick={() => onSave(formData)} 
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2">
                        <Save size={16}/> حفظ التعديلات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcqYear5ArabicStats;