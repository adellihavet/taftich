import React from 'react';
import { QuarterlyReportData } from '../types';
import { FileDown } from 'lucide-react';

interface PrintableQuarterlyReportProps {
  report: QuarterlyReportData;
}

const PrintableQuarterlyReport: React.FC<PrintableQuarterlyReportProps> = ({ report }) => {
    
  const handleDownloadPDF = () => {
      document.title = `حصيلة_نشاطات_${report.term}_${report.schoolYear.replace('/', '-')}`;
      window.print();
  };

  // Calculations for Percentages
  const totalDays = Object.values(report.days).reduce((a, b) => a + b, 0) || 1;
  const totalRanks = Object.values(report.ranks).reduce((a, b) => a + b, 0) || 1;
  const totalLevels = Object.values(report.levels).reduce((a, b) => a + b, 0) || 1;
  const totalSubjects = Object.values(report.subjects).reduce((a, b) => a + b, 0) || 1;

  const pct = (val: number, total: number) => val === 0 ? '' : ((val / total) * 100).toFixed(1) + '%';

  return (
    <div className="font-serif text-black leading-normal" dir="rtl">
        
        {/* Floating Action Button */}
        <div className="fixed top-4 left-4 z-50 flex gap-3 no-print">
            <button 
                onClick={handleDownloadPDF}
                className="bg-purple-800 text-white px-6 py-3 rounded-full shadow-xl hover:bg-black transition-transform hover:scale-105 flex items-center gap-2 font-bold font-sans border-2 border-white"
            >
                <FileDown size={20} />
                <span>حفظ كملف PDF</span>
            </button>
        </div>

        <div className="a4-page relative p-8 flex flex-col h-[296mm]" style={{ backgroundColor: 'white' }}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6 text-sm font-bold">
                <div className="text-right w-1/3">
                    <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p>وزارة التربية الوطنية</p>
                    <p>المفتشية العامة للبيداغوجيا</p>
                </div>
                <div className="text-left w-1/3">
                    <p>مديرية التربية لولاية {report.wilaya}</p>
                    <p>المفتشية: {report.district}</p>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold border-b-2 border-black inline-block pb-1">
                    حصيلة نشاطات مفتش التعليم الابتدائي للفصل {report.term} من السنة الدراسية: {report.schoolYear}
                </h1>
            </div>

            {/* Main Table 1: General Info */}
            <div className="mb-6">
                <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="border border-black p-1 bg-gray-50 w-[15%]">اسم المفتش ولقبه</th>
                            <th rowSpan={2} className="border border-black p-1 bg-gray-50">التخصص</th>
                            <th rowSpan={2} className="border border-black p-1 bg-gray-50">المقاطعة</th>
                            <th colSpan={3} className="border border-black p-1 bg-gray-50">عدد الأساتذة</th>
                            <th colSpan={4} className="border border-black p-1 bg-gray-50">النشاطات</th>
                            <th colSpan={2} className="border border-black p-1 bg-gray-50">المهام الاخرى (عددها)</th>
                        </tr>
                        <tr>
                            <th className="border border-black p-1 text-[10px]">الاجمالي</th>
                            <th className="border border-black p-1 text-[10px]">كل المتربصين بدون استثناء</th>
                            <th className="border border-black p-1 text-[10px]">في طور الترسيم (المعنيون)</th>
                            <th className="border border-black p-1 text-[10px]">التفتيش</th>
                            <th className="border border-black p-1 text-[10px]">التثبيت</th>
                            <th className="border border-black p-1 text-[10px]">التكوين</th>
                            <th className="border border-black p-1 text-[10px]">الاستفادة من التكوين</th>
                            <th className="border border-black p-1 text-[10px]">تأطير عمليات (جهوية، وطنية)</th>
                            <th className="border border-black p-1 text-[10px]">التحقيقات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="h-12 font-bold">
                            <td className="border border-black p-1">{report.inspectorName}</td>
                            <td className="border border-black p-1">{report.rank}</td>
                            <td className="border border-black p-1">{report.district}</td>
                            <td className="border border-black p-1">{report.teachersTotal}</td>
                            <td className="border border-black p-1">{report.teachersTrainee}</td>
                            <td className="border border-black p-1">{report.teachersTenure}</td>
                            <td className="border border-black p-1">{report.visitsInspection}</td>
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
                <h3 className="font-bold text-sm mb-1 text-right">* توزيع الزيارات على الأيام لكل المواد</h3>
                <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-black p-1 w-20">/</th>
                            <th className="border border-black p-1">الأحد</th>
                            <th className="border border-black p-1">الإثنين</th>
                            <th className="border border-black p-1">الثلاثاء</th>
                            <th className="border border-black p-1">الأربعاء</th>
                            <th className="border border-black p-1">الخميس</th>
                            <th className="border border-black p-1 bg-gray-100">المجموع</th>
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
                            <td className="border border-black p-1 font-bold">{totalDays > 1 ? totalDays : 0}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50">النسبة %</td>
                            <td className="border border-black p-1">{pct(report.days.sun, totalDays)}</td>
                            <td className="border border-black p-1">{pct(report.days.mon, totalDays)}</td>
                            <td className="border border-black p-1">{pct(report.days.tue, totalDays)}</td>
                            <td className="border border-black p-1">{pct(report.days.wed, totalDays)}</td>
                            <td className="border border-black p-1">{pct(report.days.thu, totalDays)}</td>
                            <td className="border border-black p-1 font-bold">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Table 3: Distribution by Rank */}
            <div className="mb-4">
                <h3 className="font-bold text-sm mb-1 text-right">* توزيع الزيارات حسب الرتب لكل المواد</h3>
                <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-black p-1 w-20">/</th>
                            <th className="border border-black p-1">متربص</th>
                            <th className="border border-black p-1">أستاذ التعليم الابتدائي</th>
                            <th className="border border-black p-1">أ قسم أول</th>
                            <th className="border border-black p-1">أ قسم ثان</th>
                            <th className="border border-black p-1">أستاذ مميز</th>
                            <th className="border border-black p-1">متعاقد/مستخلف</th>
                            <th className="border border-black p-1 bg-gray-100">المجموع</th>
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
                            <td className="border border-black p-1 font-bold">{totalRanks > 1 ? totalRanks : 0}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50">النسبة %</td>
                            <td className="border border-black p-1">{pct(report.ranks.stagiere, totalRanks)}</td>
                            <td className="border border-black p-1">{pct(report.ranks.primary, totalRanks)}</td>
                            <td className="border border-black p-1">{pct(report.ranks.class1, totalRanks)}</td>
                            <td className="border border-black p-1">{pct(report.ranks.class2, totalRanks)}</td>
                            <td className="border border-black p-1">{pct(report.ranks.distinguished, totalRanks)}</td>
                            <td className="border border-black p-1">{pct(report.ranks.contract, totalRanks)}</td>
                            <td className="border border-black p-1 font-bold">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Table 4: Distribution by Level */}
            <div className="mb-4">
                <h3 className="font-bold text-sm mb-1 text-right">* توزيع الزيارات التفتيشية والتوجيهية حسب المستويات لكل المواد</h3>
                <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-black p-1 w-20">/</th>
                            <th className="border border-black p-1">التحضيري</th>
                            <th className="border border-black p-1">السنة 01</th>
                            <th className="border border-black p-1">السنة 02</th>
                            <th className="border border-black p-1">السنة 03</th>
                            <th className="border border-black p-1">السنة 04</th>
                            <th className="border border-black p-1">السنة 05</th>
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
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50">النسبة %</td>
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

             {/* Table 5: Distribution by Subject */}
             <div className="mb-4">
                <h3 className="font-bold text-sm mb-1 text-right">* توزيع الزيارات على المواد</h3>
                <table className="w-full border-collapse border border-black text-center text-xs">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-black p-1 w-20">/</th>
                            <th className="border border-black p-1">اللغة العربية</th>
                            <th className="border border-black p-1">رياضيات</th>
                            <th className="border border-black p-1">ت. إسلامية</th>
                            <th className="border border-black p-1">تاريخ وجغرافيا</th>
                            <th className="border border-black p-1">ت. مدنية</th>
                            <th className="border border-black p-1">ت. علمية</th>
                            <th className="border border-black p-1">ت. موسيقية</th>
                            <th className="border border-black p-1">الرسم</th>
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
                            <td className="border border-black p-1">{report.subjects.music}</td>
                            <td className="border border-black p-1">{report.subjects.art}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50">%</td>
                            <td className="border border-black p-1">{pct(report.subjects.arabic, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.math, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.islamic, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.historyGeo, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.civics, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.science, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.music, totalSubjects)}</td>
                            <td className="border border-black p-1">{pct(report.subjects.art, totalSubjects)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex justify-between px-10 text-sm font-bold">
                 <div>المفتش</div>
                 <div>الختم والتوقيع</div>
            </div>

        </div>
    </div>
  );
};

export default PrintableQuarterlyReport;
