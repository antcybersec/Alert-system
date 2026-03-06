import React from 'react';


export default function TermsOfService() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

            <main className="flex-grow py-16 px-6 max-w-3xl mx-auto w-full">
                <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Terms of Service</h1>
                <div className="prose prose-slate dark:prose-invert">
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Welcome to Nagar Alert Hub.</p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">By accessing or using our services, you agree to be bound by these terms. If you do not agree to these terms, you may not use the services.</p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">2. User Conduct</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">You agree to use our platform responsibly. You will NOT:</p>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                        <li>Submit false or misleading reports.</li>
                        <li>Use the service for harassment or illegal activities.</li>
                        <li>Attempt to interfere with the proper working of the API or platform.</li>
                    </ul>

                    <p className="text-slate-600 mb-4">Nagar Alert Hub acts as an intermediary. We are not responsible for the actual resolution of issues, which depends on the respective municipal authorities.</p>
                </div>
            </main>

        </div>
    );
}
