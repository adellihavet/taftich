import React from 'react';
import { ReportData, Teacher } from '../types';
import { FileDown, Printer } from 'lucide-react';

interface PrintableReportProps {
  report: ReportData;
  teacher: Teacher;
  signature?: string;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ report, teacher, signature }) => {
  
  const handleDownloadPDF = () => {
      document.title = `تقرير_${teacher.fullName.replace(/\s/g, '_')}_${report.inspectionDate}`;
      window.print();
  };

  const allCategories = Array.from(new Set(report.observations.map(o => o.category)));
  
  // تعديل التقسيم: 4 مجالات في الصفحة الأولى، والباقي في الثانية
  // هذا ينقل "التواصل والتفاعل" إلى الصفحة الثانية لمنع انقصاصه
  const page1Categories = allCategories.slice(0, 4);
  const page2Categories = allCategories.slice(4);

  const getNoteStyle = (text: string) => {
    const len = text.length;
    if (len > 90) return "text-[9px] leading-tight tracking-tighter"; 
    if (len > 60) return "text-[10px] leading-tight";
    return "text-[11px] leading-normal";
  };

  return (
    <div className="font-serif text-black leading-normal relative" dir="rtl">
      
      {/* زر الحفظ PDF (يظهر في الشاشة فقط) */}
      <div className="fixed top-4 left-4 z-50 flex gap-3 no-print">
          <button 
            onClick={handleDownloadPDF}
            className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-red-700 transition-transform hover:scale-105 flex items-center gap-2 font-bold font-sans border-2 border-white"
          >
              <FileDown size={24} />
              <span className="text-lg">حفظ كملف PDF / طباعة</span>
          </button>
      </div>

      {/* ================= الصفحة الأولى ================= */}
      <div className="a4-page">
          
          {/* الترويسة */}
          <div className="text-center mb-1 shrink-0">
            <h3 className="text-sm font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
            <h3 className="text-sm font-bold mb-1">وزارة التربية الوطنية</h3>
            
            <div className="flex justify-between items-start px-2 mb-1 text-[11px] font-bold">
                <div className="text-right">
                    <p>مديرية التربية لولاية: {report.wilaya}</p>
                    <p>المقاطعة: {report.district}</p>
                </div>
                <div className="text-left">
                    <p>مفتشية التعليم الابتدائي للمواد</p>
                    <p>المدرسة: {report.school}</p>
                </div>
            </div>

            <div className="flex justify-center my-1">
                <h1 className="text-lg font-bold border-2 border-black px-8 py-1 rounded bg-gray-50 shadow-[2px_2px_0px_0px_#000]">
                    تقرير تفتيش تربوي لأستاذ التعليم الابتدائي
                </h1>
            </div>
          </div>

          {/* 1. جدول المعلومات العامة والبيداغوجية */}
          {/* استخدام margin-bottom لفصل الجدول عن الشبكة */}
          <div className="mb-4 border border-black shrink-0">
             <div className="border-b border-black bg-gray-200 px-2 py-0.5 font-bold text-[11px] text-center">
                 1 - المعلومات العامة
             </div>
             <div className="p-0.5">
                <table className="w-full text-[10px] border-collapse">
                    <tbody>
                        <tr>
                             <td className="w-1/2 align-top border-l border-black p-0.5">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="h-4"><td className="font-bold w-20">الاسم واللقب:</td><td>{teacher.fullName}</td></tr>
                                        <tr className="h-4"><td className="font-bold">تاريخ الميلاد:</td><td dir="ltr" className="text-right">{teacher.birthDate}</td></tr>
                                        <tr className="h-4"><td className="font-bold">الشهادة:</td><td>{teacher.degree}</td></tr>
                                        <tr className="h-4"><td className="font-bold">تاريخ التعيين:</td><td dir="ltr" className="text-right">{teacher.recruitmentDate}</td></tr>
                                        <tr className="h-4"><td className="font-bold">الرتبة:</td><td>{teacher.rank}</td></tr>
                                    </tbody>
                                </table>
                             </td>
                             <td className="w-1/2 align-top p-0.5">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="h-4"><td className="font-bold w-24">الصفة:</td><td>{teacher.status === 'titulaire' ? 'مرسم' : 'متعاقد'}</td></tr>
                                        <tr className="h-4"><td className="font-bold">الدرجة:</td><td>{teacher.echelon || '-'} (تاريخها: {teacher.echelonDate})</td></tr>
                                        <tr className="h-4"><td className="font-bold">تاريخ الرتبة الحالية:</td><td dir="ltr" className="text-right">{teacher.currentRankDate}</td></tr>
                                        <tr className="h-4"><td className="font-bold">آخر تفتيش:</td><td>{teacher.lastInspectionDate} ({teacher.lastMark})</td></tr>
                                    </tbody>
                                </table>
                             </td>
                        </tr>
                    </tbody>
                </table>
             </div>
             
             <div className="border-t border-black bg-gray-200 px-2 py-0.5 font-bold text-[11px] text-center">
                 المعلومات البيداغوجية للحصة
             </div>
             <table className="w-full text-[10px] border-collapse text-center">
                <thead>
                    <tr className="border-b border-black h-4">
                        <th className="border-l border-black p-0.5">المادة</th>
                        <th className="border-l border-black p-0.5">الموضوع</th>
                        <th className="border-l border-black p-0.5">المستوى</th>
                        <th className="border-l border-black p-0.5">التوقيت</th>
                        <th className="p-0.5">التلاميذ (ح/غ)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="h-4">
                        <td className="border-l border-black p-0.5">{report.subject}</td>
                        <td className="border-l border-black p-0.5">{report.topic}</td>
                        <td className="border-l border-black p-0.5">{report.level} / {report.group}</td>
                        <td className="border-l border-black p-0.5">{report.duration}</td>
                        <td className="p-0.5">{report.studentCount} / {report.absentCount}</td>
                    </tr>
                </tbody>
             </table>
          </div>

          {/* 2. شبكة الملاحظة والتقييم (الجزء الأول) */}
          <div className="flex-1 border border-black overflow-hidden flex flex-col mb-2">
             <div className="bg-gray-200 font-bold text-[12px] px-2 py-1 border-b border-black flex justify-between items-center shrink-0">
                 <span className="underline">2 - شبكة الملاحظة والتقييم (الجزء الأول):</span>
             </div>
             <table className="w-full border-collapse text-[10px] table-fixed flex-1">
                <thead>
                    <tr className="bg-gray-100 h-6 border-b border-black">
                        <th className="border-l border-black p-0.5 w-[12%] text-center">المجال</th>
                        <th className="border-l border-black p-0.5 w-[35%] text-center">المؤشرات والمعايير</th>
                        <th className="border-l border-black p-0.5 w-[5%] text-center">الرمز</th>
                        <th className="p-0.5 w-[48%] text-center">ملاحظات وتوجيهات</th>
                    </tr>
                </thead>
                <tbody>
                    {page1Categories.map((cat, idx) => {
                        const catItems = report.observations.filter(o => o.category === cat);
                        return (
                            <React.Fragment key={cat}>
                                <tr className="bg-gray-100 border-b border-black h-5">
                                    <td colSpan={4} className="px-2 py-0.5 font-bold text-center text-[10px]">
                                        {idx + 1}. {cat}
                                    </td>
                                </tr>
                                {catItems.map((item) => (
                                    <tr key={item.id} className="border-b border-black last:border-b-0 h-auto">
                                        <td className="border-l border-black px-1 py-0.5 font-bold align-middle text-center break-words">
                                            {item.criteria}
                                        </td>
                                        <td className="border-l border-black px-1 py-0.5 align-middle leading-tight text-[9px] text-justify">
                                            {item.indicators.join('، ')}
                                        </td>
                                        <td className="border-l border-black p-0.5 text-center align-middle font-bold text-[11px]">
                                            {item.score === 2 ? '2' : item.score === 1 ? '1' : item.score === 0 ? '0' : ''}
                                        </td>
                                        <td className={`px-1 py-0.5 align-middle font-bold text-red-800 whitespace-pre-wrap ${getNoteStyle(item.improvementNotes)}`}>
                                            {item.improvementNotes}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </tbody>
             </table>
          </div>
          
          <div className="text-center text-[10px] text-gray-500 font-bold">1 / 2</div>
      </div>

      {/* ================= الصفحة الثانية ================= */}
      <div className="a4-page">
          
          {/* تابع شبكة الملاحظة (الجزء الثاني) */}
          <div className="border border-black mb-2 shrink-0">
             <div className="bg-gray-200 font-bold text-[12px] px-2 py-1 border-b border-black flex justify-between items-center">
                 <span className="underline">تابع شبكة الملاحظة والتقييم (الجزء الثاني):</span>
             </div>
             <table className="w-full border-collapse text-[10px] table-fixed">
                <thead>
                    <tr className="bg-gray-100 h-6 border-b border-black">
                        <th className="border-l border-black p-0.5 w-[12%] text-center">المجال</th>
                        <th className="border-l border-black p-0.5 w-[35%] text-center">المؤشرات والمعايير</th>
                        <th className="border-l border-black p-0.5 w-[5%] text-center">الرمز</th>
                        <th className="p-0.5 w-[48%] text-center">ملاحظات وتوجيهات</th>
                    </tr>
                </thead>
                <tbody>
                    {page2Categories.map((cat, idx) => {
                        const catItems = report.observations.filter(o => o.category === cat);
                        return (
                            <React.Fragment key={cat}>
                                <tr className="bg-gray-100 border-b border-black h-5">
                                    <td colSpan={4} className="px-2 py-0.5 font-bold text-center text-[10px]">
                                        {idx + 5}. {cat}
                                    </td>
                                </tr>
                                {catItems.map((item) => (
                                    <tr key={item.id} className="border-b border-black last:border-b-0 h-auto">
                                        <td className="border-l border-black px-1 py-0.5 font-bold align-middle text-center break-words">
                                            {item.criteria}
                                        </td>
                                        <td className="border-l border-black px-1 py-0.5 align-middle leading-tight text-[9px] text-justify">
                                            {item.indicators.join('، ')}
                                        </td>
                                        <td className="border-l border-black p-0.5 text-center align-middle font-bold text-[11px]">
                                            {item.score === 2 ? '2' : item.score === 1 ? '1' : item.score === 0 ? '0' : ''}
                                        </td>
                                        <td className={`px-1 py-0.5 align-middle font-bold text-red-800 whitespace-pre-wrap ${getNoteStyle(item.improvementNotes)}`}>
                                            {item.improvementNotes}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </tbody>
             </table>
             <div className="text-[9px] text-center bg-gray-50 border-t border-black py-0.5 text-gray-600 font-bold">
                 مفتاح الرموز: (2: متحقق) - (1: متحقق جزئياً) - (0: غير متحقق)
             </div>
          </div>

          {/* التقدير العام والختم (يأخذ باقي المساحة) */}
          <div className="flex-1 flex flex-col border-2 border-black rounded-sm overflow-hidden">
             <div className="text-center bg-gray-100 border-b-2 border-black py-1">
                <h2 className="text-[14px] font-bold">التقدير العـــــام</h2>
             </div>

             <div className="p-4 flex-1 text-justify text-[13px] leading-[1.8] whitespace-pre-line overflow-hidden">
                 {report.generalAssessment}
             </div>

             {/* التذييل والختم */}
             <div className="flex border-t-2 border-black h-[45mm] shrink-0">
                 <div className="w-2/3 border-l-2 border-black p-3 flex flex-col justify-center gap-2 bg-gray-50">
                     <div className="flex items-center gap-2">
                         <span className="font-bold text-[12px]">العلامة بالحروف:</span>
                         <span className="flex-1 border-b border-dotted border-black font-bold text-sm px-2 text-center">{report.markInLetters}</span>
                     </div>
                     <div className="flex items-center gap-4 mt-1">
                         <span className="font-bold text-[12px]">العلامة بالأرقام:</span>
                         <span className="text-xl font-bold border-2 border-black px-6 py-0.5 rounded bg-white">{report.finalMark} / 20</span>
                     </div>
                 </div>
                 <div className="w-1/3 p-2 text-center relative flex flex-col items-center justify-start pt-1">
                     <p className="text-[10px] font-bold mb-0.5">حرر بـ: {report.wilaya} في: {report.inspectionDate}</p>
                     <p className="font-bold underline text-[12px] mb-1">المفتش التربوي</p>
                     <p className="text-[12px] font-bold mb-2">{report.inspectorName}</p>
                     
                     {signature ? (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-28 h-20 flex items-center justify-center pointer-events-none">
                            <img src={signature} alt="Signature" className="max-w-full max-h-full mix-blend-multiply object-contain" />
                        </div>
                     ) : (
                        <div className="mt-2 text-[8px] text-gray-300 border border-dashed border-gray-300 w-16 h-16 rounded-full flex items-center justify-center rotate-[-15deg]">
                            الختم
                        </div>
                     )}
                 </div>
             </div>
          </div>
          
          <div className="mt-1 flex justify-between text-[9px] font-bold px-4 text-gray-500 shrink-0">
             <span>نسخة للمفتشية</span>
             <span>نسخة للمدرسة</span>
             <span>نسخة للمعني(ة)</span>
             <span className="text-black">2 / 2</span>
          </div>
      </div>

    </div>
  );
};

export default PrintableReport;