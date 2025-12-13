
import { LegacyReportOptions } from './types';

export const DEFAULT_LEGACY_DATA: LegacyReportOptions = {
    schoolYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    daira: '',
    municipality: '',
    familyStatus: 'متزوج(ة)',
    maidenName: '',
    trainingInstitute: 'خريج المعهد التكنولوجي',
    trainingDate: '',
    graduationDate: '',
    classroomListening: 'نعم صالحة',
    lighting: 'جيدة',
    heating: 'متوفرة',
    ventilation: 'حسنة',
    cleanliness: 'نظيفة',
    
    lessonPreparation: 'متوفر ومنتظم',
    preparationValue: 'جيدة',
    otherAids: 'استعملت بفعالية',
    boardWork: 'منظمة وواضحة',
    documentsAndPosters: 'متوفرة ومعلقة بعناية',
    
    registers: 'موجودة',
    registersUsed: 'نعم',
    registersMonitored: 'نعم بانتظام',
    
    scheduledPrograms: 'نعم',
    progression: 'محترم',
    duties: 'قائمة',

    lessonExecution: 'متسلسلة ومنطقية',
    informationValue: 'دقيقة ومناسبة للمستوى',
    objectivesAchieved: 'تحققت كلياً',
    studentParticipation: 'فعالة ونشيطة',
    
    applications: 'نعم توجد',
    applicationsSuitability: 'مناسبة وهادفة',
    
    notebooksCare: 'حسنة',
    notebooksMonitored: 'نعم بانتظام',
    homeworkCorrection: 'منتظم ودقيق',
    homeworkValue: 'جيدة',
    
    generalAppreciation: ''
};

// --- LEGACY SEMINAR SUGGESTIONS (New Feature) ---
export const LEGACY_SEMINAR_SUGGESTIONS: Record<string, string[]> = {
    'التخطيط': [ // For weak preparation/planning
        "أهمية الإعداد المادي والتربوي في نجاح الحصة التعلمية",
        "كيفية بناء مذكرة بيداغوجية وظيفية (تجاوز النقل الآلي)",
        "قراءة في المدونة الرسمية للأدوات والسجلات التنظيمية",
        "هندسة التدرج السنوي وآليات تكييفه",
        "دفتر التحضير اليومي: مرآة الأستاذ ووسيلة عمل"
    ],
    'التنفيذ': [ // For weak execution/methodology/objectives
        "الانتقال من التلقين إلى بناء التعلمات (المقاربة بالكفاءات)",
        "تسيير الوقت البيداغوجي وتوزيع مراحل الدرس",
        "آليات تنشيط القسم وإشراك المتعلمين بفعالية",
        "صياغة الأهداف الإجرائية وقياس مدى تحققها",
        "استراتيجيات طرح الأسئلة الصفية لتحفيز التفكير"
    ],
    'التقويم': [ // For weak notebook correction/evaluation
        "التصحيح البيداغوجي للكراسات: من التصويب إلى التوجيه",
        "أهمية التغذية الراجعة في تحسين أداء المتعلم",
        "بناء الاختبارات التحصيلية وفق المعايير العلمية",
        "استغلال الأخطاء الشائعة في بناء حصص المعالجة",
        "دفتر التقييم والمتابعة: دوره وأهميته"
    ],
    'بيئة الصف': [ // For weak board work/cleanliness/environment
        "تقنيات استعمال السبورة وتنظيمها (النمذجة)",
        "تكييف الفضاء الصفي لخدمة العملية التعليمية",
        "الوسائل التعليمية: أهميتها، أنواعها، وكيفية توظيفها",
        "الاعتناء بجمالية القسم وتفعيل الأركان التربوية",
        "قواعد النظام الداخلي للقسم والعلاقة التربوية"
    ]
};

// --- Shared Lists (Copied & Expanded) ---

export const LEGACY_SUBJECTS = [
    "اللغة العربية", "الرياضيات", "التربية الإسلامية", "التربية المدنية", "التربية العلمية", 
    "التاريخ والجغرافيا", "الفرنسية", "الإنكليزية", "التربية التشكيلية", "التربية الموسيقية", "التربية البدنية"
];

export const LEGACY_DEGREES = [
    "خريج(ة) المعهد التكنولوجي",
    "خريج(ة) المدرسة العليا للأساتذة",
    "شهادة الدراسات الجامعية التطبيقية",
    "شهادة الدراسات العليا",
    "ليسانس",
    "ماستر",
    "دكتوراه"
];

export const LEGACY_LEVELS = [
    "التربية التحضيرية",
    "السنة الأولى",
    "السنة الثانية",
    "السنة الثالثة",
    "السنة الرابعة",
    "السنة الخامسة"
];

// --- Specific Legacy Fields Options ---

