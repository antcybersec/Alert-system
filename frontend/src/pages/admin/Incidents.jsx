import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
    Search, Filter, MapPin, Calendar, Clock,
    MoreVertical, ExternalLink, Shield, CheckCircle, XCircle,
    AlertTriangle, ArrowRight, List, Grid, ChevronRight
} from 'lucide-react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { sanitizeKey } from '../../utils/firebaseUtils';

const IncidentList = () => {
    const { currentUser } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    useEffect(() => {
        if (!currentUser?.department) return;

        const db = getDatabase();
        const sanitizedDept = sanitizeKey(currentUser.department);
        // const deptReportsRef = ref(db, `reports/by_department/${sanitizedDept}`);
        const deptReportsRef = ref(db, `reports`); // MATCH DASHBOARD LOGIC (LISTEN TO EVERYTHING)

        // 1. Initial API Fetch (Fallback)
        const fetchFromApi = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                // Fetch ALL reports to match Dashboard
                const res = await fetch(`${API_BASE_URL}/api/reports`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.reports) {
                        setIncidents(data.reports);
                    }
                }
            } catch (err) {
                console.error("API Fetch Error:", err);
            }
            setLoading(false);
        };

        fetchFromApi();

        const unsubscribe = onValue(deptReportsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setIncidents(list);
            }
            // Don't clear incidents if RTDB fails/empty but API worked, strictly speaking strict RTDB would clear it.
            // But for consistency with Dashboard which accumulates/overwrites:
        });

        return () => unsubscribe();
    }, [currentUser?.department]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const db = getDatabase();
            const updates = {};
            const statusLabel = newStatus === 'Rejected' ? 'Rejected - Unconventional Report' : newStatus;

            const sanitizedDept = sanitizeKey(currentUser.department);
            updates[`/reports/${id}/status`] = statusLabel;
            updates[`/reports/by_department/${sanitizedDept}/${id}/status`] = statusLabel;

            await update(ref(db), updates);
            toast.success(`Incident marked as ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch =
            incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || incident.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Enhanced Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Department Repository</h1>
                        <p className="text-sm text-slate-500 font-medium">Archive and active reports for {currentUser?.department}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>

                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by name, ID, or report type..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 outline-none text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Accepted">Accepted</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Rejected - Unconventional Report">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Logic for different view modes */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredIncidents.map((incident) => (
                            <div key={incident.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1 relative">
                                {/* Image Section */}
                                <div className="h-48 relative overflow-hidden">
                                    <img
                                        referrerPolicy="no-referrer"
                                        src={
                                            incident.imageUrl && (incident.imageUrl.includes('placehold.co') || incident.imageUrl.includes('placeholder.com'))
                                                ? (incident.imageUrl.includes('/300') ? "https://placehold.co/600x400/334155/FFFFFF?text=Simulated+Report+Image" : incident.imageUrl)
                                                : (incident.imageUrl || 'https://placehold.co/400x200?text=No+Image')
                                        }
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt="Incident"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${incident.priority === 'High' ? 'bg-red-500/90 text-white' : 'bg-blue-600/90 text-white'}`}>
                                            {incident.priority || 'Normal'} PRIORITY
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold rounded-lg uppercase tracking-wider border border-white/20">
                                                {incident.category || incident.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">ID: #{incident.id.slice(-8)}</p>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{incident.userName}</h4>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${incident.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            incident.status === 'Accepted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                incident.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {incident.status || 'Archived'}
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium italic">
                                        "{incident.description || 'No description provided'}"
                                    </p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <MapPin size={14} className="text-slate-400" />
                                            </div>
                                            <span className="truncate font-medium">{incident.location?.address || 'Location Not Set'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <Calendar size={14} className="text-slate-400" />
                                            </div>
                                            <span className="font-medium">{new Date(incident.createdAt || incident.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Action Footnote */}
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <Link
                                            to={`/admin/incident/${incident.id}`}
                                            className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-widest"
                                        >
                                            View Report <ArrowRight size={14} className="text-blue-600" />
                                        </Link>
                                        <div className="flex gap-1">
                                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Incident Log</th>
                                    <th className="px-6 py-4">Reporter</th>
                                    <th className="px-6 py-4 uppercase">Status</th>
                                    <th className="px-6 py-4 uppercase">Priority</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredIncidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <img src={incident.imageUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-slate-100" alt="" />
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white uppercase text-xs">{incident.category || incident.type}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">#{incident.id.slice(-8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{incident.userName}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{new Date(incident.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${incident.status === 'Pending' ? 'text-orange-600 bg-orange-50' :
                                                incident.status === 'Accepted' ? 'text-blue-600 bg-blue-50' :
                                                    incident.status === 'Resolved' ? 'text-green-600 bg-green-50' :
                                                        'text-slate-500 bg-slate-50'
                                                }`}>
                                                {incident.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${incident.priority === 'High' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                                                {incident.priority || 'Normal'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Link to={`/admin/incident/${incident.id}`} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform inline-block">
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {filteredIncidents.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300">
                            <List size={40} />
                        </div>
                        <p className="text-slate-500 font-black uppercase tracking-widest">No matching reports found</p>
                        <p className="text-xs text-slate-400 mt-2">Try adjusting your filters or search keywords</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default IncidentList;
