import React, { useState } from 'react';
import { Bell, CheckCircle, AlertOctagon, Info, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CivicLayout from './CivicLayout';
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from '../../services/firebase';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    React.useEffect(() => {
        const db = getDatabase(auth.app);

        let reportNotifs = [];
        let broadcastNotifs = [];

        const updateState = () => {
            const combined = [...reportNotifs, ...broadcastNotifs].sort((a, b) => b.timestamp - a.timestamp);
            setNotifications(combined);
        };

        // 1. Listen to Reports
        const reportsRef = ref(db, 'reports');
        const unsubReports = onValue(reportsRef, (snapshot) => {
            reportNotifs = []; // Reset local array
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => {
                    const r = data[key];
                    if (r.userId === auth.currentUser?.uid) {
                        // Creation
                        reportNotifs.push({
                            id: `${key}_created`,
                            type: 'info',
                            title: 'Report Submitted',
                            message: `Your report for ${r.type} has been received.`,
                            time: new Date(r.timestamp).toLocaleDateString(),
                            timestamp: r.timestamp,
                            read: true
                        });
                        // Updates
                        if (r.status !== 'Pending') {
                            reportNotifs.push({
                                id: `${key}_status`,
                                type: r.status === 'Resolved' ? 'success' : 'alert',
                                title: `Report ${r.status}`,
                                message: `Your report for ${r.type} is now ${r.status}.`,
                                time: new Date(r.timestamp).toLocaleDateString(),
                                timestamp: r.timestamp + 1000,
                                read: false
                            });
                        }
                        // AI
                        if (r.aiVerified) {
                            reportNotifs.push({
                                id: `${key}_ai`,
                                type: 'success',
                                title: 'Points Awarded',
                                message: `Your ${r.type} report was verified by AI! +10 Karma Points.`,
                                time: new Date(r.timestamp).toLocaleDateString(),
                                timestamp: r.timestamp + 500,
                                read: false
                            });
                        }
                    }
                });
            }
            updateState();
        });

        // 2. Listen to Broadcasts
        const broadcastsRef = ref(db, 'broadcasts');
        const unsubBroadcasts = onValue(broadcastsRef, (snapshot) => {
            broadcastNotifs = []; // Reset local
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => {
                    const b = data[key];
                    // Show all broadcasts to everyone for now (or filter by city if avail)
                    broadcastNotifs.push({
                        id: key,
                        type: 'alert', // Broadcasts are usually alerts
                        title: `📢 Official Alert: ${b.target || 'General'}`,
                        message: b.message || "No details provided.",
                        time: new Date(b.timestamp).toLocaleString(),
                        timestamp: b.timestamp,
                        read: false
                    });
                });
            }
            updateState();
        });

        return () => {
            unsubReports();
            unsubBroadcasts();
        };
    }, []);

    const handleDismiss = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <CivicLayout>
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 relative">
                            <Bell size={20} />
                            {notifications.some(n => !n.read) && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></div>}
                        </div>
                        Notifications
                    </h1>
                    <button onClick={markAllRead} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                        Mark all read
                    </button>
                </div>

                <div className="space-y-3">
                    <AnimatePresence>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group relative p-6 rounded-2xl border shadow-sm flex items-start gap-6 transition-all hover:shadow-md ${notif.read
                                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                        : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${notif.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20' :
                                        notif.type === 'alert' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                                            'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                                        }`}>
                                        {notif.type === 'success' ? <CheckCircle size={24} /> :
                                            notif.type === 'alert' ? <AlertOctagon size={24} /> : <Info size={24} />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold text-base ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{notif.title}</h3>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                <Clock size={12} /> {notif.time}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{notif.message}</p>
                                    </div>

                                    {!notif.read && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>}

                                    <button
                                        onClick={() => handleDismiss(notif.id)}
                                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 absolute right-4 bottom-4"
                                        title="Dismiss"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Bell size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                                <p className="font-bold text-slate-400 dark:text-slate-600">You're all caught up!</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </CivicLayout>
    );
};
export default Notifications;