export const LIST_CLASSROOM_STATUS = [
    "نعم صالحة",
    "غير صالحة (ضيق)",
    "بها صدى يعيق الاستماع",
    "واسعة جداً",
    "تحتاج إلى عزل صوتي"
];

export const LIST_QUALITY_HIGH = ["جيدة", "متوسطة", "مقبولة", "ضعيفة", "منعدمة"];
export const LIST_QUALITY_AVAILABILITY = ["متوفرة", "منعدمة", "ناقصة", "معطلة", "تحتاج صيانة"];
export const LIST_CLEANLINESS = ["نظيفة", "نظيفة جداً", "متوسطة", "ناقصة", "مهملة"];

export const LIST_PREPARATION_STATUS = [
    "متوفر ومنتظم",
    "متوفر وغير منتظم",
    "ناقص",
    "منعدم",
    "شكلي فقط",
    "نقول من مراجع قديمة"
];

export const LIST_PREPARATION_VALUE = [
    "جيدة وتخدم الدرس",
    "متوسطة",
    "مقبولة",
    "ضعيفة ولا تفي بالغرض",
    "ممتازة ومبتكرة"
];

export const LIST_DOCUMENTS = [
    "متوفرة ومعلقة بعناية",
    "متوفرة وغير منظمة",
    "ناقصة (يجب استكمالها)",
    "تحتاج إلى تحيين",
    "ممزقة أو قديمة",
    "مكدسة في الخزانة",
    "منعدمة تماماً"
];

export const LIST_BOARD_WORK = [
    "منظمة وواضحة والخط مقروء",
    "مقبولة",
    "عشوائية وغير منظمة",
    "غير مستغلة جيداً",
    "مكتظة بالمعلومات",
    "استغلال جيد للألوان والمساحة"
];

export const LIST_OTHER_AIDS = [
    "استعملت بفعالية وفي وقتها",
    "متوفرة ولم تستعمل",
    "غير متوفرة",
    "منعدمة",
    "استعملت بشكل مشتت للانتباه",
    "تقليدية جداً"
];

export const LIST_REGISTERS_STATUS = ["موجودة", "ناقصة", "منعدمة", "مهترئة"];
export const LIST_REGISTERS_USED = ["نعم بانتظام", "نعم", "لا", "جزئياً", "نادراً"];
export const LIST_MONITORING = ["نعم بانتظام", "نعم", "بصفة غير منتظمة", "لا", "سطحية"];

export const LIST_PROGRAM_ADHERENCE = ["نعم", "لا", "متأخر", "متقدم جداً"];
export const LIST_PROGRESSION = ["محترم", "غير محترم", "سابق لأوانه", "متأخر عن الرزنامة"];
export const LIST_DUTIES_STATUS = ["قائمة", "منجزة", "غير منجزة", "مهملة", "تؤدى بصفة آلية"];

export const LIST_INFO_VALUE = [
    "دقيقة ومناسبة للمستوى",
    "مقبولة",
    "سطحية",
    "بها أخطاء علمية",
    "غزيرة جداً وتفوق المستوى",
    "غير محينة"
];

export const LIST_LESSON_SEQUENCE = [
    "متسلسلة ومنطقية",
    "مقبولة",
    "عشوائية",
    "مفككة",
    "ينقصها الربط",
    "ممتازة وسلسة"
];

export const LIST_OBJECTIVES = [
    "تحققت كلياً",
    "تحققت جزئياً",
    "لم تتحقق",
    "تحققت عند فئة قليلة",
    "الأهداف المسطرة لا تتناسب مع الحصة"
];

export const LIST_PARTICIPATION = [
    "فعالة ونشيطة وشاملة",
    "متوسطة",
    "ضعيفة ومحتشمة",
    "منعدمة",
    "مقتصرة على النجباء فقط",
    "حماسية لكن غير منظمة"
];

export const LIST_APPLICATIONS = ["نعم توجد", "قليلة", "منعدمة", "كثيرة جداً"];
export const LIST_APPLICATIONS_SUITABILITY = [
    "مناسبة وهادفة وتخدم الكفاءة",
    "مناسبة",
    "غير مناسبة للمستوى",
    "صعبة جداً",
    "سهلة جداً ولا تثير التفكير",
    "منقولة حرفياً من الكتاب"
];

export const LIST_NOTEBOOKS_CARE = [
    "حسنة ونظيفة",
    "متوسطة",
    "سيئة",
    "مقبولة",
    "تفاوت في العناية"
];

export const LIST_HOMEWORK_VALUE = [
    "كافية ومناسبة",
    "قليلة",
    "كثيرة جداً ومرهقة",
    "غير مناسبة",
    "روتينية ولا تحفز"
];

export const LIST_HOMEWORK_CORRECTION = [
    "منتظم ودقيق",
    "سطحي",
    "منعدم",
    "جماعياً فقط",
    "غير موجود"
];
