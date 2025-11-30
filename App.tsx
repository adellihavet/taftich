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
import Auth from './components/Auth';
import { supabase, isSupabaseConfigured } from './services/supabaseService';
import { Teacher, ReportData, TenureReportData, QuarterlyReportData, AppView } from './types';
import { MOCK_TEACHERS, INITIAL_REPORT_STATE, INITIAL_TENURE_REPORT_STATE, INITIAL_QUARTERLY_REPORT_STATE } from './constants';
import { Database, Crown, LayoutDashboard, ArrowUpCircle, PenLine, LogOut, HardDrive, UserCircle2, Hexagon, PieChart, Cloud, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { initializeGoogleApi, trySilentAuth, clearAndOverwriteSheet } from './services/sheetsService';
import { generateDatabaseRows } from './utils/sheetHelper';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingSession(false);
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

    // Initialize Google API if keys exist
    const apiKey = localStorage.getItem('mufattish_sheets_api_key');
    const clientId = localStorage.getItem('mufattish_client_id');
    if (apiKey && clientId) {
        initializeGoogleApi(apiKey, clientId).then(() => {
            trySilentAuth().then(success => {
                if (success) setIsGoogleConnected(true);
            });
        }).catch(err => console.error("Google Init Error:", err));
    }
  }, []);

  // --- LOCAL STORAGE SAVE ---
  useEffect(() => { localStorage.setItem('mufattish_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('mufattish_reports_map', JSON.stringify(reportsMap)); }, [reportsMap]);
  useEffect(() => { localStorage.setItem('mufattish_tenure_reports_map', JSON.stringify(tenureReportsMap)); }, [tenureReportsMap]);
  useEffect(() => { localStorage.setItem('mufattish_quarterly_report', JSON.stringify(currentQuarterlyReport)); }, [currentQuarterlyReport]);
  useEffect(() => { localStorage.setItem('mufattish_is_gold', isGoldMember.toString()); }, [isGoldMember]);
  useEffect(() => { localStorage.setItem('mufattish_inspector_name', inspectorName); }, [inspectorName]);

  // --- GOOGLE SYNC LOGIC (MOVED FROM DATABASE MANAGER) ---
  useEffect(() => {
      // Skip initial render to avoid syncing empty state or immediate sync on load
      if (isFirstMount.current) {
          isFirstMount.current = false;
          return;
      }

      if (!autoSyncEnabled || !isGoogleConnected) return;

      const sheetId = localStorage.getItem('mufattish_sheet_id');
      if (!sheetId) return;

      setSyncStatus('syncing');
      
      const timer = setTimeout(async () => {
          try {
              const data = generateDatabaseRows(teachers, currentReport, reportsMap);
              await clearAndOverwriteSheet(sheetId, data);
              setSyncStatus('success');
              setSyncMessage('تم الحفظ في Google Sheets');
              setTimeout(() => setSyncStatus('idle'), 3000);
          } catch (error: any) {
              console.error("Sync Error:", error);
              setSyncStatus('error');
              setSyncMessage('فشل المزامنة');
          }
      }, 4000); // 4 seconds debounce

      return () => clearTimeout(timer);
  }, [teachers, reportsMap, tenureReportsMap, autoSyncEnabled, isGoogleConnected]); // Dependencies for sync

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
              wilaya: currentReport.wilaya || 'الأغواط', 
              school: currentReport.school || '',
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
              wilaya: currentReport.wilaya || 'الأغواط',
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
          wilaya: prev.wilaya || currentReport.wilaya || 'الأغواط',
          district: prev.district || currentReport.district || '',
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
            birthDate: '', birthPlace: '', degree: '', recruitmentDate: new Date().toISOString().split('T')[0],
            rank: 'أستاذ المدرسة الابتدائية', lastInspectionDate: '', lastMark: 10, status: 'titulaire'
        };
        setTeachers([...teachers, newTeacher]);
        handleSelectTeacher(newTeacher);
    }
  };

  const handleFullImport = (importedTeachers: Teacher[], importedReports: Record<string, ReportData>) => {
      const newTeachers = [...teachers];
      const newReportsMap = { ...reportsMap };
      
      importedTeachers.forEach(t => {
          const idx = newTeachers.findIndex(existing => existing.id === t.id);
          if (idx >= 0) {
              newTeachers[idx] = t;
          } else {
              newTeachers.push(t);
          }
      });
      
      Object.assign(newReportsMap, importedReports);
      
      setTeachers(newTeachers);
      setReportsMap(newReportsMap);
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

  return (
    // DARK GRADIENT BACKGROUND
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-900 font-sans p-3 lg:p-4 overflow-hidden h-screen">
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
      
      <div className="hidden print:block">
        {selectedTeacher && view === AppView.EDITOR && <PrintableReport report={currentReport} teacher={selectedTeacher} signature={signature} />}
        {selectedTeacher && view === AppView.LEGACY_EDITOR && <PrintableLegacyReport report={currentReport} teacher={selectedTeacher} signature={signature} />}
        {selectedTeacher && view === AppView.TENURE_EDITOR && <PrintableTenureReport report={currentTenureReport} teacher={selectedTeacher} signature={signature} />}
        {view === AppView.PROMOTIONS && <PromotionList teachers={filteredTeachers} reportsMap={reportsMap} />}
        {view === AppView.QUARTERLY_REPORT && <PrintableQuarterlyReport report={currentQuarterlyReport} />}
      </div>

      <div className="flex h-full gap-4 print:hidden">
        {/* SIDEBAR: FLOATING PANEL */}
        <aside className="w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-white/20 overflow-hidden transition-all hover:shadow-blue-900/20 duration-500 shrink-0">
          {/* Header Gradient */}
          <div className="p-6 bg-gradient-to-br from-blue-700 to-indigo-800 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
                        <Hexagon className="text-blue-300 group-hover:rotate-180 transition-transform duration-700" size={28} strokeWidth={1.5} />
                        <h1 className="text-xl font-bold font-serif tracking-wide">المفتش التربوي</h1>
                     </div>
                </div>

                <div className="flex gap-2 mb-4 bg-white/10 p-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                    <button onClick={() => setView(AppView.DASHBOARD)} className={`flex-1 p-2 rounded-lg transition-all flex justify-center items-center ${view === AppView.DASHBOARD ? 'bg-white text-blue-800 shadow-sm' : 'hover:bg-white/10 text-blue-100'}`} title="الرئيسية"><LayoutDashboard size={18} /></button>
                    <button onClick={() => setView(AppView.DATABASE)} className={`flex-1 p-2 rounded-lg transition-all flex justify-center items-center ${view === AppView.DATABASE ? 'bg-white text-blue-800 shadow-sm' : 'hover:bg-white/10 text-blue-100'}`} title="قاعدة البيانات"><Database size={18} /></button>
                    <button onClick={() => setView(AppView.PROMOTIONS)} className={`flex-1 p-2 rounded-lg transition-all flex justify-center items-center ${view === AppView.PROMOTIONS ? 'bg-white text-blue-800 shadow-sm' : 'hover:bg-white/10 text-blue-100'}`} title="المعنيون بالترقية"><ArrowUpCircle size={18} /></button>
                    <button onClick={handleOpenQuarterlyReport} className={`flex-1 p-2 rounded-lg transition-all flex justify-center items-center ${view === AppView.QUARTERLY_REPORT ? 'bg-white text-blue-800 shadow-sm' : 'hover:bg-white/10 text-blue-100'}`} title="الحصيلة الفصلية"><PieChart size={18} /></button>
                </div>

                {/* --- SYNC STATUS INDICATOR --- */}
                {isGoogleConnected && (
                    <div className={`mb-4 px-3 py-2 rounded-xl flex items-center justify-between backdrop-blur-md border transition-all duration-300 ${syncStatus === 'error' ? 'bg-red-500/20 border-red-400/30' : 'bg-white/10 border-white/10'}`}>
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
                        <div className={`w-2 h-2 rounded-full ${syncStatus === 'error' ? 'bg-red-500' : 'bg-green-400'} animate-pulse`}></div>
                    </div>
                )}

                <div className="bg-blue-900/40 p-3 rounded-xl border border-blue-400/30 backdrop-blur-md">
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
            {/* Background Decoration */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
          </div>
          
          <div className="flex-1 overflow-hidden bg-white/50 relative">
            {(view === AppView.DASHBOARD || view === AppView.EDITOR || view === AppView.LEGACY_EDITOR || view === AppView.TENURE_EDITOR) ? (
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
            ) : view === AppView.QUARTERLY_REPORT ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <PieChart size={32} className="text-purple-400" />
                    </div>
                    <h3 className="font-bold text-slate-600 mb-2">الحصيلة الفصلية</h3>
                    <p className="text-xs">إحصائيات مفصلة للزيارات والنشاطات</p>
                </div>
            ) : view === AppView.DATABASE ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Database size={32} className="text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-600 mb-2">إدارة البيانات</h3>
                    <p className="text-xs">استيراد، تصدير، ومزامنة بياناتك بأمان</p>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <ArrowUpCircle size={32} className="text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-600 mb-2">قائمة الترقيات</h3>
                    <p className="text-xs">متابعة الأقدمية والزيارات المستحقة</p>
                </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3 overflow-hidden">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-sm">
                         <UserCircle2 size={20} />
                     </div>
                     <div className="text-xs text-slate-500 truncate max-w-[120px]">
                         مرحباً، <br/>
                         <span className="font-bold text-slate-800 text-sm truncate block" title={userFullName}>{userFullName}</span>
                     </div>
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                    title="تسجيل الخروج"
                 >
                     <LogOut size={18} />
                 </button>
             </div>
          </div>
        </aside>

        {/* MAIN CONTENT: FLOATING PANEL */}
        <main className="flex-1 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border border-white/20 min-w-0">
            {view === AppView.DASHBOARD && (
                <DashboardStats teachers={filteredTeachers} reportsMap={reportsMap} onNavigateToPromotions={() => setView(AppView.PROMOTIONS)} fullTeacherCount={teachers.length} selectedSchool={filterSchool} />
            )}
            {view === AppView.DATABASE && (
                <DatabaseManager 
                    teachers={teachers} 
                    reportsMap={reportsMap}
                    tenureReportsMap={tenureReportsMap}
                    onRestore={handleRestoreBackup}
                    currentReport={currentReport}
                    // Pass connection control down to manager
                    onConnectionChange={setIsGoogleConnected}
                    isConnected={isGoogleConnected}
                    onAutoSyncChange={setAutoSyncEnabled}
                    isAutoSync={autoSyncEnabled}
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
        </main>
      </div>
    </div>
  );
};

export default App;