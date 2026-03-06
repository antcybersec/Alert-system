import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Shield, AlertTriangle, Siren, CheckCircle, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import { useAuth } from '../../context/AuthContext';

const SOS = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(null);
    const [active, setActive] = useState(false);
    const [sentLocation, setSentLocation] = useState(null);

    useEffect(() => {
        let timer;
        if (active && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (active && countdown === 0) {
            // Trigger SOS
            setActive(false);

            // 1. Immediate Action: Initiate Call to Police (100)
            window.location.href = "tel:100";

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setSentLocation(loc);

                    let finalAddress = `SOS Signal: ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;

                    // Attempt Reverse Geocoding for Proper Address
                    try {
                        const { GOOGLE_MAPS_API_KEY } = await import('../../mapsConfig');
                        if (GOOGLE_MAPS_API_KEY) {
                            const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=${GOOGLE_MAPS_API_KEY}`);
                            const geoData = await geoRes.json();
                            if (geoData.results && geoData.results[0]) {
                                finalAddress = geoData.results[0].formatted_address;
                            }
                        }
                    } catch (geoErr) {
                        console.error("Geocoding failed, using coords:", geoErr);
                    }

                    // Update state with address so UI shows it
                    setSentLocation({ ...loc, address: finalAddress });

                    // Create Critical Report to trigger Prediction 3 & Map Blink & Email
                    try {
                        const reportData = {
                            userId: currentUser?.uid || 'Anonymous',
                            type: 'SOS Emergency', // Critical keywords
                            description: 'User activated Emergency SOS beacon. Immediate assistance required.',
                            department: 'Police', // Forces Critical handling
                            priority: 'Critical',
                            status: 'Pending',
                            image: null,
                            location: {
                                lat: loc.lat.toString(),
                                lng: loc.lng.toString(),
                                address: finalAddress


                            },
                        };

                        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                        await fetch(`${API_BASE_URL}/api/reports/create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(reportData)
                        });
                        console.log("SOS Alert Broadcasted to System");
                    } catch (err) {
                        console.error("SOS Broadcast Failed:", err);
                    }
                });
            }
        }
        return () => clearTimeout(timer);
    }, [active, countdown, currentUser]);

    const handleSOSClick = () => {
        if (!active) {
            setActive(true);
            setCountdown(5);
            setSentLocation(null);
        } else {
            setActive(false);
            setCountdown(null);
        }
    };

    return (
        <CivicLayout>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-100px)] items-center">

                {/* Left Col: Explainer & Contacts */}
                <div className="space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full font-bold text-sm mb-4">
                            <Siren size={18} /> Emergency Mode
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Emergency SOS</h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                            In case of immediate danger, use this tool to silence your phone and broadcast your live location to the nearest police station and your emergency contacts.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-blue-500" /> Trusted Contacts
                        </h3>
                        <div className="space-y-4">
                            <ContactRow icon={<Phone size={20} />} name="Police Control Room" number="100" type="Official" />
                            <ContactRow icon={<AlertTriangle size={20} />} name="Fire Brigade" number="101" type="Official" />
                            <ContactRow icon={<UserIcon />} name="My Personal Number" number="+91 88728 25483" type="Personal" />
                        </div>
                    </div>
                </div>

                {/* Right Col: The BIG Button */}
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 relative overflow-hidden h-full min-h-[500px]">

                    {/* Background Pulse Effect */}
                    {active && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <motion.div
                                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-[500px] h-[500px] bg-red-500 rounded-full blur-3xl"
                            />
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-12 relative z-10 text-center">
                        {active ? "Sending Alert in..." : "Tap to activate Emergency SOS"}
                    </h2>

                    <button
                        onClick={handleSOSClick}
                        className={`w-72 h-72 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 relative z-10 border-8 ${active
                            ? 'bg-white border-red-500 text-red-600'
                            : 'bg-gradient-to-br from-red-500 to-red-600 border-red-100 text-white shadow-red-500/40 hover:shadow-red-500/60'
                            }`}
                    >
                        {active ? (
                            <>
                                <span className="text-8xl font-black mb-2">{countdown}</span>
                                <span className="text-lg font-bold uppercase tracking-wider">Cancel</span>
                            </>
                        ) : (
                            <>
                                <BellRing size={80} className="mb-6 animate-pulse" />
                                <span className="text-4xl font-black tracking-widest">SOS</span>
                            </>
                        )}
                    </button>

                    {/* Status Message */}
                    {countdown === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-12 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-8 py-4 rounded-xl font-bold flex flex-col items-center gap-1 text-lg text-center"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle size={24} />
                                Alert Sent Successfully!
                            </div>
                            {sentLocation && (
                                <span className="text-sm font-normal opacity-80 max-w-xs break-words">
                                    Location Shared: {sentLocation.address || `${sentLocation.lat.toFixed(5)}, ${sentLocation.lng.toFixed(5)}`}
                                </span>
                            )}
                        </motion.div>
                    )}
                </div>

            </div>
        </CivicLayout>
    );
};

const ContactRow = ({ icon, name, number, type }) => (
    <a href={`tel:${number}`} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group" title={`Call ${name}`}>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                {icon}
            </div>
            <div>
                <div className="font-bold text-base text-slate-900 dark:text-white">{name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">{number}</div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${type === 'Official' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                {type}
            </span>
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Phone size={16} className="fill-current" />
            </div>
        </div>
    </a>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default SOS;
