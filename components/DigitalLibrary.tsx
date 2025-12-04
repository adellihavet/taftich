
import React, { useState } from 'react';
import { LibraryLink } from '../types';
import { Library, Plus, ExternalLink, Trash2, Link as LinkIcon, FileText } from 'lucide-react';

interface DigitalLibraryProps {
    links: LibraryLink[];
    onUpdateLinks: (links: LibraryLink[]) => void;
}

const DigitalLibrary: React.FC<DigitalLibraryProps> = ({ links, onUpdateLinks }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newCategory, setNewCategory] = useState<LibraryLink['category']>('legislation');

    const handleAddLink = () => {
        if (!newTitle || !newUrl) return;
        const newLink: LibraryLink = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTitle,
            url: newUrl,
            category: newCategory
        };
        onUpdateLinks([...links, newLink]);
        setNewTitle('');
        setNewUrl('');
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if(confirm("حذف هذا الرابط؟")) {
            onUpdateLinks(links.filter(l => l.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col p-6 md:p-10 bg-slate-50 overflow-y-auto">
            <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif flex items-center gap-3">
                        <Library className="text-emerald-600" size={32} />
                        المكتبة التشريعية والرقمية
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-xl">
                        احتفظ بروابط ملفاتك المهمة (Google Drive, Dropbox) للوصول السريع إليها دون إثقال كاهل النظام.
                    </p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all font-bold flex items-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    إضافة رابط جديد
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 mb-8 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-emerald-800 mb-4">إضافة مستند جديد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input 
                            placeholder="عنوان المستند (مثلاً: القانون التوجيهي)" 
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input 
                            placeholder="رابط الملف (Google Drive Link...)" 
                            value={newUrl}
                            onChange={e => setNewUrl(e.target.value)}
                            className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                            dir="ltr"
                        />
                        <select 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value as any)}
                            className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="legislation">تشريع مدرسي</option>
                            <option value="pedagogy">مناهج ووثائق بيداغوجية</option>
                            <option value="admin">نماذج إدارية</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-bold">إلغاء</button>
                        <button onClick={handleAddLink} className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md">حفظ</button>
                    </div>
                </div>
            )}

            {links.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <LinkIcon size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>لا توجد روابط محفوظة بعد.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map(link => (
                        <div key={link.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        link.category === 'legislation' ? 'bg-blue-50 text-blue-600' :
                                        link.category === 'pedagogy' ? 'bg-orange-50 text-orange-600' :
                                        link.category === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'
                                    }`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{link.title}</h4>
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {link.category === 'legislation' ? 'تشريع' : link.category === 'pedagogy' ? 'بيداغوجيا' : link.category === 'admin' ? 'إدارة' : 'عام'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(link.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="mt-auto flex items-center justify-center gap-2 w-full bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <ExternalLink size={14} />
                                فتح الرابط
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DigitalLibrary;
