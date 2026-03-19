"use client";
import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, WifiOff, AlertTriangle, Calendar, Clock, Users, ChevronLeft, CheckCircle2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/LanguageContext";
import T from "@/components/T";
import { format, addDays, isToday, isBefore, startOfDay, isSameDay } from 'date-fns';
import { fr, enUS, nl } from 'date-fns/locale';

import { saveOfflineReport, getOfflineReports, clearOfflineReports, OfflineReport } from "@/lib/indexedDB";

interface PlanTask {
    id: string;
    plannedQuantity: number;
    task: {
        id: string;
        description: string;
        unit: string;
        minutesPerUnit: number;
        category?: string;
    };
    isAdHoc?: boolean;
}

interface PlanWithTasks {
    id: string;
    targetHoursCapacity: number;
    workersCount?: number;
    weekNumber: number;
    year: number;
    tasks: PlanTask[];
}

interface ExistingReport {
    id: string;
    date: string;
    status: string;
    workersCount: number | null;
}

const CameraInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    return React.createElement('input', {
        type: 'file',
        accept: 'image/*',
        capture: 'environment',
        ref,
        ...props
    });
});
CameraInput.displayName = 'CameraInput';

const HOURS_PER_WORKER_PER_DAY = 8;

export default function ReportWeek({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();
    const { t, language } = useTranslation();
    const locale = language === 'fr' ? fr : language === 'nl' ? nl : enUS;

    const [activePlan, setActivePlan] = useState<PlanWithTasks | null>(null);
    const [actuals, setActuals] = useState<Record<string, number>>({});
    const [taskPhotos, setTaskPhotos] = useState<Record<string, string>>({});
    const [issueCategory, setIssueCategory] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [emptyDrumsCount, setEmptyDrumsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReportSubmitted, setIsReportSubmitted] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const [workersCount, setWorkersCount] = useState<number | ''>(0);
    const [projectTasks, setProjectTasks] = useState<any[]>([]);
    const [taskCategories, setTaskCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedAdHocTaskId, setSelectedAdHocTaskId] = useState<string>("");

    const [taskLocations, setTaskLocations] = useState<Record<string, string[]>>({});
    const [subLocations, setSubLocations] = useState<string[]>([]);

    // Date/week state
    const [weekStart, setWeekStart] = useState<Date | null>(null);
    const [weekEnd, setWeekEnd] = useState<Date | null>(null);
    const [existingReports, setExistingReports] = useState<ExistingReport[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Late/backfill state
    const [lateReason, setLateReason] = useState("");
    const [lateDescription, setLateDescription] = useState("");

    // Blockage exception state
    const [blockageLogs, setBlockageLogs] = useState<Record<string, { reason: string, description: string }>>({});

    // Computed: is this a backfill (past day)?
    const isBackfill = selectedDate ? isBefore(startOfDay(selectedDate), startOfDay(new Date())) && !isToday(selectedDate) : false;

    // Computed: days of the week
    const weekDays = useMemo(() => {
        if (!weekStart) return [];
        const now = new Date();
        const currentHour = now.getHours();
        // Today is available from 8 AM onwards
        const todayAvailable = currentHour >= 8;

        return Array.from({ length: 7 }, (_, i) => {
            const day = addDays(weekStart, i);
            const dayIsToday = isToday(day);
            const dayIsPast = isBefore(startOfDay(day), startOfDay(now)) && !dayIsToday;
            const dayIsFuture = !dayIsToday && !isBefore(startOfDay(day), startOfDay(now));

            return {
                date: day,
                dayName: format(day, 'EEE', { locale }),
                dayNum: format(day, 'dd'),
                monthName: format(day, 'MMM', { locale }),
                isToday: dayIsToday,
                isFuture: dayIsFuture || (dayIsToday && !todayAvailable),
                isPast: dayIsPast,
                hasReport: existingReports.some(r => isSameDay(new Date(r.date), day)),
            };
        });
    }, [weekStart, existingReports, locale]);

    // Daily target hours
    const dailyTargetHours = typeof workersCount === 'number' && workersCount > 0
        ? workersCount * HOURS_PER_WORKER_PER_DAY
        : 0;

    useEffect(() => {
        Promise.all([
            fetch(`/api/project/${id}/active-plan`).then(res => res.json()),
            fetch(`/api/project/${id}/tasks`).then(res => res.json())
        ]).then(([planData, tasksData]) => {
            if (planData.plan) {
                setActivePlan(planData.plan);
                setWorkersCount(planData.plan.workersCount || '');
                setSubLocations(planData.subLocations || []);
                const initActuals: Record<string, number> = {};
                const initLocs: Record<string, string[]> = {};
                planData.plan.tasks.forEach((t: PlanTask) => {
                    initActuals[t.id] = 0;
                    if ((t as any).locations) {
                        try {
                            initLocs[t.id] = JSON.parse((t as any).locations);
                        } catch {}
                    }
                });
                setActuals(initActuals);
                setTaskLocations(initLocs);
            }
            if (planData.weekStart) setWeekStart(new Date(planData.weekStart));
            if (planData.weekEnd) setWeekEnd(new Date(planData.weekEnd));
            if (planData.existingReports) setExistingReports(planData.existingReports);

            // Default selected date to today
            setSelectedDate(startOfDay(new Date()));

            if (tasksData.tasks) {
                setProjectTasks(tasksData.tasks);
                const categories = Array.from(new Set(tasksData.tasks.map((t: any) => t.category || 'Uncategorized'))) as string[];
                setTaskCategories(categories);
            }
            if (tasksData.subLocations && !planData.plan) {
                setSubLocations(tasksData.subLocations);
            }
            setLoading(false);
        }).catch(console.error);
    }, [id]);

    useEffect(() => {
        const handleOnline = async () => {
            setIsOffline(false);
            try {
                const reports = await getOfflineReports();
                if (reports.length > 0) {
                    for (const rep of reports) {
                        const res = await fetch(rep.url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(rep.body)
                        });
                        if (res.ok && rep.photos) {
                            for (const [tId, base64Photo] of Object.entries(rep.photos)) {
                                if (!base64Photo) continue;
                                try {
                                    await fetch(`/api/project/${rep.id}/report/upload-photo`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            planTaskId: tId,
                                            base64Photo: base64Photo,
                                            caption: "Photo (Offline Sync)"
                                        })
                                    });
                                } catch (e) { console.error(e); }
                            }
                        }
                    }
                    await clearOfflineReports();
                    toast.success(t("network_restored"));
                }
            } catch (e) {
                console.error("Erreur de synchronisation", e);
            }
        };

        const handleOffline = () => setIsOffline(true);

        if (typeof window !== 'undefined') {
            if (navigator.onLine !== undefined) {
                setTimeout(() => setIsOffline(!navigator.onLine), 0);
            }
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            }
        };
    }, [t]);

    // Fetch daily report data when selectedDate changes and it has a report
    useEffect(() => {
        if (!selectedDate || !activePlan) return;
        
        const hasReport = existingReports.some(r => isSameDay(new Date(r.date), selectedDate));
        
        if (hasReport) {
            setLoading(true);
            fetch(`/api/project/${id}/report?date=${selectedDate.toISOString()}`)
                .then(res => res.json())
                .then(data => {
                    setLoading(false);
                    if (data.report) {
                        setIsReportSubmitted(data.report.status === 'SUBMITTED');
                        setWorkersCount(data.report.workersCount || activePlan?.workersCount || '');
                        
                        const newActuals: Record<string, number> = {};
                        if (data.report.taskProgress) {
                            data.report.taskProgress.forEach((p: any) => {
                                // Map from global taskId back to this week's plan task ID if possible
                                const wpt = activePlan?.tasks.find(t => t.task?.id === p.taskId);
                                if (wpt) {
                                    newActuals[wpt.id] = p.quantity;
                                } else {
                                    // Fallback for ad-hoc tasks, keyed by global taskId in UI state
                                    newActuals[p.taskId] = p.quantity;
                                }
                            });
                        }
                        setActuals(prev => ({ ...prev, ...newActuals }));
                        
                        if (data.report.issues) {
                            setIssueDescription(data.report.issues);
                        }
                        if (data.report.lateReason) {
                            setLateReason(data.report.lateReason);
                            setLateDescription(data.report.lateDescription || '');
                        }
                    }
                })
                .catch(err => {
                    setLoading(false);
                    console.error("Failed to fetch report detail:", err);
                });
        } else {
            // Reset state for new report
            setIsReportSubmitted(false);
            setIssueDescription("");
            setLateReason("");
            setLateDescription("");
            const initActuals: Record<string, number> = {};
            activePlan.tasks.forEach((t: PlanTask) => {
                initActuals[t.id] = 0;
            });
            setActuals(initActuals);
        }
    }, [selectedDate, activePlan, existingReports, id]);

    const handleActualChange = (planTaskId: string, valStr: string) => {
        const val = parseFloat(valStr) || 0;
        setActuals(prev => ({ ...prev, [planTaskId]: val }));
    };

    const handlePhotoCapture = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = event.target?.result as string;
            setTaskPhotos(prev => ({ ...prev, [taskId]: base64Str }));
        };
        reader.readAsDataURL(file);
    };

    const addAdHocTask = () => {
        if (!selectedAdHocTaskId || !activePlan) return;
        const taskDef = projectTasks.find(t => t.id === selectedAdHocTaskId);
        if (!taskDef) return;

        const tempId = `temp_${Date.now()}`;
        
        const newTask: PlanTask = {
            id: tempId,
            plannedQuantity: 0,
            task: {
                id: taskDef.id,
                description: taskDef.description,
                unit: taskDef.unit,
                minutesPerUnit: taskDef.minutesPerUnit,
                category: taskDef.category
            },
            isAdHoc: true
        };

        setActivePlan({
            ...activePlan,
            tasks: [...activePlan.tasks, newTask]
        });
        
        setActuals(prev => ({ ...prev, [tempId]: 0 }));
        setSelectedAdHocTaskId("");
    };

    const submitReport = async () => {
        // Validate backfill reason
        if (isBackfill && !lateReason) {
            toast.error(t("late_reason_required") || "Please select a reason for the late report.");
            return;
        }

        // Check if this date already has a SUBMITTED report (DRAFT reports will be auto-cleaned by backend)
        if (selectedDate && existingReports.some(r => isSameDay(new Date(r.date), selectedDate) && r.status === 'SUBMITTED')) {
            toast.error(t("report_exists_for_date") || "A report already exists for this date.");
            return;
        }

        const adHocTasksPayload = activePlan?.tasks
            .filter(t => t.isAdHoc)
            .map(t => ({
                tempId: t.id,
                taskId: t.task.id,
                actualQuantity: actuals[t.id] || 0,
                locations: taskLocations[t.id]
            }));

        // Format selectedDate to strictly YYYY-MM-DD in local time
        const localDateStr = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : undefined;

        const payload = {
            planId: activePlan?.id,
            actuals,
            locations: taskLocations,
            issues: issueDescription,
            missedTargetReason: !hitTarget ? issueCategory : null,
            emptyDrumsCount,
            workersCount: typeof workersCount === 'number' ? workersCount : undefined,
            adHocTasks: adHocTasksPayload,
            blockageLogs,
            reportDate: localDateStr,
            lateReason: isBackfill ? lateReason : undefined,
            lateDescription: isBackfill ? lateDescription : undefined,
        };

        if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            const offlineReport: OfflineReport = {
                id: id,
                url: `/api/project/${id}/report`,
                body: payload,
                photos: taskPhotos,
                timestamp: new Date().toISOString()
            };
            await saveOfflineReport(offlineReport);
            toast.info(t("offline_mode_detected"));
            router.push('/sm/dashboard');
            return;
        }

        const res = await fetch(`/api/project/${id}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            const mapping = data.adHocIdsMapping || {};

            for (const [tId, base64Photo] of Object.entries(taskPhotos)) {
                if (!base64Photo) continue;
                
                const realTaskId = mapping[tId] || tId;

                try {
                    await fetch(`/api/project/${id}/report/upload-photo`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            planTaskId: realTaskId,
                            base64Photo,
                            caption: "Photo proof"
                        })
                    });
                } catch (e) {
                    console.error("Photo upload failed:", e);
                }
            }
            toast.success(t("report_submitted") || "Report submitted!");
            router.push('/sm/dashboard');
        } else {
            const errData = await res.json();
            toast.error(errData.error || t("error_submitting_report") || "Error submitting report");
        }
    };

    const unsubmitReport = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/project/${id}/report/unsubmit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate ? selectedDate.toISOString() : undefined })
            });

            if (res.ok) {
                setIsReportSubmitted(false);
                // Remove the deleted report from local state so the date is free for resubmission
                if (selectedDate) {
                    setExistingReports(prev => prev.filter(r => !isSameDay(new Date(r.date), selectedDate)));
                }
                // Reset actuals to zero so the SM can fill them in fresh
                if (activePlan) {
                    const initActuals: Record<string, number> = {};
                    activePlan.tasks.forEach((t: PlanTask) => {
                        initActuals[t.id] = 0;
                    });
                    setActuals(initActuals);
                }
                setIssueDescription("");
                setLateReason("");
                setLateDescription("");
                toast.success(t("report_unlocked") || "Rapport supprimé — vous pouvez le refaire");
            } else {
                toast.error(t("error_unlocking_report") || "Error unlocking report");
            }
        } catch (err) {
            toast.error(t("error_unlocking_report") || "Error unlocking report");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !activePlan) return <div className="aurora-page flex items-center justify-center text-cyan-400 font-bold animate-pulse"><T k="checking_db" /></div>;

    if (!activePlan) return (
        <div className="aurora-page flex flex-col items-center justify-center text-center p-6">
            <AlertCircle size={48} className="text-orange-500 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
            <h2 className="text-2xl font-bold text-white mb-2"><T k="no_active_plan" /></h2>
            <p className="text-gray-400 mb-8 max-w-sm"><T k="no_active_plan_desc" /></p>
            <button 
                className="px-8 py-4 rounded-sm bg-cyan-600/20 text-cyan-400 font-bold border border-cyan-500/50 hover:bg-cyan-500 hover:text-[#050810] transition-colors" 
                onClick={() => router.push(`/sm/project/${id}/plan`)}
                title={t("plan_next_week_title")}
            >
                <T k="plan_next_week_title" />
            </button>
        </div>
    );

    let totalAchievedMins = 0;
    activePlan.tasks.forEach((t: PlanTask) => {
        const qty = actuals[t.id] || 0;
        totalAchievedMins += (qty * t.task.minutesPerUnit);
    });
    const totalAchievedHours = totalAchievedMins / 60;
    const hitTarget = dailyTargetHours > 0 ? totalAchievedHours >= dailyTargetHours : false;

    // Week label
    const weekLabel = weekStart && weekEnd
        ? `S${activePlan.weekNumber} · ${format(weekStart, 'dd MMM', { locale })} → ${format(weekEnd, 'dd MMM', { locale })}`
        : `S${activePlan.weekNumber || '?'}`;

    return (
        <div className="aurora-page text-white p-4 sm:p-8 pb-32 selection:bg-orange-500/30 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                
                {/* Header with Week Context */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => router.push('/sm/dashboard')}
                        title={t("back_to_dashboard")}
                        className="flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 transition-colors mb-2 group w-fit"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest"><T k="back_to_dashboard" /></span>
                    </button>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                <T k="daily_report_title" />
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-cyan-500/10 border border-cyan-500/20">
                                    <Calendar size={14} className="text-cyan-400" />
                                    <span className="text-sm font-bold text-cyan-400">{weekLabel}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-purple-500/10 border border-purple-500/20">
                                    <Clock size={14} className="text-purple-400" />
                                    <span className="text-sm font-bold text-purple-400">{activePlan.targetHoursCapacity.toFixed(0)}h <T k="weekly_planned" /></span>
                                </div>
                            </div>
                        </div>
                        {isOffline && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-red-500/10 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <WifiOff size={16} className="text-red-400" />
                                <span className="text-xs font-bold text-red-400 tracking-wider"><T k="offline_badge" /></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ DAY PICKER ═══════════════ */}
                <div className="mechanical-panel p-4 sm:p-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                        <Calendar size={14} className="text-orange-400" />
                        <T k="select_day" />
                    </div>
                    <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {weekDays.map((day) => {
                            const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
                            const isDisabled = day.isFuture;
                            
                            return (
                                <button
                                    key={day.date.toISOString()}
                                    onClick={() => !isDisabled && setSelectedDate(startOfDay(day.date))}
                                    disabled={isDisabled}
                                    className={`
                                        relative flex flex-col items-center py-3 px-1 sm:px-3 rounded-md border transition-all duration-200
                                        ${isSelected
                                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] scale-105'
                                            : day.isToday
                                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                                                : day.hasReport
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default opacity-80'
                                                    : day.isPast
                                                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-400/80 hover:bg-amber-500/10 hover:border-amber-500/40'
                                                        : 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed opacity-40'
                                        }
                                    `}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{day.dayName}</span>
                                    <span className="text-xl sm:text-2xl font-black leading-none mt-1">{day.dayNum}</span>
                                    <span className="text-[10px] font-bold opacity-60 mt-0.5">{day.monthName}</span>
                                    
                                    {/* Status badges */}
                                    {day.hasReport && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-sm bg-emerald-500 flex items-center justify-center shadow-lg">
                                            <CheckCircle2 size={12} className="text-white" />
                                        </div>
                                    )}
                                    {day.isPast && !day.hasReport && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-sm bg-amber-500 flex items-center justify-center shadow-lg animate-pulse">
                                            <AlertTriangle size={10} className="text-white" />
                                        </div>
                                    )}
                                    {day.isToday && !day.hasReport && (
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-sm bg-cyan-500 text-[8px] font-black text-white uppercase tracking-wider shadow-lg">
                                            {t("today") || "Today"}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected date summary */}
                    {selectedDate && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">
                                    {format(selectedDate, 'EEEE d MMMM yyyy', { locale })}
                                </span>
                                {isBackfill && (
                                    <span className="px-2 py-0.5 rounded-sm bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase">
                                        <T k="late_report" />
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════════════ LATE REPORT REASON (Backfill only) ═══════════════ */}
                {isBackfill && (
                    <div className="mechanical-panel p-6 border-l-4 border-amber-500">
                        <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            <T k="late_report_reason_title" />
                        </h3>
                        <p className="text-gray-400 text-sm mb-4"><T k="late_report_reason_desc" /></p>
                        <select 
                            aria-label="Late report reason"
                            className="w-full bg-[#050810]/80 border border-amber-500/40 text-white rounded-md py-4 px-4 outline-none focus:ring-1 focus:ring-amber-500 appearance-none font-bold mb-3"
                            value={lateReason}
                            onChange={(e) => setLateReason(e.target.value)}
                        >
                            <option value="">{t("select_late_reason") || "-- Select a reason --"}</option>
                            <option value="ABSENT">{t("late_absent") || "Absent from site"}</option>
                            <option value="FORGOT">{t("late_forgot") || "Forgot to submit"}</option>
                            <option value="NO_CONNECTIVITY">{t("late_no_connectivity") || "No internet connection"}</option>
                            <option value="OTHER">{t("late_other") || "Other"}</option>
                        </select>
                        {lateReason === 'OTHER' && (
                            <textarea
                                className="w-full bg-[#050810]/60 border border-amber-500/20 text-white rounded-md py-3 px-4 outline-none focus:border-amber-500 resize-none placeholder:text-gray-600 disabled:opacity-50"
                                rows={2}
                                placeholder={t("describe_reason") || "Describe the reason..."}
                                value={lateDescription}
                                onChange={(e) => setLateDescription(e.target.value)}
                                disabled={isReportSubmitted}
                            />
                        )}
                    </div>
                )}

                {/* ═══════════════ WORKFORCE + DAILY TARGET ═══════════════ */}
                <div className="mechanical-panel p-6 flex flex-col sm:flex-row gap-6 justify-between items-center focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                    <div className="flex flex-col flex-1 pr-4">
                        <label htmlFor="workersCount" className="font-bold text-white/90 text-xl mb-1 leading-tight flex items-center gap-2">
                            <Users size={20} className="text-cyan-400" />
                            <T k="workforce_count_label" />
                        </label>
                        <div className="text-gray-400 text-sm font-medium tracking-wide"><T k="workforce_count_desc" /></div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative sm:w-[150px]">
                            <input
                                id="workersCount"
                                type="number"
                                className="w-full bg-[#050810]/50 border border-white/10 text-white text-2xl font-black rounded-md py-4 px-4 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all text-center disabled:opacity-50"
                                placeholder="0"
                                min="0"
                                value={workersCount}
                                disabled={isReportSubmitted}
                                onChange={(e) => setWorkersCount(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">
                                <T k="daily_target" />
                            </div>
                            <div className="text-3xl font-black text-white">
                                {dailyTargetHours}<span className="text-sm font-medium text-gray-400">h</span>
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {typeof workersCount === 'number' ? workersCount : 0} × {HOURS_PER_WORKER_PER_DAY}h
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ PROGRESS DISPLAY (Daily) ═══════════════ */}
                <div className="mechanical-panel flex p-8 items-center divide-x divide-white/10 relative overflow-hidden group">
                    <div className="shape-container right-1/2 top-[-50px] translate-x-1/2 scale-150 opacity-20 z-0">
                        <div className="css-radar-plate"></div>
                    </div>
                    <div className="px-6 text-center flex-1 relative z-10">
                        <div className="text-pink-400 text-xs font-bold uppercase tracking-widest mb-3 drop-shadow-md"><T k="daily_target" /></div>
                        <div className="text-4xl font-black text-white drop-shadow-lg">{dailyTargetHours.toFixed(1)} <span className="text-lg font-medium text-gray-400"><T k="hours" /></span></div>
                    </div>
                    <div className="px-6 text-center flex-1 relative z-10">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3 drop-shadow-md"><T k="achieved" /></div>
                        <div className={`text-5xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${hitTarget ? 'text-green-400' : 'text-orange-400'}`}>
                            {totalAchievedHours.toFixed(1)} <span className="text-lg font-medium text-gray-400"><T k="hours" /></span>
                        </div>
                    </div>
                </div>

                {/* Task Entry List */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2"><T k="recorded_activity" /></h3>
                    {activePlan.tasks.map((pt: PlanTask) => (
                        <div key={pt.id} className="mechanical-panel p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                            <div className="flex flex-col flex-1 pr-4">
                                <label htmlFor={`actual_${pt.id}`} className="font-bold text-white/90 text-lg mb-1 leading-tight flex items-center flex-wrap gap-2">
                                    {pt.task.description}
                                    {pt.isAdHoc && <span className="text-xs bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold"><T k="non_planifie_badge" /></span>}
                                </label>
                                {!pt.isAdHoc && <div className="text-cyan-400/80 text-xs font-bold tracking-wider uppercase"><T k="planned_qty_var" />{pt.plannedQuantity} <T k={pt.task.unit} /></div>}
                            </div>
                            
                            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                <div className="relative flex-1 sm:w-[120px]">
                                    <input
                                        id={`actual_${pt.id}`}
                                        type="number"
                                        className="w-full bg-[#050810]/50 border border-white/10 text-white text-xl font-bold rounded-md py-4 px-4 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all text-center"
                                        placeholder="0"
                                        min="0"
                                        value={actuals[pt.id] || ''}
                                        onChange={(e) => handleActualChange(pt.id, e.target.value)}
                                        disabled={isReportSubmitted}
                                    />
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold"><T k={pt.task.unit} /></span>
                                    </div>
                                </div>
                                
                                <label htmlFor={`photo_${pt.id}`} className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-md cursor-pointer transition-all ${taskPhotos[pt.id] ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'} border`}>
                                    <Camera size={24} />
                                    <CameraInput 
                                        id={`photo_${pt.id}`}
                                        className="hidden"
                                        onChange={(e) => handlePhotoCapture(pt.id, e)} 
                                        disabled={isReportSubmitted}
                                    />
                                </label>
                            </div>
                            
                            {/* Locations Dropdowns */}
                            <div className="w-full mt-4 pt-4 border-t border-white/10 sm:col-span-2">
                                <div className="text-xs text-gray-400 mb-2 font-medium tracking-wider uppercase"><T k="execution_locations" /></div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[0, 1, 2, 3].map(locIndex => (
                                        <select 
                                            key={locIndex}
                                            aria-label={`Localisation ${locIndex + 1}`}
                                            className="bg-[#050810]/50 border border-white/10 text-gray-300 text-xs py-2 px-2 rounded-md outline-none focus:border-cyan-400 font-medium transition-colors disabled:opacity-50"
                                            value={(taskLocations[pt.id] || [])[locIndex] || ''}
                                            disabled={isReportSubmitted}
                                            onChange={(e) => {
                                                const newLocs = [...(taskLocations[pt.id] || [])];
                                                newLocs[locIndex] = e.target.value;
                                                setTaskLocations(prev => ({ ...prev, [pt.id]: newLocs.filter(Boolean) }));
                                            }}
                                        >
                                            <option value=""><T k="none" /></option>
                                            {subLocations.map(sl => (
                                                <option key={sl} value={sl}>{sl}</option>
                                            ))}
                                        </select>
                                    ))}
                                </div>
                            </div>

                            {/* Blockage Exception Warning */}
                            {!pt.isAdHoc && (actuals[pt.id] || 0) > pt.plannedQuantity && (
                                <div className="w-full mt-4 pt-4 border-t border-amber-500/20">
                                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-3">
                                        <AlertTriangle size={14} className="animate-pulse" />
                                        <span><T k="qty_exceeds_planned" /> ({actuals[pt.id]}) / ({pt.plannedQuantity})</span>
                                    </div>
                                    <select
                                        aria-label="Raison du dépassement"
                                        className="w-full bg-amber-950/30 border border-amber-500/30 text-amber-200 text-sm py-2.5 px-4 rounded-md outline-none focus:border-amber-400 font-medium mb-2 disabled:opacity-50"
                                        value={blockageLogs[pt.id]?.reason || ''}
                                        disabled={isReportSubmitted}
                                        onChange={(e) => setBlockageLogs(prev => ({ ...prev, [pt.id]: { ...prev[pt.id], reason: e.target.value, description: prev[pt.id]?.description || '' } }))}
                                    >
                                        <option value="">-- <T k="select_reason" /> --</option>
                                        <option value="SCOPE_CHANGE"><T k="scope_change" /></option>
                                        <option value="REWORK"><T k="rework" /></option>
                                        <option value="EMERGENCY"><T k="emergency" /></option>
                                        <option value="OTHER"><T k="other_reason" /></option>
                                    </select>
                                    <textarea
                                        className="w-full bg-amber-950/20 border border-amber-500/20 text-white text-sm py-2.5 px-4 rounded-md outline-none focus:border-amber-400 placeholder:text-amber-800 resize-none disabled:opacity-50"
                                        rows={2}
                                        placeholder={t("describe_overrun") || "Describe the reason for exceeding planned quantity..."}
                                        value={blockageLogs[pt.id]?.description || ''}
                                        disabled={isReportSubmitted}
                                        onChange={(e) => setBlockageLogs(prev => ({ ...prev, [pt.id]: { ...prev[pt.id], reason: prev[pt.id]?.reason || 'OTHER', description: e.target.value } }))}
                                    />
                                </div>
                            )}

                        </div>
                    ))}
                </div>

                {/* Ad-Hoc Task Entry */}
                <div className="mechanical-panel p-6 mt-2 relative overflow-hidden">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-orange-400"><T k="add_unplanned_task" /></h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select 
                            className="flex-1 bg-[#050810]/50 border border-white/10 text-white py-3 px-4 rounded-md outline-none focus:border-orange-400 disabled:opacity-50"
                            value={selectedCategory || ""}
                            title={t('select_category')}
                            disabled={isReportSubmitted}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedAdHocTaskId("");
                            }}
                        >
                            <option value="">-- <T k="select_category" /> --</option>
                            {taskCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        
                        <select
                            className="flex-[2] bg-[#050810]/50 border border-white/10 text-white py-3 px-4 rounded-md outline-none focus:border-orange-400 disabled:opacity-50"
                            value={selectedAdHocTaskId || ""}
                            title={t('select_task')}
                            onChange={(e) => setSelectedAdHocTaskId(e.target.value)}
                            disabled={!selectedCategory || isReportSubmitted}
                        >
                            <option value="">-- <T k="select_task" /> --</option>
                            {projectTasks.filter(t => (t.category || 'Uncategorized') === selectedCategory).map(t => (
                                <option key={t.id} value={t.id}>{t.description} ({t.unit})</option>
                            ))}
                        </select>

                        <button 
                            className="bg-orange-500/20 border border-orange-500/50 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-md transition-colors disabled:opacity-50"
                            onClick={addAdHocTask}
                            title={t('add_btn')}
                            disabled={!selectedAdHocTaskId}
                        >
                            <T k="add_btn" />
                        </button>
                    </div>
                </div>

                {/* Issues section */}
                <div className="mechanical-panel p-8 mt-4 relative overflow-hidden group">
                    <div className="shape-container left-[-50px] bottom-[-50px] scale-100 opacity-20 z-0">
                        <div className="css-holo-core"></div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-white mb-6 drop-shadow-md"><T k="issues_observations" /></h3>
                    
                    {!hitTarget && (
                        <div className="mb-6 p-4 rounded-md bg-orange-500/10 border border-orange-500/30 animate-pulse">
                            <p className="text-orange-400 text-sm font-bold flex items-center gap-2 mb-3">
                                <AlertCircle size={16} /> <T k="target_missed_categorize" />
                            </p>
                            <select 
                                aria-label="Raison de l'objectif manqué"
                                className="w-full bg-[#050810]/80 border border-orange-500/50 text-white rounded-md py-4 px-4 outline-none focus:ring-1 focus:ring-orange-500 appearance-none font-bold disabled:opacity-50" 
                                value={issueCategory}
                                disabled={isReportSubmitted}
                                onChange={(e) => setIssueCategory(e.target.value)}
                            >
                                <option value=""><T k="select_rca_cause" /></option>
                                <option value="MATERIAL_DELAY"><T k="MATERIAL_DELAY" /></option>
                                <option value="WEATHER"><T k="WEATHER" /></option>
                                <option value="EQUIPMENT_FAILURE"><T k="EQUIPMENT_FAILURE" /></option>
                                <option value="LABOR_SHORTAGE"><T k="LABOR_SHORTAGE" /></option>
                                <option value="PLANNING_ERROR"><T k="PLANNING_ERROR" /></option>
                                <option value="OTHER"><T k="OTHER" /></option>
                            </select>
                        </div>
                    )}
                    
                    <p className="text-gray-400 text-sm mb-4"><T k="detailed_desc_optional" /></p>

                    <textarea
                        aria-label="Description du problème"
                        className="w-full bg-[#050810]/80 border border-white/10 text-white rounded-md py-4 px-4 min-h-[120px] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 resize-y placeholder-gray-600 disabled:opacity-50"
                        placeholder={t("problem_details_placeholder")}
                        value={issueDescription}
                        disabled={isReportSubmitted}
                        onChange={(e) => setIssueDescription(e.target.value)}
                    />

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="font-bold text-white mb-1"><T k="empty_drums_title" /></h3>
                        <p className="text-gray-400 text-sm mb-4"><T k="empty_drums_desc" /></p>
                        <div className="flex items-center justify-between bg-[#050810]/50 p-4 rounded-md border border-white/5">
                            <label htmlFor="emptyDrums" className="font-medium text-gray-300 cursor-pointer"><T k="empty_drums_label" /></label>
                            <input 
                                id="emptyDrums"
                                type="number" 
                                className="w-[100px] bg-[#050810] border border-white/20 text-white text-xl font-bold rounded-md py-2 px-3 outline-none text-center focus:border-cyan-400 disabled:opacity-50" 
                                min="0"
                                value={emptyDrumsCount}
                                disabled={isReportSubmitted}
                                onChange={(e) => setEmptyDrumsCount(parseInt(e.target.value) || 0)}
                                aria-label={t("empty_drums_label")}
                            />
                        </div>
                    </div>
                    </div>
                </div>

                {/* Floating Submit Action */}
                <div className="fixed bottom-0 left-0 w-full p-4 sm:p-6 bg-gradient-to-t from-[#050810] via-[#050810]/90 to-transparent flex justify-center z-50">
                    <div className="flex gap-4 w-full max-w-7xl">
                        <button 
                            className="flex-1 py-4 sm:py-5 rounded-full bg-white/5 border border-white/10 text-white font-bold tracking-wider uppercase text-sm hover:bg-white/10 transition-colors backdrop-blur-md" 
                            onClick={() => router.push('/sm/dashboard')}
                            title={t("cancel")}
                        >
                            <T k="cancel" />
                        </button>
                        {isReportSubmitted ? (
                            <button 
                                className="flex-[2] py-4 sm:py-5 rounded-full font-black tracking-wider uppercase text-sm text-white shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all hover:scale-[1.02] bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center gap-2" 
                                onClick={unsubmitReport}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Unlock size={18} />
                                        Correction Rapport
                                    </>
                                )}
                            </button>
                        ) : (
                            <button 
                                className={`flex-[2] py-4 sm:py-5 rounded-full font-black tracking-wider uppercase text-sm text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all hover:scale-[1.02] ${isOffline ? 'bg-yellow-600' : isBackfill ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} 
                                onClick={submitReport}
                                disabled={isBackfill && !lateReason || isSubmitting}
                                title={isOffline ? t("save_locally") : isBackfill ? (t("submit_late_report") || "Submit Late Report") : t("submit_report")}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                                ) : (
                                    isOffline ? <T k="save_locally" /> : isBackfill ? (t("submit_late_report") || "Submit Late Report") : <T k="submit_report" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
