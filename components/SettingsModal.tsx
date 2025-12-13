
import React, { useState, useRef } from 'react';
import { InspectorProfile } from '../types';
import { X, User, Shield, Image, Upload, Trash2, Key, Check, Save, Stamp, MapPin } from 'lucide-react';
import { updateUserPassword } from '../services/supabaseService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: InspectorProfile;
    onSaveProfile: (profile: InspectorProfile) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSaveProfile }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'signature' | 'security'>('profile');
    
    // Profile State
    const [formData, setFormData] = useState<InspectorProfile>(profile);
    
    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loadingPass, setLoadingPass] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, signatureUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveGeneral = () => {
        onSaveProfile(formData);
        onClose();
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setPassMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPassMessage({ type: 'error', text: 'كلمات المرور غير متطابقة.' });
            return;
        }

        setLoadingPass(true);
        setPassMessage(null);
        
        const { error } = await updateUserPassword(newPassword);
        
        if (error) {
            setPassMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث: ' + error.message });
        } else {
            setPassMessage({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح.' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoadingPass(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-slate-50 border-b p-4 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <User size={24} className="text-indigo-600"/>
                        إعدادات الحساب
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-1/3 bg-slate-50 border-l border-slate-200 p-4 space-y-2">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <User size={18} /> الملف الشخصي
                        </button>
                        <button 
                            onClick={() => setActiveTab('signature')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'signature' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Stamp size={18} /> الختم والإمضاء
                        </button>
                        <button 
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'security' ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Shield size={18} /> الأمان وكلمة السر
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        
                        {/* 1. PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم واللقب (للتوقيع)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={formData.fullName} 
                                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        />
                                        <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">سيظهر هذا الاسم في أسفل جميع التقارير والمراسلات.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الولاية</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.wilaya}
                                                onChange={e => setFormData({...formData, wilaya: e.target.value})}
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                            />
                                            <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">المقاطعة</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.district}
                                                onChange={e => setFormData({...formData, district: e.target.value})}
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                            />
                                            <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. SIGNATURE TAB */}
                        {activeTab === 'signature' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4">
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.showSignature ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <Stamp size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700">تفعيل الختم في الطباعة</p>
                                            <p className="text-xs text-slate-400">إظهار صورة الختم والإمضاء في التقارير</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setFormData({...formData, showSignature: !formData.showSignature})}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.showSignature ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.showSignature ? 'left-1' : 'right-1'}`}></div>
                                    </button>
                                </div>

                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
                                    {formData.signatureUrl ? (
                                        <div className="relative group">
                                            <img src={formData.signatureUrl} alt="Signature" className="max-h-32 mx-auto mix-blend-multiply" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                                <button onClick={() => fileInputRef.current?.click()} className="bg-white p-2 rounded-full text-slate-800 hover:bg-slate-100"><Upload size={18}/></button>
                                                <button onClick={() => setFormData({...formData, signatureUrl: undefined})} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400 py-4">
                                            <Image size={40} className="mb-2 opacity-50"/>
                                            <p className="text-sm font-bold">لا توجد صورة للختم</p>
                                            <button onClick={() => fileInputRef.current?.click()} className="text-indigo-600 text-sm font-bold hover:underline">اضغط لرفع صورة</button>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleSignatureUpload} />
                                </div>
                                <p className="text-xs text-slate-400 text-center">يفضل استخدام صورة بخلفية شفافة (PNG) أو بيضاء.</p>
                            </div>
                        )}

                        {/* 3. SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4">
                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-orange-800 mb-4">
                                    <Key size={24} className="shrink-0"/>
                                    <div className="text-sm">
                                        <p className="font-bold mb-1">تغيير كلمة المرور</p>
                                        <p className="opacity-80 text-xs">سيتم تسجيل خروجك من الأجهزة الأخرى بعد التغيير.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">كلمة المرور الجديدة</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">تأكيد كلمة المرور</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {passMessage && (
                                    <div className={`p-3 rounded-lg text-xs font-bold ${passMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {passMessage.text}
                                    </div>
                                )}

                                <button 
                                    onClick={handleChangePassword}
                                    disabled={loadingPass || !newPassword}
                                    className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-all disabled:opacity-50"
                                >
                                    {loadingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Actions (Only for Profile/Signature) */}
                {activeTab !== 'security' && (
                    <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button onClick={handleSaveGeneral} className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                            <Save size={18} /> حفظ التغييرات
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
