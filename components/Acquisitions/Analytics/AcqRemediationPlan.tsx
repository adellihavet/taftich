
import React, { useMemo } from 'react';
import { AcqStudent } from '../../../types/acquisitions';
import { FileText, Target, AlertTriangle, CheckCircle2, ArrowRight, History, Lightbulb, Printer, X } from 'lucide-react';

interface Props {
    students: AcqStudent[];
    subjectDef: any; // Passed from parent (Arabic or Math Definition)
    contextName: string;
    onClose: () => void;
}

// --- KNOWLEDGE BASE: Linking Year 2 Failures to Year 1 Roots ---
const REMEDIATION_KB: Record<string, { origin: string; cause: string; activity: string }> = {
    // ARABIC MAPPINGS
    'فك ترميز': {
        origin: 'السنة الأولى (المقاطع 1-4)',
        cause: 'عدم تثبيت الحروف وعلاقتها بالأصوات (الوعي الصوتي) في السنة الأولى.',
        activity: 'ألعاب الوعي الصوتي، العجين لتشكيل الحروف، لوحة الحروف المتحركة.'
    },
    'وحدات لغوية': {
        origin: 'السنة الأولى (نهاية السنة)',
        cause: 'ضعف في القراءة الإجمالية للكلمات البسيطة، تعثر في الانتقال من التهجئة إلى الاسترسال.',
        activity: 'قراءة البطاقات الخاطفة، القراءة الثنائية، النصوص القصيرة المشكولة.'
    },
    'المعاني الصريحة': {
        origin: 'السنة الأولى (فهم المنطوق)',
        cause: 'التركيز سابقاً على فك الرمز (القراءة الآلية) إهمال جانب المعنى والفهم.',
        activity: 'استخراج المعلومات من صور، الإجابة عن أسئلة (من؟ أين؟) بعد سماع قصة.'
    },
    'الرسم الإملائي': {
        origin: 'السنة الأولى (الكتابة)',
        cause: 'عدم التمييز بين الحروف المتشابهة سمعياً أو بصرياً.',
        activity: 'الإملاء المنظور، املأ الفراغ بالحرف الناقص.'
    },
    
    // MATH MAPPINGS
    'نظام العد': {
        origin: 'السنة الأولى (الأعداد إلى 99)',
        cause: 'خلل في مفهوم "المراتب" (وحدات/عشرات) وعدم إدراك قيمة الرقم حسب موقعه.',
        activity: 'استعمال المعداد، جداول المراتب، حزم الخشيبات (التجميع والاستبدال).'
    },
    'الجمع والطرح': {
        origin: 'السنة الأولى (الجمع دون احتفاظ)',
        cause: 'عدم التمكن من الشريط العددي، أو عدم استيعاب مفهوم "الإضافة" و"الإنقاص" بالمحسوس.',
        activity: 'الحساب الذهني اليومي، استعمال البطاقات، تمثيل العمليات بأشياء ملموسة.'
    },
    'فهم المشكلة': {
        origin: 'السنة الأولى (وضعيات جمعية)',
        cause: 'صعوبة لغوية في قراءة نص المشكلة، أو عدم القدرة على استخراج المعطيات.',
        activity: 'تلوين المعطيات بالأخضر والمطلوب بالأحمر، تمثيل المشكلة برسم.'
    },
    'انسجام عناصر': {
        origin: 'السنة الأولى',
        cause: 'الخلط بين المعنى الرياضي للجمع (الزيادة) والطرح (النقصان).',
        activity: 'مسرحة الوضعيات، لعب الأدوار (بائع ومشتري).'
    }
};

