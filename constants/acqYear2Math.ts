import { AcqSubjectDef } from "../types/acquisitions";

export const YEAR2_MATH_DEF: AcqSubjectDef = {
    id: 'math_y2',
    label: 'الرياضيات (السنة الثانية)',
    competencies: [
        {
            id: 'control_numbers',
            label: 'التحكم في نظام العد والحساب',
            criteria: [
                { id: 1, label: 'التحكم في موارد نظام العد العشري (قراءة، كتابة، مقارنة، تفكيك)' },
                { id: 2, label: 'التحكم في عمليتي الجمع والطرح (آلية الحساب)' }
            ]
        },
        {
            id: 'problem_solving',
            label: 'منهجية حل المشكلات الرياضياتية',
            criteria: [
                { id: 1, label: 'فهم المشكلة الرياضياتية (تحديد المعطيات والمطلوب)' },
                { id: 2, label: 'انسجام عناصر الحل (اختيار العملية المناسبة)' },
                { id: 3, label: 'الاستعمال السليم للأدوات الرياضياتية (الإنجاز الصحيح)' },
                { id: 4, label: 'التبليغ الرياضياتي (الصياغة والوحدات)' }
            ]
        }
    ]
};
