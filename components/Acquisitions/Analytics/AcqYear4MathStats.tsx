
import React, { useMemo, useState, useEffect } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR4_MATH_DEF } from '../../../constants/acqYear4Math';
import { 
    BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, 
    School, Scale, Activity, X, Info, HelpCircle, Calculator, BrainCircuit, Microscope, 
    Puzzle, Stethoscope, PenTool, BookOpen, Ruler, Hash, Sigma, Zap, Maximize2, Minimize2, 
    Edit, Save, RotateCcw, ChevronRight
} from 'lucide-react';
import VoiceTextarea from '../../VoiceTextarea';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

// Types for Analysis Structure
type AnalysisSection = 'distribution' | 'homogeneity' | 'matrix';
interface AnalysisContent {
    reading: string;
    diagnosis: string;
    recommendation: string;
}

// Static Definitions for Focus Mode (Specific to Year 4 Math)
const METRIC_DEFINITIONS: Record<AnalysisSection, { title: string, concept: string, method: string }> = {
    distribution: {
        title: "توزيع التحكم (تأشيرة العبور)",
        concept: "مؤشر استشرافي يقيس مدى جاهزية القسم لمناهج السنة الخامسة (الانتقال من التفكير المحسوس إلى المجرد).",
        method: "حساب نسب التلاميذ في كل مستوى (أ، ب، ج، د). نسبة (أ+ب) تمثل الأمان، ونسبة (ج+د) تمثل الهشاشة."
    },
    homogeneity: {
        title: "مؤشر التجانس",
        concept: "مقياس يحدد مدى تقارب أو تباعد مستويات التلاميذ في استيعاب المفاهيم الرياضية التراكمية.",
        method: "حساب الانحراف المعياري (Standard Deviation). (أقل من 15: متجانس / أكثر من 25: مشتت يتطلب التفويج)."
    },
    matrix: {
        title: "مصفوفة (موارد / منهجية)",
        concept: "أداة تشخيصية تقارن بين 'امتلاك الموارد' (الحساب، القواعد) و 'كفاءة حل المشكلات' (المنهجية، الترييض).",
        method: "تصنيف التلاميذ في 4 خانات بناءً على تقاطع معدل 'التحكم في الموارد' ومعدل 'المنهجية'."
    }
};

