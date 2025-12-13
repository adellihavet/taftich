
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, CheckCircle, FileCode, Globe, Video, List, Youtube, AlertTriangle, ShieldCheck, PlayCircle, Save } from 'lucide-react';

interface GoogleSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleSetupGuide: React.FC<GoogleSetupGuideProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'video'>('steps');
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // رابط فيديو تعليمي (يمكن استبداله لاحقاً بفيديو مخصص)
  const VIDEO_URL = "https://www.youtube.com/embed/kJJvZm5hKX4"; 

  // الكود المصحح والآمن (الذي يحل مشكلة الأعمدة)
  const SCRIPT_CODE = `
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const action = e.parameter.action || postData.action || 'READ_MAIN';
    
    let sheetName = "قاعدة بيانات المقاطعة";
    if (action.includes('ACQ')) sheetName = "قاعدة بيانات تقييم المكتسبات";
    else if (action.includes('MAIL')) sheetName = "سجل البريد (صادر/وارد)";
    else if (action.includes('SEMINARS')) sheetName = "رزنامة الندوات";

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.setDirection(SpreadsheetApp.Direction.RIGHT_TO_LEFT);
    }

    // --- WRITE ACTIONS (SYNC) ---
    if (action.startsWith('SYNC_')) {
      const data = postData.data;
      
      // Special handling for Mail/Seminars which are arrays of objects
      let rows = [];
      if (action === 'SYNC_MAIL') {
          // Headers
          rows.push(["ID", "النوع", "السنة", "الرقم", "التاريخ", "المراسل/المرسل إليه", "الموضوع", "المرجع", "ملاحظات"]);
          if (data && data.length > 0) {
            data.forEach(r => rows.push([r.id, r.type, r.year, r.number, r.date, r.correspondent, r.subject, r.reference || '', r.notes || '']));
          }
      } else if (action === 'SYNC_SEMINARS') {
          // Headers
          rows.push(["ID", "الموضوع", "التاريخ", "المكان", "خارجي؟", "المدة", "الفئة المستهدفة", "المشرف", "ملاحظات"]);
          if (data && data.length > 0) {
            data.forEach(r => rows.push([r.id, r.topic, r.date, r.location, r.isExternalLocation, r.duration, JSON.stringify(r.targetLevels), r.supervisor, r.notes || '']));
          }
      } else if (action === 'SYNC_ACQ') {
          // ... Existing ACQ Logic (Simplified for brevity in update) ...
          // Re-using logic from previous version for ACQ if array of objects passed differently, 
          // or generic array handling if passed as rows.
          // Assuming ACQ passes rows or objects. If objects:
           if (sheet.getMaxColumns() < 10) sheet.insertColumnsAfter(sheet.getMaxColumns(), 10);
           const records = data;
           if (!records || records.length === 0) {
              if (sheet.getLastRow() === 0) {
                  sheet.appendRow(["ID", "المدرسة", "القسم", "المادة", "تاريخ_التحديث", "بيانات_JSON"]);
                  sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#e0f2fe");
              }
              return response({status: 'initialized'});
           }
           const existingData = sheet.getDataRange().getValues();
           const idMap = {};
           for (let i = 1; i < existingData.length; i++) { idMap[existingData[i][0]] = i + 1; }
           const recordsArray = Array.isArray(records) ? records : [records];
           recordsArray.forEach(rec => {
              if (rec.type === 'GLOBAL_RECORD' || rec.schoolName) {
                  const rowData = [rec.id, rec.schoolName, rec.className || 'عام', rec.subject || 'عام', new Date().toISOString(), JSON.stringify(rec)];
                  if (idMap[rec.id]) sheet.getRange(idMap[rec.id], 1, 1, rowData.length).setValues([rowData]);
                  else sheet.appendRow(rowData);
              }
           });
           return response({status: 'success'});
      } else {
          // SYNC_MAIN (Teachers) - expects 2D Array
          rows = data;
      }

      // Execute Write for non-ACQ (Mail, Seminars, Main)
      if (action !== 'SYNC_ACQ') {
          if (!rows || !rows.length) {
              sheet.clear();
              return response({status: 'cleared'});
          }
          const requiredCols = rows[0].length;
          const currentCols = sheet.getMaxColumns();
          if (requiredCols > currentCols) sheet.insertColumnsAfter(currentCols, requiredCols - currentCols);
          
          sheet.clear(); // Overwrite Mode
          sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
          sheet.getRange(1, 1, 1, rows[0].length).setFontWeight("bold").setBackground("#f3f4f6").setBorder(true, true, true, true, true, true);
      }
      return response({status: 'success'});
    } 
    
    // --- READ ACTIONS ---
    else if (action.startsWith('READ_')) {
      if (sheet.getLastRow() <= 1) return response([]); // Empty or Header only
      const data = sheet.getDataRange().getValues();
      
      if (action === 'READ_MAIL') {
          const records = [];
          for (let i = 1; i < data.length; i++) {
              const row = data[i];
              records.push({id: row[0], type: row[1], year: row[2], number: row[3], date: row[4], correspondent: row[5], subject: row[6], reference: row[7], notes: row[8]});
          }
          return response(records);
      } else if (action === 'READ_SEMINARS') {
          const records = [];
          for (let i = 1; i < data.length; i++) {
              const row = data[i];
              let targets = [];
              try { targets = JSON.parse(row[6]); } catch(e) { targets = []; }
              records.push({id: row[0], topic: row[1], date: row[2], location: row[3], isExternalLocation: row[4], duration: row[5], targetLevels: targets, supervisor: row[7], notes: row[8]});
          }
          return response(records);
      } else if (action === 'READ_ACQ') {
          const parsedRecords = [];
          for (let i = 1; i < data.length; i++) {
             try { const jsonStr = data[i][5]; if (jsonStr) parsedRecords.push(JSON.parse(jsonStr)); } catch(e) {}
          }
          return response(parsedRecords);
      } else {
          // READ_MAIN
          return response(data);
      }
    }
    
  } catch (error) {
    return response({status: 'error', message: error.toString()});
  } finally {
    lock.releaseLock();
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;

  const copyCode = () => {
    navigator.clipboard.writeText(SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      title: "1. إنشاء ملف Google Sheet جديد",
      icon: <FileCode size={24} />,
      content: (
        <div className="space-y-5 text-right">
          <p className="text-sm text-gray-600 leading-relaxed">
            للبدء، نحتاج إلى "وعاء" لحفظ البيانات. اتبع هذه الخطوات البسيطة لإنشاء ملف جديد:
          </p>
          <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
            <div className="flex items-start gap-3">
                <span className="bg-white border border-gray-200 text-gray-700 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <p className="text-sm text-gray-700">افتح موقع <a href="https://sheets.google.com" target="_blank" className="text-blue-600 underline font-bold hover:text-blue-800">Google Sheets</a>.</p>
            </div>
            <div className="flex items-start gap-3">
                <span className="bg-white border border-gray-200 text-gray-700 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <p className="text-sm text-gray-700">اضغط على علامة <strong>(+)</strong> لإنشاء ملف فارغ <br/><span className="text-xs text-gray-500 font-normal">(Blank spreadsheet - Feuille de calcul vierge)</span>.</p>
            </div>
            <div className="flex items-start gap-3">
                <span className="bg-white border border-gray-200 text-gray-700 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <p className="text-sm text-gray-700">في الشريط العلوي، اضغط على <strong>الإضافات</strong> <br/><span className="text-xs text-gray-500 font-normal">(Extensions - Extensions)</span>.</p>
            </div>
            <div className="flex items-start gap-3">
                <span className="bg-white border border-gray-200 text-gray-700 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                <p className="text-sm text-gray-700">من القائمة، اختر <strong>Apps Script</strong>.</p>
            </div>
          </div>
          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
            <InfoIcon size={16} />
            <span>سيفتح لك هذا نافذة جديدة لكتابة الكود. لا تغلق النافذة القديمة.</span>
          </div>
        </div>
      )
    },
    {
      title: "2. لصق الكود وحفظه (هام جداً)",
      icon: <Save size={24} />,
      content: (
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-600">
            الآن سنضع "العقل المدبر" في الملف. انسخ الكود التالي ثم الصقه في المحرر، ولا تنس <strong>الحفظ</strong>:
          </p>
          
          <div className="relative group mt-2 dir-ltr">
            <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left text-xs font-mono h-40 overflow-y-auto custom-scrollbar border border-gray-700 shadow-inner">
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

          <div className="space-y-3 mt-4">
             <div className="flex items-center gap-2 text-sm text-gray-700">
                 <CheckCircle size={16} className="text-green-500 shrink-0"/>
                 <span>امسح أي كود موجود مسبقاً في المحرر (مثل <code>function myFunction...</code>).</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-gray-700">
                 <CheckCircle size={16} className="text-green-500 shrink-0"/>
                 <span>ألصق الكود الذي نسخته في المربع الأسود أعلاه.</span>
             </div>
             <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-3 animate-pulse">
                 <Save size={20} className="text-red-600 shrink-0 mt-0.5"/>
                 <div className="text-sm text-red-800 font-bold">
                     خطوة منسية غالباً: اضغط على أيقونة الحفظ (Disquette) في الشريط العلوي.
                     <br/>
                     <span className="text-xs font-normal text-red-600">(Save project - Enregistrer le projet)</span>
                 </div>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "3. نشر التطبيق (Deploy)",
      icon: <Globe size={24} />,
      content: (
        <div className="space-y-5 text-right">
          <p className="text-sm text-gray-600">
            لجعل التطبيق يعمل، نحتاج لنشره. هذه الخطوة تتطلب دقة في اختيار الإعدادات لضمان عمل الرابط:
          </p>
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 text-sm space-y-4 shadow-sm">
            <p className="flex items-center gap-2">
                <span className="bg-indigo-200 text-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                اضغط على الزر الأزرق <strong>نشر (Deploy - Déployer)</strong> في أعلى اليمين.
            </p>
            <p className="flex items-center gap-2">
                <span className="bg-indigo-200 text-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                اختر <strong>نشر جديد (New deployment - Nouvelle déploiement)</strong>.
            </p>
            <p className="flex items-center gap-2">
                <span className="bg-indigo-200 text-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                اضغط على الترس (Select type) واختر <strong>تطبيق ويب (Web app)</strong>.
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-indigo-100 space-y-4 mt-2">
                <p className="text-xs text-gray-500 font-bold border-b pb-2 mb-2">املأ الخيارات كالتالي بدقة:</p>
                
                <div className="space-y-3 text-xs">
                    <div>
                        <span className="font-bold block text-gray-700 mb-1">الوصف (Description):</span>
                        <span className="text-gray-500">اكتب أي اسم (مثلاً: V1).</span>
                    </div>
                    
                    <div>
                        <span className="font-bold block text-gray-700 mb-1">تنفيذ كـ (Execute as - Exécuter en tant que):</span>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100 inline-block">
                            أنا (Me - Moi)
                        </span>
                    </div>
                    
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <span className="font-bold block text-gray-800 mb-1">
                             من لديه حق الوصول (Who has access - Qui a accès):
                        </span>
                        <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-600"/>
                                <span className="font-bold text-green-700">أي شخص (Anyone - Anyone - N'importe qui)</span>
                            </div>
                            <div className="flex items-start gap-2 text-[10px] text-amber-700 bg-white/50 p-1.5 rounded">
                                <AlertTriangle size={12} className="shrink-0 mt-0.5"/>
                                <span>تنبيه: لا تختر (Anyone with Google account)، اختر (Anyone) فقط.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="flex items-center gap-2 pt-2">
                <span className="bg-indigo-200 text-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                اضغط <strong>نشر (Deploy - Déployer)</strong>.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "4. منح الصلاحيات (Authorize)",
      icon: <ShieldCheck size={24} />,
      content: (
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-600">
            ستظهر نوافذ تطلب الإذن (لأن الكود سيعدل على ملفك). لا تقلق، هذا إجراء روتيني من جوجل:
          </p>
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>اضغط <strong>منح الوصول (Authorize access - Autoriser l'accès)</strong>.</li>
                <li>اختر حسابك في Google.</li>
                <li className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-red-500 font-bold text-xs mb-1 flex items-center gap-1">
                        <AlertTriangle size={12}/> شاشة التحذير المخيفة:
                    </div>
                    قد تظهر شاشة "Google hasn't verified this app" (لم يتم التحقق من التطبيق).
                    <br/>
                    <span className="text-xs text-gray-500">هذا طبيعي لأنك أنت المطور.</span>
                    <div className="mt-2 text-xs font-bold text-blue-600">
                        1. اضغط على "Advanced" (متقدم / Paramètres avancés).<br/>
                        2. اضغط على الرابط في الأسفل "Go to ... (unsafe)" أو "Accéder à ... (non sécurisé)".
                    </div>
                </li>
                <li>اضغط <strong>سماح (Allow - Autoriser)</strong>.</li>
            </ol>
          </div>
          
          <div className="mt-6 text-center bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm animate-in zoom-in">
               <h4 className="text-green-800 font-bold mb-1">🎉 مبروك!</h4>
               <p className="text-sm text-green-700 mb-2">انسخ الرابط الطويل الموجود تحت <strong>Web app URL</strong>.</p>
               <p className="text-xs text-green-600">عد الآن للتطبيق وألصق الرابط في الخانة المخصصة.</p>
          </div>
        </div>
      )
    }
  ];

  // Helper Icon for Step 1
  function InfoIcon({ size }: { size: number }) {
      return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
      );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">دليل ربط قاعدة البيانات (تحديث جديد)</h2>
            <p className="text-xs text-gray-500">تم تحديث الكود لدعم السجلات والرزنامة</p>
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
                الخطوات (صور وكتابة)
            </button>
            <button 
                onClick={() => setActiveTab('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'video' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Video size={16} />
                فيديو الشرح
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
                        {VIDEO_URL.includes('placeholder') ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800">
                                <Youtube size={48} className="text-red-500 mb-4 opacity-80" />
                                <p className="font-bold text-lg">الفيديو غير متوفر حالياً</p>
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
                        <h4 className="font-bold text-gray-800">شرح طريقة الحصول على الرابط</h4>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                            يمكنك مشاهدة الفيديو لتطبيق الخطوات بشكل عملي.
                        </p>
                   </div>
               </div>
           )}
        </div>

        {/* Footer */}
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
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all"
                >
                    <span>التالي</span>
                    <ChevronLeft size={16} />
                </button>
            ) : (
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black shadow-lg shadow-gray-200 transition-all hover:scale-105"
                >
                    <span>تم، سأجرب الرابط</span>
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