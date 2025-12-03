
export type AcquisitionRating = 'A' | 'B' | 'C' | 'D' | null;

// المعيار (أصغر وحدة)
export interface AcqCriterion {
    id: number; // 1, 2, 3... matches the CSV column index logic
    label: string; // نص المعيار (مثلا: القراءة المسترسلة)
}

// الكفاءة (مجموعة معايير)
export interface AcqCompetency {
    id: string; // code, e.g., 'reading_perf'
    label: string; // كفاءة الأداء القرائي
    criteria: AcqCriterion[];
}

// هيكل المادة (يحتوي الكفاءات)
export interface AcqSubjectDef {
    id: string; // 'arabic', 'math'
    label: string; // اللغة العربية
    competencies: AcqCompetency[];
}

// بيانات تلميذ واحد
export interface AcqStudent {
    id: string;
    fullName: string;
    // Map: Competency ID -> Criterion ID -> Rating
    // Example: { 'reading': { 1: 'A', 2: 'B' } }
    results: Record<string, Record<number, AcquisitionRating>>; 
}

// سجل قسم واحد (ملف واحد تم رفعه)
export interface AcqClassRecord {
    id: string;
    schoolName: string; // اسم المدرسة
    className: string; // اسم القسم (مثلا: الثانية أ)
    level: string; // السنة الثانية
    subject: string; // اللغة العربية
    academicYear: string; // 2024/2025
    uploadDate: string;
    students: AcqStudent[];
}

// قاعدة البيانات الكاملة لهذا القسم
export interface AcquisitionsDB {
    records: AcqClassRecord[];
}

// State for the Filters (Lifted to App.tsx)
export interface AcqFilterState {
    scope: 'district' | 'school' | 'class';
    selectedSchool: string;
    selectedLevel: string;
    selectedClass: string;
    selectedSubject: string;
}
