
import React, { useState } from 'react';
import { X, BookOpen, Calculator, BarChart2, Activity, Scale, AlertTriangle, Link2, Shapes, Filter, Puzzle, GraduationCap } from 'lucide-react';

interface AcqGuideModalProps {
    onClose: () => void;
}

const AcqGuideModal: React.FC<AcqGuideModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('general');

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <Calculator size={20}/> 1. أساس الحساب (التكميم - Quantification)
                            </h3>
                            <p className="text-slate-700 leading-relaxed mb-4 text-sm">
                                تعتمد جميع الخوارزميات في هذا النظام على تحويل التقديرات النوعية (حروف) إلى قيم كمية (أرقام) لتتم معالجتها إحصائياً. السلم المعتمد هو:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                                    <span className="block font-bold text-emerald-600 text-lg">أ</span>
                                    <span className="text-xs text-slate-500">تحكم أقصى = 3 نقاط</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                    <span className="block font-bold text-blue-600 text-lg">ب</span>
                                    <span className="text-xs text-slate-500">تحكم مقبول = 2 نقطتان</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                                    <span className="block font-bold text-orange-600 text-lg">ج</span>
                                    <span className="text-xs text-slate-500">تحكم جزئي = 1 نقطة</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                                    <span className="block font-bold text-red-600 text-lg">د</span>
                                    <span className="text-xs text-slate-500">تحكم محدود = 0</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Scale size={20} className="text-purple-600"/> 2. مؤشر التجانس (Homogeneity Index)
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-sm text-slate-700 mb-2">كيف يحسب؟</h4>
                                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                                    يعتمد على حساب <strong>الانحراف المعياري (Standard Deviation)</strong> لمعدلات التلاميذ. 
                                    نقوم بحساب معدل القسم ككل، ثم نحسب بعد كل تلميذ عن هذا المعدل.
                                </p>
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg">
                                    <li><strong>أقل من 15:</strong> قسم متجانس (الفروق فردية بسيطة).</li>
                                    <li><strong>بين 15 و 25:</strong> تجانس متوسط (الوضع الطبيعي).</li>
                                    <li><strong>أكثر من 25:</strong> قسم مشتت (فوارق صارخة تتطلب التفويج).</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BarChart2 size={20} className="text-indigo-600"/> 3. توزيع التحكم (المنحنى البياني)
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    يعكس الحالة الصحية للقسم. الوضع الطبيعي (منحنى غاوس) يقتضي تمركز الأغلبية في المنطقة (ب)، مع قلة في الامتياز (أ) وقلة في التعثر (د).
                                    <br/>
                                    <strong>مؤشر الخطر:</strong> إذا كانت كتلة (ج + د) أكبر من كتلة (أ + ب).
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'cross':
                return (
                    <div className="space-y-8 animate-in fade-in">
                         <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <Link2 size={20}/> مصفوفة التقاطع (وحدة اللغة)
                            </h3>
                            <p className="text-slate-700 leading-relaxed mb-4 text-sm text-justify">
                                هذا الرسم البياني المتقدم يقيس مدى انتقال أثر التعلم بين <strong>اللغة العربية</strong> و <strong>التربية الإسلامية</strong>. إليك الشرح المفصل لآلية عمله:
                            </p>

                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-xl border border-indigo-200">
                                    <h4 className="font-bold text-sm text-indigo-700 mb-2">1. حساب المحور الأفقي (X): كفاءة القراءة</h4>
                                    <p className="text-xs text-slate-600 leading-loose">
                                        نجمع نقاط معايير "الأداء القرائي" في اللغة العربية (4 معايير).<br/>
                                        المجموع الأقصى = 12 نقطة.<br/>
                                        <strong>المعادلة:</strong> (مجموع نقاط التلميذ / 12) × 100.<br/>
                                        مثال: تلميذ حصل (أ، أ، ب، ب) = 10 نقاط ← نسبته 83% (أقصى اليمين).
                                    </p>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-indigo-200">
                                    <h4 className="font-bold text-sm text-indigo-700 mb-2">2. حساب المحور العمودي (Y): كفاءة التلاوة</h4>
                                    <p className="text-xs text-slate-600 leading-loose">
                                        نجمع نقاط معايير "حسن التلاوة" في التربية الإسلامية (3 معايير).<br/>
                                        المجموع الأقصى = 9 نقاط.<br/>
                                        <strong>المعادلة:</strong> (مجموع نقاط التلميذ / 9) × 100.<br/>
                                        مثال: تلميذ حصل (ج، د، ج) = 2 نقاط ← نسبته 22% (أسفل).
                                    </p>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-indigo-200">
                                    <h4 className="font-bold text-sm text-indigo-700 mb-2">3. سر الألوان (مؤشر النقل الديداكتيكي)</h4>
                                    <p className="text-xs text-slate-600 leading-loose mb-2">
                                        نحسب الفارق بين المستويين: |نسبة العربية - نسبة الإسلامية|.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                            <span className="text-xs font-bold">نقطة خضراء (نقل ناجح):</span>
                                            <span className="text-xs text-slate-500">الفارق أقل من 15 درجة. مستواه متقارب في المادتين.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-xs font-bold">نقطة حمراء (قطيعة):</span>
                                            <span className="text-xs text-slate-500">الفارق كبير. مهارة القراءة لا تخدم التلاوة.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800 text-white p-4 rounded-xl">
                                    <h4 className="font-bold text-sm text-amber-400 mb-3">دليل قراءة المربعات الأربعة:</h4>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="font-bold text-emerald-300 block mb-1">↗ أعلى اليمين (تحكم شامل):</span>
                                            ممتاز في القراءة وممتاز في التلاوة.
                                        </div>
                                        <div>
                                            <span className="font-bold text-red-300 block mb-1">↙ أسفل اليسار (تعثر شامل):</span>
                                            ضعيف في المادتين (مشكلة في فك الرمز).
                                        </div>
                                        <div>
                                            <span className="font-bold text-yellow-300 block mb-1">↖ أعلى اليسار (حفظ سماعي):</span>
                                            تلاوة جيدة وقراءة ضعيفة (يحفظ بالسمع ولا يقرأ).
                                        </div>
                                        <div>
                                            <span className="font-bold text-blue-300 block mb-1">↘ أسفل اليمين (قارئ غير مرتّل):</span>
                                            يقرأ بطلاقة لكن لا يطبق أحكام التلاوة.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'math':
                return (
                    <div className="space-y-8 animate-in fade-in">
                        {/* 1. Matrix */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Puzzle size={20} className="text-teal-500"/> 1. مصفوفة الرياضيات (آلية / منطق)
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed text-justify">
                                <p className="mb-2"><strong>المبدأ:</strong> نقارن بين "التحكم في الموارد" (الحساب، القواعد) و "الكفاءة المنهجية" (حل المشكلات).</p>
                                <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <li><strong>حساب آلي (حفظ):</strong> تلميذ يتقن العمليات (أ) لكن يفشل في حل المشكلة (ج/د). هو يملك الأداة ولا يعرف متى يستخدمها.</li>
                                    <li><strong>تعثر إجرائي (منطق سليم):</strong> تلميذ يفهم المشكلة ويختار العملية الصحيحة (أ) لكن يخطئ في الحساب (ج). مشكلته في التركيز والدقة.</li>
                                </ul>
                            </div>
                        </div>

                        {/* 2. Abstract Triangle */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Shapes size={20} className="text-purple-500"/> 2. مثلث المفاهيم المجردة
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed text-justify">
                                <p className="mb-2"><strong>المبدأ:</strong> تحليل الترابط بين (الكسور - الأعداد العشرية - النسبة المئوية).</p>
                                <p>
                                    نقوم بجمع نقاط المعايير الخاصة بكل مفهوم على حدة. إذا كان المثلث "متساوي الأضلاع" (النسب متقاربة)، فالتلميذ يدرك العلاقة بينها (0.5 = 1/2 = 50%). 
                                    إذا كان هناك ضلع قصير جداً، فهذا يعني وجود "انكسار مفاهيمي" (يدرسها كدروس منفصلة لا رابط بينها).
                                </p>
                            </div>
                        </div>

                        {/* 3. Funnel */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Filter size={20} className="text-pink-500"/> 3. قمع التفكير الرياضي
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed text-justify">
                                <p>
                                    يقيس عدد التلاميذ الذين "يبقون على قيد الحياة" معرفياً كلما زادت درجة التجريد.
                                    <br/>
                                    <strong>المسار:</strong> عمليات بسيطة ← هندسة وقياس ← كسور ← تناسبية.
                                    <br/>
                                    نقطة الاختناق (أكبر انخفاض في العدد) تشير إلى الدرس الذي شكل "عقبة ديداكتيكية" للجماعة التربوية.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'language':
                return (
                    <div className="space-y-8 animate-in fade-in">
                        {/* 1. Didactic Gap */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Scale size={20} className="text-indigo-500"/> 1. الفجوة الديداكتيكية (النحو والتوظيف)
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed text-justify">
                                <p className="mb-2"><strong>طريقة الحساب:</strong> نقارن معدل التحكم في "قواعد اللغة" (نحو/صرف) بمعدل "الرسم الإملائي والتوظيف" في الإنتاج.</p>
                                <p>
                                    إذا كان الفارق موجباً وكبيراً (النحو 90% / التوظيف 40%)، فهذا يعني أن التلاميذ يحفظون القواعد نظرياً (إعراب الكلمات المعزولة) لكن لا يستحضرونها عند الكتابة. هذا يسمى "انفصال وظيفي".
                                </p>
                            </div>
                        </div>

                        {/* 2. Radar */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Activity size={20} className="text-purple-500"/> 2. رادار الكفاءات
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed text-justify">
                                <p>
                                    يتم حساب النسبة المئوية لكل ميدان (تعبير شفوي، قراءة، فهم مكتوب، إنتاج) بجمع نقاط جميع المعايير التابعة له وتقسيمها على المجموع الكلي الممكن.
                                    الشكل المثالي هو "المربع" أو "الدائرة" المكتملة. أي انبعاج نحو الداخل يشير إلى ميدان مهمل بيداغوجياً.
                                </p>
                            </div>
                        </div>

                        {/* 3. Illiteracy Index */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-red-500"/> 3. مؤشر الهشاشة القاعدية
                            </h3>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed text-justify">
                                <p>
                                    <strong>المعادلة الصارمة:</strong> نقوم بحصر التلاميذ الذين حصلوا على تقدير (د - تحكم محدود) في معيار "القراءة المسترسلة" (فك الرمز) 
                                    <strong>و</strong> تقدير (د) في "الرسم الإملائي" معاً.
                                    <br/>
                                    هؤلاء التلاميذ يعانون من أمية مقنعة، وهم مهددون بالتسرب المدرسي لأنهم يفتقدون لأداة التعلم (اللغة).
                                </p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg">
                            <GraduationCap size={24}/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-serif text-slate-800">الدليل المرجعي لقراءة المؤشرات</h2>
                            <p className="text-sm text-slate-500">شرح الأسس الرياضية والتربوية للخوارزميات</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-50 border-l border-slate-200 p-4 space-y-2 overflow-y-auto">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'general' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Calculator size={16} /> المفاهيم العامة
                        </button>
                        <button 
                            onClick={() => setActiveTab('cross')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'cross' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Link2 size={16} /> التقاطع (عربية/إسلامية)
                        </button>
                        <button 
                            onClick={() => setActiveTab('math')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'math' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Shapes size={16} /> مؤشرات الرياضيات
                        </button>
                        <button 
                            onClick={() => setActiveTab('language')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'language' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <BookOpen size={16} /> مؤشرات اللغة
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
                        {renderContent()}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AcqGuideModal;
