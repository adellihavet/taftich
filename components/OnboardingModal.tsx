
import React, { useState } from 'react';
import { InspectorProfile } from '../types';
import { UserCircle, MapPin, Check, Building2 } from 'lucide-react';

interface OnboardingModalProps {
    onSave: (profile: InspectorProfile) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onSave }) => {
    const [fullName, setFullName] = useState('');
    const [wilaya, setWilaya] = useState('');
    const [district, setDistrict] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (fullName && wilaya && district) {
            onSave({
                fullName,
                wilaya,
                district,
                showSignature: true // Default to true
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-slate-900 to-slate-900"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                            <UserCircle size={40} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold font-serif mb-2">مرحباً بك، سيدي المفتش</h2>
                        <p className="text-slate-400 text-sm">لإعداد حسابك وتسهيل عملك، يرجى ملء هذه المعلومات مرة واحدة.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">الاسم واللقب (كما يظهر في الختم)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-slate-800"
                                placeholder="مثلاً: محمد أحمد"
                            />
                            <UserCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">الولاية</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    required
                                    value={wilaya}
                                    onChange={e => setWilaya(e.target.value)}
                                    className="w-full pl-2 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-slate-800"
                                    placeholder="الجزائر"
                                />
                                <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">المقاطعة</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    required
                                    value={district}
                                    onChange={e => setDistrict(e.target.value)}
                                    className="w-full pl-2 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-slate-800"
                                    placeholder="وسط 1"
                                />
                                <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Check size={20} />
                            حفظ وبدء العمل
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;
