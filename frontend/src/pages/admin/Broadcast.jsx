import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, CheckCircle, Clock, Smartphone, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getDatabase, ref, push, onValue, serverTimestamp } from 'firebase/database';
import { toast } from 'react-hot-toast';

const Broadcast = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [target, setTarget] = useState(location.state?.targetArea || 'Sector 4');
    const [type, setType] = useState('Fire Alert');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (location.state?.incidentId) {
            const fetchIncidentDetails = async () => {
                try {
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                    const res = await fetch(`${API_BASE_URL}/api/reports/${location.state.incidentId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.report) {
                            const r = data.report;
                            setType(r.category || r.type || 'General Alert');
                            const addr = r.location?.address || '';
                            setTarget(addr.split(',')[0] || 'Target Area');
                            setMessage(`OFFICIAL ALERT: ${r.category || r.type} reported at ${addr}. Please take necessary precautions.`);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching incident for broadcast:", error);
                    toast.error("Could not auto-fill incident details.");
                }
            };
            fetchIncidentDetails();
        }
    }, [location.state?.incidentId]);

    useEffect(() => {
        const db = getDatabase();
        const broadcastRef = ref(db, 'broadcasts');
        const unsubscribe = onValue(broadcastRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Removed strict department filter to show global history
                setHistory(list);
            }
        });
        return () => unsubscribe();
    }, [currentUser?.department]);

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const res = await fetch(`${API_BASE_URL}/api/reports/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    area: target,
                    type,
                    message,
                    department: currentUser?.department,
                    sender: currentUser?.firstName + ' ' + currentUser?.lastName,
                    reach: Math.floor(Math.random() * 5000) + 500
                })
            });

            if (!res.ok) throw new Error("Broadcast API Failed");

            setSending(false);
            setSent(true);
            toast.success("Broadcast sent successfully!");
            setTimeout(() => setSent(false), 3000);
        } catch (error) {
            console.error(error);
            setSending(false);
            toast.error("Failed to send broadcast");
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Send className="text-red-600 dark:text-red-500" /> Broadcast System
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Send emergency alerts to citizens via WhatsApp/SMS instantly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Compose Card */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Compose Alert</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Area</label>
                                <input
                                    type="text"
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    placeholder="Enter target area (e.g., Sector 4, MG Road)"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-900 dark:text-white transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Issue Type</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from(new Set([currentUser?.department || 'General', 'Critical Alert', 'General Announcement'])).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${type === t ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Message Content
                                    <button
                                        onClick={async () => {
                                            if (!target || !type) return toast.error("Select Target & Type first");
                                            setMessage("Generating AI Alert...");
                                            try {
                                                // Basic simulation of AI generation for now to avoid complexity, or call backend if needed.
                                                // Ideally detailed AI endpoint, but for now template based on department.
                                                const templates = [
                                                    `🚨 *${type.toUpperCase()} ALERT for ${target.toUpperCase()}*\n\nAuthorities have reported a ${type.toLowerCase()} in your area. Please exercise caution and follow official instructions.\n\n- ${currentUser?.department || 'City Admin'}`,
                                                    `⚠️ *URGENT UPDATE: ${target}*\n\nWe are detecting ${type.toLowerCase()} issues. Teams are dispatched. Stay clear of the affected zone.\n\n- Nagar Alert Hub`,
                                                    `📢 *Official Announcement for ${target}*\n\nRegarding ${type}: Please be advised that maintenance is scheduled. Plan your commute accordingly.`
                                                ];
                                                // Pick one based on type urgency (simplified random for demo)
                                                setTimeout(() => setMessage(templates[0]), 800);
                                            } catch (e) {
                                                setMessage("");
                                                toast.error("AI Generation Failed");
                                            }
                                        }}
                                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="w-3 h-3">✨</div> AI Generate
                                    </button>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-32 resize-none outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed text-slate-900 dark:text-white"
                                />
                                <div className="text-right text-xs text-slate-400 mt-1">
                                    {message.length} characters
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSend}
                                    disabled={sending || sent}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${sent ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 active:scale-95'}`}
                                >
                                    {sending ? (
                                        'Broadcasting...'
                                    ) : sent ? (
                                        <> <CheckCircle size={20} /> Alert Sent Successfully </>
                                    ) : (
                                        <> <AlertTriangle size={20} /> Slide to Broadcast </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-red-400 dark:text-red-300 mt-3 font-medium">
                                    * This will trigger an immediate WhatsApp notification to all registered users in {target}.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-colors">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] dark:invert"></div>

                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">User Preview</h3>

                        {/* Phone Mockup */}
                        <div className="w-[300px] bg-white rounded-[2.5rem] shadow-2xl border-8 border-slate-900 overflow-hidden relative z-10">
                            <div className="h-6 bg-slate-900 absolute top-0 left-0 right-0 z-20 rounded-b-xl mx-12"></div>

                            {/* Screen Header */}
                            <div className="bg-[#075E54] text-white p-4 pt-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" className="w-5 h-5" alt="WA" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">Nagar Alert</div>
                                        <div className="text-[10px] opacity-80">Official Account • <span className="text-green-300">Verified</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Screen Body */}
                            <div className="bg-[#E5DDD5] h-[400px] p-4 flex flex-col justify-end pb-8">
                                <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-xs leading-relaxed max-w-[90%] relative">
                                    <div className="text-[10px] font-bold text-red-600 mb-1 flex items-center gap-1">
                                        <AlertTriangle size={10} /> {type.toUpperCase()} • {target}
                                    </div>
                                    {message}
                                    <div className="text-[9px] text-slate-400 text-right mt-1">10:42 AM</div>

                                    {/* Triangle Tail */}
                                    <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-white">Recent Broadcasts</h3>
                        <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">View All Log</button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Area</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Reach</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-800 dark:text-white">{item.area}</td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300">{item.type}</span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <Clock size={12} /> {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                                            <Smartphone size={14} /> {item.reach}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded w-fit">
                                            <CheckCircle size={10} /> {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Broadcast;
