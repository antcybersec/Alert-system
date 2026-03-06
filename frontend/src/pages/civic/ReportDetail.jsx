import React from 'react';
import { MapPin, Clock, Share2, CheckCircle, AlertTriangle, ThumbsUp, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from '../../services/firebase';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../mapsConfig';

const libraries = ['places'];

const ReportDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [report, setReport] = React.useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    React.useEffect(() => {
        const fetchReport = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                const res = await fetch(`${API_BASE_URL}/api/reports/${id}`);
                const data = await res.json();

                if (res.ok && data.report) {
                    const r = data.report;
                    const timestamp = r.createdAt || r.timestamp;
                    setReport({
                        ...r,
                        ticketId: r.id ? `#${r.id.slice(-6).toUpperCase()}` : '#UNKNOWN',
                        address: r.location?.address || "Address not available",
                        lat: r.location?.lat ? parseFloat(r.location.lat) : 0,
                        lng: r.location?.lng ? parseFloat(r.location.lng) : 0,
                        timeFormatted: new Date(timestamp).toLocaleString(),
                        timeline: [
                            { title: 'Report Submitted', time: new Date(timestamp).toLocaleString(), active: true, current: r.status === 'Pending' },
                            { title: 'In Progress', time: r.status !== 'Pending' ? 'Verified by Admin' : 'Pending Review', active: r.status !== 'Pending', current: r.status === 'In Progress' },
                            { title: 'Resolved', time: r.status === 'Resolved' ? 'Issue Fixed' : 'Waiting for Resolution', active: r.status === 'Resolved', current: r.status === 'Resolved' }
                        ]
                    });
                }
            } catch (error) {
                console.error("Fetch report error:", error);
            }
        };

        fetchReport();
    }, [id]);

    if (!report) return <div className="text-center p-10">Loading Report Details...</div>;

    return (
        <CivicLayout noPadding>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[calc(100vh-100px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full">

                    {/* Left Side: Visuals (Image & Map) */}
                    <div className="relative h-[400px] lg:h-auto min-h-full flex flex-col">
                        {/* Image Half */}
                        <div className="h-1/2 relative">
                            <img src={report.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                            <div className="absolute top-6 left-6 z-10">
                                <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md bg-slate-900/80 text-white`}>
                                    {report.status}
                                </span>
                            </div>
                        </div>

                        {/* Map Half */}
                        <div className="h-1/2 relative bg-slate-100 group">
                            {isLoaded && report.lat !== 0 ? (
                                <>
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ lat: report.lat, lng: report.lng }}
                                        zoom={15}
                                        options={{ disableDefaultUI: true, zoomControl: true }}
                                    >
                                        <Marker position={{ lat: report.lat, lng: report.lng }} />
                                    </GoogleMap>

                                    {/* Open in Maps Overlay */}
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-blue-600 px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 z-10"
                                    >
                                        <ExternalLink size={14} /> Open in Maps
                                    </a>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold bg-slate-50">
                                    {report.lat !== 0 ? "Loading Map..." : "Location Data Unavailable"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Details & Timeline */}
                    <div className="p-8 lg:p-12 flex flex-col h-full">

                        <div className="hidden lg:block mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{report.type}</h1>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                                        <MapPin size={18} className="text-blue-500" /> {report.address}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-400">Ticket ID</div>
                                    <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-200">{report.ticketId}</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors">
                                    <Share2 size={16} /> Share
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors">
                                    <AlertTriangle size={16} /> Report Incorrect
                                </button>
                            </div>
                        </div>

                        {/* AI Insight */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30 mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">✨</span>
                                </div>
                                <h3 className="font-bold text-blue-900 dark:text-blue-100">Gemini AI Analysis</h3>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm mb-4">
                                {report.aiAnalysis || "No AI analysis available for this report."}
                            </p>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> {report.aiConfidence || '0'}% Confidence</span>
                                <span className="flex items-center gap-1"><Clock size={14} className="text-blue-500" /> Verified at submission</span>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                                Activity Log
                            </h3>
                            <div className="relative pl-4 space-y-8 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                {report.timeline.map((step, idx) => (
                                    <div key={idx} className="relative pl-8 group">
                                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center transition-colors ${step.current ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/30' :
                                            step.active ? 'border-green-500' : 'border-slate-300 dark:border-slate-600'
                                            }`}>
                                            {step.current && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-bold ${step.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step.title}</h4>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">{step.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                            <div className="flex-1 relative">
                                <input type="text" placeholder="Add a comment..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all" />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                    <SendIcon />
                                </button>
                            </div>
                            <button className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                                <ThumbsUp size={20} />
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </CivicLayout>
    );
};

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);

export default ReportDetail;
