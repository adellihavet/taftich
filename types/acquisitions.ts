
export type AcquisitionRating = 'A' | 'B' | 'C' | 'D' | null;

// المعيار (أصغر وحدة)
export interface AcqCriterion {
    id: number; 
    label: string; 
}

// الكفاءة (مجموعة معايير)
export interface AcqCompetency {
    id: string; 
    label: string; 
    criteria: AcqCriterion[];
}

// هيكل المادة (يحتوي الكفاءات)
export interface AcqSubjectDef {
    id: string; 
    label: string; 
    competencies: AcqCompetency[];
}

// بيانات تلميذ واحد (النظام التفصيلي)
export interface AcqStudent {
    id: string;
    fullName: string;
    // Map: Competency ID -> Criterion ID -> Rating
    results: Record<string, Record<number, AcquisitionRating>>; 
}

// سجل قسم واحد (ملف واحد تم رفعه - تفصيلي)
export interface AcqClassRecord {
    id: string;
    schoolName: string;
    className: string;
    level: string; 
    subject: string; 
    academicYear: string; 
    uploadDate: string;
    students: AcqStudent[];
}

// --- GLOBAL GRID TYPES ---

// بيانات تلميذ في الشبكة الإجمالية
export interface AcqGlobalStudent {
    id: string; // Unique System ID (UUID)
    number: number; // Original Number from Excel (1, 2, 1, 2...)
    // Map: Subject Name -> Grade
    subjects: Record<string, AcquisitionRating>;
}

// سجل الشبكة الإجمالية (لمدرسة كاملة)
export interface AcqGlobalRecord {
    id: string;
    schoolName: string;
    uploadDate: string;
    academicYear: string;
    totalStudents: number;
    students: AcqGlobalStudent[];
}

export interface AcquisitionsDB {
    records: AcqClassRecord[];
}

export interface AcquisitionsGlobalDB {
    records: AcqGlobalRecord[];
}

export interface AcqFilterState {
    scope: 'district' | 'school' | 'class';
    selectedSchool: string;
    selectedLevel: string;
    selectedClass: string;
    selectedSubject: string;
}
