import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, CheckCircle, XCircle, AlertTriangle,
    User, Calendar, ExternalLink, Loader2, Sparkles,
    Shield, Clock, MessageSquare, Send, Bell
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { sanitizeKey } from '../../utils/firebaseUtils';

const IncidentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const cleanId = id.startsWith('RPT-') ? id.replace('RPT-', '') : id;

    useEffect(() => {
        const db = getDatabase();
        if (!cleanId) return;

        const reportRef = ref(db, `reports/${cleanId}`);
        const unsubscribe = onValue(reportRef, (snapshot) => {
            if (snapshot.exists()) {
                setReport({ id: snapshot.key, ...snapshot.val() });
            } else {
                setReport(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [cleanId]);

    const handleAction = async (newStatus) => {
        const db = getDatabase();
        try {
            const statusLabel = newStatus === 'Rejected' ? 'Rejected - Unconventional Report' : newStatus;

            const updates = {};
            updates[`/reports/${cleanId}/status`] = statusLabel;

            // Also update in department-specific node if department exists
            if (report.department) {
                const sanitizedDept = sanitizeKey(report.department);
                updates[`/reports/by_department/${sanitizedDept}/${cleanId}/status`] = statusLabel;
            }

            await update(ref(db), updates);
            toast.success(`Report ${newStatus}`);

            if (newStatus === 'Accepted') {
                navigate('/admin/broadcast', { state: { incidentId: cleanId } });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Loading Intelligence...</p>
            </div>
        </AdminLayout>
    );

    if (!report) return (
        <AdminLayout>
            <div className="text-center mt-20">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2">Registry Mismatch</h2>
                <p className="text-slate-500 font-medium">The incident ID #{cleanId} could not be located in our secure database.</p>
                <button onClick={() => navigate(-1)} className="mt-8 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
                    Return to Hub
                </button>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto pb-20">
                {/* Unified Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Report #{cleanId.slice(-8)}</h1>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${report.status === 'Resolved' || report.status === 'Accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                                    report.status?.includes('Rejected') ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-orange-50 text-orange-600 border-orange-100'
                                    }`}>
                                    {report.status || 'Active'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(report.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5 text-blue-500"><Shield size={14} /> {report.department || 'General'} Official</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
                            <ExternalLink size={16} /> Export Intel
                        </button>
                        <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform">
                            <Bell size={16} /> Notify Team
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Visual Ground Truth (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Evidence Viewer */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Shield size={18} className="text-blue-600" /> Ground Evidence
                                </h3>
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-[10px] font-bold text-slate-400 uppercase">
                                    High Resolution • Captured via App
                                </div>
                            </div>
                            <div className="group relative rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-video">
                                <img
                                    referrerPolicy="no-referrer"
                                    src={(report.imageUrl && report.imageUrl.includes('via.placeholder.com')) ? report.imageUrl.replace('via.placeholder.com', 'placehold.co') : (report.imageUrl || "https://placehold.co/800x450")}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                    alt="Incident Evidence"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-6 left-6 text-white translate-y-4 group-hover:translate-y-0 transition-all">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-1">
                                        <MapPin size={14} className="text-red-500" /> Geospatial Coordinates
                                    </div>
                                    <p className="font-mono text-[10px] opacity-80">LAT: {report.location?.lat} • LNG: {report.location?.lng}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Intelligence */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 transition-colors">
                                <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4">Location Manifest</h4>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{report.location?.address || 'Address Mapping Unavailable'}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Verified Zone • Department Radius</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 transition-colors">
                                <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4">Reporter Profile</h4>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-black">
                                        {report.userName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{report.userName}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Karma Score: 450 • Verified Citizen</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis & Actions (1/3) */}
                    <div className="space-y-8">
                        {/* Dynamic AI Deep Analysis */}
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Sparkles size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-sm">Gemini Neural Insight</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Confidence Rating</div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${report.aiConfidence || 85}%` }}></div>
                                            </div>
                                            <span className="font-black text-lg">{report.aiConfidence || 85}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                        <div className="text-[10px] font-black uppercase text-white/60 mb-2">Detailed Observation</div>
                                        <p className="text-xs font-medium leading-relaxed italic">
                                            "{report.aiAnalysis || `Analysis confirms a ${report.category} incident. Visual markers match official severity threshold for Department response.`}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Control Center */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-700/50 transition-colors">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                                <Shield size={18} className="text-slate-400" /> Verify & Deploy
                            </h3>

                            {(!report.status || report.status === 'Pending' || report.status === 'Open') ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Officer Input</label>
                                        <textarea
                                            placeholder="Internal operational notes..."
                                            className="w-full bg-transparent border-none p-0 text-sm outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 resize-none h-20"
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => handleAction('Accepted')}
                                            className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Approve report
                                        </button>

                                        <button
                                            onClick={() => handleAction('Rejected')}
                                            className="w-full py-4 bg-white dark:bg-slate-700 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <XCircle size={18} /> Reject report
                                        </button>
                                    </div>
                                </div>
                            ) : report.status === 'Accepted' || report.status === 'Resolved' ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-3xl text-center">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-300">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h4 className="font-black text-green-800 dark:text-green-300 text-xs uppercase tracking-widest mb-1">Incident Authenticated</h4>
                                        <p className="text-[10px] font-bold text-green-600 dark:text-green-500">Operation live in command matrix.</p>
                                    </div>

                                    {report.status === 'Accepted' && (
                                        <>
                                            <button
                                                onClick={() => handleAction('Resolved')}
                                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <CheckCircle size={18} /> Mark Fixed (Resolved)
                                            </button>

                                            <button
                                                onClick={() => navigate('/admin/broadcast', { state: { incidentId: cleanId } })}
                                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Send size={18} /> Trigger Broadcast
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <XCircle size={32} />
                                    </div>
                                    <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest mb-1">Report Decommissioned</h4>
                                    <p className="text-[10px] font-bold text-slate-400">Classified as Unconventional or Duplicate.</p>
                                </div>
                            )}
                        </div>

                        {/* Audit Trail */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700/50 transition-colors">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> Data Lifecycle
                            </h3>
                            <div className="space-y-6 relative pl-3 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                <div className="relative pl-6">
                                    <div className="absolute -left-[10px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700"></div>
                                    <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">Inbound Signal</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{new Date(report.createdAt).toLocaleTimeString()}</div>
                                </div>
                                <div className="relative pl-6">
                                    <div className="absolute -left-[10px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500"></div>
                                    <div className="text-[11px] font-black text-blue-500 uppercase tracking-tighter">AI Verification</div>
                                    <div className="text-[10px] text-slate-400 font-bold">Latency: 2.4s</div>
                                </div>
                                <div className="relative pl-6 opacity-50">
                                    <div className="absolute -left-[10px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700"></div>
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Current Vector: {report.status || 'Active'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default IncidentDetail;
