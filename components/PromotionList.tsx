
import React, { useMemo, useState } from 'react';
import { Teacher, ReportData } from '../types';
import { ArrowUpCircle, Calendar, School, CheckCircle2, TrendingUp, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

interface PromotionListProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
}

const PromotionList: React.FC<PromotionListProps> = ({ teachers, reportsMap }) => {
    // Dynamic Campaign Year
    const [campaignYear, setCampaignYear] = useState<number>(new Date().getFullYear());

    // Logic to identify candidates based on selected year
    const promotionCandidates = useMemo(() => {
        return teachers.filter(t => {
            // Must be Titulaire and have an Echelon
            if (t.status !== 'titulaire' || !t.echelonDate || !t.echelon) return false;

            const echelonDate = new Date(t.echelonDate);
            if (isNaN(echelonDate.getTime())) return false; // Invalid date check

            // Calculate date when they will have 2 years seniority
            const twoYearsMark = new Date(echelonDate);
            twoYearsMark.setFullYear(echelonDate.getFullYear() + 2);
            
            // The cutoff date is Dec 31st of the SELECTED campaign year
            const cutOffDate = new Date(campaignYear, 11, 31);

            // Condition 1: Must reach 2 years seniority on or before Dec 31 of campaign year
            if (twoYearsMark > cutOffDate) return false;

            // Condition 2: Current mark must not exceed max allowed for current echelon
            const currentEchelon = parseInt(t.echelon);
            // Rule: Max Mark = 13 + (Echelon * 0.5)
            const maxAllowedMark = 13 + (currentEchelon * 0.5);

            // If current mark is already >= max, no visit needed (ceiling reached)
            if (t.lastMark >= maxAllowedMark) return false;

            return true;
        }).map(t => {
            const currentEchelon = parseInt(t.echelon || '0');
            const maxAllowedMark = 13 + (currentEchelon * 0.5);
            // Get school from report map if exists
            const schoolName = reportsMap[t.id]?.school || 'غير محددة';

            return {
                ...t,
                maxAllowedMark,
                schoolName
            };
        });
    }, [teachers, campaignYear, reportsMap]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-serif flex items-center gap-3">
                        <ArrowUpCircle className="text-indigo-600" size={32} />
                        قائمة المعنيين بالترقية
                    </h1>
                    <p className="text-gray-500 mt-2">
                        الأساتذة الذين يستوفون أقدمية سنتين ونقطتهم أقل من سقف الدرجة.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 print:hidden">
                    {/* Year Selector */}
                    <div className="bg-white border border-indigo-200 rounded-lg p-1 flex items-center shadow-sm">
                        <button 
                            onClick={() => setCampaignYear(prev => prev - 1)}
                            className="p-2 hover:bg-gray-100 rounded-md text-indigo-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <div className="px-4 text-center">
                            <span className="text-xs text-gray-400 block font-bold">حملة سنة</span>
                            <span className="text-xl font-bold text-indigo-800">{campaignYear}</span>
                        </div>
                         <button 
                            onClick={() => setCampaignYear(prev => prev + 1)}
                            className="p-2 hover:bg-gray-100 rounded-md text-indigo-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>

                    <button 
                        onClick={handlePrint}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                    >
                        <Printer size={18} />
                        طباعة
                    </button>
                </div>
            </div>

            {promotionCandidates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {promotionCandidates.map(t => (
                        <div key={t.id} className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden hover:shadow-md transition-all group">
                            {/* Header */}
                            <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{t.fullName}</h3>
                                    <div className="flex items-center gap-1.5 text-indigo-700 text-sm mt-1 font-medium">
                                        <School size={14} />
                                        <span>{t.schoolName}</span>
                                    </div>
                                </div>
                                <div className="bg-white border border-indigo-200 text-indigo-800 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                                    الدرجة {t.echelon}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>تاريخ الدرجة</span>
                                    </div>
                                    <span className="font-mono font-bold text-gray-800">{t.echelonDate}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div className="text-center p-2 rounded-lg bg-green-50 border border-green-100">
                                        <span className="text-xs text-green-700 block mb-1">النقطة الحالية</span>
                                        <span className="text-xl font-bold text-green-800">{t.lastMark}</span>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-red-50 border border-red-100">
                                        <span className="text-xs text-red-700 block mb-1">سقف الدرجة</span>
                                        <span className="text-xl font-bold text-red-800">{t.maxAllowedMark}</span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-dashed flex items-center gap-2 text-xs text-gray-500">
                                    <TrendingUp size={14} className="text-green-500" />
                                    <span>هامش التقدم المتاح: </span>
                                    <span className="font-bold text-gray-800">{(t.maxAllowedMark - t.lastMark).toFixed(2)} نقطة</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <CheckCircle2 size={64} className="text-green-500 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-gray-400">لا توجد حالات تستدعي الزيارة لعام {campaignYear}</h3>
                    <p className="text-gray-400 mt-2">إما أن الجميع لم يستوفوا الأقدمية، أو وصلوا للسقف الأعلى للنقاط.</p>
                </div>
            )}
            
            {/* Print Only View (Simple Table) */}
            <div className="hidden print:block fixed inset-0 bg-white z-50 p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">قائمة الأساتذة المعنيين بالترقية (زيارة تفتيش)</h2>
                    <p className="font-bold border-2 border-black inline-block px-4 py-1 mt-2">حملة سنة {campaignYear} (إلى غاية 31/12/{campaignYear})</p>
                </div>
                <table className="w-full border-collapse border border-black text-sm" dir="rtl">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2">الرقم</th>
                            <th className="border border-black p-2">الاسم واللقب</th>
                            <th className="border border-black p-2">المدرسة</th>
                            <th className="border border-black p-2">الدرجة</th>
                            <th className="border border-black p-2">تاريخها</th>
                            <th className="border border-black p-2">النقطة الحالية</th>
                            <th className="border border-black p-2">السقف</th>
                            <th className="border border-black p-2">هامش الزيادة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotionCandidates.map((t, idx) => (
                            <tr key={t.id}>
                                <td className="border border-black p-2 text-center">{idx + 1}</td>
                                <td className="border border-black p-2 font-bold">{t.fullName}</td>
                                <td className="border border-black p-2">{t.schoolName}</td>
                                <td className="border border-black p-2 text-center">{t.echelon}</td>
                                <td className="border border-black p-2 text-center">{t.echelonDate}</td>
                                <td className="border border-black p-2 text-center">{t.lastMark}</td>
                                <td className="border border-black p-2 text-center">{t.maxAllowedMark}</td>
                                <td className="border border-black p-2 text-center">+{(t.maxAllowedMark - t.lastMark).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PromotionList;
