
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Presentation, Play, X, ExternalLink, School, MonitorPlay, Loader2, WifiOff } from 'lucide-react';
import { fetchSeminars, RemoteSeminar } from '../services/supabaseService';

interface ReadyMadeSeminarsProps {
    inspectorInfo: {
        wilaya: string;
        district: string;
    };
}

const ReadyMadeSeminars: React.FC<ReadyMadeSeminarsProps> = ({ inspectorInfo }) => {
    const [activeTopic, setActiveTopic] = useState<{title: string, url: string} | null>(null);
    const [topics, setTopics] = useState<RemoteSeminar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSeminars();
            if (data && data.length > 0) {
                setTopics(data);
            } else {
                // If API returns empty or fails, we could potentially fallback to local, 
                // but let's show empty state or error if strictly dynamic.
                // Assuming empty means no content added yet.
                setTopics([]);
            }
            // Check connectivity indirectly if array is empty but no error thrown
            setLoading(false);
        };
        load();
    }, []);

    // --- FULL SCREEN PRESENTATION MODE ---
    if (activeTopic) {
        return createPortal(
            <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden font-serif" style={{ width: '100vw', height: '100vh' }}>
                
                {/* Close Button */}
                <button 
                    onClick={() => setActiveTopic(null)}
                    className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-all shadow-sm z-50 print:hidden"
                    title="خروج من وضع العرض"
                >
                    <X size={24} />
                </button>

                {/* === OFFICIAL HEADER === */}
                <div className="w-full px-8 pt-6 pb-2 shrink-0 bg-white relative">
                    <div className="relative h-24 flex items-center justify-center w-full mb-2">
                        <div className="absolute right-0 top-0 h-full flex items-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Algeria.svg/320px-Flag_of_Algeria.svg.png" alt="Flag" className="h-16 w-auto object-contain drop-shadow-md"/>
                        </div>
                        <div className="text-center z-10 pt-2">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-wide mb-1">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
                            <h3 className="text-lg md:text-xl font-bold text-slate-800">وزارة التربية الوطنية</h3>
                        </div>
                        <div className="absolute left-0 top-0 h-full flex items-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9.svg/960px-%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9.svg.png?20230207012220" alt="Logo" className="h-20 w-auto object-contain drop-shadow-sm"/>
                        </div>
                    </div>
                    <div className="flex justify-between items-end border-b-4 border-double border-slate-900 pb-2 mt-2">
                        <div className="text-right"><p className="text-sm md:text-base font-bold text-slate-800">مديرية التربية لولاية {inspectorInfo.wilaya}</p></div>
                        <div className="text-left pl-14"><p className="text-sm md:text-base font-bold text-slate-800">مفتشية التعليم الابتدائي م: {inspectorInfo.district}</p></div>
                    </div>
                </div>

                {/* === MAIN SLIDE CONTENT === */}
                <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-6xl mx-auto px-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9.svg/960px-%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9.svg.png?20230207012220" className="w-1/2 h-auto grayscale"/>
                    </div>
                    <div className="relative z-10 space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl text-slate-600 font-bold decoration-slate-300 underline underline-offset-8 decoration-2">ملتقى تكويني حول:</h2>
                            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight drop-shadow-sm py-4">{activeTopic.title}</h1>
                        </div>
                        <div className="w-48 h-1 bg-slate-800 mx-auto rounded-full"></div>
                        <div className="inline-block border-2 border-slate-800 px-12 py-3 rounded-lg bg-slate-50 shadow-md">
                            <p className="text-2xl font-bold text-slate-800">السنة الدراسية: {currentYear} / {nextYear}</p>
                        </div>
                        <div className="pt-8">
                            <a href={activeTopic.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-xl text-2xl font-bold hover:bg-blue-900 hover:scale-105 transition-all shadow-xl hover:shadow-2xl group font-sans">
                                <Play fill="currentColor" size={24} className="group-hover:translate-x-1 transition-transform" />
                                <span>إبـــدأ العرض</span>
                            </a>
                            <p className="mt-4 text-xs text-slate-400 font-sans">سيفتح العرض في نافذة جديدة</p>
                        </div>
                    </div>
                </div>

                {/* === FOOTER === */}
                <div className="w-full bg-white border-t border-slate-200 py-4 px-8 flex justify-between items-center shrink-0">
                    <p className="text-[10px] text-slate-400 font-sans">نظام المفتش التربوي الرقمي</p>
                    <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div><div className="w-2 h-2 rounded-full bg-yellow-500"></div><div className="w-2 h-2 rounded-full bg-red-600"></div></div>
                </div>
            </div>,
            document.body
        );
    }

    // --- GRID VIEW ---
    return (
        <div className="p-6 md:p-8 animate-in fade-in">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">حقيبة الندوات الجاهزة (Live)</h2>
                    <p className="text-slate-500">اختر موضوعاً لبدء العرض التكويني بضغطة زر. المحتوى يتم تحديثه سحابياً.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 size={48} className="animate-spin mb-4 text-indigo-500"/>
                        <p>جاري جلب العروض من السحابة...</p>
                    </div>
                ) : topics.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <WifiOff size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-400 font-bold">لا توجد مواضيع مضافة حالياً.</p>
                        <p className="text-xs text-slate-400 mt-2">يرجى من المدير إضافة المواضيع من لوحة التحكم.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {topics.map((topic, idx) => (
                            <div 
                                key={idx}
                                onClick={() => setActiveTopic(topic)}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group flex flex-col items-center text-center h-full min-h-[220px]"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${topic.color || 'bg-blue-600'} text-white flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                                    <Presentation size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 leading-snug line-clamp-3">
                                    {topic.title}
                                </h3>
                                <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors bg-slate-50 px-3 py-1 rounded-full group-hover:bg-blue-50">
                                    عرض التفاصيل <ExternalLink size={12} />
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReadyMadeSeminars;
