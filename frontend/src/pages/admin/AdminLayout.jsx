import React, { useState } from 'react';
import AdminSidebar from './Sidebar';
import AdminTopbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Initializing Command Matrix...</p>
            </div>
        </div>
    );

    if (!currentUser || currentUser.role !== 'admin') {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-500 overflow-hidden">
            <AdminSidebar isOpen={isSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Background Aesthetics */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>

                <AdminTopbar
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 relative z-10 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
