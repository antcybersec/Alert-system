import React from 'react';
import CivicLayout from './CivicLayout';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Award, Star, Target, Shield, Zap, Lock, Unlock } from 'lucide-react';

const Achievements = () => {
    const { currentUser } = useAuth();
    const points = currentUser?.points || 0;

    // Define Achievements Data with thresholds
    const achievementsList = [
        {
            id: 1,
            title: "Civic Rookie",
            description: "Accumulate 100 points by reporting issues.",
            threshold: 100,
            icon: <Star size={24} />,
            color: "text-yellow-500",
            bg: "bg-yellow-100 dark:bg-yellow-900/20"
        },
        {
            id: 2,
            title: "Neighborhood Watch",
            description: "Reach 500 points. You are making a difference!",
            threshold: 500,
            icon: <Shield size={24} />,
            color: "text-blue-500",
            bg: "bg-blue-100 dark:bg-blue-900/20"
        },
        {
            id: 3,
            title: "City Guardian",
            description: "Hit the 1000 point mark. A true hero.",
            threshold: 1000,
            icon: <Trophy size={24} />,
            color: "text-purple-500",
            bg: "bg-purple-100 dark:bg-purple-900/20"
        },
        {
            id: 4,
            title: "Rapid Responder",
            description: "Earn 2000 points. Your speed is legendary.",
            threshold: 2000,
            icon: <Zap size={24} />,
            color: "text-orange-500",
            bg: "bg-orange-100 dark:bg-orange-900/20"
        },
        {
            id: 5,
            title: "Elite Citizen",
            description: "The ultimate honor. 5000+ points.",
            threshold: 5000,
            icon: <Award size={24} />,
            color: "text-red-500",
            bg: "bg-red-100 dark:bg-red-900/20"
        }
    ];

    // Calculate progress for the next unlocked achievement
    const nextAchievement = achievementsList.find(a => points < a.threshold);
    const progress = nextAchievement 
        ? Math.min(100, (points / nextAchievement.threshold) * 100) 
        : 100;

    return (
        <CivicLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Achievements</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Track your impact and earn badges as you improve your city.</p>
            </div>

            {/* Top Banner / Stats */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-xl mb-10">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Total Impact Score</div>
                        <div className="text-5xl font-black">{points} <span className="text-2xl font-medium">pts</span></div>
                        <div className="mt-2 text-indigo-100 font-medium flex items-center gap-2">
                            {nextAchievement ? (
                                <>
                                    <Target size={18} />
                                    <span>{nextAchievement.threshold - points} points to {nextAchievement.title}</span>
                                </>
                            ) : (
                                <span>Max Level Reached!</span>
                            )}
                        </div>
                    </div>
                    
                    {/* Progress Circle Visual */}
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                         <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full border-4 border-white/30 flex items-center justify-center text-xl font-bold">
                                {Math.round(progress)}%
                            </div>
                            <div>
                                <div className="text-sm opacity-80">Next Goal</div>
                                <div className="font-bold text-lg">{nextAchievement?.title || "Master"}</div>
                            </div>
                         </div>
                    </div>
                </div>
                
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"></div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementsList.map((achievement) => {
                    const isUnlocked = points >= achievement.threshold;
                    return (
                        <div 
                            key={achievement.id}
                            className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-300 ${
                                isUnlocked 
                                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-lg hover:-translate-y-1' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-70 grayscale-[0.8]'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${achievement.bg} ${achievement.color}`}>
                                    {achievement.icon}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                    isUnlocked 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                    {isUnlocked ? <><Unlock size={12} /> Unlocked</> : <><Lock size={12} /> Locked</>}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{achievement.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">{achievement.description}</p>
                            
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${isUnlocked ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} 
                                    style={{ width: isUnlocked ? '100%' : `${(points / achievement.threshold) * 100}%` }}
                                ></div>
                            </div>
                            <div className="mt-2 text-xs font-medium text-slate-400 flex justify-between">
                                <span>0</span>
                                <span>{achievement.threshold} pts</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </CivicLayout>
    );
};

export default Achievements;
