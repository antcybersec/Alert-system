import { Link } from 'react-router-dom';
import { Menu, Search, Bell, Sun, Moon, User } from 'lucide-react';

import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from '../../services/firebase';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Topbar = ({ isSidebarOpen, toggleSidebar }) => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const userName = currentUser
        ? (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : (currentUser.displayName || "User"))
        : "Guest";

    // Fetch notifications from Firebase
    useEffect(() => {
        if (currentUser) {
            const db = getDatabase();
            const notificationsRef = ref(db, `notifications/${currentUser.uid}`);

            const unsubscribe = onValue(notificationsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const notifArray = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
                    setNotifications(notifArray);
                } else {
                    setNotifications([
                        { id: 1, type: 'success', title: 'Issue Resolved', message: 'Your reported pothole has been fixed', time: '2m ago' },
                        { id: 2, type: 'info', title: 'New Update', message: 'City council meeting scheduled', time: '1h ago' },
                        { id: 3, type: 'alert', title: 'Action Required', message: 'Please verify your recent complaint', time: '3h ago' },
                    ]);
                }
            });

            return () => unsubscribe();
        }
    }, [currentUser]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 flex items-center justify-between z-20 sticky top-0">

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <Menu size={20} />
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors w-64 lg:w-96">
                    <Search size={18} className="text-slate-500 dark:text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search city, area, or issue..."
                        className="bg-transparent outline-none text-sm w-full text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === 'dark' ?
                        <Sun size={20} className="text-slate-700 dark:text-slate-300" /> :
                        <Moon size={20} className="text-slate-700 dark:text-slate-300" />
                    }
                </button>

                {/* Mobile Search Icon */}
                <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors">
                    <Search size={20} />
                </button>

                {/* Notification Bell */}
                <div
                    className="relative"
                    onMouseEnter={() => setShowNotifications(true)}
                    onMouseLeave={() => setShowNotifications(false)}
                >
                    <Link
                        to="/notifications"
                        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors block"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                    </Link>

                    {/* Notification Popup */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                            {/* Header */}
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                                <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
                                    <Bell size={16} />
                                    Notifications
                                </h3>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 last:border-0 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                                    <Bell size={14} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                        {notif.time}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No new notifications</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <Link
                                    to="/notifications"
                                    className="block px-4 py-3 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 transition-colors"
                                >
                                    View All Notifications
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                {/* User Profile */}
                <Link to="/civic/profile" className="flex items-center gap-3 pl-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-2 py-1 transition-colors">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {userName}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                            {currentUser?.role || 'Citizen'}
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 overflow-hidden flex items-center justify-center">
                        {currentUser?.profilePic || currentUser?.photoURL ? (
                            <img
                                src={currentUser?.profilePic || currentUser?.photoURL}
                                className="w-full h-full object-cover"
                                alt="User"
                            />
                        ) : (
                            <User size={18} className="text-blue-600 dark:text-blue-400" />
                        )}
                    </div>
                </Link>
            </div>

        </header>
    );
};

export default Topbar;