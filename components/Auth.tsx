
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseService';
import { Lock, Mail, Loader2, LogIn, UserPlus, AlertCircle, CheckCircle2, Shield, User, KeyRound } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New Fields
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign Up
  const [errorMsg, setErrorMsg] = useState('');
  const [message, setMessage] = useState('');

  const resetForm = () => {
      setErrorMsg('');
      setMessage('');
      setPassword('');
      setConfirmPassword('');
      // Keep email and name for convenience usually, but clear name if switching to login
      if (!isLogin) setFullName('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured() || !supabase) {
        setErrorMsg("لم يتم إعداد Supabase بشكل صحيح.");
        return;
    }

    // Validation
    if (!isLogin) {
        if (password !== confirmPassword) {
            setErrorMsg("كلمة المرور وتأكيدها غير متطابقين.");
            return;
        }
        if (fullName.trim().length < 3) {
            setErrorMsg("يرجى كتابة الاسم واللقب بشكل صحيح.");
            return;
        }
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      if (isLogin) {
        // عملية تسجيل الدخول
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // عملية إنشاء الحساب
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // تخزين الاسم في Metadata
            }
          }
        });
        if (error) throw error;
        setMessage('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد التسجيل.');
        // Reset to login mode visually but keep message
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('Invalid login')) {
          setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('يرجى تأكيد البريد الإلكتروني من صندوق الوارد لديك.');
      } else if (error.message.includes('User already registered')) {
          setErrorMsg('هذا البريد مسجل بالفعل، يرجى تسجيل الدخول.');
      } else if (error.message.includes('Password should be')) {
          setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      } else {
          setErrorMsg('حدث خطأ: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // شاشة التنبيه في حال عدم الإعداد
  if (!isSupabaseConfigured()) {
       return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center border border-orange-100">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <KeyRound size={40} className="text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">إعداد نظام المصادقة مطلوب</h2>
                <div className="text-gray-600 mb-8 text-sm leading-relaxed space-y-4 text-right">
                    <p className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>هذا التطبيق يتطلب الربط مع مشروع <b>Supabase</b> لتفعيل نظام إنشاء الحسابات وتسجيل الدخول.</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>بيانات الأساتذة والتقارير ستبقى <b>منفصلة تماماً</b> ولن يتم إرسالها إلى Supabase.</span>
                    </p>
                </div>
                
                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left text-xs font-mono mb-6 overflow-x-auto shadow-inner">
                    <span className="text-green-400"># In services/supabaseService.ts or .env file:</span><br/>
                    const SUPABASE_URL = "YOUR_PROJECT_URL";<br/>
                    const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
                </div>
                
                <p className="text-xs text-gray-400 border-t pt-4">
                    تأكد أيضاً من تثبيت المكتبة: <code>npm install @supabase/supabase-js</code>
                </p>
            </div>
        </div>
       );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-white p-8 pb-0 text-center relative z-10">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                <Lock className="text-white -rotate-3" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 font-serif">المفتش التربوي</h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">بوابة الدخول الآمن</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button 
                onClick={() => { setIsLogin(true); resetForm(); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isLogin ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  دخول
              </button>
              <button 
                onClick={() => { setIsLogin(false); resetForm(); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  إنشاء حساب
              </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0" />
                <span className="leading-snug">{errorMsg}</span>
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-xs border border-green-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <CheckCircle2 size={18} className="shrink-0" />
                <span className="leading-snug">{message}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Full Name Field (Sign Up Only) */}
            {!isLogin && (
                <div className="animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2 mr-1">الاسم واللقب</label>
                    <div className="relative group">
                        <input
                        type="text"
                        required={!isLogin}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-sm bg-gray-50 focus:bg-white font-bold text-gray-700"
                        placeholder="محمد فلان"
                        />
                        <div className="absolute right-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <User size={20} />
                        </div>
                    </div>
                </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 mr-1">البريد الإلكتروني</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-sm bg-gray-50 focus:bg-white font-bold text-gray-700"
                  placeholder="name@education.dz"
                />
                <div className="absolute right-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={20} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 mr-1">كلمة المرور</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-sm bg-gray-50 focus:bg-white font-bold text-gray-700"
                  placeholder="••••••••"
                  minLength={6}
                />
                <div className="absolute right-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={20} />
                </div>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {!isLogin && (
                <div className="animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2 mr-1">تأكيد كلمة المرور</label>
                    <div className="relative group">
                        <input
                        type="password"
                        required={!isLogin}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-4 pr-11 py-3 border-2 rounded-xl focus:ring-0 outline-none transition-all text-sm bg-gray-50 focus:bg-white font-bold text-gray-700 ${confirmPassword && password !== confirmPassword ? 'border-red-200 focus:border-red-500' : 'border-gray-100 focus:border-blue-500'}`}
                        placeholder="••••••••"
                        minLength={6}
                        />
                        <div className="absolute right-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Lock size={20} />
                        </div>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-[10px] text-red-500 mt-1 mr-1 font-bold">كلمات المرور غير متطابقة</p>
                    )}
                </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isLogin ? (
                <>
                    <LogIn size={20} />
                    تسجيل الدخول
                </>
              ) : (
                <>
                    <UserPlus size={20} />
                    إنشاء الحساب
                </>
              )}
            </button>
          </form>
            
          {/* Privacy Note */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-500 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-1">
                  <Shield size={14} />
                  <span>خصوصية البيانات مضمونة</span>
              </div>
              <p className="leading-relaxed opacity-80">
                  يُستخدم هذا الحساب <b>فقط للمصادقة</b> (الدخول والخروج). 
                  بياناتك التربوية (الأساتذة، التقارير) تُحفظ محلياً أو على Google Sheets ولا يتم مشاركتها مع قاعدة بيانات الحسابات هذه.
              </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
