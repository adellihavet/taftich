
import React, { useMemo, useState } from 'react';
import { Teacher, ReportData } from '../types';
import { Users, School, GraduationCap, TrendingUp, CheckCircle2, Award, Radar, Trophy, TrendingDown, AlertTriangle, BookOpen, Briefcase, Zap, GitCompare, MonitorSmartphone, ShieldCheck, PenTool, ChevronLeft, Building2, MapPin, Target, LayoutList, LayoutGrid, FileText, PieChart, BarChart3, CheckSquare } from 'lucide-react';

interface DashboardStatsProps {
    teachers: Teacher[];
    reportsMap: Record<string, ReportData>;
    onNavigateToPromotions?: () => void;
    fullTeacherCount?: number; // Total count before filtering (for context)
    selectedSchool?: string; // Currently active filter
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ teachers, reportsMap, onNavigateToPromotions, fullTeacherCount, selectedSchool }) => {
    const [statsView, setStatsView] = useState<'modern' | 'legacy'>('modern');
    const currentYear = new Date().getFullYear();

    // --- Calculations (Global) ---

    const totalTeachers = teachers.length;
    
    // Average Mark
    const avgMark = useMemo(() => {
        if (totalTeachers === 0) return 0;
        const sum = teachers.reduce((acc, t) => acc + (t.lastMark || 0), 0);
        return (sum / totalTeachers).toFixed(2);
    }, [teachers]);

    // Unique Schools
    const uniqueSchools = useMemo(() => {
        const schools = new Set<string>();
        Object.values(reportsMap).forEach(r => {
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

    // --- LEGACY SPECIFIC STATS ---
    const legacyStats = useMemo(() => {
        const stats = {
            count: 0,
            // Preparation
            preparation: { good: 0, medium: 0, weak: 0 },
            // Objectives
            objectives: { full: 0, partial: 0, none: 0 },
            // Registers
            registers: { monitored: 0, notMonitored: 0 },
            // Board
            board: { organized: 0, random: 0 },
            // Notebooks
            notebooks: { good: 0, medium: 0, bad: 0 }
        };

        Object.values(reportsMap).forEach(r => {
            if (r.reportModel === 'legacy' && r.legacyData) {
                // Filter by current teacher list context if needed (optional optimization)
                if (!teachers.some(t => t.id === r.teacherId)) return;

                stats.count++;

                // Prep
                const prep = r.legacyData.preparationValue;
                if (prep === 'جيدة') stats.preparation.good++;
                else if (prep === 'متوسطة' || prep === 'مقبولة') stats.preparation.medium++;
                else stats.preparation.weak++;

                // Objectives
                const obj = r.legacyData.objectivesAchieved;
                if (obj === 'تحققت كلياً') stats.objectives.full++;
                else if (obj === 'تحققت جزئياً' || obj === 'تحققت نسبياً') stats.objectives.partial++;
                else stats.objectives.none++;

                // Registers
                if (r.legacyData.registersMonitored?.includes('نعم')) stats.registers.monitored++;
                else stats.registers.notMonitored++;

                // Board
                if (r.legacyData.boardWork?.includes('منظمة')) stats.board.organized++;
                else stats.board.random++;

                // Notebooks
                const note = r.legacyData.notebooksCare;
                if (note === 'حسنة') stats.notebooks.good++;
                else if (note === 'متوسطة' || note === 'مقبولة') stats.notebooks.medium++;
                else stats.notebooks.bad++;
            }
        });

        return stats;
    }, [reportsMap, teachers]);


    // --- MODERN SPECIFIC STATS ---

    // Students by Level
    const studentsByLevel = useMemo(() => {
        const levels: Record<string, number> = {};
        teachers.forEach(t => {
            const r = reportsMap[t.id];
            if (r && r.level && r.studentCount) {
                const lvl = r.level.trim();
                levels[lvl] = (levels[lvl] || 0) + r.studentCount;
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
    }, [teachers, reportsMap]);
    
    const maxStudentCount = useMemo(() => {
        return Math.max(...studentsByLevel.map(s => s.count), 1);
    }, [studentsByLevel]);

    // Teachers by Degree
    const teachersByDegree = useMemo(() => {
        const degrees: Record<string, number> = {};
        teachers.forEach(t => {
            const d = t.degree || 'غير محدد';
            degrees[d] = (degrees[d] || 0) + 1;
        });
        return Object.entries(degrees)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [teachers]);
    
    const maxDegreeCount = useMemo(() => {
        return Math.max(...teachersByDegree.map(t => t.count), 1);
    }, [teachersByDegree]);

    // Seniority Pyramid
    const seniorityPyramid = useMemo(() => {
        const groups = [
            { label: 'أقل من 5 سنوات (جدد)', min: 0, max: 5, count: 0, color: 'bg-blue-400' },
            { label: '5 - 15 سنة (خبرة)', min: 5, max: 15, count: 0, color: 'bg-indigo-500' },
            { label: '15 - 25 سنة (تمكّن)', min: 15, max: 25, count: 0, color: 'bg-purple-500' },
            { label: '+25 سنة (خبراء)', min: 25, max: 100, count: 0, color: 'bg-amber-500' },
        ];

        teachers.forEach(t => {
            if(t.recruitmentDate) {
                const start = new Date(t.recruitmentDate);
                const years = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const group = groups.find(g => years >= g.min && years < g.max);
                if(group) group.count++;
            }
        });
        return groups;
    }, [teachers]);

    // Comparative Analysis
    const comparativeAnalysis = useMemo(() => {
        const juniors = { count: 0, tech: 0, control: 0, pedagogy: 0 };
        const seniors = { count: 0, tech: 0, control: 0, pedagogy: 0 };
        
        const techCats = ['التكنولوجيا', 'الوسائل', 'استراتيجيات التعلم'];
        const controlCats = ['النظام', 'الحركة', 'التعليمات', 'ضبط الصف'];
        const pedagogyCats = ['التخطيط', 'الموارد المعرفية', 'الوضعية التعلمية'];

        teachers.forEach(t => {
            const report = reportsMap[t.id];
            if (!report || !t.recruitmentDate || report.reportModel === 'legacy') return; // Only Modern reports

            const start = new Date(t.recruitmentDate);
            const years = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const isJunior = years <= 10;
            const target = isJunior ? juniors : seniors;

            const getDomainScore = (categories: string[]) => {
                let sum = 0;
                let max = 0;
                report.observations.forEach(obs => {
                    if (categories.some(c => obs.category.includes(c) || obs.criteria.includes(c))) {
                        if (obs.score !== null) {
                            sum += obs.score;
                            max += 2;
                        }
                    }
                });
                return max > 0 ? (sum / max) * 100 : 0;
            };

            target.count++;
            target.tech += getDomainScore(techCats);
            target.control += getDomainScore(controlCats);
            target.pedagogy += getDomainScore(pedagogyCats);
        });

        const normalize = (target: typeof juniors) => {
            if (target.count === 0) return;
            target.tech /= target.count;
            target.control /= target.count;
            target.pedagogy /= target.count;
        };

        normalize(juniors);
        normalize(seniors);

        return { juniors, seniors };
    }, [teachers, reportsMap]);

    // Marks Distribution
    const marksDistribution = useMemo(() => {
        const ranges = [
            { label: 'أقل من 10', min: 0, max: 9.99, count: 0, color: 'bg-red-400' },
            { label: '10 - 12', min: 10, max: 11.99, count: 0, color: 'bg-orange-400' },
            { label: '12 - 14', min: 12, max: 13.99, count: 0, color: 'bg-yellow-400' },
            { label: '14 - 16', min: 14, max: 15.99, count: 0, color: 'bg-blue-400' },
            { label: 'أكثر من 16', min: 16, max: 20, count: 0, color: 'bg-green-400' },
        ];

        teachers.forEach(t => {
            const m = t.lastMark || 0;
            const range = ranges.find(r => m >= r.min && m <= r.max);
            if (range) range.count++;
        });

        const maxCount = Math.max(...ranges.map(r => r.count)) || 1; 
        return { ranges, maxCount };
    }, [teachers]);

    // Radar Chart Data
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

    // Weakest Criteria
    const weakestCriteria = useMemo(() => {
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

        return Object.entries(stats)
            .map(([name, data]) => ({
                name,
                category: data.category,
                avg: (data.sum / data.count / 2) * 100
            }))
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 5);
    }, [teachers, reportsMap]);

    // School Ranking
    const schoolContextData = useMemo(() => {
        const schoolStats: Record<string, { totalMark: number, count: number }> = {};
        Object.values(reportsMap).forEach(r => {
            if (r.school && r.finalMark) {
                const name = r.school.trim();
                if (!schoolStats[name]) schoolStats[name] = { totalMark: 0, count: 0 };
                schoolStats[name].totalMark += r.finalMark;
                schoolStats[name].count += 1;
            }
        });
        return Object.entries(schoolStats).map(([name, stat]) => ({
            name,
            avg: stat.totalMark / stat.count,
            count: stat.count
        })).sort((a, b) => b.avg - a.avg);
    }, [reportsMap]);

    const selectedSchoolRank = useMemo(() => {
        if (!selectedSchool) return null;
        const index = schoolContextData.findIndex(s => s.name === selectedSchool);
        if (index === -1) return null;
        return {
            rank: index + 1,
            total: schoolContextData.length,
            data: schoolContextData[index]
        };
    }, [selectedSchool, schoolContextData]);

    // Promotion Candidates
    const promotionCandidateCount = useMemo(() => {
        return teachers.filter(t => {
            if (t.status !== 'titulaire' || !t.echelonDate || !t.echelon) return false;
            const echelonDate = new Date(t.echelonDate);
            if (isNaN(echelonDate.getTime())) return false;
            const twoYearsMark = new Date(echelonDate);
            twoYearsMark.setFullYear(echelonDate.getFullYear() + 2);
            const cutOffDate = new Date(currentYear, 11, 31);
            if (twoYearsMark > cutOffDate) return false;
            const currentEchelon = parseInt(t.echelon);
            const maxAllowedMark = 13 + (currentEchelon * 0.5);
            if (t.lastMark >= maxAllowedMark) return false;

            // Update: Exclude those with completed reports (date and mark filled)
            const activeReport = reportsMap[t.id];
            if (activeReport) {
                const isDateFilled = activeReport.inspectionDate && activeReport.inspectionDate.trim() !== '';
                const isMarkFilled = activeReport.finalMark !== undefined && activeReport.finalMark > 0;
                if (isDateFilled && isMarkFilled) return false;
            }

            return true;
        }).length;
    }, [teachers, currentYear, reportsMap]);

    // Pie Chart Gradient
    const totalStatus = totalTeachers || 1;
    const p1 = (statusCounts.titulaire / totalStatus) * 100;
    const p2 = p1 + (statusCounts.contractuel / totalStatus) * 100;
    const pieGradient = `conic-gradient(#10b981 0% ${p1}%, #f97316 ${p1}% ${p2}%, #3b82f6 ${p2}% 100%)`;

    // Helper for Radar Path
    const generateRadarPath = (data: { value: number }[]) => {
        if (data.length === 0) return '';
        const totalPoints = data.length;
        const radius = 80;
        const centerX = 100;
        const centerY = 100;
        return data.map((point, i) => {
            const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
            const value = Math.max(point.value, 10);
            const x = centerX + (radius * (value / 100)) * Math.cos(angle);
            const y = centerY + (radius * (value / 100)) * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-serif">لوحة القيادة والتحليل البيداغوجي</h1>
                    {selectedSchool && (
                        <p className="text-indigo-600 font-bold mt-1 flex items-center gap-2 animate-in slide-in-from-right-4">
                            <School size={16} />
                            تقرير خاص بمدرسة: {selectedSchool}
                        </p>
                    )}
                </div>
                
                {/* View Switcher */}
                <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
                    <button 
                        onClick={() => setStatsView('modern')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${statsView === 'modern' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LayoutGrid size={16} />
                        تحليل المعايير (حديث)
                    </button>
                    <button 
                        onClick={() => setStatsView('legacy')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${statsView === 'legacy' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LayoutList size={16} />
                        تحليل الكلاسيكي (قديم)
                    </button>
                </div>
            </div>
            
            {/* School Scorecard (Visible regardless of view mode if school selected) */}
            {selectedSchool && selectedSchoolRank && (
                <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl shadow-xl p-6 text-white mb-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Building2 size={150} />
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                        <div className="flex-1 border-l border-white/20 pl-6">
                            <h2 className="text-2xl font-bold font-serif mb-2">{selectedSchool}</h2>
                            <div className="flex items-center gap-2 opacity-80 mb-4">
                                <MapPin size={16} />
                                <span className="text-sm">بطاقة الأداء والمردودية</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white/10 rounded-lg p-3 text-center min-w-[80px]">
                                    <span className="block text-2xl font-bold text-yellow-400">{selectedSchoolRank.data.avg.toFixed(2)}</span>
                                    <span className="text-[10px] uppercase opacity-70">متوسط النقاط</span>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 text-center min-w-[80px]">
                                    <span className="block text-2xl font-bold">{selectedSchoolRank.data.count}</span>
                                    <span className="text-[10px] uppercase opacity-70">عدد الأساتذة</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-l border-white/20 pl-6">
                            <div className="text-center">
                                <p className="text-xs uppercase opacity-70 mb-1">الترتيب المقاطعي</p>
                                <div className="flex items-baseline gap-1 justify-center">
                                    <span className="text-4xl font-bold">{selectedSchoolRank.rank}</span>
                                    <span className="text-sm opacity-60">/ {selectedSchoolRank.total}</span>
                                </div>
                            </div>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${selectedSchoolRank.rank === 1 ? 'border-yellow-400 text-yellow-400' : selectedSchoolRank.rank <= 3 ? 'border-gray-300 text-gray-300' : 'border-indigo-400 text-indigo-300'}`}>
                                <Trophy size={32} />
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <p className="text-sm italic opacity-90 mb-2">
                                "{selectedSchoolRank.rank === 1 ? 'أداء ممتاز! هذه المدرسة تقود المقاطعة.' : selectedSchoolRank.rank > selectedSchoolRank.total / 2 ? 'تحتاج إلى مرافقة بيداغوجية مكثفة لرفع المستوى.' : 'أداء متوسط، يمكن تحسينه بالتركيز على التكوين.'}"
                            </p>
                            <div className="w-full bg-black/20 rounded-full h-2 mt-2">
                                <div 
                                    className={`h-2 rounded-full ${selectedSchoolRank.rank === 1 ? 'bg-yellow-400' : 'bg-blue-400'}`} 
                                    style={{ width: `${(selectedSchoolRank.data.avg / 20) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-[10px] mt-1 text-right opacity-60">مؤشر الجودة العامة</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Global KPIs (Common for both views) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-bold mb-1">{selectedSchool ? 'أساتذة المدرسة' : 'إجمالي الأساتذة'}</p>
                        <p className="text-3xl font-bold text-blue-900">{totalTeachers}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Users size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-bold mb-1">متوسط النقاط</p>
                        <p className="text-3xl font-bold text-green-700">{avgMark}<span className="text-sm text-gray-400 font-normal">/20</span></p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-600"><Award size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-bold mb-1">المدارس</p>
                        <p className="text-3xl font-bold text-purple-900">{selectedSchool ? '1' : uniqueSchools}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-full text-purple-600"><School size={24} /></div>
                </div>
                <div onClick={onNavigateToPromotions} className="bg-indigo-600 p-6 rounded-2xl shadow-md border border-indigo-700 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors group relative overflow-hidden">
                    <div className="relative z-10 text-white">
                        <p className="text-indigo-200 text-sm font-bold mb-1">المعنيون بالترقية</p>
                        <div className="flex items-end gap-2"><p className="text-3xl font-bold">{promotionCandidateCount}</p><span className="text-xs mb-1.5 opacity-80">أستاذ</span></div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-100 font-bold group-hover:translate-x-[-2px] transition-transform"><span>عرض التفاصيل</span><ChevronLeft size={10} /></div>
                    </div>
                    <div className={`bg-indigo-500/50 p-3 rounded-full text-white relative z-10 ${promotionCandidateCount > 0 ? 'animate-pulse' : ''}`}><Zap size={24} /></div>
                    <Zap size={80} className="absolute -bottom-4 -left-4 text-indigo-500 opacity-20" />
                </div>
            </div>

            {/* ================= CONDITIONAL VIEWS ================= */}
            
            {/* VIEW 1: LEGACY ANALYTICS */}
            {statsView === 'legacy' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {legacyStats.count === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                            <FileText size={48} className="mx-auto mb-3 opacity-20" />
                            <p>لا توجد تقارير كلاسيكية مسجلة لعرض إحصائياتها.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            
                            {/* 1. Preparation Analysis */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText className="text-orange-500" size={20} />
                                    جودة إعداد الدروس
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1"><span className="font-bold text-gray-700">إعداد جيد</span><span className="font-bold text-green-600">{legacyStats.preparation.good}</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(legacyStats.preparation.good / legacyStats.count) * 100}%` }}></div></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1"><span className="font-bold text-gray-700">متوسط / مقبول</span><span className="font-bold text-yellow-600">{legacyStats.preparation.medium}</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${(legacyStats.preparation.medium / legacyStats.count) * 100}%` }}></div></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1"><span className="font-bold text-gray-700">ضعيف / ناقص</span><span className="font-bold text-red-600">{legacyStats.preparation.weak}</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(legacyStats.preparation.weak / legacyStats.count) * 100}%` }}></div></div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Objectives Achievement */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <Target className="text-blue-500" size={20} />
                                    مدى تحقق الأهداف
                                </h3>
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <div className="relative w-32 h-32">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path className="text-blue-500" strokeDasharray={`${(legacyStats.objectives.full / legacyStats.count) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-2xl font-bold text-blue-900">{Math.round((legacyStats.objectives.full / legacyStats.count) * 100)}%</span>
                                            <span className="text-[10px] text-gray-500">تحقق كلي</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div><span>كلي ({legacyStats.objectives.full})</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-full"></div><span>جزئي/لم يتحقق ({legacyStats.objectives.partial + legacyStats.objectives.none})</span></div>
                                    </div>
                                </div>
                            </div>

                             {/* 3. Admin & Board Work */}
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckSquare className="text-purple-500" size={20} />
                                    الانضباط الإداري والتنظيمي
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-purple-800 font-bold mb-2">مراقبة السجلات</p>
                                        <div className="text-2xl font-bold text-purple-900">
                                            {Math.round((legacyStats.registers.monitored / legacyStats.count) * 100)}%
                                        </div>
                                        <p className="text-[10px] text-gray-500">تتم بانتظام</p>
                                    </div>
                                    <div className="bg-indigo-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-indigo-800 font-bold mb-2">تنظيم السبورة</p>
                                        <div className="text-2xl font-bold text-indigo-900">
                                            {Math.round((legacyStats.board.organized / legacyStats.count) * 100)}%
                                        </div>
                                        <p className="text-[10px] text-gray-500">منظمة ومقروءة</p>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Notebooks Care */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <BookOpen className="text-teal-500" size={20} />
                                    العناية بدفاتر التلاميذ
                                </h3>
                                <div className="flex items-end justify-between h-32 px-4 gap-4">
                                    <div className="w-1/3 bg-teal-100 rounded-t-lg relative group h-full flex items-end justify-center">
                                        <div className="w-full bg-teal-500 rounded-t-lg transition-all" style={{ height: `${(legacyStats.notebooks.good / legacyStats.count) * 100}%` }}></div>
                                        <span className="absolute bottom-2 text-white font-bold text-sm drop-shadow-md">{legacyStats.notebooks.good}</span>
                                        <span className="absolute -bottom-6 text-xs font-bold text-gray-600">حسنة</span>
                                    </div>
                                    <div className="w-1/3 bg-teal-100 rounded-t-lg relative group h-full flex items-end justify-center">
                                        <div className="w-full bg-yellow-400 rounded-t-lg transition-all" style={{ height: `${(legacyStats.notebooks.medium / legacyStats.count) * 100}%` }}></div>
                                        <span className="absolute bottom-2 text-white font-bold text-sm drop-shadow-md">{legacyStats.notebooks.medium}</span>
                                        <span className="absolute -bottom-6 text-xs font-bold text-gray-600">متوسطة</span>
                                    </div>
                                    <div className="w-1/3 bg-teal-100 rounded-t-lg relative group h-full flex items-end justify-center">
                                        <div className="w-full bg-red-400 rounded-t-lg transition-all" style={{ height: `${(legacyStats.notebooks.bad / legacyStats.count) * 100}%` }}></div>
                                        <span className="absolute bottom-2 text-white font-bold text-sm drop-shadow-md">{legacyStats.notebooks.bad}</span>
                                        <span className="absolute -bottom-6 text-xs font-bold text-gray-600">سيئة</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            )}

            {/* VIEW 2: MODERN ANALYTICS */}
            {statsView === 'modern' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        
                        {/* A. Weakest Criteria */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" size={20} />
                                احتياجات التكوين (المعايير الأضعف)
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">نقاط الضعف المسجلة في التقارير الحديثة</p>
                            <div className="space-y-4">
                                {weakestCriteria.length > 0 ? weakestCriteria.map((c, i) => (
                                    <div key={i} className="relative">
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-bold text-gray-700 truncate ml-2" title={c.name}>{c.name}</span>
                                            <span className="font-bold text-red-600 text-xs">{c.avg.toFixed(0)}% تحكم</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-red-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${c.avg}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{c.category}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-gray-400">
                                        <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">لا توجد بيانات كافية للتحليل بعد</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* B. Radar Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                                <Radar className="text-indigo-500" size={20} />
                                بروفايل الكفاءة ({selectedSchool ? 'المدرسة' : 'متوسط المقاطعة'})
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">تحليل الأداء في المجالات التربوية التسعة</p>
                            <div className="flex justify-center relative">
                                <svg viewBox="0 0 200 200" className="w-64 h-64 overflow-visible">
                                    {[20, 40, 60, 80, 100].map(r => (
                                        <circle key={r} cx="100" cy="100" r={r * 0.8} fill="none" stroke="#e5e7eb" strokeDasharray="4 4" />
                                    ))}
                                    {radarData.map((_, i) => {
                                        const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                        const x = 100 + 80 * Math.cos(angle);
                                        const y = 100 + 80 * Math.sin(angle);
                                        return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#f3f4f6" />;
                                    })}
                                    <polygon points={generateRadarPath(radarData)} fill="rgba(79, 70, 229, 0.2)" stroke="#4f46e5" strokeWidth="2" />
                                    {radarData.map((d, i) => {
                                        const angle = (Math.PI * 2 * i) / radarData.length - Math.PI / 2;
                                        const x = 100 + 95 * Math.cos(angle);
                                        const y = 100 + 95 * Math.sin(angle);
                                        return (
                                            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[8px] font-bold fill-gray-600">
                                                {d.domain}
                                            </text>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>

                        {/* C. Students by Level */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                                <BookOpen className="text-blue-500" size={20} />
                                تعداد التلاميذ حسب المستوى
                            </h3>
                            <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-2 min-h-[150px]">
                                {studentsByLevel.length > 0 ? studentsByLevel.map((lvl, idx) => {
                                    const heightPercent = (lvl.count / maxStudentCount) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                                            <div className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded absolute -top-8 whitespace-nowrap z-20">{lvl.count} تلميذ</div>
                                            <div className="w-full bg-blue-100 rounded-t-md hover:bg-blue-300 transition-all duration-500 relative" style={{ height: `${heightPercent > 10 ? heightPercent : 10}%` }}>
                                                <div className="absolute bottom-1 w-full text-center text-[9px] font-bold text-blue-700">{lvl.count}</div>
                                            </div>
                                            <p className="text-[9px] text-gray-500 mt-2 text-center h-8 leading-tight flex items-center justify-center">{lvl.name.replace('السنة', 'س')}</p>
                                        </div>
                                    );
                                }) : <div className="w-full text-center text-gray-300 text-sm italic">لا توجد بيانات مستويات بعد</div>}
                            </div>
                        </div>

                        {/* D. Teachers By Degree */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                                <GraduationCap className="text-emerald-500" size={20} />
                                المؤهلات العلمية
                            </h3>
                            <div className="space-y-4">
                                {teachersByDegree.length > 0 ? teachersByDegree.map((d, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1 text-sm"><span className="font-bold text-gray-700 truncate text-xs" title={d.name}>{d.name}</span><span className="font-bold text-gray-500 text-xs">{d.count}</span></div>
                                        <div className="w-full bg-gray-50 rounded-full h-2"><div className="bg-emerald-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${(d.count / maxDegreeCount) * 100}%` }}></div></div>
                                    </div>
                                )) : <div className="text-center text-gray-300 text-sm italic py-8">لا توجد بيانات شهادات</div>}
                            </div>
                        </div>

                        {/* E. Comparative Analysis */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 flex flex-col md:flex-row gap-8">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                                    <Briefcase className="text-amber-500" size={20} />
                                    هرم الأقدمية والخبرة
                                </h3>
                                <p className="text-xs text-gray-400 mb-6">توزيع الأساتذة حسب سنوات الخدمة</p>
                                <div className="flex flex-col gap-1 items-center">
                                    {seniorityPyramid.slice().reverse().map((group, i) => {
                                        const widthPercent = totalTeachers > 0 ? (group.count / totalTeachers) * 100 : 0;
                                        const displayWidth = Math.max(widthPercent, 15); 
                                        return (
                                            <div key={i} className="w-full flex justify-center group relative">
                                                <div className={`h-8 ${group.color} rounded-sm flex items-center justify-center text-white text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-sm`} style={{ width: `${displayWidth}%`, minWidth: '120px' }} title={`${group.label}: ${group.count} أستاذ`}>
                                                   {group.count}
                                                </div>
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 pr-2 text-[10px] text-gray-400 w-32 hidden md:block">{group.label}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-4 md:hidden">
                                    {seniorityPyramid.map((g,i) => (<div key={i} className="flex items-center gap-1 text-[9px]"><div className={`w-2 h-2 rounded-full ${g.color}`}></div><span>{g.label}</span></div>))}
                                </div>
                            </div>
                            <div className="w-px bg-gray-100 hidden md:block"></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                                    <GitCompare className="text-cyan-500" size={20} />
                                    تحليل مقارن: الخبرة مقابل التجديد
                                </h3>
                                <p className="text-xs text-gray-400 mb-6">مقارنة الأداء البيداغوجي بين الأجيال</p>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-gray-700 flex items-center gap-1"><MonitorSmartphone size={12}/> التجديد والتكنولوجيا</span></div>
                                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 relative">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
                                            <div className="w-1/2 flex justify-end"><div className="h-full bg-cyan-400" style={{ width: `${comparativeAnalysis.juniors.tech}%` }}></div></div>
                                            <div className="w-1/2 flex justify-start"><div className="h-full bg-amber-400" style={{ width: `${comparativeAnalysis.seniors.tech}%` }}></div></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] mt-1 text-gray-400"><span>جدد (أقل من 10)</span><span>قدماء (أكثر من 10)</span></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-gray-700 flex items-center gap-1"><ShieldCheck size={12}/> التحكم وتسيير الصف</span></div>
                                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 relative">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
                                            <div className="w-1/2 flex justify-end"><div className="h-full bg-cyan-400" style={{ width: `${comparativeAnalysis.juniors.control}%` }}></div></div>
                                            <div className="w-1/2 flex justify-start"><div className="h-full bg-amber-400" style={{ width: `${comparativeAnalysis.seniors.control}%` }}></div></div>
                                        </div>
                                    </div>
                                     <div>
                                        <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-gray-700 flex items-center gap-1"><PenTool size={12}/> الهندسة البيداغوجية</span></div>
                                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 relative">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
                                            <div className="w-1/2 flex justify-end"><div className="h-full bg-cyan-400" style={{ width: `${comparativeAnalysis.juniors.pedagogy}%` }}></div></div>
                                            <div className="w-1/2 flex justify-start"><div className="h-full bg-amber-400" style={{ width: `${comparativeAnalysis.seniors.pedagogy}%` }}></div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* H. Marks Histogram */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                                <Award className="text-blue-500" size={20} />
                                توزيع النقاط العام
                            </h3>
                            <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100 relative min-h-[150px]">
                                {marksDistribution.ranges.map((range, idx) => {
                                    const heightPercent = (range.count / marksDistribution.maxCount) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                                            <div className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded absolute -top-6">{range.count}</div>
                                            <div className={`w-full ${range.color} rounded-t-md transition-all duration-500 hover:opacity-80`} style={{ height: `${heightPercent > 5 ? heightPercent : 5}%` }}></div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 mt-2 px-1"><span>ضعيف</span><span>متوسط</span><span>جيد</span><span>ممتاز</span></div>
                            <div className="mt-6 pt-4 border-t border-dashed">
                                <h4 className="text-xs font-bold text-gray-500 mb-3">الوضعيات المهنية</h4>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="relative w-16 h-16 rounded-full border-4 border-gray-100" style={{ background: totalTeachers > 0 ? pieGradient : '#e5e7eb' }}></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-gray-600">مرسم ({statusCounts.titulaire})</span></div>
                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-gray-600">متعاقد ({statusCounts.contractuel})</span></div>
                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-gray-600">متربص ({statusCounts.stagiere})</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardStats;