import React from 'react';

export default function WhatsAppIntegration() {
    return (
        <section
            id="whatsapp"
            className="relative py-24 bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden"
        >
            {/* Soft background glow */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-green-300/20 dark:bg-green-900/20 rounded-full blur-3xl"></div>

            <div className="relative max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT CONTENT */}
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold">
                            💬 WhatsApp First Experience
                        </div>

                        {/* Heading */}
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                            Report City Issues
                            <br />
                            <span className="text-green-600 dark:text-green-400">
                                Just Like Chatting.
                            </span>
                        </h2>

                        {/* Subtext */}
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mb-10">
                            No apps. No paperwork. Our AI-powered WhatsApp assistant
                            helps you report civic issues in under 30 seconds.
                        </p>

                        {/* Visual Feature List */}
                        <div className="grid sm:grid-cols-2 gap-5 mb-12">
                            {[
                                {
                                    emoji: "📱",
                                    title: "No App Required",
                                    desc: "Works directly on WhatsApp"
                                },
                                {
                                    emoji: "📍",
                                    title: "Location & Photo",
                                    desc: "Share instantly in chat"
                                },
                                {
                                    emoji: "🧠",
                                    title: "AI Verification",
                                    desc: "Smart duplicate detection"
                                },
                                {
                                    emoji: "🔔",
                                    title: "Live Updates",
                                    desc: "Status in your chat window"
                                }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                                >
                                    <div className="text-2xl">{item.emoji}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                            {item.title}
                                        </h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <a
                            href="#"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-xl hover:shadow-green-500/40 transition"
                        >
                            💬 Try Demo on WhatsApp
                        </a>
                    </div>

                    {/* RIGHT PHONE MOCKUP */}
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-green-200/40 to-blue-200/40 blur-3xl rounded-full"></div>

                        <div className="relative w-[300px] h-[600px] rounded-[2.5rem] border-[14px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="absolute top-0 left-0 right-0 h-16 bg-[#075E54] flex items-center px-4 text-white z-10">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                                    NH
                                </div>
                                <div className="ml-3">
                                    <div className="text-sm font-semibold">
                                        Nagar Helper
                                    </div>
                                    <div className="text-[10px] opacity-80">
                                        Online
                                    </div>
                                </div>
                            </div>

                            {/* Chat */}
                            <div className="pt-20 px-4 space-y-4 text-[13px] bg-[#ECE5DD] h-full">
                                <div className="max-w-[85%] bg-white p-3 rounded-lg shadow">
                                    Hello 👋 Welcome to Nagar Alert Hub.
                                    <div className="text-[10px] text-right text-gray-400 mt-1">
                                        10:00 AM
                                    </div>
                                </div>

                                <div className="ml-auto max-w-[85%] bg-[#DCF8C6] p-3 rounded-lg shadow">
                                    There’s a broken streetlight on Main Road.
                                    <div className="text-[10px] text-right text-gray-500 mt-1">
                                        10:01 AM
                                    </div>
                                </div>

                                <div className="max-w-[85%] bg-white p-3 rounded-lg shadow">
                                    Thanks! Please share a photo or location 📸📍
                                    <div className="text-[10px] text-right text-gray-400 mt-1">
                                        10:01 AM
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}