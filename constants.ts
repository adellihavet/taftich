import { ReportData, Teacher, QuarterlyReportData } from './types';
import { DEFAULT_OBSERVATION_TEMPLATE } from './modernConstants';
import { DEFAULT_LEGACY_DATA } from './legacyConstants';

// Re-export everything so other files don't break
export * from './modernConstants';
export * from './legacyConstants';
export * from './tenureConstants';

export const MOCK_TEACHERS: Teacher[] = [];

export const INITIAL_REPORT_STATE: ReportData = {
  id: '',
  teacherId: '',
  reportModel: 'modern',
  inspectionDate: new Date().toISOString().split('T')[0],
  inspectorName: '',
  wilaya: 'الأغواط',
  district: '',
  school: '',
  subject: 'اللغة العربية',
  topic: '',
  duration: '45 دقيقة',
  level: 'السنة الأولى',
  group: 'أ',
  studentCount: 25,
  absentCount: 0,
  observations: JSON.parse(JSON.stringify(DEFAULT_OBSERVATION_TEMPLATE)),
  legacyData: DEFAULT_LEGACY_DATA,
  generalAssessment: '',
  assessmentKeywords: '',
  finalMark: 0,
  markInLetters: ''
};

export const INITIAL_QUARTERLY_REPORT_STATE: QuarterlyReportData = {
    id: '',
    inspectorName: '',
    rank: 'مفتش التعليم الابتدائي',
    district: '',
    wilaya: '',
    term: 'الأول',
    schoolYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    
    startDate: '', // Default empty
    endDate: '',   // Default empty

    teachersTotal: 0,
    teachersTrainee: 0,
    teachersTenure: 0,
    
    visitsInspection: 0,
    visitsTenure: 0,
    visitsTraining: 0,
    visitsTrainingBenefit: 0,
    
    tasksInvestigations: 0,
    tasksSupervision: 0,

    days: { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0 },
    ranks: { stagiere: 0, primary: 0, class1: 0, class2: 0, distinguished: 0, contract: 0 },
    levels: { prep: 0, year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
    subjects: { arabic: 0, math: 0, islamic: 0, history: 0, geo: 0, civics: 0, science: 0, art: 0 }
};