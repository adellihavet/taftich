
import React, { useMemo, useState } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR2_ARABIC_DEF } from '../../../constants/acqYear2Arabic';
import { BarChart3, Target, AlertTriangle, CheckCircle2, TrendingUp, LayoutGrid, Award, ArrowUpRight, ArrowDownRight, School, Scale, Activity, X, Info, HelpCircle, GitCompare, BookOpen, PenTool, User, Stethoscope, BrainCircuit, Microscope, Calculator, Puzzle, FileText } from 'lucide-react';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

const AcqYear2ArabicStats: React.FC<Props> = ({ records, scope, contextName }) => {
    
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
        scores: { oral: number, written: number };
        gap: number;
        clickedCriterion?: { label: string, advice: string };
    } | null>(null);

    // --- 1. DATA PREPARATION ---

    // A. Flatten Students
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

    // B. Calculate Scores & Matrices
    const studentAnalysis = useMemo(() => {
        return allStudents.map(s => {
            let totalPoints = 0;
            let maxPoints = 0;
            
            // Comp 1: Reading (Oral)
            let oralPoints = 0;
            let oralMax = 0;
            
            // Comp 2: Writing (Comprehension)
            let writtenPoints = 0;
            let writtenMax = 0;

            YEAR2_ARABIC_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) {
                        const pts = g === 'A' ? 3 : g === 'B' ? 2 : g === 'C' ? 1 : 0;
                        maxPoints += 3;
                        totalPoints += pts;

                        if (comp.id === 'reading_performance') {
                            oralPoints += pts; oralMax += 3;
                        } else {
                            writtenPoints += pts; writtenMax += 3;
                        }
                    }
                });
            });

            const percent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
            const oralPct = oralMax > 0 ? (oralPoints / oralMax) * 100 : 0;
            const writtenPct = writtenMax > 0 ? (writtenPoints / writtenMax) * 100 : 0;

            return { ...s, percent, oralPct, writtenPct };
        });
    }, [allStudents]);

    // C. Group Data (Ranking)
    const groupedData = useMemo(() => {
        const groups: Record<string, { 
            name: string; 
            stats: { A: number, B: number, C: number, D: number, total: number };
            scores: { reading: number, writing: number, global: number }; 
        }> = {};

        allStudents.forEach(s => {
            const key = scope === 'district' ? s.schoolName : s.className;
            if (!groups[key]) {
                groups[key] = { 
                    name: key, 
                    stats: { A: 0, B: 0, C: 0, D: 0, total: 0 },
                    scores: { reading: 0, writing: 0, global: 0 }
                };
            }
        });

        // Recalculate averages per group
        const groupScoresCalc: Record<string, {orals: number[], writtens: number[], globals: number[]}> = {};
        studentAnalysis.forEach(s => {
            const key = scope === 'district' ? s.schoolName : s.className;
            if(!groupScoresCalc[key]) groupScoresCalc[key] = {orals: [], writtens: [], globals: []};
            groupScoresCalc[key].orals.push(s.oralPct);
            groupScoresCalc[key].writtens.push(s.writtenPct);
            groupScoresCalc[key].globals.push(s.percent);
        });

        Object.keys(groups).forEach(key => {
            const data = groupScoresCalc[key];
            if (data && data.globals.length > 0) {
                groups[key].scores.global = data.globals.reduce((a,b)=>a+b,0) / data.globals.length;
                groups[key].scores.reading = data.orals.reduce((a,b)=>a+b,0) / data.orals.length;
                groups[key].scores.writing = data.writtens.reduce((a,b)=>a+b,0) / data.writtens.length;
            }
        });

        return Object.values(groups).sort((a, b) => b.scores.global - a.scores.global);
    }, [allStudents, studentAnalysis, scope]);

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
            YEAR2_ARABIC_DEF.competencies.forEach(comp => {
                comp.criteria.forEach(crit => {
                    const g = getGrade(s, comp.id, crit.id);
                    if (g) { 
                        counts[g]++; 
                        counts.total++; 
                    }
                });
            });
        });
        if (counts.total === 0) counts.total = 1;
        return counts;
    }, [allStudents]);

    // G. Matrix Data (Oral vs Written)
    // Logic:
    // Q1 (Top Right): High Oral & High Written (Green) -> Balanced High
    // Q2 (Top Left): High Oral & Low Written (Yellow/Blue) -> Fluent but poor comprehension (Reading Machine)
    // Q3 (Bottom Left): Low Oral & Low Written (Red) -> Global Struggle
    // Q4 (Bottom Right): Low Oral & High Written (Orange) -> Understands but poor decoding (Dyslexic profile?)
    const performanceMatrix = useMemo(() => {
        const counts = { balanced_high: 0, rote_reading: 0, struggling: 0, decoding_issue: 0, total: 0 };
        studentAnalysis.forEach(s => {
            const highOral = s.oralPct >= 50;
            const highWritten = s.writtenPct >= 50;
            
            if (highOral && highWritten) counts.balanced_high++;
            else if (highOral && !highWritten) counts.rote_reading++; // Good voice, bad meaning
            else if (!highOral && !highWritten) counts.struggling++; // Bad both
            else counts.decoding_issue++; // Bad voice, good meaning
            
            counts.total++;
        });
        return counts;
    }, [studentAnalysis]);

    // H. Criterion Heatmap
    const criterionAnalysis = useMemo(() => {
        return YEAR2_ARABIC_DEF.competencies.flatMap(comp => 
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


    // --- HANDLERS FOR GENERAL INSIGHTS ---
    const showDistributionInsight = () => {
        const a = gradeDistribution.A;
        const b = gradeDistribution.B;
        const cd = gradeDistribution.C + gradeDistribution.D;
        const total = gradeDistribution.total;
        
        setActiveInsight({
            title: "منحنى التوزيع الطبيعي",
            definition: "مؤشر إحصائي يقيس مدى اعتدال النتائج. الوضع الطبيعي هو أن تتمركز الأغلبية في الوسط (ب)، مع قلة في الامتياز (أ) وقلة في التعثر (ج/د).",
            pedagogicalRef: "يعكس هذا المؤشر 'صورة القسم'. التوزيع الطبيعي يفترض وجود أغلبية في الوسط. الانحراف نحو اليسار (تعثر) يتطلب مراجعة استراتيجيات التدريس الأساسية.",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-emerald-500/20 p-2 rounded border border-emerald-500/50">
                            <span className="block text-2xl font-bold text-emerald-400">{Math.round((a/total)*100)}%</span>
                            <span className="text-[10px] text-emerald-200">تحكم أقصى</span>
                        </div>
                        <div className="bg-blue-500/20 p-2 rounded border border-blue-500/50">
                            <span className="block text-2xl font-bold text-blue-400">{Math.round((b/total)*100)}%</span>
                            <span className="text-[10px] text-blue-200">تحكم مقبول</span>
                        </div>
                        <div className="bg-red-500/20 p-2 rounded border border-red-500/50">
                            <span className="block text-2xl font-bold text-red-400">{Math.round((cd/total)*100)}%</span>
                            <span className="text-[10px] text-red-200">تعثر (ج+د)</span>
                        </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded border border-white/10 text-sm leading-relaxed text-gray-300 font-medium">
                        {a + b > cd 
                            ? "المنحنى يميل نحو الإيجابية (تحكم جيد). هذا يعكس استيعاباً جيداً للموارد، لكن يجب الحذر من تضخم العلامات إذا كانت نسبة التميز مرتفعة جداً."
                            : "المنحنى يميل نحو السلبية (تعثر). وجود كتلة كبيرة في خانة التعثر يستدعي مراجعة طرائق التدريس الأساسية."}
                    </div>
                </div>
            )
        });
    };

    const showHomogeneityInsight = () => {
        setActiveInsight({
            title: "مؤشر التجانس داخل القسم",
            definition: "مقياس يحدد مدى تقارب أو تباعد مستويات التلاميذ. كلما كان الرقم صغيراً، كان القسم متجانساً.",
            pedagogicalRef: "يستند إلى 'بيداغوجيا الفوارق'. إذا كان التشتت كبيراً، فإن الدرس الموحد سيظلم فئة على حساب أخرى. التجانس يسهل المهمة، والتشتت يفرض التفويج.",
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-gray-300">قيمة المؤشر:</span>
                        <span className="text-2xl font-bold text-purple-400 font-mono">{homogeneityIndex.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed space-y-2">
                        {homogeneityIndex < 15 ? (
                            <p><strong className="text-emerald-400">فئة متجانسة جداً:</strong> الفوارق بين التلاميذ بسيطة. هذا الوضع يسهل التدريس الجماعي الموحد.</p>
                        ) : homogeneityIndex < 25 ? (
                            <p><strong className="text-yellow-400">فئة عادية (متوسطة التجانس):</strong> توجد فوارق طبيعية بين التلاميذ، تسمح بالمنافسة والتعلم بالأقران.</p>
                        ) : (
                            <p><strong className="text-purple-400">فئة مشتتة (غير متجانسة):</strong> توجد هوة كبيرة بين النجباء والمتعثرين. التدريس الموحد سيفشل هنا، والحل هو التفويج (البيداغوجيا الفارقية).</p>
                        )}
                    </div>
                </div>
            )
        });
    };

    const showMatrixInsight = () => {
        const total = performanceMatrix.total || 1;
        const q_rote = Math.round((performanceMatrix.rote_reading / total) * 100); 
        const q_decoding = Math.round((performanceMatrix.decoding_issue / total) * 100); 

        setActiveInsight({
            title: "مصفوفة التوازن (شفوي/كتابي)",
            definition: "أداة تشخيصية تقارن كفاءة 'الأداء القرائي' بكفاءة 'فهم المكتوب'. تكشف عن نوعية التعلم (هل هو حفظ آلي أم فهم عميق).",
            pedagogicalRef: "مستمدة من نماذج القراءة (Simple View of Reading). القراءة ليست مجرد فك ترميز (Decoding) بل هي نتاج: فك ترميز × فهم لغوي. أي خلل في أحدهما يؤثر على النتيجة.",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white/5 p-2 rounded border border-white/10">
                            <span className="block text-xl font-bold text-yellow-400">{q_rote}%</span>
                            <span className="text-[10px] text-gray-400">قراءة آلية</span>
                            <p className="text-[9px] text-gray-500 mt-1">يقرأ بطلاقة لكن الفهم ضعيف</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/10">
                            <span className="block text-xl font-bold text-blue-400">{q_decoding}%</span>
                            <span className="text-[10px] text-gray-400">تعثر في فك الرمز</span>
                            <p className="text-[9px] text-gray-500 mt-1">يفهم المعنى لكن يتهجى ببطء</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed font-medium">
                        {q_rote > 20 ? 
                            <span className="text-yellow-200">تحذير: نسبة عالية من التلاميذ يعانون من 'القرائية الآلية'. هم يركزون على التهجئة والنطق الصحيح دون الوصول للمعنى. يجب التركيز على أنشطة الفهم الضمني والاستنتاج.</span> : 
                            <span className="text-green-200">التوازن بين القراءة والفهم مقبول لدى الأغلبية.</span>
                        }
                    </div>
                </div>
            )
        });
    };

    // Helper: Contextual Advice for Specific Criterion
    const getContextualAdvice = (label: string): string => {
        if (label.includes('العادات القرائية')) return "التلميذ يعاني من مشاكل في الجلسة الصحيحة أو مسك الكتاب، أو يتلعثم بسبب الخجل. ركّز على القراءة النموذجية والتشجيع.";
        if (label.includes('فك ترميز')) return "مشكلة في الوعي الصوتي والربط بين الحرف وصوته. يحتاج لتدريبات مكثفة على المقاطع الصوتية والدمج.";
        if (label.includes('وحدات لغوية') || label.includes('الاسترسال')) return "يقرأ بتأتأة وتقطع. يحتاج لتدريبات الطلاقة (القراءة المتكررة للنص نفسه حتى الانطلاق).";
        if (label.includes('المعاني الصريحة')) return "يقرأ جيداً لكن لا يركز في المعنى. اطرح عليه أسئلة بسيطة ومباشرة أثناء القراءة (من؟ أين؟).";
        if (label.includes('تسلسل فكر')) return "يجد صعوبة في ترتيب الأحداث. استخدم قصصاً مصورة واطلب منه ترتيبها وسردها.";
        if (label.includes('معاني الكلمات') || label.includes('رصيد')) return "الرصيد اللغوي ضعيف. شجعه على المطالعة واستخدام القاموس المصور.";
        if (label.includes('الوعي الصوتي') || label.includes('الرسم الإملائي')) return "مشكلة في التمييز السمعي أو الذاكرة البصرية للكلمات. ركز على الإملاء المنظور.";
        return "يحتاج التلميذ لتفريد التعلم في هذا المعيار، من خلال أنشطة مبسطة ومتدرجة.";
    };

    // --- STUDENT DIAGNOSIS LOGIC ---
    const handleStudentDiagnosis = (student: any, criterion?: { id: number, label: string }) => {
        const oral = student.oralPct;
        const written = student.writtenPct;
        const gap = oral - written;

        let profileType = '';
        let diagnosis = '';
        let remedy = '';

        // 1. General Diagnosis (Profile)
        if (gap > 20) {
            profileType = "قراءة آلية (ببغائية)";
            diagnosis = "التلميذ يتقن فك الرمز (التهجئة) ويقرأ بطلاقة ظاهرية، لكنه يعجز عن تحويل المقروء إلى معنى. هذا خلل في كفاءة الفهم وليس القراءة.";
            remedy = "التركيز على أنشطة 'القراءة الصامتة' المتبوعة بأسئلة دقيقة. تدريبه على التلخيص الشفوي لما قرأه. ربط الكلمات بالصور والمعاني.";
        } else if (gap < -20) {
            profileType = "تعثر في فك الرمز";
            diagnosis = "التلميذ يفهم السياق العام والتعليمات (ذكاء لغوي جيد)، لكنه يعاني من بطء أو صعوبة في التهجئة والأداء الجهري (ربما خجل أو بوادر عسر قراءة).";
            remedy = "التدريب على الطلاقة من خلال 'القراءة النموذجية' المكثفة. تشجيعه على القراءة الجهرية في مجموعات صغيرة لكسر حاجز الخوف. معالجة مخارج الحروف.";
        } else if (oral < 40 && written < 40) {
            profileType = "تعثر شامل";
            diagnosis = "ضعف عام في كل من الآلية (التهجئة) والفهم. التلميذ لم يمتلك بعد مفاتيح القراءة الأساسية.";
            remedy = "العودة إلى الوعي الصوتي (تمييز الأصوات). التركيز على المقاطع الصوتية البسيطة. تكييف النشاطات وتبسيطها.";
        } else {
            profileType = "تعثر متوازن";
            diagnosis = "مستوى التلميذ ضعيف نوعاً ما لكنه متوازن بين القراءة والفهم. يحتاج فقط لمزيد من التدريب.";
            remedy = "المراجعة المستمرة وتكثيف التطبيقات.";
        }

        // 2. Specific Context (If clicked from a list)
        let clickedCriterion = undefined;
        if (criterion) {
            clickedCriterion = {
                label: criterion.label,
                advice: getContextualAdvice(criterion.label)
            };
        }

        setSelectedStudentDiag({
            studentName: student.fullName,
            profileType,
            diagnosis,
            remedy,
            scores: { oral, written },
            gap,
            clickedCriterion // Pass this to modal
        });
    };


    if (totalStudents === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl shadow-sm border border-slate-200">
                <AlertTriangle size={40} className="text-amber-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-600">لا توجد بيانات للعرض</h3>
                <p className="text-slate-400 text-sm">تأكد من استيراد ملفات أولاً.</p>
            </div>
        );
    }

    const entityLabel = scope === 'district' ? 'المدارس' : 'الأفواج';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">
            
            {/* --- INSIGHT MODAL --- */}
            {activeInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-700" onClick={() => setActiveInsight(null)}>
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-start">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                                <Info size={20} className="text-blue-400"/>
                                {activeInsight.title}
                            </h3>
                            <button onClick={() => setActiveInsight(null)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 pb-6 border-b border-slate-800">
                                <p className="text-slate-300 text-sm leading-relaxed italic mb-4 border-l-2 border-slate-700 pl-3">
                                    "{activeInsight.definition}"
                                </p>
                                <div className="mb-4 bg-blue-900/20 p-3 rounded border border-blue-900/50">
                                    <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-1"><BookOpen size={12}/> المرجعية البيداغوجية:</h4>
                                    <p className="text-xs text-blue-200 leading-relaxed">{activeInsight.pedagogicalRef}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Activity size={12}/> قراءة في الأرقام
                                </h4>
                                {activeInsight.content}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STUDENT DIAGNOSIS MODAL (UPDATED) --- */}
            {selectedStudentDiag && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500" onClick={() => setSelectedStudentDiag(null)}>
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-700 relative shrink-0">
                            <button onClick={() => setSelectedStudentDiag(null)} className="absolute left-4 top-4 text-slate-400 hover:text-white"><X size={20}/></button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/50">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedStudentDiag.studentName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800">حالة تتطلب معالجة</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Body - Scrollable */}
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Profile Type */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                    <Stethoscope size={14}/> التشخيص العام (البروفايل)
                                </h4>
                                <p className="text-lg font-bold text-white mb-1">{selectedStudentDiag.profileType}</p>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {selectedStudentDiag.diagnosis}
                                </p>
                            </div>

                            {/* Scores Visual */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/30 p-3 rounded-lg text-center border border-slate-700">
                                    <span className="text-[10px] text-slate-400 block mb-1">الأداء القرائي (شفوي)</span>
                                    <span className={`text-xl font-bold ${selectedStudentDiag.scores.oral < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {selectedStudentDiag.scores.oral.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded-lg text-center border border-slate-700">
                                    <span className="text-[10px] text-slate-400 block mb-1">فهم المكتوب (كتابي)</span>
                                    <span className={`text-xl font-bold ${selectedStudentDiag.scores.written < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {selectedStudentDiag.scores.written.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            
                            {/* Calculation Formula Note (ADDED) */}
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

                            {/* Specific Criterion Context (The New Part) */}
                            {selectedStudentDiag.clickedCriterion ? (
                                <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-700/50 animate-in slide-in-from-bottom-2">
                                    <h4 className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                        <Microscope size={14}/> تحليل سبب الإخفاق في هذا المعيار
                                    </h4>
                                    <div className="mb-2 text-xs font-bold text-orange-200 bg-orange-950/50 px-2 py-1 rounded inline-block">
                                        {selectedStudentDiag.clickedCriterion.label}
                                    </div>
                                    <p className="text-sm text-orange-100 leading-relaxed font-medium">
                                        {selectedStudentDiag.clickedCriterion.advice}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-800/50">
                                    <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                        <BrainCircuit size={14}/> العلاج البيداغوجي المقترح
                                    </h4>
                                    <p className="text-sm text-emerald-100 leading-relaxed font-medium">
                                        {selectedStudentDiag.remedy}
                                    </p>
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
                            <h2 className="text-4xl font-bold font-serif mb-2">{YEAR2_ARABIC_DEF.label}</h2>
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
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:border-teal-300 transition-all group lg:col-span-3 xl:col-span-1 relative"
                    onClick={showMatrixInsight}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Puzzle size={20} className="text-teal-500"/>
                            مصفوفة التوازن (شفوي/كتابي)
                        </h3>
                        <Info size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors"/>
                    </div>
                    
                    <div className="flex gap-6 items-center justify-center relative">
                        {/* CUSTOM ELEGANT TOOLTIP */}
                        {hoveredMatrixZone && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl w-48 text-center animate-in zoom-in-95 duration-200 border border-slate-600 pointer-events-none">
                                <div className="text-xs font-bold mb-1 border-b border-slate-600 pb-1">
                                    {hoveredMatrixZone === 'q1' && "تعثر في فك الرمز"}
                                    {hoveredMatrixZone === 'q2' && "تحكم شامل"}
                                    {hoveredMatrixZone === 'q3' && "تعثر شامل"}
                                    {hoveredMatrixZone === 'q4' && "قراءة آلية"}
                                </div>
                                <div className="text-[10px] text-slate-300 leading-tight">
                                    {hoveredMatrixZone === 'q1' && "يفهم المعنى لكن يجد صعوبة في التهجئة"}
                                    {hoveredMatrixZone === 'q2' && "توازن ممتاز بين الأداء والفهم"}
                                    {hoveredMatrixZone === 'q3' && "صعوبات في مبادئ القراءة والفهم"}
                                    {hoveredMatrixZone === 'q4' && "يقرأ بطلاقة (ببغائية) دون فهم المعنى"}
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
                                <span className="text-xs font-bold text-blue-800">{Math.round((performanceMatrix.decoding_issue / performanceMatrix.total)*100)}%</span>
                                <span className="text-[9px] text-blue-600 font-bold mt-1">تعثر فك الرمز</span>
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
                                <span className="text-xs font-bold text-yellow-800">{Math.round((performanceMatrix.rote_reading / performanceMatrix.total)*100)}%</span>
                                <span className="text-[9px] text-yellow-600 font-bold mt-1">قراءة آلية</span>
                            </div>
                            
                            {/* Axis Labels */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 font-bold tracking-widest">كتابي</div>
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest">شفوي</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CRITERIA HEATMAP */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Target size={20} className="text-red-500"/> تحليل المعايير (الأضعف فالأقوى)</h3>
                    
                    {/* Legend (ADDED) */}
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
                                <span className="bg-white text-slate-500 text-[10px] px-2 py-1 rounded border border-slate-200 font-bold">
                                    {crit.compId === 'reading_performance' ? 'أداء قرائي' : 'فهم مكتوب'}
                                </span>
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
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><PenTool size={20} className="text-red-500"/> قوائم المعالجة (اللغة العربية)</h3>
                        <span className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-bold">اضغط للتشخيص الدقيق</span>
                    </div>
                    
                    <div className="masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {YEAR2_ARABIC_DEF.competencies.map(comp => (
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

export default AcqYear2ArabicStats;