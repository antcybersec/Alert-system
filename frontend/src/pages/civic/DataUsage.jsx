import React from 'react';
import CivicLayout from './CivicLayout';
import { BarChart, Wifi, Download, Upload, Database } from 'lucide-react';

const DataUsage = () => {
    return (
        <CivicLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                            <BarChart className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Usage</h1>
                            <p className="text-slate-500 dark:text-slate-400">Monitor your app's data consumption.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <UsageCard
                            icon={<Download className="text-blue-500" />}
                            label="Media Downloaded"
                            value="450 MB"
                            trend="+12% this month"
                        />
                        <UsageCard
                            icon={<Upload className="text-purple-500" />}
                            label="Reports Uploaded"
                            value="85 MB"
                            trend="+5% this month"
                        />
                    </div>

                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Settings</h3>
                    <div className="space-y-4">
                        <SettingRow
                            icon={<Wifi className="w-5 h-5 text-indigo-500" />}
                            title="Media Auto-Download"
                            status="Wi-Fi Only"
                        />
                        <SettingRow
                            icon={<Database className="w-5 h-5 text-orange-500" />}
                            title="Storage Saver"
                            status="Off"
                        />
                    </div>
                </div>
            </div>
        </CivicLayout>
    );
};

const UsageCard = ({ icon, label, value, trend }) => (
    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">{icon}</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">{label}</div>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</div>
        <div className="text-xs font-bold text-green-600 dark:text-green-400">{trend}</div>
    </div>
);

const SettingRow = ({ icon, title, status }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{status}</span>
    </div>
);

export default DataUsage;
