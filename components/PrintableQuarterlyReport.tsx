
import React from 'react';
import { QuarterlyReportData } from '../types';
import { FileDown } from 'lucide-react';

interface PrintableQuarterlyReportProps {
  report: QuarterlyReportData;
  signature?: string;
}

const PrintableQuarterlyReport: React.FC<PrintableQuarterlyReportProps> = ({ report, signature }) => {
    
  const handleDownloadPDF = () => {
      document.title = `حصيلة_${report.term}_${report.schoolYear.replace('/', '-')}`;
      window.print();
  };

  // Calculations for Percentages
  const totalDays = Object.values(report.days).reduce((a, b) => a + b, 0);
  const totalRanks = Object.values(report.ranks).reduce((a, b) => a + b, 0);
  const totalLevels = Object.values(report.levels).reduce((a, b) => a + b, 0);
  const totalSubjects = Object.values(report.subjects).reduce((a, b) => a + b, 0);

  const title = report.term === 'السنوي' 
    ? `حصيلة نشاطات مفتش التعليم الابتدائي للسنة الدراسية: ${report.schoolYear}`
    : `حصيلة نشاطات مفتش التعليم الابتدائي للفصل ${report.term} من السنة الدراسية: ${report.schoolYear}`;

  const pct = (val: number, total: number) => total === 0 ? '' : ((val / total) * 100).toFixed(1) + '%';

  // Get current date formatted
  const currentDate = new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="font-serif text-black leading-normal" dir="rtl">
        
        {/* Floating Action Button (Screen Only) */}
        <div className="fixed top-4 left-4 z-50 flex gap-3 no-print">
            {/* Logic handled by parent */}
        </div>

        <div className="a4-page flex flex-col" style={{ padding: '8mm 12mm' }}>
            
            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col">
                
                {/* Header - Updated Layout & Spacing */}
                <div className="mb-8 shrink-0">
                    {/* Center: Republic & Ministry */}
                    <div className="text-center font-bold text-[13px] mb-6 space-y-1.5">
                        <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                        <h3>وزارة التربية الوطنية</h3>
                    </div>
                    
                    {/* Sides: Inspectorate & Directorate */}
                    <div className="flex justify-between items-end text-[12px] font-bold border-b-2 border-black pb-2">
                        <div className="text-right">
                            <p>المفتشية العامة للبيداغوجيا</p>
                        </div>
                        <div className="text-left">
                            <p>مديرية التربية لولاية: {report.wilaya}</p>
                        </div>
                    </div>
                </div>

                {/* Title - Increased Spacing */}
                <div className="text-center mb-10 shrink-0">
                    <div className="inline-block border-2 border-black px-8 py-3 bg-gray-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <h1 className="text-xl font-bold">{title}</h1>
                    </div>
                </div>

                {/* Content Container */}
                <div>
                    {/* Main Table 1: General Info */}
                    <div className="mb-4">
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr>
                                    <th rowSpan={2} className="border border-black p-1 bg-gray-100 w-[15%]">اسم المفتش ولقبه</th>
                                    <th rowSpan={2} className="border border-black p-1 bg-gray-100">التخصص</th>
                                    <th rowSpan={2} className="border border-black p-1 bg-gray-100">المقاطعة</th>
                                    <th colSpan={3} className="border border-black p-1 bg-gray-100">عدد الأساتذة</th>
                                    <th colSpan={4} className="border border-black p-1 bg-gray-100">النشاطات</th>
                                    <th colSpan={2} className="border border-black p-1 bg-gray-100">المهام الاخرى (عددها)</th>
                                </tr>
                                <tr>
                                    <th className="border border-black p-1">الاجمالي</th>
                                    <th className="border border-black p-1">المتربصين</th>
                                    <th className="border border-black p-1">المعنيون بالتثبيت</th>
                                    <th className="border border-black p-1">التفتيش</th>
                                    <th className="border border-black p-1">التثبيت</th>
                                    <th className="border border-black p-1">التكوين</th>
                                    <th className="border border-black p-1">الاستفادة تكوين</th>
                                    <th className="border border-black p-1">تأطير عمليات</th>
                                    <th className="border border-black p-1">التحقيقات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="h-8 font-bold">
                                    <td className="border border-black p-1">{report.inspectorName}</td>
                                    <td className="border border-black p-1">{report.rank}</td>
                                    <td className="border border-black p-1">{report.district}</td>
                                    <td className="border border-black p-1">{report.teachersTotal}</td>
                                    <td className="border border-black p-1">{report.teachersTrainee}</td>
                                    <td className="border border-black p-1">{report.teachersTenure}</td>
                                    <td className="border border-black p-1 bg-gray-50">{report.visitsInspection}</td>
                                    <td className="border border-black p-1">{report.visitsTenure}</td>
                                    <td className="border border-black p-1">{report.visitsTraining}</td>
                                    <td className="border border-black p-1">{report.visitsTrainingBenefit}</td>
                                    <td className="border border-black p-1">{report.tasksSupervision}</td>
                                    <td className="border border-black p-1">{report.tasksInvestigations}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Table 2: Distribution by Days */}
                    <div className="mb-4">
                        <h3 className="font-bold text-[11px] mb-1 text-right underline">1. توزيع الزيارات على الأيام:</h3>
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 w-24">البيان</th>
                                    <th className="border border-black p-1">الأحد</th>
                                    <th className="border border-black p-1">الإثنين</th>
                                    <th className="border border-black p-1">الثلاثاء</th>
                                    <th className="border border-black p-1">الأربعاء</th>
                                    <th className="border border-black p-1">الخميس</th>
                                    <th className="border border-black p-1 bg-gray-200">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                    <td className="border border-black p-1">{report.days.sun}</td>
                                    <td className="border border-black p-1">{report.days.mon}</td>
                                    <td className="border border-black p-1">{report.days.tue}</td>
                                    <td className="border border-black p-1">{report.days.wed}</td>
                                    <td className="border border-black p-1">{report.days.thu}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">{totalDays}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">النسبة %</td>
                                    <td className="border border-black p-1">{pct(report.days.sun, totalDays)}</td>
                                    <td className="border border-black p-1">{pct(report.days.mon, totalDays)}</td>
                                    <td className="border border-black p-1">{pct(report.days.tue, totalDays)}</td>
                                    <td className="border border-black p-1">{pct(report.days.wed, totalDays)}</td>
                                    <td className="border border-black p-1">{pct(report.days.thu, totalDays)}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Table 3: Distribution by Rank */}
                    <div className="mb-4">
                        <h3 className="font-bold text-[11px] mb-1 text-right underline">2. توزيع الزيارات حسب الرتب:</h3>
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 w-24">البيان</th>
                                    <th className="border border-black p-1">متربص</th>
                                    <th className="border border-black p-1">أ.م.ابتدائية</th>
                                    <th className="border border-black p-1">رئيسي/أول</th>
                                    <th className="border border-black p-1">مكون/ثان</th>
                                    <th className="border border-black p-1">أستاذ مميز</th>
                                    <th className="border border-black p-1">متعاقد</th>
                                    <th className="border border-black p-1 bg-gray-200">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                    <td className="border border-black p-1">{report.ranks.stagiere}</td>
                                    <td className="border border-black p-1">{report.ranks.primary}</td>
                                    <td className="border border-black p-1">{report.ranks.class1}</td>
                                    <td className="border border-black p-1">{report.ranks.class2}</td>
                                    <td className="border border-black p-1">{report.ranks.distinguished}</td>
                                    <td className="border border-black p-1">{report.ranks.contract}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">{totalRanks}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">النسبة %</td>
                                    <td className="border border-black p-1">{pct(report.ranks.stagiere, totalRanks)}</td>
                                    <td className="border border-black p-1">{pct(report.ranks.primary, totalRanks)}</td>
                                    <td className="border border-black p-1">{pct(report.ranks.class1, totalRanks)}</td>
                                    <td className="border border-black p-1">{pct(report.ranks.class2, totalRanks)}</td>
                                    <td className="border border-black p-1">{pct(report.ranks.distinguished, totalRanks)}</td>
                                    <td className="border border-black p-1">{pct(report.ranks.contract, totalRanks)}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Table 4: Distribution by Level */}
                    <div className="mb-4">
                        <h3 className="font-bold text-[11px] mb-1 text-right underline">3. توزيع الزيارات حسب المستويات:</h3>
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 w-24">البيان</th>
                                    <th className="border border-black p-1">التحضيري</th>
                                    <th className="border border-black p-1">السنة 01</th>
                                    <th className="border border-black p-1">السنة 02</th>
                                    <th className="border border-black p-1">السنة 03</th>
                                    <th className="border border-black p-1">السنة 04</th>
                                    <th className="border border-black p-1">السنة 05</th>
                                    <th className="border border-black p-1 bg-gray-200">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                    <td className="border border-black p-1">{report.levels.prep}</td>
                                    <td className="border border-black p-1">{report.levels.year1}</td>
                                    <td className="border border-black p-1">{report.levels.year2}</td>
                                    <td className="border border-black p-1">{report.levels.year3}</td>
                                    <td className="border border-black p-1">{report.levels.year4}</td>
                                    <td className="border border-black p-1">{report.levels.year5}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">{totalLevels}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">النسبة %</td>
                                    <td className="border border-black p-1">{pct(report.levels.prep, totalLevels)}</td>
                                    <td className="border border-black p-1">{pct(report.levels.year1, totalLevels)}</td>
                                    <td className="border border-black p-1">{pct(report.levels.year2, totalLevels)}</td>
                                    <td className="border border-black p-1">{pct(report.levels.year3, totalLevels)}</td>
                                    <td className="border border-black p-1">{pct(report.levels.year4, totalLevels)}</td>
                                    <td className="border border-black p-1">{pct(report.levels.year5, totalLevels)}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Table 5: Distribution by Subject */}
                    <div className="mb-4">
                        <h3 className="font-bold text-[11px] mb-1 text-right underline">4. توزيع الزيارات حسب المواد (الأنشطة):</h3>
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 w-20">البيان</th>
                                    <th className="border border-black p-1">لغة عربية</th>
                                    <th className="border border-black p-1">رياضيات</th>
                                    <th className="border border-black p-1">إسلامية</th>
                                    <th className="border border-black p-1">تاريخ/ج</th>
                                    <th className="border border-black p-1">مدنية</th>
                                    <th className="border border-black p-1">علمية</th>
                                    <th className="border border-black p-1">فنية/موسيقية</th>
                                    <th className="border border-black p-1 bg-gray-200">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                    <td className="border border-black p-1">{report.subjects.arabic}</td>
                                    <td className="border border-black p-1">{report.subjects.math}</td>
                                    <td className="border border-black p-1">{report.subjects.islamic}</td>
                                    <td className="border border-black p-1">{report.subjects.historyGeo}</td>
                                    <td className="border border-black p-1">{report.subjects.civics}</td>
                                    <td className="border border-black p-1">{report.subjects.science}</td>
                                    <td className="border border-black p-1">{report.subjects.art + report.subjects.music}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">{totalSubjects}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold bg-gray-50">%</td>
                                    <td className="border border-black p-1">{pct(report.subjects.arabic, totalSubjects)}</td>
                                    <td className="border border-black p-1">{pct(report.subjects.math, totalSubjects)}</td>
                                    <td className="border border-black p-1">{pct(report.subjects.islamic, totalSubjects)}</td>
                                    <td className="border border-black p-1">{pct(report.subjects.historyGeo, totalSubjects)}</td>
                                    <td className="border border-black p-1">{pct(report.subjects.civics, totalSubjects)}</td>
                                    <td className="border border-black p-1">{pct(report.subjects.science, totalSubjects)}</td>
                                    <td className="border border-black p-1">{pct(report.subjects.art + report.subjects.music, totalSubjects)}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer - Lifted Up with Padding */}
            <div className="flex flex-col items-end px-12 text-sm font-bold shrink-0 pb-40"> {/* INCREASED PADDING TO 40 */}
                 <p className="mb-4">حرر بـ: {report.wilaya} في: {currentDate}</p>
                 <div className="text-center w-48 relative flex flex-col items-center">
                    <p className="mb-8 underline">مفتش التعليم الابتدائي</p>
                    
                    {signature ? (
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-64 h-32 flex items-center justify-center pointer-events-none z-10">
                            <img src={signature} alt="Signature" className="w-full h-full mix-blend-multiply object-contain transform -rotate-2 scale-125" />
                        </div>
                    ) : (
                        <div className="mt-2 text-[10px] text-gray-300 border border-dashed border-gray-300 w-20 h-20 rounded-full flex items-center justify-center rotate-[-15deg]">
                            الختم
                        </div>
                    )}
                 </div>
            </div>

        </div>
    </div>
  );
};

export default PrintableQuarterlyReport;