import React, { useState } from 'react';
import { Camera, Send, MapPin, Check, MessageCircle, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // Import Toast
import { useAuth } from '../../context/AuthContext'; // Import Auth
import CivicLayout from './CivicLayout';
import WhatsAppSimulator from '../../components/civic/WhatsAppSimulator';

const WhatsAppGuide = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleJoinCommunity = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const res = await fetch(`${API_BASE_URL}/api/auth/join-community`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUser.uid })
            });

            if (res.ok) {
                toast.success("Community Invite Link sent to your WhatsApp!");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to join community");
            }
        } catch (error) {
            console.error("Join Error:", error);
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <CivicLayout>
            <div className="min-h-[calc(100vh-100px)] flex flex-col justify-center">

                <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="flex flex-col lg:flex-row min-h-[600px]">

                        {/* Left Side: Call to Action (60%) */}
                        <div className="lg:w-3/5 p-8 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900 relative z-10">

                            <div className="flex items-center gap-3 mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <MessageCircle size={14} /> Official Integration
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Bot Online
                                </div>
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                                No App? No Problem.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700">Just WhatsApp Us.</span>
                            </h1>

                            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
                                Report potholes, garbage dumps, or accidents directly through our intelligent Chatbot. It's as easy as sending a message to a friend.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <a
                                    href="https://wa.me/919981478143?text=Start"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                                >
                                    <MessageCircle size={24} className="fill-current" /> Chat with Bot Now
                                </a>

                                {currentUser && (
                                    <button
                                        onClick={handleJoinCommunity}
                                        disabled={loading}
                                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                                    >
                                        {loading ? "Sending..." : "Join Community Group"}
                                    </button>
                                )}

                                {!currentUser && (
                                    <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                                        <QrCode size={20} /> <span className="font-mono">+91 99814 78143</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Steps Horizontal */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <StepItem icon={<Send />} label="1. Say 'Start'" />
                                <StepItem icon={<Camera />} label="2. Send Photo" />
                                <StepItem icon={<MapPin />} label="3. Auto-Location" />
                                <StepItem icon={<Check />} label="4. Get Ticket ID" />
                            </div>

                        </div>

                        {/* Right Side: Visual / Interactive Simulator (40%) */}
                        <div className="hidden lg:flex lg:w-2/5 bg-[#00a884] items-center justify-center relative shadow-inner">
                            {/* Abstract Pattern */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png')] bg-center bg-no-repeat bg-contain transform scale-150 translate-x-1/2 pointer-events-none"></div>

                            <div className="z-10 w-full max-w-sm transform scale-90 hover:scale-95 transition-transform duration-500">
                                <WhatsAppSimulator />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </CivicLayout>
    );
};

const StepItem = ({ icon, label }) => (
    <div className="flex flex-col items-center text-center gap-2 group">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-green-50 dark:group-hover:bg-green-500/20 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
    </div>
);

export default WhatsAppGuide;
