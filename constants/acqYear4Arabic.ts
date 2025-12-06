
import { AcqSubjectDef } from "../types/acquisitions";

export const YEAR4_ARABIC_DEF: AcqSubjectDef = {
    id: 'arabic_y4',
    label: 'اللغة العربية (السنة الرابعة)',
    competencies: [
        {
            id: 'oral_comms',
            label: 'فهم الخطاب والتواصل الشفوي',
            criteria: [
                { id: 1, label: 'الالتزام بآداب الاستماع والتحدث' },
                { id: 2, label: 'إدراك موضوع الخطاب وفكرته الأساسية' },
                { id: 3, label: 'التجاوب مع التعليمات' },
                { id: 4, label: 'الاسترسال وسالمة لغة التواصل' },
                { id: 5, label: 'توظيف الدلالات اللفظية وغير اللفظية' }
            ]
        },
        {
            id: 'reading_perf',
            label: 'كفاءة الأداء القرائي',
            criteria: [
                { id: 1, label: 'العادات القرائية الحسنة' },
                { id: 2, label: 'قراءة مسترسلة لوحدات لغوية كاملة' },
                { id: 3, label: 'قراءة معبرة عن المعاني' },
                { id: 4, label: 'احترام زمن الإنجاز (مدة القراءة)' }
            ]
        },
        {
            id: 'written_comp',
            label: 'كفاءة فهم المكتوب',
            criteria: [
                { id: 1, label: 'توظيف الحصيلة اللغوية' },
                { id: 2, label: 'التحليل النحوي لجملة' },
                { id: 3, label: 'التحويل الصرفي لفقرة' },
                { id: 4, label: 'تشكيل فقرة أو تصحيحها' },
                { id: 5, label: 'الرسم الإملائي لفقرة' }
            ]
        },
        {
            id: 'written_prod',
            label: 'كفاءة الإنتاج الكتابي',
            criteria: [
                { id: 1, label: 'احترام التعليمة والمهمات المرفقة' },
                { id: 2, label: 'ترابط الأفكار وتسلسلها' },
                { id: 3, label: 'الالتزام بقواعد اللغة' },
                { id: 4, label: 'إدراج قيمة أو تحديد موقف أو إبداء رأي' },
                { id: 5, label: 'جودة المنتج' }
            ]
        }
    ]
};
