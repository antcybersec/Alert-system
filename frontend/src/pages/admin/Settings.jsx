import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
    Settings as SettingsIcon, Bell, Shield,
    User, Lock, Eye, EyeOff, Globe,
    Smartphone, Mail, CheckCircle, Save,
    Moon, Sun, Laptop, Palette, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
    const { currentUser } = useAuth();
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(false);

    const [notifSettings, setNotifSettings] = useState({
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        aiAnomalies: true
    });

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("System Configuration Archived");
        }, 1000);
    };

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-10 pb-20">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>

                    <div className="relative group/avatar">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl relative z-10">
                            {currentUser?.firstName?.charAt(0) || 'A'}
                        </div>
                        <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] blur-2xl opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-800 inline-block mb-3">
                            Direct Command • {currentUser?.department || 'General'}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase leading-tight mb-1">
                            {currentUser?.firstName} {currentUser?.lastName}
                        </h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Authorized Official ID: R-0923-{currentUser?.uid?.slice(-4)}</p>
                    </div>

                    <button className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                        <User size={16} /> Edit Profile
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        <SettingsNav icon={<SettingsIcon size={18} />} label="Operational Matrix" active={true} />
                        <SettingsNav icon={<Bell size={18} />} label="Communications" />
                        <SettingsNav icon={<Shield size={18} />} label="Security Protocol" />
                        <SettingsNav icon={<Globe size={18} />} label="Network & Sync" />
                    </div>

                    {/* Settings Panels */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Notification Panel */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                <Bell className="text-blue-600" size={24} /> Notification Logic
                            </h3>

                            <div className="space-y-6">
                                <SettingToggle
                                    label="Intelligence Alerts"
                                    desc="Receive real-time notifications for AI-flagged anomalies."
                                    active={notifSettings.aiAnomalies}
                                    onToggle={() => setNotifSettings({ ...notifSettings, aiAnomalies: !notifSettings.aiAnomalies })}
                                />
                                <SettingToggle
                                    label="Direct Messaging"
                                    desc="Allow citizens to tag you in emergency report threads."
                                    active={notifSettings.emailAlerts}
                                    onToggle={() => setNotifSettings({ ...notifSettings, emailAlerts: !notifSettings.emailAlerts })}
                                />
                                <SettingToggle
                                    label="Operational SMS"
                                    desc="Send critical situation summaries via encrypted mobile link."
                                    active={notifSettings.smsAlerts}
                                    onToggle={() => setNotifSettings({ ...notifSettings, smsAlerts: !notifSettings.smsAlerts })}
                                />
                            </div>
                        </div>

                        {/* Interface Panel */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                <Palette className="text-indigo-600" size={24} /> Visual Terminal
                            </h3>

                            <div className="grid grid-cols-3 gap-4">
                                <ThemeCard icon={<Sun size={20} />} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
                                <ThemeCard icon={<Moon size={20} />} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
                                <ThemeCard icon={<Laptop size={20} />} label="Hybrid" active={theme === 'system'} onClick={() => setTheme('system')} />
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className="flex justify-end gap-4">
                            <button className="px-8 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">Discard Adjustments</button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {loading ? 'Archiving...' : <><Save size={18} /> Commit Configuration</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

const SettingsNav = ({ icon, label, active = false }) => (
    <div className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] cursor-pointer transition-all ${active
            ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xl shadow-blue-600/10'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
        }`}>
        <div className={active ? 'text-white' : 'text-slate-400'}>{icon}</div>
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

const SettingToggle = ({ label, desc, active, onToggle }) => (
    <div className="flex items-center justify-between p-2">
        <div className="flex-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 uppercase tracking-tight">{label}</h4>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">{desc}</p>
        </div>
        <button
            onClick={onToggle}
            className={`w-14 h-8 rounded-full transition-all relative p-1 ${active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-all ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
    </div>
);

const ThemeCard = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-3 ${active
                ? 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-600 text-blue-600 shadow-lg'
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
    >
        <div className={`p-3 rounded-2xl ${active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400'}`}>
            {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

export default Settings;
