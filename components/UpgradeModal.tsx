
import React, { useState, useRef } from 'react';
import { Crown, Check, X, Star, Sparkles, CreditCard, Facebook, Send, Phone, ShieldCheck, Upload, Loader2, AlertCircle, Copy, Clock, AlertTriangle } from 'lucide-react';
import { initiateChargilyPayment, submitManualPayment } from '../services/subscriptionService';
import { PlanType } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userStatus?: 'trial' | 'expired' | 'gold' | 'pending';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, userStatus }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<'chargily' | 'manual'>('chargily');
  const [manualMethod, setManualMethod] = useState<'ccp' | 'baridimob'>('ccp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isRenewal = userStatus === 'gold';

  const CCP_INFO = {
      holder: "دليحة أحمد رياض",
      number: "0042568209",
      key: "56"
  };
  
  const RIP_INFO = "00799999004256820956";

  const handleCopy = (text: string, field: string) => {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayment = async () => {
      setIsProcessing(true);
      setMessage(null);

      if (paymentMethod === 'chargily') {
          const res = await initiateChargilyPayment(selectedPlan);
          if (res.url) {
              window.open(res.url, '_blank', 'noopener,noreferrer');
              setMessage({ type: 'success', text: 'تم فتح صفحة الدفع في نافذة جديدة. سيتم تحديث حالة اشتراكك بعد الدفع.' });
          } else {
              setMessage({ type: 'error', text: res.message || 'حدث خطأ في الاتصال ببوابة الدفع' });
          }
      } else {
          // Manual Payment
          if (!manualFile) {
              setMessage({ type: 'error', text: 'يرجى إرفاق صورة وصل الدفع لإتمام العملية.' });
              setIsProcessing(false);
              return;
          }
          const res = await submitManualPayment(manualFile, selectedPlan);
          if (res.success) {
              setMessage({ type: 'success', text: 'تم إرسال الوصل بنجاح! سيقوم المسؤول بمراجعة الطلب وتمديد الصلاحية.' });
              setTimeout(() => {
                  onUpgrade(); 
              }, 4000);
          } else {
              setMessage({ type: 'error', text: res.message || 'فشل رفع الملف، يرجى المحاولة مرة أخرى.' });
          }
      }
      setIsProcessing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setManualFile(e.target.files[0]);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col md:flex-row my-8 max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 z-20 p-2 bg-white/50 hover:bg-white rounded-full transition-all"
        >
          <X size={24} />
        </button>

        {/* Left Side */}
        <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 relative overflow-hidden flex flex-col justify-between shrink-0">
            <div className="absolute top-0 right-0 p-10 opacity-10">
                {isRenewal ? <Clock size={200} /> : <Crown size={200} />}
            </div>
            
            <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${isRenewal ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20' : 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20'}`}>
                    {isRenewal ? <Clock size={32} className="text-white" /> : <Crown size={32} className="text-white" fill="currentColor" />}
                </div>
                <h2 className={`text-3xl font-bold mb-2 font-serif ${isRenewal ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isRenewal ? 'تجديد الاشتراك' : 'العضوية الذهبية'}
                </h2>
                <p className="text-slate-300 text-sm mb-8 leading-relaxed font-light">
                    {isRenewal 
                        ? 'شكراً لثقتكم. يمكنكم تمديد صلاحية اشتراككم الآن لضمان استمرارية العمل دون انقطاع.' 
                        : 'استثمر في مهنتك وارتقِ بأدائك البيداغوجي مع الأدوات الاحترافية للمفتش التربوي.'}
                </p>

                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                        <p className="text-sm text-slate-200">طباعة غير محدودة لجميع الوثائق.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                        <p className="text-sm text-slate-200">صياغة آلية للتوجيهات التربوية (AI).</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                        <p className="text-sm text-slate-200">مساعد إداري آلي (جداول، استدعاءات).</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                        <p className="text-sm text-slate-200">مزامنة سحابية آمنة.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <ShieldCheck size={14}/>
                    <span>دفع آمن 100% ومضمون</span>
                </div>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg text-center border ${isRenewal ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-white/10 text-amber-200 border-white/10'}`}>
                    {userStatus === 'gold' ? 'حسابك نشط حالياً (تجديد مسبق)' : 
                     userStatus === 'trial' ? 'أنت حالياً في الفترة التجريبية' : 
                     userStatus === 'expired' ? 'انتهت الفترة التجريبية' : 
                     userStatus === 'pending' ? 'طلبك قيد المراجعة' : ''}
                </div>
            </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-2/3 p-6 md:p-8 bg-slate-50 overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                {isRenewal ? 'اختر مدة التمديد الإضافية' : 'اختر خطة الاشتراك المناسبة'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Monthly */}
                <div 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all text-center group ${selectedPlan === 'monthly' ? 'border-blue-600 bg-white shadow-lg shadow-blue-100 ring-1 ring-blue-600' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                >
                    <p className="font-bold text-slate-700 mb-2">شهر إضافي</p>
                    <p className="text-2xl font-black text-blue-600 mb-1">700 دج</p>
                    <p className="text-[10px] text-slate-400">تمديد قصير المدى</p>
                </div>

                {/* Quarterly */}
                <div 
                    onClick={() => setSelectedPlan('quarterly')}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all text-center group ${selectedPlan === 'quarterly' ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-100 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        الأكثر طلباً
                    </div>
                    <p className="font-bold text-slate-700 mb-2">3 أشهر إضافية</p>
                    <p className="text-2xl font-black text-indigo-600 mb-1">1800 دج</p>
                    <p className="text-[10px] text-slate-400">600 دج/شهر (توفير 300 دج)</p>
                </div>

                {/* Yearly */}
                <div 
                    onClick={() => setSelectedPlan('yearly')}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all text-center group ${selectedPlan === 'yearly' ? 'border-amber-500 bg-amber-50/20 shadow-lg shadow-amber-100 ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-amber-300'}`}
                >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap flex items-center gap-1">
                        <Star size={10} fill="currentColor"/> توفير هائل
                    </div>
                    <p className="font-bold text-slate-700 mb-2">سنة كاملة</p>
                    <p className="text-2xl font-black text-amber-600 mb-1">4500 دج</p>
                    <p className="text-[10px] text-slate-400">375 دج/شهر (الأفضل قيمة)</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-1 flex mb-6 shadow-sm">
                <button 
                    onClick={() => setPaymentMethod('chargily')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'chargily' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <CreditCard size={16}/> بطاقة الذهبية / CIB
                </button>
                <button 
                    onClick={() => setPaymentMethod('manual')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'manual' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Upload size={16}/> دفع يدوي (CCP/RIP)
                </button>
            </div>

            <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {paymentMethod === 'chargily' ? (
                    <div className="space-y-4">
                        {/* WARNING ALERT */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-right animate-in slide-in-from-top-2">
                            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="text-amber-800 font-bold text-sm mb-1">تنبيه هام قبل الدفع:</h4>
                                <p className="text-amber-700 text-xs leading-relaxed">
                                    في صفحة الدفع، يرجى كتابة <strong>نفس البريد الإلكتروني</strong> الذي سجلت به في المنصة.
                                    <br/>
                                    هذا ضروري لربط عملية الدفع بحسابك وتفعيله آلياً، أو لتسهيل التفعيل اليدوي في حال حدوث أي خلل تقني.
                                </p>
                            </div>
                        </div>

                        <div className="text-center p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 transition-colors">
                            <img 
                                src="https://pay.chargily.com/test/images/logo.svg" 
                                alt="Chargily Pay" 
                                className="h-12 w-auto mb-2 opacity-90"
                            />
                            <div className="text-sm text-slate-600 max-w-sm">
                                <p className="font-bold mb-1">دفع آمن وفوري</p>
                                <p className="text-xs">سيتم فتح نافذة جديدة للدفع عبر بوابة Chargily الآمنة.</p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <div className="h-6 w-10 bg-white rounded border flex items-center justify-center shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/300px-Former_Visa_%28company%29_logo.svg.png" className="h-2 object-contain" alt=""/></div>
                                <div className="h-6 w-10 bg-white rounded border flex items-center justify-center shadow-sm"><span className="text-[8px] font-bold text-blue-800">CIB</span></div>
                                <div className="h-6 w-10 bg-white rounded border flex items-center justify-center shadow-sm"><span className="text-[8px] font-bold text-yellow-600">EDAHABIA</span></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex border-b border-slate-100 bg-slate-50/50">
                            <button 
                                onClick={() => setManualMethod('ccp')}
                                className={`flex-1 py-2 text-xs font-bold ${manualMethod === 'ccp' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                حوالة بريدية (CCP)
                            </button>
                            <button 
                                onClick={() => setManualMethod('baridimob')}
                                className={`flex-1 py-2 text-xs font-bold ${manualMethod === 'baridimob' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                BaridiMob (RIP)
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                {manualMethod === 'ccp' ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-500 font-bold mb-2">يرجى ملء الحوالة بالمعلومات التالية:</p>
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                                            <span className="text-xs text-blue-800 font-bold">الاسم: {CCP_INFO.holder}</span>
                                            <button onClick={() => handleCopy(CCP_INFO.holder, 'holder')} className="text-blue-400 hover:text-blue-600"><Copy size={14}/></button>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex-1 flex items-center justify-between">
                                                <span className="text-xs text-blue-800 font-mono font-bold">CCP: {CCP_INFO.number}</span>
                                                <button onClick={() => handleCopy(CCP_INFO.number, 'ccp')} className="text-blue-400 hover:text-blue-600"><Copy size={14}/></button>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 w-24 flex items-center justify-between">
                                                <span className="text-xs text-blue-800 font-mono font-bold">Clé: {CCP_INFO.key}</span>
                                                <button onClick={() => handleCopy(CCP_INFO.key, 'key')} className="text-blue-400 hover:text-blue-600"><Copy size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-500 font-bold mb-2">تحويل عبر تطبيق BaridiMob إلى الـ RIP التالي:</p>
                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center justify-between text-center">
                                            <span className="text-sm text-indigo-900 font-mono font-bold tracking-wider w-full select-all">{RIP_INFO}</span>
                                            <button onClick={() => handleCopy(RIP_INFO, 'rip')} className="text-indigo-400 hover:text-indigo-600 ml-2"><Copy size={16}/></button>
                                        </div>
                                    </div>
                                )}
                                {copiedField && <p className="text-[10px] text-green-600 text-center mt-2 animate-pulse">تم النسخ!</p>}
                            </div>
                            
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${manualFile ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                {manualFile ? (
                                    <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                                        <Check size={20} />
                                        <span className="truncate max-w-[200px]">{manualFile.name}</span>
                                        <span className="text-[10px] text-green-600 bg-white px-2 py-0.5 rounded-full shadow-sm">جاهز للإرسال</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Upload size={24} className="text-slate-400" />
                                        <span className="font-bold text-xs">اضغط هنا لرفع صورة الوصل</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-bold flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5"/> : <Check size={18} className="shrink-0 mt-0.5"/>}
                    <span>{message.text}</span>
                </div>
            )}

            <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isProcessing ? <Loader2 className="animate-spin" size={20}/> : (paymentMethod === 'chargily' ? 'الدفع الإلكتروني الآن' : (isRenewal ? 'تأكيد التجديد' : 'إرسال طلب التفعيل'))}
            </button>

            <div className="mt-6 text-center border-t border-slate-100 pt-4">
                <p className="text-[10px] text-slate-400 mb-3">واجهت مشكلة؟ فريق الدعم جاهز لمساعدتك:</p>
                <div className="flex justify-center gap-6 text-slate-400">
                    <a href="https://www.facebook.com/profile.php?id=61584959875720" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors"><Facebook size={18}/></a>
                    <a href="https://t.me/+5TbKaIJ_kgZhZDA0" target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors"><Send size={18}/></a>
                    <a href="https://chat.whatsapp.com/HTIWa3WFjq41WtAyFGzaDb?mode=hqrc" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors"><Phone size={18}/></a>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;