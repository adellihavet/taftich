
import React from 'react';
import { QuarterlyReportData } from '../types';

interface PrintableQuarterlyReportProps {
  report: QuarterlyReportData;
  signature?: string;
}

const PrintableQuarterlyReport: React.FC<PrintableQuarterlyReportProps> = ({ report, signature }) => {
    
  const totalDays = (Object.values(report.days) as number[]).reduce((a, b) => a + b, 0);
  const totalRanks = (Object.values(report.ranks) as number[]).reduce((a, b) => a + b, 0);
  const totalLevels = (Object.values(report.levels) as number[]).reduce((a, b) => a + b, 0);
  
  const totalSubjects = (report.subjects.arabic || 0) + (report.subjects.math || 0) + (report.subjects.islamic || 0) +
                        (report.subjects.history || 0) + (report.subjects.geo || 0) + (report.subjects.civics || 0) +
                        (report.subjects.science || 0) + (report.subjects.art || 0);

  const pct = (val: number, total: number) => total === 0 ? '' : ((val / total) * 100).toFixed(1) + '%';
  const currentDate = new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Calculate timing total separately to show accurate percentages within the timing table
  const totalTiming = (report.visitsMorning || 0) + (report.visitsEvening || 0);

  return (
    <div className="font-serif text-black leading-normal bg-white" dir="rtl">
        
        {/* PORTRAIT A4 PAGE */}
        <div className="a4-page-portrait flex flex-col justify-between" style={{ padding: '15mm 12mm' }}>
            
            {/* Header Section */}
            <div className="shrink-0 mb-6">
                <div className="text-center font-bold text-[13px] mb-3 space-y-1">
                    <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                    <h3>وزارة التربية الوطنية</h3>
                </div>
                
                <div className="flex justify-between items-end border-b-2 border-black pb-1 text-[11px] font-bold">
                    <div className="text-right">
                        <p>المفتشية العامة للبيداغوجيا</p>
                    </div>
                    <div className="text-left">
                        <p>مديرية التربية لولاية: {report.wilaya}</p>
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-8 shrink-0">
                <div className="inline-block border-2 border-black px-6 py-2 bg-gray-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-lg font-bold flex flex-wrap items-center justify-center gap-1">
                        <span>حصيلة نشاطات مفتش التعليم الابتدائي</span>
                        <span>{report.term === 'السنوي' ? 'للسنة الدراسية:' : `للفصل ${report.term} من السنة الدراسية:`}</span>
                        <span dir="ltr" className="inline-block font-mono font-bold px-1">{report.schoolYear}</span>
                    </h1>
                </div>
            </div>

            {/* Content Container - Use gap to distribute nicely */}
            <div className="flex-1 flex flex-col gap-6 justify-start">
                
                {/* Main Table 1: General Info */}
                <div>
                    <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 h-8">
                                <th rowSpan={2} className="border border-black p-1 w-[15%]">اسم المفتش ولقبه</th>
                                <th rowSpan={2} className="border border-black p-1">التخصص</th>
                                <th rowSpan={2} className="border border-black p-1 w-[10%]">المقاطعة</th>
                                <th colSpan={3} className="border border-black p-1">عدد الأساتذة</th>
                                <th colSpan={4} className="border border-black p-1 bg-gray-200">النشاطات (الزيارات المنجزة)</th>
                                <th colSpan={2} className="border border-black p-1">المهام الاخرى (عددها)</th>
                            </tr>
                            <tr className="bg-gray-50 h-8">
                                <th className="border border-black p-1">الاجمالي</th>
                                <th className="border border-black p-1">المتربصين</th>
                                <th className="border border-black p-1 w-[12%] text-[8px] leading-tight">المعنيون بالتثبيت <br/>(حسب مقرر التأهيل)</th>
                                <th className="border border-black p-1">التفتيش</th>
                                <th className="border border-black p-1">التثبيت</th>
                                <th className="border border-black p-1">التكوين</th>
                                <th className="border border-black p-1 text-[8px]">الاستفادة من التكوين</th>
                                <th className="border border-black p-1">تأطير عمليات</th>
                                <th className="border border-black p-1">التحقيقات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-10 font-bold text-[11px]">
                                <td className="border border-black p-1">{report.inspectorName}</td>
                                <td className="border border-black p-1">{report.rank}</td>
                                <td className="border border-black p-1">{report.district}</td>
                                <td className="border border-black p-1">{report.teachersTotal}</td>
                                <td className="border border-black p-1">{report.teachersTrainee}</td>
                                <td className="border border-black p-1">{report.teachersTenure}</td>
                                <td className="border border-black p-1 bg-gray-100">{report.visitsInspection}</td>
                                <td className="border border-black p-1 bg-gray-100">{report.visitsTenure}</td>
                                <td className="border border-black p-1 bg-gray-100">{report.visitsTraining}</td>
                                <td className="border border-black p-1 bg-gray-100">{report.visitsTrainingBenefit}</td>
                                <td className="border border-black p-1">{report.tasksSupervision}</td>
                                <td className="border border-black p-1">{report.tasksInvestigations}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Split Row: Days + Timing */}
                <div className="flex gap-4 items-start">
                    {/* Table 2: Days (Compressed width) */}
                    <div className="flex-[2]">
                        <h3 className="font-bold text-[11px] mb-1 text-right underline">* توزيع الزيارات على الأيام</h3>
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr className="bg-gray-100 h-6">
                                    <th className="border border-black p-1 w-20">البيان</th>
                                    <th className="border border-black p-1">الأحد</th>
                                    <th className="border border-black p-1">الإثنين</th>
                                    <th className="border border-black p-1">الثلاثاء</th>
                                    <th className="border border-black p-1">الأربعاء</th>
                                    <th className="border border-black p-1">الخميس</th>
                                    <th className="border border-black p-1 bg-gray-200">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="h-6">
                                    <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                    <td className="border border-black p-1">{report.days.sun}</td>
                                    <td className="border border-black p-1">{report.days.mon}</td>
                                    <td className="border border-black p-1">{report.days.tue}</td>
                                    <td className="border border-black p-1">{report.days.wed}</td>
                                    <td className="border border-black p-1">{report.days.thu}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">{totalDays}</td>
                                </tr>
                                <tr className="h-6">
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

                    {/* Table 3: Timing (New Table) */}
                    <div className="flex-1">
                        <h3 className="font-bold text-[11px] mb-1 text-right underline">* توقيت الزيارات</h3>
                        <table className="w-full border-collapse border border-black text-center text-[10px]">
                            <thead>
                                <tr className="bg-gray-100 h-6">
                                    <th className="border border-black p-1">الصباح</th>
                                    <th className="border border-black p-1">المساء</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="h-6">
                                    <td className="border border-black p-1 font-bold">{report.visitsMorning || 0}</td>
                                    <td className="border border-black p-1 font-bold">{report.visitsEvening || 0}</td>
                                </tr>
                                <tr className="h-6">
                                    <td className="border border-black p-1 bg-gray-50">{pct(report.visitsMorning || 0, totalTiming)}</td>
                                    <td className="border border-black p-1 bg-gray-50">{pct(report.visitsEvening || 0, totalTiming)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table 4: Ranks */}
                <div>
                    <h3 className="font-bold text-[11px] mb-1 text-right underline">* توزيع الزيارات حسب الرتب لكل المواد</h3>
                    <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 h-6">
                                <th className="border border-black p-1 w-24">البيان</th>
                                <th className="border border-black p-1">متربص</th>
                                <th className="border border-black p-1">أستاذ التعليم الابتدائي</th>
                                <th className="border border-black p-1">أ قسم أول</th>
                                <th className="border border-black p-1">أ قسم ثان</th>
                                <th className="border border-black p-1">أستاذ مميز</th>
                                <th className="border border-black p-1">متعاقد / مستخلف</th>
                                <th className="border border-black p-1 bg-gray-200">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-6">
                                <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                <td className="border border-black p-1">{report.ranks.stagiere}</td>
                                <td className="border border-black p-1">{report.ranks.primary}</td>
                                <td className="border border-black p-1">{report.ranks.class1}</td>
                                <td className="border border-black p-1">{report.ranks.class2}</td>
                                <td className="border border-black p-1">{report.ranks.distinguished}</td>
                                <td className="border border-black p-1">{report.ranks.contract}</td>
                                <td className="border border-black p-1 font-bold bg-gray-50">{totalRanks}</td>
                            </tr>
                            <tr className="h-6">
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

                {/* Table 5: Levels */}
                <div>
                    <h3 className="font-bold text-[11px] mb-1 text-right underline">* توزيع الزيارات التفتيشية والتوجيهية ... حسب المستويات لكل المواد</h3>
                    <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 h-6">
                                <th className="border border-black p-1 w-24">المستويات</th>
                                <th className="border border-black p-1">التحضيري</th>
                                <th className="border border-black p-1">السنة 01</th>
                                <th className="border border-black p-1">السنة 02</th>
                                <th className="border border-black p-1">السنة 03</th>
                                <th className="border border-black p-1">السنة 04</th>
                                <th className="border border-black p-1">السنة 05</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-6">
                                <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                <td className="border border-black p-1">{report.levels.prep}</td>
                                <td className="border border-black p-1">{report.levels.year1}</td>
                                <td className="border border-black p-1">{report.levels.year2}</td>
                                <td className="border border-black p-1">{report.levels.year3}</td>
                                <td className="border border-black p-1">{report.levels.year4}</td>
                                <td className="border border-black p-1">{report.levels.year5}</td>
                            </tr>
                            <tr className="h-6">
                                <td className="border border-black p-1 font-bold bg-gray-50">النسبة المئوية</td>
                                <td className="border border-black p-1">{pct(report.levels.prep, totalLevels)}</td>
                                <td className="border border-black p-1">{pct(report.levels.year1, totalLevels)}</td>
                                <td className="border border-black p-1">{pct(report.levels.year2, totalLevels)}</td>
                                <td className="border border-black p-1">{pct(report.levels.year3, totalLevels)}</td>
                                <td className="border border-black p-1">{pct(report.levels.year4, totalLevels)}</td>
                                <td className="border border-black p-1">{pct(report.levels.year5, totalLevels)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Table 6: Subjects */}
                <div>
                    <h3 className="font-bold text-[11px] mb-1 text-right underline">* توزيع الزيارات على المواد</h3>
                    <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 h-6">
                                <th className="border border-black p-1 w-24">البيان</th>
                                <th className="border border-black p-1">اللغة العربية</th>
                                <th className="border border-black p-1">رياضيات</th>
                                <th className="border border-black p-1">ت. إسلامية</th>
                                <th className="border border-black p-1">تاريــخ</th>
                                <th className="border border-black p-1">جغرافيا</th>
                                <th className="border border-black p-1">ت. مدنية</th>
                                <th className="border border-black p-1">ت. علمية</th>
                                <th className="border border-black p-1">ت. فنية</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-6">
                                <td className="border border-black p-1 font-bold bg-gray-50">العدد</td>
                                <td className="border border-black p-1">{report.subjects.arabic}</td>
                                <td className="border border-black p-1">{report.subjects.math}</td>
                                <td className="border border-black p-1">{report.subjects.islamic}</td>
                                <td className="border border-black p-1">{report.subjects.history}</td>
                                <td className="border border-black p-1">{report.subjects.geo}</td>
                                <td className="border border-black p-1">{report.subjects.civics}</td>
                                <td className="border border-black p-1">{report.subjects.science}</td>
                                <td className="border border-black p-1">{report.subjects.art}</td>
                            </tr>
                            <tr className="h-6">
                                <td className="border border-black p-1 font-bold bg-gray-50">النسبة المئوية</td>
                                <td className="border border-black p-1">{pct(report.subjects.arabic, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.math, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.islamic, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.history, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.geo, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.civics, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.science, totalSubjects)}</td>
                                <td className="border border-black p-1">{pct(report.subjects.art, totalSubjects)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer - Pushed to bottom properly */}
            <div className="flex flex-col items-end px-8 text-sm font-bold shrink-0 mt-8 mb-4">
                 <p className="mb-4">حرر بـ: {report.wilaya} في: {currentDate}</p>
                 <div className="text-center w-64 relative flex flex-col items-center">
                    <p className="mb-12 underline">مفتش التعليم الابتدائي</p>
                    
                    {/* Signature Container - Overlaid and Realistic */}
                    {signature && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-48 h-32 flex items-center justify-center pointer-events-none z-10">
                            <img 
                                src={signature} 
                                alt="Signature" 
                                className="w-full h-full object-contain mix-blend-multiply transform -rotate-6 scale-150 opacity-90" 
                            />
                        </div>
                    )}
                    {/* Dashed circle removed as requested */}
                 </div>
            </div>

        </div>
        
        <style>{`
            @media print {
                @page { 
                    size: portrait;
                    margin: 0;
                }
                .a4-page-portrait {
                    width: 210mm;
                    height: 297mm;
                    margin: 0 auto;
                    background: white;
                    page-break-inside: avoid;
                    overflow: hidden;
                }
            }
            @media screen {
                .a4-page-portrait {
                    width: 210mm;
                    height: 297mm;
                    margin: 20px auto;
                    background: white;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
            }
        `}</style>
    </div>
  );
};

export default PrintableQuarterlyReport;
