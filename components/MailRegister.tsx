import React, { useState, useEffect, useMemo } from 'react';
import { MailRecord } from '../types';
import { getMailRecords, deleteMailRecord, addMailRecord, getNextMailNumber, updateMailRecord } from '../services/mailStorage';
import { ArrowRight, Book, Plus, Search, Trash2, Archive, ArrowUpRight, ArrowDownLeft, Edit, Save, X, Filter } from 'lucide-react';
import VoiceInput from './VoiceInput';
import VoiceTextarea from './VoiceTextarea';

interface MailRegisterProps {
    onBack: () => void;
}

const MailRegister: React.FC<MailRegisterProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
    const [records, setRecords] = useState<MailRecord[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Edit Modal State
    const [editingRecord, setEditingRecord] = useState<MailRecord | null>(null);
    const [editNote, setEditNote] = useState('');

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCorrespondent, setFilterCorrespondent] = useState('');

    // New Record State
    const [newRecipient, setNewRecipient] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newRef, setNewRef] = useState(''); // For incoming reference
    const [isNoNumber, setIsNoNumber] = useState(false);

    // Auto-calculated next number for display
    const currentYear = new Date().getFullYear();
    const nextNum = getNextMailNumber(activeTab, currentYear);

    useEffect(() => {
        loadRecords();
    }, [activeTab]);

    const loadRecords = () => {
        setRecords(getMailRecords(activeTab));
    };

    const handleDelete = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع.")) {
            deleteMailRecord(id);
            loadRecords();
        }
    };

    const handleEditClick = (record: MailRecord) => {
        setEditingRecord(record);
        setEditNote(record.notes || '');
    };

    const handleSaveEdit = () => {
        if (editingRecord) {
            updateMailRecord({ ...editingRecord, notes: editNote });
            setEditingRecord(null);
            loadRecords();
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMailRecord(activeTab, newRecipient, newSubject, isNoNumber, newRef);
        setShowAddModal(false);
        setNewRecipient('');
        setNewSubject('');
        setNewRef('');
        setIsNoNumber(false);
        loadRecords();
    };

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = 
                r.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.correspondent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.number.includes(searchTerm);
            
            const matchesCorrespondent = filterCorrespondent 
                ? r.correspondent.includes(filterCorrespondent) 
                : true;

            return matchesSearch && matchesCorrespondent;
        });
    }, [records, searchTerm, filterCorrespondent]);

    const correspondents = useMemo(() => {
        return Array.from(new Set(records.map(r => r.correspondent)));
    }, [records]);

    return (
        <div className="h-full flex flex-col bg-slate-100 animate-in fade-in">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
                            <Archive size={24} className="text-amber-600"/>
                            سجل البريد {activeTab === 'outgoing' ? 'الصادر' : 'الوارد'}
                        </h2>
                        <p className="text-xs text-slate-400">تدوين وأرشفة المراسلات الرسمية</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('outgoing')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'outgoing' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        <ArrowUpRight size={18} />
                        سجل الصادر
                    </button>
                    <button 
                        onClick={() => setActiveTab('incoming')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'incoming' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        <ArrowDownLeft size={18} />
                        سجل الوارد
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-md group">
                        <input 
                            type="text" 
                            placeholder="بحث برقم، موضوع، أو جهة..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        />
                        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                    </div>
                    
                    <div className="relative group">
                         <select 
                            value={filterCorrespondent}
                            onChange={(e) => setFilterCorrespondent(e.target.value)}
                            className="pl-3 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none cursor-pointer min-w-[150px]"
                         >
                             <option value="">كل الجهات</option>
                             {correspondents.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                         <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <button 
                    onClick={() => setShowAddModal(true)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${activeTab === 'outgoing' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    <Plus size={20} />
                    تسجيل {activeTab === 'outgoing' ? 'صادرة' : 'واردة'} يدوياً
                </button>
            </div>

            {/* Ledger Table */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="bg-white rounded-xl shadow border border-slate-300 overflow-hidden min-h-[500px] flex flex-col w-full overflow-x-auto">
                    
                    {/* Clean Table without Binder Rings */}
                    <table className="w-full text-right border-collapse min-w-[800px]">
                        <thead className={`${activeTab === 'outgoing' ? 'bg-orange-50 text-orange-900' : 'bg-emerald-50 text-emerald-900'} text-xs font-bold uppercase sticky top-0 z-30 shadow-sm`}>
                            <tr>
                                <th className="p-4 border-b border-slate-200 w-24">الرقم</th>
                                <th className="p-4 border-b border-slate-200 w-32">التاريخ</th>
                                <th className="p-4 border-b border-slate-200 w-1/4">{activeTab === 'outgoing' ? 'المرسل إليه' : 'الجهة المرسلة'}</th>
                                <th className="p-4 border-b border-slate-200">الموضوع</th>
                                {activeTab === 'incoming' ? (
                                    <th className="p-4 border-b border-slate-200 w-32">رقم المراسلة</th>
                                ) : (
                                    <th className="p-4 border-b border-slate-200 w-1/4">ملاحظات</th>
                                )}
                                <th className="p-4 border-b border-slate-200 w-32 text-center bg-gray-50/50">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-serif text-slate-700 bg-white">
                            {filteredRecords.map((rec) => (
                                <tr key={rec.id} className="hover:bg-yellow-50/50 transition-colors group">
                                    <td className="p-4 border-l border-slate-100 font-bold font-mono text-slate-800">
                                        {rec.number} <span className="text-[10px] text-slate-400">/ {rec.year}</span>
                                    </td>
                                    <td className="p-4 border-l border-slate-100 text-sm whitespace-nowrap">
                                        {new Date(rec.date).toLocaleDateString('ar-DZ')}
                                    </td>
                                    <td className="p-4 border-l border-slate-100 font-bold">
                                        {rec.correspondent}
                                    </td>
                                    <td className="p-4 border-l border-slate-100 text-sm leading-relaxed">
                                        {rec.subject}
                                    </td>
                                    
                                    {activeTab === 'incoming' ? (
                                        <td className="p-4 border-l border-slate-100 text-xs text-slate-500 font-mono">
                                            {rec.reference || '-'}
                                        </td>
                                    ) : (
                                        <td className="p-4 border-l border-slate-100 text-xs text-slate-500 truncate max-w-[200px]" title={rec.notes}>
                                            {rec.notes || '-'}
                                        </td>
                                    )}

                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(rec); }}
                                                className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all p-2 rounded-lg shadow-sm border border-blue-200"
                                                title="تعديل الملاحظات"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(rec.id); }}
                                                className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all p-2 rounded-lg shadow-sm border border-red-200"
                                                title="حذف السجل"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        <Book size={48} className="mx-auto mb-2 opacity-20" />
                                        <p>السجل فارغ حالياً.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
                        <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-2">
                            {activeTab === 'outgoing' ? <ArrowUpRight className="text-orange-600"/> : <ArrowDownLeft className="text-emerald-600"/>}
                            تسجيل {activeTab === 'outgoing' ? 'صادر' : 'وارد'} جديد
                        </h3>
                        
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500">الرقم التسلسلي المقترح:</span>
                                <span className="font-mono font-bold text-lg text-blue-600 bg-white px-3 py-1 rounded border border-blue-200 shadow-sm">
                                    {isNoNumber ? 'بدون رقم' : `${nextNum} / ${currentYear}`}
                                </span>
                            </div>

                            {activeTab === 'outgoing' && (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="noNumber" 
                                        checked={isNoNumber} 
                                        onChange={(e) => setIsNoNumber(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="noNumber" className="text-sm text-slate-600 font-bold cursor-pointer">تسجيل كإشعار (بدون رقم تسلسلي)</label>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{activeTab === 'outgoing' ? 'المرسل إليه' : 'الجهة المرسلة'}</label>
                                <VoiceInput value={newRecipient} onChange={setNewRecipient} placeholder="مثلاً: مدير التربية / مدرسة..." className="w-full" />
                            </div>

                            {activeTab === 'incoming' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">رقم المراسلة (للجهة المرسلة)</label>
                                    <input type="text" value={newRef} onChange={(e) => setNewRef(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="رقم .... بتاريخ ...." />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">الموضوع</label>
                                <VoiceInput value={newSubject} onChange={setNewSubject} placeholder="موضوع المراسلة..." className="w-full" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-500 font-bold hover:bg-slate-50">إلغاء</button>
                                <button type="submit" className={`flex-1 py-2.5 rounded-xl text-white font-bold shadow-lg ${activeTab === 'outgoing' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>حفظ في السجل</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT NOTE MODAL */}
            {editingRecord && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Edit size={18} className="text-blue-600"/>
                                تعديل الملاحظات
                            </h3>
                            <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 font-bold mb-1">الموضوع:</p>
                                <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">{editingRecord.subject}</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">الملاحظات (يمكنك استخدام الصوت)</label>
                                <VoiceTextarea 
                                    value={editNote} 
                                    onChange={setEditNote} 
                                    className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="أضف ملاحظاتك هنا..."
                                />
                            </div>

                            <button onClick={handleSaveEdit} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Save size={18} /> حفظ التعديل
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MailRegister;