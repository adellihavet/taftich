
import React, { useState, useEffect, useMemo, useRef } from 'react';
import TeacherList from './components/TeacherList';
import ReportEditor from './components/ReportEditor';
import TenureReportEditor from './components/TenureReportEditor';
import LegacyReportEditor from './components/LegacyReportEditor';
import PrintableReport from './components/PrintableReport';
import PrintableTenureReport from './components/PrintableTenureReport';
import PrintableLegacyReport from './components/PrintableLegacyReport';
import QuarterlyReportEditor from './components/QuarterlyReportEditor';
import PrintableQuarterlyReport from './components/PrintableQuarterlyReport';
import UpgradeModal from './components/UpgradeModal';
import DatabaseManager from './components/DatabaseManager';
import DashboardStats from './components/DashboardStats';
import PromotionList from './components/PromotionList';
import TeacherDrawer from './components/TeacherDrawer';
import AcqManager from './components/Acquisitions/AcqManager';
import SeminarsManager from './components/SeminarsManager';
import AdministrativeAssistant from './components/AdministrativeAssistant'; 
import BrandingKit from './components/BrandingKit';
import Auth from './components/Auth';
import AdminDashboard from './components/Admin/AdminDashboard';
import OnboardingModal from './components/OnboardingModal';
import SettingsModal from './components/SettingsModal';
import { supabase, isSupabaseConfigured, fetchScriptUrlFromCloud } from './services/supabaseService';
import { Teacher, ReportData, TenureReportData, QuarterlyReportData, AppView, InspectorProfile } from './types';
import { AcqFilterState } from './types/acquisitions';
import { MOCK_TEACHERS, INITIAL_REPORT_STATE, INITIAL_TENURE_REPORT_STATE, INITIAL_QUARTERLY_REPORT_STATE } from './constants';
import { Database, LayoutDashboard, ArrowUpCircle, LogOut, UserCircle2, Hexagon, PieChart, Cloud, RefreshCcw, AlertCircle, BarChart2, Presentation, Briefcase, Menu, X, Users, BarChart3, Image as ImageIcon, Crown, Clock, ShieldAlert, Settings } from 'lucide-react';
import { syncWithScript, readFromScript } from './services/sheetsService';
import { generateDatabaseRows, parseDatabaseRows } from './utils/sheetHelper';
import { getAcqDB } from './services/acqStorage';
import { usePermissions } from './hooks/usePermissions';

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- CONFIG: ADMIN EMAILS ---
const ADMIN_EMAILS = ['dellihakamal@gmail.com', 'mufattish.admin@education.dz']; 

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // --- PERMISSIONS HOOK (SYSTEM GUARD) ---
  const { 
      isGold, isTrial, isActive, status: subStatus, daysLeft, 
      canPrint, refetch: refetchProfile 
  } = usePermissions();

  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Mobile Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- PERSISTENCE: View & Selection ---
  const [view, setView] = useState<AppView>(() => {
      return (localStorage.getItem('mufattish_last_view') as AppView) || AppView.DASHBOARD;
  });
  
  const [dashboardTab, setDashboardTab] = useState<'stats' | 'list'>('stats');
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
      return localStorage.getItem('mufattish_last_teacher_id') || '';
  });
  
  const [previewTeacher, setPreviewTeacher] = useState<Teacher | null>(null);
  
  // INSPECTOR PROFILE STATE
  const [inspectorProfile, setInspectorProfile] = useState<InspectorProfile>({
      fullName: '',
      wilaya: '',
      district: '',
      showSignature: true
  });

  const [currentReport, setCurrentReport] = useState<ReportData>(INITIAL_REPORT_STATE);
  const [reportsMap, setReportsMap] = useState<Record<string, ReportData>>({});

  const [currentTenureReport, setCurrentTenureReport] = useState<TenureReportData>(INITIAL_TENURE_REPORT_STATE);
  const [tenureReportsMap, setTenureReportsMap] = useState<Record<string, TenureReportData>>({});

  const [currentQuarterlyReport, setCurrentQuarterlyReport] = useState<QuarterlyReportData>(INITIAL_QUARTERLY_REPORT_STATE);
  
  const [acqFilters, setAcqFilters] = useState<AcqFilterState>({
      scope: 'district',
      selectedSchool: '',
      selectedLevel: '',
      selectedClass: '',
      selectedSubject: ''
  });
  
  const [acqRefreshKey, setAcqRefreshKey] = useState(0); 

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => localStorage.getItem('mufattish_auto_sync') === 'true');
  const isFirstMount = useRef(true);

  const [filterSchool, setFilterSchool] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  
  // --- New State for Linking Dashboard to Seminars ---
  const [pendingSeminarTopic, setPendingSeminarTopic] = useState<string | null>(null);

  // Load Inspector Profile from LS
  useEffect(() => {
      const savedProfile = localStorage.getItem('mufattish_inspector_profile');
      if (savedProfile) {
          try {
              setInspectorProfile(JSON.parse(savedProfile));
          } catch (e) {
              setShowOnboarding(true);
          }
      } else {
          setShowOnboarding(true);
      }
  }, []);

  const handleSaveProfile = (profile: InspectorProfile) => {
      setInspectorProfile(profile);
      localStorage.setItem('mufattish_inspector_profile', JSON.stringify(profile));
      setShowOnboarding(false);
  };

  const derivedGlobalData = useMemo(() => {
      let d = inspectorProfile.district || currentReport.district;
      let w = inspectorProfile.wilaya || currentReport.wilaya;
      
      if (!d || d.trim() === '') {
          const reportWithDistrict = Object.values(reportsMap).find((r: ReportData) => r.district && r.district.trim() !== '');
          if (reportWithDistrict) d = reportWithDistrict.district;
      }
      if (!w || w === 'الأغواط') {
          const reportWithWilaya = Object.values(reportsMap).find((r: ReportData) => r.wilaya && r.wilaya.trim() !== '' && r.wilaya !== 'الأغواط');
          if (reportWithWilaya) w = reportWithWilaya.wilaya;
      }
      return { district: d || '', wilaya: w || 'الأغواط' };
  }, [currentReport, reportsMap, inspectorProfile]);

  // Check Admin Status
  const isAdmin = useMemo(() => {
      if (!session || !session.user || !session.user.email) return false;
      return ADMIN_EMAILS.includes(session.user.email);
  }, [session]);

  const availableSchools = useMemo(() => {
      const schools = new Set<string>();
      Object.values(reportsMap).forEach((r: ReportData) => { if(r.school) schools.add(r.school.trim()); });
      return Array.from(schools).sort();
  }, [reportsMap]);

  const acqAvailableSchools = useMemo(() => {
      const schools = new Set<string>();
      const db = getAcqDB();
      db.records.forEach(r => schools.add(r.schoolName));
      Object.values(reportsMap).forEach((r: ReportData) => { 
          if(r.school && r.school.trim() !== '') {
              schools.add(r.school.trim()); 
          }
      });
      return Array.from(schools).sort();
  }, [acqRefreshKey, view, reportsMap]); 

  const availableLevels = useMemo(() => {
      const levels = new Set<string>();
      Object.values(reportsMap).forEach((r: ReportData) => { if(r.level) levels.add(r.level.trim()); });
      return Array.from(levels).sort();
  }, [reportsMap]);

  const filteredTeachers = useMemo(() => {
      return teachers.filter(t => {
          const report = reportsMap[t.id];
          if (filterSchool && (!report || report.school.trim() !== filterSchool)) return false;
          if (filterLevel && (!report || report.level.trim() !== filterLevel)) return false;
          return true;
      });
  }, [teachers, reportsMap, filterSchool, filterLevel]);

  // Sync Inspection Data to Teacher List
  useEffect(() => {
      const today = new Date();
      let updatedCount = 0;
      const newTeachers = teachers.map(t => {
          const report = reportsMap[t.id];
          if (report && report.inspectionDate && report.finalMark > 0) {
              const reportDate = new Date(report.inspectionDate);
              if (!isNaN(reportDate.getTime())) {
                  const diffTime = today.getTime() - reportDate.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  if (diffDays > 15 && t.lastInspectionDate !== report.inspectionDate) {
                      updatedCount++;
                      return {
                          ...t,
                          lastInspectionDate: report.inspectionDate,
                          lastMark: report.finalMark
                      };
                  }
              }
          }
          return t;
      });
      if (updatedCount > 0) {
          setTeachers(newTeachers);
      }
  }, [reportsMap]); 

  // Auth & Cloud Script Sync
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingSession(false);
            if (session?.user && typeof fetchScriptUrlFromCloud === 'function') {
                fetchScriptUrlFromCloud().then(url => {
                    if (url) {
                        localStorage.setItem('mufattish_script_url', url);
                        setIsGoogleConnected(true);
                    }
                });
            }
        }).catch((err: any) => {
            console.error("Session check failed:", err);
            setLoadingSession(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setSession(session);
            setLoadingSession(false);
        });

        return () => subscription.unsubscribe();
    } else {
        setLoadingSession(false);
    }
  }, []);

  // Local Storage Restoration
  useEffect(() => {
    const savedTeachers = localStorage.getItem('mufattish_teachers');
    const savedReports = localStorage.getItem('mufattish_reports_map'); 
    const savedTenureReports = localStorage.getItem('mufattish_tenure_reports_map');
    const savedQuarterlyReport = localStorage.getItem('mufattish_quarterly_report');

    if (savedTeachers) try { setTeachers(JSON.parse(savedTeachers)); } catch(e) {}
    if (savedReports) try { setReportsMap(JSON.parse(savedReports)); } catch(e) {}
    if (savedTenureReports) try { setTenureReportsMap(JSON.parse(savedTenureReports)); } catch(e) {}
    if (savedQuarterlyReport) try { setCurrentQuarterlyReport(JSON.parse(savedQuarterlyReport)); } catch(e) {}

    const scriptUrl = localStorage.getItem('mufattish_script_url');
    if (scriptUrl) {
        setIsGoogleConnected(true);
        if (!savedTeachers || savedTeachers === '[]') {
            setSyncStatus('syncing');
            setSyncMessage('جاري استرجاع البيانات تلقائياً...');
            readFromScript(scriptUrl).then(data => {
                if (Array.isArray(data)) {
                    const { teachers: newTeachers, reportsMap: parsedReports } = parseDatabaseRows(data);
                    if (newTeachers.length > 0) {
                        setTeachers(newTeachers);
                        setReportsMap(parsedReports);
                        setSyncStatus('success');
                        setSyncMessage('تم استرجاع البيانات');
                        setTimeout(() => setSyncStatus('idle'), 3000);
                    } else {
                        setSyncStatus('idle');
                    }
                }
            }).catch(err => {
                setSyncStatus('error');
                setSyncMessage('فشل الاسترجاع التلقائي');
            });
        }
    }
  }, []);

  // Persist State
  useEffect(() => { localStorage.setItem('mufattish_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('mufattish_reports_map', JSON.stringify(reportsMap)); }, [reportsMap]);
  useEffect(() => { localStorage.setItem('mufattish_tenure_reports_map', JSON.stringify(tenureReportsMap)); }, [tenureReportsMap]);
  useEffect(() => { localStorage.setItem('mufattish_quarterly_report', JSON.stringify(currentQuarterlyReport)); }, [currentQuarterlyReport]);
  useEffect(() => { if (view) localStorage.setItem('mufattish_last_view', view); }, [view]);
  useEffect(() => { localStorage.setItem('mufattish_last_teacher_id', selectedTeacherId); }, [selectedTeacherId]);

  // Auto Sync Logic
  useEffect(() => {
      if (isFirstMount.current) {
          isFirstMount.current = false;
          return;
      }
      if (!autoSyncEnabled || !isGoogleConnected || teachers.length === 0) return;
      const scriptUrl = localStorage.getItem('mufattish_script_url');
      if (!scriptUrl) return;
      setSyncStatus('syncing');
      const timer = setTimeout(async () => {
          try {
              if (teachers.length === 0) {
                  setSyncStatus('idle');
                  return;
              }
              const data = generateDatabaseRows(teachers, currentReport, reportsMap, inspectorProfile);
              await syncWithScript(scriptUrl, data, 'SYNC_MAIN');
              setSyncStatus('success');
              setSyncMessage('تم الحفظ في Google Sheets');
              setTimeout(() => setSyncStatus('idle'), 3000);
          } catch (error: any) {
              setSyncStatus('error');
              setSyncMessage('فشل المزامنة - يرجى الحفظ يدوياً');
          }
      }, 5000);
      return () => clearTimeout(timer);
  }, [teachers, reportsMap, tenureReportsMap, autoSyncEnabled, isGoogleConnected, inspectorProfile]);

  // Handlers
  const handleSelectTeacher = (teacher: Teacher) => {
    setPreviewTeacher(teacher);
  };

  const handleLogout = async () => {
      if (supabase) {
          await supabase.auth.signOut();
          setSession(null);
      }
  };

  const initReport = (teacher: Teacher, type: 'modern' | 'legacy') => {
      setPreviewTeacher(null);
      setSelectedTeacherId(teacher.id);
      if (reportsMap[teacher.id]) {
          const existing = reportsMap[teacher.id];
          setCurrentReport({ 
              ...existing, 
              reportModel: type,
              inspectorName: existing.inspectorName || inspectorProfile.fullName
          });
      } else {
          const newReport = {
              ...INITIAL_REPORT_STATE,
              id: generateId(),
              teacherId: teacher.id,
              reportModel: type,
              wilaya: currentReport.wilaya || inspectorProfile.wilaya || derivedGlobalData.wilaya,
              school: currentReport.school || '',
              district: currentReport.district || inspectorProfile.district || derivedGlobalData.district,
              inspectorName: inspectorProfile.fullName
          };
          setCurrentReport(newReport);
          setReportsMap(prev => ({ ...prev, [teacher.id]: newReport }));
      }
  };

  const handleStartInspection = (teacher: Teacher) => {
      initReport(teacher, 'modern');
      setView(AppView.EDITOR);
  };

  const handleStartLegacyInspection = (teacher: Teacher) => {
      initReport(teacher, 'legacy');
      setView(AppView.LEGACY_EDITOR);
  };

  const handleStartTenure = (teacher: Teacher) => {
      setPreviewTeacher(null);
      setSelectedTeacherId(teacher.id);
      if (tenureReportsMap[teacher.id]) {
          const existing = tenureReportsMap[teacher.id];
           setCurrentTenureReport({
              ...existing,
              inspectorName: existing.inspectorName || inspectorProfile.fullName
           });
      } else {
          const newTenure = {
              ...INITIAL_TENURE_REPORT_STATE,
              id: generateId(),
              teacherId: teacher.id,
              wilaya: currentReport.wilaya || inspectorProfile.wilaya || derivedGlobalData.wilaya, 
              district: currentReport.district || inspectorProfile.district || derivedGlobalData.district, 
              school: currentReport.school || '',
              inspectorName: inspectorProfile.fullName
          };
          setCurrentTenureReport(newTenure);
          setTenureReportsMap(prev => ({...prev, [teacher.id]: newTenure}));
      }
      setView(AppView.TENURE_EDITOR);
  };

  const handleOpenQuarterlyReport = () => {
      setCurrentQuarterlyReport(prev => ({
          ...prev,
          inspectorName: inspectorProfile.fullName, 
          wilaya: inspectorProfile.wilaya || derivedGlobalData.wilaya, 
          district: inspectorProfile.district || derivedGlobalData.district, 
          teachersTotal: teachers.length,
          teachersTrainee: teachers.filter(t => t.status === 'stagiere').length,
      }));
      setView(AppView.QUARTERLY_REPORT);
  };
  
  const handleReportChange = (newReport: ReportData) => {
      setCurrentReport(newReport);
      setReportsMap(prev => ({ ...prev, [newReport.teacherId]: newReport }));
  };

  const handleTenureReportChange = (newReport: TenureReportData) => {
      setCurrentTenureReport(newReport);
      setTenureReportsMap(prev => ({ ...prev, [newReport.teacherId]: newReport }));
  };
  
  const handleQuarterlyReportChange = (newReport: QuarterlyReportData) => {
      setCurrentQuarterlyReport(newReport);
  };

  const handleTeacherUpdate = (updatedTeacher: Teacher) => {
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
      if (previewTeacher && previewTeacher.id === updatedTeacher.id) {
          setPreviewTeacher(updatedTeacher);
      }
  };

  const handleDeleteTeacher = async (id: string) => {
      if (window.confirm("هل أنت متأكد من حذف هذا الأستاذ؟ سيتم حذف جميع تقاريره (تفتيش وتثبيت).")) {
          setTeachers(prev => prev.filter(t => t.id !== id));
          
          // CRITICAL FIX: Clean up ALL reports associated with this teacher
          const newReports = { ...reportsMap };
          delete newReports[id];
          setReportsMap(newReports);

          const newTenureReports = { ...tenureReportsMap };
          delete newTenureReports[id];
          setTenureReportsMap(newTenureReports);
          
          if (selectedTeacherId === id) {
              setSelectedTeacherId('');
              if (view !== AppView.DATABASE && view !== AppView.PROMOTIONS && view !== AppView.QUARTERLY_REPORT) setView(AppView.DASHBOARD);
          }
      }
  };

  const handlePrint = () => {
      if (selectedTeacherId) {
          const t = teachers.find(t => t.id === selectedTeacherId);
          if (t) {
              document.title = `تقرير_${t.fullName.replace(/\s/g, '_')}`;
          }
      }
      window.print();
  };

  const handleAddNewTeacher = () => {
    const name = prompt("أدخل اسم المعلم الجديد:");
    if (name) {
        const newTeacher: Teacher = {
            id: generateId(),
            fullName: name,
            birthDate: '', birthPlace: '', degree: 'ليسانس', recruitmentDate: new Date().toISOString().split('T')[0],
            rank: 'أستاذ المدرسة الابتدائية', lastInspectionDate: '', lastMark: 10, status: 'titulaire'
        };
        setTeachers([...teachers, newTeacher]);
        handleSelectTeacher(newTeacher);
    }
  };

  const handleFullImport = async (importedTeachers: Teacher[], importedReports: Record<string, ReportData>) => {
      const newTeachers = [...teachers];
      const newReportsMap = { ...reportsMap };
      const defaultWilaya = inspectorProfile.wilaya || currentReport.wilaya || derivedGlobalData.wilaya; 
      const defaultDistrict = inspectorProfile.district || currentReport.district || derivedGlobalData.district;

      importedTeachers.forEach(t => {
          const normalizedImportName = t.fullName.trim().toLowerCase();
          
          // SMART MATCH: Match by Name AND BirthDate (if available) to avoid collisions
          const existingTeacherIdx = newTeachers.findIndex(existing => {
              const nameMatch = existing.fullName.trim().toLowerCase() === normalizedImportName;
              // If both have birthdates, check them. If one is missing, rely on name but warn in console.
              if (nameMatch && t.birthDate && existing.birthDate) {
                  return t.birthDate === existing.birthDate;
              }
              return nameMatch;
          });

          if (existingTeacherIdx >= 0) {
              // Update existing
              const existingTeacher = newTeachers[existingTeacherIdx];
              newTeachers[existingTeacherIdx] = { ...existingTeacher, ...t }; 
              const importedReport = importedReports[t.id];
              if (importedReport) {
                  const existingReport = newReportsMap[existingTeacher.id] || { ...INITIAL_REPORT_STATE, id: generateId(), teacherId: existingTeacher.id };
                  newReportsMap[existingTeacher.id] = { ...existingReport, ...importedReport, wilaya: existingReport.wilaya || defaultWilaya, district: existingReport.district || defaultDistrict };
              }
          } else {
              // Add new
              newTeachers.push(t);
              const importedReport = importedReports[t.id];
              if (importedReport) {
                  newReportsMap[t.id] = { ...importedReport, wilaya: defaultWilaya, district: defaultDistrict };
              } else {
                  newReportsMap[t.id] = { ...INITIAL_REPORT_STATE, id: generateId(), teacherId: t.id, wilaya: defaultWilaya, district: defaultDistrict };
              }
          }
      });
      
      setTeachers(newTeachers);
      setReportsMap(newReportsMap);
      
      const scriptUrl = localStorage.getItem('mufattish_script_url');
      if (scriptUrl) {
          setSyncStatus('syncing');
          setSyncMessage('جاري إرسال البيانات الجديدة إلى Google Sheet...');
          try {
              const data = generateDatabaseRows(newTeachers, currentReport, newReportsMap, inspectorProfile);
              await syncWithScript(scriptUrl, data, 'SYNC_MAIN');
              setSyncStatus('success');
              setSyncMessage('تمت إضافة البيانات للملف ومزامنتها بنجاح.');
              setTimeout(() => setSyncStatus('idle'), 3000);
          } catch (error) {
              setSyncStatus('error');
              setSyncMessage('فشلت المزامنة التلقائية، يرجى المحاولة من لوحة البيانات.');
          }
      }
      alert(`تم معالجة ${importedTeachers.length} أستاذ بنجاح.`);
  };
  
  const handleRestoreBackup = (
      restoredTeachers: Teacher[], 
      restoredReports: Record<string, ReportData>,
      restoredTenure: Record<string, TenureReportData>
  ) => {
      setTeachers(restoredTeachers);
      setReportsMap(restoredReports);
      setTenureReportsMap(restoredTenure);
      alert('تم استرجاع قاعدة البيانات بنجاح.');
  };
  
  // --- Feature: Program Seminar from Dashboard ---
  const handleProgramSeminar = (topic: string) => {
      setPendingSeminarTopic(topic);
      setView(AppView.SEMINARS);
  };

  const NavButton = ({ targetView, icon: Icon, label }: { targetView: AppView, icon: any, label: string }) => (
      <button 
        onClick={() => { 
            if (targetView === AppView.QUARTERLY_REPORT) handleOpenQuarterlyReport(); 
            else setView(targetView); 
            setIsSidebarOpen(false); 
        }} 
        className={`flex-1 min-w-[40px] md:w-full p-2 rounded-lg transition-all flex items-center justify-center md:justify-start gap-3 ${view === targetView ? 'bg-white text-blue-800 shadow-sm' : 'hover:bg-white/10 text-blue-100'}`} 
        title={label}
      >
          <Icon size={18} />
          <span className="hidden md:inline text-sm font-medium">{label}</span>
      </button>
  );

  const effectiveSignature = inspectorProfile.showSignature ? inspectorProfile.signatureUrl : undefined;

  if (loadingSession) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-blue-400 font-bold font-serif text-xl">المفتش التربوي</div>
                <div className="text-slate-500 text-sm mt-2">جاري تحميل النظام...</div>
            </div>
        </div>
      );
  }

  if (!session) {
      return <Auth />;
  }

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
  const isEditorView = view === AppView.EDITOR || view === AppView.LEGACY_EDITOR || view === AppView.TENURE_EDITOR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-900 font-sans p-0 md:p-3 lg:p-4 overflow-hidden h-screen flex flex-col">
      <div className="print:hidden">
        {/* MODALS */}
        {showOnboarding && <OnboardingModal onSave={handleSaveProfile} />}
        {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} profile={inspectorProfile} onSaveProfile={handleSaveProfile} />}
        
        <UpgradeModal 
            isOpen={showUpgradeModal} 
            onClose={() => setShowUpgradeModal(false)} 
            onUpgrade={() => { refetchProfile(); setShowUpgradeModal(false); }} 
            userStatus={subStatus}
        />
        <TeacherDrawer 
            teacher={previewTeacher} 
            isOpen={!!previewTeacher} 
            onClose={() => setPreviewTeacher(null)} 
            onStartInspection={handleStartInspection}
            onStartLegacyInspection={handleStartLegacyInspection}
            onStartTenure={handleStartTenure}
            onUpdateTeacher={handleTeacherUpdate}
        />
      </div>
      
      <div className="hidden print:block">
        {selectedTeacher && view === AppView.EDITOR && <PrintableReport report={currentReport} teacher={selectedTeacher} signature={effectiveSignature} />}
        {selectedTeacher && view === AppView.LEGACY_EDITOR && <PrintableLegacyReport report={currentReport} teacher={selectedTeacher} signature={effectiveSignature} />}
        {selectedTeacher && view === AppView.TENURE_EDITOR && <PrintableTenureReport report={currentTenureReport} teacher={selectedTeacher} signature={effectiveSignature} />}
        {view === AppView.PROMOTIONS && <PromotionList teachers={filteredTeachers} reportsMap={reportsMap} />}
        {view === AppView.QUARTERLY_REPORT && <PrintableQuarterlyReport report={currentQuarterlyReport} signature={effectiveSignature} />}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-blue-900 text-white p-3 flex justify-between items-center shrink-0 z-50 shadow-md print:hidden">
          <div className="flex items-center gap-2">
              <Hexagon className="text-blue-300" size={24} />
              <h1 className="font-bold font-serif text-lg">المفتش التربوي</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/10 rounded-lg">
              <Menu size={24} />
          </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden relative print:hidden">
        <aside className={`
            fixed inset-y-0 right-0 z-50 w-72 bg-gradient-to-br from-blue-800 to-indigo-900 text-white shadow-2xl transform transition-transform duration-300
            md:relative md:translate-x-0 md:w-64 md:rounded-3xl md:shadow-2xl md:border md:border-white/20 md:flex md:flex-col md:overflow-hidden md:shrink-0
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            print:hidden
        `}>
          <div className="p-6 h-full flex flex-col relative overflow-hidden">
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 left-4 p-2 text-white/70 hover:text-white">
                <X size={24} />
            </button>

            <div className="relative z-10 flex-1 flex flex-col">
                <div className="hidden md:flex justify-between items-center mb-6">
                     <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
                        <Hexagon className="text-blue-300 group-hover:rotate-180 transition-transform duration-700" size={28} strokeWidth={1.5} />
                        <h1 className="text-xl font-bold font-serif tracking-wide">المفتش التربوي</h1>
                     </div>
                </div>

                {/* SUBSCRIPTION STATUS BADGE - COMPACT */}
                <div 
                    onClick={() => setShowUpgradeModal(true)}
                    className={`mb-3 px-2 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer border hover:bg-white/10 transition-all ${isGold ? 'bg-amber-500/10 border-amber-500/30' : isActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                >
                    {isGold ? <Crown size={14} className="text-amber-400 fill-amber-400 shrink-0" /> : <Clock size={14} className="text-blue-300 shrink-0" />}
                    
                    <div className="flex-1 flex items-center gap-1 overflow-hidden">
                        <span className="font-bold text-white text-[10px] truncate">
                            {isGold ? 'عضوية ذهبية' : isActive ? 'فترة تجريبية' : 'اشتراك منتهي'}
                        </span>
                        {daysLeft > 0 && (
                            <span className={`text-[9px] ${isGold ? 'text-amber-200' : 'text-blue-200'} opacity-80 whitespace-nowrap`}>
                                ({daysLeft} يوم)
                            </span>
                        )}
                    </div>

                    <button className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 shadow-sm transition-colors ${isGold ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white/90 text-blue-900 hover:bg-white'}`}>
                        {isGold ? 'تجديد' : 'ترقية'}
                    </button>
                </div>

                <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-1 -mr-2">
                    <NavButton targetView={AppView.DASHBOARD} icon={LayoutDashboard} label="الرئيسية" />
                    <NavButton targetView={AppView.ACQUISITIONS} icon={BarChart2} label="تقييم المكتسبات" />
                    <NavButton targetView={AppView.PROMOTIONS} icon={ArrowUpCircle} label="المعنيون بالترقية" />
                    <NavButton targetView={AppView.QUARTERLY_REPORT} icon={PieChart} label="الحصيلة الفصلية" />
                    <div className="my-2 border-t border-white/10"></div>
                    <NavButton targetView={AppView.SEMINARS} icon={Presentation} label="الندوات التربوية" />
                    
                    {/* Admin Assistant: Always Visible now, Blocked internally if expired */}
                    <NavButton targetView={AppView.ADMIN_ASSISTANT} icon={Briefcase} label="المساعد الإداري" />
                    
                    <NavButton targetView={AppView.DATABASE} icon={Database} label="قاعدة البيانات" />
                    <NavButton targetView={AppView.BRANDING} icon={ImageIcon} label="هوية المنصة" />
                    {isAdmin && (
                        <>
                            <div className="my-2 border-t border-red-500/30"></div>
                            <button 
                                onClick={() => { setView(AppView.ADMIN_DASHBOARD); setIsSidebarOpen(false); }}
                                className={`flex-1 min-w-[40px] md:w-full p-2 rounded-lg transition-all flex items-center justify-center md:justify-start gap-3 ${view === AppView.ADMIN_DASHBOARD ? 'bg-red-500 text-white shadow-sm' : 'hover:bg-red-500/20 text-red-200'}`} 
                            >
                                <ShieldAlert size={18} />
                                <span className="hidden md:inline text-sm font-bold">لوحة الإدارة</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Sync Status */}
                {isGoogleConnected && (
                    <div className={`mt-4 px-3 py-2 rounded-xl flex items-center justify-between backdrop-blur-md border transition-all duration-300 ${syncStatus === 'error' ? 'bg-red-500/20 border-red-400/30' : 'bg-white/10 border-white/10'}`}>
                        <div className="flex items-center gap-2">
                            {syncStatus === 'syncing' ? <RefreshCcw size={14} className="animate-spin text-blue-200"/> : 
                             syncStatus === 'error' ? <AlertCircle size={14} className="text-red-300"/> :
                             <Cloud size={14} className="text-green-300"/>}
                            <span className="text-[10px] font-bold text-blue-50">
                                {syncStatus === 'syncing' ? 'جاري المزامنة...' : 
                                 syncStatus === 'error' ? 'فشل المزامنة' : 
                                 'تمت المزامنة'}
                            </span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${syncStatus === 'error' ? 'bg-red-50' : 'bg-green-400'} animate-pulse`}></div>
                    </div>
                )}
            </div>
            
            {/* User Profile */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                 <div onClick={() => setShowSettings(true)} className="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-white/10 p-1.5 rounded-lg transition-colors flex-1">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-sm relative">
                         <UserCircle2 size={20} />
                         <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                             <Settings size={10} className="text-slate-500"/>
                         </div>
                     </div>
                     <div className="text-xs text-blue-200 truncate max-w-[120px]">
                         <span className="font-bold text-white text-sm truncate block" title={inspectorProfile.fullName || 'مستخدم'}>
                             {inspectorProfile.fullName || 'مستخدم'}
                         </span>
                         <span className="text-[10px] opacity-70">إعدادات الحساب</span>
                     </div>
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-xl transition-all shadow-sm"
                    title="تسجيل الخروج"
                 >
                     <LogOut size={18} />
                 </button>
             </div>
          </div>
        </aside>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

        <main className="flex-1 bg-white/95 backdrop-blur-xl md:rounded-3xl shadow-2xl flex relative overflow-hidden border border-white/20 min-w-0 print:hidden">
            
            <div className={`transition-all duration-300 flex flex-col bg-white border-l border-gray-200 z-10 print:hidden ${isEditorView ? 'w-80 h-full absolute right-0 md:static transform translate-x-full md:translate-x-0 shadow-xl md:shadow-none block' : 'hidden'} `}>
                 <TeacherList 
                    teachers={filteredTeachers} 
                    reportsMap={reportsMap}
                    currentReport={currentReport}
                    onSelect={handleSelectTeacher} 
                    selectedId={selectedTeacherId}
                    onAddNew={handleAddNewTeacher}
                    onImport={handleFullImport}
                    onDelete={handleDeleteTeacher}
                    availableSchools={availableSchools} availableLevels={availableLevels}
                    filterSchool={filterSchool} filterLevel={filterLevel}
                    onSetFilterSchool={setFilterSchool} onSetFilterLevel={setFilterLevel}
                />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative w-full print:hidden">
                {view === AppView.DASHBOARD && (
                    <div className="flex flex-col h-full bg-slate-50/50">
                        <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm shrink-0 z-20">
                            <h1 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
                                <LayoutDashboard className="text-blue-600" />
                                لوحة القيادة
                            </h1>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setDashboardTab('stats')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${dashboardTab === 'stats' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BarChart3 size={18} /> الإحصائيات</button>
                                <button onClick={() => setDashboardTab('list')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${dashboardTab === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={18} /> قائمة الأساتذة</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            {dashboardTab === 'stats' ? (
                                <div className="h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <DashboardStats 
                                        teachers={filteredTeachers} 
                                        reportsMap={reportsMap} 
                                        onNavigateToPromotions={() => setView(AppView.PROMOTIONS)} 
                                        fullTeacherCount={teachers.length} 
                                        selectedSchool={filterSchool}
                                        onProgramSeminar={handleProgramSeminar}
                                    />
                                </div>
                            ) : (
                                <div className="h-full p-6 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                                        <div className="flex-1 overflow-hidden">
                                            <TeacherList 
                                                teachers={filteredTeachers} reportsMap={reportsMap} currentReport={currentReport} onSelect={handleSelectTeacher} selectedId={selectedTeacherId} onAddNew={handleAddNewTeacher} onImport={handleFullImport} onDelete={handleDeleteTeacher} availableSchools={availableSchools} availableLevels={availableLevels} filterSchool={filterSchool} filterLevel={filterLevel} onSetFilterSchool={setFilterSchool} onSetFilterLevel={setFilterLevel}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === AppView.DATABASE && (
                    <DatabaseManager 
                        teachers={teachers} reportsMap={reportsMap} tenureReportsMap={tenureReportsMap} onRestore={handleRestoreBackup} currentReport={currentReport} onConnectionChange={setIsGoogleConnected} isConnected={isGoogleConnected} onAutoSyncChange={setAutoSyncEnabled} isAutoSync={autoSyncEnabled}
                    />
                )}
                
                {view === AppView.ACQUISITIONS && (
                    <AcqManager availableSchools={acqAvailableSchools} onDataUpdated={() => setAcqRefreshKey(prev => prev + 1)} externalFilters={acqFilters} onUpdateFilters={(updates) => setAcqFilters(prev => ({ ...prev, ...updates }))} />
                )}

                {view === AppView.PROMOTIONS && (
                    <PromotionList teachers={filteredTeachers} reportsMap={reportsMap} />
                )}
                
                {view === AppView.EDITOR && selectedTeacher && (
                    <ReportEditor 
                        report={currentReport} teacher={selectedTeacher} onChange={handleReportChange} onTeacherChange={handleTeacherUpdate} onPrint={handlePrint} 
                        isGoldMember={isGold} 
                        // Now we pass !canPrint to show upgrade modal, instead of blocking the whole view
                        isExpired={!canPrint()} 
                        onUpgradeClick={() => setShowUpgradeModal(true)} 
                    />
                )}
                
                {view === AppView.LEGACY_EDITOR && selectedTeacher && (
                    <LegacyReportEditor 
                        report={currentReport} teacher={selectedTeacher} onChange={handleReportChange} onTeacherChange={handleTeacherUpdate} onPrint={handlePrint} 
                        isGoldMember={isGold} 
                        isExpired={!canPrint()} 
                        onUpgradeClick={() => setShowUpgradeModal(true)} 
                    />
                )}
                
                {view === AppView.TENURE_EDITOR && selectedTeacher && (
                    <TenureReportEditor 
                        report={currentTenureReport} 
                        teacher={selectedTeacher} 
                        onChange={handleTenureReportChange} 
                        onPrint={handlePrint} 
                        isGoldMember={isGold}
                        isExpired={!canPrint()}
                        onUpgradeClick={() => setShowUpgradeModal(true)}
                    />
                )}
                
                {view === AppView.QUARTERLY_REPORT && (
                    <QuarterlyReportEditor 
                        report={currentQuarterlyReport} onChange={handleQuarterlyReportChange} onPrint={handlePrint} teachers={teachers} reportsMap={reportsMap} tenureReportsMap={tenureReportsMap} signature={effectiveSignature} inspectorName={inspectorProfile.fullName} globalWilaya={inspectorProfile.wilaya || derivedGlobalData.wilaya} globalDistrict={inspectorProfile.district || derivedGlobalData.district}
                        isExpired={!canPrint()}
                        onUpgradeClick={() => setShowUpgradeModal(true)}
                    />
                )}
                
                {view === AppView.SEMINARS && (
                    <SeminarsManager 
                        teachers={teachers} 
                        reportsMap={reportsMap} 
                        inspectorInfo={{ name: inspectorProfile.fullName, district: inspectorProfile.district || derivedGlobalData.district, wilaya: inspectorProfile.wilaya || derivedGlobalData.wilaya }} 
                        signature={effectiveSignature} 
                        isExpired={!canPrint()}
                        onUpgradeClick={() => setShowUpgradeModal(true)}
                        initialTopic={pendingSeminarTopic}
                        onClearInitialTopic={() => setPendingSeminarTopic(null)}
                    />
                )}
                
                {view === AppView.ADMIN_ASSISTANT && (
                    <AdministrativeAssistant 
                        teachers={teachers} 
                        reportsMap={reportsMap} 
                        tenureReportsMap={tenureReportsMap} 
                        inspectorName={inspectorProfile.fullName} 
                        wilaya={inspectorProfile.wilaya || derivedGlobalData.wilaya} 
                        district={inspectorProfile.district || derivedGlobalData.district} 
                        signature={effectiveSignature}
                        isExpired={!isActive} // Pass expiration status (isActive covers Trial + Gold)
                        onUpgradeClick={() => setShowUpgradeModal(true)}
                    />
                )}

                {view === AppView.BRANDING && (
                    <BrandingKit />
                )}

                {/* ADMIN DASHBOARD VIEW - PROTECTED */}
                {view === AppView.ADMIN_DASHBOARD && isAdmin && (
                    <AdminDashboard />
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;