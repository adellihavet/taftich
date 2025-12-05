
import React from 'react';
import { TenureReportData, Teacher } from '../types';
import { FileDown } from 'lucide-react';
import { formatDateForDisplay } from '../utils/sheetHelper';

interface PrintableTenureReportProps {
  report: TenureReportData;
  teacher: Teacher;
  signature?: string;
}

const PrintableTenureReport: React.FC<PrintableTenureReportProps> = ({ report, teacher, signature }) => {
  
  const handleDownloadPDF = () => {
      document.title = `تقرير_تثبيت_${teacher.fullName}`;
      window.print();
  };

  const getLesson = (index: number) => report.lessons[index] || { subject: '', topic: '', level: '', timeStart: '', timeEnd: '', phaseLaunch: '', phaseConstruction: '', phaseInvestment: '' };

  const getOralQuestions = () => {
      if (typeof report.oralQuestions === 'string') {
          return { educationScience: report.oralQuestions, psychology: '', legislation: '' };
      }
      return report.oralQuestions || { educationScience: '', psychology: '', legislation: '' };
  };

  const oral = getOralQuestions();

  const isHigherSchoolGraduate = teacher.degree && (
      teacher.degree.includes('المدرسة العليا') || 
      teacher.degree.includes('ENS')
  );

  return (
    <div className="font-serif text-black leading-normal" dir="rtl">
        
        {/* Floating Action Button */}
        <div className="fixed top-4 left-4 z-50 flex gap-3 no-print">
            <button 
                onClick={handleDownloadPDF}
                className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl hover:bg-black transition-transform hover:scale-105 flex items-center gap-2 font-bold font-sans border-2 border-white"
            >
                <FileDown size={20} />
                <span>حفظ كملف PDF</span>
            </button>
        </div>

        {/* --- PAGE 1 --- */}
        <div className="a4-page flex flex-col justify-between">
            
            {/* TOP BLOCK: Header + Info */}
            <div>
                {/* Header */}
                <div className="text-center mb-4 space-y-1">
                    <h3 className="text-sm font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                    <h3 className="text-sm font-bold">وزارة التربية الوطنية</h3>
                    
                    <div className="flex justify-between items-start text-xs font-bold mt-2 px-2">
                        <div className="text-right">
                            <p>مديرية التربية لولاية {report.wilaya}</p>
                        </div>
                        <div className="text-left">
                            <p>مفتشية التعليم الابتدائي م / {report.district}</p>
                        </div>
                    </div>

                    <div className="flex justify-center mt-3 mb-4">
                        <div className="border-[3px] border-black border-double px-10 py-2 rounded-2xl bg-white text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <h1 className="text-lg font-bold">
                                تقرير تفتيش التثبيت
                                <br/>
                                <span className="font-normal text-sm">في سلك أستاذ المدرسة الابتدائية</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Committee & Teacher Info */}
                <div className="space-y-3 text-xs font-bold px-2">
                    
                    <div className="border-b-2 border-black border-dotted pb-3 space-y-1.5">
                        <p className="mb-1">اجتمعت لجنة التفتيش في سلك : أستاذ مدرسة ابتدائية</p>
                        <div className="flex flex-wrap gap-x-12 gap-y-1">
                            <span>بتاريخ : <span dir="ltr">{formatDateForDisplay(report.examDate)}</span></span>
                            <span>في مدرسة: {report.school}</span>
                            <span>بمدينة : {report.city}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-8 gap-y-1 pt-1">
                            <span>برئاسة السيد : {report.inspectorName}</span>
                            <span>مفتش التعليم الإبتدائي : المقاطعة {report.district}</span>
                        </div>
                        
                        <div className="flex gap-4">
                            <span className="min-w-[150px]">وعضوية السيد(ة): {report.directorName}</span>
                            <span>(مدير المدرسة الإبتدائية)</span>
                        </div>
                        
                        <div className="flex gap-4">
                            <span className="min-w-[150px]">و السيد(ة): {report.teacherMemberName}</span>
                            <span>(أستاذ بالمدرسة الإبتدائية)</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-1">
                        <p className="underline decoration-1 underline-offset-4 mb-2">لإجراء إمتحان التثبيت على رتبة : أستاذ المدرسة الإبتدائية</p>
                        
                        <div className="flex flex-wrap gap-x-16 gap-y-1 items-center">
                            <span className="min-w-[250px]">السيد(ة) : {teacher.fullName}</span>
                            <span>لقب الآنسة : /</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-16 gap-y-1 items-center">
                            <span className="min-w-[250px]">المولود(ة) في : {teacher.birthPlace}</span>
                            <span>بتاريخ : <span dir="ltr">{formatDateForDisplay(teacher.birthDate)}</span></span>
                        </div>

                        <div className="flex gap-4">
                            <span className="flex-1">المتدرب(ة) منذ : <span dir="ltr">{formatDateForDisplay(teacher.recruitmentDate)}</span></span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                            <span>بمقتضى قرار التسمية رقم : {report.appointmentDecisionNumber}</span>
                            <span>بتاريخ : <span dir="ltr">{formatDateForDisplay(report.appointmentDecisionDate)}</span></span>
                            <span>تأشيرة المراقب المالي رقم : {report.financialVisaNumber}</span>
                            <span>بتاريخ : <span dir="ltr">{formatDateForDisplay(report.financialVisaDate)}</span></span>
                        </div>

                        <div className="flex flex-wrap gap-x-8 gap-y-1 items-center">
                            <span>المحرز(ة) على شهادة : {teacher.degree}</span>
                            <span>من : {report.university}</span>
                            <span>بتاريخ : <span dir="ltr">{formatDateForDisplay(teacher.degreeDate)}</span></span>
                        </div>
                        
                        {!isHigherSchoolGraduate && (
                            <p>و {report.recruitmentType || 'الناجح في المسابقة'} بتاريخ : <span dir="ltr">{formatDateForDisplay(report.contestDate)}</span></p>
                        )}
                    </div>

                    {/* Lessons Grid */}
                    <div className="pt-2">
                        <p className="underline mb-1 text-center">وإشتمل الإمتحان على ثلاثة دروس</p>
                        <table className="w-full border-collapse border border-black text-center text-xs">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 w-1/3">الدرس الأول</th>
                                    <th className="border border-black p-1 w-1/3">الدرس الثاني</th>
                                    <th className="border border-black p-1 w-1/3">الدرس الثالث</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 align-top h-16">
                                        <p className="font-bold mb-1">{getLesson(0).subject}</p>
                                        <p className="mb-1">{getLesson(0).topic}</p>
                                        <p>{getLesson(0).level}</p>
                                        <p className="text-[10px] mt-1">{getLesson(0).timeStart} - {getLesson(0).timeEnd}</p>
                                    </td>
                                    <td className="border border-black p-1 align-top">
                                        <p className="font-bold mb-1">{getLesson(1).subject}</p>
                                        <p className="mb-1">{getLesson(1).topic}</p>
                                        <p>{getLesson(1).level}</p>
                                        <p className="text-[10px] mt-1">{getLesson(1).timeStart} - {getLesson(1).timeEnd}</p>
                                    </td>
                                    <td className="border border-black p-1 align-top">
                                        <p className="font-bold mb-1">{getLesson(2).subject}</p>
                                        <p className="mb-1">{getLesson(2).topic}</p>
                                        <p>{getLesson(2).level}</p>
                                        <p className="text-[10px] mt-1">{getLesson(2).timeStart} - {getLesson(2).timeEnd}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="border border-black p-1 font-bold bg-gray-50">
                                        العلامة التي أحرزتها المترشحة في الدروس : {report.pedagogyMark} من 40
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Oral Exam */}
                    <div className="pt-2 border-t-2 border-black border-dashed mt-2">
                        <p className="underline mb-1">مساءلة شفهية في:</p>
                        <div className="grid grid-cols-1 gap-1 pl-4 text-[11px]">
                            <div className="flex gap-2">
                                <span className="font-bold w-24 shrink-0">• علوم التربية:</span>
                                <span className="font-normal">{oral.educationScience}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold w-24 shrink-0">• علم النفس:</span>
                                <span className="font-normal">{oral.psychology}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold w-24 shrink-0">• التشريع:</span>
                                <span className="font-normal">{oral.legislation}</span>
                            </div>
                        </div>
                        <p className="text-left font-bold mt-1 pl-2 border-t border-black inline-block pt-1">العلامة في المساءلة : {report.oralMark} من 20</p>
                    </div>
                </div>
            </div>

            {/* BOTTOM BLOCK: Footer / Decision - Fixed at bottom */}
            <div className="mt-auto border-t-[3px] border-double border-black text-xs pt-2 pb-8">
                <div className="flex justify-between items-center mb-2 px-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">قرار اللجنة :</span>
                        <span className="border-2 border-black px-6 py-1 font-bold text-sm bg-gray-100">
                            {report.finalDecision === 'confirmed' ? 'نجـــــاح (تثبيت)' : report.finalDecision === 'deferred' ? 'تأجيل' : 'إخفاق'}
                        </span>
                    </div>
                    <div className="border border-black p-1 px-3 text-center rounded">
                        <p className="font-bold">المجموع العام</p>
                        <p className="text-lg font-bold">{report.totalMark} / 60</p>
                    </div>
                </div>

                <div className="flex justify-between items-start px-4 mt-2 text-[11px] font-bold">
                    <div className="text-center w-1/3">
                        <p className="mb-2 underline">أعضاء اللجنة</p>
                        <p className="mb-1">{report.directorName}</p>
                        <p>{report.teacherMemberName}</p>
                    </div>
                    <div className="text-center w-1/3">
                        <p className="mb-2 underline">رئيس لجنة الامتحان</p>
                        <div className="h-12 flex items-center justify-center mb-1">
                            {signature ? <img src={signature} alt="Sig" className="w-20 h-12 object-contain mix-blend-multiply" /> : 'الختم والإمضاء'}
                        </div>
                        <p>{report.inspectorName}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- PAGE 2 --- */}
        <div className="a4-page flex flex-col">
             
             {/* Header Code Box */}
             <div className="flex justify-center mb-10 shrink-0">
                <div className="border-[3px] border-black px-12 py-2 rounded-xl text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <h2 className="font-bold text-xl tracking-widest">تقـريـر المفتـش</h2>
                </div>
            </div>

            {/* Detailed Activities - Flex Grow */}
            <div className="flex-1 space-y-10 text-[12px] font-bold text-right pr-2 flex flex-col">
                {[0, 1, 2].map((idx) => {
                    const lesson = getLesson(idx);
                    return (
                        <div key={idx} className="relative pl-4 border-r-4 border-gray-200 pr-4">
                            <h4 className="mb-3 text-sm border-b border-black inline-block pb-1">
                                النشاط {idx === 0 ? 'الأول' : idx === 1 ? 'الثاني' : 'الثالث'} : <span className="font-normal mx-2">{lesson.subject}</span>
                            </h4>
                            <ul className="list-none space-y-3 leading-relaxed">
                                <li className="flex items-start">
                                    <span className="font-bold min-w-[120px]">• مرحلة الإنطلاق :</span> 
                                    <span className="font-normal text-justify">{lesson.phaseLaunch || '...................................................'}</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold min-w-[120px]">• مرحلة البناء :</span> 
                                    <span className="font-normal text-justify">{lesson.phaseConstruction || '...................................................'}</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold min-w-[120px]">• مرحلة الإستثمار :</span> 
                                    <span className="font-normal text-justify">{lesson.phaseInvestment || '...................................................'}</span>
                                </li>
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Footer Section - Fixed Bottom */}
            <div className="mt-auto pt-10 shrink-0">
                <p className="text-[12px] font-bold text-justify mb-8 leading-loose px-2 border-t border-black pt-4">
                    وبعد المناقشة والمساءلة الشفهية ثم المداولة والتشاور مع أعضاء اللجنة تقرر: <span className="underline decoration-dotted underline-offset-4 mx-1">تثبيت الأستاذ(ة) في سلك أستاذ المدرسة الإبتدائية</span>
                </p>

                <div className="flex justify-between items-start px-8 pb-8">
                    <div className="w-1/2"></div>
                    <div className="w-1/2 text-center text-[12px] font-bold relative flex flex-col items-center">
                        <p className="mb-4">التاريخ : <span dir="ltr">{formatDateForDisplay(report.examDate)}</span></p>
                        <p className="mb-1">مفتش التعليم الإبتدائي :</p>
                        <p className="mb-6 text-sm">{report.inspectorName}</p>
                        
                        {signature ? (
                            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-56 h-32 flex items-center justify-center pointer-events-none z-10">
                                <img src={signature} alt="Signature" className="w-full h-full mix-blend-multiply object-contain transform -rotate-2 scale-125" />
                            </div>
                        ) : (
                            <div className="mt-4 text-[8px] text-gray-300 border border-dashed border-gray-300 w-16 h-16 rounded-full flex items-center justify-center rotate-[-15deg]">
                                الختم
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

export default PrintableTenureReport;