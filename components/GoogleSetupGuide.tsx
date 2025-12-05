
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, CheckCircle, FileCode, Globe, Save, Video, List, Youtube, ExternalLink } from 'lucide-react';

interface GoogleSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleSetupGuide: React.FC<GoogleSetupGuideProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'video'>('steps');
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // هام للمطور: ضع رابط فيديو الشرح الخاص بك هنا (YouTube Embed URL)
  // تم تصحيح الرابط لاستخدام صيغة /embed/ بدلاً من /watch?v=
  const VIDEO_URL = "https://www.youtube.com/embed/kJJvZm5hKX4"; 
  // ---------------------------------------------------------------------------

  if (!isOpen) return null;

  const SCRIPT_CODE = `
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : 'READ');
    
    if (action === 'SYNC') {
      const payload = JSON.parse(e.postData.contents);
      const data = payload.data; // مصفوفة البيانات ثنائية الأبعاد
      
      if (!data || !data.length) return response({status: 'empty'});

      // مسح البيانات القديمة
      sheet.clear();
      
      // كتابة البيانات الجديدة
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      
      // تنسيق الرأس (اختياري)
      sheet.getRange(1, 1, 1, data[0].length).setFontWeight("bold").setBackground("#f3f4f6");
      
      return response({status: 'success'});
    } 
    else if (action === 'READ') {
      const data = sheet.getDataRange().getValues();
      return response(data); // إرجاع المصفوفة مباشرة
    }
    
  } catch (error) {
    return response({status: 'error', message: error.toString()});
  } finally {
    lock.releaseLock();
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

  const copyCode = () => {
    navigator.clipboard.writeText(SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      title: "1. إنشاء ملف Google Sheet",
      icon: <FileCode size={24} />,
      content: (
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-600">هذه الخطوة تقوم بها مرة واحدة فقط لإنشاء قاعدة بياناتك.</p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm space-y-3">
            <p>1. افتح الرابط التالي لإنشاء ملف جديد: <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-1">sheets.new <ExternalLink size={12}/></a></p>
            <p>2. قم بتسمية الملف باسم واضح، مثلاً: <span className="font-bold text-gray-800">"بيانات المفتش 2024"</span>.</p>
            <p>3. من القائمة العلوية، اضغط على <span className="font-bold">الإضافات (Extensions)</span> ثم اختر <span className="font-bold">برمجة تطبيقات Google (Apps Script)</span>.</p>
          </div>
        </div>
      )
    },
    {
      title: "2. نسخ كود الربط (السكريبت)",
      icon: <Copy size={24} />,
      content: (
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-600">سيفتح لك محرر أكواد في تبويب جديد. اتبع التالي:</p>
          
          <div className="relative group">
            <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left text-xs font-mono h-40 overflow-y-auto custom-scrollbar" dir="ltr">
              <pre>{SCRIPT_CODE}</pre>
            </div>
            <button 
                onClick={copyCode}
                className="absolute top-2 right-2 bg-white text-gray-800 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-gray-100 flex items-center gap-1 transition-all"
            >
                {copied ? <CheckCircle size={14} className="text-green-600"/> : <Copy size={14}/>}
                {copied ? 'تم النسخ' : 'نسخ الكود'}
            </button>
          </div>
          
          <div className="bg-orange-50 p-3 rounded border border-orange-200 text-xs text-orange-800 font-bold space-y-1">
            <p>1. امسح أي كود موجود في المحرر.</p>
            <p>2. الصق الكود الذي نسخته.</p>
            <p>3. اضغط على أيقونة الحفظ (Save) في الأعلى.</p>
          </div>
        </div>
      )
    },
    {
      title: "3. نشر التطبيق (Deploy)",
      icon: <Globe size={24} />,
      content: (
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-600">هذه أهم خطوة للحصول على الرابط.</p>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 text-sm space-y-2">
            <p>1. اضغط على الزر الأزرق <span className="font-bold text-blue-600">نشر (Deploy)</span> في الأعلى يساراً.</p>
            <p>2. اختر <span className="font-bold">نشر جديد (New deployment)</span>.</p>
            <p>3. اضغط على الترس (Select type) واختر <span className="font-bold">تطبيق ويب (Web app)</span>.</p>
            <div className="bg-white p-2 rounded border border-indigo-100 mt-2">
                <p className="font-bold text-indigo-700 mb-1">إعدادات مهمة جداً:</p>
                <p>• الوصف: اكتب أي شيء (مثلاً: v1)</p>
                <p>• تنفيذ كـ (Execute as): <span className="font-bold">Me (ايميلي)</span></p>
                <p>• من يمكنه الوصول (Who has access): <span className="bg-yellow-200 px-1 rounded font-bold text-red-600">أي شخص (Anyone)</span></p>
            </div>
            <p className="text-xs text-gray-500 mt-1">* اختيار "أي شخص" ضروري ليعمل التطبيق دون طلب تسجيل دخول في كل مرة.</p>
            <p>4. اضغط <span className="font-bold">نشر (Deploy)</span>.</p>
          </div>
        </div>
      )
    },
    {
      title: "4. نسخ الرابط النهائي",
      icon: <Save size={24} />,
      content: (
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-600">في الخطوة الأخيرة سيطلب منك إذن الوصول (Authorize access).</p>
          
          <div className="bg-green-50 p-3 rounded border border-green-200 text-sm space-y-2">
             <p>1. وافق على الأذونات بحسابك.</p>
             <p className="text-xs text-gray-500 bg-white p-1 rounded">* قد تظهر رسالة "Google hasn’t verified this app". اضغط <span className="font-bold">Advanced</span> ثم <span className="font-bold underline">Go to ... (unsafe)</span>. هذا آمن لأنه كودك أنت.</p>
             <p>2. سيظهر لك رابط طويل في خانة <span className="font-bold">Web app URL</span>.</p>
             <p>3. انسخ هذا الرابط وضعه في التطبيق هنا.</p>
          </div>
          <div className="text-center mt-4">
              <span className="text-xs text-gray-400">انتهى الإعداد!</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">طريقة الربط بقاعدة البيانات</h2>
            <p className="text-xs text-gray-500">اختر الطريقة التي تفضلها للتعلم</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full border hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 mx-4 mt-4 rounded-lg shrink-0">
            <button 
                onClick={() => setActiveTab('steps')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'steps' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <List size={16} />
                خطوات مصورة
            </button>
            <button 
                onClick={() => setActiveTab('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'video' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Video size={16} />
                شرح بالفيديو
            </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
           {activeTab === 'steps' ? (
               <>
                <div className="flex items-center gap-3 mb-6">
                    <div className="text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                        {steps[currentStep].icon}
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">خطوة {currentStep + 1} من {steps.length}</span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{steps[currentStep].title}</h3>
                    </div>
                </div>
                
                <div className="animate-in slide-in-from-left-4 duration-300">
                    {steps[currentStep].content}
                </div>
               </>
           ) : (
               <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200 relative group">
                        {/* Placeholder logic: If URL is placeholder, show message */}
                        {VIDEO_URL.includes('placeholder') ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800">
                                <Youtube size={48} className="text-red-500 mb-4 opacity-80" />
                                <p className="font-bold text-lg">الفيديو غير متوفر حالياً</p>
                                <p className="text-xs text-gray-400 mt-2 text-center max-w-xs leading-relaxed">
                                    سيتم إضافة شرح فيديو تفصيلي قريباً يوضح العملية خطوة بخطوة.<br/>
                                    يرجى اتباع الخطوات النصية (تبويب "خطوات مصورة") في الوقت الحالي.
                                </p>
                            </div>
                        ) : (
                            <iframe 
                                src={VIDEO_URL} 
                                title="طريقة ربط Google Sheets"
                                className="w-full h-full"
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        )}
                   </div>
                   <div className="mt-6 text-center space-y-2">
                        <h4 className="font-bold text-gray-800">كيفية الحصول على الرابط في دقيقتين</h4>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                            شاهد الفيديو لتتعلم كيفية إنشاء الملف، لصق الكود، واستخراج الرابط الدائم للربط مع التطبيق.
                        </p>
                   </div>
               </div>
           )}
        </div>

        {/* Footer Navigation (Only for Steps) */}
        {activeTab === 'steps' && (
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center shrink-0">
            <button 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight size={16} />
                <span>السابق</span>
            </button>

            <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'bg-blue-600 w-6' : 'bg-gray-300 w-1.5'}`}></div>
                ))}
            </div>

            {currentStep < steps.length - 1 ? (
                <button 
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:translate-x-[-2px]"
                >
                    <span>التالي</span>
                    <ChevronLeft size={16} />
                </button>
            ) : (
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black shadow-lg shadow-gray-200 transition-all hover:scale-105"
                >
                    <span>فهمت، سأقوم بذلك</span>
                    <CheckCircle size={16} />
                </button>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSetupGuide;
