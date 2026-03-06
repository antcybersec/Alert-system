import { Routes, Route } from 'react-router-dom';
import {
    Navbar,
    Hero,
    Features,
    WhatsAppIntegration,
    About,
    Footer,
    HowItWorks,
    Municipalities,
    SuccessStories,
    Careers,
    PrivacyPolicy,
    TermsOfService
} from './LandingPages';

export default function Home() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-white transition-colors duration-300">
            <Navbar />
            <Routes>
                <Route path="/" element={
                    <main>
                        <Hero />
                        <Features />
                        <WhatsAppIntegration />
                        <About />
                    </main>
                } />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/municipalities" element={<Municipalities />} />
                <Route path="/success-stories" element={<SuccessStories />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
            </Routes>
            <Footer />
        </div>
    );
}
