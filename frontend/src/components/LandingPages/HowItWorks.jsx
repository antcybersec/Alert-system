import React from 'react';


export default function HowItWorks() {
    const steps = [
        {
            step: 1,
            title: "Spot an Issue",
            description: "Notice a civic problem like a pothole, uncollected garbage, or a broken streetlight in your neighborhood.",
            icon: "👀"
        },
        {
            step: 2,
            title: "Send a WhatsApp Message",
            description: "Simply send 'Hi' to our dedicated WhatsApp number (+91-98765-43210). No apps to download.",
            icon: "💬"
        },
        {
            step: 3,
            title: "Share Details",
            description: "Our AI bot will guide you to share a photo and your location. It takes less than 30 seconds.",
            icon: "📸"
        },
        {
            step: 4,
            title: "Information Verification",
            description: "Our AI verifies the location and categorizes the issue automatically to prevent duplicates.",
            icon: "🤖"
        },
        {
            step: 5,
            title: "Resolution",
            description: "The request is routed to the on-field municipal team. You get updates at every step until it's fixed.",
            icon: "✅"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

            <main className="flex-grow py-20 px-6 max-w-7xl mx-auto w-full">
                <div className="text-center mb-16">
                    <span className="text-[#1a36ca] dark:text-blue-400 font-semibold tracking-wide uppercase text-sm">Simple Process</span>
                    <h1 className="text-4xl md:text-5xl font-bold mt-2 text-slate-900 dark:text-white">How It Works</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mt-4">
                        Democratizing civic reporting with a platform everyone already knows how to use.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (hidden on mobile) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-slate-800 -translate-y-1/2 -z-10"></div>

                    <div className="grid md:grid-cols-5 gap-8">
                        {steps.map((item, index) => (
                            <div key={index} className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-center group">
                                <div className="w-14 h-14 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                                    {item.icon}
                                </div>
                                {/* Step Number Badge */}
                                <div className="absolute top-4 right-4 text-xs font-bold text-gray-300 dark:text-slate-600">0{item.step}</div>

                                <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Demo Section */}
                <div className="mt-24 bg-slate-50 dark:bg-slate-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 border border-slate-100 dark:border-slate-700">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">See it in action</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Watch how easy it is to report an issue. The entire conversation happens in your local language.
                        </p>
                        <button className="bg-[#25D366] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#20ba5a] transition-colors flex items-center gap-2">
                            Start Chat on WhatsApp
                        </button>
                    </div>
                    <div className="flex-1 w-full flex justify-center">
                        {/* Placeholder for video or GIF */}
                        <div className="w-full max-w-sm aspect-video bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium">
                            Demo Video Placeholder
                        </div>
                    </div>
                </div>

            </main>

        </div>
    );
}
