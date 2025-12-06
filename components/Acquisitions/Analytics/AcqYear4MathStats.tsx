import React, { useMemo, useState } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR4_MATH_DEF } from '../../../constants/acqYear4Math';
import { BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, School, Scale, Activity, X, Info, HelpCircle, Calculator, BrainCircuit, Microscope, Puzzle, Stethoscope, PenTool, BookOpen, Ruler, Hash, Sigma, Zap } from 'lucide-react';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

const AcqYear4MathStats: React.FC<Props> = ({ records, scope, contextName }) => {
    
    const [activeInsight, setActiveInsight] = useState<{ title: string; definition: string; pedagogicalRef: string; content: React.ReactNode } | null>(null);
    const [hoveredMatrixZone, setHoveredMatrixZone] = useState<string | null>(null);
    const [selectedStudentDiag, setSelectedStudentDiag] = useState<{ 
        studentName: string; 
        profileType: string; 
        diagnosis: string;
        remedy: string;
        scores: { resources: number, solving: number };
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

    // Calculate Scores (Deterministic Logic)
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

    // --- EXACT MATHEMATICAL ADVICE ENGINE ---
    const getMathAdvice = (label: string): string => {
        // Criterion 1: Numbers (Fractions/Decimals)
        if (label.includes('الأعداد') || label.includes('الكسور')) {
            return "يواجه التلميذ 'عائقاً إبستيمولوجياً' في الانتقال من الأعداد الطبيعية (المنفصلة) إلى الأعداد الناطقة (المتصلة). هو يتعامل مع (2.5) كعددين (2 و 5). العلاج: تفكيك العدد العشري إلى (جزء صحيح + كسور عشرية) واستخدام المستقيم المدرج لإدراك أن الكسر هو عدد محصور.";
        }
        // Criterion 2: Geometry
        if (label.includes('الهندسة') || label.includes('الفضاء')) {
            return "التلميذ ما زال في مرحلة 'الهندسة الحسية' (يعتمد على العين المجردة) ولم ينتقل إلى 'هندسة الخواص والأدوات'. يخلط بين (المعين) و(المربع) لغياب الزوايا القائمة في ذهنه. العلاج: الإنشاء الهندسي الصارم بالأدوات ووصف الأشكال بخصائصها (أضلاع، زوايا) لا بشكلها.";
        }
        // Criterion 3: Proportionality/Data
        if (label.includes('التناسبية') || label.includes('تنظيم')) {
            return "يسيطر عليه 'النموذج الجمعي' (كلما زاد، نزيد) ويفشل في إدراك 'العلاقة الضربية' (المرور للوحدة). العلاج: جداول تناسبية بسيطة من الواقع (وصفات طبخ، أثمان) والبحث عن معامل التناسبية (العدد السحري).";
        }
        // Solving Criteria
        if (label.includes('فهم المشكلة')) {
            return "مشكلة في 'الترجمة'. التلميذ يقرأ النص كقصة أدبية ولا يستخرج العلاقات الرياضية (الكلمات المفتاحية: وزع = قسمة، بقي = طرح). العلاج: تلوين المعطيات والمطلوب بألوان مختلفة، وتمثيل الوضعية بمخطط قبل الحل.";
        }
        if (label.includes('انسجام') || label.includes('الخوارزمية')) {
            return "غياب 'المعنى الرياضي للعمليات'. التلميذ يختار العملية عشوائياً (غالباً الجمع لأنه الأسهل). العلاج: ربط كل عملية بمدلولها (الجمع للضم، الطرح للفرق، الضرب للتكرار، القسمة للتوزيع والمقايسة).";
        }
        if (label.includes('الاستعمال السليم') || label.includes('الحساب')) {
            return "الخلل تقني (إجرائي). يختار العملية الصحيحة لكن يخطئ في التنفيذ (نسيان الاحتفاظ، خطأ في جدول الضرب). العلاج: التدريب الميكانيكي على الآلية والحساب الذهني اليومي.";
        }
        if (label.includes('التبليغ')) {
            return "التلميذ يصل للنتيجة لكنه يفشل في 'التواصل الرياضي' (ينسى الوحدة، لا يكتب الجملة، لا ينظم الورقة). العلاج: إلزامه بمنهجية الحل الثلاثية الصارمة (الحل/العمليات/الجواب) ومحاسبته على التنظيم.";
        }
        return "يتطلب هذا المعيار تدخلاً مباشراً لتصحيح التصورات الخاطئة.";
    };

    // --- EXACT DIAGNOSIS PROFILER ---
    const handleStudentDiagnosis = (student: any, criterion?: { id: number, label: string }) => {
        const res = student.resPct;
        const solv = student.solvPct;
        
        let profileType = '';
        let diagnosis = '';
        let remedy = '';

        // 1. Conceptual Gap (Resources < 40)
        if (res < 40) {
            profileType = "فجوة مفاهيمية (عدم بناء المفهوم)";
            diagnosis = "التلميذ يواجه صعوبة في 'بنية الرياضيات' ذاتها. المفاهيم الأساسية (الكسر، العشرية، التوازي) غير مبنية في ذهنه، لذلك يعجز عن استخدامها. الخلل ليس في الانتباه، بل في مرحلة التجريد.";
            remedy = "العودة الضرورية إلى 'المحسوس'. لا يمكن حل مشكلات حول الكسور وهو لا يدرك معنى (نصف) بالطي والقص. يجب إعادة بناء المفهوم من الصفر.";
        } 
        // 2. Procedural Gap (Resources High, Solving Low)
        else if (res >= 60 && solv < 40) {
            profileType = "غياب الترييض (عائق النقل)";
            diagnosis = "التلميذ يمتلك الأدوات (يحسب جيداً، يعرف القواعد) لكنه يفشل في 'استدعائها' عند الحاجة. هذه حالة كلاسيكية لـ 'انفصال المعرفة عن سياقها'. هو يعرف جدول الضرب، لكن لا يعرف متى يضرب في وضعية مشكلة.";
            remedy = "التدريب المكثف على 'ترييض المشكلات'. إعطاؤه وضعيات تتطلب اختيار الأداة فقط دون إجراء الحساب. سؤاله دائماً: 'لماذا اخترت هذه العملية؟'.";
        }
        // 3. Technical Gap (Solving High, Resources Low - Rare)
        else if (res < 50 && solv >= 60) {
            profileType = "ذكاء منطقي وهشاشة حسابية";
            diagnosis = "التلميذ يمتلك استدلالاً سليماً ويختار العمليات الصحيحة (يفهم المشكلة جيداً)، لكنه يضيع النقاط بسبب أخطاء حسابية تافهة أو نسيان للقواعد الهندسية. مشكلته في 'الدقة' وليس 'الفهم'.";
            remedy = "الصرامة في الحساب والتدرب على المراقبة الذاتية للنتائج (هل النتيجة معقولة؟). تكثيف الحساب الذهني السريع لتمتين الآلية.";
        }
        // 4. Balanced
        else {
            profileType = "تحكم متوازن ومستقر";
            diagnosis = "توازن إيجابي بين امتلاك الموارد المعرفية والقدرة على تجنيدها في وضعيات مركبة. هذا التلميذ جاهز للانتقال لمفاهيم السنة الخامسة.";
            remedy = "تعزيز القدرات بوضعيات إدماجية مركبة تتطلب تجنيد عدة موارد في آن واحد لتنمية الفكر التركيبي.";
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

    // --- INSIGHTS (DEEP PEDAGOGICAL CONTENT) ---
    
    const showMatrixInsight = () => {
        const total = performanceMatrix.total || 1;
        setActiveInsight({
            title: "تحليل المصفوفة: (امتلاك الموارد / كفاءة الحل)",
            definition: "تحليل العلاقة الجدلية بين 'المعرفة' و 'القدرة على التوظيف'.",
            pedagogicalRef: "الرياضيات ليست مجرد تخزين للمعلومات (ذاكرة)، بل هي ورشة عمل ذهنية. الفجوة بين الامتلاك والتطبيق تسمى 'عائق النقل الديداكتيكي'. التلميذ الذي يحفظ جدول الضرب (مورد) لكنه يجمع الأعداد في وضعية التكرار (منهجية)، يعاني من قطيعة في التعلم.",
            content: (
                <div className="space-y-4">
                    <div className="bg-white/5 p-3 rounded border border-white/10 text-sm mb-4">
                        <ul className="space-y-2 text-gray-300">
                            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div><span><strong>التحكم في الموارد (المعارف):</strong> القدرة على العد، الحساب، معرفة خواص الأشكال، وحفظ القوانين.</span></li>
                            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div><span><strong>المنهجية (التوظيف):</strong> فهم السند، ترجمة النص إلى مخطط، اختيار الأداة المناسبة، والتبرير.</span></li>
                        </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/50">
                            <span className="block text-2xl font-bold text-yellow-400">{Math.round((performanceMatrix.method_gap/total)*100)}%</span>
                            <span className="text-xs text-yellow-200 font-bold block mb-1">موارد {'>'} منهجية</span>
                            <p className="text-[10px] text-gray-400 leading-tight">"حفظ آلي": يملك الأداة ولا يعرف وظيفتها.</p>
                        </div>
                        <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/50">
                            <span className="block text-2xl font-bold text-blue-400">{Math.round((performanceMatrix.knowledge_gap/total)*100)}%</span>
                            <span className="text-xs text-blue-200 font-bold block mb-1">منهجية {'>'} موارد</span>
                            <p className="text-[10px] text-gray-400 leading-tight">"منطق سليم": يعرف الوظيفة وتخونه الأداة.</p>
                        </div>
                    </div>
                </div>
            )
        });
    };

    const showHomogeneityInsight = () => {
        setActiveInsight({
            title: "مؤشر التجانس (إنذار بيداغوجي)",
            definition: "درجة التقارب في استيعاب المفاهيم الرياضية التراكمية.",
            pedagogicalRef: "الرياضيات مادة ذات 'بناء هرمي' صارم (الضرب يعتمد على الجمع، القسمة تعتمد على الضرب). ارتفاع مؤشر التشتت يعني أن القسم منشطر زمنياً: فئة في 'الحاضر' (الدرس الحالي) وفئة مازالت في 'الماضي' (تعثرات سابقة). الحل ليس في إعادة الدرس، بل في 'التفويج المرن' لمعالجة الأساسيات المفقودة.",
            content: (
                <div className="text-center space-y-4">
                    <div className="inline-block px-6 py-2 bg-purple-500/20 rounded-xl border border-purple-500/50">
                        <span className="text-4xl font-bold text-purple-400 font-mono">{homogeneityIndex.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-300 bg-white/5 p-4 rounded border border-white/10 text-justify">
                        {homogeneityIndex > 25 
                            ? <span className="text-red-300"><strong>تشتت حاد (خطر):</strong> القسم يسير بسرعتين مختلفتين. التدريس الموحد سيعمق الفجوة ويزيد من 'التسرب المعرفي'. يجب اعتماد استراتيجية التعليم المتمايز فوراً.</span> 
                            : <span className="text-emerald-300"><strong>تجانس مقبول:</strong> الفوارق طبيعية ويمكن تسييرها داخل القسم عبر تنويع صعوبة الأنشطة (تفريد التعلم).</span>}
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
            title: "توزيع التحكم (تأشيرة العبور)",
            definition: "نظرة استشرافية لمدى جاهزية القسم لمناهج السنة الخامسة.",
            pedagogicalRef: "في السنة الرابعة، الرياضيات تنتقل من 'التفكير المحسوس' إلى بداية 'التفكير المجرد'. نسبة التحكم (أ+ب) هي مؤشر الأمان. تراكم التعثرات (ج+د) في هذا المستوى يعني أن التلميذ سيدخل السنة الخامسة وهو يفتقد لأدوات العمل الأساسية (الكسور، الآلية، الهندسة)، مما يجعله عرضة للفشل المدرسي.",
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-900/30 p-3 rounded border border-emerald-700/50">
                        <span className="text-emerald-200 text-sm font-bold">تحكم كافٍ (أ+ب)</span>
                        <span className="text-2xl font-bold text-white">{Math.round((ab/total)*100)}%</span>
                    </div>
                    <div className="flex items-center justify-between bg-red-900/30 p-3 rounded border border-red-700/50">
                        <span className="text-red-200 text-sm font-bold">هشاشة/تعثر (ج+د)</span>
                        <span className="text-2xl font-bold text-white">{Math.round((cd/total)*100)}%</span>
                    </div>
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 text-xs text-blue-200 text-justify leading-relaxed mt-2">
                        <strong>توصية:</strong> إذا تجاوزت نسبة الهشاشة 30%، فيجب تفعيل 'مشروع القسم' للتركيز على الكفاءات المستعرضة (الحساب الذهني، حل المشكلات) بشكل يومي ومكثف.
                    </div>
                </div>
            )
        });
    };

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">
            
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
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase tracking-widest text-xs">
                            {scope === 'district' ? 'تحليل شامل للمقاطعة' : scope === 'school' ? 'تحليل المؤسسة' : 'تحليل الفوج'}
                        </div>
                        <h2 className="text-4xl font-bold font-serif mb-2">{YEAR4_MATH_DEF.label}</h2>
                        <p className="text-slate-400 text-lg flex items-center gap-2"><School size={18}/> {contextName}</p>
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
                    onClick={showDistributionInsight}
                >
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
                    onClick={showHomogeneityInsight}
                >
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

                {/* Matrix (Resources vs Solving) */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-teal-300 transition-all group relative lg:col-span-3 xl:col-span-1"
                    onClick={showMatrixInsight}
                >
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
        </div>
    );
};

export default AcqYear4MathStats;