import React from 'react';
import vidBg from '../../assets/vidbg.mp4';

export default function Hero() {
    return (
        <section
            id="home"
            className="relative overflow-hidden transition-colors"
        >
            {/* BACKGROUND VIDEO */}
            <video
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
            >
                <source src={vidBg} type="video/mp4" />
            </video>

            {/* IMAGE FADE OVERLAY (IMPORTANT) */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/65 to-white/65 dark:from-slate-950/90 dark:via-slate-950/85 dark:to-slate-950/95" />

            {/* SOFT COLOR GLOW */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-300/30 dark:bg-blue-900/20 rounded-full blur-3xl -z-10" />

            {/* CONTENT */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-40 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        National Civic Tech Initiative
                    </span>
                </div>

                {/* Heading */}
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                    Empowering Citizens.
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Transforming Cities.
                    </span>
                </h1>

                {/* Subtext */}
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium mb-10">
                    Real-time civic issue reporting — powered by WhatsApp & AI.
                </p>

                {/* Value Pills */}
                <div className="flex flex-wrap justify-center gap-6 mb-14 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full border shadow-sm">
                        📱 No App Required
                    </div>
                    <div className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full border shadow-sm">
                        ⚡ Report in 30 Seconds
                    </div>
                    <div className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full border shadow-sm">
                        🧠 AI-Verified Alerts
                    </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <a
                        href="#whatsapp"
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-xl hover:shadow-green-500/40 transition"
                    >
                        💬 Try on WhatsApp
                    </a>

                    <a
                        href="#features"
                        className="px-8 py-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur text-slate-700 dark:text-slate-300 font-semibold hover:bg-white dark:hover:bg-slate-800 transition"
                    >
                        Learn How It Works
                    </a>
                </div>
            </div>

            {/* Floating Cards
            <div className="absolute bottom-[-120px] w-full flex justify-center gap-6 px-6 z-10">
                {[
                    { emoji: "🚧", text: "Potholes" },
                    { emoji: "💡", text: "Street Lights" },
                    { emoji: "🗑️", text: "Garbage Issues" },
                    { emoji: "🚰", text: "Water Supply" }
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`w-56 h-36 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border shadow-xl flex flex-col items-center justify-center gap-2 font-semibold ${i % 2 !== 0 ? 'mt-8' : ''
                            }`}
                    >
                        <div className="text-3xl">{item.emoji}</div>
                        <div>{item.text}</div>
                    </div>
                ))}
            </div> */}
        </section>
    );
}