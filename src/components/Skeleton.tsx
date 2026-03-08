import React from "react";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div 
            className={`animate-pulse bg-white/5 rounded-xl ${className}`}
        />
    );
}


export function SkeletonCard() {
    return (
        <div className="glass-card bg-[#0a1020]/80 border border-white/5 rounded-[24px] p-6 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex gap-3">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="glass-card bg-[#0a1020]/80 border border-white/5 rounded-[24px] overflow-hidden">
            {/* Header Row */}
            <div className="flex gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            {/* Data Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-6 py-4 border-b border-white/[0.03]">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="glass-card bg-[#0a1020]/80 border border-white/5 rounded-[24px] p-6 space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-end gap-2 h-[200px] pt-8">
                <Skeleton className="flex-1 rounded-t-lg h-[45%]" />
                <Skeleton className="flex-1 rounded-t-lg h-[70%]" />
                <Skeleton className="flex-1 rounded-t-lg h-[55%]" />
                <Skeleton className="flex-1 rounded-t-lg h-[80%]" />
                <Skeleton className="flex-1 rounded-t-lg h-[40%]" />
                <Skeleton className="flex-1 rounded-t-lg h-[65%]" />
                <Skeleton className="flex-1 rounded-t-lg h-[50%]" />
            </div>
            <div className="flex gap-4 justify-center">
                <Skeleton className="h-3 w-12 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass-card bg-[#0a1020]/80 border border-white/5 rounded-[20px] p-5 space-y-3">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                    </div>
                ))}
            </div>
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SkeletonChart />
                <SkeletonChart />
            </div>
            {/* Table */}
            <SkeletonTable rows={4} />
        </div>
    );
}