const AcqRemediationPlan: React.FC<Props> = ({ students, subjectDef, contextName, onClose }) => {

    // 1. CALCULATE EFFICIENCY INDEX (مؤشر النجاعة)
    const stats = useMemo(() => {
        const total = students.length;
        if (total === 0) return { index: 0, zone: 3, criteria: [] };

        // Calculate Global Success (A + B) across ALL criteria
        let totalCriteriaChecks = 0;
        let successChecks = 0;
        
        // Also track per-criterion failure rate
        const criteriaFailures: Record<string, { label: string, failCount: number }> = {};

        students.forEach(s => {
            subjectDef.competencies.forEach((comp: any) => {
                comp.criteria.forEach((crit: any) => {
                    // Check logic
                    const grade = s.results?.[comp.id]?.[crit.id];
                    if (grade) {
                        totalCriteriaChecks++;
                        if (grade === 'A' || grade === 'B') {
                            successChecks++;
                        } else {
                            // Failure (C or D)
                            const key = `${comp.id}-${crit.id}`;
                            if (!criteriaFailures[key]) criteriaFailures[key] = { label: crit.label, failCount: 0 };
                            criteriaFailures[key].failCount++;
                        }
                    }
                });
            });
        });

        // "Relative Efficiency Index" = (A+B) / Total
        const index = totalCriteriaChecks > 0 ? (successChecks / totalCriteriaChecks) * 100 : 0;

        // Zone Classification (Page 9 of PDF)
        let zone = 3;
        let zoneLabel = "الحالة 3: مؤشر نجاعة منخفض (< 50%)";
        let zoneDesc = "مؤشر على وجوب إعادة النظر في أقطاب العملية التعليمية (المعلم، المتعلم، المحتوى).";
        let zoneColor = "bg-red-100 text-red-800 border-red-200";

        if (index >= 75) {
            zone = 1;
            zoneLabel = "الحالة 1: مؤشر نجاعة مرتفع (> 75%)";
            zoneDesc = "مؤشر على جودة الممارسات، مع وجود عوائق مرتبطة بتكافؤ الفرص.";
            zoneColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
        } else if (index >= 50) {
            zone = 2;
            zoneLabel = "الحالة 2: مؤشر نجاعة متوسط (50% - 75%)";
            zoneDesc = "مؤشر على وجود معيقات تعلم مرتبطة بتعليمية المواد أو الممارسات.";
            zoneColor = "bg-amber-100 text-amber-800 border-amber-200";
        }

        // Get Priority Criteria (Top 3 failures)
        const priorityCriteria = Object.values(criteriaFailures)
            .map(c => ({ ...c, failRate: (c.failCount / total) * 100 }))
            .sort((a, b) => b.failRate - a.failRate)
            .slice(0, 3); // Take top 3

        return { index, zone, zoneLabel, zoneDesc, zoneColor, priorityCriteria };
    }, [students, subjectDef]);

    const getRemediationInfo = (label: string) => {
        // Simple fuzzy match
        const key = Object.keys(REMEDIATION_KB).find(k => label.includes(k));
        return key ? REMEDIATION_KB[key] : {
            origin: 'السنة السابقة',
            cause: 'نقص في المكتسبات القبلية الأساسية.',
            activity: 'أنشطة تفريد التعلم والمعالجة البيداغوجية.'
        };
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase text-xs mb-1 tracking-widest">
                            <FileText size={14}/>
                            وثيقة رسمية
                        </div>
                        <h2 className="text-2xl font-bold font-serif text-slate-800">مخطط المعالجة المهيكلة للتعلم</h2>
                        <p className="text-slate-500 text-sm mt-1">{contextName} - المادة: {subjectDef.label}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm print:hidden">
                            <Printer size={16}/> طباعة
                        </button>
                        <button onClick={onClose} className="bg-slate-100 text-slate-500 p-2 rounded-full hover:bg-slate-200 transition-colors print:hidden">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white print:p-0 print:overflow-visible">
                    
                    {/* 1. Efficiency Index (Speedometer Logic) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-100 pb-8">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                                <Target size={20} className="text-indigo-500"/>
                                أولاً: مؤشر النجاعة البيداغوجية
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed text-justify">
                                يعبر هذا المؤشر عن نسبة التحكم (أ + ب) مقارنة بالعدد الإجمالي. 
                                يتم تصنيف القسم إلى 3 حالات لتحديد طبيعة التدخل المطلوب.
                            </p>
                            
                            <div className={`mt-4 p-4 rounded-xl border ${stats.zoneColor} flex items-start gap-3`}>
                                {stats.zone === 1 ? <CheckCircle2 size={24} className="shrink-0"/> : <AlertTriangle size={24} className="shrink-0"/>}
                                <div>
                                    <p className="font-bold">{stats.zoneLabel}</p>
                                    <p className="text-xs mt-1 opacity-90">{stats.zoneDesc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Gauge Representation */}
                        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="relative w-48 h-24 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-slate-200 rounded-t-full"></div>
                                {/* Zones Colors */}
                                <div className="absolute top-0 left-0 w-full h-full rounded-t-full opacity-30" style={{
                                    background: 'conic-gradient(from 180deg, #ef4444 0deg, #ef4444 90deg, #f59e0b 90deg, #f59e0b 135deg, #10b981 135deg, #10b981 180deg)'
                                }}></div>
                                {/* Needle */}
                                <div 
                                    className="absolute bottom-0 left-1/2 w-1 h-full bg-slate-800 origin-bottom transition-transform duration-1000"
                                    style={{ transform: `translateX(-50%) rotate(${(stats.index / 100) * 180 - 90}deg)` }}
                                ></div>
                                <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-slate-800 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-3xl font-bold text-slate-800">{stats.index.toFixed(1)}%</span>
                                <span className="text-xs text-slate-400 block font-bold uppercase">نسبة النجاعة النسبية</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. The Plan Table */}
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                            <Lightbulb size={20} className="text-amber-500"/>
                            ثانياً: مخطط المعالجة والتشخيص (تاريخ الصعوبة)
                        </h3>

                        {stats.priorityCriteria.length > 0 ? (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-100 text-slate-700 font-bold">
                                        <tr>
                                            <th className="p-4 w-1/4">المعيار غير المتحكم فيه</th>
                                            <th className="p-4 w-1/6 text-center">نسبة التعثر</th>
                                            <th className="p-4 w-1/4">تاريخ الصعوبة (الجذر)</th>
                                            <th className="p-4 w-1/3">نشاط المعالجة المقترح</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {stats.priorityCriteria.map((c, i) => {
                                            const info = getRemediationInfo(c.label);
                                            return (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="p-4 font-bold text-slate-800 align-top">
                                                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs ml-2 border border-red-100">أولوية {i+1}</span>
                                                        {c.label}
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-red-600 align-top">
                                                        {c.failRate.toFixed(1)}%
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="flex items-start gap-2">
                                                            <History size={16} className="text-slate-400 mt-0.5 shrink-0"/>
                                                            <div>
                                                                <p className="font-bold text-slate-700">{info.origin}</p>
                                                                <p className="text-xs text-slate-500 mt-1">{info.cause}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top bg-emerald-50/30">
                                                        <div className="flex items-start gap-2">
                                                            <ArrowRight size={16} className="text-emerald-500 mt-0.5 shrink-0"/>
                                                            <p className="text-slate-700 font-medium">{info.activity}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-2"/>
                                <p className="text-slate-600 font-bold">لا توجد معايير متعثرة بشكل ملحوظ.</p>
                                <p className="text-slate-400 text-sm">مؤشرات القسم ممتازة ولا تتطلب خطة معالجة استعجالية.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 mt-8 print:hidden">
                        <strong>ملاحظة بيداغوجية:</strong> تم بناء هذا المخطط استناداً إلى المنشور الوزاري المتعلق بـ "المعالجة المهيكلة للتعلم"، حيث يتم البحث عن جذور الصعوبة في السنوات السابقة (تاريخ الصعوبة) بدلاً من إعادة الدرس نفسه.
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AcqRemediationPlan;