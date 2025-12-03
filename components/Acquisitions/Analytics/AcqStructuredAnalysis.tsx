
import React, { useMemo } from 'react';
import { AcqClassRecord } from '../../../types/acquisitions';
import { YEAR2_ARABIC_DEF } from '../../../constants/acqYear2Arabic';
import { YEAR2_MATH_DEF } from '../../../constants/acqYear2Math';
import { 
    ThumbsUp, Activity, AlertTriangle, CheckCircle2, FileText, 
    Printer, X, Calculator, HelpCircle, Sigma, Users, School, BookOpen,
    Scale, TrendingUp, TrendingDown, Target
} from 'lucide-react';

interface Props {
    records: AcqClassRecord[];
    scope: 'district' | 'school' | 'class';
    contextName: string;
    onClose: () => void;
}

// --- HELPER: Calculation Tooltip ---
const CalcTooltip: React.FC<{ 
    title: string;
    formula: string;
    application: string;
    description: string;
}> = ({ title, formula, application, description }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[9999] transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-600 overflow-hidden">
            <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 font-bold text-yellow-400 flex items-center gap-2">
                <Calculator size={14} />
                طريقة الحساب
            </div>
            <div className="p-3 space-y-2">
                <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px]">المعادلة:</span>
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-300 font-mono block text-center" dir="ltr">{formula}</code>
                </div>
                <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px]">التطبيق:</span>
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-blue-300 font-mono block text-center" dir="ltr">{application}</code>
                </div>
                <div className="pt-2 border-t border-slate-700 text-slate-300 leading-tight">
                    {description}
                </div>
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-600"></div>
        </div>
    </div>
);

