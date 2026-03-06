import React from 'react';


export default function Careers() {
    const positions = [
        { title: "Senior React Engineer", type: "Remote", dept: "Engineering" },
        { title: "AI/ML Researcher", type: "Bangalore", dept: "Data Science" },
        { title: "Community Manager", type: "Mumbai", dept: "Operations" }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

            <main className="flex-grow py-20 px-6 max-w-4xl mx-auto w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">Build for the Nation 🇮🇳</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Join a mission-driven team solving real problems for millions of citizens.
                        We're looking for passionate individuals who want to code for a cause.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b dark:border-slate-800 pb-2">Open Positions</h3>
                    {positions.map((job, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800/50">
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{job.title}</h4>
                                <div className="text-slate-500 dark:text-gray-400 text-sm mt-1">{job.dept} · {job.type}</div>
                            </div>
                            <button className="text-blue-600 dark:text-blue-400 font-semibold px-4 py-2 bg-blue-50 dark:bg-slate-700 rounded-lg text-sm">Apply &rarr;</button>
                        </div>
                    ))}
                </div>
            </main>

        </div>
    );
}
