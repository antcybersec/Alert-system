import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const CivicLayout = ({ children, noPadding = false }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen relative overflow-hidden">

                {/* Topbar */}
                <Topbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                {/* Page Content */}
                <main className={`flex-1 relative scroll-smooth overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${noPadding ? '' : 'p-4 md:p-6 lg:p-8'}`}>
                    <div className={`${noPadding ? 'h-full' : 'max-w-7xl mx-auto space-y-6 md:space-y-8'} animate-in fade-in duration-500`}>
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
};

export default CivicLayout;
