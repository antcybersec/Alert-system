import React, { useState } from 'react';
import { FileText, MapPin, Calendar, ArrowRight, Search, Plus, Clock, CheckCircle, AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import { auth } from '../../services/firebase';

const MyReports = () => {
    const [filter, setFilter] = useState('All');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        const fetchReports = async () => {
            if (!auth.currentUser) {
                console.log("[FRONTEND] No current user found yet.");
                return;
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const url = `${API_BASE_URL}/api/reports/user/${auth.currentUser.uid}`;
            console.log(`[FRONTEND] Fetching reports from: ${url}`);

            try {
                const res = await fetch(url);
                const data = await res.json();

                if (res.ok && data.reports) {
                    setReports(data.reports.map(r => ({
                        id: r.id,
                        type: r.type,
                        location: r.location?.address || `${r.location?.lat?.toFixed(4)}, ${r.location?.lng?.toFixed(4)}`,
                        date: new Date(r.createdAt || r.timestamp).toLocaleString("en-US", {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        status: r.status,
                        severity: r.priority || 'Normal',
                        department: r.department || 'General',
                        imageUrl: r.imageUrl || r.mediaUrl || null,
                        mediaType: r.mediaType || 'image',
                        mediaUrl: r.mediaUrl || r.imageUrl || null
                    })));
                } else {
                    setReports([]);
                }
            } catch (error) {
                console.error("Fetch reports error:", error);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const filteredReports = reports.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch = r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'Pending').length,
        resolved: reports.filter(r => r.status === 'Resolved' || r.status === 'Accepted').length,
        inProgress: reports.filter(r => r.status === 'In Progress').length
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Pending':
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/20',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-800',
                    icon: <Clock size={14} />
                };
            case 'Resolved':
            case 'Accepted':
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/20',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-800',
                    icon: <CheckCircle size={14} />
                };
            case 'In Progress':
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/20',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-800',
                    icon: <Loader2 size={14} className="animate-spin" />
                };
            case 'Rejected - Unconventional Report':
                return {
                    bg: 'bg-red-100 dark:bg-red-900/20',
                    text: 'text-red-600 dark:text-red-400',
                    border: 'border-red-200 dark:border-red-800',
                    icon: <AlertCircle size={14} />
                };
            default:
                return {
                    bg: 'bg-slate-100 dark:bg-slate-700',
                    text: 'text-slate-600 dark:text-slate-400',
                    border: 'border-slate-200 dark:border-slate-600',
                    icon: <FileText size={14} />
                };
        }
    };

    return (
        <CivicLayout>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-lg">
                            <FileText size={28} className="text-white" />
                        </div>
                        My Reports
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-base ml-16">Track and manage your civic issue submissions</p>
                </div>
                <Link
                    to="/civic/report"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                    <Plus size={20} /> New Report
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<FileText size={24} />} label="Total Reports" value={stats.total} />
                <StatCard icon={<Clock size={24} />} label="Pending" value={stats.pending} />
                <StatCard icon={<Loader2 size={24} className="animate-spin" />} label="In Progress" value={stats.inProgress} />
                <StatCard icon={<CheckCircle size={24} />} label="Resolved" value={stats.resolved} />
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
                        {[
                            { label: 'All', icon: <FileText size={16} /> },
                            { label: 'Pending', icon: <Clock size={16} /> },
                            { label: 'In Progress', icon: <Loader2 size={16} className="animate-spin" /> },
                            { label: 'Resolved', icon: <CheckCircle size={16} /> }
                        ].map(f => (
                            <button
                                key={f.label}
                                onClick={() => setFilter(f.label)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${filter === f.label
                                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {f.icon}
                                {f.label}
                                {f.label !== 'All' && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${filter === f.label
                                        ? 'bg-white/20'
                                        : 'bg-slate-200 dark:bg-slate-600'
                                        }`}>
                                        {f.label === 'Pending' ? stats.pending :
                                            f.label === 'In Progress' ? stats.inProgress :
                                                stats.resolved}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full lg:w-80">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 dark:text-slate-400">
                        <Loader2 className="animate-spin mb-4 text-blue-600 dark:text-blue-400" size={48} />
                        <p className="text-lg font-semibold">Loading your reports...</p>
                    </div>
                )}

                {!loading && filteredReports.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 dark:text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <FileText size={40} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-lg font-semibold mb-2">No reports found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            {searchQuery ? 'Try adjusting your search' : 'Start by submitting your first report!'}
                        </p>
                    </div>
                )}

                {filteredReports.map(report => {
                    const statusConfig = getStatusConfig(report.status);
                    return (
                        <div
                            key={report.id}
                            className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                                {/* Left Section */}
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Image/Icon */}
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 relative">
                                        {report.mediaType === 'video' ? (
                                            <div className="w-full h-full bg-black flex items-center justify-center">
                                                <video
                                                    src={report.mediaUrl}
                                                    className="w-full h-full object-cover opacity-80"
                                                    muted
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : report.mediaType === 'audio' ? (
                                            <div className="w-full h-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-1 bg-purple-500 h-3 animate-pulse"></div>
                                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-1">AUDIO</span>
                                                </div>
                                            </div>
                                        ) : report.mediaUrl ? (
                                            <img
                                                src={report.mediaUrl}
                                                alt={report.type}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to emoji if image fails to load
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}

                                        <div
                                            className="w-full h-full absolute inset-0 flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-700"
                                            style={{ display: (report.mediaUrl || report.mediaType === 'video' || report.mediaType === 'audio') ? 'none' : 'flex' }}
                                        >
                                            {report.type?.toLowerCase() === 'pothole' ? '🚧' :
                                                report.type?.toLowerCase() === 'garbage' ? '🗑️' :
                                                    report.type?.toLowerCase() === 'light' ? '💡' :
                                                        report.type?.toLowerCase() === 'water' ? '💧' : '📋'}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{report.type}</h3>
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                {statusConfig.icon}
                                                {report.status}
                                            </span>
                                            {report.severity !== 'Normal' && (
                                                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                                                    {report.severity}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <MapPin size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                                                <span className="line-clamp-1">{report.location}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {report.date}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <TrendingUp size={14} />
                                                    {report.department}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 border-slate-200 dark:border-slate-700 pt-4 lg:pt-0">
                                    {/* Report ID */}
                                    <div className="text-left lg:text-right">
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase mb-1">Report ID</div>
                                        <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">{report.id}</div>
                                    </div>

                                    {/* View Button */}
                                    <Link
                                        to={`/civic/report/${report.id}`}
                                        className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                                    >
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </CivicLayout>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                {icon}
            </div>
        </div>
        <div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

export default MyReports;