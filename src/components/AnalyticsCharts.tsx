/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip as PieTooltip } from 'recharts';
import { useTranslation } from "@/lib/LanguageContext";

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function RCAPieChart({ data }: { data: { name: string, value: number }[] }) {
    const { t } = useTranslation();
    const translatedData = data.map(item => ({ ...item, name: t(item.name) }));
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={translatedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <PieTooltip 
                        contentStyle={{ backgroundColor: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ProjectProgressChart({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="totalHours" name={t("planned_hours")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="achievedHours" name={t("achieved_hours")} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function WeeklyPerformanceChart({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="week" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="plannedQuantity" name={t("planned_quantity")} stroke="#3b82f6" strokeWidth={3} />
                    <Line type="monotone" dataKey="actualQuantity" name={t("actual_quantity")} stroke="#10b981" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function EVMBurndownChart({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="index" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="planned" name={t("planned_value_pv")} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="earned" name={t("earned_value_ev")} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="burned" name={t("burned_hours_ac")} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function BenchmarkingChart({ data }: { data: any[] }) {
    const { t } = useTranslation();
    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{fontSize: 11, fill: '#cbd5e1'}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, t("efficiency")]}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="efficiency" radius={[0, 4, 4, 0]} barSize={24}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isMine ? '#06b6d4' : '#334155'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

