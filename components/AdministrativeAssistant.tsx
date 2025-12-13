
import React, { useState } from 'react';
import { Briefcase, FileText, GraduationCap, PenTool, Crown, Lock, Archive } from 'lucide-react';
import { Teacher, ReportData, TenureReportData } from '../types';
import SendingSchedule from './SendingSchedule';
import TenureExamNotification from './TenureExamNotification';
import AdminCorrespondence from './AdminCorrespondence';
import MailRegister from './MailRegister';

interface AdministrativeAssistantProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    tenureReportsMap: Record<string, TenureReportData>;
    inspectorName: string;
    wilaya: string;
    district: string;
    signature?: string; 
    isExpired?: boolean;
    onUpgradeClick?: () => void;
}

type ViewMode = 'menu' | 'schedule' | 'tenure_notice' | 'correspondence' | 'register';

const AdministrativeAssistant: React.FC<AdministrativeAssistantProps> = ({ 
    teachers, reportsMap, tenureReportsMap, inspectorName, wilaya, district, signature,
    isExpired = false, onUpgradeClick
}) => {
    const [mode, setMode] = useState<ViewMode>('menu');

    // BLOCKER VIEW: If expired, show this screen instead of the tool
    if (isExpired) {
        return (
            <div className="h-full bg-slate-50 p-8 flex flex-col items-center justify-center text-center animate-in fade-in">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-amber-100 max-w-lg w-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                    <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Crown size={40} className="text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 font-serif">المساعد الإداري الذكي</h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        هذه الميزة حصرية للأعضاء المشتركين (العضوية الذهبية). 
                        تتيح لك إنشاء جداول الإرسال، الاستدعاءات، والمراسلات الإدارية بضغطة زر.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Lock size={16} className="text-slate-400"/>
                            <span>جداول إرسال آلية للمديرية</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Lock size={16} className="text-slate-400"/>
                            <span>استدعاءات الامتحانات المهنية</span>
                        </div>
                    </div>

                    <button 
                        onClick={onUpgradeClick}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl mt-8 shadow-lg shadow-amber-200 transition-all transform hover:scale-105"
                    >
                        ترقية الحساب الآن
                    </button>
                    <p className="text-xs text-slate-400 mt-4">انتهت فترتك التجريبية</p>
                </div>
            </div>
        );
    }

    // Render Sub-Components based on mode
    if (mode === 'schedule') {
        return (
            <SendingSchedule 
                teachers={teachers}
                reportsMap={reportsMap}
                tenureReportsMap={tenureReportsMap}
                inspectorName={inspectorName}
                wilaya={wilaya}
                district={district}
                onBack={() => setMode('menu')}
                signature={signature} 
                isExpired={isExpired}
                onUpgradeClick={onUpgradeClick}
            />
        );
    }

    if (mode === 'tenure_notice') {
        return (
            <TenureExamNotification 
                teachers={teachers}
                reportsMap={reportsMap}
                inspectorName={inspectorName}
                wilaya={wilaya}
                district={district}
                onBack={() => setMode('menu')}
                signature={signature} 
                isExpired={isExpired}
                onUpgradeClick={onUpgradeClick}
            />
        );
    }

    if (mode === 'correspondence') {
        return (
            <AdminCorrespondence 
                reportsMap={reportsMap}
                inspectorName={inspectorName}
                wilaya={wilaya}
                district={district}
                onBack={() => setMode('menu')}
                signature={signature} 
                isExpired={isExpired}
                onUpgradeClick={onUpgradeClick}
            />
        );
    }

    if (mode === 'register') {
        return (
            <MailRegister onBack={() => setMode('menu')} />
        );
    }

    // Default: Menu Dashboard
    return (
        <div className="h-full bg-slate-50 p-8 flex flex-col animate-in fade-in">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl rotate-3">
                    <Briefcase size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 font-serif">المساعد الإداري</h1>
                <p className="text-slate-500 mt-2">اختر نوع الوثيقة التي تريد تحريرها</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
                
                <button 
                    onClick={() => setMode('schedule')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all group text-right"
                >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">جدول إرسال</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        إعداد جداول إرسال التقارير للمديرية أو للمدارس مع الفرز الآلي.
                    </p>
                </button>

                <button 
                    onClick={() => setMode('tenure_notice')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all group text-right"
                >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <GraduationCap size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">إشعار بالتثبيت</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        تحرير إشعار رسمي للمتربصين يتضمن تاريخ الامتحان والمرجع.
                    </p>
                </button>

                <button 
                    onClick={() => setMode('correspondence')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all group text-right"
                >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <PenTool size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">مراسلة إدارية</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        محرر حر لكتابة مراسلات إدارية متنوعة بتنسيق رسمي جاهز.
                    </p>
                </button>

                <button 
                    onClick={() => setMode('register')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all group text-right relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Archive size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">سجل البريد</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        سجل رقمي (صادر/وارد) للأرشفة والترقيم التلقائي للمراسلات.
                    </p>
                </button>

            </div>
        </div>
    );
};

export default AdministrativeAssistant;