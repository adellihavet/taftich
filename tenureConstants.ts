import { TenureReportData } from './types';

export const INITIAL_TENURE_REPORT_STATE: TenureReportData = {
    id: '',
    teacherId: '',
    examDate: new Date().toISOString().split('T')[0],
    wilaya: 'الأغواط',
    district: '',
    school: '',
    city: 'الأغواط',
    inspectorName: '',
    directorName: '',
    teacherMemberName: '',
    appointmentDecisionNumber: '',
    appointmentDecisionDate: '',
    financialVisaNumber: '',
    financialVisaDate: '',
    contestDate: '',
    recruitmentType: '',
    university: '', 
    lessons: [
        {
            id: 'l1', order: 1, subject: 'اللغة العربية', topic: '', level: 'السنة الأولى', timeStart: '08:00', timeEnd: '08:45',
            phaseLaunch: '', phaseConstruction: '', phaseInvestment: ''
        },
        {
            id: 'l2', order: 2, subject: 'الرياضيات', topic: '', level: 'السنة الأولى', timeStart: '09:00', timeEnd: '09:45',
            phaseLaunch: '', phaseConstruction: '', phaseInvestment: ''
        },
        {
            id: 'l3', order: 3, subject: 'نشاط إيقاظي', topic: '', level: 'السنة الأولى', timeStart: '10:00', timeEnd: '10:45',
            phaseLaunch: '', phaseConstruction: '', phaseInvestment: ''
        }
    ],
    oralQuestions: {
        educationScience: '',
        psychology: '',
        legislation: ''
    },
    pedagogyMark: 0, 
    oralMark: 0, 
    totalMark: 0, 
    finalDecision: 'confirmed',
    culturalValue: 'ممتازة',
    pedagogicalValue: 'ممتازة'
};