// --- HELPER: Indicator Card ---
const IndicatorCard: React.FC<{
    icon: React.ElementType;
    title: string;
    value: string | number;
    subValue?: string;
    color: 'blue' | 'emerald' | 'orange' | 'red' | 'purple' | 'indigo';
    tooltipData: { formula: string; application: string; description: string };
}> = ({ icon: Icon, title, value, subValue, color, tooltipData }) => {
    
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
        orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400',
        red: 'bg-red-50 text-red-700 border-red-200 hover:border-red-400',
        purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
    };

    const iconColors = {
        blue: 'bg-blue-100',
        emerald: 'bg-emerald-100',
        orange: 'bg-orange-100',
        red: 'bg-red-100',
        purple: 'bg-purple-100',
        indigo: 'bg-indigo-100',
    };

    return (
        <div className={`relative group p-4 rounded-2xl border transition-all duration-300 ${colors[color]} hover:shadow-lg cursor-help`}>
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${iconColors[color]}`}>
                    <Icon size={24} />
                </div>
                <HelpCircle size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
                <h4 className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">{title}</h4>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono">{value}</span>
                    {subValue && <span className="text-sm font-bold opacity-60">{subValue}</span>}
                </div>
            </div>
            
            <CalcTooltip 
                title={title}
                formula={tooltipData.formula}
                application={tooltipData.application}
                description={tooltipData.description}
            />
        </div>
    );
};

const AcqStructuredAnalysis: React.FC<Props> = ({ records, scope, contextName, onClose }) => {
    
    // --- DATA PROCESSING CORE ---
    const stats = useMemo(() => {
        let totalCriteria = 0;
        let countA = 0;
        let countB = 0;
        let countC = 0;
        let countD = 0;

        records.forEach(rec => {
            // Determine Subject Definition to get labels if needed
            // const isArabic = rec.subject.includes('العربية');
            // const def = isArabic ? YEAR2_ARABIC_DEF : YEAR2_MATH_DEF;
            
            rec.students.forEach(s => {
                Object.values(s.results).forEach(comp => {
                    Object.values(comp).forEach(grade => {
                        if (grade) {
                            totalCriteria++;
                            if (grade === 'A') countA++;
                            else if (grade === 'B') countB++;
                            else if (grade === 'C') countC++;
                            else if (grade === 'D') countD++;
                        }
                    });
                });
            });
        });

        const totalValid = totalCriteria || 1; // Prevent division by zero

        // --- 1. العلاقة: المدرسة - المجتمع (النتائج والمخرجات) ---
        const soc_GeneralSatisfaction = countA; // المؤشر 1: الرضا العام (العدد الخام للتميز)
        const soc_SpecificSatisfaction = (countA / totalValid) * 100; // المؤشر 2: الرضا النوعي (%)
        const soc_Efficiency = ((countA + countB) / totalValid) * 100; // المؤشر 3: النجاعة (نسبة النجاح الكلية)

        // --- 2. العلاقة: المدرسة - الأستاذ (العبء والمعالجة) ---
        const tea_RemediationLoad = countC + countD; // المؤشر 1: حجم المعالجة (عدد المعايير غير المكتسبة)
        const tea_RemediationRate = ((countC + countD) / totalValid) * 100; // المؤشر 2: نسبة المعالجة (التعثر)
        const tea_PedagogicalGap = soc_Efficiency - soc_SpecificSatisfaction; // المؤشر 3: الفارق البيداغوجي (الفئة ب التي تحتاج دفعاً لتصبح أ)

        // --- 3. العلاقة: الأستاذ - المادة (التحكم والنوعية) ---
        // في هذا السياق، سنحسب مؤشرات الجودة الداخلية
        const sub_Mastery = soc_SpecificSatisfaction; // نسبة التحكم الأقصى
        const sub_Partial = (countB / totalValid) * 100; // نسبة التحكم الجزئي
        const sub_Failure = (countD / totalValid) * 100; // نسبة التحكم المحدود (الخطر الحقيقي)

        return {
            raw: { totalCriteria, countA, countB, countC, countD },
            indicators: {
                soc_GeneralSatisfaction,
                soc_SpecificSatisfaction,
                soc_Efficiency,
                tea_RemediationLoad,
                tea_RemediationRate,
                tea_PedagogicalGap,
                sub_Mastery,
                sub_Partial,
                sub_Failure
            }
        };
    }, [records]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
                
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b flex justify-between items-center shrink-0 z-20 relative">
                    <div>
                        <h2 className="text-2xl font-bold font-serif text-slate-900">لوحة المؤشرات التحليلية الموحدة</h2>
                        <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                            <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">{contextName}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>مجموع المعايير المقيمة: {stats.raw.totalCriteria}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm print:hidden">
                            <Printer size={16}/> طباعة
                        </button>
                        <button onClick={onClose} className="bg-slate-100 text-slate-500 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors print:hidden">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 print:p-0 print:bg-white custom-scrollbar z-10 relative">
                    
                    {/* SECTION 1: SCHOOL - SOCIETY RELATIONSHIP */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-indigo-200">
                            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-200">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">1. علاقة المدرسة بالمجتمع (مؤشرات الرضا)</h3>
                                <p className="text-xs text-slate-500">تقيس هذه المؤشرات جودة المنتج التربوي ومدى استجابته لتطلعات المجتمع في التميز.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Ind 1 */}
                            <IndicatorCard 
                                icon={ThumbsUp}
                                title="مؤشر الرضا الاجتماعي العام"
                                value={stats.raw.countA}
                                subValue="تكرار"
                                color="blue"
                                tooltipData={{
                                    formula: "مجموع (أ)",
                                    application: `Count(A) = ${stats.raw.countA}`,
                                    description: "يمثل العدد الخام للمعايير المتحكم فيها تحكماً أقصى. المجتمع يطمح لزيادة هذا الرقم."
                                }}
                            />
                            {/* Ind 2 */}
                            <IndicatorCard 
                                icon={Target}
                                title="مؤشر الرضا الاجتماعي النوعي"
                                value={stats.indicators.soc_SpecificSatisfaction.toFixed(2)}
                                subValue="%"
                                color="indigo"
                                tooltipData={{
                                    formula: "(مجموع أ / العدد الكلي) × 100",
                                    application: `(${stats.raw.countA} / ${stats.raw.totalCriteria}) × 100`,
                                    description: "نسبة التميز الحقيقية. كلما اقتربت من 100% زادت جودة التعليم."
                                }}
                            />
                            {/* Ind 3 */}
                            <IndicatorCard 
                                icon={CheckCircle2}
                                title="مؤشر النجاعة البيداغوجية"
                                value={stats.indicators.soc_Efficiency.toFixed(2)}
                                subValue="%"
                                color="emerald"
                                tooltipData={{
                                    formula: "((أ + ب) / العدد الكلي) × 100",
                                    application: `((${stats.raw.countA} + ${stats.raw.countB}) / ${stats.raw.totalCriteria}) × 100`,
                                    description: "نسبة النجاح الكلية (المقبولية الاجتماعية). تمثل الحد الأدنى المطلوب للانتقال."
                                }}
                            />
                        </div>
                    </section>

                    {/* SECTION 2: SCHOOL - TEACHER RELATIONSHIP */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-orange-200">
                            <div className="bg-orange-500 text-white p-2 rounded-lg shadow-lg shadow-orange-200">
                                <School size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">2. علاقة المدرسة بالأستاذ (مؤشرات العبء والمعالجة)</h3>
                                <p className="text-xs text-slate-500">تحدد حجم العمل المطلوب من الأستاذ لردم الفجوة ومعالجة النقائص.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Ind 1 */}
                            <IndicatorCard 
                                icon={Activity}
                                title="عبء المعالجة العام"
                                value={stats.indicators.tea_RemediationLoad}
                                subValue="حالة"
                                color="orange"
                                tooltipData={{
                                    formula: "مجموع (ج) + مجموع (د)",
                                    application: `${stats.raw.countC} + ${stats.raw.countD} = ${stats.indicators.tea_RemediationLoad}`,
                                    description: "العدد الإجمالي للمعايير التي تحتاج إلى تدخل علاجي (سواء جزئي أو كلي)."
                                }}
                            />
                            {/* Ind 2 */}
                            <IndicatorCard 
                                icon={AlertTriangle}
                                title="نسبة المعالجة (التعثر)"
                                value={stats.indicators.tea_RemediationRate.toFixed(2)}
                                subValue="%"
                                color="red"
                                tooltipData={{
                                    formula: "((ج + د) / العدد الكلي) × 100",
                                    application: `((${stats.raw.countC} + ${stats.raw.countD}) / ${stats.raw.totalCriteria}) × 100`,
                                    description: "حجم التعثر في القسم. إذا تجاوزت 50%، فالخلل هيكلي يتطلب إعادة النظر في طرائق التدريس."
                                }}
                            />
                            {/* Ind 3 */}
                            <IndicatorCard 
                                icon={TrendingUp}
                                title="مؤشر الفارق البيداغوجي"
                                value={stats.indicators.tea_PedagogicalGap.toFixed(2)}
                                subValue="%"
                                color="purple"
                                tooltipData={{
                                    formula: "مؤشر النجاعة - مؤشر الرضا النوعي",
                                    application: `${stats.indicators.soc_Efficiency.toFixed(2)} - ${stats.indicators.soc_SpecificSatisfaction.toFixed(2)}`,
                                    description: "يمثل نسبة التلاميذ في المنطقة (ب). هم ناجحون لكنهم ليسوا متميزين، وهم الفئة المستهدفة للتحسين."
                                }}
                            />
                        </div>
                    </section>

                    {/* SECTION 3: TEACHER - SUBJECT RELATIONSHIP */}
                    <section>
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-teal-200">
                            <div className="bg-teal-600 text-white p-2 rounded-lg shadow-lg shadow-teal-200">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">3. علاقة الأستاذ بالمادة (مؤشرات التحكم)</h3>
                                <p className="text-xs text-slate-500">تعكس مدى تمكن التلاميذ من الموارد المعرفية للمادة وكفاءاتها.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Ind 1 */}
                            <IndicatorCard 
                                icon={Scale}
                                title="نسبة التحكم الأقصى (الإتقان)"
                                value={stats.indicators.sub_Mastery.toFixed(2)}
                                subValue="%"
                                color="emerald"
                                tooltipData={{
                                    formula: "(مجموع أ / العدد الكلي) × 100",
                                    application: `(${stats.raw.countA} / ${stats.raw.totalCriteria}) × 100`,
                                    description: "تعكس جودة النقل الديداكتيكي للمادة وقدرة الأستاذ على إيصال المعارف المعقدة."
                                }}
                            />
                            {/* Ind 2 */}
                            <IndicatorCard 
                                icon={Sigma}
                                title="نسبة التحكم الجزئي (المتوسط)"
                                value={stats.indicators.sub_Partial.toFixed(2)}
                                subValue="%"
                                color="blue"
                                tooltipData={{
                                    formula: "(مجموع ب / العدد الكلي) × 100",
                                    application: `(${stats.raw.countB} / ${stats.raw.totalCriteria}) × 100`,
                                    description: "فئة التلاميذ الذين يملكون الموارد لكنهم يخطئون في التوظيف أحياناً."
                                }}
                            />
                            {/* Ind 3 */}
                            <IndicatorCard 
                                icon={TrendingDown}
                                title="نسبة التحكم المحدود (الخطر)"
                                value={stats.indicators.sub_Failure.toFixed(2)}
                                subValue="%"
                                color="red"
                                tooltipData={{
                                    formula: "(مجموع د / العدد الكلي) × 100",
                                    application: `(${stats.raw.countD} / ${stats.raw.totalCriteria}) × 100`,
                                    description: "الفئة التي لم تكتسب الحد الأدنى. ارتفاع هذه النسبة يشير لخلل في بناء التعلمات الأساسية للمادة."
                                }}
                            />
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default AcqStructuredAnalysis;