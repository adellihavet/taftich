import React, { useMemo, useState } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { Radar, TrendingUp, AlertOctagon, BrainCircuit, Scale, Zap, BookOpen, Calculator, Microscope, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
    records: AcqClassRecord[]; // All subjects for this class
    className: string;
    schoolName: string;
}

const AcqTeacherProfile: React.FC<Props> = ({ records, className, schoolName }) => {
    const [expandedDiagnosis, setExpandedDiagnosis] = useState(false);

    // --- 1. DATA AGGREGATION ---
    const analysis = useMemo(() => {
        const subjectsData: Record<string, { totalScore: number, maxScore: number, studentCount: number, criteria: any[] }> = {};
        let totalGlobalScore = 0;
        let totalGlobalMax = 0;

        // Loop through all subject records (Arabic, Math, etc.)
        records.forEach(record => {
            const subjectName = record.subject;
            if (!subjectsData[subjectName]) {
                subjectsData[subjectName] = { totalScore: 0, maxScore: 0, studentCount: record.students.length, criteria: [] };
            }

            // Analyze Criteria Failure Rates within this subject
            // We need to flatten the criteria structure to find "The Deadly Criterion"
            const criteriaStats: Record<string, { label: string, failCount: number, total: number }> = {};

            record.students.forEach(s => {
                let sScore = 0;
                let sMax = 0;
                
                // Iterate over all competencies/criteria in the student's results
                Object.keys(s.results).forEach(compId => {
                    Object.keys(s.results[compId]).forEach(critId => {
                        const grade = s.results[compId][parseInt(critId)];
                        const uniqueKey = `${compId}-${critId}`;
                        
                        // Init criteria stat
                        if (!criteriaStats[uniqueKey]) {
                            // Try to find label from definition (This is tricky without passing definitions, 
                            // for now we use ID, but in real app we'd map definitions).
                            // Simplified: We assume we can get labels if we passed Definitions. 
                            // For this expert view, we will count stats generically first.
                            criteriaStats[uniqueKey] = { label: `معيار ${critId}`, failCount: 0, total: 0 };
                        }
                        criteriaStats[uniqueKey].total++;

                        if (grade) {
                            sMax += 3;
                            if (grade === 'A') sScore += 3;
                            else if (grade === 'B') sScore += 2;
                            else if (grade === 'C') sScore += 1;
                            else {
                                // Grade D
                                criteriaStats[uniqueKey].failCount++; 
                            }
                        }
                    });
                });
                subjectsData[subjectName].totalScore += sScore;
                subjectsData[subjectName].maxScore += sMax;
            });

            // Store criteria stats for this subject
            subjectsData[subjectName].criteria = Object.values(criteriaStats).map(c => ({
                ...c,
                failRate: c.total > 0 ? (c.failCount / c.total) * 100 : 0
            })).sort((a, b) => b.failRate - a.failRate); // Sort by failure rate (Highest first)
        });

        // Calculate Scores
        const subjectScores = Object.entries(subjectsData).map(([subject, data]) => {
            const pct = data.maxScore > 0 ? (data.totalScore / data.maxScore) * 100 : 0;
            return { subject, pct, criteria: data.criteria };
        });

        return { subjectScores };
    }, [records]);

    // --- 2. PEDAGOGICAL DIAGNOSIS ENGINE ---
    const diagnosis = useMemo(() => {
        const scores = analysis.subjectScores;
        if (scores.length < 2) return null; // Need comparison

        const arabic = scores.find(s => s.subject.includes('العربية'));
        const math = scores.find(s => s.subject.includes('رياضيات'));
        
        const insights = [];
        let profileType = 'متوازن';
        let color = 'text-blue-600';
        let icon = Scale;

        // A. Profile Type
        if (arabic && math) {
            const gap = arabic.pct - math.pct;
            if (gap > 15) {
                profileType = 'ميل لغوي/أدبي';
                color = 'text-green-600';
                icon = BookOpen;
                insights.push("الأستاذ يركز على الأنشطة اللفظية والحفظ، بينما يعاني التلاميذ في بناء المفاهيم المنطقية والرياضية. قد يكون السبب نقصاً في استخدام الوسائل المحسوسة في الرياضيات.");
            } else if (gap < -15) {
                profileType = 'ميل منطقي/علمي';
                color = 'text-purple-600';
                icon = Calculator;
                insights.push("تحكم جيد في الرياضيات يقابله ضعف في اللغة. هذا مؤشر على إهمال الجانب التواصلي والشفوي، أو التركيز على النتيجة الحسابية دون صياغة الحل لغوياً.");
            } else {
                if (arabic.pct > 75 && math.pct > 75) {
                    profileType = 'أداء بيداغوجي متميز';
                    color = 'text-emerald-600';
                    icon = Zap;
                    insights.push("توازن ممتاز بين بناء المفاهيم (الرياضيات) واكتساب المهارات اللغوية. الأستاذ يتحكم في المقاربات المختلفة.");
                } else if (arabic.pct < 50 && math.pct < 50) {
                    profileType = 'تعثر بيداغوجي عام';
                    color = 'text-red-600';
                    icon = AlertOctagon;
                    insights.push("ضعف عام يشمل جميع المواد. الخلل قد يكون في ضبط القسم، أو عدم التمكن من المناهج، أو غياب التخطيط.");
                }
            }
        }

        // B. Didactic Gaps (The "Killer" Criterion)
        const criticalGaps: {subject: string, rate: number}[] = [];
        scores.forEach(s => {
            // If the hardest criterion has > 60% failure rate
            if (s.criteria.length > 0 && s.criteria[0].failRate > 60) {
                criticalGaps.push({ subject: s.subject, rate: s.criteria[0].failRate });
            }
        });

        if (criticalGaps.length > 0) {
            insights.push(`هناك "فجوة ديداكتيكية" خطيرة. في مادة (${criticalGaps[0].subject})، أخفق ${Math.round(criticalGaps[0].rate)}% من التلاميذ في معيار واحد محدد. هذا يعني أن الدرس المتعلق بهذا المعيار لم يُفهم جماعياً (خلل في النقل الديداكتيكي وليس في التلاميذ).`);
        }

        return { profileType, color, icon, insights };
    }, [analysis]);


    if (records.length === 0) return null;

    // Helper for rendering charts
    const maxVal = Math.max(...analysis.subjectScores.map(s => s.pct), 100);

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <BrainCircuit size={400} className="absolute -left-20 -top-20"/>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase text-xs mb-1">
                            <Microscope size={14}/>
                            تحليل بيداغوجي معمق للأستاذ
                        </div>
                        <h2 className="text-2xl font-bold font-serif">بروفايل الأداء المهني</h2>
                        <p className="text-slate-400 text-sm">{schoolName} - القسم: <span className="text-white font-bold">{className}</span></p>
                    </div>
                    
                    {diagnosis && (
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-4 min-w-[250px]">
                            <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${diagnosis.color}`}>
                                <diagnosis.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-300 uppercase font-bold">النمط السائد</p>
                                <p className="text-lg font-bold">{diagnosis.profileType}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* 1. SUBJECTS COMPARISON (Radar/Bar Hybrid) */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600"/>
                        توازن المواد (نقاط القوة والضعف)
                    </h3>
                    
                    <div className="space-y-5">
                        {analysis.subjectScores.map((s, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-700 flex items-center gap-2">
                                        {s.subject.includes('العربية') ? <BookOpen size={14} className="text-green-500"/> : 
                                         s.subject.includes('رياضيات') ? <Calculator size={14} className="text-purple-500"/> : 
                                         <div className="w-3.5 h-3.5 rounded-full bg-slate-400"></div>}
                                        {s.subject}
                                    </span>
                                    <span className={`font-bold ${s.pct > 75 ? 'text-emerald-600' : s.pct < 50 ? 'text-red-500' : 'text-slate-600'}`}>
                                        {s.pct.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                                    {/* Background Grid */}
                                    <div className="absolute top-0 bottom-0 left-[25%] w-px bg-white/50"></div>
                                    <div className="absolute top-0 bottom-0 left-[50%] w-px bg-white/50"></div>
                                    <div className="absolute top-0 bottom-0 left-[75%] w-px bg-white/50"></div>
                                    
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            s.pct > 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                                            s.pct < 50 ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                                            'bg-gradient-to-r from-blue-400 to-blue-600'
                                        }`} 
                                        style={{ width: `${s.pct}%` }}
                                    ></div>
                                </div>
                                {s.pct < 50 && (
                                    <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse">⚠️ هذه المادة تتطلب معالجة فورية</p>
                                )}
                            </div>
                        ))}
                        {analysis.subjectScores.length === 1 && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 flex items-start gap-2">
                                <Lightbulb size={16} className="shrink-0 mt-0.5"/>
                                <p>للحصول على تحليل أعمق ومقارنة دقيقة، يرجى استيراد ملفات المواد الأخرى (الرياضيات، التربية الإسلامية...) لنفس هذا القسم.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. AUTOMATED PEDAGOGICAL REPORT */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 relative">
                    <div className="absolute top-4 left-4 text-slate-200">
                        <Microscope size={80} />
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 relative z-10">
                        <Sparkles size={18} className="text-amber-500"/>
                        التشخيص الآلي (Expert Insights)
                    </h3>

                    {diagnosis ? (
                        <div className="space-y-4 relative z-10">
                            {diagnosis.insights.map((text, i) => (
                                <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium text-justify">
                                        {text}
                                    </p>
                                </div>
                            ))}
                            
                            {!expandedDiagnosis && (
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setExpandedDiagnosis(true)}>
                                    <span className="text-xs font-bold text-indigo-700 flex items-center justify-center gap-2">
                                        عرض توجيهات المفتش المقترحة <ArrowRight size={14}/>
                                    </span>
                                </div>
                            )}

                            {expandedDiagnosis && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mt-4">توصيات عملية:</h4>
                                    <ul className="space-y-2">
                                        <li className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">• برمجة زيارة صفية للتركيز على استراتيجيات تدريس المادة الأضعف.</li>
                                        <li className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">• مراجعة طريقة بناء الاختبارات، قد تكون الأسئلة أصعب من مستوى التلاميذ.</li>
                                        <li className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">• تكليف الأستاذ بإعداد "مشروع علاج" خاص بالمعايير التي سجلت نسبة فشل عالية.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 relative z-10">
                            <p className="mb-2">البيانات غير كافية للتشخيص المعمق.</p>
                            <p className="text-xs">يرجى إضافة مادة ثانية على الأقل للمقارنة.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AcqTeacherProfile;