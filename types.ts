
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
  tenureDate?: string; 
  privateNotes?: string;
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
    maidenName?: string; 
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
    
    scheduledPrograms: string; 
    progression: string;       
    duties: string;            

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
    university: string; 

    lessons: TenureLesson[];

    oralQuestions: OralQuestions; 
    
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
    
    startDate: string; 
    endDate: string;   

    teachersTotal: number;
    teachersTrainee: number;
    teachersTenure: number; 
    
    visitsInspection: number; 
    visitsTenure: number;     
    visitsTraining: number;   
    visitsTrainingBenefit: number; 
    
    tasksInvestigations: number; 
    tasksSupervision: number;    

    days: {
        sun: number;
        mon: number;
        tue: number;
        wed: number;
        thu: number;
    };

    ranks: {
        stagiere: number;
        primary: number;
        class1: number;
        class2: number;
        distinguished: number;
        contract: number;
    };

    levels: {
        prep: number;
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
    };

    subjects: {
        arabic: number;
        math: number;
        islamic: number;
        history: number;
        geo: number;
        civics: number;
        science: number;
        art: number;
    };
}

export interface SeminarEvent {
    id: string;
    topic: string;
    date: string;
    location: string;
    isExternalLocation: boolean; // true if manual input
    duration: string;
    targetLevels: string[];
    supervisor: string;
    notes: string;
}

export interface LibraryLink {
    id: string;
    title: string;
    url: string;
    category: 'legislation' | 'pedagogy' | 'admin' | 'other';
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
  ACQUISITIONS = 'ACQUISITIONS',
  SEMINARS = 'SEMINARS',
  ADMIN_ASSISTANT = 'ADMIN_ASSISTANT'
}