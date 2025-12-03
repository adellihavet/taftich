
import { AcqSubjectDef } from "../types/acquisitions";

export const YEAR2_ARABIC_DEF: AcqSubjectDef = {
    id: 'arabic_y2',
    label: 'اللغة العربية (السنة الثانية)',
    competencies: [
        {
            id: 'reading_performance',
            label: 'كفاءة الأداء القرائي',
            criteria: [
                { id: 1, label: 'الالتزام بالعادات القرائية الحسنة' },
                { id: 2, label: 'فك ترميز الكلمات (التهجئة السليمة)' },
                { id: 3, label: 'قراءة وحدات لغوية كاملة (الاسترسال والنطق السليم)' }
            ]
        },
        {
            id: 'written_comprehension',
            label: 'كفاءة فهم المكتوب',
            criteria: [
                { id: 1, label: 'فهم المعاني الصريحة في النص' },
                { id: 2, label: 'فهم تسلسل فكر أو الأحداث الواردة في النص' },
                { id: 3, label: 'فهم معاني الكلمات الواردة في النص (رصيد لغوي)' },
                { id: 4, label: 'التحكم في تطبيقات مهارات الوعي الصوتي' },
                { id: 5, label: 'الرسم الإملائي لجمل (الإملاء)' }
            ]
        }
    ]
};
