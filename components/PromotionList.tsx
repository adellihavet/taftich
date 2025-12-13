
import React, { useMemo, useState, useEffect } from 'react';
import { Teacher, ReportData } from '../types';
import { ArrowUpCircle, Calendar, School, CheckCircle2, TrendingUp, Printer, Settings, ToggleLeft, ToggleRight, MapPin, AlertCircle } from 'lucide-react';
import { formatDateForDisplay } from '../utils/sheetHelper';

interface PromotionListProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
}

const PromotionList: React.FC<PromotionListProps> = ({ teachers, reportsMap }) => {
    // Automatic Campaign Year (System Date)
    const campaignYear = new Date().getFullYear();

    // --- Bonification State ---
    const [enableBonification, setEnableBonification] = useState<boolean>(() => {
        return localStorage.getItem('mufattish_promo_bonus_enabled') === 'true';
    });
    
    const [bonusMonths, setBonusMonths] = useState<number>(() => {
        return parseInt(localStorage.getItem('mufattish_promo_bonus_months') || '3');
    });

    // Save settings
    useEffect(() => {
        localStorage.setItem('mufattish_promo_bonus_enabled', String(enableBonification));
        localStorage.setItem('mufattish_promo_bonus_months', String(bonusMonths));
    }, [enableBonification, bonusMonths]);

    // Logic to identify candidates based on current year AND bonification
    const promotionCandidates = useMemo(() => {
        return teachers.filter(t => {
            // 1. Basic Eligibility Checks
            if (t.status !== 'titulaire' || !t.echelonDate || !t.echelon) return false;
            
            const currentEchelon = parseInt(t.echelon);
            
            // RULE: Max Echelon is 12. If already at 12, no further promotion possible.
            if (currentEchelon >= 12) return false;

            const echelonDate = new Date(t.echelonDate);
            if (isNaN(echelonDate.getTime())) return false;

            // --- CALCULATION LOGIC ---
            // Standard requirement: 2.5 years = 30 months
            let requiredRealMonths = 30;

            if (enableBonification) {
                // Formula: Real_Months * (1 + Bonus/12) = Calculated_Months
                // So: Real_Months = Calculated_Months / (1 + Bonus/12)
                const accelerationRatio = (12 + bonusMonths) / 12;
                requiredRealMonths = 30 / accelerationRatio;
            }

            // Calculate the eligibility date (Date where they hit the required real months)
            const eligibilityDate = new Date(echelonDate);
            // Add months (handling fraction of months by converting to days roughly)
            const daysToAdd = requiredRealMonths * 30.44; 
            eligibilityDate.setDate(eligibilityDate.getDate() + daysToAdd);
            
            // The cutoff date is Dec 31st of the AUTOMATIC campaign year
            const cutOffDate = new Date(campaignYear, 11, 31);

            // Condition 1: Must reach required seniority on or before Dec 31
            if (eligibilityDate > cutOffDate) return false;

            // Condition 2: Current mark must not exceed max allowed for current echelon
            // Rule: Max Mark = 13 + (Echelon * 0.5)
            const maxAllowedMark = 13 + (currentEchelon * 0.5);

            // If current mark is already >= max, no visit needed (ceiling reached)
            if (t.lastMark >= maxAllowedMark) return false;

            // ---------------------------------------------------------
            // منطق الحذف: إذا تم ملء التاريخ والعلامة معاً في التقرير الحالي
            // ---------------------------------------------------------
            const activeReport = reportsMap[t.id];
            if (activeReport) {
                const isDateFilled = activeReport.inspectionDate && activeReport.inspectionDate.trim() !== '';
                const isMarkFilled = activeReport.finalMark !== undefined && activeReport.finalMark > 0;
                if (isDateFilled && isMarkFilled) {
                    return false; 
                }
            }
            // ---------------------------------------------------------

            return true;
        }).map(t => {
            const currentEchelon = parseInt(t.echelon || '0');
            const maxAllowedMark = 13 + (currentEchelon * 0.5);
            const schoolName = reportsMap[t.id]?.school || 'غير محددة';

            // Calculate actual seniority duration for display
            const start = new Date(t.echelonDate!);
            const end = new Date();
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

            return {
                ...t,
                maxAllowedMark,
                schoolName,
                realSeniorityYears: diffYears
            };
        });
    }, [teachers, campaignYear, reportsMap, enableBonification, bonusMonths]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50/50">
            {/* Screen Header - HIDDEN ON PRINT */}
            <div className="flex flex-col gap-6 mb-8 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 font-serif flex items-center gap-3">
                            <ArrowUpCircle className="text-indigo-600" size={32} />
                            قائمة المعنيين بالترقية
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium text-sm">
                            الأساتذة الذين يستوفون شرط الأقدمية (سنتين ونصف) قبل 31/12/{campaignYear}.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={handlePrint}
                            className="bg-slate-800 text-white hover:bg-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                        >
                            <Printer size={18} />
                            طباعة القائمة
                        </button>
                    </div>
                </div>

                {/* --- BONIFICATION SETTINGS BAR --- */}
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${enableBonification ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm">امتياز المنطقة (الجنوب / الهضاب)</h3>
                            <p className="text-xs text-slate-400">حساب الأقدمية المكتسبة بإضافة أشهر الامتياز</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div 
                            className="flex items-center gap-2 cursor-pointer select-none"
                            onClick={() => setEnableBonification(!enableBonification)}
                        >
                            <span className={`text-xs font-bold ${enableBonification ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {enableBonification ? 'مفعّل' : 'غير مفعّل'}
                            </span>
                            {enableBonification ? (
                                <ToggleRight size={32} className="text-indigo-600 fill-indigo-100" />
                            ) : (
                                <ToggleLeft size={32} className="text-slate-300" />
                            )}
                        </div>

                        {enableBonification && (
                            <div className="flex items-center gap-2 border-r pr-4 mr-2 animate-in fade-in slide-in-from-right-2">
                                <label className="text-xs font-bold text-slate-600">مقدار الزيادة:</label>
                                <select 
                                    value={bonusMonths}
                                    onChange={(e) => setBonusMonths(parseInt(e.target.value))}
                                    className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg py-1.5 px-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(m => (
                                        <option key={m} value={m}>{m} أشهر / سنة</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {enableBonification && (
                         <div className="hidden md:flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            <AlertCircle size={12}/>
                            <span>يتم تسريع الأقدمية بناءً على المعادلة المعتمدة</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Screen Cards - HIDDEN ON PRINT */}
            <div className="print:hidden">
                {promotionCandidates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {promotionCandidates.map(t => (
                            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden hover:shadow-md transition-all group relative">
                                {enableBonification && (
                                    <div className="absolute top-0 left-0 bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded-br-lg font-bold z-10">
                                        مستفيد من الامتياز
                                    </div>
                                )}
                                
                                {/* Header */}
                                <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{t.fullName}</h3>
                                        <div className="flex items-center gap-1.5 text-indigo-700 text-sm mt-1 font-medium">
                                            <School size={14} />
                                            <span>{t.schoolName}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-indigo-200 text-indigo-800 text-xs px-3 py-1 rounded-full font-bold shadow-sm mt-2">
                                        الدرجة {t.echelon}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span>تاريخ السريان</span>
                                        </div>
                                        <span className="font-mono font-bold text-gray-800 dir-ltr">{formatDateForDisplay(t.echelonDate)}</span>
                                    </div>

                                    {enableBonification && (
                                        <div className="flex justify-between items-center text-[10px] px-1">
                                            <span className="text-slate-400">الأقدمية الحقيقية:</span>
                                            <span className="font-bold text-slate-600">{t.realSeniorityYears.toFixed(1)} سنة</span>
                                        </div>
                                    )}

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
                        <p className="text-gray-400 mt-2">إما أن الجميع لم يستوفوا الأقدمية، أو وصلوا للسقف الأعلى، أو هم في الدرجة 12.</p>
                        {enableBonification && <p className="text-indigo-400 text-xs mt-2 font-bold">تم تطبيق حساب امتياز المنطقة ({bonusMonths} أشهر/سنة)</p>}
                    </div>
                )}
            </div>
            
            {/* Print Only View - Fixed Layout */}
            <div className="hidden print:block absolute top-0 left-0 w-full h-auto bg-white z-[9999] p-10 text-black">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">قائمة الأساتذة المعنيين بالترقية (الزيارة التفتيشية)</h2>
                    <div className="font-bold border-2 border-black inline-flex flex-col items-center px-6 py-2 mt-2 gap-1">
                        <span className="text-xl">حملة سنة {campaignYear} (إلى غاية 31/12/{campaignYear})</span>
                        {enableBonification && (
                            <span className="text-sm font-normal bg-black text-white px-2 rounded">
                                * خاضع لامتياز المنطقة: زيادة {bonusMonths} أشهر عن كل سنة
                            </span>
                        )}
                    </div>
                </div>
                
                <table className="w-full border-collapse border-2 border-black text-right" dir="rtl">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-3 text-center w-16 font-bold">الرقم</th>
                            <th className="border border-black p-3 font-bold">الاسم واللقب</th>
                            <th className="border border-black p-3 font-bold">المدرسة</th>
                            <th className="border border-black p-3 text-center w-24 font-bold">الدرجة</th>
                            <th className="border border-black p-3 text-center w-32 font-bold">تاريخ السريان</th>
                            <th className="border border-black p-3 text-center w-24 font-bold">النقطة</th>
                            <th className="border border-black p-3 text-center w-24 font-bold">السقف</th>
                            {enableBonification && <th className="border border-black p-3 text-center w-24 font-bold text-[10px]">الأقدمية الحقيقية</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {promotionCandidates.map((t, idx) => (
                            <tr key={t.id} style={{ breakInside: 'avoid' }}>
                                <td className="border border-black p-3 text-center">{idx + 1}</td>
                                <td className="border border-black p-3 font-bold">{t.fullName}</td>
                                <td className="border border-black p-3">{t.schoolName}</td>
                                <td className="border border-black p-3 text-center">{t.echelon}</td>
                                <td className="border border-black p-3 text-center" dir="ltr">{formatDateForDisplay(t.echelonDate)}</td>
                                <td className="border border-black p-3 text-center">{t.lastMark}</td>
                                <td className="border border-black p-3 text-center">{t.maxAllowedMark}</td>
                                {enableBonification && (
                                    <td className="border border-black p-3 text-center text-xs font-bold">
                                        {t.realSeniorityYears.toFixed(1)} سنة
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-8 text-left pl-10 font-bold underline">
                    المفتش
                </div>
            </div>
        </div>
    );
};

export default PromotionList;
