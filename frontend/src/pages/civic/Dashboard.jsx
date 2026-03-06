import React, { useState, useEffect } from 'react';
import { Camera, Map, AlertTriangle, TrendingUp, Award, Users, Activity, MapPin, Clock, CheckCircle, XCircle, FileText, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import AlertBanner from '../../components/AlertBanner';
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from '../../services/firebase';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, rejected: 0 });
    const [recentReports, setRecentReports] = useState([]);
    const [nearbyReports, setNearbyReports] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getDatabase(auth.app);
        const reportsRef = ref(db, 'reports');

        const unsubscribeReports = onValue(reportsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const reportsArray = Object.values(data);

                const cleanMobile = currentUser?.mobile?.replace(/\D/g, '') || "";
                const userReports = reportsArray.filter(r => {
                    const reportUser = (r.userId || "").replace(/\D/g, "");
                    return r.userId === currentUser?.uid || (cleanMobile && reportUser.includes(cleanMobile));
                });

                let areaReports = [];
                if (currentUser?.address) {
                    const userAddrParts = currentUser.address.split(',');
                    const userCity = userAddrParts.length > 1
                        ? userAddrParts[userAddrParts.length - 1].trim().toLowerCase()
                        : currentUser.address.toLowerCase();
                    areaReports = reportsArray.filter(r => {
                        const rAddr = (r.location?.address || "").toLowerCase();
                        return rAddr.includes(userCity);
                    });
                } else {
                    areaReports = reportsArray;
                }

                const pending = userReports.filter(r => r.status === 'Pending').length;
                const resolved = userReports.filter(r => r.status === 'Resolved' || r.status === 'Accepted').length;
                const rejected = userReports.filter(r => r.status === 'Rejected').length;
                setStats({ total: userReports.length, pending, resolved, rejected });

                const sorted = areaReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
                setRecentReports(sorted);

                const last7Days = generateWeeklyData(userReports);
                setWeeklyData(last7Days);

                const categories = generateCategoryData(userReports);
                setCategoryData(categories);

                setLoading(false);
            }
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`${API_BASE_URL}/api/reports/nearby?lat=${latitude}&lng=${longitude}&radius=5`);
                    if (res.ok) {
                        const data = await res.json();
                        setNearbyReports(data.reports || []);
                    }
                } catch (e) {
                    console.error("Nearby Fetch Error", e);
                }
            });
        }

        return () => unsubscribeReports();
    }, [currentUser]);

    const generateWeeklyData = (reports) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map((day, i) => ({
            name: day,
            reports: 0,
            resolved: 0
        }));

        reports.forEach(report => {
            const date = new Date(report.timestamp);
            const dayIndex = date.getDay();
            data[dayIndex].reports += 1;
            if (report.status === 'Resolved' || report.status === 'Accepted') {
                data[dayIndex].resolved += 1;
            }
        });

        return data;
    };

    const generateCategoryData = (reports) => {
        const categories = {};
        reports.forEach(report => {
            const type = report.type || 'other';
            categories[type] = (categories[type] || 0) + 1;
        });

        return Object.keys(categories).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: categories[key]
        }));
    };

    const userPoints = currentUser?.points || 0;
    const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

    const completionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    return (
        <CivicLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Welcome back, {currentUser?.firstName || 'Citizen'}!
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Track your civic impact and community progress
                </p>
            </div>

            {/* Alert Banner */}
            <AlertBanner />

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<FileText size={24} />}
                    label="Total Reports"
                    value={stats.total}
                    iconBg="bg-blue-100 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label="Pending"
                    value={stats.pending}
                    iconBg="bg-blue-100 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    icon={<CheckCircle size={24} />}
                    label="Resolved"
                    value={stats.resolved}
                    iconBg="bg-blue-100 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    icon={<Award size={24} />}
                    label="Points"
                    value={userPoints}
                    iconBg="bg-blue-100 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link
                    to="/civic/report"
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                            <Camera size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Report Issue</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Document problems</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/civic/map"
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                            <Map size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Live Map</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">View all reports</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/sos"
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                            <AlertTriangle size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Emergency SOS</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Quick alert</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left Column - Completion Rate */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-6">
                        Completion Rate
                    </h3>
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative w-40 h-40">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="12" fill="none" />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    className="text-blue-600 dark:text-blue-500"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${completionRate * 4.4} 440`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <div className="text-4xl font-bold text-slate-900 dark:text-white">{completionRate}%</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Success Rate</div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.resolved}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Resolved</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Pending</div>
                        </div>
                    </div>
                </div>

                {/* Middle Column - Activity Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Weekly Activity</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Your reporting patterns over 7 days</p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
                            <XAxis dataKey="name" stroke="currentColor" className="text-slate-600 dark:text-slate-400" fontSize={12} fontWeight={600} />
                            <YAxis stroke="currentColor" className="text-slate-600 dark:text-slate-400" fontSize={12} fontWeight={600} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgb(30 41 59)',
                                    border: '1px solid rgb(71 85 105)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontWeight: 600
                                }}
                            />
                            <Bar dataKey="reports" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="resolved" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row - Activity Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Community Feed */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse"></div>
                                Community Feed
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Real-time updates from your area</p>
                        </div>
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800">
                            LIVE
                        </span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {recentReports.length > 0 ? (
                            recentReports.map((report, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-lg border border-slate-200 dark:border-slate-600">
                                        {report.type === 'pothole' ? '🚧' : report.type === 'garbage' ? '🗑️' : '🚩'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{report.type} Reported</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{report.location?.address || 'Location N/A'}</p>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-500">{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Activity className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={40} />
                                <p className="text-slate-600 dark:text-slate-400 text-sm">No reports yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nearby Alerts */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
                                Nearby Alerts
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Within 5km radius</p>
                        </div>
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800">
                            {nearbyReports.length} Active
                        </span>
                    </div>
                    <div className="space-y-2">
                        {nearbyReports.length > 0 ? (
                            nearbyReports.slice(0, 6).map(report => (
                                <div key={report.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-lg border border-slate-200 dark:border-slate-600">📍</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{report.type || 'Issue'}</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{report.distance} km away</p>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-500">Now</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <CheckCircle className="mx-auto mb-3 text-blue-600 dark:text-blue-500" size={40} />
                                <p className="text-slate-600 dark:text-slate-400 text-sm">Safe Zone! No alerts nearby.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CivicLayout>
    );
};

const StatCard = ({ icon, label, value, iconBg, iconColor }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${iconBg}`}>
                {React.cloneElement(icon, { className: iconColor })}
            </div>
        </div>
        <div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

export default Dashboard;