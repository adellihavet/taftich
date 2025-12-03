
import React, { useState, useEffect, useRef } from 'react';
import { Teacher, ReportData, TenureReportData } from '../types';
import { generateDatabaseRows, parseDatabaseRows } from '../utils/sheetHelper';
import { syncWithScript, readFromScript } from '../services/sheetsService';
import { saveScriptUrlToCloud, isSupabaseConfigured } from '../services/supabaseService';
import { Database, RefreshCcw, CheckCircle2, AlertCircle, ExternalLink, HardDrive, Download, Upload, CloudLightning, HelpCircle, Link, AlertTriangle, Cloud } from 'lucide-react';
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

    const handleSaveUrl = async () => {
        if (!scriptUrl.includes('script.google.com')) {
            setStatus('error');
            setMessage('الرابط غير صحيح. يجب أن يبدأ بـ script.google.com');
            return;
        }
        
        localStorage.setItem('mufattish_script_url', scriptUrl);
        
        // Save to Cloud if user is logged in
        if (isSupabaseConfigured()) {
            saveScriptUrlToCloud(scriptUrl);
        }

        onConnectionChange(true);
        setStatus('success');
        setMessage('تم حفظ الرابط بنجاح.');
    };

    const handleSync = async () => {
        if (!scriptUrl) {
             setStatus('error');
             setMessage('يرجى إدخال رابط السكريبت أولاً.');
             return;
        }
        
        setIsLoading(true);
        setMessage('جاري رفع البيانات إلى Google Sheet...');

        try {
            const data = generateDatabaseRows(teachers, currentReport, reportsMap);
            await syncWithScript(scriptUrl, data);
            
            setStatus('success');
            setMessage('تمت المزامنة وحفظ البيانات بنجاح!');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`فشل المزامنة: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetch = async () => {
        if (!scriptUrl) return;

        setIsLoading(true);
        setMessage('جاري جلب البيانات من Google Sheet...');

        try {
            const values = await readFromScript(scriptUrl);
            
            if (!Array.isArray(values)) {
                throw new Error("تنسيق البيانات المستلمة غير صحيح");
            }

            const { teachers: newTeachers, reportsMap: parsedReports } = parseDatabaseRows(values);

            if (newTeachers.length === 0) {
                setMessage("تم الاتصال بنجاح، لكن الملف فارغ.");
                setStatus('success');
            } else {
                onRestore(newTeachers, parsedReports, tenureReportsMap);
                setStatus('success');
                setMessage(`تم استرجاع ${newTeachers.length} أستاذ بنجاح!`);
            }
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`فشل الاسترجاع: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadJSON = () => {
        const backupData = {
            version: "1.0",
            date: new Date().toISOString(),
            teachers,
            reportsMap,
            tenureReportsMap,
            settings: {
                inspectorName: localStorage.getItem('mufattish_inspector_name'),
                signature: localStorage.getItem('mufattish_signature'),
                isGold: localStorage.getItem('mufattish_is_gold') === 'true',
                // نحفظ الرابط هنا لسهولة النقل لجهاز آخر
                scriptUrl: localStorage.getItem('mufattish_script_url') 
            }
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mufattish_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                    if(window.confirm('هل أنت متأكد؟ سيتم دمج/استبدال البيانات.')) {
                        onRestore(json.teachers, json.reportsMap || {}, json.tenureReportsMap || {});
                        
                        // استرجاع الإعدادات والرابط إن وجد
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
                        setMessage('تم استرجاع البيانات والإعدادات بنجاح.');
                    }
                }
            } catch (err) {
                setStatus('error');
                setMessage('ملف غير صالح.');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <GoogleSetupGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            <div className="text-center mb-10">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                    <Database size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 font-serif">إدارة قاعدة البيانات</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    اربط التطبيق بملف Google Sheet الخاص بك للوصول لبياناتك من أي مكان، أو احتفظ بنسخة محلية آمنة.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* OPTION 1: GOOGLE SHEETS (SIMPLE SCRIPT METHOD) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                        <h2 className="font-bold text-green-900 flex items-center gap-2">
                            <CloudLightning size={20}/>
                            Google Sheets (الربط السريع)
                        </h2>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={isConnected ? 'متصل' : 'غير متصل'}></div>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
                            الربط بملف Google Sheet يسمح لك بالعمل من أي مكان. سيتم حفظ الرابط في متصفحك الحالي فقط.
                        </p>

                        {!isConnected ? (
                            <div className="space-y-3">
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
                            <div className="space-y-4">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-2 text-green-800 text-sm">
                                    <CheckCircle2 size={16} />
                                    <span>التطبيق متصل بملفك بنجاح.</span>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleSync} 
                                        disabled={isLoading}
                                        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <Upload size={16}/> رفع (حفظ)
                                    </button>
                                    <button 
                                        onClick={handleFetch} 
                                        disabled={isLoading}
                                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''}/> جلب (استرجاع)
                                    </button>
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isAutoSync ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`} onClick={toggleAutoSync}>
                                    <span className="text-sm font-bold text-gray-700">حفظ تلقائي (Auto Save)</span>
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors flex ${isAutoSync ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                                
                                <button onClick={() => { setScriptUrl(''); onConnectionChange(false); localStorage.removeItem('mufattish_script_url'); }} className="text-xs text-red-400 hover:text-red-600 underline w-full text-center">
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
                            قاعدة بيانات محلية (JSON)
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                            حفظ ملف كامل على جهازك يحتوي على كل البيانات والإعدادات (بما في ذلك الرابط). استخدم هذا الملف لنقل إعداداتك لجهاز آخر بأمان.
                        </p>

                        <div className="space-y-4">
                            <button 
                                onClick={handleDownloadJSON}
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-sm"
                            >
                                <Download size={20} />
                                حفظ نسخة كاملة (Backup)
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
                                    استرجاع / دمج نسخة
                                </button>
                            </div>
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
