
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Presentation, Printer, Users, FileText, CheckSquare, X, School, MapPin, CalendarDays, Plus, Trash2, Edit, Save, AlertCircle, Lock, Smartphone, Monitor, QrCode, Copy, Share2, Play, Radio, ArrowRight } from 'lucide-react';
import { Teacher, ReportData, SeminarEvent } from '../types';
import VoiceInput from './VoiceInput';
import VoiceTextarea from './VoiceTextarea';
import ReadyMadeSeminars from './ReadyMadeSeminars'; 

interface SeminarsManagerProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    inspectorInfo: {
        name: string;
        district: string;
        wilaya: string;
    };
    signature?: string;
    isExpired?: boolean;
    onUpgradeClick?: () => void;
    initialTopic?: string | null;
    onClearInitialTopic?: () => void;
}

const AVAILABLE_LEVELS = [
    "التربية التحضيرية",
    "السنة الأولى",
    "السنة الثانية",
    "السنة الثالثة",
    "السنة الرابعة",
    "السنة الخامسة"
];

const SeminarsManager: React.FC<SeminarsManagerProps> = ({ 
    teachers, reportsMap, inspectorInfo, signature, isExpired = false, onUpgradeClick,
    initialTopic, onClearInitialTopic
}) => {
    // VIEW STATE
    const [subView, setSubView] = useState<'attendance' | 'calendar' | 'ready-made'>('attendance');

    // --- ATTENDANCE / INQUIRY STATE ---
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [location, setLocation] = useState('');
    const [reference, setReference] = useState(''); 
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [absentTeachers, setAbsentTeachers] = useState<string[]>([]);
    const [inquiryTarget, setInquiryTarget] = useState<Teacher | null>(null);

    // --- CALENDAR STATE (PERSISTENT) ---
    const [calendarTerm, setCalendarTerm] = useState('الثاني');
    
    // Initialize from LocalStorage or use default
    const [calendarRows, setCalendarRows] = useState<SeminarEvent[]>(() => {
        const saved = localStorage.getItem('mufattish_seminars_calendar');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved seminars", e);
            }
        }
        // Default initial state if nothing saved
        return [
            { id: '1', topic: 'يوم دراسي حول...', date: new Date().toISOString().split('T')[0], location: '', isExternalLocation: false, duration: '1/2 يوم', targetLevels: ['السنة الأولى', 'السنة الثانية'], supervisor: 'مفتش المقاطعة', notes: '' }
        ];
    });

    // Save to LocalStorage whenever rows change
    useEffect(() => {
        localStorage.setItem('mufattish_seminars_calendar', JSON.stringify(calendarRows));
    }, [calendarRows]);
    
    // Modal State for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<SeminarEvent | null>(null);

    // --- LOBBY STATE (Interactive Mode) ---
    const [activeLobbyEvent, setActiveLobbyEvent] = useState<SeminarEvent | null>(null);
    const [attendeeCount, setAttendeeCount] = useState(0);
    const lobbyTimerRef = useRef<any>(null);

    // --- HANDLE INCOMING TOPIC (from Dashboard) ---
    useEffect(() => {
        if (initialTopic) {
            setSubView('calendar');
            const newEvent: SeminarEvent = {
                id: Math.random().toString(36).substr(2, 9),
                topic: initialTopic,
                date: new Date().toISOString().split('T')[0],
                location: '',
                isExternalLocation: false,
                duration: '1/2 يوم',
                targetLevels: [],
                supervisor: 'مفتش المقاطعة',
                notes: '',
                isInteractive: false
            };
            setCurrentEvent(newEvent);
            setIsModalOpen(true);
            
            if (onClearInitialTopic) onClearInitialTopic();
        }
    }, [initialTopic, onClearInitialTopic]);

    // --- LOBBY SIMULATION ---
    useEffect(() => {
        if (activeLobbyEvent) {
            // Reset counter
            setAttendeeCount(0);
            // Simulate attendees joining
            lobbyTimerRef.current = setInterval(() => {
                setAttendeeCount(prev => {
                    const add = Math.floor(Math.random() * 3); // 0, 1, or 2 join
                    return Math.min(prev + add, 45); // Max 45 attendees
                });
            }, 2500);
        } else {
            if (lobbyTimerRef.current) clearInterval(lobbyTimerRef.current);
        }
        return () => {
            if (lobbyTimerRef.current) clearInterval(lobbyTimerRef.current);
        };
    }, [activeLobbyEvent]);

    // --- SHARED HELPERS ---
    const availableSchools = useMemo(() => {
        const schools = new Set<string>();
        Object.values(reportsMap).forEach(r => { if(r.school) schools.add(r.school.trim()); });
        return Array.from(schools).sort();
    }, [reportsMap]);

    const getTeacherCountForLevels = (levels: string[]) => {
        if (levels.length === 0) return 0;
        return teachers.filter(t => {
            const report = reportsMap[t.id];
            const teacherLevel = report?.level || '';
            return levels.some(lvl => teacherLevel.includes(lvl));
        }).length;
    };

    // --- ATTENDANCE LOGIC ---
    const toggleLevel = (level: string) => {
        setSelectedLevels(prev => 
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    const targetTeachers = useMemo(() => {
        if (selectedLevels.length === 0) return [];
        return teachers.filter(t => {
            const report = reportsMap[t.id];
            const teacherLevel = report?.level || ''; 
            return selectedLevels.some(lvl => teacherLevel.includes(lvl));
        }).map(t => ({
            ...t,
            schoolName: reportsMap[t.id]?.school || 'غير محددة',
            levelName: reportsMap[t.id]?.level || 'غير محدد'
        })).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    }, [teachers, reportsMap, selectedLevels]);

    const attendancePages = useMemo(() => {
        const pages: (Teacher & { schoolName: string; levelName: string })[][] = [];
        const limit = 18; 
        if (targetTeachers.length === 0) return [];
        let remaining = [...targetTeachers];
        while (remaining.length > 0) {
            pages.push(remaining.slice(0, limit));
            remaining = remaining.slice(limit);
        }
        return pages;
    }, [targetTeachers]);

    const toggleAbsence = (id: string) => {
        setAbsentTeachers(prev => 
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    // --- CALENDAR HANDLERS ---
    const handleAddEvent = () => {
        const newEvent: SeminarEvent = {
            id: Math.random().toString(36).substr(2, 9),
            topic: '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            isExternalLocation: false,
            duration: '1/2 يوم',
            targetLevels: [],
            supervisor: 'مفتش المقاطعة',
            notes: '',
            isInteractive: false
        };
        setCurrentEvent(newEvent);
        setIsModalOpen(true);
    };

    const handleEditEvent = (event: SeminarEvent) => {
        setCurrentEvent({ ...event });
        setIsModalOpen(true);
    };

    const handleDeleteEvent = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه العملية؟')) {
            setCalendarRows(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleSaveEvent = () => {
        if (!currentEvent) return;
        if (!currentEvent.topic) {
            alert('يرجى كتابة موضوع العملية');
            return;
        }
        
        setCalendarRows(prev => {
            const exists = prev.find(r => r.id === currentEvent.id);
            if (exists) {
                return prev.map(r => r.id === currentEvent.id ? currentEvent : r);
            } else {
                return [...prev, currentEvent];
            }
        });
        setIsModalOpen(false);
        setCurrentEvent(null);
    };

    const handleStartEvent = (event: SeminarEvent) => {
        if (event.isInteractive) {
            setActiveLobbyEvent(event);
        } else {
            // Just simulate starting a normal presentation
             if (confirm(`هل تريد بدء العرض التلقيني: "${event.topic}"؟`)) {
                 alert("تم بدء العرض (وضع العرض التلقيني).");
             }
        }
    };

    const handlePrint = () => {
        if (isExpired) {
            onUpgradeClick && onUpgradeClick();
        } else {
            window.print();
        }
    };

    const handleCopyLink = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("تم نسخ رابط المشاركة!");
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            
            {/* SUB-NAVIGATION BAR */}
            <div className="bg-white border-b px-6 py-2 flex items-center justify-between shadow-sm z-20 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setSubView('attendance')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${subView === 'attendance' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <CheckSquare size={16} />
                        إعداد الندوة (الحضور)
                    </button>
                    <button 
                        onClick={() => setSubView('calendar')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${subView === 'calendar' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <CalendarDays size={16} />
                        الرزنامة الفصلية
                    </button>
                    <button 
                        onClick={() => setSubView('ready-made')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${subView === 'ready-made' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Presentation size={16} />
                        عروض جاهزة
                    </button>
                </div>
            </div>

            {/* ======================= READY MADE TOPICS VIEW ======================= */}
            {subView === 'ready-made' && (
                <div className="p-6 md:p-8 flex-1 overflow-y-auto print:hidden animate-in fade-in">
                    <ReadyMadeSeminars inspectorInfo={inspectorInfo} />
                </div>
            )}

            {/* --- INQUIRY MODAL --- */}
            {inquiryTarget && subView === 'attendance' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText size={20} className="text-red-600"/>
                                معاينة الاستفسار
                            </h3>
                            <button onClick={() => setInquiryTarget(null)}><X size={20} className="text-slate-500 hover:text-red-500"/></button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-white flex-1">
                            <div className="text-center font-bold text-gray-400 mb-4 text-xs uppercase tracking-widest border-b pb-2">
                                معاينة فقط (اضغط طباعة للشكل النهائي)
                            </div>
                            <div className="border p-4 rounded bg-gray-50 text-sm space-y-4">
                                <p><strong>إلى السيد(ة):</strong> {inquiryTarget.fullName}</p>
                                <p><strong>الموضوع:</strong> استفسار حول الغياب</p>
                                <p className="leading-loose text-gray-600">
                                    بناءً على ما جاء في الموضوع {reference ? 'والمرجع أعلاه' : 'أعلاه'}، يشرفني أن أطلب منكم موافاتي بتقرير مفصل ومبرر حول أسباب غيابكم عن الندوة التربوية التي عُقدت يوم <b>{date}</b> بـ: <b>{location}</b> تحت عنوان "<b>{title}</b>".
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                            <button onClick={() => setInquiryTarget(null)} className="px-4 py-2 rounded text-slate-600 hover:bg-slate-200 font-bold">إلغاء</button>
                            <button onClick={handlePrint} className={`bg-red-600 text-white px-6 py-2 rounded shadow flex items-center gap-2 hover:bg-red-700 font-bold ${isExpired ? 'opacity-70' : ''}`}>
                                {isExpired ? <Lock size={18}/> : <Printer size={18}/>} طباعة الاستفسار
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SEMINAR ADD/EDIT MODAL --- */}
            {isModalOpen && currentEvent && subView === 'calendar' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden animate-in fade-in zoom-in-95">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-indigo-600 text-white p-4 border-b flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <CalendarDays size={20}/>
                                {calendarRows.find(r => r.id === currentEvent.id) ? 'تعديل العملية' : 'إضافة عملية جديدة'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            
                            {/* NEW: INTERACTIVE TOGGLE */}
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentEvent.isInteractive ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        {currentEvent.isInteractive ? <Smartphone size={20} /> : <Monitor size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 text-sm">نوع العرض</h4>
                                        <p className="text-xs text-indigo-600/70">
                                            {currentEvent.isInteractive ? 'عرض تفاعلي (يتطلب مشاركة عبر الهاتف)' : 'عرض تلقيني (إلقاء تقليدي)'}
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={currentEvent.isInteractive || false}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, isInteractive: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">تفاعلي</span>
                                </label>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">موضوع العملية</label>
                                <VoiceInput 
                                    value={currentEvent.topic} 
                                    onChange={v => setCurrentEvent({ ...currentEvent, topic: v })} 
                                    placeholder="مثلاً: يوم دراسي حول المقاربة بالكفاءات..."
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ</label>
                                    <input 
                                        type="date" 
                                        value={currentEvent.date} 
                                        onChange={e => setCurrentEvent({ ...currentEvent, date: e.target.value })}
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">المدة</label>
                                    <select 
                                        value={currentEvent.duration} 
                                        onChange={e => setCurrentEvent({ ...currentEvent, duration: e.target.value })}
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="1/2 يوم">نصف يوم (1/2)</option>
                                        <option value="1 يوم">يوم كامل (1)</option>
                                        <option value="2 يوم">يومان (2)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Location (Smart) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">المكان</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setCurrentEvent({ ...currentEvent, isExternalLocation: false, location: '' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded border ${!currentEvent.isExternalLocation ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                        >
                                            مدرسة بالمقاطعة
                                        </button>
                                        <button 
                                            onClick={() => setCurrentEvent({ ...currentEvent, isExternalLocation: true, location: '' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded border ${currentEvent.isExternalLocation ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                        >
                                            مكان خارجي (معهد/ثانوية)
                                        </button>
                                    </div>
                                    
                                    {!currentEvent.isExternalLocation ? (
                                        <select 
                                            value={currentEvent.location} 
                                            onChange={e => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="">-- اختر المدرسة --</option>
                                            {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    ) : (
                                        <VoiceInput 
                                            value={currentEvent.location} 
                                            onChange={v => setCurrentEvent({ ...currentEvent, location: v })} 
                                            placeholder="اكتب اسم المكان..."
                                            className="w-full"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Target Levels (Multi-Select Chips) */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-bold text-gray-700">الفئة المستهدفة</label>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                        العدد الحالي: {getTeacherCountForLevels(currentEvent.targetLevels)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_LEVELS.map(lvl => {
                                        const isSelected = currentEvent.targetLevels.includes(lvl);
                                        return (
                                            <button
                                                key={lvl}
                                                onClick={() => {
                                                    const newLevels = isSelected 
                                                        ? currentEvent.targetLevels.filter(l => l !== lvl)
                                                        : [...currentEvent.targetLevels, lvl];
                                                    setCurrentEvent({ ...currentEvent, targetLevels: newLevels });
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
                                            >
                                                {lvl} {isSelected && <span className="mr-1">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Supervisor */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">المشرف على العملية</label>
                                    <VoiceInput 
                                        value={currentEvent.supervisor} 
                                        onChange={v => setCurrentEvent({ ...currentEvent, supervisor: v })} 
                                        className="w-full"
                                    />
                                </div>
                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
                                    <VoiceInput 
                                        value={currentEvent.notes} 
                                        onChange={v => setCurrentEvent({ ...currentEvent, notes: v })} 
                                        placeholder="اختياري..."
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">إلغاء</button>
                            <button onClick={handleSaveEvent} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-colors">
                                <Save size={18} />
                                حفظ المعلومات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- INTERACTIVE LOBBY MODAL --- */}
            {activeLobbyEvent && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative border border-slate-700/50 flex flex-col md:flex-row h-[85vh] max-h-[700px]">
                        
                        <button 
                            onClick={() => setActiveLobbyEvent(null)}
                            className="absolute top-4 left-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white rounded-full transition-all"
                        >
                            <X size={24} />
                        </button>

                        {/* Left: Engagement Visuals */}
                        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-900 to-violet-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                            
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 mb-6">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <span className="text-xs font-bold tracking-widest uppercase">Live Session</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-4">
                                    {activeLobbyEvent.topic}
                                </h2>
                                <p className="text-indigo-200 text-sm">{inspectorInfo.wilaya} - {inspectorInfo.district}</p>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-indigo-200 text-xs font-bold uppercase mb-2">عدد المتصلين الآن</p>
                                    <div className="text-6xl font-bold font-mono tracking-tighter tabular-nums flex items-center justify-center gap-2">
                                        <Users size={32} className="text-indigo-400"/>
                                        {attendeeCount}
                                    </div>
                                    <p className="text-[10px] text-indigo-300/50 mt-2 animate-pulse">جاري الاتصال...</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Joining Info */}
                        <div className="flex-1 bg-white p-10 flex flex-col items-center justify-center text-center relative">
                            
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">انضم للجلسة التفاعلية</h3>
                                <p className="text-slate-500">امسح الرمز بهاتفك أو استخدم الرابط أدناه</p>
                            </div>

                            <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-slate-100 mb-8 transform hover:scale-105 transition-transform duration-300">
                                {/* Use generic QR API */}
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://live.mufattish.dz/join/${activeLobbyEvent.id}`} 
                                    alt="QR Code" 
                                    className="w-64 h-64 object-contain mix-blend-multiply"
                                />
                            </div>

                            <div className="w-full max-w-sm">
                                <div className="flex items-center gap-2 bg-slate-100 p-2 pl-4 rounded-xl border border-slate-200 mb-6 group">
                                    <span className="flex-1 text-left text-slate-600 font-mono text-sm truncate dir-ltr">
                                        live.mufattish.dz/join/{activeLobbyEvent.id.substring(0,4)}
                                    </span>
                                    <button 
                                        onClick={() => handleCopyLink(`https://live.mufattish.dz/join/${activeLobbyEvent.id}`)}
                                        className="p-2 bg-white text-slate-500 hover:text-indigo-600 rounded-lg shadow-sm hover:shadow transition-all"
                                        title="نسخ الرابط"
                                    >
                                        <Copy size={16}/>
                                    </button>
                                </div>

                                <button 
                                    onClick={() => alert("تم بدء الجلسة! (سيتم توجيهك لشاشة العرض)")}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 group"
                                >
                                    <span>انطلاق الجلسة</span>
                                    <ArrowRight className="group-hover:-translate-x-1 transition-transform"/>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ======================= ATTENDANCE & INQUIRY VIEW ======================= */}
            {subView === 'attendance' && (
                <div className="p-6 md:p-8 flex-1 overflow-y-auto print:hidden animate-in fade-in">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Configuration */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg text-indigo-800 mb-4 flex items-center gap-2">
                                <CheckSquare size={20}/> إعداد الندوة (للحضور والاستفسار)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <VoiceInput label="عنوان الندوة" value={title} onChange={setTitle} placeholder="مثلاً: بيداغوجيا الإدماج..." />
                                <VoiceInput label="المكان (مدرسة، معهد...)" value={location} onChange={setLocation} placeholder="مثلاً: ابتدائية 1 نوفمبر / المعهد التكنولوجي..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <VoiceInput type="date" label="التاريخ" value={date} onChange={setDate} />
                                <VoiceInput label="المرجع (رزنامة/استدعاء - اختياري)" value={reference} onChange={setReference} placeholder="رقم .... المؤرخ في ...." />
                            </div>
                            <div className="border-t pt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-3">الفئة المستهدفة (المستويات المعنية):</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_LEVELS.map(lvl => (
                                        <button key={lvl} onClick={() => toggleLevel(lvl)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedLevels.includes(lvl) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        {targetTeachers.length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-slate-500"/>
                                        <span className="font-bold text-slate-700">القائمة الاسمية ({targetTeachers.length} أستاذ)</span>
                                    </div>
                                    <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 flex items-center gap-2">
                                        {isExpired ? <Lock size={16}/> : <Printer size={16}/>} طباعة ورقة الحضور
                                    </button>
                                </div>
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-100 text-slate-600 font-bold">
                                        <tr>
                                            <th className="p-3 w-12">#</th>
                                            <th className="p-3">الاسم واللقب</th>
                                            <th className="p-3">المدرسة</th>
                                            <th className="p-3">المستوى</th>
                                            <th className="p-3 text-center w-32">تسجيل الغياب</th>
                                            <th className="p-3 w-32">إجراء إداري</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {targetTeachers.map((t, idx) => {
                                            const isAbsent = absentTeachers.includes(t.id);
                                            return (
                                                <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${isAbsent ? 'bg-red-50/50' : ''}`}>
                                                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                                                    <td className="p-3 font-bold text-slate-800">{t.fullName}</td>
                                                    <td className="p-3 text-slate-600">{t.schoolName}</td>
                                                    <td className="p-3 text-slate-500 text-xs"><span className="bg-slate-100 px-2 py-1 rounded border">{t.levelName}</span></td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => toggleAbsence(t.id)} className={`w-full py-1.5 rounded text-xs font-bold transition-all border ${isAbsent ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                                                            {isAbsent ? 'غائب' : 'حاضر'}
                                                        </button>
                                                    </td>
                                                    <td className="p-3">
                                                        {isAbsent && (
                                                            <button onClick={() => setInquiryTarget(t)} className="text-red-600 text-xs font-bold hover:underline flex items-center gap-1">
                                                                <FileText size={14}/> استفسار
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <School size={48} className="mx-auto mb-3 opacity-20"/>
                                <p>يرجى اختيار مستوى واحد على الأقل لعرض قائمة الأساتذة المعنيين.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================= CALENDAR VIEW ======================= */}
            {subView === 'calendar' && (
                <div className="p-6 md:p-8 flex-1 overflow-y-auto print:hidden animate-in fade-in">
                    <div className="max-w-6xl mx-auto space-y-6">
                        
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 font-serif">رزنامة الندوات التربوية</h1>
                                <p className="text-slate-500 text-xs">إعداد وطباعة جدول العمليات التكوينية للفصل</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                    <span className="text-xs font-bold text-slate-500">الفصل:</span>
                                    <select value={calendarTerm} onChange={e => setCalendarTerm(e.target.value)} className="bg-transparent text-sm font-bold text-indigo-700 outline-none">
                                        <option value="الأول">الأول</option>
                                        <option value="الثاني">الثاني</option>
                                        <option value="الثالث">الثالث</option>
                                    </select>
                                </div>
                                <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 flex items-center gap-2">
                                    {isExpired ? <Lock size={16}/> : <Printer size={16}/>} معاينة وطباعة
                                </button>
                            </div>
                        </div>

                        {/* Calendar Display Table (Read Only) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                                        <tr>
                                            <th className="p-3 w-10">#</th>
                                            <th className="p-3 w-8">نوع</th>
                                            <th className="p-3">موضوع العملية</th>
                                            <th className="p-3 w-28">التاريخ</th>
                                            <th className="p-3 w-32">المكان</th>
                                            <th className="p-3 w-20">المدة</th>
                                            <th className="p-3">الفئة المستهدفة</th>
                                            <th className="p-3 w-20">العدد</th>
                                            <th className="p-3 w-32">المشرف</th>
                                            <th className="p-3 w-24 text-center">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {calendarRows.map((row, idx) => {
                                            const autoCount = getTeacherCountForLevels(row.targetLevels);
                                            return (
                                                <tr key={row.id} className="hover:bg-slate-50 group">
                                                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                                                    <td className="p-3 text-center" title={row.isInteractive ? "تفاعلي" : "عادي"}>
                                                        {row.isInteractive ? (
                                                            <Smartphone size={16} className="text-purple-600 mx-auto" />
                                                        ) : (
                                                            <Monitor size={16} className="text-slate-400 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-bold text-slate-800">
                                                        {row.topic}
                                                        {row.isInteractive && <span className="mr-2 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">تفاعلي</span>}
                                                    </td>
                                                    <td className="p-3 text-slate-600 dir-ltr">{new Date(row.date).toLocaleDateString('ar-DZ')}</td>
                                                    <td className="p-3 text-slate-600">{row.location || '-'}</td>
                                                    <td className="p-3 text-slate-600">{row.duration}</td>
                                                    <td className="p-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {row.targetLevels.map(lvl => (
                                                                <span key={lvl} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                                                                    {lvl.replace('السنة', 'س')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">{autoCount}</span>
                                                    </td>
                                                    <td className="p-3 text-slate-600 text-xs">{row.supervisor}</td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button 
                                                                onClick={() => handleStartEvent(row)} 
                                                                className={`p-1.5 rounded transition-colors ${row.isInteractive ? 'text-purple-600 hover:bg-purple-50' : 'text-blue-500 hover:bg-blue-50'}`}
                                                                title={row.isInteractive ? "بدء الجلسة التفاعلية" : "بدء العرض"}
                                                            >
                                                                {row.isInteractive ? <Radio size={16}/> : <Play size={16}/>}
                                                            </button>
                                                            <button onClick={() => handleEditEvent(row)} className="text-slate-400 hover:text-blue-500 hover:bg-slate-100 p-1.5 rounded"><Edit size={16}/></button>
                                                            <button onClick={() => handleDeleteEvent(row.id)} className="text-slate-400 hover:text-red-500 hover:bg-slate-100 p-1.5 rounded"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {calendarRows.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="p-8 text-center text-slate-400">
                                                    <AlertCircle size={32} className="mx-auto mb-2 opacity-20"/>
                                                    لا توجد عمليات مبرمجة. اضغط على "إضافة عملية جديدة".
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={handleAddEvent} className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-t">
                                <Plus size={18}/> إضافة عملية جديدة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ################# PRINTABLE AREA ################# */}

            {/* 1. ATTENDANCE & INQUIRY PRINT (Existing) */}
            {subView === 'attendance' && !inquiryTarget && createPortal(
                <div className="hidden print:block absolute top-0 left-0 w-full h-auto bg-white z-[9999] text-black">
                    {attendancePages.map((pageTeachers, pageIndex) => (
                        <div key={pageIndex} className="a4-page relative flex flex-col justify-start" style={{ height: 'auto', minHeight: '0', padding: '10mm 15mm', pageBreakAfter: pageIndex < attendancePages.length - 1 ? 'always' : 'auto', marginBottom: '0' }}>
                            <div className="text-center font-bold text-sm mb-4 space-y-1">
                                <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                                <p>وزارة التربية الوطنية</p>
                                <div className="flex justify-between items-end mt-4 px-2">
                                    <div className="text-right">
                                        <p>مديرية التربية لولاية {inspectorInfo.wilaya}</p>
                                        <p>مفتشية التعليم الابتدائي - المقاطعة: {inspectorInfo.district}</p>
                                    </div>
                                    <div className="text-left border border-black p-1 px-3 rounded">
                                        <p>السنة الدراسية: {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mb-4">
                                <h1 className="text-lg font-bold border-2 border-black inline-block px-6 py-1.5 bg-gray-50 shadow-[3px_3px_0px_0px_black]">
                                    ورقة الحضور للندوة التربوية {attendancePages.length > 1 ? `(صفحة ${pageIndex + 1})` : ''}
                                </h1>
                            </div>
                            <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2 text-xs font-bold bg-gray-50 p-2 rounded border border-gray-300">
                                <p><span className="underline ml-1">الموضوع:</span> {title || '................................'}</p>
                                <p><span className="underline ml-1">التاريخ:</span> {date}</p>
                                <p><span className="underline ml-1">المكان:</span> {location || '...........'}</p>
                            </div>
                            <table className="w-full border-collapse border border-black text-xs text-center" dir="rtl">
                                <thead className="bg-gray-100 h-8">
                                    <tr>
                                        <th className="border border-black p-1 w-10">رقم</th>
                                        <th className="border border-black p-1 w-1/4">اللقب والاسم</th>
                                        <th className="border border-black p-1 w-1/4">المدرسة</th>
                                        <th className="border border-black p-1">المستوى</th>
                                        <th className="border border-black p-1 w-24">الإمضاء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pageTeachers.map((t, idx) => (
                                        <tr key={t.id} style={{ height: '35px' }}>
                                            <td className="border border-black p-1">{(pageIndex * 18) + idx + 1}</td>
                                            <td className="border border-black p-1 font-bold text-right pr-2">{t.fullName}</td>
                                            <td className="border border-black p-1 text-right pr-2">{t.schoolName}</td>
                                            <td className="border border-black p-1">{t.levelName}</td>
                                            <td className="border border-black p-1"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>,
                document.body
            )}

            {/* 2. INQUIRY PRINT (Existing) */}
            {inquiryTarget && subView === 'attendance' && createPortal(
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-visible text-black font-serif top-0 left-0 w-full h-full">
                    <div className="p-12 max-w-[210mm] mx-auto h-full">
                        <div className="text-center font-bold text-sm mb-4 space-y-1">
                            <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                            <p>وزارة التربية الوطنية</p>
                        </div>
                        <div className="flex justify-between items-start font-bold text-sm mb-8 px-2">
                            <div className="text-right"><p>مديرية التربية لولاية {inspectorInfo.wilaya}</p></div>
                            <div className="text-left"><p>مفتشية التعليم الابتدائي - المقاطعة: {inspectorInfo.district}</p></div>
                        </div>
                        <div className="flex justify-end mt-4 pl-4 mb-6">
                            <div className="text-center w-80">
                                <p className="font-bold text-lg mb-1">إلى السيد(ة): {inquiryTarget.fullName}</p>
                                <p className="font-bold text-base mb-1">أستاذ(ة) بمدرسة: {reportsMap[inquiryTarget.id]?.school}</p>
                                <p className="font-bold text-sm">(ع/ط مدير(ة) المدرسة)</p>
                            </div>
                        </div>
                        <h1 className="text-center text-2xl font-bold underline mb-6 decoration-2 underline-offset-8">الموضوع: استفسار حول الغياب</h1>
                        <div className="text-justify text-lg leading-[2.2] px-4">
                            {reference && <p className="mb-1"><span className="font-bold">المرجع:</span> {reference}</p>}
                            <p>بناءً على ما جاء في الموضوع {reference ? 'والمرجع أعلاه' : 'أعلاه'}، يشرفني أن أطلب منكم موافاتي بتقرير مفصل ومبرر حول أسباب غيابكم عن الندوة التربوية التي عُقدت يوم <span className="font-bold">{date}</span> بـ: <span className="font-bold">{location}</span> تحت عنوان "<span className="font-bold">{title}</span>".</p>
                            <p className="mt-2">وذلك في أجل أقصاه 48 ساعة من تاريخ استلامكم لهذا الاستفسار.</p>
                            <p className="mt-6 text-center font-bold">تقبلوا فائق التقدير والاحترام.</p>
                        </div>
                        <div className="mt-8 flex justify-between px-12 font-bold text-lg relative">
                            <div><p>حرر بـ: {inspectorInfo.wilaya}</p><p>في: {new Date().toLocaleDateString('ar-DZ')}</p></div>
                            <div className="text-center w-48 relative">
                                <p className="underline mb-12">المفتش</p>
                                <div className="h-24 w-full flex justify-center items-center relative">
                                    {signature && <img src={signature} alt="Signature" className="absolute -top-4 w-32 h-24 object-contain mix-blend-multiply transform -rotate-6 scale-110 pointer-events-none" />}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                            <h3 className="font-bold underline text-lg mb-2 px-4">رد الأستاذ(ة):</h3>
                            <div className="p-4 min-h-[220px] relative border-2 border-black rounded-lg">
                                <div className="space-y-10 mt-4">
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                    <div className="border-b-2 border-black border-dotted h-1 w-full"></div>
                                </div>
                                <div className="absolute bottom-2 left-4 text-sm font-bold">تأشيرة المدير(ة):</div>
                                <div className="absolute bottom-2 right-4 text-sm font-bold">التاريخ والإمضاء:</div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* 3. CALENDAR PRINT (Landscape) */}
            {subView === 'calendar' && createPortal(
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-visible text-black font-serif top-0 left-0 w-full h-full">
                    <style>{`@page { size: A4 landscape; margin: 0; }`}</style>
                    <div className="a4-page-landscape w-[297mm] h-[210mm] p-[10mm] mx-auto relative flex flex-col justify-between">
                        <div className="w-full mb-4 relative">
                            <div className="text-center font-bold text-sm mb-4">
                                <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                                <p>وزارة التربية الوطنية</p>
                            </div>
                            <div className="text-right font-bold text-xs pr-4">
                                <p>مديرية التربية لولاية {inspectorInfo.wilaya}</p>
                                <p>مفتشية التعليم الابتدائي - المقاطعة: {inspectorInfo.district}</p>
                            </div>
                        </div>
                        <div className="flex justify-center mb-6">
                            <div className="border-2 border-black rounded-[50%] px-16 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white text-center">
                                <h1 className="text-xl font-bold font-serif tracking-wide">رزنامة العمليات التكوينية للفصل {calendarTerm}</h1>
                            </div>
                        </div>
                        <div className="flex-1">
                            <table className="w-full border-collapse border border-black text-center text-sm">
                                <thead>
                                    <tr className="h-10">
                                        <th className="border border-black p-1 w-8">الرقم</th>
                                        <th className="border border-black p-1">موضوع العملية</th>
                                        <th className="border border-black p-1 w-24">تاريخها</th>
                                        <th className="border border-black p-1 w-32">مكانها</th>
                                        <th className="border border-black p-1 w-20">مدة العملية</th>
                                        <th className="border border-black p-1 w-48">الفئة المستهدفة</th>
                                        <th className="border border-black p-1 w-12">العدد</th>
                                        <th className="border border-black p-1 w-32">المشرف على العملية</th>
                                        <th className="border border-black p-1 w-48">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calendarRows.map((row, idx) => {
                                        const count = getTeacherCountForLevels(row.targetLevels);
                                        return (
                                            <tr key={row.id} className="h-12">
                                                <td className="border border-black p-1 font-bold">{idx + 1}</td>
                                                <td className="border border-black p-1 font-bold">{row.topic}</td>
                                                <td className="border border-black p-1">{new Date(row.date).toLocaleDateString('ar-DZ')}</td>
                                                <td className="border border-black p-1">{row.location}</td>
                                                <td className="border border-black p-1">{row.duration}</td>
                                                <td className="border border-black p-1 text-xs">
                                                    {row.targetLevels.map(l => l.replace('السنة', 'س').replace('التربية', '')).join(' + ')}
                                                </td>
                                                <td className="border border-black p-1">{count > 0 ? count : ''}</td>
                                                <td className="border border-black p-1 font-bold text-xs">{row.supervisor}</td>
                                                <td className="border border-black p-1 text-xs text-right">{row.notes}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end px-16 mt-4 pb-4">
                            <div className="text-center relative">
                                <p className="font-bold text-xs mb-2">حرر بـ: {inspectorInfo.wilaya} في: {new Date().toLocaleDateString('ar-DZ')}</p>
                                <p className="font-bold underline mb-16">مفتش التعليم الابتدائي</p>
                                {signature && (
                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-48 h-32 flex items-center justify-center">
                                        <img src={signature} alt="Signature" className="w-full h-full object-contain mix-blend-multiply transform -rotate-6 scale-125" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SeminarsManager;
