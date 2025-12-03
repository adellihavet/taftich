
export interface Teacher {
  id: string;
  fullName: string;
  birthDate: string;
  birthPlace: string;
  degree: string;
  degreeDate?: string; 
  recruitmentDate: string; 
  currentRankDate?: string; 
  rank: string;
  echelon?: string; 
  echelonDate?: string; 
  lastInspectionDate: string;
  lastMark: number;
  status: 'stagiere' | 'contractuel' | 'titulaire';
  tenureDate?: string; // New field for Tenure Date as requested
}

export interface ObservationItem {
  id: string;
  category: string; 
  criteria: string; 
  indicators: string[]; 
  score: 2 | 1 | 0 | null; 
  improvementNotes: string;
}

export interface ReportData {
  id: string;
  teacherId: string;
  reportModel: 'modern' | 'legacy'; 
  inspectionDate: string;
  inspectorName?: string; 
  
  wilaya: string;
  district: string;
  school: string;

  subject: string;
  topic: string;
  duration: string;
  level: string; 
  group: string;
  studentCount: number;
  absentCount: number;
  
  observations: ObservationItem[];
  
  legacyData?: LegacyReportOptions;

  generalAssessment: string; 
  assessmentKeywords?: string; 
  finalMark: number;
  markInLetters: string;
}

export interface LegacyReportOptions {
    schoolYear: string;
    daira: string;
    municipality: string;

    familyStatus: string;
    maidenName?: string; // اللقب الأصلي (للمتزوجات)
    trainingInstitute: string; 
    trainingDate: string; 
    graduationDate: string; 
    
    classroomListening: string; 
    lighting: string;
    heating: string;
    ventilation: string;
    cleanliness: string;
    
    lessonPreparation: string; 
    preparationValue: string; 
    otherAids: string; 
    boardWork: string; 
    documentsAndPosters: string; 
    
    registers: string; 
    registersUsed: string; 
    registersMonitored: string; 
    
    // New Fields matching the document strict structure
    scheduledPrograms: string; // البرامج المقررة
    progression: string;       // التدرج
    duties: string;            // الواجبات

    lessonExecution: string; 
    informationValue: string; 
    objectivesAchieved: string; 
    studentParticipation: string; 
    applications: string; 
    applicationsSuitability: string; 

    notebooksCare: string; 
    notebooksMonitored: string; 
    homeworkCorrection: string; 
    homeworkValue: string; 
    
    generalAppreciation: string; 
}

export interface TenureLesson {
    id: string;
    order: 1 | 2 | 3;
    subject: string;
    topic: string;
    level: string;
    timeStart: string;
    timeEnd: string;
    phaseLaunch: string; 
    phaseConstruction: string; 
    phaseInvestment: string; 
}

export interface OralQuestions {
    educationScience: string;
    psychology: string;
    legislation: string;
}

export interface TenureReportData {
    id: string;
    teacherId: string;
    examDate: string;
    
    wilaya: string;
    district: string;
    school: string; 
    city: string; 

    inspectorName: string; 
    directorName: string; 
    teacherMemberName: string; 

    appointmentDecisionNumber: string; 
    appointmentDecisionDate: string;
    financialVisaNumber: string; 
    financialVisaDate: string;
    
    contestDate: string; 
    recruitmentType: string;
    university: string; // Added field for University/Institute

    lessons: TenureLesson[];

    oralQuestions: OralQuestions; // Changed from string to object
    
    pedagogyMark: number; 
    oralMark: number; 
    totalMark: number; 
    
    finalDecision: 'confirmed' | 'deferred' | 'failed'; 
    culturalValue: string; 
    pedagogicalValue: string; 
}

export interface QuarterlyReportData {
    id: string;
    inspectorName: string;
    rank: string;
    district: string;
    wilaya: string;
    term: string;
    schoolYear: string;
    
    startDate: string; // New: Start of the quarter
    endDate: string;   // New: End of the quarter

    // Table 1: Stats & Activities
    teachersTotal: number;
    teachersTrainee: number;
    teachersTenure: number; // Candidates (Manual)
    
    visitsInspection: number; // Auto
    visitsTenure: number;     // Auto
    visitsTraining: number;   // Manual
    visitsTrainingBenefit: number; // Manual
    
    tasksInvestigations: number; // Manual
    tasksSupervision: number;    // Manual

    // Table 2: Days (Auto)
    days: {
        sun: number;
        mon: number;
        tue: number;
        wed: number;
        thu: number;
    };

    // Table 3: Ranks (Auto)
    ranks: {
        stagiere: number;
        primary: number;
        class1: number;
        class2: number;
        distinguished: number;
        contract: number;
    };

    // Table 4: Levels (Auto)
    levels: {
        prep: number;
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
    };

    // Table 5: Subjects (Auto)
    subjects: {
        arabic: number;
        math: number;
        islamic: number;
        historyGeo: number;
        civics: number;
        science: number;
        music: number;
        art: number;
    };
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  LEGACY_EDITOR = 'LEGACY_EDITOR',
  PRINT = 'PRINT',
  DATABASE = 'DATABASE',
  PROMOTIONS = 'PROMOTIONS',
  TENURE_EDITOR = 'TENURE_EDITOR',
  QUARTERLY_REPORT = 'QUARTERLY_REPORT',
  ACQUISITIONS = 'ACQUISITIONS'
}
