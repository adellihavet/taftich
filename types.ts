
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

export interface InspectorProfile {
    fullName: string;
    wilaya: string;
    district: string;
    signatureUrl?: string;
    showSignature: boolean;
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
    
    visitsMorning: number;
    visitsEvening: number;

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
        year3: number;
        year2: number;
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
    isInteractive?: boolean; // New field for Interactive Mode
}

export interface LibraryLink {
    id: string;
    title: string;
    url: string;
    category: 'legislation' | 'pedagogy' | 'admin' | 'other';
}

// --- MAIL REGISTER TYPES ---
export interface MailRecord {
    id: string;
    type: 'incoming' | 'outgoing';
    year: number;
    number: string; // Can be a number "12" or "بدون رقم"
    date: string;
    correspondent: string; // Sender for Incoming, Recipient for Outgoing
    subject: string;
    notes?: string;
    reference?: string; // Optional reference for incoming mail
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface SystemConfig {
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  systemInstruction?: string;
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
];

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  data?: string;
}

export interface Message {
  role: MessageRole;
  text: string;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: Role | 'user' | 'model';
  text: string;
  content?: string;
  timestamp: number;
  isError?: boolean;
  attachments?: Attachment[];
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
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
  ADMIN_ASSISTANT = 'ADMIN_ASSISTANT',
  BRANDING = 'BRANDING',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}

// --- SUBSCRIPTION TYPES ---
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'manual_pending';
export type PlanType = 'monthly' | 'quarterly' | 'yearly';

export interface UserProfile {
    id: string;
    full_name: string;
    subscription_status: SubscriptionStatus;
    trial_ends_at: string;
    subscription_ends_at?: string;
    plan_type?: PlanType;
    payment_receipt_url?: string;
    email?: string; // Optional helper
}
