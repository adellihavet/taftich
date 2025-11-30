
import React, { useState, useEffect, useRef } from 'react';
import { Teacher, ReportData, TenureReportData } from '../types';
import { generateDatabaseRows, parseDatabaseRows } from '../utils/sheetHelper';
import { initializeGoogleApi, handleAuthClick, createAndPopulateSheet, readSheetData, trySilentAuth, clearAndOverwriteSheet } from '../services/sheetsService';
import { Database, RefreshCcw, CheckCircle2, AlertCircle, ExternalLink, Lock, Settings, Wifi, WifiOff, HelpCircle, AlertTriangle, Zap, CloudLightning, HardDrive, Download, Upload } from 'lucide-react';
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
    
    // New Props for Delegated Control
    isConnected: boolean;
    onConnectionChange: (status: boolean) => void;
    isAutoSync: boolean;
    onAutoSyncChange: (enabled: boolean) => void;
}

const getErrorMessage = (error: any): string => {
    if (!error) return "حدث خطأ غير معروف";
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error.result?.error?.message && typeof error.result.error.message === 'string') {
        return error.result.error.message;
    }
    if (error.error) {
        if (typeof error.error === 'string') return error.error;
        if (typeof error.error === 'object' && error.error.message && typeof error.error.message === 'string') {
            return error.error.message;
        }
    }
    if (error.message && typeof error.message === 'string') return error.message;
    try {
        const json = JSON.stringify(error, null, 2);
        if (json === '{}') return "خطأ غير محدد (Unknown Error)";
        return json;
    } catch (e) {
        return "خطأ غير قابل للعرض";
    }
};

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ 
    teachers, reportsMap, tenureReportsMap, onRestore, currentReport,
    isConnected, onConnectionChange, isAutoSync, onAutoSyncChange
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [showConfig, setShowConfig] = useState(false);
    
    const [apiKey, setApiKey] = useState(''); 
    const [clientId, setClientId] = useState(''); 
    const [spreadsheetId, setSpreadsheetId] = useState('');

    // Load credentials
    useEffect(() => {
        const savedSheetId = localStorage.getItem('mufattish_sheet_id');
        const savedClientId = localStorage.getItem('mufattish_client_id');
        const savedApiKey = localStorage.getItem('mufattish_sheets_api_key');
        
        if (savedSheetId) setSpreadsheetId(savedSheetId);
        if (savedClientId) setClientId(savedClientId);
        if (savedApiKey) setApiKey(savedApiKey);

        // Auto-show config if keys missing
        if (!savedClientId || !savedApiKey) {
            setShowConfig(true);
        }
    }, []);

    const toggleAutoSync = () => {
        const newState = !isAutoSync;
        onAutoSyncChange(newState);
        localStorage.setItem('mufattish_auto_sync', String(newState));
    };

    const handleConnect = async (forcePopup: boolean = true) => {
        setStatus('idle');
        setMessage('');

        if(!apiKey || !clientId) {
             setStatus('error');
             setMessage('يرجى إدخال مفتاح API و Client ID للاتصال بخدمات جوجل.');
             setShowConfig(true);
             return;
        }

        const cleanApiKey = apiKey.trim();
        const cleanClientId = clientId.trim();

        if (cleanApiKey.includes('.apps.googleusercontent.com')) {
            setStatus('error');
            setMessage('خطأ: لقد قمت بوضع "Client ID" في خانة "API Key". يرجى نقله للخانة الصحيحة.');
            return;
        }

        if (cleanClientId.startsWith('AIza')) {
             setStatus('error');
             setMessage('خطأ: لقد قمت بوضع "API Key" في خانة "Client ID". يرجى نقله للخانة الصحيحة.');
             return;
        }

        setIsLoading(true);
        try {
            await initializeGoogleApi(cleanApiKey, cleanClientId);
            
            if (forcePopup) {
                await handleAuthClick(false);
            } else {
                const silent = await trySilentAuth();
                if (!silent) await handleAuthClick(false);
            }
            
            onConnectionChange(true);
            
            localStorage.setItem('mufattish_client_id', cleanClientId);
            localStorage.setItem('mufattish_sheets_api_key', cleanApiKey);
            
            setStatus('success');
            setMessage('تم الاتصال بحساب Google بنجاح!');
            setShowConfig(false);
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`فشل الاتصال: ${getErrorMessage(error)}`);
            onConnectionChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!isConnected) {
             await handleConnect(true);
             if (!isConnected) return; // Wait for callback/effect
        }
        
        setIsLoading(true);
        setMessage('جاري إنشاء ملف Google Sheet...');

        try {
            if (teachers.length === 0) {
                // Allow empty sheet creation but warn
                console.warn("Creating empty sheet...");
            }

            const data = generateDatabaseRows(teachers, currentReport, reportsMap);
            const { spreadsheetId: newId, spreadsheetUrl } = await createAndPopulateSheet(
                'قاعدة بيانات المفتش التربوي', 
                data
            );

            setSpreadsheetId(newId);
            localStorage.setItem('mufattish_sheet_id', newId);
            
            setStatus('success');
            setMessage('تم إنشاء القاعدة وفتحها في نافذة جديدة.');
            window.open(spreadsheetUrl, '_blank');
        } catch (error: any) {
            setStatus('error');
            setMessage(`فشل إنشاء الملف: ${getErrorMessage(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualRestore = async () => {
        if (!isConnected) {
             try {
                await handleConnect(true);
             } catch (e) { return; }
        }
        
        if (!spreadsheetId) {
            setStatus('error');
            setMessage('لا يوجد معرف ملف (Spreadsheet ID).');
            return;
        }

        setIsLoading(true);
        setMessage('جاري قراءة البيانات من Google Sheet...');

        try {
            const values = await readSheetData(spreadsheetId);
            const { teachers: newTeachers, reportsMap: parsedReports } = parseDatabaseRows(values);

            if (newTeachers.length === 0) {
                throw new Error("الملف فارغ أو التنسيق غير صحيح.");
            }

            onRestore(newTeachers, parsedReports, tenureReportsMap);
            setStatus('success');
            setMessage(`تمت الاستعادة بنجاح! (${newTeachers.length} أستاذ)`);
        } catch (error: any) {
            setStatus('error');
            setMessage(`فشل في الاستعادة: ${getErrorMessage(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- JSON Backup Handlers ---
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
                isGold: localStorage.getItem('mufattish_is_gold') === 'true'
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
        
        setStatus('success');
        setMessage('تم تحميل النسخة الاحتياطية بنجاح.');
    };

    const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.teachers && Array.isArray(json.teachers)) {
                    if(window.confirm('هل أنت متأكد من استرجاع البيانات؟ سيتم استبدال البيانات الحالية.')) {
                        onRestore(json.teachers, json.reportsMap || {}, json.tenureReportsMap || {});
                        
                        if(json.settings) {
                            if(json.settings.inspectorName) localStorage.setItem('mufattish_inspector_name', json.settings.inspectorName);
                            if(json.settings.signature) localStorage.setItem('mufattish_signature', json.settings.signature);
                            if(json.settings.isGold) localStorage.setItem('mufattish_is_gold', 'true');
                        }
                        
                        setStatus('success');
                        setMessage(`تم الاسترجاع بنجاح: ${json.teachers.length} أستاذ.`);
                    }
                } else {
                    throw new Error("تنسيق الملف غير صالح");
                }
            } catch (err) {
                setStatus('error');
                setMessage('فشل قراءة ملف النسخة الاحتياطية.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const isOriginError = message.toLowerCase().includes('invalid_request') || message.includes('400');

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <GoogleSetupGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            <div className="text-center mb-10">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                    <Database size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 font-serif">إدارة قاعدة البيانات</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    اختر الطريقة التي تفضلها لحفظ وتأمين بياناتك التربوية.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* OPTION 1: GOOGLE SHEETS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                        <h2 className="font-bold text-green-900 flex items-center gap-2">
                            <CloudLightning size={20}/>
                            Google Sheets (سحابي)
                        </h2>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} title={isConnected ? 'متصل' : 'غير متصل'}></div>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                            حفظ البيانات ومزامنتها مباشرة مع ملف Google Sheet في حسابك. يعمل في الخلفية تلقائياً بعد الاتصال.
                        </p>

                        {!isConnected && (
                            <div className="mb-4">
                                <button 
                                    onClick={() => showConfig ? handleConnect(true) : setShowConfig(true)}
                                    className="w-full bg-green-700 text-white py-2 rounded-lg font-bold hover:bg-green-800 transition-colors"
                                >
                                    {showConfig ? 'حفظ واتصال' : 'إعداد الاتصال'}
                                </button>
                            </div>
                        )}

                        {showConfig && (
                            <div className="bg-gray-50 p-4 rounded-lg border mb-4 text-sm animate-in slide-in-from-top-2">
                                <div className="space-y-3">
                                    <input placeholder="Client ID" className="w-full p-2 border rounded" value={clientId} onChange={e => setClientId(e.target.value)} />
                                    <input placeholder="API Key" className="w-full p-2 border rounded" value={apiKey} onChange={e => setApiKey(e.target.value)} />
                                    <div className="flex justify-between items-center">
                                        <button onClick={() => setShowGuide(true)} className="text-blue-600 text-xs underline">كيف أحصل عليها؟</button>
                                        <button onClick={() => setShowConfig(false)} className="text-gray-500 text-xs">إلغاء</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isConnected && (
                            <div className="space-y-3">
                                <input 
                                    placeholder="Spreadsheet ID (للمزامنة)" 
                                    className="w-full p-2 border rounded text-xs font-mono mb-2" 
                                    value={spreadsheetId} 
                                    onChange={e => {
                                        setSpreadsheetId(e.target.value);
                                        localStorage.setItem('mufattish_sheet_id', e.target.value);
                                    }} 
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleCreate} 
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-green-700"
                                        disabled={isLoading}
                                    >
                                        <ExternalLink size={14}/> إنشاء جديد
                                    </button>
                                    <button 
                                        onClick={handleManualRestore} 
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-blue-700"
                                        disabled={isLoading || !spreadsheetId}
                                    >
                                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''}/> جلب (Restore)
                                    </button>
                                </div>
                                <div className={`flex items-center justify-between p-2 rounded border mt-2 ${isAutoSync ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                    <span className="text-xs font-bold text-gray-700">حفظ تلقائي (Auto Save)</span>
                                    <button onClick={toggleAutoSync} className={`w-8 h-4 rounded-full p-0.5 transition-colors flex ${isAutoSync ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </button>
                                </div>
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
                            حفظ ملف كامل على جهازك يحتوي على كل البيانات والإعدادات. الطريقة الأسهل والأسرع لنقل العمل.
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
                                    استرجاع نسخة (Restore)
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
                        {isOriginError && status === 'error' && (
                             <div className="mt-2 text-sm bg-white/50 p-2 rounded border border-red-200">
                                 <p className="font-bold flex items-center gap-1"><AlertTriangle size={14}/> تلميح:</p>
                                 <p>تأكد من إضافة الرابط في Google Console.</p>
                             </div>
                        )}
                        {status === 'success' && spreadsheetId && isConnected && (
                            <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noreferrer" className="text-xs underline mt-1 block hover:text-green-900">فتح الملف</a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseManager;