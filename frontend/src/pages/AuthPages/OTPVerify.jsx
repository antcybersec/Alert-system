import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Smartphone, Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import AuthCard from '../../components/auth/AuthCard';
import Button from '../../components/ui/Button';
import OTPInput from '../../components/auth/OTPInput';
import { useAuth } from '../../context/AuthContext';

const OTPVerify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, mobile, userType, mode, uid: stateUid } = location.state || {};
    const { loginWithToken, currentUser } = useAuth();

    // Fallback if state is lost (e.g. reload), but requires user to be partially authed via Firebase
    const uid = stateUid || currentUser?.uid;

    useEffect(() => {
        if (!uid && mode !== 'login') {
            // If we really can't find a UID and we aren't just logging in (where we might not have currentUser yet if not synced),
            // then this is a problem. But for 'login' mode, we usually rely on stateUid. 
            // If stateUid is missing in login flow, we are stuck.
        }
    }, [uid, mode]);

    const [mobileOtp, setMobileOtp] = useState('');
    const [emailOtp, setEmailOtp] = useState('');

    // For admins, mobile is not required (Gmail only). For login, mobile is ignored.
    const [mobileVerified, setMobileVerified] = useState(mode === 'login' || userType === 'admin');
    const [emailVerified, setEmailVerified] = useState(false);

    const [loadingMobile, setLoadingMobile] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [authToken, setAuthToken] = useState(null);

    useEffect(() => {
        // Validation: For registration (citizen), need both. For login or admin, need email.
        const isCitizenRegister = mode !== 'login' && userType === 'citizen';
        const missingData = isCitizenRegister ? (!email || !mobile) : !email;

        if (missingData) {
            toast.error("No verification details found. Please try again.");
            navigate(mode === 'login' ? '/login' : '/register');
        }
    }, [email, mobile, navigate, mode, userType]);

    useEffect(() => {
        const finalizeVerification = async () => {
            if (mobileVerified && emailVerified) {
                // If we also have an authToken, we can try to use it.
                // However, if we are ALREADY logged in (currentUser exits) and UID matches, we can skip re-auth.
                // This prevents issues where signInWithCustomToken might hang or conflict with an active password session.

                try {
                    const isAlreadyLoggedIn = currentUser && currentUser.uid === uid;

                    if (!isAlreadyLoggedIn && authToken) {
                        await loginWithToken(authToken);
                    } else if (!isAlreadyLoggedIn && !authToken) {
                        // If we aren't logged in and don't have a token, we can't proceed.
                        // Waiting for token... (unless email verification failed to give one)
                        return;
                    }

                    toast.success("Verification complete! Redirecting...");
                    setTimeout(() => {
                        navigate(userType === 'admin' ? '/admin/dashboard' : '/civic/dashboard');
                    }, 500);
                } catch (err) {
                    console.error("Login with token failed:", err);
                    toast.error("Failed to start session. Please login manually.");
                    navigate('/login');
                }
            }
        };
        finalizeVerification();
    }, [mobileVerified, emailVerified, authToken, userType, navigate, loginWithToken, currentUser, uid]);

    const sendOtp = async (type, contact) => {
        const setLoading = type === 'mobile' ? setLoadingMobile : setLoadingEmail;
        setLoading(true);

        // Map 'mobile' UI action to 'whatsapp' backend type for now, or keep 'mobile' if using SMS.
        // User request specifically mentions using WhatsApp OTP.
        const reqType = type === 'mobile' ? 'whatsapp' : type;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: reqType, contact })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${type === 'mobile' ? 'WhatsApp' : 'Email'} OTP Sent!`);
            } else {
                throw new Error(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (type, contact, otp) => {
        if (otp.length !== 6) return toast.error("Enter valid 6-digit OTP");

        const setLoading = type === 'mobile' ? setLoadingMobile : setLoadingEmail;
        const setVerified = type === 'mobile' ? setMobileVerified : setEmailVerified;

        setLoading(true);
        try {
            // Check if using WhatsApp logic (implied by mobile type in this context if we want to follow user request strictly, 
            // but the backend handles 'whatsapp' type differentiation. Frontend here strictly sends 'mobile' or 'email' types based on UI)
            // However, the backend 'verify-otp' reads contact directly.

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contact, otp, uid })
            });
            const data = await res.json();

            if (res.ok) {
                setVerified(true);
                if (data.token) setAuthToken(data.token);
                toast.success(`${type === 'mobile' ? 'Mobile' : 'Email'} Verified Successfully!`);

                // PROACTIVE: Sync Profile & Join Community if mobile is verified
                if (type === 'mobile') {
                    try {
                        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                        await fetch(`${API_BASE_URL}/api/auth/sync-profile`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid, joinCommunity: true })
                        });
                        toast.success("You've been added to your City Alert Hub!");
                    } catch (syncErr) {
                        console.error("Community Join Error:", syncErr);
                    }
                }

            } else {
                console.error(`[OTP ERROR] Status: ${res.status}, Data:`, data);
                throw new Error(data.error || 'Invalid OTP');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if ((mode !== 'login' && !mobile) || !email) return null;

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <AuthCard
                title={mode === 'login' ? "Two-Factor Authentication" : "Account Verification"}
                subtitle={mode === 'login' ? "Please verify your email to access your account." : "Please verify your mobile number and email to continue."}
            >
                <div className="space-y-8">
                    {/* Mobile Verification Section - Show if Citizen and NOT in login mode */}
                    {mode !== 'login' && userType === 'citizen' && (
                        <div className={`p-4 rounded-xl border ${mobileVerified ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Smartphone className={`w-5 h-5 ${mobileVerified ? 'text-green-600' : 'text-slate-500'}`} />
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Mobile Verification</h3>
                                        <p className="text-xs text-slate-500">{mobile}</p>
                                    </div>
                                </div>
                                {mobileVerified ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                    <button onClick={() => sendOtp('mobile', mobile)} disabled={loadingMobile} className="text-sm text-blue-600 hover:underline">
                                        {loadingMobile ? 'Sending...' : 'Send OTP'}
                                    </button>
                                )}
                            </div>

                            {!mobileVerified && (
                                <div className="space-y-3">
                                    <OTPInput length={6} onComplete={(val) => setMobileOtp(val)} />
                                    <Button
                                        onClick={() => verifyOtp('mobile', mobile, mobileOtp)}
                                        disabled={loadingMobile || mobileOtp.length !== 6}
                                        className="w-full h-9 text-sm"
                                    >
                                        {loadingMobile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Mobile"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )} {/* End Mobile Section */}

                    {/* Email Verification Section - Always Show */}
                    <div className={`p-4 rounded-xl border ${emailVerified ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
                        {/* ... (Keep existing email verification UI) ... */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Mail className={`w-5 h-5 ${emailVerified ? 'text-green-600' : 'text-slate-500'}`} />
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Email Verification</h3>
                                    <p className="text-xs text-slate-500">{email}</p>
                                </div>
                            </div>
                            {emailVerified ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                                <button onClick={() => sendOtp('email', email)} disabled={loadingEmail} className="text-sm text-blue-600 hover:underline">
                                    {loadingEmail ? 'Sending...' : 'Send OTP'}
                                </button>
                            )}
                        </div>

                        {!emailVerified && (
                            <div className="space-y-3">
                                <OTPInput length={6} onComplete={(val) => setEmailOtp(val)} />
                                <Button
                                    onClick={() => verifyOtp('email', email, emailOtp)}
                                    disabled={loadingEmail || emailOtp.length !== 6}
                                    className="w-full h-9 text-sm"
                                >
                                    {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Email"}
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </AuthCard>
        </div>
    );
};

export default OTPVerify;