const AcqYear4MathStats: React.FC<Props> = ({ records, scope, contextName }) => {
    
    // State for Expanded View (Focus Mode)
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    
    // State for Tooltips
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, text: string, title?: string } | null>(null);
    const [hoveredMatrixZone, setHoveredMatrixZone] = useState<string | null>(null);

    // State for Manual Override
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
    const [customAnalysis, setCustomAnalysis] = useState<Record<string, AnalysisContent>>({});

    // State for General Insight Modal
    const [activeInsight, setActiveInsight] = useState<{ title: string; definition: string; pedagogicalRef: string; content: React.ReactNode } | null>(null);

    // State for Individual Student Diagnosis
    const [selectedStudentDiag, setSelectedStudentDiag] = useState<{ 
        studentName: string; 
        profileType: string; 
        diagnosis: string;
        remedy: string;
        scores: { resources: number, solving: number };
        clickedCriterion?: { label: string, advice: string };
    } | null>(null);

    // Load custom analysis
    useEffect(() => {
        const key = `mufattish_analysis_y4_math_${contextName}_${scope}`;
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
        localStorage.setItem(`mufattish_analysis_y4_math_${contextName}_${scope}`, JSON.stringify(newAnalysis));
        setEditingSection(null);
    };

    const handleResetAnalysis = (section: string) => {
        const newAnalysis = { ...customAnalysis };
        delete newAnalysis[section];
        setCustomAnalysis(newAnalysis);
        localStorage.setItem(`mufattish_analysis_y4_math_${contextName}_${scope}`, JSON.stringify(newAnalysis));
    };

    // --- 1. DATA PREPARATION ---
    const allStudents = useMemo(() => {
        return records.flatMap(r => r.students.map(s => ({ 
            ...s, 
            className: r.className, 
            schoolName: r.schoolName 
        })));
    }, [records]);

    const totalStudents = allStudents.length;

    const getGrade = (student: any, compId: string, critId: number) => {
        if (!student.results) return null;
        const comp = student.results[compId];
        if (!comp) return null;
        return comp[critId] || comp[String(critId)];
    };

    // Calculate Scores
    const studentAnalysis = useMemo(() => {
        return allStudents.map(s => {
            let totalPoints = 0, maxPoints = 0;
            let resPoints = 0, resMax = 0; // Comp 1: Resources
            let solvPoints = 0, solvMax = 0; // Comp 2: Methodology

            YEAR4_MATH_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) {
                        const pts = g === 'A' ? 3 : g === 'B' ? 2 : g === 'C' ? 1 : 0;
                        maxPoints += 3;
                        totalPoints += pts;

                        if (comp.id === 'control_resources') {
                            resPoints += pts; resMax += 3;
                        } else {
                            solvPoints += pts; solvMax += 3;
                        }
                    }
                });
            });

            const percent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
            const resPct = resMax > 0 ? (resPoints / resMax) * 100 : 0;
            const solvPct = solvMax > 0 ? (solvPoints / solvMax) * 100 : 0;

            return { ...s, percent, resPct, solvPct };
        });
    }, [allStudents]);

    // Global KPIs
    const globalKPIs = useMemo(() => {
        let controlled = 0, partial = 0, limited = 0;
        studentAnalysis.forEach(s => {
            if (s.percent >= 66) controlled++;
            else if (s.percent >= 33) partial++;
            else limited++;
        });
        return { controlled, partial, limited };
    }, [studentAnalysis]);

    // Homogeneity
    const homogeneityIndex = useMemo(() => {
        if (studentAnalysis.length === 0) return 0;
        const mean = studentAnalysis.reduce((acc, s) => acc + s.percent, 0) / studentAnalysis.length;
        const variance = studentAnalysis.reduce((acc, s) => acc + Math.pow(s.percent - mean, 2), 0) / studentAnalysis.length;
        return Math.sqrt(variance);
    }, [studentAnalysis]);

    // Distribution
    const gradeDistribution = useMemo(() => {
        const counts = { A: 0, B: 0, C: 0, D: 0, total: 0 };
        allStudents.forEach(s => {
            YEAR4_MATH_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) { counts[g]++; counts.total++; }
                });
            });
        });
        if (counts.total === 0) counts.total = 1;
        return counts;
    }, [allStudents]);

    // Matrix (Resources vs Methodology)
    const performanceMatrix = useMemo(() => {
        const counts = { 
            balanced_high: 0, 
            method_gap: 0, 
            knowledge_gap: 0, 
            struggling: 0, 
            total: 0 
        };
        studentAnalysis.forEach(s => {
            const highRes = s.resPct >= 50;
            const highSolv = s.solvPct >= 50;
            
            if (highRes && highSolv) counts.balanced_high++;
            else if (highRes && !highSolv) counts.method_gap++; 
            else if (!highRes && highSolv) counts.knowledge_gap++; 
            else counts.struggling++; 
            
            counts.total++;
        });
        return counts;
    }, [studentAnalysis]);

    // Criterion Heatmap
    const criterionAnalysis = useMemo(() => {
        return YEAR4_MATH_DEF.competencies.flatMap(comp => 
            comp.criteria.map(crit => {
                const stats = { A:0, B:0, C:0, D:0, total:0 };
                allStudents.forEach(s => {
                    const g = getGrade(s, comp.id, crit.id);
                    if(g) { stats[g]++; stats.total++; }
                });
                const successRate = stats.total ? ((stats.A + stats.B) / stats.total) * 100 : 0;
                return { ...crit, compId: comp.id, stats, successRate };
            })
        ).sort((a, b) => a.successRate - b.successRate);
    }, [allStudents]);

    // --- ANALYSIS GENERATION ---

    const getDefaultAnalysis = (section: string): AnalysisContent => {
        if (section === 'distribution') {
            const a = gradeDistribution.A;
            const b = gradeDistribution.B;
            const cd = gradeDistribution.C + gradeDistribution.D;
            const total = gradeDistribution.total || 1;
            
            let diagnosis = a + b > cd 
                ? "مؤشر إيجابي: الأغلبية تتحكم في الكفاءات الختامية (الأعداد الكبيرة، الهندسة). جاهزية جيدة للسنة الخامسة."
                : "مؤشر مقلق: ارتفاع نسبة الهشاشة (ج+د) ينذر بصعوبات في استيعاب مفاهيم السنة الخامسة (الكسور، التناسبية).";

            return {
                reading: `تحكم أقصى: ${Math.round((a/total)*100)}% | تحكم مقبول: ${Math.round((b/total)*100)}% | تعثر: ${Math.round((cd/total)*100)}%`,
                diagnosis: diagnosis,
                recommendation: a + b > cd ? "تعزيز المكتسبات بوضعيات مركبة." : "تفعيل مشروع القسم لعلاج الأساسيات المفقودة."
            };
        }

        if (section === 'homogeneity') {
            let diagnosis = "";
            if (homogeneityIndex < 18) diagnosis = "القسم متجانس جداً. الفوارق بسيطة مما يسهل التدريس الجماعي.";
            else if (homogeneityIndex < 28) diagnosis = "تجانس متوسط. توجد فوارق طبيعية يمكن تسييرها بيداغوجياً.";
            else diagnosis = "تشتت حاد. القسم منشطر إلى فئة متمكنة وفئة متعثرة جداً.";

            return {
                reading: `قيمة المؤشر: ${homogeneityIndex.toFixed(2)}`,
                diagnosis: diagnosis,
                recommendation: homogeneityIndex > 28 ? "اعتماد التفويج المرن (فوج علاج / فوج إثراء)." : "الاستمرار في التنويع البيداغوجي."
            };
        }

        if (section === 'matrix') {
            const total = performanceMatrix.total || 1;
            const q_method = Math.round((performanceMatrix.method_gap / total) * 100);
            const q_know = Math.round((performanceMatrix.knowledge_gap / total) * 100);
            
            return {
                reading: `موارد > منهجية (حفظ): ${q_method}% | منهجية > موارد (تسرع): ${q_know}%`,
                diagnosis: q_method > 20 ? "طغيان الحفظ الآلي للقواعد دون فهم كيفية توظيفها في حل المشكلات." : "توازن نسبي بين المعرفة والتوظيف.",
                recommendation: q_method > 20 ? "التركيز على 'ترييض المشكلات' وفهم المعنى." : "تكثيف الحساب لتمتين الآلية."
            };
        }
        return { reading: '', diagnosis: '', recommendation: '' };
    };

    const getAnalysis = (section: string) => {
        return customAnalysis[section] || getDefaultAnalysis(section);
    };

    // --- HELPERS ---
    
    const handleMouseEnter = (e: React.MouseEvent, title: string, text: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredData({
            x: rect.left + rect.width / 2,
            y: rect.top - 15,
            text,
            title
        });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    const ExpandBtn = ({ section }: { section: AnalysisSection }) => (
        <button 
            onClick={(e) => { e.stopPropagation(); setExpandedSection(section); }}
            className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 z-10 shadow-sm"
            title="تكبير للتحليل المعمق"
        >
            <Maximize2 size={18} />
        </button>
    );

    const getMathAdvice = (label: string): string => {
        if (label.includes('الأعداد') || label.includes('الكسور')) return "صعوبة في الانتقال من الأعداد الطبيعية إلى الكسور/العشرية. العلاج: استخدام المستقيم المدرج وتفكيك العدد.";
        if (label.includes('الهندسة')) return "مشكلة في الانتقال من الهندسة الحسية (بالعين) إلى هندسة الخواص والأدوات. العلاج: الإنشاء الهندسي الدقيق.";
        if (label.includes('التناسبية')) return "عدم إدراك العلاقة الخطية (المرور للوحدة). العلاج: جداول تناسبية من الواقع (وصفات، أثمان).";
        if (label.includes('فهم المشكلة')) return "صعوبة في ترجمة النص اللغوي إلى علاقات رياضية. العلاج: تلوين المعطيات والمطلوب وتمثيل الوضعية.";
        if (label.includes('الخوارزمية')) return "اختيار عشوائي للعملية لغياب المعنى (الجمع للضم، الطرح للفرق...). العلاج: ربط العمليات بمدلولها.";
        return "يحتاج التلميذ لتفريد التعلم في هذا المعيار.";
    };

    const handleStudentDiagnosis = (student: any, criterion?: { id: number, label: string }) => {
        const res = student.resPct;
        const solv = student.solvPct;
        let profileType = '', diagnosis = '', remedy = '';

        if (res >= 60 && solv < 40) {
            profileType = "غياب الترييض (حفظ)";
            diagnosis = "يتقن الحساب والقواعد لكن يعجز عن حل المشكلات (انفصال المعرفة عن السياق).";
            remedy = "التدريب على 'ترييض المشكلات' واختيار الأدوات دون حساب.";
        } else if (res < 40 && solv >= 60) {
            profileType = "ذكاء منطقي وهشاشة حسابية";
            diagnosis = "يفهم المشكلة ويختار الحل الصحيح لكن يخطئ في الحساب (نقص الدقة).";
            remedy = "الصرامة في الحساب والتدرب على المراقبة الذاتية.";
        } else if (res < 35 && solv < 35) {
            profileType = "فجوة مفاهيمية";
            diagnosis = "صعوبات جذرية في المفاهيم الأساسية (الكسر، العشرية).";
            remedy = "العودة للمحسوس وإعادة بناء المفاهيم.";
        } else {
            profileType = "تحكم متوازن";
            diagnosis = "توازن إيجابي بين الموارد والمنهجية.";
            remedy = "تعزيز القدرات بوضعيات مركبة.";
        }

        let clickedCriterion = undefined;
        if (criterion) {
            clickedCriterion = {
                label: criterion.label,
                advice: getMathAdvice(criterion.label)
            };
        }

        setSelectedStudentDiag({
            studentName: student.fullName,
            profileType, diagnosis, remedy,
            scores: { resources: res, solving: solv },
            clickedCriterion
        });
    };

    // --- INSIGHTS ---
    const showMatrixInsight = () => {
        const total = performanceMatrix.total || 1;
        setActiveInsight({
            title: "تحليل المصفوفة: (امتلاك الموارد / كفاءة الحل)",
            definition: "تحليل العلاقة الجدلية بين 'المعرفة' و 'القدرة على التوظيف'.",
            pedagogicalRef: "الرياضيات ليست مجرد تخزين للمعلومات (ذاكرة)، بل هي ورشة عمل ذهنية. الفجوة بين الامتلاك والتطبيق تسمى 'عائق النقل الديداكتيكي'.",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/50">
                            <span className="block text-2xl font-bold text-yellow-400">{Math.round((performanceMatrix.method_gap/total)*100)}%</span>
                            <span className="text-xs text-yellow-200 font-bold block mb-1">موارد {'>'} منهجية</span>
                            <p className="text-[10px] text-gray-400">"حفظ آلي"</p>
                        </div>
                        <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/50">
                            <span className="block text-2xl font-bold text-blue-400">{Math.round((performanceMatrix.knowledge_gap/total)*100)}%</span>
                            <span className="text-xs text-blue-200 font-bold block mb-1">منهجية {'>'} موارد</span>
                            <p className="text-[10px] text-gray-400">"منطق سليم"</p>
                        </div>
                    </div>
                </div>
            )
        });
    };

    const showHomogeneityInsight = () => {
        setActiveInsight({
            title: "مؤشر التجانس",
            definition: "درجة التقارب في استيعاب المفاهيم الرياضية التراكمية.",
            pedagogicalRef: "ارتفاع مؤشر التشتت يعني أن القسم منشطر زمنياً. الحل ليس في إعادة الدرس، بل في 'التفويج المرن'.",
            content: (
                <div className="text-center space-y-4">
                    <div className="inline-block px-6 py-2 bg-purple-500/20 rounded-xl border border-purple-500/50">
                        <span className="text-4xl font-bold text-purple-400 font-mono">{homogeneityIndex.toFixed(2)}</span>
                    </div>
                </div>
            )
        });
    };

    const showDistributionInsight = () => {
        const total = gradeDistribution.total || 1;
        const ab = gradeDistribution.A + gradeDistribution.B;
        const cd = gradeDistribution.C + gradeDistribution.D;
        
        setActiveInsight({
            title: "توزيع التحكم",
            definition: "نظرة استشرافية لمدى جاهزية القسم.",
            pedagogicalRef: "تراكم التعثرات (ج+د) في هذا المستوى يعني أن التلميذ سيدخل السنة الخامسة وهو يفتقد لأدوات العمل الأساسية.",
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-900/30 p-3 rounded border border-emerald-700/50">
                        <span className="text-emerald-200 text-sm font-bold">تحكم كافٍ (أ+ب)</span>
                        <span className="text-2xl font-bold text-white">{Math.round((ab/total)*100)}%</span>
                    </div>
                    <div className="flex items-center justify-between bg-red-900/30 p-3 rounded border border-red-700/50">
                        <span className="text-red-200 text-sm font-bold">هشاشة (ج+د)</span>
                        <span className="text-2xl font-bold text-white">{Math.round((cd/total)*100)}%</span>
                    </div>
                </div>
            )
        });
    };

    // --- RENDER EXPANDED VIEW ---
    const renderExpandedView = () => {
        if (!expandedSection) return null;
        const def = METRIC_DEFINITIONS[expandedSection];
        const activeAnalysis = getAnalysis(expandedSection);

        let content = null;
        switch (expandedSection) {
            case 'distribution':
                const a = gradeDistribution.A;
                const b = gradeDistribution.B;
                const cd = gradeDistribution.C + gradeDistribution.D;
                const total = gradeDistribution.total;
                content = (
                    <div className="h-full flex flex-col items-center justify-center p-4 w-full">
                         <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                            <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/50 text-center">
                                <span className="block text-4xl font-bold text-emerald-400 mb-2">{Math.round((a/total)*100)}%</span>
                                <span className="text-sm text-emerald-200">تحكم أقصى</span>
                            </div>
                            <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/50 text-center">
                                <span className="block text-4xl font-bold text-blue-400 mb-2">{Math.round((b/total)*100)}%</span>
                                <span className="text-sm text-blue-200">تحكم مقبول</span>
                            </div>
                            <div className="bg-red-500/20 p-4 rounded-2xl border border-red-500/50 text-center">
                                <span className="block text-4xl font-bold text-red-400 mb-2">{Math.round((cd/total)*100)}%</span>
                                <span className="text-sm text-red-200">تعثر (ج+د)</span>
                            </div>
                        </div>
                    </div>
                );
                break;
            case 'homogeneity':
                 content = (
                    <div className="h-full flex flex-col items-center justify-center p-4 w-full">
                         <div className="relative w-80 h-40 bg-gray-700/50 rounded-t-full overflow-hidden mb-8 border-t-4 border-x-4 border-slate-600">
                            <div className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000" style={{ transform: `rotate(${(Math.min(homogeneityIndex, 40) / 40) * 180 - 90}deg)` }}>
                                <div className="w-2 h-full bg-white mx-auto shadow-[0_0_15px_white]"></div>
                            </div>
                        </div>
                        <span className="text-6xl font-bold text-purple-400 font-mono">{homogeneityIndex.toFixed(2)}</span>
                    </div>
                );
                break;
            case 'matrix':
                content = (
                    <div className="h-full flex items-center justify-center w-full">
                        <div className="aspect-square w-[400px] relative bg-slate-700/30 rounded-2xl border border-slate-600 p-4 grid grid-cols-2 grid-rows-2 gap-2">
                            <div className="bg-blue-100 rounded flex flex-col items-center justify-center hover:bg-blue-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q1')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-2xl font-bold text-blue-800">{Math.round((performanceMatrix.knowledge_gap / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-blue-800 font-bold mt-1">منهجية {'>'} موارد</span>
                            </div>
                            <div className="bg-emerald-100 rounded flex flex-col items-center justify-center hover:bg-emerald-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q2')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-2xl font-bold text-emerald-800">{Math.round((performanceMatrix.balanced_high / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-emerald-800 font-bold mt-1">تحكم شامل</span>
                            </div>
                            <div className="bg-red-100 rounded flex flex-col items-center justify-center hover:bg-red-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q3')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-2xl font-bold text-red-800">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-red-800 font-bold mt-1">تعثر شامل</span>
                            </div>
                            <div className="bg-yellow-100 rounded flex flex-col items-center justify-center hover:bg-yellow-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q4')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-2xl font-bold text-yellow-800">{Math.round((performanceMatrix.method_gap / performanceMatrix.total)*100)}%</span>
                                <span className="text-sm text-yellow-800 font-bold mt-1">موارد {'>'} منهجية</span>
                            </div>
                        </div>
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
                        <h2 className="text-2xl font-bold text-white font-serif">{def.title}</h2>
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
                    
                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">نظام المفتش التربوي الذكي © 2025</p>
                    </div>
                </div>

                <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    
                    {/* Top Definition Card */}
                    <div className="w-full max-w-3xl z-20 mb-4 mt-2 animate-in slide-in-from-top-4 shrink-0">
                         <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1.5 bg-indigo-500/20 rounded-bl-lg border-b border-l border-white/10"><Info size={14} className="text-indigo-300"/></div>
                            <div className="space-y-2 pt-1">
                                 <div><h4 className="text-[11px] font-bold text-indigo-300 uppercase mb-0.5">المفهوم التربوي</h4><p className="text-xs text-white/90 leading-relaxed">{def.concept}</p></div>
                                 <div className="pt-2 border-t border-white/10"><h4 className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 flex items-center gap-1"><Ruler size={10}/> المرجعية الحسابية</h4><p className="text-[10px] text-slate-400 leading-relaxed font-mono opacity-80">{def.method}</p></div>
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

    // --- MANUAL EDIT MODAL ---
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

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">
            
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

            {/* INSIGHT MODAL */}
            {activeInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveInsight(null)}>
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Info size={20} className="text-blue-400"/> {activeInsight.title}</h3>
                            <button onClick={() => setActiveInsight(null)} className="text-slate-400 hover:text-white transition-colors"><X/></button>
                        </div>
                        <p className="text-slate-300 text-sm mb-6 italic border-r-4 border-slate-600 pr-4 leading-relaxed">"{activeInsight.definition}"</p>
                        <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-900/50 mb-6">
                            <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1 uppercase tracking-wider"><BookOpen size={12}/> المرجعية الديداكتيكية:</h4>
                            <p className="text-xs text-blue-200 leading-relaxed text-justify">{activeInsight.pedagogicalRef}</p>
                        </div>
                        {activeInsight.content}
                    </div>
                </div>
            )}

            {/* STUDENT MODAL */}
            {selectedStudentDiag && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedStudentDiag(null)}>
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-700 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50 shadow-inner">
                                    <Calculator size={24} className="text-purple-300"/>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedStudentDiag.studentName}</h3>
                                    <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-800 block w-fit mt-1">{selectedStudentDiag.profileType}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudentDiag(null)} className="text-slate-400 hover:text-white transition-colors"><X/></button>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Stethoscope size={14}/> التشخيص الدقيق</h4>
                                <p className="text-sm text-slate-300 leading-relaxed text-justify">{selectedStudentDiag.diagnosis}</p>
                            </div>
                            
                            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-800/50">
                                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><BrainCircuit size={14}/> مسار العلاج المقترح</h4>
                                <p className="text-sm text-emerald-100 leading-relaxed text-justify">{selectedStudentDiag.remedy}</p>
                            </div>

                            {selectedStudentDiag.clickedCriterion && (
                                <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-800/50 animate-in slide-in-from-bottom-2">
                                    <h4 className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Microscope size={14}/> تحليل الخطأ في المعيار:</h4>
                                    <div className="mb-2 text-xs font-bold text-orange-200 bg-orange-950/50 px-2 py-1 rounded inline-block">{selectedStudentDiag.clickedCriterion.label}</div>
                                    <p className="text-sm text-orange-100 leading-relaxed text-justify">{selectedStudentDiag.clickedCriterion.advice}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 1. HERO HEADER */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 text-white p-8 relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><Calculator size={150} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase tracking-widest text-xs">
                                {scope === 'district' ? 'تحليل شامل للمقاطعة' : scope === 'school' ? 'تحليل المؤسسة' : 'تحليل الفوج'}
                            </div>
                            <h2 className="text-4xl font-bold font-serif mb-2">{YEAR4_MATH_DEF.label}</h2>
                            <p className="text-slate-400 text-lg flex items-center gap-2"><School size={18}/> {contextName}</p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="bg-slate-800 p-4 rounded-2xl text-center min-w-[100px] border border-slate-700 flex flex-col justify-center">
                                <span className="block text-3xl font-bold text-white">{totalStudents}</span>
                                <span className="text-xs text-slate-400 font-bold">تلميذ</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* KPI STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={24}/></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">تحكم كلي</p>
                            <p className="text-2xl font-bold text-emerald-700">{Math.round((globalKPIs.controlled / totalStudents)*100)}%</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><TrendingUp size={24}/></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">تحكم جزئي</p>
                            <p className="text-2xl font-bold text-orange-700">{Math.round((globalKPIs.partial / totalStudents)*100)}%</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle size={24}/></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">تحكم محدود</p>
                            <p className="text-2xl font-bold text-red-700">{Math.round((globalKPIs.limited / totalStudents)*100)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Distribution */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
                    onClick={() => setExpandedSection('distribution')}
                    onMouseEnter={(e) => handleMouseEnter(e, "توزيع التقديرات", "توزيع التلاميذ حسب مستويات التحكم الأربعة.")}
                    onMouseLeave={handleMouseLeave}
                >
                    <ExpandBtn section="distribution" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> التوزيع</h3>
                        <Info size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                    </div>
                    <div className="flex items-end gap-4 h-40">
                        {['A', 'B', 'C', 'D'].map((grade) => {
                            const count = gradeDistribution[grade as keyof typeof gradeDistribution];
                            const pct = gradeDistribution.total > 0 ? (count / gradeDistribution.total) * 100 : 0;
                            const color = grade === 'A' ? 'bg-emerald-500' : grade === 'B' ? 'bg-blue-500' : grade === 'C' ? 'bg-orange-500' : 'bg-red-500';
                            return (
                                <div key={grade} className="flex-1 flex flex-col justify-end items-center h-full">
                                    <div className={`w-full rounded-t-lg ${color}`} style={{ height: `${Math.max(pct, 5)}%` }}></div>
                                    <span className="mt-2 font-bold text-slate-600 text-xs">{grade} ({Math.round(pct)}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Homogeneity */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all"
                    onClick={() => setExpandedSection('homogeneity')}
                    onMouseEnter={(e) => handleMouseEnter(e, "مؤشر التجانس", "مدى تقارب مستويات التلاميذ في القسم.")}
                    onMouseLeave={handleMouseLeave}
                >
                    <ExpandBtn section="homogeneity" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Scale size={20} className="text-purple-500"/> التجانس</h3>
                        <Info size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors"/>
                    </div>
                    <div className="flex justify-center items-center py-6">
                        <div className="relative w-48 h-24 bg-gray-100 rounded-t-full overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000" style={{ transform: `rotate(${(Math.min(homogeneityIndex, 40) / 40) * 180 - 90}deg)` }}>
                                <div className="w-1 h-full bg-slate-800 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-3xl font-bold text-purple-700">{homogeneityIndex.toFixed(1)}</div>
                </div>

                {/* Matrix (Resources vs Methodology) */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-teal-300 transition-all group relative lg:col-span-3 xl:col-span-1"
                    onClick={() => setExpandedSection('matrix')}
                >
                    <ExpandBtn section="matrix" />
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Puzzle size={20} className="text-teal-500"/> مصفوفة (موارد/منهجية)</h3>
                        <Info size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors"/>
                    </div>
                    
                    <div className="flex gap-6 items-center justify-center relative">
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
                                {/* Arrow */}
                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800/90 rotate-45 border-r border-b border-slate-600"></div>
                            </div>
                        )}

                        <div className="aspect-square w-52 relative bg-slate-50 rounded-xl border border-slate-200 p-2 grid grid-cols-2 grid-rows-2 gap-1 shrink-0">
                            {/* Q1: Low Res / High Solv */}
                            <div className="bg-blue-100 rounded flex flex-col items-center justify-center hover:bg-blue-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q1')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-blue-800">{Math.round((performanceMatrix.knowledge_gap / performanceMatrix.total)*100)}%</span>
                            </div>
                            {/* Q2: High Res / High Solv */}
                            <div className="bg-emerald-100 rounded flex flex-col items-center justify-center hover:bg-emerald-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q2')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-emerald-800">{Math.round((performanceMatrix.balanced_high / performanceMatrix.total)*100)}%</span>
                            </div>
                            {/* Q3: Low Res / Low Solv */}
                            <div className="bg-red-100 rounded flex flex-col items-center justify-center hover:bg-red-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q3')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-red-800">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                            </div>
                            {/* Q4: High Res / Low Solv */}
                            <div className="bg-yellow-100 rounded flex flex-col items-center justify-center hover:bg-yellow-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q4')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-yellow-800">{Math.round((performanceMatrix.method_gap / performanceMatrix.total)*100)}%</span>
                            </div>
                            
                            <div className="absolute -left-4 top-1/2 -translate-x-1/2 -rotate-90 text-[10px] text-slate-500 font-bold tracking-widest">منهجية الحل</div>
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest">المعارف</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CRITERIA HEATMAP */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Target size={20} className="text-red-500"/> ترتيب المعايير (من الأضعف للأقوى)</h3>
                    
                    {/* Legend */}
                    <div className="flex gap-3 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span>أ (أقصى)</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><span>ب (مقبول)</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-400 rounded-full"></div><span>ج (جزئي)</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div><span>د (محدود)</span></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {criterionAnalysis.map((crit, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 group hover:border-indigo-100 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded border border-slate-100">
                                    {crit.compId === 'control_resources' ? 'موارد معرفية' : 'حل مشكلات'}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${crit.successRate < 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{Math.round(crit.successRate)}% نجاح</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 min-h-[40px]">{crit.label}</h4>
                            <div className="flex h-2 rounded-full overflow-hidden relative">
                                <div className="bg-emerald-500" style={{ width: `${(crit.stats.A / crit.stats.total)*100}%` }}></div>
                                <div className="bg-blue-400" style={{ width: `${(crit.stats.B / crit.stats.total)*100}%` }}></div>
                                <div className="bg-orange-400" style={{ width: `${(crit.stats.C / crit.stats.total)*100}%` }}></div>
                                <div className="bg-red-400" style={{ width: `${(crit.stats.D / crit.stats.total)*100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                                <span className="font-bold text-slate-500">{crit.stats.A + crit.stats.B} متحكم</span>
                                <span className="font-bold text-slate-500">{crit.stats.C + crit.stats.D} متعثر</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. REMEDIAL LISTS (Class Scope Only) */}
            {scope === 'class' && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 border-t-4 border-t-red-500 mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><PenTool size={20} className="text-red-500"/> قوائم المعالجة (الرياضيات)</h3>
                        <span className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-bold">اضغط للتشخيص الدقيق</span>
                    </div>
                    
                    <div className="masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {YEAR4_MATH_DEF.competencies.map(comp => (
                            <React.Fragment key={comp.id}>
                                {comp.criteria.map(crit => {
                                    const struggling = allStudents.filter(s => getGrade(s, comp.id, crit.id) === 'D');
                                    if (struggling.length === 0) return null;

                                    return (
                                        <div key={`${comp.id}-${crit.id}`} className="bg-red-50/30 rounded-xl p-4 border border-red-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-2 mb-3">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                                                <h5 className="font-bold text-slate-700 text-xs leading-snug">{crit.label}</h5>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {struggling.map(s => {
                                                    const enrichedStudent = studentAnalysis.find(sa => sa.id === s.id) || s;
                                                    return (
                                                        <button 
                                                            key={s.id} 
                                                            onClick={() => handleStudentDiagnosis(enrichedStudent, crit)}
                                                            className="px-2 py-1 rounded text-[10px] font-bold bg-white text-red-700 border border-red-100 shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer"
                                                        >
                                                            {s.fullName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

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
                                <button onClick={() => setEditingSection('distribution')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">توزيع التقديرات</span>
                                </button>
                                <button onClick={() => setEditingSection('homogeneity')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مؤشر التجانس</span>
                                </button>
                                <button onClick={() => setEditingSection('matrix')} className="p-4 bg-slate-50 hover:bg-indigo-50 border rounded-xl text-right transition-colors group col-span-2">
                                    <span className="font-bold text-slate-700 block group-hover:text-indigo-700">مصفوفة التوازن</span>
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

export default AcqYear4MathStats;
