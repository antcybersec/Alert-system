import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from '../../context/AuthContext';
import { sanitizeKey } from '../../utils/firebaseUtils';

const AdminNotifications = () => {
    const { currentUser } = useAuth();
    const [filter, setFilter] = useState('all'); // all, unread
    const [notifications, setNotifications] = useState([]);

    React.useEffect(() => {
        if (!currentUser?.department) return;

        const db = getDatabase();
        const sanitizedDept = sanitizeKey(currentUser.department);
        const reportsRef = ref(db, `reports/by_department/${sanitizedDept}`);

        const unsubscribe = onValue(reportsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const loadedNotifs = Object.keys(data).map(key => {
                    const r = data[key];
                    // Logic to determine if "read" - for now, treat Pending as Unread
                    const isRead = r.status !== 'Pending';

                    return {
                        id: key,
                        type: r.priority === 'High' ? 'alert' : 'info',
                        title: `New ${r.type || 'Civic'} Report`,
                        message: r.description || ' No description provided.',
                        time: new Date(r.createdAt || r.timestamp).toLocaleString(),
                        read: isRead,
                        reportId: key // Keep reference
                    };
                });

                // Sort by time descending
                loadedNotifs.sort((a, b) => new Date(b.time) - new Date(a.time));
                setNotifications(loadedNotifs);
            } else {
                setNotifications([]);
            }
        });

        return () => unsubscribe();
    }, [currentUser?.department]);

    const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);

    const markAsRead = (id) => {
        // In a real app, you'd update the DB. Here we just update local state for the session
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotif = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto pb-20 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-none mb-2">Command Feeds</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Real-time alerts & Dept updates</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <FilterBtn label="All Feeds" active={filter === 'all'} onClick={() => setFilter('all')} count={notifications.length} />
                        <FilterBtn label="Unread" active={filter === 'unread'} onClick={() => setFilter('unread')} count={notifications.filter(n => !n.read).length} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Showing {filtered.length} Notifications
                        </div>
                        <div className="flex gap-3">
                            <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                Mark all read
                            </button>
                            <button onClick={clearAll} className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                Clear History
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.length > 0 ? filtered.map(notif => (
                            <div key={notif.id} className={`p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notif.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                    notif.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                        'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                    {notif.type === 'alert' ? <AlertTriangle size={20} /> : notif.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-base ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {notif.title}
                                            {!notif.read && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block mb-0.5"></span>}
                                        </h4>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                <Clock size={10} /> {notif.time}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{notif.message}</p>

                                    <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.read && (
                                            <button onClick={() => markAsRead(notif.id)} className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1">
                                                <Check size={12} /> Mark Read
                                            </button>
                                        )}
                                        <button onClick={() => deleteNotif(notif.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 hover:underline flex items-center gap-1">
                                            <Trash2 size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-300 dark:text-slate-600">
                                <Bell size={48} className="mb-4 opacity-50" />
                                <p className="font-bold text-sm uppercase tracking-widest">No notifications found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

const FilterBtn = ({ label, active, onClick, count }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
    >
        {label} <span className={`ml-1 opacity-60 ${active ? 'text-white' : ''}`}>({count})</span>
    </button>
);

export default AdminNotifications;
