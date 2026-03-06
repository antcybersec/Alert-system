import React from 'react';
import CivicLayout from './CivicLayout';
import { Shield, Lock, Eye, Key } from 'lucide-react';

const PrivacySecurity = () => {
    return (
        <CivicLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy & Security</h1>
                            <p className="text-slate-500 dark:text-slate-400">Manage your security preferences and data privacy.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Section
                            icon={<Key className="w-5 h-5 text-purple-500" />}
                            title="Password & Authentication"
                            description="Update your password and secure your account."
                            action="Change Password"
                        />
                        <Section
                            icon={<Lock className="w-5 h-5 text-green-500" />}
                            title="Two-Factor Authentication"
                            description="Add an extra layer of security to your account."
                            action="Enable 2FA"
                        />
                        <Section
                            icon={<Eye className="w-5 h-5 text-orange-500" />}
                            title="Profile Visibility"
                            description="Control who can see your profile details."
                            action="Manage"
                        />
                    </div>
                </div>
            </div>
        </CivicLayout>
    );
};

const Section = ({ icon, title, description, action }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
        <button className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
            {action}
        </button>
    </div>
);

export default PrivacySecurity;
