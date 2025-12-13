import React, { useState } from 'react';
import { Database, Server, Key, Copy, Check, Terminal, Globe, ShieldCheck, Info, Youtube, HardDrive, Laptop, Globe2, AlertTriangle, Zap, Loader2, ExternalLink, RadioReceiver, ArrowLeftRight, CreditCard } from 'lucide-react';
import { supabase } from '../../services/supabaseService';

const BackendSetupGuide: React.FC = () => {
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [copied, setCopied] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [checkoutUrl, setCheckoutUrl] = useState('');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const testConnection = async () => {
        setTestStatus('loading');
        setTestMessage('');
        setCheckoutUrl('');
        try {
            if (!supabase) throw new Error("Supabase غير متصل");
            
            console.log("Testing connection to 'super-action'...");
            
            // استخدام UUID وهمي صالح لتفادي خطأ قاعدة البيانات عند الاستقبال
            // هذا المعرف لن يطابق أي مستخدم حقيقي، لكنه سيمر عبر المدقق
            const dummyUUID = "00000000-0000-0000-0000-000000000000";

            const { data, error } = await supabase.functions.invoke('super-action', {
                body: { planType: 'monthly', userId: dummyUUID }
            });

            if (error) {
                console.error("Edge Function Error:", error);
                throw error;
            }

            console.log("Response Data:", data);

            if (data && (data.checkout_url || data.id)) {
                setTestStatus('success');
                setTestMessage('الاتصال ناجح! الدالة تعمل وتتصل بـ Chargily.');
                if (data.checkout_url) setCheckoutUrl(data.checkout_url);
            } else if (data && data.error) {
                 throw new Error("رد الدالة بخطأ: " + data.error);
            } else {
                throw new Error("لم يتم استرجاع رابط الدفع. تأكد من المفتاح السري.");
            }
        } catch (err: any) {
            console.error(err);
            setTestStatus('error');
            setTestMessage(err.message || "فشل الاتصال. تأكد أن الدالة اسمها super-action.");
        }
    };

    // --- STEP 1: SQL PROFILES & STORAGE ---
    const SQL_PROFILES = `
-- 1. إنشاء جدول الملفات الشخصية (النسخة الكاملة)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  subscription_status text default 'trial',
  plan_type text, 
  trial_ends_at timestamp with time zone default (now() + interval '30 days'),
  subscription_ends_at timestamp with time zone,
  payment_receipt_url text,
  created_at timestamp with time zone default now()
);

-- 2. تفعيل نظام الحماية (RLS)
alter table public.profiles enable row level security;

-- 3. سياسات الأمان
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 4. إعداد التخزين (Storage)
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "Anyone can upload receipts" on storage.objects for insert with check ( bucket_id = 'receipts' );
create policy "Anyone can view receipts" on storage.objects for select using ( bucket_id = 'receipts' );

-- 5. دالة الإنشاء التلقائي
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, trial_ends_at)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', (now() + interval '30 days'));
  return new;
end;
$$ language plpgsql security definer;

-- 6. تفعيل الدالة
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;

    // --- STEP 2: SQL SEMINARS ---
    const SQL_SEMINARS = `
-- 1. إنشاء جدول الندوات (العروض الجاهزة)
create table if not exists public_seminars (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text not null, 
  url text not null,   
  color text default 'bg-blue-600'
);

-- 2. تفعيل الحماية
alter table public_seminars enable row level security;

-- 3. السياسات
create policy "Public Seminars are viewable by everyone" 
on public_seminars for select using ( true );

create policy "Admins can insert seminars" 
on public_seminars for insert with check ( auth.role() = 'authenticated' );

create policy "Admins can delete seminars" 
on public_seminars for delete using ( auth.role() = 'authenticated' );
`;

    // --- STEP 3: EDGE FUNCTION (SENDER) ---
    const FUNCTION_CODE = `
// الكود الحديث (يعمل مباشرة بدون استيراد مكتبات)
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planType, userId } = await req.json()
    
    let amount = 700;
    if (planType === 'quarterly') amount = 1800;
    if (planType === 'yearly') amount = 4500;

    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')
    if (!CHARGILY_SECRET_KEY) {
      throw new Error('المفتاح السري غير موجود في الإعدادات')
    }

    const response = await fetch("https://pay.chargily.net/api/v2/checkouts", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + CHARGILY_SECRET_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        currency: "dzd",
        success_url: "http://localhost:5173/success", 
        failure_url: "http://localhost:5173/failure", 
        metadata: { user_id: userId, plan_type: planType },
        locale: "ar"
      })
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
`;

    // --- STEP 5: WEBHOOK (RECEIVER) ---
    const WEBHOOK_CODE = `
