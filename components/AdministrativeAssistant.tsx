
import React, { useState } from 'react';
import { Briefcase, FileText, GraduationCap, PenTool } from 'lucide-react';
import { Teacher, ReportData, TenureReportData } from '../types';
import SendingSchedule from './SendingSchedule';
import TenureExamNotification from './TenureExamNotification';
import AdminCorrespondence from './AdminCorrespondence';

interface AdministrativeAssistantProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    tenureReportsMap: Record<string, TenureReportData>;
    inspectorName: string;
    wilaya: string;
    district: string;
    signature?: string; // Added prop
}

type ViewMode = 'menu' | 'schedule' | 'tenure_notice' | 'correspondence';

const AdministrativeAssistant: React.FC<AdministrativeAssistantProps> = ({ 
    teachers, reportsMap, tenureReportsMap, inspectorName, wilaya, district, signature 
}) => {
    const [mode, setMode] = useState<ViewMode>('menu');

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
                signature={signature} // Pass signature
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
                signature={signature} // Pass signature
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
                signature={signature} // Pass signature
            />
        );
    }

    // Default: Menu Dashboard
    return (
        <div className="h-full bg-slate-50 p-8 flex flex-col">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl rotate-3">
                    <Briefcase size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 font-serif">المساعد الإداري</h1>
                <p className="text-slate-500 mt-2">اختر نوع الوثيقة التي تريد تحريرها</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                
                <button 
                    onClick={() => setMode('schedule')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all group text-right"
                >
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">جدول إرسال</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        إعداد وطباعة جداول إرسال التقارير (تفتيش / تثبيت) للمديرية أو للمدارس مع الفرز الآلي.
                    </p>
                </button>

                <button 
                    onClick={() => setMode('tenure_notice')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all group text-right"
                >
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <GraduationCap size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">إشعار بالتثبيت</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        تحرير إشعار رسمي للمتربصين (عن طريق المدير) يتضمن تاريخ الامتحان والمرجع.
                    </p>
                </button>

                <button 
                    onClick={() => setMode('correspondence')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all group text-right"
                >
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <PenTool size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">مراسلة إدارية</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        محرر حر لكتابة مراسلات إدارية متنوعة (تقرير، إعلام) بتنسيق رسمي جاهز.
                    </p>
                </button>

            </div>
        </div>
    );
};

export default AdministrativeAssistant;