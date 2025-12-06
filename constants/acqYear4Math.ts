
import { AcqSubjectDef } from "../types/acquisitions";

export const YEAR4_MATH_DEF: AcqSubjectDef = {
    id: 'math_y4',
    label: 'الرياضيات (السنة الرابعة)',
    competencies: [
        {
            id: 'control_resources',
            label: 'التحكم في موارد مختلف الميادين',
            criteria: [
                { id: 1, label: 'الأعداد (< 1,000,000)، الأعداد العشرية، الكسور والحساب' },
                { id: 2, label: 'الفضاء والهندسة (وحدات القياس، الأشكال، المساحة والمحيط)' },
                { id: 3, label: 'تنظيم المعطيات والتناسبية (الخواص الخطية)' }
            ]
        },
        {
            id: 'methodological_solving',
            label: 'الكفاءة المنهجية لحل المشكلات',
            criteria: [
                { id: 1, label: 'فهم المشكلة (تحديد المعطيات والمطلوب)' },
                { id: 2, label: 'انسجام عناصر الحل (اختيار الخوارزمية المناسبة)' },
                { id: 3, label: 'الاستعمال السليم للأدوات (صحة الحساب والنتائج)' },
                { id: 4, label: 'التبليغ الرياضياتي (الوحدات، التنظيم، الجواب)' }
            ]
        }
    ]
};
