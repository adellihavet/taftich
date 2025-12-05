
import React, { useMemo, useState } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR2_MATH_DEF } from '../../../constants/acqYear2Math';
import { BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, ArrowUpRight, ArrowDownRight, School, Scale, Activity, X, Info, HelpCircle, GitCompare, Calculator, BrainCircuit, Microscope, Puzzle, Stethoscope, PenTool, HelpCircle as QuestionIcon, BookOpen, FileText } from 'lucide-react';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

const AcqYear2MathStats: React.FC<Props> = ({ records, scope, contextName }) => {
    
    // State for the General Insight Modal
    const [activeInsight, setActiveInsight] = useState<{ title: string; definition: string; pedagogicalRef: string; content: React.ReactNode } | null>(null);
    
    // State for Custom Tooltips (Matrix)
    const [hoveredMatrixZone, setHoveredMatrixZone] = useState<string | null>(null);

    // State for Individual Student Diagnosis
    const [selectedStudentDiag, setSelectedStudentDiag] = useState<{ 
        studentName: string; 
        profileType: string; 
        diagnosis: string;
        remedy: string;
        scores: { calc: number, logic: number };
        gap: number;
        clickedCriterion?: { label: string, advice: string };
    } | null>(null);

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

    // B. Calculate Scores
    const studentAnalysis = useMemo(() => {
        return allStudents.map(s => {
            let totalPoints = 0, maxPoints = 0;
            let calcPoints = 0, calcMax = 0; // Comp 1: Numbers & Calc
            let logicPoints = 0, logicMax = 0; // Comp 2: Problem Solving

            YEAR2_MATH_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) {
                        // Weighted Scoring Logic
                        const pts = g === 'A' ? 3 : g === 'B' ? 2 : g === 'C' ? 1 : 0;
                        maxPoints += 3;
                        totalPoints += pts;

                        if (comp.id === 'control_numbers') {
                            calcPoints += pts; calcMax += 3;
                        } else {
                            logicPoints += pts; logicMax += 3;
                        }
                    }
                });
            });

            const percent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
            const calcPct = calcMax > 0 ? (calcPoints / calcMax) * 100 : 0;
            const logicPct = logicMax > 0 ? (logicPoints / logicMax) * 100 : 0;

            return { ...s, percent, calcPct, logicPct };
        });
    }, [allStudents]);

    // C. Group Data
    const groupedData = useMemo(() => {
        const groups: Record<string, { 
            name: string; 
            scores: { calc: number, logic: number, global: number }; 
        }> = {};

        // Calculate averages per group
        const groupScoresCalc: Record<string, {calcs: number[], logics: number[], globals: number[]}> = {};
        studentAnalysis.forEach(s => {
            const key = scope === 'district' ? s.schoolName : s.className;
            if(!groupScoresCalc[key]) groupScoresCalc[key] = {calcs: [], logics: [], globals: []};
            groupScoresCalc[key].calcs.push(s.calcPct);
            groupScoresCalc[key].logics.push(s.logicPct);
            groupScoresCalc[key].globals.push(s.percent);
        });

        Object.keys(groupScoresCalc).forEach(key => {
            const data = groupScoresCalc[key];
            if (data && data.globals.length > 0) {
                groups[key] = {
                    name: key,
                    scores: {
                        global: data.globals.reduce((a,b)=>a+b,0) / data.globals.length,
                        calc: data.calcs.reduce((a,b)=>a+b,0) / data.calcs.length,
                        logic: data.logics.reduce((a,b)=>a+b,0) / data.logics.length,
                    }
                };
            }
        });

        return Object.values(groups).sort((a, b) => b.scores.global - a.scores.global);
    }, [studentAnalysis, scope]);

    // D. Global KPIs
    const globalKPIs = useMemo(() => {
        let controlled = 0, partial = 0, limited = 0;
        studentAnalysis.forEach(s => {
            if (s.percent >= 66) controlled++;
            else if (s.percent >= 33) partial++;
            else limited++;
        });
        return { controlled, partial, limited };
    }, [studentAnalysis]);

    // E. Homogeneity
    const homogeneityIndex = useMemo(() => {
        if (studentAnalysis.length === 0) return 0;
        const mean = studentAnalysis.reduce((acc, s) => acc + s.percent, 0) / studentAnalysis.length;
        const variance = studentAnalysis.reduce((acc, s) => acc + Math.pow(s.percent - mean, 2), 0) / studentAnalysis.length;
        return Math.sqrt(variance);
    }, [studentAnalysis]);

    // F. Distribution
    const gradeDistribution = useMemo(() => {
        const counts = { A: 0, B: 0, C: 0, D: 0, total: 0 };
        allStudents.forEach(s => {
            YEAR2_MATH_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) { counts[g]++; counts.total++; }
                });
            });
        });
        if (counts.total === 0) counts.total = 1;
        return counts;
    }, [allStudents]);

    // G. Matrix (Calculation vs Problem Solving)
    // Logic:
    // High = >= 50%
    // Balanced High: Both >= 50
    // Procedural Issue: Logic >= 50 BUT Calc < 50
    // Conceptual Issue (Rote): Calc >= 50 BUT Logic < 50
    // Global Struggle: Both < 50
    const performanceMatrix = useMemo(() => {
        const counts = { 
            balanced_high: 0, 
            procedural_issue: 0, // Intelligent but careless/bad calc
            rote_learning: 0,    // Good calc but no understanding
            struggling: 0, 
            total: 0 
        };
        studentAnalysis.forEach(s => {
            const highCalc = s.calcPct >= 50;
            const highLogic = s.logicPct >= 50;
            
            if (highCalc && highLogic) counts.balanced_high++;
            else if (!highCalc && highLogic) counts.procedural_issue++;
            else if (highCalc && !highLogic) counts.rote_learning++;
            else counts.struggling++;
            
            counts.total++;
        });
        return counts;
    }, [studentAnalysis]);

    // H. Criterion Heatmap
    const criterionAnalysis = useMemo(() => {
        return YEAR2_MATH_DEF.competencies.flatMap(comp => 
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


    // --- CONTEXTUAL ADVICE GENERATOR ---
    const getMathAdvice = (label: string): string => {
        if (label.includes('نظام العد')) return "خلل في 'مفهوم العدد' وتشكيله. التلميذ لا يدرك القيمة المكانية للأرقام (وحدات/عشرات). العلاج: العودة للوسائل المجردة (جداول المراتب، المعداد).";
        if (label.includes('الجمع والطرح')) return "خلل 'إجرائي' (Algorithmic). التلميذ يخطئ في آلية الاحتفاظ أو الاستعارة، أو في وضع العملية عمودياً. العلاج: التدريب الميكانيكي المكثف.";
        if (label.includes('فهم المشكلة')) return "خلل في 'القراءة الرياضية'. التلميذ يقرأ النص لغوياً لكنه لا يستخرج المعطيات والمطلوب. العلاج: تلوين الكلمات المفتاحية وتمثيل المشكلة برسم.";
        if (label.includes('انسجام عناصر')) return "خلل في 'المنطق الرياضي'. اختيار العملية خاطئ (يجمع بدل الطرح). هذا يدل على غياب المعنى. العلاج: مسرحة الوضعية (لعب الأدوار).";
        if (label.includes('الأدوات الرياضياتية')) return "خلل في 'التنفيذ'. اختار العملية الصحيحة لكن النتيجة خاطئة. العلاج: مراجعة جداول الجمع والطرح والحساب الذهني.";
        if (label.includes('التبليغ')) return "خلل 'تعبيري'. الحل صحيح لكن ينقصه التصريح بالإجابة أو الوحدة. العلاج: التأكيد على خطوات الحل النموذجية (الحل/العمليات/الأجوبة).";
        return "يحتاج التلميذ لتفريد التعلم في هذا المعيار.";
    };

    // --- STUDENT DIAGNOSIS LOGIC ---
    const handleStudentDiagnosis = (student: any, criterion?: { id: number, label: string }) => {
        const calc = student.calcPct;
        const logic = student.logicPct;
        
        let profileType = '';
        let diagnosis = '';
        let remedy = '';

        // Precise Mathematical Profiling
        if (calc >= 60 && logic < 40) {
            profileType = "نمط الحساب الآلي (غياب المعنى)";
            diagnosis = "التلميذ 'آلة حاسبة': يتقن الإجراءات (الجمع/الطرح العمودي) بامتياز، لكنه يعجز تماماً عن توظيفها في حل مشكلة. هو يحفظ الخوارزمية ولا يفهم معناها.";
            remedy = "التوقف عن إعطائه عمليات مجردة. التركيز حصرياً على 'ترييض المشكلات' (تحويل النص إلى مخطط). سؤاله دائماً: 'لماذا اخترت هذه العملية؟' وليس 'كم النتيجة؟'.";
        } else if (calc < 40 && logic >= 60) {
            profileType = "تعثر إجرائي (منطق سليم)";
            diagnosis = "التلميذ يمتلك 'حساً رياضياً' جيداً. يفهم الوضعية ويختار الأداة الصحيحة، لكنه يخطئ في الحساب (خطأ في العد، نسيان الاحتفاظ). مشكلته تركيز وآلية وليست مفاهيمية.";
            remedy = "تكثيف الحساب الذهني السريع (5 دقائق يومياً). مراجعة جداول الجمع والطرح. لا داعي لشرح 'كيف نحل المشكلة' له، بل 'كيف نحسب بدقة'.";
        } else if (calc < 30 && logic < 30) {
            profileType = "تعثر في بناء مفهوم العدد";
            diagnosis = "المشكلة جذرية وتعود للسنة الأولى. التلميذ لم يبنِ مفهوم العدد والكمية، وبالتالي لا يستطيع الحساب ولا الحل.";
            remedy = "العودة فوراً للمحسوس (Manipulatives). عد القريصات، التجميع، المقايضة. لا جدوى من حل المشكلات قبل بناء العدد.";
        } else {
            profileType = "أداء متذبذب";
            diagnosis = "مستوى متوسط مع توازن نسبي بين الفهم والأداء. الأخطاء عشوائية وليست نمطية.";
            remedy = "الاستمرار في حل مشكلات متنوعة من الواقع المعيش.";
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
            profileType,
            diagnosis,
            remedy,
            scores: { calc, logic },
            gap: calc - logic,
            clickedCriterion
        });
    };

    // --- INSIGHT HANDLERS (Mathematical Context) ---
    
    const showHomogeneityInsight = () => {
        let msg = "";
        if (homogeneityIndex < 15) msg = "القسم متجانس جداً. هذا مؤشر ممتاز يسمح بالتقدم في الدروس بنسق واحد.";
        else if (homogeneityIndex < 25) msg = "تجانس متوسط. توجد فوارق فردية يمكن معالجتها داخل القسم (تصحيح جماعي على السبورة).";
        else msg = "تشتت كبير في المستوى (فوارق صارخة). التدريس الجماعي الموحد لن يجدي نفعاً. يجب اعتماد التفويج (فوج للدعم العلاجي وفوج للإثراء).";

        setActiveInsight({
            title: "تحليل مؤشر التجانس",
            definition: "مقياس يحدد مدى تقارب أو تباعد مستويات التلاميذ. كلما كان الرقم صغيراً، كان القسم متجانساً.",
            pedagogicalRef: "يستند إلى 'بيداغوجيا الفوارق'. الرياضيات مادة تراكمية؛ إذا كان التشتت كبيراً، فإن الدرس الذي يناسب النجباء سيحبط المتعثرين، والدرس الذي يناسب المتعثرين سيضجر النجباء.",
            content: (
                <div className="space-y-3">
                    <div className="text-3xl font-bold text-center text-purple-400 font-mono">{homogeneityIndex.toFixed(2)}</div>
                    <p className="text-gray-300 text-sm bg-white/10 p-3 rounded border border-white/20 text-center">{msg}</p>
                </div>
            )
        });
    };

    const showDistributionInsight = () => {
        const total = gradeDistribution.total || 1;
        const a_b = gradeDistribution.A + gradeDistribution.B;
        const c_d = gradeDistribution.C + gradeDistribution.D;
        
        setActiveInsight({
            title: "قراءة في توزيع النتائج",
            definition: "نظرة شمولية لمدى تحقق الكفاءات الرياضية (التحكم الكلي مقابل التعثر).",
            pedagogicalRef: "يعكس هذا المؤشر 'صورة القسم'. التوزيع الطبيعي يفترض وجود أغلبية في الوسط. الانحراف نحو اليسار (تعثر) يتطلب مراجعة استراتيجيات التدريس الأساسية.",
            content: (
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded">
                        <span className="text-emerald-300">تحكم جيد (أ+ب):</span>
                        <span className="font-bold text-white text-lg">{Math.round((a_b/total)*100)}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-red-500/10 p-2 rounded">
                        <span className="text-red-300">تعثر (ج+د):</span>
                        <span className="font-bold text-white text-lg">{Math.round((c_d/total)*100)}%</span>
                    </div>
                    <div className="text-gray-300 text-xs mt-2 p-2 border-t border-white/10">
                        {a_b > c_d ? 
                            "المؤشر إيجابي: الأغلبية مسايرة. يمكن الانتقال لمفاهيم أعقد (كالضرب) بأمان." : 
                            "المؤشر مقلق: يجب التوقف ومراجعة المكتسبات القبلية (الجمع، الطرح، المراتب) قبل التقدم."}
                    </div>
                </div>
            )
        });
    };

    const showMatrixInsight = () => {
        const total = performanceMatrix.total || 1;
        
        const showRote = performanceMatrix.rote_learning > 0;
        const showProc = performanceMatrix.procedural_issue > 0;
        const showStrug = performanceMatrix.struggling > 0;
        const showBal = performanceMatrix.balanced_high > 0;

        setActiveInsight({
            title: "تحليل مصفوفة التوازن (الآلية / المنطق)",
            definition: "أداة ديداكتيكية تفرز التلاميذ حسب نوع الصعوبة: هل هي في 'الحساب' أم في 'الفهم'؟",
            pedagogicalRef: "مستمدة من ديداكتيك الرياضيات (نظرية الحقول المفاهيمية). التلميذ قد يملك 'مهارة إجرائية' (يعرف يجمع) لكن يفتقد 'المعنى' (متى يجمع؟). الخلط بينهما يؤدي لمعالجة خاطئة.",
            content: (
                <div className="space-y-3 text-sm">
                    <div className="text-xs text-gray-400 mb-2">توزيع تلاميذ القسم حسب طبيعة التحكم:</div>
                    
                    {showBal && (
                        <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/30 flex justify-between items-center">
                            <div>
                                <strong className="text-emerald-400 block">تحكم شامل</strong>
                                <span className="text-[10px] text-gray-400">توازن بين الفهم والحساب</span>
                            </div>
                            <span className="font-bold text-white">{Math.round((performanceMatrix.balanced_high/total)*100)}%</span>
                        </div>
                    )}

                    {showRote && (
                        <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/30 flex justify-between items-center">
                            <div>
                                <strong className="text-yellow-400 block">حساب آلي</strong>
                                <span className="text-[10px] text-gray-400">يحفظ الجداول ولا يفهم المشكلة</span>
                            </div>
                            <span className="font-bold text-white">{Math.round((performanceMatrix.rote_learning/total)*100)}%</span>
                        </div>
                    )}

                    {showProc && (
                        <div className="bg-blue-500/10 p-2 rounded border border-blue-500/30 flex justify-between items-center">
                            <div>
                                <strong className="text-blue-400 block">تعثر إجرائي</strong>
                                <span className="text-[10px] text-gray-400">يفهم المشكلة ويخطئ في الحساب</span>
                            </div>
                            <span className="font-bold text-white">{Math.round((performanceMatrix.procedural_issue/total)*100)}%</span>
                        </div>
                    )}

                    {showStrug && (
                        <div className="bg-red-500/10 p-2 rounded border border-red-500/30 flex justify-between items-center">
                            <div>
                                <strong className="text-red-400 block">تعثر شامل</strong>
                                <span className="text-[10px] text-gray-400">صعوبات في بناء العدد</span>
                            </div>
                            <span className="font-bold text-white">{Math.round((performanceMatrix.struggling/total)*100)}%</span>
                        </div>
                    )}
                </div>
            )
        });
    };

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">
            
            {/* --- INSIGHT MODAL --- */}
            {activeInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveInsight(null)}>
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-start">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Info size={20} className="text-blue-400"/> {activeInsight.title}</h3>
                            <button onClick={() => setActiveInsight(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-300 text-sm mb-4 italic border-l-2 border-slate-700 pl-3">"{activeInsight.definition}"</p>
                            
                            <div className="mb-4 bg-blue-900/20 p-3 rounded border border-blue-900/50">
                                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-1"><BookOpen size={12}/> المرجعية البيداغوجية:</h4>
                                <p className="text-xs text-blue-200 leading-relaxed">{activeInsight.pedagogicalRef}</p>
                            </div>

                            {activeInsight.content}
                        </div>
                    </div>
                </div>
            )}

            {/* --- STUDENT MODAL --- */}
            {selectedStudentDiag && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedStudentDiag(null)}>
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 border-b border-slate-700 relative shrink-0">
                            <button onClick={() => setSelectedStudentDiag(null)} className="absolute left-4 top-4 text-slate-400 hover:text-white"><X size={20}/></button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                                    <Calculator size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedStudentDiag.studentName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold bg-white/10 text-purple-200 px-2 py-0.5 rounded border border-white/10">تشخيص الرياضيات</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Stethoscope size={14}/> التشخيص الدقيق</h4>
                                <p className="text-lg font-bold text-white mb-2">{selectedStudentDiag.profileType}</p>
                                <p className="text-sm text-slate-300 leading-relaxed text-justify">{selectedStudentDiag.diagnosis}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/30 p-3 rounded-lg text-center border border-slate-700">
                                    <span className="text-[10px] text-slate-400 block mb-1">التحكم في الأعداد (الآلية)</span>
                                    <span className={`text-xl font-bold ${selectedStudentDiag.scores.calc < 50 ? 'text-red-400' : 'text-emerald-400'}`}>{selectedStudentDiag.scores.calc.toFixed(0)}%</span>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded-lg text-center border border-slate-700">
                                    <span className="text-[10px] text-slate-400 block mb-1">حل المشكلات (المنطق)</span>
                                    <span className={`text-xl font-bold ${selectedStudentDiag.scores.logic < 50 ? 'text-red-400' : 'text-emerald-400'}`}>{selectedStudentDiag.scores.logic.toFixed(0)}%</span>
                                </div>
                            </div>
                            
                            {/* Calculation Formula Note (Clarified) */}
                            <div className="flex flex-col gap-1 items-center bg-white/5 p-2 rounded border border-white/10">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Info size={12}/>
                                    <span>كيفية حساب النسبة:</span>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono tracking-wide">
                                    (أ=3 | ب=2 | ج=1 | د=0)
                                </div>
                                <span className="text-[9px] text-slate-500">* نسبة الكفاءة = (مجموع النقاط / المجموع الكلي الممكن) × 100</span>
                            </div>

                            {selectedStudentDiag.clickedCriterion ? (
                                <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-700/50 animate-in slide-in-from-bottom-2">
                                    <h4 className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Microscope size={14}/> تحليل السبب الجذري (للمعيار)</h4>
                                    <div className="mb-2 text-xs font-bold text-orange-200 bg-orange-950/50 px-2 py-1 rounded inline-block">{selectedStudentDiag.clickedCriterion.label}</div>
                                    <p className="text-sm text-orange-100 leading-relaxed font-medium text-justify">{selectedStudentDiag.clickedCriterion.advice}</p>
                                </div>
                            ) : (
                                <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-800/50">
                                    <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><BrainCircuit size={14}/> خطة العلاج المقترحة</h4>
                                    <p className="text-sm text-emerald-100 leading-relaxed font-medium text-justify">{selectedStudentDiag.remedy}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 1. HERO HEADER */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden cursor-default">
                <div className="bg-slate-900 text-white p-8 relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><Calculator size={150} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase tracking-widest text-xs">
                                {scope === 'district' ? 'تحليل شامل للمقاطعة' : scope === 'school' ? 'تحليل المؤسسة' : 'تحليل الفوج التربوي'}
                            </div>
                            <h2 className="text-4xl font-bold font-serif mb-2">{YEAR2_MATH_DEF.label}</h2>
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
                            <p className="text-xs font-bold text-slate-400 uppercase">تحكم كلي / أقصى</p>
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

            {/* 2. MAIN CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* A. Distribution */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
                    onClick={showDistributionInsight}
                    title="اضغط لعرض التحليل"
                >
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> توزيع التقديرات</h3>
                        <Info size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                    </div>
                    <div className="flex items-end gap-4 h-40 px-4 mb-4 border-b border-slate-100 pb-1">
                        {['A', 'B', 'C', 'D'].map((grade) => {
                            const count = gradeDistribution[grade as keyof typeof gradeDistribution];
                            const pct = gradeDistribution.total > 0 ? (count / gradeDistribution.total) * 100 : 0;
                            const color = grade === 'A' ? 'bg-emerald-500' : grade === 'B' ? 'bg-blue-500' : grade === 'C' ? 'bg-orange-500' : 'bg-red-500';
                            return (
                                <div key={grade} className="flex-1 flex flex-col justify-end items-center h-full">
                                    <div className={`w-full rounded-t-lg ${color} opacity-90 relative group`} style={{ height: `${Math.max(pct, 5)}%` }}>
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 text-white px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{Math.round(pct)}%</span>
                                    </div>
                                    <span className="mt-2 font-bold text-slate-600 text-xs">{grade}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* B. Homogeneity Index */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all group"
                    onClick={showHomogeneityInsight}
                    title="اضغط لعرض التحليل"
                >
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Scale size={20} className="text-purple-500"/>
                            مؤشر التجانس
                        </h3>
                        <Info size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors"/>
                    </div>

                    <div className="flex justify-center items-center py-6">
                        <div className="relative w-48 h-24 bg-gray-100 rounded-t-full overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000" style={{ transform: `rotate(${(Math.min(homogeneityIndex, 40) / 40) * 180 - 90}deg)` }}>
                                <div className="w-1 h-full bg-slate-800 mx-auto"></div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-4 bg-white z-10"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-4 -mt-4 mb-4">
                        <span>0 (مثالي)</span>
                        <span>40+ (مشتت)</span>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-700">{homogeneityIndex.toFixed(1)}</p>
                    </div>
                </div>

                {/* C. Matrix: Updated Terminology with Elegant Tooltips */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all group lg:col-span-3 xl:col-span-1 relative"
                    onClick={showMatrixInsight}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Puzzle size={20} className="text-purple-500"/>
                            مصفوفة التوازن (الآلية / المنطق)
                        </h3>
                        <Info size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors"/>
                    </div>
                    
                    <div className="flex gap-6 items-center justify-center relative">
                        {/* CUSTOM ELEGANT TOOLTIP */}
                        {hoveredMatrixZone && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl w-48 text-center animate-in zoom-in-95 duration-200 border border-slate-600 pointer-events-none">
                                <div className="text-xs font-bold mb-1 border-b border-slate-600 pb-1">
                                    {hoveredMatrixZone === 'q1' && "تعثر إجرائي"}
                                    {hoveredMatrixZone === 'q2' && "تحكم شامل"}
                                    {hoveredMatrixZone === 'q3' && "تعثر شامل"}
                                    {hoveredMatrixZone === 'q4' && "حساب آلي"}
                                </div>
                                <div className="text-[10px] text-slate-300 leading-tight">
                                    {hoveredMatrixZone === 'q1' && "ذكي رياضياً (يفهم) لكن يخطئ في الحساب"}
                                    {hoveredMatrixZone === 'q2' && "توازن ممتاز بين الفهم والأداء"}
                                    {hoveredMatrixZone === 'q3' && "صعوبات في بناء مفهوم العدد"}
                                    {hoveredMatrixZone === 'q4' && "يحفظ الجداول ولا يفهم المعنى"}
                                </div>
                                {/* Arrow */}
                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800/90 rotate-45 border-r border-b border-slate-600"></div>
                            </div>
                        )}

                        <div className="aspect-square w-52 relative bg-slate-50 rounded-xl border border-slate-200 p-2 grid grid-cols-2 grid-rows-2 gap-1 shrink-0">
                            {/* Top Left: Logic High, Calc Low */}
                            <div 
                                className="bg-blue-100 rounded flex flex-col items-center justify-center relative hover:bg-blue-200 transition-colors"
                                onMouseEnter={() => setHoveredMatrixZone('q1')}
                                onMouseLeave={() => setHoveredMatrixZone(null)}
                            >
                                <span className="text-xs font-bold text-blue-800">{Math.round((performanceMatrix.procedural_issue / performanceMatrix.total)*100)}%</span>
                                <span className="text-[9px] text-blue-600 font-bold mt-1">تعثر إجرائي</span>
                            </div>
                            {/* Top Right: Logic High, Calc High */}
                            <div 
                                className="bg-emerald-100 rounded flex flex-col items-center justify-center relative hover:bg-emerald-200 transition-colors"
                                onMouseEnter={() => setHoveredMatrixZone('q2')}
                                onMouseLeave={() => setHoveredMatrixZone(null)}
                            >
                                <span className="text-xs font-bold text-emerald-800">{Math.round((performanceMatrix.balanced_high / performanceMatrix.total)*100)}%</span>
                                <span className="text-[9px] text-emerald-600 font-bold mt-1">تحكم شامل</span>
                            </div>
                            {/* Bottom Left: Logic Low, Calc Low */}
                            <div 
                                className="bg-red-100 rounded flex flex-col items-center justify-center relative hover:bg-red-200 transition-colors"
                                onMouseEnter={() => setHoveredMatrixZone('q3')}
                                onMouseLeave={() => setHoveredMatrixZone(null)}
                            >
                                <span className="text-xs font-bold text-red-800">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                                <span className="text-[9px] text-red-600 font-bold mt-1">تعثر شامل</span>
                            </div>
                            {/* Bottom Right: Logic Low, Calc High */}
                            <div 
                                className="bg-yellow-100 rounded flex flex-col items-center justify-center relative hover:bg-yellow-200 transition-colors"
                                onMouseEnter={() => setHoveredMatrixZone('q4')}
                                onMouseLeave={() => setHoveredMatrixZone(null)}
                            >
                                <span className="text-xs font-bold text-yellow-800">{Math.round((performanceMatrix.rote_learning / performanceMatrix.total)*100)}%</span>
                                <span className="text-[9px] text-yellow-600 font-bold mt-1">حساب آلي</span>
                            </div>
                            
                            {/* Axis Labels */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 font-bold tracking-widest">المنطق</div>
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest">الحساب</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CRITERIA HEATMAP */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Target size={20} className="text-red-500"/> تحليل المعايير (الأضعف فالأقوى)</h3>
                    
                    {/* Legend */}
                    <div className="flex gap-3 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span>أ (تحكم أقصى)</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><span>ب (تحكم مقبول)</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-400 rounded-full"></div><span>ج (تحكم جزئي)</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div><span>د (تحكم محدود)</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {criterionAnalysis.map((crit, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className="bg-white text-slate-500 text-[10px] px-2 py-1 rounded border border-slate-200 font-bold">{crit.compId === 'control_numbers' ? 'عد وحساب' : 'حل مشكلات'}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${crit.successRate < 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{Math.round(crit.successRate)}% نجاح</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-3 relative z-10">{crit.label}</h4>
                            <div className="flex h-2 rounded-full overflow-hidden mb-2 relative z-10">
                                <div className="bg-emerald-500" style={{ width: `${(crit.stats.A / crit.stats.total)*100}%` }}></div>
                                <div className="bg-blue-400" style={{ width: `${(crit.stats.B / crit.stats.total)*100}%` }}></div>
                                <div className="bg-orange-400" style={{ width: `${(crit.stats.C / crit.stats.total)*100}%` }}></div>
                                <div className="bg-red-400" style={{ width: `${(crit.stats.D / crit.stats.total)*100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono relative z-10 font-bold mt-2 pt-2 border-t border-slate-200">
                                <span>{crit.stats.A + crit.stats.B} متحكم</span>
                                <span>{crit.stats.C + crit.stats.D} متعثر</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. REMEDIAL LISTS (Class Scope) */}
            {scope === 'class' && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 border-t-4 border-t-red-500 mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><PenTool size={20} className="text-red-500"/> قوائم المعالجة (الرياضيات)</h3>
                        <span className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-bold">اضغط للتشخيص الدقيق</span>
                    </div>
                    
                    <div className="masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {YEAR2_MATH_DEF.competencies.map(comp => (
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
        </div>
    );
};

export default AcqYear2MathStats;