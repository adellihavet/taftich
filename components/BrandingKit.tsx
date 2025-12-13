
import React from 'react';
import { Facebook, Send, ShieldCheck, Lock, Database, FileText, BarChart2, Briefcase, Phone, CheckCircle2, LayoutDashboard, Calculator, CalendarDays, ScrollText, Users, Table2, Layers, Search, Map } from 'lucide-react';

const BrandingKit: React.FC = () => {
    const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#172554;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="blur"/>
      <feOffset in="blur" dx="5" dy="5" result="offsetBlur"/>
      <feMerge>
        <feMergeNode in="offsetBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path fill="url(#grad1)" d="M256 0L477.7 128V384L256 512L34.3 384V128L256 0Z" filter="url(#shadow)" />
  <path fill="none" stroke="#fbbf24" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" d="M360 160C360 160 340 250 256 350C190 270 170 230 170 230" />
  <path fill="none" stroke="#fbbf24" stroke-width="40" stroke-linecap="round" d="M256 350L310 410" />
</svg>
    `;

    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto bg-slate-50 animate-in fade-in custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-12 pb-12">
                
                {/* 1. HEADER & SOCIALS */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 drop-shadow-xl shrink-0">
                            <div dangerouslySetInnerHTML={{ __html: logoSvg }} className="w-full h-full" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 font-serif mb-1">المفتش التربوي</h1>
                            <p className="text-slate-500 font-medium">محتوى المنصة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-2 pr-4 rounded-full border border-slate-100">
                        <span className="text-xs font-bold text-slate-400">للتواصل والدعم:</span>
                        <div className="flex gap-2">
                            <a href="https://www.facebook.com/profile.php?id=61584959875720" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm transform hover:scale-110" title="فيسبوك">
                                <Facebook size={20} />
                            </a>
                            <a href="https://t.me/+5TbKaIJ_kgZhZDA0" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sky-100 text-sky-500 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm transform hover:scale-110" title="تيليجرام">
                                <Send size={20} />
                            </a>
                            <a href="https://chat.whatsapp.com/HTIWa3WFjq41WtAyFGzaDb?mode=hqrc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm transform hover:scale-110" title="واتساب">
                                <Phone size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* 2. PRIVACY GUARANTEE */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
                        <ShieldCheck size={250} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 shadow-inner">
                            <Lock size={56} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 text-center md:text-right">
                            <h2 className="text-2xl font-bold mb-3 font-serif text-emerald-300">ميثاق الخصوصية والأمان</h2>
                            <p className="leading-relaxed text-slate-200 text-lg mb-4 max-w-3xl">
                                تم تصميم هذه المنصة وفق مبدأ <strong>"البيانات ملك للمستخدم"</strong>. نطمئن السادة المفتشين أن:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                                    <span>البيانات تُحفظ حصرياً على جهازك الشخصي.</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                                    <span>لا توجد خوادم خارجية تطلع على تقاريرك.</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                                    <span>أنت المتحكم الوحيد في النسخ الاحتياطي.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. CONCEPTUAL MAP (THE CORE) */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-serif mb-8 border-r-4 border-blue-600 pr-4">
                        الخريطة الوظيفية للمنصة
                    </h2>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        
                        {/* A. DEPARTMENT OF DATA (Database) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="bg-blue-50/50 p-6 border-b border-blue-100 flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                                    <Database size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">1. قاعدة البيانات والرقمنة</h3>
                                    <p className="text-sm text-slate-500">النواة المركزية لتسيير ملفات الأساتذة</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 flex-1">
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">الاستيراد الذكي (Excel)</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            استيراد قوائم الأساتذة دفعة واحدة من ملفات الرقمنة (Excel) مع التعرف التلقائي على الرتب والدرجات والتواريخ.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">المزامنة السحابية (Google Sheets)</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            ربط التطبيق بملف Google Sheet خاص بك، مما يسمح لك بالعمل من أي جهاز (هاتف، حاسوب) وتحديث البيانات آنياً.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">التحديث الآلي للمسار المهني</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            النظام يقوم بحساب الأقدمية وتواريخ الترقية تلقائياً، وينبهك للأساتذة المعنيين بالزيارة.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* B. DEPARTMENT OF PEDAGOGY (Inspection) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                                    <FileText size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">2. التحرير التربوي والزيارات</h3>
                                    <p className="text-sm text-slate-500">مكتب التفتيش الافتراضي</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 flex-1">
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">التقرير الرقمي الحديث</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            تحرير تقارير التفتيش وفق شبكة معايير دقيقة. يتضمن خاصية <strong>الاقتراح الآلي</strong> لصياغة التوجيهات التربوية آلياً.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">تقارير التثبيت (الترسيم)</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            وحدة خاصة لرقمنة امتحان التثبيت: معالجة الأنشطة، الأسئلة الشفوية، وحساب المعدل النهائي آلياً مع طباعة المحضر الرسمي.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">النموذج الكلاسيكي (القديم)</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            الاحتفاظ بنموذج التقرير القديم (شبكة الملاحظة التقليدية) للسادة المفتشين الذين يفضلون النمط الكلاسيكي.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* C. DEPARTMENT OF ANALYSIS (Acquisitions) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="bg-teal-50/50 p-6 border-b border-teal-100 flex items-center gap-4">
                                <div className="p-3 bg-teal-100 text-teal-700 rounded-xl">
                                    <BarChart2 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">3. تحليل وتقييم المكتسبات</h3>
                                    <p className="text-sm text-slate-500">المخبر البيداغوجي للمقاطعة</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 flex-1">
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-teal-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">المعالجة الآلية للبيانات</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            استيراد ملفات الرقمنة (الشبكات التفصيلية والإجمالية) وتحويلها فوراً إلى مؤشرات دقيقة (نسب التحكم، التوزيع).
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-teal-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">التشخيص المعمق (Focus Mode)</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            تحليل نوعي للكفاءات (مثل: الفجوة الديداكتيكية، مصفوفة القراءة/الكتابة) لتحديد مكامن الخلل بدقة علمية.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-teal-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">مخطط المعالجة والنجاعة</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            توليد آلي لقوائم التلاميذ المتعثرين حسب المعيار، واقتراح خطط علاجية مبنية على "تاريخ الصعوبة".
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* D. DEPARTMENT OF MANAGEMENT (Admin Assistant) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="bg-amber-50/50 p-6 border-b border-amber-100 flex items-center gap-4">
                                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                                    <Briefcase size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">4. المساعد الإداري والتسيير</h3>
                                    <p className="text-sm text-slate-500">أتمتة المهام الروتينية</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 flex-1">
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">جداول الإرسال الآلية</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            إعداد جداول إرسال التقارير للمديرية أو المدارس بضغطة زر، مع الفرز التلقائي للمعنيين.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">الرزنامة والاستدعاءات</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            تسيير رزنامة الندوات التربوية، وتحرير استدعاءات الامتحانات المهنية (التثبيت) والمراسلات الإدارية.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 group-hover:scale-150 transition-transform"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-1">الحصيلة الفصلية</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            تجميع إحصائيات النشاط الفصلي (زيارات، ندوات، تفتيش) في وثيقة رسمية جاهزة للطباعة.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Quote */}
                <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-slate-400 font-serif italic text-lg">
                        "الرقمنة ليست مجرد أداة، بل هي أسلوب إدارة يمنح المفتش الوقت للتركيز على الجوهر: الفعل التربوي."
                    </p>
                </div>

            </div>
        </div>
    );
};

export default BrandingKit;
