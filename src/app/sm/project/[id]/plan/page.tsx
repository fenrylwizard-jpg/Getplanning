"use client";
import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Folder, ArrowLeft, Trash2, PlusCircle, ShoppingBag, Loader2, List, Clock } from "lucide-react";
import { useTranslation } from "@/lib/LanguageContext";
import T from "@/components/T";
import { getISOWeek, getYear, addWeeks, startOfISOWeek } from 'date-fns';

export default function PlanNextWeek({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();
    const { t } = useTranslation();
    
    const [workers, setWorkers] = useState(5);
    const [tasks, setTasks] = useState<{ id: string; description: string; quantity: number; completedQuantity: number; category: string; minutesPerUnit: number; unit: string; taskCode?: string }[]>([]);
    const [subLocations, setSubLocations] = useState<string[]>([]);
    
    // Week Selection
    const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current, 1 = S+1, etc.
    const weekOptions = useMemo(() => {
        const today = new Date();
        return [0, 1, 2, 3].map(offset => {
            const d = addWeeks(today, offset);
            const w = getISOWeek(d);
            const y = getYear(d);
            const start = startOfISOWeek(d);
            return { 
                offset, 
                week: w, 
                year: y, 
                label: offset === 0 ? "current" : `future_week_${offset}`,
                dateRange: `${start.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}`
            };
        });
    }, []);

    const activeWeek = weekOptions.find(o => o.offset === selectedWeekOffset)!;

    // Shopping Cart state
    const [cartItems, setCartItems] = useState<{ id: string; taskId: string; planQty: number; locations: string[] }[]>([]);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [checks, setChecks] = useState({
        drawings: false, materials: false, tools: false, sub: false
    });

    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const HOURS_PER_WORKER = 40;
    const targetProductivityRatio = 1.0; 

    const totalCapacityHours = workers * HOURS_PER_WORKER;
    const targetHours = totalCapacityHours * targetProductivityRatio;

    // Fetch initial data (tasks & locations)
    useEffect(() => {
        setLoadingTasks(true);
        fetch(`/api/project/${id}/tasks`)
            .then(res => res.json())
            .then(data => { 
                setTasks(data.tasks || []); 
                setSubLocations(data.subLocations || []);
                setLoadingTasks(false); 
            })
            .catch(err => {
                console.error(err);
                setLoadingTasks(false);
            });
    }, [id]);

    // Fetch specific plan when week changes
    useEffect(() => {
        setLoadingPlan(true);
        fetch(`/api/project/${id}/plan?week=${activeWeek.week}&year=${activeWeek.year}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.id) {
                    setWorkers(data.numberOfWorkers || 5);
                    setChecks({
                        drawings: data.hasDrawings || false,
                        materials: data.hasMaterials || false,
                        tools: data.hasTools || false,
                        sub: data.hasSubcontractors || false
                    });
                    const items = data.tasks.map((pt: { id: string, taskId: string, plannedQuantity: number, locations: string | null }) => ({
                        id: pt.id || Math.random().toString(36).substring(7),
                        taskId: pt.taskId,
                        planQty: pt.plannedQuantity,
                        locations: pt.locations ? JSON.parse(pt.locations) : []
                    }));
                    setCartItems(items);
                } else {
                    // Reset if no plan exists for this week
                    setCartItems([]);
                }
                setLoadingPlan(false);
            })
            .catch(() => {
                setLoadingPlan(false);
            });
    }, [id, activeWeek.week, activeWeek.year]);

    const currentlyPlannedMins = cartItems.reduce((acc, curr) => {
        const task = tasks.find(t => t.id === curr.taskId);
        if (!task) return acc;
        return acc + (curr.planQty * task.minutesPerUnit);
    }, 0);

    const currentlyPlannedHours = currentlyPlannedMins / 60;
    const isNearTarget = Math.abs(currentlyPlannedHours - targetHours) < 10;

    // View logic for the tasks catalog
    const categoriesInfo = React.useMemo(() => {
        const map = new Map<string, { name: string, taskCount: number, remainingHours: number }>();
        tasks.forEach(task => {
            const remaining = task.quantity - task.completedQuantity;
            if (remaining <= 0) return;
            const cat = task.category || t("uncategorized");
            if (!map.has(cat)) {
                map.set(cat, { name: cat, taskCount: 0, remainingHours: 0 });
            }
            const info = map.get(cat)!;
            info.taskCount += 1;
            info.remainingHours += (remaining * task.minutesPerUnit) / 60;
        });
        return Array.from(map.values()).sort((a, b) => b.remainingHours - a.remainingHours);
    }, [tasks, t]);

    const groupedTasks = React.useMemo(() => {
        if (!selectedCategory) return [];
        interface TaskWithMetadata {
            id: string;
            description: string;
            unit: string;
            remaining: number;
            minutesPerUnit: number;
            taskCode?: string;
        }
        interface TaskGroup {
            id: string;
            description: string;
            unit: string;
            totalRemaining: number;
            originalTasks: TaskWithMetadata[];
            averageMinsPerUnit: number;
        }
        const map = new Map<string, TaskGroup>();
        tasks.filter(task => (task.category || t("uncategorized")) === selectedCategory).forEach(task => {
            const remaining = task.quantity - task.completedQuantity;
            if (remaining <= 0) return;

            const originalKey = task.description;
            const key = originalKey.toLowerCase().trim();
            if (!map.has(key)) {
                map.set(key, {
                    id: task.id,
                    description: originalKey,
                    unit: task.unit,
                    totalRemaining: remaining,
                    originalTasks: [{ ...task, remaining, taskCode: task.taskCode }],
                    averageMinsPerUnit: task.minutesPerUnit
                });
            } else {
                const group = map.get(key)!;
                group.totalRemaining += remaining;
                group.originalTasks.push({ ...task, remaining, taskCode: task.taskCode });
                const totalMins = group.originalTasks.reduce((acc: number, curr: TaskWithMetadata) => acc + (curr.remaining * curr.minutesPerUnit), 0);
                group.averageMinsPerUnit = totalMins / group.totalRemaining;
            }
        });
        return Array.from(map.values());
    }, [tasks, selectedCategory, t]);

    const visibleGroups = groupedTasks.filter(g => g.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleGroup = (groupId: string) => {
        setExpandedGroups((prev) => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
    };

    // Shopping Cart Actions
    const addToCart = (ot: { id: string }) => {
        setCartItems(prev => [...prev, { 
            id: Math.random().toString(36).substring(7), 
            taskId: ot.id, 
            planQty: 0, 
            locations: [] 
        }]);
    };

    const updateCartItem = (cartId: string, updates: Partial<{ planQty: number, locations: string[] }>) => {
        setCartItems(prev => prev.map(item => item.id === cartId ? { ...item, ...updates } : item));
    };

    const removeCartItem = (cartId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== cartId));
    };

    const submitPlan = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/project/${id}/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workers,
                    targetHoursCapacity: totalCapacityHours,
                    tasks: cartItems, 
                    checks,
                    weekNumber: activeWeek.week,
                    year: activeWeek.year
                })
            });

            if (res.ok) {
                router.push('/sm/dashboard');
            } else {
                const errData = await res.json();
                alert(errData.error || t("error_saving_plan"));
            }
        } catch (err) {
            console.error(err);
            alert(t("error_saving_plan"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const materialsForecast = React.useMemo(() => {
        const forecast: Record<string, { desc: string, qty: number, unit: string }> = {};
        cartItems.forEach(item => {
            const task = tasks.find(t => t.id === item.taskId);
            if (task && item.planQty > 0) {
                const key = task.description;
                if (!forecast[key]) {
                    forecast[key] = { desc: task.description, qty: 0, unit: task.unit };
                }
                forecast[key].qty += item.planQty;
            }
        });
        return Object.values(forecast).filter(f => f.qty > 0);
    }, [cartItems, tasks]);

    if (loadingTasks) return (
        <div className="aurora-page flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            <p className="text-cyan-400/60 font-black uppercase tracking-widest text-xs"><T k="loading" />...</p>
        </div>
    );

    return (
        <div className="aurora-page text-white font-sans selection:bg-cyan-500/30 pb-20">

            {/* Content Wrapper */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-white/5 pb-8">
                    <div>
                        <Link href="/sm/dashboard" className="flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 transition-colors mb-4 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest"><T k="back_to_dashboard" /></span>
                        </Link>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">
                            <T k="plan_for_week" /> <span className="text-cyan-400">S{activeWeek.week}</span> ({activeWeek.year})
                        </h1>
                        <p className="text-gray-400 max-w-xl"><T k="plan_next_week_desc" /></p>
                    </div>

                    {/* Week Selection Hub */}
                    <div className="flex bg-[#0a1020]/80 backdrop-blur-md rounded-3xl p-1.5 border border-white/5 shadow-2xl overflow-x-auto max-w-full">
                        {weekOptions.map(opt => (
                            <button 
                                key={opt.offset}
                                onClick={() => setSelectedWeekOffset(opt.offset)}
                                className={`px-5 py-3 rounded-2xl transition-all flex flex-col items-center gap-0.5 min-w-[100px] ${selectedWeekOffset === opt.offset ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white border border-transparent hover:bg-white/5'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest"><T k={opt.label} /></span>
                                <span className="text-xs font-bold whitespace-nowrap">S{opt.week} • {opt.dateRange}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {loadingPlan ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest"><T k="loading_plan" />...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Left Col - Resource Planning & Tasks */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            
                            {/* Workforce Module */}
                            <section className="glass-card bg-[#0a1020]/60 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                <h3 className="mb-8 text-xs font-black uppercase tracking-[0.2em] text-cyan-400/80 flex items-center gap-2">
                                    <T k="workforce_availability" />
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-10">
                                    <div className="w-full sm:w-1/2">
                                        <label htmlFor="workersAmount" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3"><T k="available_workers_count" /></label>
                                        <div className="relative group">
                                            <input 
                                                id="workersAmount" 
                                                type="number" 
                                                title={t("available_workers_count")}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all group-hover:border-white/20" 
                                                min="1" 
                                                max="100" 
                                                value={workers} 
                                                onChange={e => setWorkers(parseInt(e.target.value) || 0)} 
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-cyan-500/40 uppercase"><T k="persons" /></span>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-1/2 flex flex-col items-center justify-center p-6 bg-cyan-500/5 rounded-[30px] border border-cyan-500/10 h-full relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 blur-3xl rounded-full" />
                                        <div className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-2"><T k="target_100" /></div>
                                        <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                            {targetHours} <span className="text-xl font-light text-cyan-400/60 uppercase">h</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Catalog Module */}
                            <section className="glass-card bg-[#0a1020]/60 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col min-h-[600px]">
                                <h3 className="mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Folder size={20} /></div>
                                    <span className="text-sm font-black uppercase tracking-widest text-white"><T k="tasks_catalog" /></span>
                                </h3>
                                
                                {!selectedCategory ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {categoriesInfo.map(c => (
                                            <div 
                                                key={c.name} 
                                                onClick={() => setSelectedCategory(c.name)}
                                                className="rounded-2xl p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] hover:-translate-y-2 hover:scale-[1.02] hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(37,226,244,0.2),inset_0_0_10px_rgba(37,226,244,0.1)] transition-all duration-300 text-left"
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <Folder size={40} className="text-cyan-400" strokeWidth={1} />
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-100 text-xl font-bold leading-tight mb-6 group-hover:text-cyan-400 transition-colors pr-12 line-clamp-2">
                                                        {c.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 w-full">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase flex items-center gap-1">
                                                            <List size={14} className="text-cyan-400" /> <T k="lines_pl" />
                                                        </span>
                                                        <span className="text-slate-100 font-bold text-xl">{c.taskCount} <span className="text-sm text-slate-400 font-medium">Nodes</span></span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase flex items-center gap-1">
                                                            <Clock size={14} className="text-purple-400" /> <T k="workload" />
                                                        </span>
                                                        <span className="text-slate-100 font-bold text-xl">{c.remainingHours.toFixed(0)}H</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 mb-8">
                                            <button 
                                                title={t("back_to_categories")}
                                                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group" 
                                                onClick={() => setSelectedCategory(null)}
                                            >
                                                <ArrowLeft size={18} className="text-gray-400 group-hover:text-white" />
                                            </button>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-1">{selectedCategory}</span>
                                                <input
                                                    type="text"
                                                    id="task-search"
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                                    placeholder={`${t("search_in")}...`}
                                                    title={t("search_in")}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                            {visibleGroups.length === 0 && (
                                                <div className="text-center py-20 text-gray-600 italic"><T k="no_tasks_found" /></div>
                                            )}
                                            {visibleGroups.map(g => {
                                                const isExpanded = expandedGroups.includes(g.id);
                                                return (
                                                    <div key={g.id} className="group/item shrink-0 flex flex-col bg-[#0f172a]/80 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/30 hover:bg-[#1e293b]/90 transition-all">
                                                        <div className="p-4 sm:p-5 cursor-pointer flex justify-between items-center" onClick={() => toggleGroup(g.id)}>
                                                            <div className="flex items-start gap-4">
                                                                <div className={`mt-0.5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                                                    <ChevronRight size={20} className="text-cyan-400" />
                                                                </div>
                                                                <div className="flex flex-col gap-1.5">
                                                                    <h5 className="font-bold text-base sm:text-lg leading-snug text-white group-hover/item:text-cyan-50">{g.description}</h5>
                                                                    <div className="flex flex-wrap gap-4 items-center">
                                                                        <span className="text-xs font-black uppercase text-emerald-400/90 tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md"><T k="remaining" />: {g.totalRemaining.toFixed(1)} {g.unit}</span>
                                                                        <span className="text-xs font-black uppercase text-cyan-400/90 tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-md">{g.averageMinsPerUnit.toFixed(1)} MIN/{g.unit}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="px-5 pb-5 pt-3 border-t border-white/10 bg-black/40">
                                                                <div className="flex flex-col gap-3">
                                                                    {g.originalTasks.map((ot, i) => (
                                                                        <div key={i} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/5 group/row hover:bg-white/20 transition-all">
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">LIGNE #{i + 1}</span>
                                                                                <span className="text-sm font-bold text-white/90">{ot.taskCode ? `[${ot.taskCode}] ` : ''}<T k="available" />: <span className="text-emerald-300">{ot.remaining.toFixed(1)} {ot.unit}</span></span>
                                                                            </div>
                                                                            <button 
                                                                                title={t("add_to_plan")}
                                                                                onClick={(e) => { e.stopPropagation(); addToCart(ot); }} 
                                                                                className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center gap-2"
                                                                            >
                                                                                <PlusCircle size={14} /> <T k="add_to_cart" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!isExpanded && (
                                                            <div className="px-5 pb-3 pt-0 flex justify-end opacity-50 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                                                                <span className="text-[10px] uppercase tracking-widest text-cyan-400 border border-cyan-400/30 rounded-full px-3 py-1">Cliquez pour voir les lignes et planifier</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </section>
                        </div>

                        {/* Right Col - Cart & Summary */}
                        <div className="lg:col-span-5 flex flex-col gap-8">
                            <section className="glass-card bg-[#0b1224] border-t-8 border-cyan-500 border-x border-white/10 rounded-[40px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] sticky top-8 max-h-[calc(100vh-4rem)] flex flex-col">
                                <div className="flex justify-between items-end mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-2 flex items-center gap-2">
                                            <ShoppingBag size={14} /> <T k="weekly_cart" />
                                        </span>
                                        <h3 className="text-4xl font-black tracking-tighter">
                                            {currentlyPlannedHours.toFixed(1)} <span className="text-lg font-light opacity-40">/ {targetHours}h</span>
                                        </h3>
                                    </div>
                                    <div className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter ${isNearTarget ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 text-cyan-500'}`}>
                                        {((currentlyPlannedHours / targetHours) * 100).toFixed(0)}% <T k="load" />
                                    </div>
                                </div>

                                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-10 relative">
                                    <style>{`
                                        .capacity-progress { width: ${Math.min(100, (currentlyPlannedHours / targetHours) * 100)}%; }
                                    `}</style>
                                    <div className="absolute left-[100%] top-0 bottom-0 w-1 bg-white/20 z-10" />
                                    <div className={`capacity-progress h-full transition-all duration-700 ease-out rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] ${isNearTarget ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-cyan-600 to-blue-500'}`} />
                                </div>

                                {/* Cart Items Scrollable Area */}
                                <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                                    {cartItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-black/20 rounded-[30px] border border-dashed border-white/5">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                                <ShoppingBag size={30} />
                                            </div>
                                            <p className="text-sm text-gray-500 italic max-w-xs"><T k="empty_plan_msg" /></p>
                                        </div>
                                    ) : (
                                        cartItems.map((item) => {
                                            const task = tasks.find(t => t.id === item.taskId);
                                            if (!task) return null;
                                            return (
                                                <div key={item.id} className="p-5 bg-white/5 rounded-[30px] border border-white/5 relative group/cart hover:bg-white/10 transition-all">
                                                    <div className="flex justify-between items-start gap-4 mb-4">
                                                        <h6 className="font-bold text-sm leading-tight text-white/90">{task.description}</h6>
                                                        <button 
                                                            title={t("remove_item")}
                                                            onClick={() => removeCartItem(item.id)} 
                                                            className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className="relative flex-1">
                                                            <input 
                                                                type="number" 
                                                                className="w-full bg-cyan-950/40 border-2 border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl py-3 pl-4 pr-16 text-white text-xl font-black focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder:text-white/20" 
                                                                value={item.planQty || ''} 
                                                                onChange={(e) => updateCartItem(item.id, { planQty: parseFloat(e.target.value) || 0 })}
                                                                placeholder="0.0"
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/40 border border-white/5 rounded-lg pointer-events-none">
                                                                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">{task.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col shrink-0 min-w-[70px]">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-600/20 px-2 py-0.5 rounded-md inline-block mb-1"><T k="duration" /></span>
                                                            <span className="text-base font-black text-cyan-400">{((item.planQty * task.minutesPerUnit) / 60).toFixed(1)}<span className="text-xs">h</span></span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[0, 1].map(locIndex => (
                                                            <select 
                                                                key={locIndex}
                                                                title={locIndex === 0 ? t("location") : t("add_location")}
                                                                className="bg-black/20 border border-white/5 rounded-xl py-2 px-3 text-[10px] font-bold text-gray-400 focus:outline-none focus:border-cyan-500/40"
                                                                value={item.locations[locIndex] || ''}
                                                                onChange={(e) => {
                                                                    const newLocs = [...item.locations];
                                                                    newLocs[locIndex] = e.target.value;
                                                                    updateCartItem(item.id, { locations: newLocs.filter(Boolean) });
                                                                }}
                                                            >
                                                                <option value="">{locIndex === 0 ? t("location") : t("add_location")}</option>
                                                                {subLocations.map(sl => (
                                                                    <option key={sl} value={sl}>{sl}</option>
                                                                ))}
                                                            </select>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Checklist Section */}
                                <section className="mb-8 shrink-0 bg-black/20 rounded-[30px] p-6 border border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-cyan-500 rounded-full" /> <T k="readiness_checklist" />
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { k: 'drawings', label: 'drawings_ready' },
                                            { k: 'materials', label: 'materials_onsite' },
                                            { k: 'tools', label: 'tools_ready' },
                                            { k: 'sub', label: 'sub_ready' }
                                        ].map(item => (
                                            <button 
                                                key={item.k}
                                                title={t(item.label)}
                                                onClick={() => setChecks(p => ({ ...p, [item.k]: !p[item.k as keyof typeof checks] }))}
                                                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between group ${ checks[item.k as keyof typeof checks] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-600 hover:border-white/10' }`}
                                            >
                                                <span><T k={item.label} /></span>
                                                <div className={`w-2 h-2 rounded-full ${checks[item.k as keyof typeof checks] ? 'bg-emerald-400 animate-pulse' : 'bg-gray-800'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Action Bar */}
                                <div className="flex flex-col gap-4 shrink-0 pb-2">
                                    <button 
                                        className="w-full py-5 rounded-[25px] bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:shadow-cyan-500/50 hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 relative overflow-hidden" 
                                        onClick={submitPlan} 
                                        disabled={cartItems.length === 0 || isSubmitting}
                                    >
                                        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <T k="validate_and_save_plan" />}
                                    </button>
                                    
                                    {materialsForecast.length > 0 && (
                                        <p className="text-[10px] text-center text-gray-500 font-medium px-4">
                                            <T k="material_forecast_hint" /> {materialsForecast.length} <T k="types_of_materials" />.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>
            
            {/* Custom Scrollbar Styling */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}

import Link from "next/link";
