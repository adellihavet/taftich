import React, { useMemo, useState } from 'react';
import { Teacher, ReportData } from '../types';
import { Users, School, GraduationCap, TrendingUp, CheckCircle2, Award, Radar, Trophy, TrendingDown, AlertTriangle, BookOpen, Briefcase, Zap, GitCompare, MonitorSmartphone, ShieldCheck, PenTool, ChevronLeft, Building2, MapPin, Target, LayoutList, LayoutGrid, FileText, PieChart, BarChart3, CheckSquare, Calendar, Lightbulb, ClipboardList, Presentation, ScrollText, PenLine } from 'lucide-react';
import { SEMINAR_SUGGESTIONS } from '../modernConstants';
import { LEGACY_SEMINAR_SUGGESTIONS } from '../legacyConstants';

interface DashboardStatsProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    onNavigateToPromotions?: () => void;
    fullTeacherCount?: number; 
    selectedSchool?: string;
    onProgramSeminar?: (topic: string) => void; // New Callback
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ teachers, reportsMap, onNavigateToPromotions, fullTeacherCount, selectedSchool, onProgramSeminar }) => {
    const [statsView, setStatsView] = useState<'modern' | 'legacy'>('modern');
    const currentYear = new Date().getFullYear();

    // --- Calculations (Global) ---

    // Total Teacher Count (Registered)
    const totalTeachers = fullTeacherCount || teachers.length;
    
    // Visited Teachers (Coverage)
    const visitedTeachersCount = useMemo(() => {
        return teachers.filter(t => {
            const r = reportsMap[t.id];
            // Consider visited if there's a date and mark, or if imported with date
            return r && r.inspectionDate && r.inspectionDate.trim() !== '';
        }).length;
    }, [teachers, reportsMap]);

    const coverageRate = totalTeachers > 0 ? (visitedTeachersCount / totalTeachers) * 100 : 0;

    // Average Mark
    const avgMark = useMemo(() => {
        if (totalTeachers === 0) return "0";
        const sum = teachers.reduce((acc, t) => acc + (t.lastMark || 0), 0);
        return (sum / totalTeachers).toFixed(2);
    }, [teachers]);

    // Unique Schools
    const uniqueSchools = useMemo(() => {
        const schools = new Set<string>();
        Object.values(reportsMap).forEach((r: ReportData) => {
            if (r.school) schools.add(r.school.trim());
        });
        return schools.size;
    }, [reportsMap]);

    // Status Distribution
    const statusCounts = useMemo(() => {
        const counts = { titulaire: 0, contractuel: 0, stagiere: 0 };
        teachers.forEach(t => {
            if (t.status === 'titulaire' || t.status === 'contractuel' || t.status === 'stagiere') {
                 counts[t.status]++;
            }
        });
        return counts;
    }, [teachers]);

    // --- SCHOOL RANKING (Global) ---
    const schoolRankings = useMemo(() => {
        const schoolStats: Record<string, { totalMark: number, count: number }> = {};
        
        teachers.forEach(t => {
            const r = reportsMap[t.id];
            if (r && r.school && r.finalMark) {
                const name = r.school.trim();
                if (!schoolStats[name]) schoolStats[name] = { totalMark: 0, count: 0 };
                schoolStats[name].totalMark += r.finalMark;
                schoolStats[name].count += 1;
            }
        });

        const sorted = Object.entries(schoolStats).map(([name, stat]) => ({
            name,
            avg: stat.totalMark / stat.count,
            count: stat.count
        })).sort((a, b) => b.avg - a.avg);

        return {
            top3: sorted.slice(0, 3),
            bottom3: sorted.slice(-3).reverse(), // Reverse to show lowest first in the "Need Support" list
            total: sorted.length
        };
    }, [teachers, reportsMap]);


    // --- PROMOTION CANDIDATES COUNT (Fixed Logic) ---
    const promotionCount = useMemo(() => {
        // Retrieve settings from LocalStorage to match PromotionList logic
        const enableBonification = localStorage.getItem('mufattish_promo_bonus_enabled') === 'true';
        const bonusMonths = parseInt(localStorage.getItem('mufattish_promo_bonus_months') || '3');
        const campaignYear = new Date().getFullYear();

        return teachers.filter(t => {
            // 1. Basic Eligibility
            if (t.status !== 'titulaire' || !t.echelonDate || !t.echelon) return false;
            
            const currentEchelon = parseInt(t.echelon);
            // RULE: Max Echelon is 12
            if (currentEchelon >= 12) return false;

            const echelonDate = new Date(t.echelonDate);
            if (isNaN(echelonDate.getTime())) return false;

            // --- CALCULATION LOGIC ---
            let requiredRealMonths = 30; // Standard 2.5 years

            if (enableBonification) {
                const accelerationRatio = (12 + bonusMonths) / 12;
                requiredRealMonths = 30 / accelerationRatio;
            }

            // Calculate eligibility date
            const eligibilityDate = new Date(echelonDate);
            const daysToAdd = requiredRealMonths * 30.44; 
            eligibilityDate.setDate(eligibilityDate.getDate() + daysToAdd);
            
            const cutOffDate = new Date(campaignYear, 11, 31);

            // Condition 1: Time
            if (eligibilityDate > cutOffDate) return false;

            // Condition 2: Mark Ceiling
            const maxAllowedMark = 13 + (currentEchelon * 0.5);
            if (t.lastMark >= maxAllowedMark) return false;

            // Condition 3: Already Visited
            const activeReport = reportsMap[t.id];
            if (activeReport) {
                const isDateFilled = activeReport.inspectionDate && activeReport.inspectionDate.trim() !== '';
                const isMarkFilled = activeReport.finalMark !== undefined && activeReport.finalMark > 0;
                if (isDateFilled && isMarkFilled) return false; 
            }

            return true;
        }).length;
    }, [teachers, reportsMap]);


    // --- MODERN SPECIFIC STATS ---

    // Students by Level (Fixed: Summing actual student counts from ALL reports)
    const studentsByLevel = useMemo(() => {
        const levels: Record<string, number> = {};
        
        // Use all available reports to get student counts, even if not visited this year
        Object.values(reportsMap).forEach(r => {
             // Basic check to ensure it belongs to a teacher in current context if filtered
             if (selectedSchool && r.school !== selectedSchool) return;

             if (r.level) {
                const lvl = r.level.trim();
                const count = r.studentCount || 0; 
                levels[lvl] = (levels[lvl] || 0) + count;
             }
        });

        const sortOrder = ['التربية التحضيرية', 'السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة'];
        return Object.entries(levels)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => {
                const idxA = sortOrder.indexOf(a.name);
                const idxB = sortOrder.indexOf(b.name);
                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            });
    }, [reportsMap, selectedSchool]);
    
    const totalStudentsSum = useMemo(() => studentsByLevel.reduce((acc, curr) => acc + curr.count, 0), [studentsByLevel]);

    // Comparative Analysis (Modern: ID-based)
    const comparativeAnalysis = useMemo(() => {
        const juniors = { count: 0, tech: 0, control: 0, planning: 0 };
        const seniors = { count: 0, tech: 0, control: 0, planning: 0 };
        
        // IDs Mapping based on DEFAULT_OBSERVATION_TEMPLATE
        const techIds = ['env-phy-3']; // التكنولوجيا
        const controlIds = ['env-disc-1', 'env-disc-2']; // النظام، الحركة
        const planningIds = ['plan-1', 'plan-4']; // المخطط السنوي، الأهداف

        teachers.forEach(t => {
            const report = reportsMap[t.id];
            if (!report || !t.recruitmentDate || report.reportModel === 'legacy') return;

            const start = new Date(t.recruitmentDate);
            const years = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const isJunior = years <= 10;
            const target = isJunior ? juniors : seniors;

            const getDomainScore = (ids: string[]) => {
                let sum = 0;
                let max = 0;
                report.observations.forEach(obs => {
                    if (ids.includes(obs.id)) {
                        if (obs.score !== null) {
                            sum += obs.score;
                            max += 2;
                        }
                    }
                });
                return max > 0 ? (sum / max) * 100 : 0;
            };

            target.count++;
            target.tech += getDomainScore(techIds);
            target.control += getDomainScore(controlIds);
            target.planning += getDomainScore(planningIds);
        });

        const normalize = (target: typeof juniors) => {
            if (target.count === 0) return;
            target.tech /= target.count;
            target.control /= target.count;
            target.planning /= target.count;
        };

        normalize(juniors);
        normalize(seniors);

        return { juniors, seniors };
    }, [teachers, reportsMap]);

    // Weakest Criteria & Training Suggestions (Modern)
    const trainingPlan = useMemo(() => {
        const stats: Record<string, { sum: number; count: number; category: string }> = {};

        teachers.forEach(t => {
            const report = reportsMap[t.id];
            if(report && report.reportModel !== 'legacy') {
                report.observations.forEach(obs => {
                    if (obs.score !== null) {
                        if (!stats[obs.criteria]) {
                            stats[obs.criteria] = { sum: 0, count: 0, category: obs.category };
                        }
                        stats[obs.criteria].sum += obs.score;
                        stats[obs.criteria].count += 1;
                    }
                });
            }
        });

        const weakest = Object.entries(stats)
            .map(([name, data]) => ({
                name,
                category: data.category,
                avg: (data.sum / data.count / 2) * 100
            }))
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 5);

        return weakest.map(item => {
            const suggestions = SEMINAR_SUGGESTIONS[item.category] || ["ورشة تكوينية عامة في " + item.category];
            const title = suggestions[0]; 
            return { ...item, suggestedTitle: title };
        });
    }, [teachers, reportsMap]);

    // Radar Chart Data (Modern)
    const radarData = useMemo(() => {
        const domains = [
            'التخطيط', 'التنفيذ', 'التقويم', 
            'العمل المنهجي', 'التواصل', 'المسؤولية', 
            'البيئة المادية', 'ضبط الصف', 'المشاركة'
        ];
        
        const scores: Record<string, { sum: number, count: number }> = {};
        domains.forEach(d => scores[d] = { sum: 0, count: 0 });

        teachers.forEach(t => {
            const report = reportsMap[t.id];
            if(report && report.reportModel !== 'legacy') {
                report.observations.forEach(obs => {
                    let key = '';
                    if (obs.category === 'التخطيط') key = 'التخطيط';
                    else if (obs.category === 'التنفيذ') key = 'التنفيذ';
                    else if (obs.category === 'التقويم') key = 'التقويم';
                    else if (obs.category === 'العمل المنهجي') key = 'العمل المنهجي';
                    else if (obs.category.includes('التواصل')) key = 'التواصل';
                    else if (obs.category.includes('المسؤولية')) key = 'المسؤولية';
                    else if (obs.category === 'البيئة المادية') key = 'البيئة المادية';
                    else if (obs.category === 'ضبط الصف') key = 'ضبط الصف';
                    else if (obs.category.includes('المشاركة')) key = 'المشاركة';

                    if (key && obs.score !== null) {
                        scores[key].sum += obs.score; 
                        scores[key].count += 1;
                    }
                });
            }
        });

        return domains.map(domain => {
            const s = scores[domain];
            const value = s.count > 0 ? (s.sum / s.count / 2) * 100 : 0;
            return { domain, value };
        });
    }, [teachers, reportsMap]);


    // --- LEGACY SPECIFIC STATS ---

    const legacyStats = useMemo(() => {
        let totalLegacyReports = 0;
        
        // Metrics
        const preparation = { excellent: 0, good: 0, weak: 0 };
        const objectives = { full: 0, partial: 0, none: 0 };
        const notebooks = { good: 0, average: 0, bad: 0 };
        
        // Weakness Tracking for Hybrid Suggestions
        const weaknesses = {
            planning: 0, // From Preparation
            methodology: 0, // From Objectives & Execution
            evaluation: 0, // From Notebooks Correction
            environment: 0 // From Board/Cleanliness
        };

        teachers.forEach(t => {
            const r = reportsMap[t.id];
            if (r && r.reportModel === 'legacy' && r.legacyData) {
                totalLegacyReports++;
                const ld = r.legacyData;

                // 1. Preparation Analysis
                if (ld.preparationValue.includes('ممتازة') || ld.preparationValue.includes('جيدة')) preparation.good++;
                else if (ld.preparationValue.includes('ضعيفة') || ld.preparationValue.includes('منعدم')) {
                    preparation.weak++;
                    weaknesses.planning++;
                } else preparation.excellent++; 

                // 2. Objectives Analysis
                if (ld.objectivesAchieved.includes('كلياً')) objectives.full++;
                else if (ld.objectivesAchieved.includes('جزئياً')) objectives.partial++;
                else {
                    objectives.none++;
                    weaknesses.methodology++;
                }

                // 3. Notebooks Analysis
                if (ld.notebooksCare.includes('حسنة')) notebooks.good++;
                else if (ld.notebooksCare.includes('سيئة') || ld.notebooksCare.includes('مهملة')) {
                    notebooks.bad++;
                    weaknesses.evaluation++;
                } else notebooks.average++;

                // 4. Other Weakness Triggers
                if (ld.boardWork.includes('عشوائية') || ld.cleanliness.includes('ناقصة')) weaknesses.environment++;
            }
        });

        // Generate Recommendations based on Legacy Data using CONSTANTS
        const recommendations = [];
        const threshold = 1; // Lower threshold to show suggestions even with few reports

        if (weaknesses.planning >= threshold) {
            // Get random suggestion or first one
            const title = LEGACY_SEMINAR_SUGGESTIONS['التخطيط'][0];
            recommendations.push({ title, count: weaknesses.planning, type: 'التخطيط' });
        }
        if (weaknesses.methodology >= threshold) {
            const title = LEGACY_SEMINAR_SUGGESTIONS['التنفيذ'][0];
            recommendations.push({ title, count: weaknesses.methodology, type: 'التنفيذ' });
        }
        if (weaknesses.evaluation >= threshold) {
             const title = LEGACY_SEMINAR_SUGGESTIONS['التقويم'][0];
             recommendations.push({ title, count: weaknesses.evaluation, type: 'التقويم' });
        }
        if (weaknesses.environment >= threshold) {
             const title = LEGACY_SEMINAR_SUGGESTIONS['بيئة الصف'][0];
             recommendations.push({ title, count: weaknesses.environment, type: 'بيئة الصف' });
        }

        return { 
            total: totalLegacyReports, 
            preparation, 
            objectives, 
            notebooks, 
            recommendations: recommendations.sort((a,b) => b.count - a.count)
        };
    }, [teachers, reportsMap]);

    
    // --- Helper Components ---
    const CoverageWidget = () => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">نسبة تغطية المقاطعة</p>
                    <h3 className="text-3xl font-bold text-slate-800">{visitedTeachersCount} <span className="text-sm text-slate-400 font-medium">/ {totalTeachers}</span></h3>
                </div>
                <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="6" 
                            strokeDasharray={`${(coverageRate * 175) / 100} 175`} 
                            strokeLinecap="round" 
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                        {coverageRate.toFixed(0)}%
                    </div>
                </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${coverageRate}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-right">عدد الزيارات المنجزة مقارنة بالعدد الكلي</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50/50">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex w-full md:w-auto">
                        <button 
                            onClick={() => setStatsView('modern')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${statsView === 'modern' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid size={16} />
                            المقاربة الحديثة
                        </button>
                        <button 
                            onClick={() => setStatsView('legacy')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${statsView === 'legacy' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <ScrollText size={16} />
                            النموذج الكلاسيكي
                        </button>
                    </div>
                </div>

                {selectedSchool && (
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm animate-in fade-in border border-indigo-100">
                        <School size={16} />
                        تقرير مدرسة: {selectedSchool}
                    </div>
                )}
            </div>
            
            {/* 1. Global KPIs Row (Common) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <CoverageWidget />
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">تعداد التلاميذ (المسجلين)</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-slate-800">{totalStudentsSum}</span>
                        <span className="text-sm text-slate-400 mb-1">تلميذ</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                        <TrendingUp size={12}/>
                        <span>إحصاء شامل</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">عدد المدارس</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-purple-600">{uniqueSchools}</span>
                        <span className="text-sm text-slate-400 mb-1">مؤسسة</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit">
                        <School size={12}/>
                        <span>إحصاء المؤسسات</span>
                    </div>
                </div>

                <div onClick={onNavigateToPromotions} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg shadow-indigo-200 text-white cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={80}/></div>
                     <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">المعنيون بالترقية</p>
                     <div className="flex items-end gap-2 relative z-10">
                        <span className="text-4xl font-bold">{promotionCount}</span>
                        <span className="text-sm text-indigo-200 mb-1">حالة</span>
                     </div>
                     <div className="mt-4 flex items-center gap-1 text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded backdrop-blur-sm">
                         <span>اضغط للتفاصيل</span>
                         <ChevronLeft size={10}/>
                     </div>
                </div>
            </div>

            {/* VIEW: LEGACY ANALYTICS */}
            {statsView === 'legacy' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold bg-amber-50 px-4 py-2 rounded-lg w-fit border border-amber-100">
                        <ScrollText size={18} />
                        <span>تحليل بيانات النموذج الكلاسيكي ({legacyStats.total} تقرير)</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 1. Preparation Quality */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <PenLine className="text-blue-500" size={20} />
                                    جودة الإعداد الكتابي
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-600">إعداد جيد/ممتاز</span><span className="text-emerald-600">{legacyStats.preparation.good + legacyStats.preparation.excellent}</span></div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(legacyStats.total > 0 ? ((legacyStats.preparation.good + legacyStats.preparation.excellent)/legacyStats.total)*100 : 0)}%` }}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-600">إعداد ضعيف/منعدم</span><span className="text-red-600">{legacyStats.preparation.weak}</span></div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${(legacyStats.total > 0 ? (legacyStats.preparation.weak/legacyStats.total)*100 : 0)}%` }}></div></div>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4">بناءً على حقل "قيمة الإعداد"</p>
                        </div>

                        {/* 2. Objectives Achievement */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-6">
                                <Target className="text-amber-500" size={20} />
                                تحقيق الأهداف
                            </h3>
                            <div className="flex items-center justify-center gap-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-xl font-bold text-emerald-700 bg-emerald-50 mb-2">
                                        {legacyStats.total > 0 ? Math.round((legacyStats.objectives.full / legacyStats.total) * 100) : 0}%
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">تحقق كلي</span>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-orange-400 flex items-center justify-center text-xl font-bold text-orange-700 bg-orange-50 mb-2">
                                        {legacyStats.total > 0 ? Math.round((legacyStats.objectives.partial / legacyStats.total) * 100) : 0}%
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">تحقق جزئي</span>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-red-400 flex items-center justify-center text-xl font-bold text-red-700 bg-red-50 mb-2">
                                        {legacyStats.total > 0 ? Math.round((legacyStats.objectives.none / legacyStats.total) * 100) : 0}%
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">لم يتحقق</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Notebooks Care */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                                <BookOpen className="text-purple-500" size={20} />
                                العناية بالدفاتر
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold w-12 text-slate-500">حسنة</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${(legacyStats.total > 0 ? (legacyStats.notebooks.good / legacyStats.total) * 100 : 0)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-purple-600">{legacyStats.notebooks.good}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold w-12 text-slate-500">متوسطة</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-300" style={{ width: `${(legacyStats.total > 0 ? (legacyStats.notebooks.average / legacyStats.total) * 100 : 0)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-purple-400">{legacyStats.notebooks.average}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold w-12 text-slate-500">سيئة</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-400" style={{ width: `${(legacyStats.total > 0 ? (legacyStats.notebooks.bad / legacyStats.total) * 100 : 0)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-red-500">{legacyStats.notebooks.bad}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* HYBRID INTELLIGENCE: Recommendations from Legacy Data */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Presentation className="text-amber-600" size={20} />
                                خطة التكوين المقترحة (تحليل هجين)
                            </h3>
                            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">مبني على نقائص الكلاسيكي</span>
                        </div>
                        
                        <div className="space-y-3">
                            {legacyStats.recommendations.length > 0 ? legacyStats.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-700 text-sm">{rec.title}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1">بناءً على ضعف في مجال: {rec.type} ({rec.count} حالة)</p>
                                    </div>
                                    <button 
                                        onClick={() => onProgramSeminar && onProgramSeminar(rec.title)}
                                        className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        برمجة
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-400">
                                    <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                                    <p className="text-sm">لا توجد نقائص ملحوظة في التقارير الكلاسيكية.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: MODERN ANALYTICS */}
            {statsView === 'modern' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {/* A. School Ranking (New) */}
                    {!selectedSchool && schoolRankings.total > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Schools */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
                                    <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                        <Trophy size={18}/> المدارس المتميزة (Top 3)
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {schoolRankings.top3.map((s, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i===0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>#{i+1}</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                                    <p className="text-[10px] text-slate-500">{s.count} أستاذ</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-sm">{s.avg.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Schools Needing Support */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                        <AlertTriangle size={18}/> مؤسسات تحتاج مرافقة
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {schoolRankings.bottom3.map((s, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">!</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                                    <p className="text-[10px] text-slate-500">{s.count} أستاذ</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm">{s.avg.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* B. Training Plan (Enhanced) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-red-400"></div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Presentation className="text-red-500" size={20} />
                                    خطة التكوين المقترحة (الندوات)
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                {trainingPlan.length > 0 ? trainingPlan.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-red-200 transition-colors group">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="font-bold text-slate-700 text-sm">{item.suggestedTitle}</h4>
                                                <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded text-red-500">
                                                    تحكم: {item.avg.toFixed(0)}%
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Target size={10}/> يستهدف معيار: {item.name} ({item.category})
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => onProgramSeminar && onProgramSeminar(item.suggestedTitle)}
                                            className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            برمجة
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20 text-emerald-500" />
                                        <p className="text-sm">لا توجد احتياجات تكوينية ملحة حالياً.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* C. Competency Map (Radar with Labels) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                            <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2 w-full">
                                <Radar className="text-indigo-500" size={20} />
                                خارطة الكفاءات المهنية
                            </h3>
                            <p className="text-xs text-slate-400 mb-6 w-full">توزيع نقاط القوة والضعف حسب المجالات</p>
                            
                            <div className="relative w-64 h-64">
                                {/* Simple SVG Radar Implementation with Labels */}
                                <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                                    {/* Grid Circles */}
                                    {[20, 40, 60, 80, 100].map(r => (
                                        <circle key={r} cx="100" cy="100" r={r * 0.8} fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
                                    ))}
                                    
                                    {/* Axis Lines */}
                                    {radarData.map((_, i) => {
                                        const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                        const x = 100 + 80 * Math.cos(angle);
                                        const y = 100 + 80 * Math.sin(angle);
                                        return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#f1f5f9" />;
                                    })}

                                    {/* The Shape */}
                                    <polygon 
                                        points={radarData.map((d, i) => {
                                            const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                            const val = Math.max(d.value, 10); // Minimum visibility
                                            const x = 100 + (80 * (val / 100)) * Math.cos(angle);
                                            const y = 100 + (80 * (val / 100)) * Math.sin(angle);
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        fill="rgba(99, 102, 241, 0.2)" 
                                        stroke="#6366f1" 
                                        strokeWidth="2"
                                    />

                                    {/* Labels & Dots */}
                                    {radarData.map((d, i) => {
                                        const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                        const x = 100 + 95 * Math.cos(angle);
                                        const y = 100 + 95 * Math.sin(angle);
                                        return (
                                            <g key={i}>
                                                <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[8px] font-bold fill-slate-500" style={{ fontSize: '8px' }}>
                                                    {d.domain}
                                                </text>
                                                <text x={x} y={y+10} textAnchor="middle" className="text-[8px] font-bold fill-indigo-600">
                                                    {d.value.toFixed(0)}%
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>

                        {/* D. Comparative Analysis (Improved Logic) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-3">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <GitCompare className="text-cyan-500" size={20} />
                                    تحليل مقارن: الخبرة مقابل التجديد
                                </h3>
                                <div className="flex gap-4 text-xs font-bold">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> جدد (أقل من 10)</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> قدماء (أكثر من 10)</span>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: 'استخدام التكنولوجيا', j: comparativeAnalysis.juniors.tech, s: comparativeAnalysis.seniors.tech, icon: MonitorSmartphone },
                                    { label: 'التحكم الصفي', j: comparativeAnalysis.juniors.control, s: comparativeAnalysis.seniors.control, icon: ShieldCheck },
                                    { label: 'التخطيط البيداغوجي', j: comparativeAnalysis.juniors.planning, s: comparativeAnalysis.seniors.planning, icon: ClipboardList }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold">
                                            <item.icon size={16} className="text-slate-400"/>
                                            {item.label}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="relative pt-1">
                                                <div className="flex justify-between text-xs mb-1"><span>الجدد</span><span className="font-bold">{item.j.toFixed(0)}%</span></div>
                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${item.j}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="relative pt-1">
                                                <div className="flex justify-between text-xs mb-1"><span>القدماء</span><span className="font-bold">{item.s.toFixed(0)}%</span></div>
                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.s}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardStats;