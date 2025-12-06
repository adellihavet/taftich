import React, { useMemo, useState } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR5_ARABIC_DEF } from '../../../constants/acqYear5Arabic';
import { 
    Activity, Target, TrendingUp, AlertTriangle, Lightbulb, Users, School, 
    BookOpen, Layers, Zap, BrainCircuit, Mic, PenTool, LayoutTemplate, 
    MessageSquare, AlertOctagon, ArrowUpRight, GraduationCap, X, Info,
    Scale, FileText
} from 'lucide-react';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
}

const AcqYear5ArabicStats: React.FC<Props> = ({ records, scope, contextName }) => {
    const [activeInsight, setActiveInsight] = useState<{ title: string; desc: string; solution: string } | null>(null);

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

    // A. The Didactic Gap (Resources vs Competency)
    // Resources: Grammar (Comp3-Crit8), Spelling (Comp3-Crit9), Reading decoding (Comp2-Crit1)
    // Competency: Written Prod (Comp4-Crit2,3), Oral Interaction (Comp1-Crit4,5)
    const didacticGap = useMemo(() => {
        let resourceScore = 0, resourceMax = 0;
        let competencyScore = 0, competencyMax = 0;

        allStudents.forEach(s => {
            // Resources (The "Knowledge" part)
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

            // Competency (The "Action" part)
            const g_prod_struct = getGrade(s, 'written_prod', 2); // Design/Structure
            const g_prod_cohere = getGrade(s, 'written_prod', 3); // Coherence
            const g_oral_interact = getGrade(s, 'oral_comms', 4); // Interaction

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

    // B. Text Types Analysis (Argumentative/Explanatory vs Narrative)
    // Year 5 Focuses on Argumentative/Explanatory. 
    // We check: 'written_comp'-Crit4 (Explain phenomenon) & 'written_prod'-Crit6 (Opinion/Argument)
    const textTypeAnalysis = useMemo(() => {
        let complexScore = 0, complexMax = 0; // Argumentative/Explanatory
        let basicScore = 0, basicMax = 0;     // Basic skills

        allStudents.forEach(s => {
            // Complex (Year 5 Specifics)
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

            // Basic (Should be acquired)
            const g_read = getGrade(s, 'reading_perf', 1);
            const g_copy = getGrade(s, 'written_prod', 7); // Quality/Legibility

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

    // C. The "Lost Generation" (Functional Illiteracy)
    // Students who fail (D) in Reading (Comp2-Crit1) AND Writing (Comp4-Crit4)
    const criticalFailureRate = useMemo(() => {
        const failedStudents = allStudents.filter(s => {
            const g_read = getGrade(s, 'reading_perf', 1);
            const g_write = getGrade(s, 'written_prod', 4);
            return g_read === 'D' && g_write === 'D';
        }).length;
        
        return totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0;
    }, [allStudents]);

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

    // --- RENDER HELPERS ---
    const getSystemicDiagnosis = () => {
        if (didacticGap.gap > 15) return {
            title: "هيمنة التلقين على الإدماج",
            desc: `الفجوة (${didacticGap.gap.toFixed(0)}%+) تشير إلى أن التلاميذ يحفظون القواعد (موارد) لكن لا يستطيعون استخدامها (كفاءة).`,
            solution: "توجيه الأساتذة لاعتماد 'المقاربة النصية' بدلاً من تدريس القواعد كقوالب معزولة. تفعيل حصص الإدماج."
        };
        if (textTypeAnalysis.complexPct < 40 && textTypeAnalysis.basicPct > 70) return {
            title: "ركود في مستوى السنة الرابعة",
            desc: "النتائج جيدة في المهارات الأساسية لكنها تنهار في النصوص المعقدة (التفسير/الحجاج). لم يتم تحضير التلاميذ لمتطلبات السنة الخامسة.",
            solution: "تنظيم ندوات حول 'تدريسية النصوص الحجاجية والتفسيرية'. التركيز على مهارات التفكير العليا (التحليل/الرأي)."
        };
        if (criticalFailureRate > 20) return {
            title: "أزمة في التعلمات القاعدية",
            desc: `نسبة ${criticalFailureRate.toFixed(1)}% من التلاميذ شبه أميين (عجز في القراءة والكتابة). هذا خلل تراكمي من الطور الأول.`,
            solution: "تفعيل مشروع المؤسسة للعلاج البيداغوجي المكثف. استدعاء الأولياء لتحمل المسؤولية المشتركة."
        };
        return {
            title: "أداء تربوي متوازن",
            desc: "المؤشرات تعكس توازناً مقبولاً بين الاكتساب والتوظيف. المنظومة تعمل بشكل جيد.",
            solution: "تعزيز المكتسبات والتركيز على التميز والإبداع."
        };
    };

    const systemicDiag = getSystemicDiagnosis();

    // Radar Chart Path Generator
    const generateRadarPath = (data: any[], scale: number = 1) => {
        if (data.length === 0) return '';
        const center = 100;
        const radius = 80 * scale;
        return data.map((point, i) => {
            const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
            const val = point.A / 100;
            const x = center + radius * val * Math.cos(angle);
            const y = center + radius * val * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    if (totalStudents === 0) return <div className="text-center p-10 text-gray-400">لا توجد بيانات للتحليل</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            
            {/* INSIGHT MODAL */}
            {activeInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in zoom-in-95" onClick={() => setActiveInsight(null)}>
                    <div className="bg-white w-full max-w-lg rounded-2xl p-0 overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-start">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Lightbulb className="text-yellow-400" size={24}/> {activeInsight.title}</h3>
                            <button onClick={() => setActiveInsight(null)} className="text-slate-400 hover:text-white"><X/></button>
                        </div>
                        <div className="p-6 bg-slate-50">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">التشخيص النظامي</h4>
                                <p className="text-slate-800 text-sm leading-relaxed font-medium">{activeInsight.desc}</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2 flex items-center gap-2"><Zap size={14}/> الإجراء التصحيحي (للمفتش)</h4>
                                <p className="text-indigo-900 text-sm leading-relaxed">{activeInsight.solution}</p>
                            </div>
                        </div>
                        <div className="bg-slate-100 p-4 text-center">
                            <button onClick={() => setActiveInsight(null)} className="text-sm font-bold text-slate-600 hover:text-slate-900">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

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
                    <div 
                        className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-md cursor-pointer hover:bg-white/20 transition-all group"
                        onClick={() => setActiveInsight(systemicDiag)}
                    >
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
                
                {/* 1. THE DIDACTIC GAP (Bar Chart) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2">
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
                        <div className="relative pt-6">
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-600 flex items-center gap-2"><BookOpen size={16}/> اكتساب الموارد (نحو/صرف/إملاء)</span>
                                <span className="text-indigo-600">{didacticGap.rPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${didacticGap.rPct}%` }}></div>
                            </div>
                            {/* Marker description */}
                            <p className="text-[10px] text-slate-400 mt-1">يعكس جودة التحفيظ والشرح النظري للقواعد.</p>
                        </div>

                        {/* Competency Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-600 flex items-center gap-2"><PenTool size={16}/> ممارسة الكفاءة (تحرير/تواصل)</span>
                                <span className="text-amber-500">{didacticGap.cPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${didacticGap.cPct}%` }}></div>
                            </div>
                            {/* Marker description */}
                            <p className="text-[10px] text-slate-400 mt-1">يعكس نجاح "الوضعية الإدماجية" وقدرة المتعلم على التجنيد.</p>
                        </div>
                    </div>
                </div>

                {/* 2. FUNCTIONAL ILLITERACY ALERT */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className={`absolute inset-0 opacity-5 ${criticalFailureRate > 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${criticalFailureRate > 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3. RADAR CHART: COMPETENCY BALANCE */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-purple-600"/>
                        توازن الكفاءات الأربع
                    </h3>
                    
                    <div className="flex justify-center py-4">
                        <div className="relative w-64 h-64">
                            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                                {/* Grid Circles */}
                                {[20, 40, 60, 80, 100].map(r => (
                                    <circle key={r} cx="100" cy="100" r={r * 0.8} fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
                                ))}
                                {/* Axes */}
                                {radarData.map((_, i) => {
                                    const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                    const x = 100 + 80 * Math.cos(angle);
                                    const y = 100 + 80 * Math.sin(angle);
                                    return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#cbd5e1" />;
                                })}
                                {/* Data Polygon */}
                                <polygon 
                                    points={generateRadarPath(radarData)} 
                                    fill="rgba(124, 58, 237, 0.2)" 
                                    stroke="#7c3aed" 
                                    strokeWidth="2" 
                                />
                                {/* Labels */}
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

                {/* 4. TEXT TYPES ANALYSIS (Curriculum Alignment) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                        <FileText size={20} className="text-blue-500"/>
                        مدى تنفيذ المنهاج (أنماط النصوص)
                    </h3>
                    <p className="text-xs text-slate-400 mb-8">هل يركز الأستاذ على نصوص السنة الخامسة (تفسيري/حجاجي) أم مازال في السرد؟</p>

                    <div className="flex flex-col gap-6">
                        {/* Complex Texts */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                <BrainCircuit size={24}/>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">التفكير المجرد (التفسير والحجاج)</span>
                                    <span className="font-bold text-blue-600">{textTypeAnalysis.complexPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${textTypeAnalysis.complexPct}%` }}></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">القدرة على التعليل، تقديم البراهين، وتحليل الظواهر (قلب منهاج س5).</p>
                            </div>
                        </div>

                        {/* Basic Texts */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                <MessageSquare size={24}/>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">المهارات القاعدية (السرد والوصف)</span>
                                    <span className="font-bold text-slate-600">{textTypeAnalysis.basicPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-400" style={{ width: `${textTypeAnalysis.basicPct}%` }}></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">القراءة المسترسلة، جودة الخط، الوصف البسيط (مكتسبات س3 و س4).</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <TrendingUp size={20} className="text-amber-600 shrink-0 mt-0.5"/>
                            <div>
                                <h4 className="font-bold text-amber-800 text-sm mb-1">توجيه بيداغوجي:</h4>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {textTypeAnalysis.complexPct < 50 
                                        ? "⚠ تنبيه: النتائج تظهر تأخراً في الانتقال إلى التفكير المجرد. القسم مازال يعتمد على السرد والحفظ. يجب تدريب التلاميذ على 'لماذا؟' و 'كيف؟' بدلاً من 'ماذا؟'." 
                                        : " مؤشر جيد: القسم يتجاوب مع متطلبات المنهاج الجديدة (التفسير والحجاج)."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* 5. RECOMMENDATIONS FOOTER */}
            <div className="bg-slate-800 text-slate-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-full">
                        <GraduationCap size={32} className="text-white"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">توصية مجلس الأساتذة</h3>
                        <p className="text-xs text-slate-400 mt-1">بناءً على تحليل البيانات، يوصى بالتركيز على:</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    {didacticGap.gap > 15 && <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-red-200">ورشة: الوضعية الإدماجية</span>}
                    {textTypeAnalysis.complexPct < 50 && <span className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg text-xs text-amber-200">ندوة: النص الحجاجي</span>}
                    {criticalFailureRate > 15 && <span className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-lg text-xs text-purple-200">مشروع: علاج التعثر القرائي</span>}
                    <span className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded-lg text-xs text-blue-200">تفعيل المكتبة المدرسية</span>
                </div>
            </div>
        </div>
    );
};

export default AcqYear5ArabicStats;