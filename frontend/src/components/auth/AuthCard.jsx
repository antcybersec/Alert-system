import React from 'react';

const AuthCard = ({ title, subtitle, children }) => {
    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 transition-colors duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
};

export default AuthCard;
