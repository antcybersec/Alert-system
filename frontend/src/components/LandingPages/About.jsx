import React from 'react';
import { MessageSquare, Brain, MapPin } from 'lucide-react';

export default function About() {
  const features = [
    {
      title: "WhatsApp Reporting",
      tagline: "No app. No forms.",
      description: "Just send a message and report issues instantly.",
      icon: <MessageSquare className="w-7 h-7 text-white/90" fill="currentColor" />,
      color: "bg-[#FF7A00]", // Exact Orange from screenshot
    },
    {
      title: "AI Smart Routing",
      tagline: "Right dept. First time.",
      description: "AI removes duplicates and routes issues accurately.",
      icon: <Brain className="w-7 h-7 text-white/90" fill="currentColor" />,
      color: "bg-[#3B82F6]", // Exact Blue from screenshot
    },
    {
      title: "Live Tracking",
      tagline: "Real-time updates",
      description: "Track issue progress directly in WhatsApp.",
      icon: <MapPin className="w-7 h-7 text-white/90" fill="currentColor" />,
      color: "bg-[#00C853]", // Exact Green from screenshot
    }
  ];

  return (
    <section id="about" className="py-24 bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Top Badge & Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              National Civic Tech Initiative
            </span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Empowering Citizens. <br/>
            <span className="text-blue-600">Transforming Cities.</span>
          </h2>
        </div>

        {/* Feature Cards Grid - Direct Match to Screenshot */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full"
            >
              {/* Icon Squircle */}
              <div className={`${feature.color} w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-10 shadow-lg shadow-inner`}>
                {feature.icon}
              </div>

              {/* Text Area */}
              <div className="flex-grow">
                <h3 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[17px] font-semibold text-slate-800 dark:text-slate-200 mb-6">
                  {feature.tagline}
                </p>
                <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-10">
                  {feature.description}
                </p>
              </div>

              {/* Powered By Footer */}
              <div className="flex items-center gap-2.5 pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="w-2.5 h-2.5 bg-[#00C853] rounded-full"></div>
                <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
                  Powered by Nagar Intelligence
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section - Clean & Minimal */}
        <div className="mt-20 pt-16 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
                { value: "50k+", label: "Citizens" },
                { value: "12k+", label: "Resolved" },
                { value: "24h", label: "Response" },
                { value: "15+", label: "Cities" }
            ].map((stat, i) => (
                <div key={i}>
                    <div className="text-4xl font-black text-blue-600 mb-1">{stat.value}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}