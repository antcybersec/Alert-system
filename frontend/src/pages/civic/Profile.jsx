import React from 'react';
import { User, Mail, Phone, MapPin, Edit2, LogOut, Settings as SettingsIcon, Shield, ChevronRight, BarChart, Star, Trash2, Zap, Upload, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

import { getDatabase, ref, onValue, update } from "firebase/database";
import { auth } from '../../services/firebase';

const Profile = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [userData, setUserData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        address: '',
        profilePic: '',
        points: 0,
        reportCount: 0,
        role: 'Citizen',
        badges: []
    });
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedData, setEditedData] = React.useState({});
    const [uploadingPic, setUploadingPic] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const [weeklyActivity, setWeeklyActivity] = React.useState([0, 0, 0, 0, 0, 0, 0]); // Last 7 days

    // Sync local state when Auth finishes loading user
    React.useEffect(() => {
        if (currentUser) {
            // First, RESET state to avoid stale data from previous user leaking in
            setUserData({
                firstName: '', lastName: '', email: '', mobile: '', address: '',
                profilePic: '', points: 0, reportCount: 0, role: 'Citizen', badges: []
            });

            setUserData(prev => ({
                ...prev,
                firstName: currentUser.firstName || currentUser.displayName?.split(' ')[0] || 'User',
                lastName: currentUser.lastName || currentUser.displayName?.split(' ').slice(1).join(' ') || '',
                email: currentUser.email || '',
                mobile: currentUser.mobile || (currentUser.phoneNumber ? currentUser.phoneNumber.replace('+91', '') : 'N/A'),
                address: currentUser.address || 'No address set',
                profilePic: currentUser.profilePic || currentUser.photoURL || '',
                points: currentUser.points || 0,
                role: currentUser.role || 'Citizen'
            }));

            // Sync with Registry (Master Record) for full details
            const db = getDatabase(auth.app);
            const registryRef = ref(db, `users/registry/${currentUser.uid}`);
            const unsubRegistry = onValue(registryRef, (snap) => {
                if (snap.exists()) {
                    const reg = snap.val();
                    setUserData(prev => ({
                        ...prev,
                        firstName: reg.firstName || prev.firstName,
                        lastName: reg.lastName || prev.lastName,
                        mobile: reg.mobile || prev.mobile,
                        address: reg.address || prev.address,
                        email: reg.email || prev.email,
                        profilePic: reg.profilePic || prev.profilePic
                    }));
                }
            });

            // Listen for reports count and generate badges
            const reportsRef = ref(db, 'reports');
            const unsubscribeReports = onValue(reportsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const allReports = snapshot.val();
                    const myReports = Object.values(allReports).filter(r => r.userId === currentUser.uid);

                    // Calculate Weekly Activity (Last 7 days)
                    const today = new Date();
                    const weekData = [0, 0, 0, 0, 0, 0, 0]; // [6 days ago, 5 days ago, ..., today]

                    myReports.forEach(report => {
                        if (report.timestamp) {
                            const reportDate = new Date(report.timestamp);
                            const daysDiff = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));

                            // Only count reports from last 7 days
                            if (daysDiff >= 0 && daysDiff < 7) {
                                weekData[6 - daysDiff]++; // Index 6 is today, 0 is 6 days ago
                            }
                        }
                    });

                    setWeeklyActivity(weekData);

                    // Logic for badges
                    const newBadges = [];
                    // 1. First Report
                    if (myReports.length > 0) newBadges.push({ id: 'first', label: 'First Report', icon: <Star size={24} />, color: 'bg-yellow-500' });
                    // 2. Pothole Pro
                    if (myReports.some(r => (r.type || '').toLowerCase().includes('pothole'))) newBadges.push({ id: 'pothole', label: 'Pothole Pro', icon: <MapPin size={24} />, color: 'bg-blue-500' });
                    // 3. Clean City (Garbage)
                    if (myReports.some(r => (r.type || '').toLowerCase().includes('garbage'))) newBadges.push({ id: 'clean', label: 'Clean City', icon: <Trash2 size={24} />, color: 'bg-green-500' });
                    // 4. Verified (Mobile present)
                    // We check currentUser.mobile directly
                    if (currentUser.mobile || (currentUser.phoneNumber)) newBadges.push({ id: 'verified', label: 'Verified', icon: <Shield size={24} />, color: 'bg-purple-600' });
                    // 5. Civic Hero (Points > 50)
                    if ((currentUser.points || 0) > 50) newBadges.push({ id: 'hero', label: 'Civic Hero', icon: <Zap size={24} />, color: 'bg-red-500' });

                    setUserData(prev => ({ ...prev, reportCount: myReports.length, badges: newBadges }));
                } else {
                    setUserData(prev => ({ ...prev, reportCount: 0, badges: [] }));
                    setWeeklyActivity([0, 0, 0, 0, 0, 0, 0]);
                }
            });

            return () => {
                unsubRegistry();
                unsubscribeReports();
            };
        } else {
            // ... (logout logic)
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Handle Profile Picture Upload
    const handleProfilePicUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploadingPic(true);
        const uploadToast = toast.loading('Uploading profile picture...');

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', `profiles/${auth.currentUser.uid}`);

            // Upload to backend
            const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await response.json();

            // Update Firebase Realtime Database (both nodes for real-time sync)
            const db = getDatabase(auth.app);
            const updates = { profilePic: url };

            await Promise.all([
                update(ref(db, `users/citizens/${auth.currentUser.uid}`), updates),
                update(ref(db, `users/registry/${auth.currentUser.uid}`), updates)
            ]);

            // Update local state immediately for instant UI feedback
            setUserData(prev => ({ ...prev, profilePic: url }));

            toast.success('Profile picture updated!', { id: uploadToast });
        } catch (error) {
            console.error('Profile pic upload error:', error);
            toast.error('Failed to upload profile picture', { id: uploadToast });
        } finally {
            setUploadingPic(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!currentUser) return null;

    return (
        <CivicLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ... Left Col code ... */}
                <div className="space-y-6">
                    {/* ... Profile Card ... */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center text-center relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute top-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                        <div className="relative w-32 h-32 mb-4">
                            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-lg bg-slate-200 overflow-hidden relative z-10 transition-transform hover:scale-105">
                                <img
                                    src={userData.profilePic || `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=0D8ABC&color=fff&size=128`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                {uploadingPic && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 size={32} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicUpload}
                                className="hidden"
                            />

                            {/* Upload Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPic}
                                className="absolute bottom-1 right-1 z-20 bg-slate-900 dark:bg-slate-700 text-white p-2.5 rounded-full border-2 border-white dark:border-slate-900 hover:bg-black dark:hover:bg-slate-600 transition-all shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Upload profile picture"
                            >
                                {uploadingPic ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Camera size={14} className="group-hover:scale-110 transition-transform" />
                                )}
                            </button>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{userData.firstName} {userData.lastName}</h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 capitalize">
                            {userData.role} • {userData.address}
                        </p>

                        <div className="grid grid-cols-3 gap-2 w-full mb-6">
                            <StatBox label="Reports" value={userData.reportCount} />
                            <StatBox label="Points" value={userData.points} highlighted />
                            <StatBox label="Rank" value="#3" />
                        </div>

                        <button
                            onClick={() => {
                                setEditedData(userData);
                                setIsEditing(true);
                            }}
                            className="w-full py-3 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-xl font-bold transition-colors"
                        >
                            Edit Public Profile
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account</h3>
                        <div className="space-y-1">
                            <ActionRow icon={<Shield size={18} />} label="Privacy & Security" onClick={() => navigate('/civic/privacy')} />
                            <ActionRow icon={<SettingsIcon size={18} />} label="Preferences" onClick={() => navigate('/civic/preferences')} />
                            <ActionRow icon={<BarChart size={18} />} label="Data Usage" onClick={() => navigate('/civic/data-usage')} />
                        </div>
                        <div className="border-t border-slate-50 dark:border-slate-800 my-4"></div>
                        <button onClick={() => auth.signOut()} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <LogOut size={18} /> Log Out
                        </button>
                    </div>
                </div>

                {/* Right Col: Details Board */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Weekly Activity Graph */}
                    <div className="bg-[#1e293b] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Weekly Activity</h2>
                                    <p className="text-slate-400 mt-1">Your reporting patterns over 7 days</p>
                                </div>
                                <div className="bg-blue-500/20 p-3 rounded-xl">
                                    <BarChart size={24} className="text-blue-400" />
                                </div>
                            </div>

                            {/* Line Graph */}
                            <div className="relative h-64 mt-8">
                                <WeeklyActivityGraph data={weeklyActivity} />
                            </div>
                        </div>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-10 -mr-16 -mt-16 pointer-events-none"></div>
                    </div>

                    {/* NEW: Achievements Section (LeetCode Style) */}
                    <div className="bg-[#1e293b] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Your Achievements</h2>
                                    <p className="text-slate-400 mt-1">You have earned {userData.badges.length} badges.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/civic/achievements')}
                                    className="bg-slate-700/50 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition backdrop-blur-sm"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {userData.badges.length > 0 ? userData.badges.map(badge => (
                                    <div key={badge.id} className="flex flex-col items-center gap-3 bg-slate-800/50 p-4 rounded-2xl min-w-[110px] border border-slate-700 hover:bg-slate-800 transition-colors">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${badge.color} text-white shadow-lg`}>
                                            {badge.icon}
                                        </div>
                                        <span className="text-[10px] font-extrabold text-center uppercase tracking-widest text-slate-300">{badge.label}</span>
                                    </div>
                                )) : (
                                    <div className="text-slate-400 italic text-sm py-4">
                                        Submit your first report to unlock badges!
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Decorative Background Blur */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600 rounded-full blur-[100px] opacity-20 -ml-16 -mb-16 pointer-events-none"></div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                            <button
                                onClick={() => {
                                    if (isEditing) {
                                        // Save Logic
                                        const db = getDatabase(auth.app);
                                        const updates = {
                                            firstName: editedData.firstName || userData.firstName,
                                            lastName: editedData.lastName || userData.lastName,
                                            mobile: editedData.mobile || userData.mobile,
                                            address: editedData.address || userData.address,
                                        };

                                        const saveToast = toast.loading('Saving changes...');

                                        const p1 = update(ref(db, `users/citizens/${auth.currentUser.uid}`), updates);
                                        const p2 = update(ref(db, `users/registry/${auth.currentUser.uid}`), updates);

                                        Promise.all([p1, p2]).then(() => {
                                            setIsEditing(false);
                                            // Optimistic update (real-time listener will also update)
                                            setUserData(prev => ({ ...prev, ...updates }));
                                            toast.success('Profile updated successfully!', { id: saveToast });
                                        }).catch(err => {
                                            console.error('Update error:', err);
                                            toast.error('Failed to update profile: ' + err.message, { id: saveToast });
                                        });
                                    } else {
                                        // Start Editing
                                        setEditedData(userData);
                                        setIsEditing(true);
                                    }
                                }}
                                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {isEditing ? 'Save Changes' : 'Update'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name Input */}
                            {isEditing ? (
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                                        <User size={20} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">First Name</div>
                                        <input
                                            value={editedData.firstName}
                                            onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                                            className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {isEditing ? (
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                                        <User size={20} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Last Name</div>
                                        <input
                                            value={editedData.lastName}
                                            onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                                            className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {!isEditing && (
                                <>
                                    <InfoCard icon={<Mail className="text-blue-500" />} label="Email Address" value={userData.email} verified={!!userData.email} />
                                    <InfoCard icon={<Phone className="text-green-500" />} label="Phone Number" value={`+91 ${userData.mobile}`} verified={userData.mobile && userData.mobile !== 'N/A'} />
                                </>
                            )}

                            {isEditing && (
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                                        <Phone size={20} className="text-green-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Mobile</div>
                                        <input
                                            value={editedData.mobile}
                                            onChange={(e) => setEditedData({ ...editedData, mobile: e.target.value })}
                                            className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                            placeholder="Enter mobile..."
                                        />
                                    </div>
                                </div>
                            )}

                            {isEditing ? (
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4 col-span-full">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin size={20} className="text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Address</div>
                                        <input
                                            value={editedData.address}
                                            onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                                            className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <InfoCard icon={<MapPin className="text-indigo-500" />} label="Home Address" value={userData.address} fullWidth verified={userData.address && userData.address !== 'No address set'} />
                            )}
                        </div>
                    </div>



                </div>

            </div>
        </CivicLayout>
    );
};

const StatBox = ({ label, value, highlighted }) => (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${highlighted ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`}>
        <div className="font-bold text-xl leading-none mb-1">{value}</div>
        <div className={`text-[10px] font-bold uppercase tracking-wider ${highlighted ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{label}</div>
    </div>
);

const InfoCard = ({ icon, label, value, verified, fullWidth }) => (
    <div className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 ${fullWidth ? 'col-span-full md:col-span-2' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center shrink-0">
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div className="flex-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                {label} {verified && <CheckCircle size={12} className="text-green-500 fill-current bg-white dark:bg-slate-900 rounded-full" />}
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm leading-snug break-words">{value}</div>
        </div>
    </div>
);

const ActionRow = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-left group">
        <div className="flex items-center gap-3">
            <div className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{icon}</div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{label}</span>
        </div>
        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
    </button>
);

const BadgeBox = ({ icon, name }) => (
    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-pointer">
        <div className="text-xl">{icon}</div>
        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">{name}</div>
    </div>
);

// Helper for InfoCard verification check mark
const CheckCircle = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

// Weekly Activity Line Graph Component
const WeeklyActivityGraph = ({ data }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxValue = Math.max(...data, 5); // Minimum scale of 5 for better visibility
    const width = 100;
    const height = 100;
    const padding = 15;
    const hasData = data.some(val => val > 0);

    // Calculate points for the line
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - padding - ((value / maxValue) * (height - 2 * padding));
        return { x, y, value };
    });

    // Create SVG path
    const pathD = points.map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;

        // Smooth curve using quadratic bezier
        const prevPoint = points[index - 1];
        const cpX = (prevPoint.x + point.x) / 2;
        return `Q ${cpX} ${prevPoint.y}, ${point.x} ${point.y}`;
    }).join(' ');

    // Create area fill path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <div className="w-full h-full relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map(i => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + (i * (height - 2 * padding) / 4)}
                        x2={width - padding}
                        y2={padding + (i * (height - 2 * padding) / 4)}
                        stroke="rgba(148, 163, 184, 0.15)"
                        strokeWidth="0.3"
                        strokeDasharray="2,2"
                    />
                ))}

                {/* Baseline */}
                <line
                    x1={padding}
                    y1={height - padding}
                    x2={width - padding}
                    y2={height - padding}
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth="0.5"
                />

                {/* Area Fill with Gradient */}
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {hasData && (
                    <path
                        d={areaD}
                        fill="url(#areaGradient)"
                    />
                )}

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                />

                {/* Data Points */}
                {points.map((point, index) => (
                    <g key={index}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="rgb(59, 130, 246)"
                            stroke="white"
                            strokeWidth="1.5"
                            className="transition-all duration-200"
                        />
                        {point.value > 0 && (
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="2"
                                fill="white"
                            />
                        )}
                    </g>
                ))}
            </svg>

            {/* Day Labels */}
            <div className="flex justify-between mt-4 px-2">
                {days.map((day, index) => (
                    <div key={day} className="text-center flex-1">
                        <div className="text-xs font-bold text-slate-400">{day}</div>
                        <div className={`text-sm font-bold mt-1 ${data[index] > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                            {data[index]}
                        </div>
                    </div>
                ))}
            </div>

            {/* No Data Message */}
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-slate-400 text-sm italic">
                        No reports yet. Start reporting to see your activity!
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
