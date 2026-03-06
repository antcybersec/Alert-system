import React, { useState } from 'react';
import CivicLayout from './CivicLayout';
import { Settings, Bell, Moon, Globe, Smartphone } from 'lucide-react';

const Preferences = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);

    return (
        <CivicLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
                            <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Preferences</h1>
                            <p className="text-slate-500 dark:text-slate-400">Customize your app experience.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ToggleSection
                            icon={<Moon className="w-5 h-5 text-indigo-500" />}
                            title="Dark Mode"
                            description="Switch between light and dark themes."
                            enabled={darkMode}
                            onToggle={() => setDarkMode(!darkMode)}
                        />
                        <ToggleSection
                            icon={<Bell className="w-5 h-5 text-red-500" />}
                            title="Push Notifications"
                            description="Receive alerts about your reports and community."
                            enabled={notifications}
                            onToggle={() => setNotifications(!notifications)}
                        />
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Language</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">English (US)</p>
                                </div>
                            </div>
                            <button className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">Change</button>
                        </div>
                    </div>
                </div>
            </div>
        </CivicLayout>
    );
};

const ToggleSection = ({ icon, title, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    </div>
);

export default Preferences;
