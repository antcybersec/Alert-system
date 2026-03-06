import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/LandingPages/Navbar';
import Footer from '../../components/LandingPages/Footer';
// import { sendPasswordResetEmail } from 'firebase/auth'; // Removed
// import { auth } from '../../services/firebase'; // Removed
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [userType, setUserType] = useState('citizen');
    const [email, setEmail] = useState('');

    const { resetPassword } = useAuth(); // Mock hook

    const handleReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await resetPassword(email);
            toast.success("Password reset link sent to your email (Mock).");
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f172a] transition-colors duration-300">
            <Navbar />

            <div className="flex-grow flex w-full overflow-hidden">
                {/* Left Side - Visuals */}
                <div className="hidden lg:flex w-1/2 relative flex-col justify-start pt-32 px-12 pb-12 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=2070&auto=format&fit=crop"
                            alt="Cityscape"
                            className="h-full w-full object-cover opacity-20 dark:opacity-40 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-100/80 via-white/50 to-slate-200/50 dark:from-[#0f172a] dark:via-[#0f172a]/80 dark:to-slate-900/90"></div>
                    </div>

                    <div className="relative z-10 mb-8">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>नगर</span>
                                <span className="font-sans">Alert Hub</span>
                            </h2>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 dark:bg-white/10 backdrop-blur-md border border-blue-200 dark:border-white/20 text-blue-800 dark:text-white text-xs font-medium mb-6">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            SECURE RESET PORTAL
                        </div>
                        <h1 className="text-5xl font-bold leading-tight mb-4 text-slate-900 dark:text-white">
                            Regain Access to<br />
                            <span className="text-blue-600 dark:text-blue-400">Your Account.</span>
                        </h1>
                        <p className="text-slate-600 dark:text-gray-300 text-lg max-w-md mb-8">
                            Follow the simple steps to securely reset your password and continue contributing to your city.
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-full text-green-600 dark:text-green-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Verified</div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Secure Process</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 flex flex-col relative px-6 py-12 lg:p-24 justify-center bg-white dark:bg-[#0f172a] transition-colors">
                    <div className="max-w-[440px] w-full mx-auto">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex justify-center items-center gap-2">
                                <span>नगर</span>
                                <span>Alert Hub</span>
                            </h2>
                            <p className="text-slate-500 dark:text-gray-400 text-sm">Reset your {userType === 'citizen' ? 'Citizen' : 'Official'} password</p>
                        </div>

                        {/* Tabs for consistency */}
                        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-8 border border-slate-200 dark:border-slate-700/50">
                            <button
                                onClick={() => setUserType('citizen')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${userType === 'citizen' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Citizen
                            </button>
                            <button
                                onClick={() => setUserType('admin')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${userType === 'admin' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Official
                            </button>
                        </div>

                        <form className="space-y-6" onSubmit={handleReset}>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    {userType === 'citizen' ? 'Registered Email Address' : 'Official ID / Email'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        className={`block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm`}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {userType === 'citizen' && (
                                    <p className="text-xs text-slate-500">For security, password reset links are sent via email.</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700/50 text-center">
                            <p className="text-slate-500 dark:text-gray-400 text-sm">
                                Remembered your password? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 dark:hover:text-blue-300 ml-1">Back to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
