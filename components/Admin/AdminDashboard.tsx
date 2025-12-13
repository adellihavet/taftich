
import React, { useState, useEffect } from 'react';
import { fetchPendingRequests, approveSubscription, rejectSubscription } from '../../services/subscriptionService';
import { fetchSeminars, addSeminar, deleteSeminar, RemoteSeminar } from '../../services/supabaseService';
import { UserProfile } from '../../types';
import { Check, X, Eye, Shield, Users, RefreshCw, AlertCircle, Calendar, Presentation, Plus, Trash2, Link, Database, Code2 } from 'lucide-react';
import BackendSetupGuide from './BackendSetupGuide'; // Import the new guide

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'subs' | 'content' | 'setup'>('subs');
    
    // Subscriptions State
    const [requests, setRequests] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Seminars State
    const [seminars, setSeminars] = useState<RemoteSeminar[]>([]);
    const [isSeminarsLoading, setIsSeminarsLoading] = useState(false);
    const [newSeminar, setNewSeminar] = useState({ title: '', url: '', color: 'bg-blue-600' });
    const [isAddingSeminar, setIsAddingSeminar] = useState(false);

    useEffect(() => {
        if (activeTab === 'subs') loadRequests();
        if (activeTab === 'content') loadSeminars();
    }, [activeTab]);

    const loadRequests = async () => {
        setLoading(true);
        const data = await fetchPendingRequests();
        setRequests(data);
        setLoading(false);
    };
    
    const loadSeminars = async () => {
        setIsSeminarsLoading(true);
        const data = await fetchSeminars();
        setSeminars(data);
        setIsSeminarsLoading(false);
    };

    // --- Subscription Handlers ---
    const removeRequestFromState = (id: string) => {
        setRequests(prev => prev.filter(r => r.id !== id));
    };

    const handleApprove = async (user: UserProfile) => {
        if (!confirm(`هل أنت متأكد من تفعيل اشتراك ${user.full_name} لمدة ${user.plan_type}؟`)) return;
        
        setActionLoading(user.id);
        const res = await approveSubscription(user.id, user.plan_type || 'monthly');
        
        if (res?.success) {
            removeRequestFromState(user.id);
            alert("تم تفعيل الاشتراك بنجاح!");
        } else {
            alert("فشل التفعيل. تأكد من إعدادات سياسات الأمان (RLS) في Supabase.");
        }
        setActionLoading(null);
    };

    const handleReject = async (user: UserProfile) => {
        if (!confirm(`هل أنت متأكد من رفض طلب ${user.full_name}؟`)) return;

        setActionLoading(user.id);
        const res = await rejectSubscription(user.id);
        
        if (res?.success) {
            removeRequestFromState(user.id);
            alert("تم رفض الطلب وإلغاء المعاملة.");
        } else {
            alert("حدث خطأ أثناء الرفض.");
        }
        setActionLoading(null);
    };

    // --- Seminar Handlers ---
    const handleAddSeminar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSeminar.title || !newSeminar.url) return;
        
        setIsAddingSeminar(true);
        const { data, error } = await addSeminar(newSeminar);
        if (error) {
            alert("فشل الإضافة: " + error.message);
        } else {
            setNewSeminar({ title: '', url: '', color: 'bg-blue-600' });
            loadSeminars(); // Refresh list
        }
        setIsAddingSeminar(false);
    };

    const handleDeleteSeminar = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
        const { error } = await deleteSeminar(id);
        if (error) {
            alert("فشل الحذف");
        } else {
            setSeminars(prev => prev.filter(s => s.id !== id));
        }
    };

    const getPlanLabel = (plan: string | undefined) => {
        switch(plan) {
            case 'monthly': return 'شهر واحد';
            case 'quarterly': return '3 أشهر';
            case 'yearly': return 'سنة كاملة';
            default: return 'غير محدد';
        }
    };

    const COLOR_OPTIONS = [
        { label: 'أزرق', value: 'bg-blue-600' },
        { label: 'أخضر', value: 'bg-emerald-600' },
        { label: 'بنفسجي', value: 'bg-purple-600' },
        { label: 'برتقالي', value: 'bg-orange-600' },
        { label: 'سماوي', value: 'bg-teal-600' },
        { label: 'أحمر', value: 'bg-red-600' },
    ];

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-50">
            
            {/* Modal for Image Preview */}
            {viewingImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button onClick={() => setViewingImage(null)} className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-black hover:bg-red-500 hover:text-white transition-colors"><X size={24}/></button>
                        <img src={viewingImage} alt="Receipt" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/20" />
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl mb-8 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Shield size={200} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
                            <Shield size={16}/> لوحة التحكم المركزية
                        </div>
                        <h1 className="text-3xl font-bold font-serif mb-2">إدارة المنصة</h1>
                        <p className="text-slate-300">التحكم الكامل في الاشتراكات والمحتوى التعليمي</p>
                    </div>
                    
                    {/* Navigation Tabs */}
                    <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-sm z-10">
                        <button 
                            onClick={() => setActiveTab('subs')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'subs' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'}`}
                        >
                            <Users size={16}/> الاشتراكات ({requests.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('content')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'content' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'}`}
                        >
                            <Presentation size={16}/> إدارة العروض
                        </button>
                         <button 
                            onClick={() => setActiveTab('setup')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'setup' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'}`}
                        >
                            <Code2 size={16}/> الربط التقني
                        </button>
                    </div>
                </div>

                {/* --- SUBSCRIPTIONS TAB --- */}
                {activeTab === 'subs' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={20}/> طلبات التفعيل المعلقة</h3>
                            <button onClick={loadRequests} className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors" title="تحديث"><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">جاري تحميل الطلبات...</div>
                        ) : requests.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <Check size={48} className="mb-4 text-emerald-200" />
                                <p>لا توجد طلبات معلقة حالياً.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                                        <tr>
                                            <th className="p-4">المستخدم</th>
                                            <th className="p-4">الخطة المطلوبة</th>
                                            <th className="p-4">تاريخ الطلب</th>
                                            <th className="p-4 text-center">صورة الوصل</th>
                                            <th className="p-4 text-center">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-800">{req.full_name || 'مستخدم بدون اسم'}</p>
                                                    <p className="text-xs text-slate-400 font-mono mt-1 truncate max-w-[200px]">{req.id}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                        req.plan_type === 'yearly' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        req.plan_type === 'quarterly' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {getPlanLabel(req.plan_type)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1"><Calendar size={14}/> اليوم</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {req.payment_receipt_url ? (
                                                        <button 
                                                            onClick={() => setViewingImage(req.payment_receipt_url!)}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Eye size={14}/> معاينة
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-red-400 flex items-center justify-center gap-1"><AlertCircle size={12}/> لا يوجد مرفق</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleReject(req)}
                                                            disabled={actionLoading === req.id}
                                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                                                            title="رفض"
                                                        >
                                                            <X size={18}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleApprove(req)}
                                                            disabled={actionLoading === req.id}
                                                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all disabled:opacity-50"
                                                        >
                                                            {actionLoading === req.id ? <RefreshCw size={16} className="animate-spin"/> : <Check size={16}/>} 
                                                            تفعيل
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- CONTENT TAB (SEMINARS) --- */}
                {activeTab === 'content' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                        
                        {/* ADD FORM */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
                                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                                    <Presentation size={20} className="text-indigo-600"/>
                                    إضافة عرض جديد
                                </h3>
                                <form onSubmit={handleAddSeminar} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">عنوان العرض</label>
                                        <input 
                                            required
                                            value={newSeminar.title}
                                            onChange={e => setNewSeminar({...newSeminar, title: e.target.value})}
                                            className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="مثلاً: المقاربة بالكفاءات..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">رابط العرض (URL)</label>
                                        <div className="relative">
                                            <input 
                                                required
                                                value={newSeminar.url}
                                                onChange={e => setNewSeminar({...newSeminar, url: e.target.value})}
                                                className="w-full pl-3 pr-10 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr"
                                                placeholder="https://..."
                                            />
                                            <Link size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2">لون البطاقة</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {COLOR_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setNewSeminar({...newSeminar, color: opt.value})}
                                                    className={`h-8 rounded-lg ${opt.value} hover:opacity-80 transition-opacity relative flex items-center justify-center`}
                                                    title={opt.label}
                                                >
                                                    {newSeminar.color === opt.value && <Check size={16} className="text-white"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isAddingSeminar}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                                    >
                                        {isAddingSeminar ? <RefreshCw size={18} className="animate-spin"/> : <Plus size={18}/>}
                                        نشر العرض
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* LIST */}
                        <div className="lg:col-span-2">
                             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">العروض المنشورة ({seminars.length})</h3>
                                    <button onClick={loadSeminars} className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"><RefreshCw size={18} className={isSeminarsLoading ? 'animate-spin' : ''}/></button>
                                </div>
                                
                                {seminars.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">لا توجد عروض مضافة.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {seminars.map(sem => (
                                            <div key={sem.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${sem.color || 'bg-blue-600'}`}>
                                                    <Presentation size={24}/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-base">{sem.title}</h4>
                                                    <a href={sem.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block mt-1 dir-ltr text-right">{sem.url}</a>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteSeminar(sem.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>

                    </div>
                )}
                
                {/* --- SETUP TAB (NEW) --- */}
                {activeTab === 'setup' && (
                    <div className="animate-in fade-in h-full">
                        <BackendSetupGuide />
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
