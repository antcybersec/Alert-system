import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, List, Map, Settings, User,
    Bell, Shield, LogOut, FileText, CheckCircle,
    BarChart2, Radio, CheckSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ isOpen }) => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-30 ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/50">
                <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0">
                        <Shield size={18} />
                    </div>
                    {isOpen && (
                        <div>
                            <h1 className="text-lg font-bold leading-none text-slate-900 dark:text-white">Admin Hub</h1>
                            <p className="text-[10px] font-bold text-blue-500 uppercase mt-0.5">{currentUser?.department || 'Official'}</p>
                        </div>
                    )}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
                {isOpen && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2 px-3">Main Panel</div>}

                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    to="/admin/dashboard"
                    active={isActive('/admin/dashboard')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<List size={20} />}
                    label="Dept. Incidents"
                    to="/admin/incidents"
                    active={isActive('/admin/incidents')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<Map size={20} />}
                    label="Live Monitor"
                    to="/admin/map"
                    active={isActive('/admin/map')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<BarChart2 size={20} />}
                    label="Analytics"
                    to="/admin/analytics"
                    active={isActive('/admin/analytics')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<Radio size={20} />}
                    label="Broadcast"
                    to="/admin/broadcast"
                    active={isActive('/admin/broadcast')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<CheckSquare size={20} />}
                    label="Task Board"
                    to="/admin/tasks"
                    active={isActive('/admin/tasks')}
                    expanded={isOpen}
                />

                {isOpen && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Management</div>}

                <SidebarItem
                    icon={<User size={20} />}
                    label="Officer Profile"
                    to="/admin/profile"
                    active={isActive('/admin/profile')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<Bell size={20} />}
                    label="Notifications"
                    to="/admin/notifications"
                    active={isActive('/admin/notifications')}
                    expanded={isOpen}
                />

                <SidebarItem
                    icon={<Settings size={20} />}
                    label="Settings"
                    to="/admin/settings"
                    active={isActive('/admin/settings')}
                    expanded={isOpen}
                />

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
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

const SidebarItem = ({ icon, label, to, active, expanded, danger = false }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
            ${active
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                : danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
            }
            ${!expanded && 'justify-center'}
        `}
    >
        <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        {expanded && <span className="text-sm truncate">{label}</span>}
        {!expanded && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {label}
            </div>
        )}
    </Link>
);

export default AdminSidebar;
