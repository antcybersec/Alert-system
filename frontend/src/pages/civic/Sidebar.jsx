import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Map, FileText, BarChart2, User,
    AlertTriangle, Camera, MessageCircle, Bell, LogOut, Award
} from 'lucide-react';
import logo from '../../assets/logo.jpeg';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 z-30 ${isOpen ? 'w-64' : 'w-20'}`}>

            {/* Logo Section */}
            <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-700">
                <Link to="/civic/dashboard" className="flex items-center gap-3 font-bold text-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <img src={logo} alt="नगर Alert Hub" className="w-full h-full object-cover" />
                    </div>
                    {isOpen && (
                        <div>
                            <h1 className="text-base font-bold text-slate-900 dark:text-white">
                                नगर Alert Hub
                            </h1>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Citizen Console
                            </p>
                        </div>
                    )}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">

                {/* Main Navigation */}
                {isOpen && (
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
                        Menu
                    </div>
                )}

                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Overview"
                    to="/civic/dashboard"
                    active={isActive('/civic/dashboard')}
                    expanded={isOpen}
                />
                <SidebarItem
                    icon={<Map size={20} />}
                    label="Live Map"
                    to="/civic/map"
                    active={isActive('/civic/map')}
                    expanded={isOpen}
                />
                <SidebarItem
                    icon={<Camera size={20} />}
                    label="New Report"
                    to="/civic/report"
                    active={isActive('/civic/report')}
                    expanded={isOpen}
                    badge="New"
                />
                <SidebarItem
                    icon={<FileText size={20} />}
                    label="My Reports"
                    to="/civic/my-reports"
                    active={isActive('/civic/my-reports')}
                    expanded={isOpen}
                />

                {/* Community & Stats */}
                {isOpen && (
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 mt-6 px-3">
                        Community
                    </div>
                )}

                <SidebarItem
                    icon={<BarChart2 size={20} />}
                    label="Leaderboard"
                    to="/leaderboard"
                    active={isActive('/leaderboard')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<Award size={20} />}
                    label="Achievements"
                    to="/civic/achievements"
                    active={isActive('/civic/achievements')}
                    expanded={isOpen}
                />

                {/* Tools */}
                {isOpen && (
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 mt-6 px-3">
                        Tools
                    </div>
                )}

                <SidebarItem
                    icon={<User size={20} />}
                    label="Profile"
                    to="/civic/profile"
                    active={isActive('/civic/profile')}
                    expanded={isOpen}
                />
                <SidebarItem
                    icon={<Bell size={20} />}
                    label="Notifications"
                    to="/notifications"
                    active={isActive('/notifications')}
                    expanded={isOpen}
                    badge="3"
                />
                <SidebarItem
                    icon={<MessageCircle size={20} />}
                    label="WhatsApp Guide"
                    to="/civic/guide"
                    active={isActive('/civic/guide')}
                    expanded={isOpen}
                />
                <SidebarItem
                    icon={<AlertTriangle size={20} />}
                    label="Emergency SOS"
                    to="/sos"
                    active={isActive('/sos')}
                    expanded={isOpen}
                />

                {/* Logout Section */}
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                    <SidebarItem
                        icon={<LogOut size={20} />}
                        label="Logout"
                        to="/login"
                        active={false}
                        expanded={isOpen}
                        danger={true}
                    />
                </div>

            </div>
        </aside>
    );
};

const SidebarItem = ({ icon, label, to, active, expanded, danger = false, badge }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 p-3 rounded-lg transition-colors relative
            ${active
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                : danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }
            ${!expanded && 'justify-center'}
        `}
    >
        {/* Icon */}
        <div className="shrink-0">
            {icon}
        </div>

        {/* Label with Badge */}
        {expanded ? (
            <div className="flex items-center justify-between flex-1">
                <span className="text-sm truncate">{label}</span>
                {badge && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 dark:bg-blue-500 text-white">
                        {badge}
                    </span>
                )}
            </div>
        ) : (
            // Tooltip for collapsed state
            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                {label}
                {badge && (
                    <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                        {badge}
                    </span>
                )}
            </div>
        )}

        {/* Active Indicator */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-r"></div>
        )}
    </Link>
);

export default Sidebar;