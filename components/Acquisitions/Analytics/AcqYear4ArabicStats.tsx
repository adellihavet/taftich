
import React, { useMemo, useState } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR4_ARABIC_DEF } from '../../../constants/acqYear4Arabic';
import { BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, School, Scale, Activity, X, Info, BookOpen, PenTool, User, Stethoscope, BrainCircuit, Microscope, Puzzle, FileText } from 'lucide-react';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

const AcqYear4ArabicStats: React.FC<Props> = ({ records, scope, contextName }) => {
    
    const [activeInsight, setActiveInsight] = useState<{ title: string; definition: string; pedagogicalRef: string; content: React.ReactNode } | null>(null);
    const [hoveredMatrixZone, setHoveredMatrixZone] = useState<string | null>(null);
    const [selectedStudentDiag, setSelectedStudentDiag] = useState<{ 
        studentName: string; 
        profileType: string; 
        diagnosis: string;
        remedy: string;
        scores: { oral: number, written: number };
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

    // B. Calculate Scores (Year 4 Logic: 4 Competencies)
    const studentAnalysis = useMemo(() => {
        return allStudents.map(s => {
            let totalPoints = 0;
            let maxPoints = 0;
            
            // Axes
            let oralAxisPoints = 0;
            let oralAxisMax = 0; // Comp 1 (Oral) + Comp 2 (Reading)
            
            let writtenAxisPoints = 0;
            let writtenAxisMax = 0; // Comp 3 (Comp) + Comp 4 (Prod)

            YEAR4_ARABIC_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) {
                        const pts = g === 'A' ? 3 : g === 'B' ? 2 : g === 'C' ? 1 : 0;
                        maxPoints += 3;
                        totalPoints += pts;

                        if (comp.id === 'oral_comms' || comp.id === 'reading_perf') {
                            oralAxisPoints += pts; 
                            oralAxisMax += 3;
                        } else {
                            writtenAxisPoints += pts; 
                            writtenAxisMax += 3;
                        }
                    }
                });
            });

            const percent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
            const oralPct = oralAxisMax > 0 ? (oralAxisPoints / oralAxisMax) * 100 : 0;
            const writtenPct = writtenAxisMax > 0 ? (writtenAxisPoints / writtenAxisMax) * 100 : 0;

            return { ...s, percent, oralPct, writtenPct };
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
            YEAR4_ARABIC_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) { counts[g]++; counts.total++; }
                });
            });
        });
        if (counts.total === 0) counts.total = 1;
        return counts;
    }, [allStudents]);

    // Matrix (Oral/Reading Axis vs Written/Prod Axis)
    const performanceMatrix = useMemo(() => {
        const counts = { balanced_high: 0, oral_dominant: 0, written_dominant: 0, struggling: 0, total: 0 };
        studentAnalysis.forEach(s => {
            const highOral = s.oralPct >= 50;
            const highWritten = s.writtenPct >= 50;
            
            if (highOral && highWritten) counts.balanced_high++;
            else if (highOral && !highWritten) counts.oral_dominant++; // Q2: Good speaker/reader, bad writer
            else if (!highOral && !highWritten) counts.struggling++; // Q3
            else counts.written_dominant++; // Q4: Quiet but good writer
            
            counts.total++;
        });
        return counts;
    }, [studentAnalysis]);

    // Criterion Heatmap
    const criterionAnalysis = useMemo(() => {
        return YEAR4_ARABIC_DEF.competencies.flatMap(comp => 
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

    // --- HELPER: Contextual Advice for Year 4 ---
    const getContextualAdvice = (label: string): string => {
        if (label.includes('آداب الاستماع')) return "قد يعاني التلميذ من تشتت الانتباه أو فرط الحركة، مما يمنعه من التركيز في الخطاب.";
        if (label.includes('فكرته الأساسية')) return "صعوبة في التجريد والتلخيص. التلميذ قد يغرق في التفاصيل ولا يلتقط المعنى العام.";
        if (label.includes('مسترسلة')) return "قد يشير إلى نقص في الرصيد اللغوي أو عدم آلية القراءة، مما يعيق الفهم الآني.";
        if (label.includes('معبرة')) return "غياب التلوين الصوتي قد يعكس عدم فهم المقروء، أو مجرد خجل يحتاج لتعزيز الثقة.";
        if (label.includes('التحليل النحوي')) return "احتمال وجود خلط في وظائف الكلمات (فاعل/مفعول به). يحتاج لتمارين التلوين والاستبدال.";
        if (label.includes('التحويل الصرفي')) return "قد يكون التلميذ غير متمكن من جداول التصريف (الماضي/المضارع) مع الضمائر المختلفة.";
        if (label.includes('الرسم الإملائي')) return "الأخطاء قد تكون بصرية (التاء المربوطة/المفتوحة) أو سمعية. يجب تحليل نوع الخطأ بدقة.";
        if (label.includes('ترابط الأفكار')) return "ضعف في أدوات الربط والانسجام. يحتاج لتدريبات ترتيب الجمل وتلخيص القصص.";
        if (label.includes('جودة المنتج')) return "قد يتعلق الأمر بـ 'عسر الكتابة' (Dysgraphia) أو مجرد تسرع وعدم تنظيم.";
        return "هذا المعيار يتطلب مراجعة دقيقة لورقة التلميذ لتحديد مكامن الخلل بدقة.";
    };

    // --- INSIGHT HANDLERS (UPDATED for Year 4) ---
    const showMatrixInsight = () => {
        const total = performanceMatrix.total || 1;
        setActiveInsight({
            title: "تحليل مصفوفة التوازن (الاستقبال / الإنتاج)",
            definition: "مقارنة بين كفاءات 'التلقي' (فهم المنطوق/المكتوب) وكفاءات 'الإنتاج' (التعبير الكتابي/النحوي).",
            pedagogicalRef: "في السنة الرابعة، الفجوة بين الفهم والإنتاج طبيعية، لكن اتساعها مؤشر خطر. التلميذ الذي يفهم ولا ينتج قد يفتقد 'أدوات الربط' و 'الرصيد الوظيفي'.",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/50">
                            <span className="block text-2xl font-bold text-blue-400">{Math.round((performanceMatrix.oral_dominant/total)*100)}%</span>
                            <span className="text-xs text-blue-200 font-bold block mb-1">فهم &gt; إنتاج</span>
                            <p className="text-[10px] text-gray-400 leading-tight">يستوعب النصوص لكنه يعجز عن التحرير السليم (ضعف هيكلة).</p>
                        </div>
                        <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/50">
                            <span className="block text-2xl font-bold text-yellow-400">{Math.round((performanceMatrix.written_dominant/total)*100)}%</span>
                            <span className="text-xs text-yellow-200 font-bold block mb-1">إنتاج &gt; فهم</span>
                            <p className="text-[10px] text-gray-400 leading-tight">حفظ القوالب الجاهزة أو النقل الآلي دون استيعاب المعنى العميق.</p>
                        </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded border border-white/10 text-xs text-gray-300 leading-relaxed text-justify">
                        <strong>تنويه تربوي:</strong> الحالات المتواجدة في المنطقة (فهم &gt; إنتاج) هي الأكثر شيوعاً في السنة الرابعة. التدخل هنا يجب أن يركز على "ورشات الكتابة" والتدريب على التخطيط للموضوع قبل تحريره.
                    </div>
                </div>
            )
        });
    };

    const showHomogeneityInsight = () => {
        setActiveInsight({
            title: "مؤشر التجانس (السياق: نهاية الطور الثاني)",
            definition: "قياس مدى تقارب مستويات المتعلمين في مرحلة مفصلية (السنة الرابعة).",
            pedagogicalRef: "التشتت في السنة الرابعة أخطر منه في السنوات الأولى. هو نتاج تراكمات سنوات سابقة. وجود فجوة كبيرة هنا يعني أن هناك فئة قد تواجه صعوبة حقيقية في السنة الخامسة.",
            content: (
                <div className="text-center space-y-3">
                    <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-xl border border-purple-500/50">
                        <span className="text-4xl font-bold text-purple-400 font-mono">{homogeneityIndex.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-300 bg-white/5 p-3 rounded border border-white/10">
                        {homogeneityIndex < 18 
                            ? "مؤشر إيجابي: القسم يسير ككتلة واحدة، مما يسهل تنفيذ المناهج." 
                            : homogeneityIndex < 30
                            ? "تشتت متوسط: يتطلب تفعيل العمل الفوجي لتقليص الفوارق."
                            : "تشتت مرتفع: حالة تستدعي دق ناقوس الخطر. هناك فئة معزولة عن ركب التعلم."}
                    </p>
                </div>
            )
        });
    };

    const showDistributionInsight = () => {
        const total = gradeDistribution.total || 1;
        const ab = gradeDistribution.A + gradeDistribution.B;
        const cd = gradeDistribution.C + gradeDistribution.D;

        setActiveInsight({
            title: "توزيع التحكم (الكمي والنوعي)",
            definition: "نظرة شمولية لمردود القسم في اللغة العربية.",
            pedagogicalRef: "في اللغات، لا نكتفي بالنسب العامة. تراكم التعثرات في (ج+د) يعني أن الكفاءات القاعدية (قراءة، كتابة، تعبير) لم تثبت، مما يعيق تعلم المواد الأخرى (رياضيات، علمية).",
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-900/30 p-3 rounded border border-emerald-700/50">
                        <span className="text-emerald-200 text-sm font-bold">متحكمون (أ+ب)</span>
                        <span className="text-2xl font-bold text-white">{Math.round((ab/total)*100)}%</span>
                    </div>
                    <div className="flex items-center justify-between bg-red-900/30 p-3 rounded border border-red-700/50">
                        <span className="text-red-200 text-sm font-bold">متعثرون (ج+د)</span>
                        <span className="text-2xl font-bold text-white">{Math.round((cd/total)*100)}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        * نسبة التعثر تشمل المعايير الجزئية وليس بالضرورة الرسوب الكلي.
                    </p>
                </div>
            )
        });
    };

    // --- STUDENT DIAGNOSIS (Revised tone) ---
    const handleStudentDiagnosis = (student: any, criterion?: { id: number, label: string }) => {
        const oral = student.oralPct;
        const written = student.writtenPct;
        const gap = oral - written;

        let profileType = '';
        let diagnosis = '';
        let remedy = '';

        if (gap > 25) {
            profileType = "استيعاب شفوي جيد / تعثر كتابي";
            diagnosis = "التلميذ يظهر مشاركة فعالة وفهماً جيداً عند النقاش الشفوي، لكن أداءه يتراجع ملحوظاً عند التحرير. قد يعود ذلك لضعف في التحكم في الرسم الإملائي أو قواعد النحو الوظيفي.";
            remedy = "يُنصح بعدم محاسبته بقسوة على الأخطاء الإملائية في البداية لتشجيعه على التعبير. تكثيف تمارين 'ترتيب الجمل' و 'ملء الفراغات' لبناء الثقة الكتابية.";
        } else if (gap < -25) {
            profileType = "أداء كتابي جيد / انطواء شفوي";
            diagnosis = "نتائج التلميذ في الأنشطة الكتابية جيدة، مما يدل على استيعاب للموارد. ضعفه الشفوي قد لا يكون معرفياً بل نفسياً (خجل، تردد) أو نقصاً في سرعة المعالجة اللفظية.";
            remedy = "تفعيل استراتيجيات العمل الثنائي (Pair Work) لتقليل توتر المواجهة. منحه وقتاً أطول للتحضير قبل طلب الإجابة الشفوية.";
        } else if (oral < 40 && written < 40) {
            profileType = "تعثر في الكفاءات القاعدية";
            diagnosis = "النتائج تشير إلى صعوبات تمتد لتشمل القراءة والفهم والإنتاج. هذا الوضع قد يوحي بفجوات في مكتسبات السنوات السابقة (الثانية والثالثة).";
            remedy = "يحتاج لخطة دعم فردية (PPRE) تركز على الأساسيات: القراءة المسترسلة، الإملاء المنظور، وتكوين جمل بسيطة.";
        } else {
            profileType = "نمو متوازن";
            diagnosis = "التلميذ يسير بنسق طبيعي، مع وجود توازن بين ما يفهمه وما ينتجه. الأخطاء المسجلة تقع ضمن دائرة التعلم الطبيعي.";
            remedy = "الحفاظ على النسق الحالي مع تعريضه لنصوص ووضعيات أكثر ثراءً لتنمية رصيده اللغوي.";
        }

        let clickedCriterion = undefined;
        if (criterion) {
            clickedCriterion = {
                label: criterion.label,
                advice: getContextualAdvice(criterion.label)
            };
        }

        setSelectedStudentDiag({
            studentName: student.fullName,
            profileType, diagnosis, remedy,
            scores: { oral, written },
            clickedCriterion
        });
    };

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">
            
            {/* INSIGHT MODAL */}
            {activeInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveInsight(null)}>
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Info size={20} className="text-blue-400"/> {activeInsight.title}</h3>
                            <button onClick={() => setActiveInsight(null)} className="text-slate-400 hover:text-white"><X/></button>
                        </div>
                        <p className="text-slate-300 text-sm mb-4 italic border-r-2 border-slate-700 pr-3">"{activeInsight.definition}"</p>
                        <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 mb-4">
                            <h4 className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1"><BookOpen size={12}/> قراءة تربوية:</h4>
                            <p className="text-xs text-blue-200 leading-relaxed text-justify">{activeInsight.pedagogicalRef}</p>
                        </div>
                        {activeInsight.content}
                    </div>
                </div>
            )}

            {/* STUDENT MODAL */}
            {selectedStudentDiag && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedStudentDiag(null)}>
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                                    <User size={20} className="text-slate-300"/>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{selectedStudentDiag.studentName}</h3>
                                    <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 block w-fit mt-1">{selectedStudentDiag.profileType}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudentDiag(null)} className="text-slate-400 hover:text-white"><X/></button>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Stethoscope size={14}/> قراءة في النتائج</h4>
                                <p className="text-sm text-slate-300 leading-relaxed text-justify">{selectedStudentDiag.diagnosis}</p>
                            </div>
                            
                            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-800/50">
                                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><BrainCircuit size={14}/> مقترحات التوجيه</h4>
                                <p className="text-sm text-emerald-100 leading-relaxed text-justify">{selectedStudentDiag.remedy}</p>
                            </div>

                            {selectedStudentDiag.clickedCriterion && (
                                <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-800/50 animate-in slide-in-from-bottom-2">
                                    <h4 className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Microscope size={14}/> المعيار: {selectedStudentDiag.clickedCriterion.label}</h4>
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
                    <div className="absolute top-0 right-0 p-10 opacity-10"><FileText size={150} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase tracking-widest text-xs">
                            {scope === 'district' ? 'تحليل شامل للمقاطعة' : scope === 'school' ? 'تحليل المؤسسة' : 'تحليل الفوج'}
                        </div>
                        <h2 className="text-4xl font-bold font-serif mb-2">{YEAR4_ARABIC_DEF.label}</h2>
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
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-8 -mt-2 mb-2">
                        <span>متجانس</span>
                        <span>مشتت</span>
                    </div>
                    <div className="text-center text-3xl font-bold text-purple-700">{homogeneityIndex.toFixed(1)}</div>
                </div>

                {/* Matrix (4AP Specific) */}
                <div 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-teal-300 transition-all group relative lg:col-span-3 xl:col-span-1"
                    onClick={showMatrixInsight}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Puzzle size={20} className="text-teal-500"/> مصفوفة (شفوي/كتابي)</h3>
                        <Info size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors"/>
                    </div>
                    
                    <div className="flex gap-6 items-center justify-center relative">
                        {hoveredMatrixZone && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 text-white p-2 rounded text-xs w-40 text-center animate-in zoom-in-95 duration-200">
                                {hoveredMatrixZone === 'q1' && "طليق اللسان (ضعف كتابي)"}
                                {hoveredMatrixZone === 'q2' && "تحكم شامل (متوازن)"}
                                {hoveredMatrixZone === 'q3' && "تعثر شامل"}
                                {hoveredMatrixZone === 'q4' && "كاتب صامت (خجل)"}
                                {/* Arrow */}
                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800/90 rotate-45"></div>
                            </div>
                        )}

                        <div className="aspect-square w-52 relative bg-slate-50 rounded-xl border border-slate-200 p-2 grid grid-cols-2 grid-rows-2 gap-1 shrink-0">
                            <div className="bg-blue-100 rounded flex flex-col items-center justify-center hover:bg-blue-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q1')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-blue-800">{Math.round((performanceMatrix.oral_dominant / performanceMatrix.total)*100)}%</span>
                            </div>
                            <div className="bg-emerald-100 rounded flex flex-col items-center justify-center hover:bg-emerald-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q2')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-emerald-800">{Math.round((performanceMatrix.balanced_high / performanceMatrix.total)*100)}%</span>
                            </div>
                            <div className="bg-red-100 rounded flex flex-col items-center justify-center hover:bg-red-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q3')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-red-800">{Math.round((performanceMatrix.struggling / performanceMatrix.total)*100)}%</span>
                            </div>
                            <div className="bg-yellow-100 rounded flex flex-col items-center justify-center hover:bg-yellow-200 transition-colors" onMouseEnter={() => setHoveredMatrixZone('q4')} onMouseLeave={() => setHoveredMatrixZone(null)}>
                                <span className="text-xs font-bold text-yellow-800">{Math.round((performanceMatrix.written_dominant / performanceMatrix.total)*100)}%</span>
                            </div>
                            
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 font-bold tracking-widest">كتابي</div>
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest">شفوي</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CRITERIA HEATMAP (19 Criteria) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Target size={20} className="text-red-500"/> ترتيب المعايير (من الأضعف للأقوى)</h3>
                    
                    {/* Legend (ADDED) */}
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
                                    {crit.compId === 'oral_comms' ? 'تواصل شفوي' : 
                                     crit.compId === 'reading_perf' ? 'أداء قرائي' : 
                                     crit.compId === 'written_comp' ? 'فهم مكتوب' : 'إنتاج كتابي'}
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
                            {/* Summary Footer (ADDED) */}
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
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><PenTool size={20} className="text-red-500"/> قوائم المعالجة (السنة الرابعة)</h3>
                        <span className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-bold">اضغط للتشخيص الدقيق</span>
                    </div>
                    
                    <div className="masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {YEAR4_ARABIC_DEF.competencies.map(comp => (
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

export default AcqYear4ArabicStats;