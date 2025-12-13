
import React, { useState, useEffect, useRef } from 'react';
import { Teacher, ReportData, TenureReportData } from '../types';
import { generateDatabaseRows, parseDatabaseRows, normalizeDate } from '../utils/sheetHelper';
import { syncWithScript, readFromScript } from '../services/sheetsService';
import { saveScriptUrlToCloud, isSupabaseConfigured } from '../services/supabaseService';
import { Database, RefreshCcw, CheckCircle2, AlertCircle, HardDrive, Download, Upload, CloudLightning, HelpCircle, Link, Cloud, Layers, FileStack } from 'lucide-react';
import GoogleSetupGuide from './GoogleSetupGuide';

interface DatabaseManagerProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    tenureReportsMap: Record<string, TenureReportData>;
    onRestore: (
        teachers: Teacher[], 
        reportsMap: Record<string, ReportData>,
        tenureReportsMap: Record<string, TenureReportData>
    ) => void;
    currentReport?: ReportData;
    
    isConnected: boolean;
    onConnectionChange: (status: boolean) => void;
    isAutoSync: boolean;
    onAutoSyncChange: (enabled: boolean) => void;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ 
    teachers, reportsMap, tenureReportsMap, onRestore, currentReport,
    isConnected, onConnectionChange, isAutoSync, onAutoSyncChange
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    
    const [scriptUrl, setScriptUrl] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load saved URL from LocalStorage
    useEffect(() => {
        const savedUrl = localStorage.getItem('mufattish_script_url');
        if (savedUrl) {
            setScriptUrl(savedUrl);
            onConnectionChange(true);
        }
    }, []);

    const toggleAutoSync = () => {
        const newState = !isAutoSync;
        onAutoSyncChange(newState);
        localStorage.setItem('mufattish_auto_sync', String(newState));
    };

    // --- SMART SAVE: Initializes DB immediately with current data ---
    const handleSaveUrl = async () => {
        if (!scriptUrl.includes('script.google.com')) {
            setStatus('error');
            setMessage('الرابط غير صحيح. يجب أن يبدأ بـ script.google.com');
            return;
        }
        
        // 1. Save Locally
        localStorage.setItem('mufattish_script_url', scriptUrl);
        
        // 2. Save Cloud (if configured)
        if (isSupabaseConfigured()) {
            saveScriptUrlToCloud(scriptUrl);
        }

        onConnectionChange(true);

        setIsLoading(true);
        setMessage('جاري الاتصال وتهيئة قاعدة البيانات...');
        
        try {
            // نرسل البيانات الحالية (teachers) لتهيئة الأعمدة والصفوف
            const data = generateDatabaseRows(teachers, currentReport, reportsMap);
            await syncWithScript(scriptUrl, data, 'SYNC_MAIN');
            
            setStatus('success');
            setMessage('تم الاتصال بنجاح! تم ربط الملف.');
        } catch (error: any) {
            console.error(error);
            setStatus('success'); 
            setMessage('تم حفظ الرابط، لكن تعذر الاتصال المباشر. تأكد من تحديث كود السكريبت (زر المساعدة).');
        } finally {
            setIsLoading(false);
        }
    };

    // --- UNIFIED SYNC (ALL DATA) ---
    const handleUnifiedSync = async () => {
        if (!scriptUrl) { setStatus('error'); setMessage('يرجى إدخال رابط السكريبت أولاً.'); return; }
        
        setIsLoading(true);
        setMessage('جاري حفظ جميع البيانات (أساتذة، سجلات، رزنامة)...');

        try {
            // 1. Teachers & Reports
            const mainData = generateDatabaseRows(teachers, currentReport, reportsMap);
            await syncWithScript(scriptUrl, mainData, 'SYNC_MAIN');

            // 2. Mail Register
            const mailData = localStorage.getItem('mufattish_mail_register');
            const parsedMail = mailData ? JSON.parse(mailData) : [];
            await syncWithScript(scriptUrl, parsedMail, 'SYNC_MAIL');

            // 3. Seminars
            const semData = localStorage.getItem('mufattish_seminars_calendar');
            const parsedSem = semData ? JSON.parse(semData) : [];
            await syncWithScript(scriptUrl, parsedSem, 'SYNC_SEMINARS');

            setStatus('success');
            setMessage('تمت عملية المزامنة الشاملة بنجاح! جميع بياناتك محفوظة الآن.');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`فشل المزامنة: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- UNIFIED FETCH (ALL DATA) ---
    const handleUnifiedFetch = async () => {
        if (!scriptUrl) return;
        if (!window.confirm("تحذير: سيتم استبدال جميع البيانات المحلية (أساتذة، سجلات، رزنامة) بالبيانات الموجودة في Google Sheet. هل تريد المتابعة؟")) return;

        setIsLoading(true);
        setMessage('جاري استرجاع جميع البيانات...');

        try {
            // 1. Fetch Teachers
            const mainValues = await readFromScript(scriptUrl, 'READ_MAIN');
            if (Array.isArray(mainValues)) {
                const { teachers: newTeachers, reportsMap: parsedReports } = parseDatabaseRows(mainValues);
                onRestore(newTeachers, parsedReports, tenureReportsMap);
            }

            // 2. Fetch Mail
            const mailData = await readFromScript(scriptUrl, 'READ_MAIL');
            if (Array.isArray(mailData)) {
                localStorage.setItem('mufattish_mail_register', JSON.stringify(mailData));
            }

            // 3. Fetch Seminars
            const semData = await readFromScript(scriptUrl, 'READ_SEMINARS');
            if (Array.isArray(semData)) {
                localStorage.setItem('mufattish_seminars_calendar', JSON.stringify(semData));
            }

            setStatus('success');
            setMessage('تم استرجاع قاعدة البيانات الكاملة بنجاح!');
            
            // Reload to refresh all components
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`فشل الاسترجاع: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOCAL JSON HANDLERS ---
    const handleDownloadJSON = () => {
        const backupData = {
            version: "1.1",
            date: new Date().toISOString(),
            teachers,
            reportsMap,
            tenureReportsMap,
            mailRegister: JSON.parse(localStorage.getItem('mufattish_mail_register') || '[]'),
            seminarsCalendar: JSON.parse(localStorage.getItem('mufattish_seminars_calendar') || '[]'),
            acqDB: JSON.parse(localStorage.getItem('mufattish_acq_db') || '{"records":[]}'),
            acqGlobalDB: JSON.parse(localStorage.getItem('mufattish_acq_global_db') || '{"records":[]}'),
            settings: {
                inspectorName: localStorage.getItem('mufattish_inspector_name'),
                signature: localStorage.getItem('mufattish_signature'),
                scriptUrl: localStorage.getItem('mufattish_script_url') 
            }
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mufattish_backup_full_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRestoreJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.teachers) {
                    if(window.confirm('تحذير: سيتم استبدال *جميع* البيانات الحالية بالنسخة الاحتياطية. هل تريد المتابعة؟')) {
                        
                        // 1. Restore Teachers & Reports
                        const cleanedTeachers = json.teachers.map((t: Teacher) => ({
                            ...t,
                            birthDate: normalizeDate(t.birthDate),
                            recruitmentDate: normalizeDate(t.recruitmentDate),
                            degreeDate: normalizeDate(t.degreeDate),
                            currentRankDate: normalizeDate(t.currentRankDate),
                            echelonDate: normalizeDate(t.echelonDate),
                            lastInspectionDate: normalizeDate(t.lastInspectionDate),
                            tenureDate: normalizeDate(t.tenureDate),
                        }));

                        const cleanedReports: Record<string, ReportData> = {};
                        if (json.reportsMap) {
                            Object.entries(json.reportsMap).forEach(([key, r]: [string, any]) => {
                                cleanedReports[key] = {
                                    ...r,
                                    inspectionDate: normalizeDate(r.inspectionDate),
                                    legacyData: r.legacyData ? {
                                        ...r.legacyData,
                                        trainingDate: normalizeDate(r.legacyData.trainingDate),
                                        graduationDate: normalizeDate(r.legacyData.graduationDate)
                                    } : undefined
                                };
                            });
                        }
                        onRestore(cleanedTeachers, cleanedReports, json.tenureReportsMap || {});

                        // 2. Restore Auxiliary Data
                        if (json.mailRegister) localStorage.setItem('mufattish_mail_register', JSON.stringify(json.mailRegister));
                        if (json.seminarsCalendar) localStorage.setItem('mufattish_seminars_calendar', JSON.stringify(json.seminarsCalendar));
                        if (json.acqDB) localStorage.setItem('mufattish_acq_db', JSON.stringify(json.acqDB));
                        if (json.acqGlobalDB) localStorage.setItem('mufattish_acq_global_db', JSON.stringify(json.acqGlobalDB));
                        
                        // 3. Restore Settings
                        if (json.settings) {
                            if (json.settings.scriptUrl) {
                                setScriptUrl(json.settings.scriptUrl);
                                localStorage.setItem('mufattish_script_url', json.settings.scriptUrl);
                                onConnectionChange(true);
                            }
                            if (json.settings.inspectorName) {
                                localStorage.setItem('mufattish_inspector_name', json.settings.inspectorName);
                            }
                        }

                        setStatus('success');
                        setMessage('تم استرجاع جميع البيانات بنجاح.');
                        window.location.reload(); // Reload to refresh all components states
                    }
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('ملف غير صالح.');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <GoogleSetupGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            <div className="text-center mb-10">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                    <Database size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 font-serif">إدارة قاعدة البيانات</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    اربط التطبيق بملف Google Sheet الخاص بك للوصول لبياناتك من أي مكان، أو احتفظ بنسخة محلية.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* OPTION 1: GOOGLE SHEETS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                        <h2 className="font-bold text-green-900 flex items-center gap-2">
                            <CloudLightning size={20}/>
                            Google Sheets (المزامنة الشاملة)
                        </h2>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={isConnected ? 'متصل' : 'غير متصل'}></div>
                    </div>
                    
                    <div className="p-6">
                        {!isConnected ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500 mb-4">
                                    الربط بملف Google Sheet يسمح لك بالعمل من أي مكان وتحديث البيانات آنياً.
                                </p>
                                <button 
                                    onClick={() => setShowGuide(true)}
                                    className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <HelpCircle size={16} />
                                    شاهد طريقة الحصول على الرابط
                                </button>
                                
                                <div className="relative">
                                    <input 
                                        placeholder="لصق رابط Web App URL هنا..." 
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        value={scriptUrl}
                                        onChange={e => setScriptUrl(e.target.value)}
                                    />
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                </div>

                                <button 
                                    onClick={handleSaveUrl}
                                    disabled={isLoading}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? <RefreshCcw className="animate-spin" size={18}/> : <Cloud size={18}/>}
                                    حفظ الرابط والاتصال
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Consolidated Action Buttons */}
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Layers className="text-green-600 mt-1" size={24}/>
                                        <div>
                                            <h3 className="font-bold text-green-900 text-lg">المزامنة الشاملة</h3>
                                            <p className="text-xs text-green-700 opacity-80 leading-relaxed">
                                                سيتم حفظ واسترجاع <b>كل البيانات</b> دفعة واحدة:
                                                <br/>
                                                (قائمة الأساتذة، سجل البريد، رزنامة الندوات).
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={handleUnifiedSync} 
                                            disabled={isLoading}
                                            className="bg-green-600 text-white py-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 hover:bg-green-700 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <Upload size={20}/>
                                            <span>حفظ الكل (رفع)</span>
                                        </button>
                                        <button 
                                            onClick={handleUnifiedFetch} 
                                            disabled={isLoading}
                                            className="bg-white border-2 border-green-600 text-green-700 py-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 hover:bg-green-50 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <Download size={20}/>
                                            <span>استرجاع الكل (جلب)</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isAutoSync ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`} onClick={toggleAutoSync}>
                                    <div className="flex items-center gap-2">
                                        <RefreshCcw size={16} className={isAutoSync ? "text-indigo-600" : "text-gray-400"} />
                                        <span className="text-xs font-bold text-gray-700">حفظ تلقائي (كل 5 دقائق)</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex ${isAutoSync ? 'bg-indigo-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                                        <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                                
                                <button onClick={() => { setScriptUrl(''); onConnectionChange(false); localStorage.removeItem('mufattish_script_url'); }} className="text-xs text-red-400 hover:text-red-600 underline w-full text-center mt-2">
                                    فصل الحساب / تغيير الرابط
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* OPTION 2: LOCAL JSON */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center justify-between">
                        <h2 className="font-bold text-purple-900 flex items-center gap-2">
                            <HardDrive size={20}/>
                            قاعدة بيانات محلية (ملف JSON)
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex items-start gap-3 mb-6">
                            <FileStack className="text-purple-500 mt-1" size={24}/>
                            <p className="text-sm text-gray-500">
                                حفظ نسخة كاملة من النظام على جهاز الكمبيوتر لاستعادتها في حالة <b>تعذر الاتصال بالسحابة</b> أو للعمل ببيانات منفصلة.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={handleDownloadJSON}
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-sm"
                            >
                                <Download size={20} />
                                تحميل نسخة كاملة (Backup)
                            </button>

                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept=".json"
                                    ref={fileInputRef}
                                    onChange={handleRestoreJSON}
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-white border-2 border-purple-100 text-purple-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
                                >
                                    <Upload size={20} />
                                    استرجاع من ملف
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800 flex items-center gap-2">
                             <AlertCircle size={14} className="shrink-0"/>
                             <span>تنبيه: الاسترجاع من ملف سيقوم باستبدال جميع البيانات الحالية.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATUS FEEDBACK */}
            {status !== 'idle' && (
                <div className={`mt-8 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2 
                    ${status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {status === 'success' ? <CheckCircle2 size={24} className="shrink-0 mt-1" /> : <AlertCircle size={24} className="shrink-0 mt-1" />}
                    <div className="flex-1">
                        <p className="font-bold">{message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseManager;
