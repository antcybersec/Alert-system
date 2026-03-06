import React from 'react';
import wrImg from '../../assets/wr.png';
import aisImg from '../../assets/ais.png';
import ltImg from '../../assets/lt.png';

export default function Features() {

    const features = [
        {
            image: wrImg,
            title: "WhatsApp Reporting",
            highlight: "No app. No forms.",
            desc: "Just send a message and report issues instantly.",
            color: "from-orange-400 to-orange-600"
        },
        {
            image: aisImg,
            title: "AI Smart Routing",
            highlight: "Right dept. First time.",
            desc: "AI removes duplicates and routes issues accurately.",
            color: "from-blue-400 to-blue-600"
        },
        {
            image: ltImg,
            title: "Live Tracking",
            highlight: "Real-time updates",
            desc: "Track issue progress directly in WhatsApp.",
            color: "from-green-400 to-green-600"
        }
    ];

    return (
        <section
            id="features"
            className="py-28 bg-white dark:bg-slate-950 transition-colors"
        >
            <div className="max-w-7xl mx-auto px-6">

                {/* Section Header */}
                <div className="text-center mb-20">
                    <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                        Why Nagar Alert Hub?
                    </span>

                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
                        Built for Citizens. Trusted by Cities.
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        A simple, transparent civic reporting system that actually works.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-10">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="group relative p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300"
                        >
                            {/* Glow */}
                            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 bg-gradient-to-br ${f.color} transition`} />

                            {/* Icon */}
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-8 overflow-hidden">
                                <img src={f.image} alt={f.title} className="w-full h-full object-cover" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {f.title}
                            </h3>

                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                                {f.highlight}
                            </p>

                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                {f.desc}
                            </p>

                            {/* Bottom Tag */}
                            <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Powered by Nagar Intelligence
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}