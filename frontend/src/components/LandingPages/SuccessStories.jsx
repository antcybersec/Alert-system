import React from 'react';


export default function SuccessStories() {
    const stories = [
        {
            city: "Indore",
            title: "Achieving #1 Cleanest City Status with Community Reporting",
            stat: "45% faster cleanup",
            desc: "How Indore Municipal Corporation leveraged Nagar Alert Hub to crowdsource cleanliness audits."
        },
        {
            city: "Pune",
            title: "Fixing 500+ Potholes in a Single Monsoon Week",
            stat: "Zero duplicates",
            desc: "Pune's road department used our AI-deduplication to focus on fixing roads rather than filtering data."
        },
        {
            city: "Chandigarh",
            title: "Smart Street Lighting: A Brighter, Safer City",
            stat: "99% uptime",
            desc: "Automated reporting integration for street light outages reduced downtime significantly."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

            <main className="flex-grow py-20 px-6 max-w-7xl mx-auto w-full">
                <div className="text-center mb-20">
                    <span className="text-green-600 dark:text-green-400 font-semibold tracking-wide uppercase text-sm">Impact Stories</span>
                    <h1 className="text-4xl md:text-5xl font-bold mt-2 text-slate-900 dark:text-white">Success Across India</h1>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {stories.map((story, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 overflow-hidden relative">
                                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 group-hover:scale-105 transition-transform duration-500"></div>
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{story.city}</div>
                            </div>
                            <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-slate-900 dark:text-white">{story.title}</h3>
                            <div className="text-[#1a36ca] dark:text-blue-400 font-bold text-lg mb-3">{story.stat}</div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{story.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

        </div>
    );
}
