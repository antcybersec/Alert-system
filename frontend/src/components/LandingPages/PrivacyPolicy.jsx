import React from 'react';


export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

            <main className="flex-grow py-16 px-6 max-w-3xl mx-auto w-full">
                <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Privacy Policy</h1>
                <div className="prose prose-slate dark:prose-invert hover:prose-a:text-blue-600">
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Last updated: January 2026</p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">1. Information We Collect</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">We collect information that you provide directly to us, such as when you submit a report via WhatsApp, creating a user account, or communicate with us. This may include your phone number, location data associated with incident reports, and images you upload.</p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">2. How We Use Your Information</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">We use the information we collect to:</p>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                        <li>Verify and process civic incident reports.</li>
                        <li>Coordinate with municipal authorities for resolution.</li>
                        <li>Send you status updates regarding your reports.</li>
                        <li>Improve our AI verification models.</li>
                    </ul>

                    <h2 className="text-xl font-bold mt-8 mb-4">3. Data Sharing</h2>
                    <p className="text-slate-600 mb-4">We share incident data with relevant municipal corporations and service providers to facilitate resolution. We do not sell your personal data to advertisers.</p>
                </div>
            </main>

        </div>
    );
}
