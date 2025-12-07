
import { AcqSubjectDef } from "../types/acquisitions";

export const YEAR5_HISTORY_DEF: AcqSubjectDef = {
    id: 'history_y5',
    label: 'التاريخ (السنة الخامسة)',
    competencies: [
        {
            id: 'general_history',
            label: 'فهم التحولات في التاريخ العام',
            criteria: [
                { id: 1, label: 'تمييز العصور التاريخية' },
                { id: 2, label: 'إدراك العلاقة بين التحولات الاقتصادية والحركة الاستعمارية' },
                { id: 3, label: 'إبراز انعكاسات الاستعمار الأوروبي الحديث' }
            ]
        },
        {
            id: 'national_history',
            label: 'تأصيل التاريخ الوطني',
            criteria: [
                { id: 1, label: 'إدراك أسباب الاحتلال الفرنسي للجزائر' },
                { id: 2, label: 'استيعاب الإطار الزماني والمكاني للمقاومة وطبيعتها' },
                { id: 3, label: 'فهم اتجاهات النضال السياسي وأساليبه' },
                { id: 4, label: 'استيعاب المراحل الكبرى للثورة التحريرية' }
            ]
        }
    ]
};
