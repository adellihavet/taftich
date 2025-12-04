
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
import Auth from './components/Auth';
import { supabase, isSupabaseConfigured, fetchScriptUrlFromCloud } from './services/supabaseService';
import { Teacher, ReportData, TenureReportData, QuarterlyReportData, AppView, LibraryLink } from './types';
import { AcqFilterState } from './types/acquisitions';
import { MOCK_TEACHERS, INITIAL_REPORT_STATE, INITIAL_TENURE_REPORT_STATE, INITIAL_QUARTERLY_REPORT_STATE } from './constants';
import { Database, LayoutDashboard, ArrowUpCircle, PenLine, LogOut, UserCircle2, Hexagon, PieChart, Cloud, RefreshCcw, AlertCircle, BarChart2, Presentation, Briefcase, Menu, X } from 'lucide-react';
import { syncWithScript } from './services/sheetsService';
import { generateDatabaseRows } from './utils/sheetHelper';
import { getAcqDB } from './services/acqStorage';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Mobile Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [previewTeacher, setPreviewTeacher] = useState<Teacher | null>(null);

  const [inspectorName, setInspectorName] = useState('');
  const [isEditingInspector, setIsEditingInspector] = useState(false);
  const [signature, setSignature] = useState<string | undefined>(undefined);

  const [currentReport, setCurrentReport] = useState<ReportData>(INITIAL_REPORT_STATE);
  const [reportsMap, setReportsMap] = useState<Record<string, ReportData>>({});

  const [currentTenureReport, setCurrentTenureReport] = useState<TenureReportData>(INITIAL_TENURE_REPORT_STATE);
  const [tenureReportsMap, setTenureReportsMap] = useState<Record<string, TenureReportData>>({});

  const [currentQuarterlyReport, setCurrentQuarterlyReport] = useState<QuarterlyReportData>(INITIAL_QUARTERLY_REPORT_STATE);
  
  const [isGoldMember, setIsGoldMember] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // --- ACQUISITION FILTER STATE ---
  const [acqFilters, setAcqFilters] = useState<AcqFilterState>({
      scope: 'district',
      selectedSchool: '',
      selectedLevel: '',
      selectedClass: '',
      selectedSubject: ''
  });
  
  const [acqRefreshKey, setAcqRefreshKey] = useState(0); 

  // --- GOOGLE SYNC STATE ---
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => localStorage.getItem('mufattish_auto_sync') === 'true');
  const isFirstMount = useRef(true);

  const [filterSchool, setFilterSchool] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');

  const availableSchools = useMemo(() => {
      const schools = new Set<string>();
      Object.values(reportsMap).forEach(r => { if(r.school) schools.add(r.school.trim()); });
      return Array.from(schools).sort();
  }, [reportsMap]);

  const acqAvailableSchools = useMemo(() => {
      const db = getAcqDB();
      const schools = new Set<string>();
      db.records.forEach(r => schools.add(r.schoolName));
      return Array.from(schools).sort();
  }, [acqRefreshKey, view]); 

  const availableLevels = useMemo(() => {
      const levels = new Set<string>();
      Object.values(reportsMap).forEach(r => { if(r.level) levels.add(r.level.trim()); });
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

  // --- INTELLIGENT GLOBAL SETTINGS EXTRACTION ---
  const derivedGlobalData = useMemo(() => {
      let d = currentReport.district;
      let w = currentReport.wilaya;

      // If current report has no district (default state), try to find it in previous reports
      if (!d || d.trim() === '') {
          const reportWithDistrict = Object.values(reportsMap).find(r => r.district && r.district.trim() !== '');
          if (reportWithDistrict) d = reportWithDistrict.district;
      }

      // Same for Wilaya, ignoring default 'الأغواط' if a better one exists
      if (!w || w === 'الأغواط') {
          const reportWithWilaya = Object.values(reportsMap).find(r => r.wilaya && r.wilaya.trim() !== '' && r.wilaya !== 'الأغواط');
          if (reportWithWilaya) w = reportWithWilaya.wilaya;
      }

      return { 
          district: d || '', 
          wilaya: w || 'الأغواط' 
      };
  }, [currentReport, reportsMap]);

  // --- AUTOMATIC RECORD UPDATE (30 DAYS RULE) ---
  useEffect(() => {
      const today = new Date();
      let updatedCount = 0;
      
      const newTeachers = teachers.map(t => {
          const report = reportsMap[t.id];
          // If report exists AND has a date AND has a mark
          if (report && report.inspectionDate && report.finalMark > 0) {
              const reportDate = new Date(report.inspectionDate);
              if (!isNaN(reportDate.getTime())) {
                  // Calculate diff in days
                  const diffTime = Math.abs(today.getTime() - reportDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                  // Condition: More than 30 days passed AND the teacher record isn't already updated to this date
                  if (diffDays > 30 && t.lastInspectionDate !== report.inspectionDate) {
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
          console.log(`Updated ${updatedCount} teacher records automatically (30-day rule).`);
      }
  }, [reportsMap]); // Run when reports change (or on load if reports loaded)

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingSession(false);
            
            if (session?.user) {
                // Ensure function exists before calling
                if (typeof fetchScriptUrlFromCloud === 'function') {
                    fetchScriptUrlFromCloud().then(url => {
                        if (url) {
                            localStorage.setItem('mufattish_script_url', url);
                            setIsGoogleConnected(true);
                        }
                    });
                }
            }
        }).catch((err: any) => {
            console.error("Session check failed:", err);
            setLoadingSession(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setSession(session);
            setLoadingSession(false);
            
            if (session?.user) {
                if (typeof fetchScriptUrlFromCloud === 'function') {
                    fetchScriptUrlFromCloud().then(url => {
                        if (url) {
                            localStorage.setItem('mufattish_script_url', url);
                            setIsGoogleConnected(true);
                        }
                    });
                }
            }
        });

        return () => subscription.unsubscribe();
    } else {
        setLoadingSession(false);
    }
  }, []);

  // --- LOCAL STORAGE LOAD ---
  useEffect(() => {
    const savedTeachers = localStorage.getItem('mufattish_teachers');
    const savedReports = localStorage.getItem('mufattish_reports_map'); 
    const savedTenureReports = localStorage.getItem('mufattish_tenure_reports_map');
    const savedQuarterlyReport = localStorage.getItem('mufattish_quarterly_report');
    const savedMembership = localStorage.getItem('mufattish_is_gold');
    const savedInspectorName = localStorage.getItem('mufattish_inspector_name');
    const savedSignature = localStorage.getItem('mufattish_signature');

    if (savedTeachers) try { setTeachers(JSON.parse(savedTeachers)); } catch(e) {}
    if (savedReports) try { setReportsMap(JSON.parse(savedReports)); } catch(e) {}
    if (savedTenureReports) try { setTenureReportsMap(JSON.parse(savedTenureReports)); } catch(e) {}
    if (savedQuarterlyReport) try { setCurrentQuarterlyReport(JSON.parse(savedQuarterlyReport)); } catch(e) {}
    if (savedMembership === 'true') setIsGoldMember(true);
    if (savedInspectorName) setInspectorName(savedInspectorName);
    if (savedSignature) setSignature(savedSignature);

    const scriptUrl = localStorage.getItem('mufattish_script_url');
    if (scriptUrl) {
        setIsGoogleConnected(true);
    }
  }, []);

  // --- LOCAL STORAGE SAVE ---
  useEffect(() => { localStorage.setItem('mufattish_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('mufattish_reports_map', JSON.stringify(reportsMap)); }, [reportsMap]);
  useEffect(() => { localStorage.setItem('mufattish_tenure_reports_map', JSON.stringify(tenureReportsMap)); }, [tenureReportsMap]);
  useEffect(() => { localStorage.setItem('mufattish_quarterly_report', JSON.stringify(currentQuarterlyReport)); }, [currentQuarterlyReport]);
  useEffect(() => { localStorage.setItem('mufattish_is_gold', isGoldMember.toString()); }, [isGoldMember]);
  useEffect(() => { localStorage.setItem('mufattish_inspector_name', inspectorName); }, [inspectorName]);

  // --- GOOGLE SYNC LOGIC ---
  useEffect(() => {
      if (isFirstMount.current) {
          isFirstMount.current = false;
          return;
      }

      // GUARD: Don't sync if teachers list is empty. This prevents wiping the sheet on init.
      if (!autoSyncEnabled || !isGoogleConnected || teachers.length === 0) return;

      const scriptUrl = localStorage.getItem('mufattish_script_url');
      if (!scriptUrl) return;

      setSyncStatus('syncing');
      
      const timer = setTimeout(async () => {
          try {
              const data = generateDatabaseRows(teachers, currentReport, reportsMap);
              await syncWithScript(scriptUrl, data);
              setSyncStatus('success');
              setSyncMessage('تم الحفظ في Google Sheets');
              setTimeout(() => setSyncStatus('idle'), 3000);
          } catch (error: any) {
              console.error("Sync Error:", error);
              setSyncStatus('error');
              setSyncMessage('فشل المزامنة');
          }
      }, 4000);

      return () => clearTimeout(timer);
  }, [teachers, reportsMap, tenureReportsMap, autoSyncEnabled, isGoogleConnected]);

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
              inspectorName: existing.inspectorName || inspectorName 
          });
      } else {
          const newReport = {
              ...INITIAL_REPORT_STATE,
              id: generateId(),
              teacherId: teacher.id,
              reportModel: type,
              wilaya: currentReport.wilaya || derivedGlobalData.wilaya, 
              school: currentReport.school || '',
              district: currentReport.district || derivedGlobalData.district,
              inspectorName: inspectorName
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
              inspectorName: existing.inspectorName || inspectorName
           });
      } else {
          const newTenure = {
              ...INITIAL_TENURE_REPORT_STATE,
              id: generateId(),
              teacherId: teacher.id,
              wilaya: currentReport.wilaya || derivedGlobalData.wilaya, 
              district: currentReport.district || derivedGlobalData.district,
              school: currentReport.school || '',
              inspectorName: inspectorName
          };
          setCurrentTenureReport(newTenure);
          setTenureReportsMap(prev => ({...prev, [teacher.id]: newTenure}));
      }
      setView(AppView.TENURE_EDITOR);
  };

  const handleOpenQuarterlyReport = () => {
      setCurrentQuarterlyReport(prev => ({
          ...prev,
          inspectorName: prev.inspectorName || inspectorName,
          wilaya: prev.wilaya || currentReport.wilaya || derivedGlobalData.wilaya, 
          district: prev.district || currentReport.district || derivedGlobalData.district,
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
      if (window.confirm("هل أنت متأكد من حذف هذا الأستاذ؟")) {
          setTeachers(prev => prev.filter(t => t.id !== id));
          const newReports = { ...reportsMap };
          delete newReports[id];
          setReportsMap(newReports);
          
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
      
      const defaultWilaya = currentReport.wilaya || derivedGlobalData.wilaya; 
      const defaultDistrict = currentReport.district || derivedGlobalData.district;

      importedTeachers.forEach(t => {
          const normalizedImportName = t.fullName.trim().toLowerCase();
          const existingTeacherIdx = newTeachers.findIndex(existing => existing.fullName.trim().toLowerCase() === normalizedImportName);
          
          if (existingTeacherIdx >= 0) {
              const existingTeacher = newTeachers[existingTeacherIdx];
              newTeachers[existingTeacherIdx] = {
                  ...existingTeacher,
                  birthDate: t.birthDate || existingTeacher.birthDate,
                  birthPlace: t.birthPlace || existingTeacher.birthPlace,
                  degree: t.degree || existingTeacher.degree,
                  degreeDate: t.degreeDate || existingTeacher.degreeDate,
                  recruitmentDate: t.recruitmentDate || existingTeacher.recruitmentDate,
                  rank: t.rank || existingTeacher.rank,
                  currentRankDate: t.currentRankDate || existingTeacher.currentRankDate,
                  echelon: t.echelon || existingTeacher.echelon,
                  echelonDate: t.echelonDate || existingTeacher.echelonDate,
                  lastInspectionDate: t.lastInspectionDate || existingTeacher.lastInspectionDate,
                  lastMark: t.lastMark || existingTeacher.lastMark,
                  status: t.status || existingTeacher.status
              };

              const importedReport = importedReports[t.id];
              if (importedReport) {
                  const existingReport = newReportsMap[existingTeacher.id] || { ...INITIAL_REPORT_STATE, id: generateId(), teacherId: existingTeacher.id };
                  newReportsMap[existingTeacher.id] = {
                      ...existingReport,
                      school: importedReport.school || existingReport.school,
                      level: importedReport.level || existingReport.level,
                      wilaya: existingReport.wilaya || defaultWilaya,
                      district: existingReport.district || defaultDistrict
                  };
              }
          } else {
              newTeachers.push(t);
              const importedReport = importedReports[t.id];
              if (importedReport) {
                  newReportsMap[t.id] = {
                      ...importedReport,
                      wilaya: defaultWilaya,
                      district: defaultDistrict
                  };
              } else {
                  newReportsMap[t.id] = {
                      ...INITIAL_REPORT_STATE,
                      id: generateId(),
                      teacherId: t.id,
                      wilaya: defaultWilaya,
                      district: defaultDistrict
                  };
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
              const data = generateDatabaseRows(newTeachers, currentReport, newReportsMap);
              await syncWithScript(scriptUrl, data);
              setSyncStatus('success');
              setSyncMessage('تمت إضافة البيانات للملف ومزامنتها بنجاح.');
              setTimeout(() => setSyncStatus('idle'), 3000);
          } catch (error) {
              console.error("Manual Sync Failed:", error);
              setSyncStatus('error');
              setSyncMessage('فشلت المزامنة التلقائية، يرجى المحاولة من لوحة البيانات.');
          }
      }

      alert(`تم استيراد ${importedTeachers.length} أستاذ بنجاح.`);
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

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setSignature(base64String);
            localStorage.setItem('mufattish_signature', base64String);
        };
        reader.readAsDataURL(file);
    }
  };

  const NavButton = ({ targetView, icon: Icon, label }: { targetView: AppView, icon: any, label: string }) => (
      <button 
        onClick={() => { setView(targetView); setIsSidebarOpen(false); }} 
        className={`flex-1 min-w-[40px] md:w-full p-2 rounded-lg transition-all flex items-center justify-center md:justify-start gap-3 ${view === targetView ? 'bg-white text-blue-800 shadow-sm' : 'hover:bg-white/10 text-blue-100'}`} 
        title={label}
      >
          <Icon size={18} />
          <span className="hidden md:inline text-sm font-medium">{label}</span>
      </button>
  );

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
  const userFullName = session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || 'مستخدم';

  const isEditorView = view === AppView.EDITOR || view === AppView.LEGACY_EDITOR || view === AppView.TENURE_EDITOR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-900 font-sans p-0 md:p-3 lg:p-4 overflow-hidden h-screen flex flex-col">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={() => {setIsGoldMember(true); setShowUpgradeModal(false); alert("مبروك! تم تفعيل العضوية الذهبية بنجاح.");}} />
      <TeacherDrawer 
        teacher={previewTeacher} 
        isOpen={!!previewTeacher} 
        onClose={() => setPreviewTeacher(null)} 
        onStartInspection={handleStartInspection}
        onStartLegacyInspection={handleStartLegacyInspection}
        onStartTenure={handleStartTenure}
        onUpdateTeacher={handleTeacherUpdate}
      />
      
      {/* Printable Views (Hidden on Screen) */}
      <div className="hidden print:block">
        {selectedTeacher && view === AppView.EDITOR && <PrintableReport report={currentReport} teacher={selectedTeacher} signature={signature} />}
        {selectedTeacher && view === AppView.LEGACY_EDITOR && <PrintableLegacyReport report={currentReport} teacher={selectedTeacher} signature={signature} />}
        {selectedTeacher && view === AppView.TENURE_EDITOR && <PrintableTenureReport report={currentTenureReport} teacher={selectedTeacher} signature={signature} />}
        {view === AppView.PROMOTIONS && <PromotionList teachers={filteredTeachers} reportsMap={reportsMap} />}
        {view === AppView.QUARTERLY_REPORT && <PrintableQuarterlyReport report={currentQuarterlyReport} />}
      </div>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden bg-blue-900 text-white p-3 flex justify-between items-center shrink-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
              <Hexagon className="text-blue-300" size={24} />
              <h1 className="font-bold font-serif text-lg">المفتش التربوي</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/10 rounded-lg">
              <Menu size={24} />
          </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden relative">
        
        {/* SIDEBAR (Responsive) */}
        <aside className={`
            fixed inset-y-0 right-0 z-50 w-72 bg-gradient-to-br from-blue-800 to-indigo-900 text-white shadow-2xl transform transition-transform duration-300
            md:relative md:translate-x-0 md:w-64 md:rounded-3xl md:shadow-2xl md:border md:border-white/20 md:flex md:flex-col md:overflow-hidden md:shrink-0
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-6 h-full flex flex-col relative overflow-hidden">
            {/* Mobile Close Button */}
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

                {/* Navigation Menu */}
                <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-1 -mr-2">
                    <NavButton targetView={AppView.DASHBOARD} icon={LayoutDashboard} label="الرئيسية" />
                    <NavButton targetView={AppView.ACQUISITIONS} icon={BarChart2} label="تقييم المكتسبات" />
                    <NavButton targetView={AppView.PROMOTIONS} icon={ArrowUpCircle} label="المعنيون بالترقية" />
                    <NavButton targetView={AppView.QUARTERLY_REPORT} icon={PieChart} label="الحصيلة الفصلية" />
                    <div className="my-2 border-t border-white/10"></div>
                    <NavButton targetView={AppView.SEMINARS} icon={Presentation} label="الندوات التربوية" />
                    <NavButton targetView={AppView.ADMIN_ASSISTANT} icon={Briefcase} label="المساعد الإداري" />
                    <NavButton targetView={AppView.DATABASE} icon={Database} label="قاعدة البيانات" />
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

                {/* Inspector Name Input */}
                <div className="bg-blue-900/40 p-3 rounded-xl border border-blue-400/30 backdrop-blur-md mt-2">
                    <label className="text-[10px] text-blue-200 font-bold block mb-1 uppercase tracking-wider">اسم المفتش (للتوقيع)</label>
                    <div className="flex items-center gap-2">
                        {isEditingInspector ? (
                            <input 
                                type="text" 
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                                onBlur={() => setIsEditingInspector(false)}
                                autoFocus
                                className="w-full bg-blue-950/50 border border-blue-400 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                                placeholder="اكتب اسمك هنا..."
                            />
                        ) : (
                            <div 
                                onClick={() => setIsEditingInspector(true)}
                                className="flex-1 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded px-2 py-1 transition-colors group"
                            >
                                <span className="text-sm font-bold truncate">{inspectorName || 'انقر لإضافة الاسم'}</span>
                                <PenLine size={12} className="text-blue-300 group-hover:text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* User Profile Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                 <div className="flex items-center gap-3 overflow-hidden">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-sm">
                         <UserCircle2 size={20} />
                     </div>
                     <div className="text-xs text-blue-200 truncate max-w-[120px]">
                         <span className="font-bold text-white text-sm truncate block" title={userFullName}>{userFullName}</span>
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

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        <main className="flex-1 bg-white/95 backdrop-blur-xl md:rounded-3xl shadow-2xl flex relative overflow-hidden border border-white/20 min-w-0">
            
            {/* TEACHER LIST:
                - In Dashboard: It appears as a main block below stats (Full width).
                - In Editor Views: It appears as a Sidebar (Fixed width).
            */}
            <div className={`
                transition-all duration-300 flex flex-col bg-white border-l border-gray-200 z-10
                ${view === AppView.DASHBOARD ? 'w-full order-2 hidden' : 'w-80 h-full absolute right-0 md:static transform translate-x-full md:translate-x-0 shadow-xl md:shadow-none'}
                ${isEditorView ? 'block' : 'hidden'} 
            `}>
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

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative w-full">
                
                {/* DASHBOARD SPECIFIC LAYOUT */}
                {view === AppView.DASHBOARD && (
                    <div className="flex flex-col h-full overflow-y-auto">
                        {/* 1. Stats Panel */}
                        <div className="shrink-0">
                            <DashboardStats teachers={filteredTeachers} reportsMap={reportsMap} onNavigateToPromotions={() => setView(AppView.PROMOTIONS)} fullTeacherCount={teachers.length} selectedSchool={filterSchool} />
                        </div>
                        
                        {/* 2. Teacher List (Embedded in Dashboard) */}
                        <div className="flex-1 p-6 bg-white border-t border-gray-100 min-h-[500px]">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                                <UserCircle2 className="text-blue-600"/>
                                قائمة الأساتذة والعمليات
                            </h2>
                            <div className="h-full border rounded-xl overflow-hidden shadow-sm">
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
                        </div>
                    </div>
                )}

                {/* OTHER VIEWS */}
                {view === AppView.DATABASE && (
                    <DatabaseManager 
                        teachers={teachers} 
                        reportsMap={reportsMap}
                        tenureReportsMap={tenureReportsMap}
                        onRestore={handleRestoreBackup}
                        currentReport={currentReport}
                        onConnectionChange={setIsGoogleConnected}
                        isConnected={isGoogleConnected}
                        onAutoSyncChange={setAutoSyncEnabled}
                        isAutoSync={autoSyncEnabled}
                    />
                )}
                
                {view === AppView.ACQUISITIONS && (
                    <AcqManager 
                        availableSchools={acqAvailableSchools} 
                        onDataUpdated={() => setAcqRefreshKey(prev => prev + 1)}
                        externalFilters={acqFilters} 
                    />
                )}

                {view === AppView.PROMOTIONS && (
                    <PromotionList teachers={filteredTeachers} reportsMap={reportsMap} />
                )}
                
                {view === AppView.EDITOR && selectedTeacher && (
                    <ReportEditor report={currentReport} teacher={selectedTeacher} onChange={handleReportChange} onTeacherChange={handleTeacherUpdate} onPrint={handlePrint} isGoldMember={isGoldMember} onUpgradeClick={() => setShowUpgradeModal(true)} onUploadSignature={handleSignatureUpload} />
                )}
                
                {view === AppView.LEGACY_EDITOR && selectedTeacher && (
                    <LegacyReportEditor report={currentReport} teacher={selectedTeacher} onChange={handleReportChange} onTeacherChange={handleTeacherUpdate} onPrint={handlePrint} isGoldMember={isGoldMember} onUpgradeClick={() => setShowUpgradeModal(true)} onUploadSignature={handleSignatureUpload} />
                )}
                
                {view === AppView.TENURE_EDITOR && selectedTeacher && (
                    <TenureReportEditor report={currentTenureReport} teacher={selectedTeacher} onChange={handleTenureReportChange} onPrint={handlePrint} isGoldMember={isGoldMember} onUploadSignature={handleSignatureUpload} />
                )}
                
                {view === AppView.QUARTERLY_REPORT && (
                    <QuarterlyReportEditor report={currentQuarterlyReport} onChange={handleQuarterlyReportChange} onPrint={handlePrint} teachers={teachers} reportsMap={reportsMap} tenureReportsMap={tenureReportsMap} />
                )}
                
                {view === AppView.SEMINARS && (
                    <SeminarsManager 
                        teachers={teachers} 
                        reportsMap={reportsMap} 
                        inspectorInfo={{ name: currentReport.inspectorName || inspectorName, district: derivedGlobalData.district, wilaya: derivedGlobalData.wilaya }}
                    />
                )}
                
                {view === AppView.ADMIN_ASSISTANT && (
                    <AdministrativeAssistant 
                        teachers={teachers}
                        reportsMap={reportsMap}
                        tenureReportsMap={tenureReportsMap}
                        inspectorName={currentReport.inspectorName || inspectorName}
                        wilaya={derivedGlobalData.wilaya}
                        district={derivedGlobalData.district}
                    />
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;