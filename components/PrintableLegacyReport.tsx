import React from 'react';
import { ReportData, Teacher } from '../types';
import { FileDown } from 'lucide-react';

interface PrintableLegacyReportProps {
  report: ReportData;
  teacher: Teacher;
  signature?: string;
}

const PrintableLegacyReport: React.FC<PrintableLegacyReportProps> = ({ report, teacher, signature }) => {
    
  const handleDownloadPDF = () => {
      document.title = `تقرير_كلاسيكي_${teacher.fullName.replace(/\s/g, '_')}_${report.inspectionDate}`;
      window.print();
  };

  return (
    <div className="font-serif text-black leading-normal" dir="rtl">
        
        {/* Floating Action Button */}
        <div className="fixed top-4 left-4 z-50 flex gap-3 no-print">
            <button 
                onClick={handleDownloadPDF}
                className="bg-amber-600 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-amber-700 transition-transform hover:scale-105 flex items-center gap-2 font-bold font-sans border-2 border-white"
            >
                <FileDown size={24} />
                <span className="text-lg">حفظ كملف PDF / طباعة</span>
            </button>
        </div>

        {/* --- PAGE 1 --- */}
        <div className="a4-page relative flex flex-col p-0" style={{ padding: '10mm 15mm' }}>
            
            {/* Header Section */}
            <div className="flex justify-between items-start text-[11px] font-bold mb-2 relative shrink-0">
                {/* Right: Ministry Info */}
                <div className="text-right flex flex-col items-start w-1/3 space-y-1">
                    <h3 className="text-[12px] font-bold text-center w-[200%] -mr-[50%] mb-3">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                    <p>وزارة التربية الوطنية</p>
                    <p>مديرية التربية لولاية: {report.wilaya}</p>
                    <p>مفتشية التربية والتعليم الابتدائي</p>
                    <p>المقاطعة: {report.district}</p>
                </div>

                {/* Left: School Info */}
                <div className="text-right w-1/3 pt-8 space-y-1">
                     <p>المؤسسة: {report.school}</p>
                     <p>البلدية: {report.legacyData?.municipality}</p>
                     <p>الدائرة: {report.legacyData?.daira}</p>
                     <p>السنة الدراسية: {report.legacyData?.schoolYear}</p>
                </div>
            </div>

            {/* Title Box */}
            <div className="flex justify-center mb-3 shrink-0">
                 <div className="border-[3px] border-black px-8 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                     <h1 className="text-xl font-bold">التقرير التربوي لأستاذ المدرسة الابتدائية</h1>
                 </div>
            </div>

            {/* Section 1: Teacher Info (Thick Border Box) */}
            <div className="border-[3px] border-black p-2 mb-1 shrink-0 text-[12px]">
                {/* Row 1 */}
                <div className="flex items-center mb-1">
                    <span className="font-bold ml-2 w-20">اللقب والإسم :</span>
                    <span className="font-normal flex-[2]">{teacher.fullName}</span>
                    
                    <span className="font-bold ml-2 w-16 text-center">المولود(ة):</span>
                    <span className="font-normal flex-1 text-center">/</span> 
                    
                    <span className="font-bold ml-2 w-14">العائلية:</span>
                    <span className="font-normal flex-1">{report.legacyData?.familyStatus}</span>
                </div>

                {/* Row 2 */}
                <div className="flex items-center mb-1">
                    <span className="font-bold ml-2 w-28">تاريخ ومكان الميلاد:</span>
                    <span className="font-normal flex-1 text-right" dir="ltr">{teacher.birthDate}</span>
                    <span className="font-bold px-2">بـ:</span>
                    <span className="font-normal flex-[2]">{teacher.birthPlace}</span>
                </div>

                {/* Row 3 */}
                <div className="flex items-center mb-1">
                    <span className="font-bold ml-2 w-24">تاريخ أول تعيين:</span>
                    <span className="font-normal w-32 text-right" dir="ltr">{teacher.recruitmentDate}</span>
                    <span className="font-bold ml-2 w-12 text-center">الإطار:</span>
                    <span className="font-normal flex-1">{teacher.rank}</span>
                </div>

                {/* Row 4 */}
                <div className="flex items-center mb-1">
                    <span className="font-bold ml-2 w-24">الدرجة:</span>
                    <span className="font-normal w-32">{teacher.echelon}</span>
                    <span className="font-bold ml-2 w-12 text-center">تاريخها:</span>
                    <span className="font-normal flex-1 text-right pr-2" dir="ltr">{teacher.echelonDate}</span>
                </div>

                {/* Row 5 */}
                <div className="flex items-center mb-1">
                    <span className="font-bold ml-2 w-24">المؤهل العلمي:</span>
                    <span className="font-normal w-32">{teacher.degree}</span>
                    <span className="font-bold ml-2 w-12 text-center">تاريخه:</span>
                    <span className="font-normal flex-1 text-right pr-2" dir="ltr">{teacher.degreeDate || report.legacyData?.graduationDate}</span> 
                </div>

                {/* Row 6 */}
                <div className="flex items-center mb-1">
                    <span className="font-bold ml-2 w-24">المعهد التكنولوجي:</span>
                    <span className="font-normal w-32">{report.legacyData?.trainingInstitute}</span>
                    <span className="font-bold ml-2 w-12 text-center">التخرج:</span>
                    <span className="font-normal flex-1 text-right pr-2" dir="ltr">{report.legacyData?.trainingDate}</span>
                </div>

                {/* Row 7 */}
                <div className="flex items-center">
                    <span className="font-bold ml-2 w-24">آخر تفتيش:</span>
                    <span className="font-normal w-32 text-right" dir="ltr">{teacher.lastInspectionDate}</span>
                    <span className="font-bold ml-2 w-12 text-center">العلامة:</span>
                    <span className="font-normal flex-1">{teacher.lastMark}</span>
                </div>
            </div>

            {/* Section 2: Split Columns (Thick Border Box) */}
            <div className="border-[3px] border-t-0 border-black flex flex-1 h-full min-h-0 text-[11px]">
                
                {/* RIGHT COLUMN */}
                <div className="w-[48%] border-l-[3px] border-black p-2 flex flex-col justify-between">
                    
                    {/* Block 1 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">ظروف التفتيش</h3>
                        <div className="flex justify-between font-bold mb-1.5">
                            <span>تاريخ التفتيش : <span className="font-normal">{report.inspectionDate}</span></span>
                            <span>مدته: <span className="font-normal">{report.duration}</span></span>
                        </div>
                        <div className="flex justify-between font-bold mb-1.5">
                            <span>القسم : <span className="font-normal">{report.level}</span></span>
                            <span>عدد التلاميذ: <span className="font-normal">{report.studentCount}</span></span>
                        </div>
                        <div className="font-bold mb-1.5">
                            القاعة هل هي صالحة من حيث الإستماع؟ <span className="font-normal">{report.legacyData?.classroomListening}</span>
                        </div>
                        <div className="flex justify-between font-bold mb-1.5">
                            <span>الإضاءة ؟ <span className="font-normal">{report.legacyData?.lighting}</span></span>
                            <span>النظافة ؟ <span className="font-normal">{report.legacyData?.cleanliness}</span></span>
                        </div>
                        <div className="flex justify-between font-bold mb-1.5">
                            <span>التدفئة ؟ <span className="font-normal">{report.legacyData?.heating}</span></span>
                            <span>التهوية؟ <span className="font-normal">{report.legacyData?.ventilation}</span></span>
                        </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="w-full border-b border-black border-dashed my-1"></div>

                    {/* Block 2 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">تحضير الدروس</h3>
                        <div className="font-bold mb-1.5">
                             نوع الدروس : <span className="font-normal">{report.subject}</span>
                        </div>
                        <div className="font-bold mb-1.5">
                             مواضيعها : <span className="font-normal">{report.topic}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="font-bold underline mt-1">التوزيع والوثائق والمعلقات :</div>
                        <div className="min-h-[1.5em] leading-tight font-normal">{report.legacyData?.documentsAndPosters}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold underline">إعداد الدروس :</span>
                        <span className="font-normal">{report.legacyData?.lessonPreparation}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold underline">قيمة الإعداد :</span>
                        <span className="font-normal">{report.legacyData?.preparationValue}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 mt-2">
                             <span className="font-bold underline">السجلات :</span>
                             <span className="font-normal">{report.legacyData?.registers}</span>
                        </div>
                        <div className="font-bold mt-1">هل هي مستعملة حسب التوجيهات التربوية ؟</div>
                        <div className="font-normal mr-4">{report.legacyData?.registersUsed}</div>
                        
                        <div className="font-bold mt-1">هل هي مراقبة من حيث :</div>
                        <div className="flex justify-between pr-4 mt-1 font-bold">
                             <span>البرامج المقررة؟ <span className="font-normal">{report.legacyData?.scheduledPrograms}</span></span>
                             <span>التدرج ؟ <span className="font-normal">{report.legacyData?.progression}</span></span>
                        </div>
                        
                        <div className="font-bold mt-2">الواجبات: <span className="font-normal">{report.legacyData?.duties}</span></div>
                    </div>
                </div>

                {/* LEFT COLUMN */}
                <div className="w-[52%] p-2 flex flex-col justify-between">
                    
                    {/* Block 1 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">إنجاز الدروس :</h3>
                        <div className="font-bold mb-2">
                             المعلومات، قيمتها:
                             <div className="font-normal mt-0.5 min-h-[16px]">{report.legacyData?.informationValue}</div>
                        </div>
                        <div className="font-bold mb-2">
                             هل تسلسلها منطقي ؟ <span className="font-normal">{report.legacyData?.lessonExecution}</span>
                        </div>
                        <div className="font-bold mb-2">
                             هل حققت الدروس أهدافها ؟ <span className="font-normal">{report.legacyData?.objectivesAchieved}</span>
                        </div>
                        <div className="font-bold mb-2 mt-2">
                             <span className="underline">مشاركة التلاميذ:</span>
                             <div className="font-normal mt-0.5">{report.legacyData?.studentParticipation}</div>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-full border-b border-black border-dashed my-1"></div>

                    {/* Block 2 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">التطبيقات</h3>
                        <div className="font-bold mb-2">
                             هل توجد تطبيقات على الدروس ؟ <span className="font-normal">{report.legacyData?.applications}</span>
                        </div>
                        <div className="font-bold mb-2">
                             هل هي مناسبة ؟ <span className="font-normal">{report.legacyData?.applicationsSuitability}</span>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-full border-b border-black border-dashed my-1"></div>

                    {/* Block 3 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">الوسائل التعليمية</h3>
                        <div className="font-bold mb-2">
                             السبورة: <span className="font-normal">{report.legacyData?.boardWork}</span>
                        </div>
                        <div className="font-bold mb-2">
                             الكتاب: <span className="font-normal">متوفر</span>
                        </div>
                        <div className="font-bold mb-2">
                             وسائل أخرى: <span className="font-normal">{report.legacyData?.otherAids}</span>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-full border-b border-black border-dashed my-1"></div>

                    {/* Block 4 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">أعمال التلاميذ :</h3>
                        <div className="font-bold mb-2">
                             دفاتر التلاميذ هل هي مراقبة ؟ <span className="font-normal">{report.legacyData?.notebooksMonitored}</span>
                        </div>
                        <div className="font-bold mb-2">
                             هل يعتني بها التلاميذ ؟ <span className="font-normal">{report.legacyData?.notebooksCare}</span>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-full border-b border-black border-dashed my-1"></div>

                    {/* Block 5 */}
                    <div>
                        <h3 className="font-bold underline text-[12px] mb-2">الفروض المنزلية :</h3>
                        <div className="font-bold mb-2">
                             هل هي كافية ومناسبة ؟ <span className="font-normal">{report.legacyData?.homeworkValue}</span>
                        </div>
                        <div className="font-bold mb-2">
                             هل هي مصححة ؟ <span className="font-normal">{report.legacyData?.homeworkCorrection}</span>
                        </div>
                        <div className="font-bold mb-2">
                             قيمة التصحيح : <span className="font-normal">{report.legacyData?.homeworkValue}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold">2 / 1</div>
        </div>

        {/* --- PAGE 2 (Unchanged) --- */}
        <div className="a4-page flex flex-col">
            
            {/* Box 1: Specific Evaluation */}
            <div className="border-[3px] border-black flex-1 flex flex-col min-h-[140mm]">
                <div className="text-center font-bold py-1 border-b-[3px] border-black bg-gray-100 text-[13px]">
                    تقويم الدروس المشاهدة ( النقد و التوجيه )
                </div>
                <div className="p-4 text-[13px] leading-loose whitespace-pre-line text-justify flex-1 overflow-hidden">
                    {report.generalAssessment}
                </div>
            </div>

            {/* Box 2: General Appreciation */}
            <div className="border-[3px] border-t-0 border-black h-[70mm] flex flex-col shrink-0">
                <div className="text-center font-bold py-1 border-b-[3px] border-black bg-gray-100 text-[13px]">
                    التقدير العام بعد حضور الدروس ، والإطلاع على الملف ومناقشة الأستاذ(ة)
                </div>
                <div className="p-4 text-[13px] leading-loose whitespace-pre-line text-justify flex-1 overflow-hidden">
                    {report.legacyData?.generalAppreciation}
                </div>
            </div>

            {/* Footer / Signatures */}
            <div className="border-[3px] border-t-0 border-black flex h-[45mm] shrink-0">
                {/* Mark */}
                <div className="w-1/2 border-l-[3px] border-black p-2 font-bold text-[13px] flex flex-col justify-center space-y-3 bg-gray-50">
                    <p>العلامة بالحروف: <span className="underline">{report.markInLetters}</span></p>
                    <p>بالأرقام : <span className="text-xl border-2 border-black px-4 py-0.5 bg-white">{report.finalMark}</span> / 20</p>
                    <p className="text-[10px] mt-1 text-center">اطلع عليه المعني بالامر(ة) بتاريخ : ....................</p>
                    <p className="text-center text-[10px]">الإمضاء</p>
                </div>
                
                {/* Inspector Signature */}
                <div className="w-1/2 p-2 font-bold text-[13px] relative flex flex-col items-center">
                     <p className="text-[12px] w-full text-right">تقرير حرره مفتش التعليم الابتدائي للمواد</p>
                     <div className="flex justify-between mt-2 px-1 w-full text-[11px]">
                         <p>السيد: {report.inspectorName}</p>
                         <p>التاريخ: {report.inspectionDate}</p>
                     </div>
                     <div className="text-center mt-auto mb-2 relative w-full h-24 flex justify-center">
                         {signature ? (
                             <div className="absolute inset-0 flex items-center justify-center -top-4">
                                 <img src={signature} alt="Signature" className="max-w-full max-h-full mix-blend-multiply object-contain w-48 h-32" />
                             </div>
                         ) : (
                             <div className="mt-4 text-[8px] text-gray-300 border border-dashed border-gray-300 w-16 h-16 rounded-full flex items-center justify-center rotate-[-15deg]">
                                 الختم
                             </div>
                         )}
                     </div>
                </div>
            </div>
            
            <div className="text-center text-[10px] text-gray-500 font-bold mt-1">2 / 2</div>
        </div>
    </div>
  );
};

export default PrintableLegacyReport;