// هذا الكود يوضع في دالة جديدة اسمها: payment-webhook
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 1. استقبال الرسالة من Chargily
    const payload = await req.json()
    const eventType = payload.type

    // 2. التحقق من نجاح الدفع
    if (eventType === 'checkout.paid') {
      const checkout = payload.data
      const userId = checkout.metadata.user_id
      const planType = checkout.metadata.plan_type
      
      // 3. الاتصال بقاعدة البيانات (بصلاحيات المسؤول)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabase = createClient(supabaseUrl, supabaseKey)

      // 4. حساب تاريخ الانتهاء
      const now = new Date()
      let endDate = new Date()
      
      if (planType === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
      else if (planType === 'quarterly') endDate.setMonth(endDate.getMonth() + 3)
      else if (planType === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1)

      // 5. تفعيل اشتراك المستخدم
      const { error } = await supabase
        .from('profiles')
        .update({ 
            subscription_status: 'active',
            plan_type: planType,
            subscription_ends_at: endDate.toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      console.log('User activated:', userId)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
`;

    return (
        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-2xl border border-slate-700 h-full overflow-y-auto custom-scrollbar" dir="rtl">
            
            <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-6">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                    <Terminal size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white font-serif">دليل الربط التقني (Backend)</h2>
                    <p className="text-sm text-slate-400 mt-1">إعدادات السيرفر والدفع الإلكتروني</p>
                </div>
            </div>

            {/* Steps Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                <button 
                    onClick={() => setActiveStep(1)}
                    className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center gap-2 transition-all ${activeStep === 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                    <Database size={16} /> 1. الجداول
                </button>
                <button 
                    onClick={() => setActiveStep(2)}
                    className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center gap-2 transition-all ${activeStep === 2 ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                    <Youtube size={16} /> 2. المحتوى
                </button>
                <button 
                    onClick={() => setActiveStep(3)}
                    className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center gap-2 transition-all ${activeStep === 3 ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                    <Globe2 size={16} /> 3. الإرسال
                </button>
                <button 
                    onClick={() => setActiveStep(4)}
                    className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center gap-2 transition-all ${activeStep === 4 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                    <Key size={16} /> 4. المفتاح
                </button>
                <button 
                    onClick={() => setActiveStep(5)}
                    className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl font-bold text-[10px] md:text-xs flex flex-col md:flex-row items-center justify-center gap-2 transition-all ${activeStep === 5 ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                    <ArrowLeftRight size={16} /> 5. الاستقبال
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-black/50 rounded-2xl border border-slate-700 p-6 relative">
                
                {/* Copy Button */}
                <button 
                    onClick={() => handleCopy(
                        activeStep === 1 ? SQL_PROFILES : 
                        activeStep === 2 ? SQL_SEMINARS :
                        activeStep === 3 ? FUNCTION_CODE : 
                        activeStep === 5 ? WEBHOOK_CODE : ''
                    )}
                    className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                    disabled={activeStep === 4}
                >
                    {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                    {copied ? 'تم النسخ' : 'نسخ الكود'}
                </button>

                {activeStep === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-blue-300 text-sm bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                            <HardDrive size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-2 font-bold text-lg">الخطوة الأولى: تهيئة قاعدة البيانات</strong>
                                <p className="leading-relaxed mb-2">
                                    انسخ هذا الكود وضعه في <strong>SQL Editor</strong> في Supabase واضغط Run.
                                    <br/>
                                    <span className="text-xs opacity-70">(إذا قمت بذلك سابقاً، يمكنك تجاوزه).</span>
                                </p>
                            </div>
                        </div>
                        <pre className="text-left text-xs font-mono text-emerald-400 overflow-x-auto p-4 bg-black rounded-xl border border-slate-800 leading-relaxed selection:bg-emerald-900" dir="ltr">
                            {SQL_PROFILES}
                        </pre>
                    </div>
                )}

                {activeStep === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-orange-300 text-sm bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                            <Info size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-2 font-bold text-lg">الخطوة الثانية: جدول العروض</strong>
                                <p className="leading-relaxed">
                                    هذا الجدول خاص بتخزين "العروض الجاهزة" التي تظهر للمفتش.
                                </p>
                            </div>
                        </div>
                        <pre className="text-left text-xs font-mono text-orange-300 overflow-x-auto p-4 bg-black rounded-xl border border-slate-800 leading-relaxed selection:bg-orange-900" dir="ltr">
                            {SQL_SEMINARS}
                        </pre>
                    </div>
                )}

                {activeStep === 3 && (
                    <div className="space-y-4">
                         <div className="flex items-start gap-3 text-purple-300 text-sm bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                            <Globe2 size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-2 font-bold text-lg">الخطوة الثالثة: دالة الإرسال (super-action)</strong>
                                <p className="leading-relaxed mb-3">
                                    هذه الدالة مسؤولة عن <strong>إنشاء رابط الدفع</strong>.
                                </p>
                                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs">
                                    <li>في لوحة Supabase، اذهب إلى <strong>Edge Functions</strong>.</li>
                                    <li>أنشئ دالة باسم <code>super-action</code> (أو عدلها إن وجدت).</li>
                                    <li>الصق الكود التالي.</li>
                                </ol>
                            </div>
                        </div>
                        <pre className="text-left text-xs font-mono text-blue-300 overflow-x-auto p-4 bg-black rounded-xl border border-slate-800 leading-relaxed selection:bg-blue-900" dir="ltr">
                            {FUNCTION_CODE}
                        </pre>
                    </div>
                )}

                {activeStep === 4 && (
                    <div className="space-y-6 text-center py-8">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                            <Key size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">الخطوة الرابعة: ربط المفتاح السري</h3>
                        <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
                            لكي تعمل عملية الدفع، يجب تزويد الدالة بالمفتاح السري (Secret Key) من Chargily.
                        </p>
                        
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-right space-y-4 max-w-2xl mx-auto">
                            <div className="flex gap-3 items-start bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
                                <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-yellow-200">
                                    <strong>هام جداً:</strong> تأكد من إضافة المفتاح السري في قسم Secrets لكلتا الدالتين (super-action و payment-webhook) إذا لزم الأمر، أو في الإعدادات العامة.
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex gap-3">
                                    <span className="bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <p className="text-sm">ابحث عن قسم <strong>Environment Variables</strong> (أو Secrets).</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <p className="text-sm">أضف متغيراً جديداً (New Secret) بالبيانات التالية:</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" dir="ltr">
                                <div className="bg-black p-3 rounded border border-slate-600">
                                    <p className="text-xs text-gray-500 mb-1">Name (الاسم)</p>
                                    <code className="text-yellow-400 font-bold select-all">CHARGILY_SECRET_KEY</code>
                                </div>
                                <div className="bg-black p-3 rounded border border-slate-600">
                                    <p className="text-xs text-gray-500 mb-1">Value (القيمة)</p>
                                    <code className="text-emerald-400 select-all">test_sk_... (المفتاح السري)</code>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-700 pt-6">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center justify-center gap-2">
                                <Zap className="text-yellow-400" size={20}/>
                                اختبار الاتصال الكامل
                            </h4>
                            <button 
                                onClick={testConnection}
                                disabled={testStatus === 'loading'}
                                className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all ${
                                    testStatus === 'success' ? 'bg-green-600 text-white' :
                                    testStatus === 'error' ? 'bg-red-600 text-white' :
                                    'bg-white text-slate-900 hover:bg-slate-200'
                                }`}
                            >
                                {testStatus === 'loading' ? <Loader2 size={18} className="animate-spin"/> : <Globe2 size={18}/>}
                                {testStatus === 'success' ? 'نجح الاتصال!' : testStatus === 'error' ? 'فشل الاتصال' : 'تجربة الاتصال بـ Chargily الآن'}
                            </button>
                            
                            {testMessage && (
                                <p className={`mt-4 text-xs font-bold ${testStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {testMessage}
                                </p>
                            )}

                            {testStatus === 'success' && checkoutUrl && (
                                <div className="mt-6 bg-slate-800 p-4 rounded-xl border border-slate-600 animate-in fade-in slide-in-from-bottom-2">
                                    <h5 className="text-emerald-400 font-bold mb-3 flex items-center gap-2 justify-center">
                                        <CreditCard size={18}/> البطاقة الذهبية التجريبية
                                    </h5>
                                    <p className="text-slate-300 text-sm mb-4">استخدم هذه المعلومات للدفع الوهمي:</p>
                                    <div className="bg-black p-3 rounded border border-slate-500 font-mono text-sm text-yellow-400 select-all mb-4 dir-ltr">
                                        5078 0300 0000 0001
                                    </div>
                                    <a 
                                        href={checkoutUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-900/20 w-full justify-center"
                                    >
                                        <ExternalLink size={18} />
                                        فتح صفحة الدفع (محاكاة)
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeStep === 5 && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-pink-300 text-sm bg-pink-500/10 p-4 rounded-lg border border-pink-500/20">
                            <RadioReceiver size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-2 font-bold text-lg">الخطوة الخامسة: دالة الاستقبال (Webhook)</strong>
                                <p className="leading-relaxed mb-3">
                                    هذه هي الدالة التي ستخبر تطبيقك بنجاح الدفع. <strong className="text-white bg-red-600 px-1 rounded">لا تستخدم دالة super-action هنا!</strong>
                                </p>
                                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs">
                                    <li>أنشئ دالة <strong>جديدة</strong> باسم <code>payment-webhook</code>.</li>
                                    <li>انسخ الكود بالأسفل وضعه فيها.</li>
                                    <li>اضغط <strong>Deploy</strong>.</li>
                                    <li>انسخ الرابط الناتج وضعه في حقل <strong>Webhook URL</strong> في Chargily.</li>
                                </ol>
                            </div>
                        </div>
                        <pre className="text-left text-xs font-mono text-pink-300 overflow-x-auto p-4 bg-black rounded-xl border border-slate-800 leading-relaxed selection:bg-pink-900" dir="ltr">
                            {WEBHOOK_CODE}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackendSetupGuide;