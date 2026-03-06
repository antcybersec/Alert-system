import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from '../../context/AuthContext';
import { sanitizeKey } from '../../utils/firebaseUtils';

const Analytics = () => {
    const [lineData, setLineData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [totalReports, setTotalReports] = useState(0);
    const [barData, setBarData] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [maxHeat, setMaxHeat] = useState(1);

    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser?.department) return;
        const db = getDatabase();
        const sanitizedDept = sanitizeKey(currentUser.department);
        const reportsRef = ref(db, `reports/by_department/${sanitizedDept}`);

        const unsubscribe = onValue(reportsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const reportsArray = Object.values(data);
                setTotalReports(reportsArray.length);

                // --- 1. Pie Chart (Categories) ---
                const categoryCounts = {};
                reportsArray.forEach(report => {
                    const cat = report.category ? (report.category.charAt(0).toUpperCase() + report.category.slice(1)) : 'Other';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
                const newPieData = Object.keys(categoryCounts).map((cat, index) => ({
                    name: cat,
                    value: categoryCounts[cat],
                    color: ['#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899'][index % 5]
                }));
                setPieData(newPieData);


                // --- 2. Line Chart (Last 7 Days) ---
                const last7Days = {};
                const today = new Date();
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    // Store full date object for comparison but key by string
                    last7Days[dateStr] = 0;
                }

                // Helper to get date string key
                const getDateKey = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                reportsArray.forEach(report => {
                    if (report.createdAt) {
                        const dateStr = getDateKey(new Date(report.createdAt));
                        // Check if this date is in our last 7 days range (simplistic check via key existence)
                        // A better way is to check timestamps, but this works for valid keys
                        if (Object.keys(last7Days).includes(dateStr)) {
                            last7Days[dateStr]++;
                        }
                    }
                });
                const newLineData = Object.keys(last7Days).map(date => ({
                    name: date,
                    reports: last7Days[date]
                }));
                setLineData(newLineData);


                // --- 3. Bar Chart (Avg Active Time by Area) ---
                const areaStats = {}; // { "Sector 4": { totalHours: 100, count: 5 } }
                const now = new Date();

                reportsArray.forEach(report => {
                    if (report.createdAt && report.location && report.location.address) {
                        // Extract "Area" - simplified logic: first meaningful part before comma
                        let area = report.location.address.split(',')[0].trim();
                        if (area.length > 15) area = area.substring(0, 15) + '...';

                        // Calculate active duration in hours
                        const created = new Date(report.createdAt);
                        // If resolved, ideally use resolvedAt. If not, use 'now'. 
                        // Since we don't have resolvedAt, we use 'now' for all to show "Age of Issue" vs "Resolution Time".
                        // Wait, user wants "Resolution Time". We can simulate "Resolved" ones having a fixed shorter time or just use Age.
                        // We'll stick to "Avg Age" as a real metric.
                        const hours = (now - created) / (1000 * 60 * 60);

                        if (!areaStats[area]) areaStats[area] = { total: 0, count: 0 };
                        areaStats[area].total += hours;
                        areaStats[area].count++;
                    }
                });

                const newBarData = Object.keys(areaStats)
                    .map(area => ({
                        name: area,
                        time: Math.round(areaStats[area].total / areaStats[area].count)
                    }))
                    .sort((a, b) => b.time - a.time) // Highest wait time first
                    .slice(0, 5); // Start with top 5

                setBarData(newBarData.length > 0 ? newBarData : [{ name: 'No Data', time: 0 }]);


                // --- 4. Heatmap (Day x Time) ---
                // Grid: 7 Cols (Mon-Sun), 5 Rows (Time Buckets)
                // Initialize grid
                const grid = Array(35).fill(0);
                let maxVal = 1;

                reportsArray.forEach(report => {
                    if (report.createdAt) {
                        const date = new Date(report.createdAt);

                        // Col: Day of week (0=Sun...6=Sat). We want Mon(0)..Sun(6).
                        let day = date.getDay(); // 0 is Sun
                        let col = day === 0 ? 6 : day - 1; // Mon=0, Tue=1 ... Sun=6

                        // Row: Hour (0-23). 5 Buckets.
                        // 0-4 (Late Night), 5-9 (Morning), 10-14 (Midday), 15-19 (Afternoon), 20-23 (Evening)
                        const hour = date.getHours();
                        let row = 0;
                        if (hour >= 5 && hour < 10) row = 1;
                        else if (hour >= 10 && hour < 15) row = 2;
                        else if (hour >= 15 && hour < 20) row = 3;
                        else if (hour >= 20) row = 4;
                        // else row = 0 (0-4)

                        // Index in 1D array (Row-major: Index = Row * 7 + Col) or Col-major?
                        // CSS Grid is row-major usually (left to right, then down).
                        // Index = row * 7 + col
                        const index = row * 7 + col;
                        grid[index]++;
                        if (grid[index] > maxVal) maxVal = grid[index];
                    }
                });

                setHeatmapData(grid);
                setMaxHeat(maxVal);

            } else {
                setTotalReports(0);
                setPieData([]);
                setLineData([]);
                setBarData([]);
                setHeatmapData(Array(35).fill(0));
            }
        });

        return () => unsubscribe();
    }, [currentUser?.department]);

    // Helper for Heatmap Color
    const getHeatColor = (value) => {
        if (value === 0) return 'bg-slate-100 dark:bg-slate-700/50';
        const intensity = value / maxHeat;
        if (intensity > 0.8) return 'bg-red-500';
        if (intensity > 0.6) return 'bg-orange-500';
        if (intensity > 0.4) return 'bg-orange-400';
        if (intensity > 0.2) return 'bg-blue-400';
        return 'bg-blue-200';
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Report</h1>
                        <p className="text-slate-500 dark:text-slate-400">Performance metrics and city health data.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Download size={18} /> Export PDF
                    </button>
                </div>

                {/* Top Row: Line and Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Reports Trend */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6">Total Reports (Last 7 Days)</h3>
                        <div className="h-64 min-h-[256px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={lineData}>
                                    <defs>
                                        <linearGradient id="colorRpt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRpt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Split */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center overflow-hidden">
                        <h3 className="font-bold text-slate-800 dark:text-white w-full mb-4">Issue Categories</h3>
                        <div className="w-full h-56 min-h-[224px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Centered Stat */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalReports}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Total</div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-3 w-full mt-4">
                            {pieData.map(item => (
                                <div key={item.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Bottom Row: Bar and Heatmap Visual */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Resolution Time Bar Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6">Avg Active Duration (Hours)</h3>
                        <div className="h-64 min-h-[256px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="time" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Heatmap Visual */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 relative z-10">Peak Incident Times</h3>

                        <div className="grid grid-cols-7 grid-rows-5 gap-1 h-64 relative z-10">
                            {heatmapData.length > 0 ? heatmapData.map((val, i) => (
                                <div
                                    key={i}
                                    className={`${getHeatColor(val)} rounded-sm opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer`}
                                    title={`Reports: ${val}`}
                                ></div>
                            )) : (
                                // Fallback loading/empty state
                                Array.from({ length: 35 }).map((_, i) => <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-sm"></div>)
                            )}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-bold mt-2 font-mono uppercase">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>

                </div>

            </div>
        </AdminLayout>
    );
};

export default Analytics;
