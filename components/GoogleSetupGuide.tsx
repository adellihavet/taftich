
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, CheckCircle, Code, Globe, Play, Save } from 'lucide-react';

interface GoogleSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleSetupGuide: React.FC<GoogleSetupGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const scriptCode = `
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var json = JSON.parse(e.postData.contents);
  
  // Clear all data first
  sheet.clear();
  
  // Write new data
  if (json.values && json.values.length > 0) {
    sheet.getRange(1, 1, json.values.length, json.values[0].length).setValues(json.values);
    
    // Formatting Header
    var header = sheet.getRange(1, 1, 1, json.values[0].length);
    header.setFontWeight("bold");
    header.setBackground("#f3f4f6");
  }
  
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}
  `.trim();

  const steps = [
    {
      title: "1. فتح محرر النصوص (Apps Script)",
      icon: <Code size={24} />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">افتح ملف Google Sheet جديد (أو الحالي) الذي تريد تخزين البيانات فيه.</p>
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-sm space-y-2">
            <p>1. من القائمة العلوية اضغط على: <span className="font-bold">Extensions (الإضافات)</span>.</p>
            <p>2. اختر: <span className="font-bold">Apps Script</span>.</p>
            <p>3. ستفتح لك نافذة جديدة بها كود برمجي.</p>
          </div>
        </div>
      )
    },
    {
      title: "2. نسخ الكود البرمجي",
      icon: <Copy size={24} />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">انسخ الكود التالي وامسح أي كود موجود في المحرر، ثم ألصق هذا مكانه:</p>
          
          <div className="relative bg-gray-900 rounded-lg p-4 overflow-hidden">
            <button 
                onClick={() => navigator.clipboard.writeText(scriptCode)}
                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors"
                title="نسخ الكود"
            >
                <Copy size={16} />
            </button>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto h-48 custom-scrollbar">
                {scriptCode}
            </pre>
          </div>
          <p className="text-xs text-center text-gray-500">اضغط أيقونة الحفظ (Save icon) بعد اللصق.</p>
        </div>
      )
    },
    {
      title: "3. النشر (Deploy) - أهم خطوة",
      icon: <Globe size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm space-y-3 text-blue-900">
             <div className="flex items-center gap-2 font-bold border-b border-blue-200 pb-2">
                <Play size={16} className="rotate-90" />
                خطوات دقيقة جداً:
             </div>
             <ol className="list-decimal list-inside space-y-2">
                 <li>اضغط الزر الأزرق <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">Deploy</span> في الأعلى.</li>
                 <li>اختر <span className="font-bold">New deployment</span>.</li>
                 <li>اضغط على الترس (Select type) واختر <span className="font-bold">Web app</span>.</li>
                 <li>في خانة Description اكتب: Mufattish.</li>
                 <li>
                     <span className="text-red-600 font-bold block mt-1">هام جداً:</span>
                     في خانة <span className="font-bold">Who has access</span>، اختر:
                     <br/>
                     <span className="bg-yellow-200 px-1 rounded font-bold">Anyone (الجميع)</span>
                 </li>
                 <li>اضغط <span className="font-bold">Deploy</span>.</li>
             </ol>
          </div>
        </div>
      )
    },
    {
      title: "4. الحصول على الرابط",
      icon: <CheckCircle size={24} />,
      content: (
        <div className="space-y-5 text-center">
            <p className="text-sm text-gray-600">
                بعد الضغط على Deploy، قد يطلب منك جوجل (Authorize access).
                <br/>وافق واختار حسابك، ثم اضغط Advanced {'>'} Go to (unsafe) للموافقة.
            </p>
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                <h4 className="font-bold text-green-800 mb-2">انسخ الـ Web App URL</h4>
                <p className="text-xs text-green-700 mb-2">الرابط يبدأ بـ: ...script.google.com/macros/s</p>
                <div className="bg-white p-2 rounded border border-dashed border-green-300 text-gray-400 text-xs truncate">
                    https://script.google.com/macros/s/AKfycbx.../exec
                </div>
            </div>
            <p className="font-bold text-gray-800">هذا الرابط هو "مفتاحك". ضعه في التطبيق ومبروك عليك!</p>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">خطوة {currentStep + 1} / {steps.length}</span>
            ربط Google Sheet (بدون تسجيل دخول)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full border hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
           <div className="flex items-center gap-3 mb-6">
              <div className="text-green-600 bg-green-50 p-3 rounded-xl">
                {steps[currentStep].icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{steps[currentStep].title}</h3>
           </div>
           
           <div className="animate-in slide-in-from-right-4 duration-300">
              {steps[currentStep].content}
           </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span>السابق</span>
          </button>

          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-green-600 w-4' : 'bg-gray-300'}`}></div>
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button 
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
            >
                <span>التالي</span>
                <ChevronLeft size={16} className="rotate-180" />
            </button>
          ) : (
             <button 
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black shadow-sm"
            >
                <span>إنهاء</span>
                <CheckCircle size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default GoogleSetupGuide;
