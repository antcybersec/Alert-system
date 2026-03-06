import React from 'react';


export default function Municipalities() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

            <main className="flex-grow py-20 px-6 max-w-7xl mx-auto w-full">
                <div className="text-center mb-16">
                    <span className="text-[#1a36ca] dark:text-blue-400 font-semibold tracking-wide uppercase text-sm">For City Administrations</span>
                    <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-6 text-slate-900 dark:text-white">Transform Your City Governance</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Equip your municipality with AI-driven insights, real-time citizen reporting, and efficient workforce management tools.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Command Center Dashboard</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">A unified view of all city issues, categorized by urgency and location. Dispatch teams with a single click.</p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">✓</div>
                                <span className="text-slate-700 dark:text-slate-300">Real-time Issue Heatmaps</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">✓</div>
                                <span className="text-slate-700 dark:text-slate-300">Automated Ticket Assignment</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">✓</div>
                                <span className="text-slate-700 dark:text-slate-300">SLA Tracking & Reports</span>
                            </li>
                        </ul>
                    </div>
                    <div className="h-80 bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center text-blue-300 dark:text-slate-600 border border-transparent dark:border-slate-700">
                        {/* Placeholder illustration */}
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                    </div>
                </div>

                <div className="text-center bg-[#1a36ca] dark:bg-slate-800 text-white rounded-3xl p-12 shadow-xl">
                    <h2 className="text-3xl font-bold mb-4">Partner with Nagar Alert Hub</h2>
                    <p className="mb-8 opacity-90 max-w-2xl mx-auto">Join 15+ pioneering cities that have improved their response times by 60%.</p>
                    <button className="bg-white text-[#1a36ca] dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">Schedule a Demo</button>
                </div>
            </main>

        </div>
    );
}
