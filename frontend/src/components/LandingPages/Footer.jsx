import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-[#0f172a] text-slate-300 py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                            <span className="text-2xl">⚡</span>
                            <span className="text-xl font-bold text-white">नगर Alert Hub</span>
                        </Link>
                        <p className="text-sm opacity-70 leading-relaxed">
                            Making cities smarter, safer, and cleaner through community participation and transparent governance.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Platform</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/how-it-works" className="hover:text-blue-400 transition-colors">How it Works</Link></li>
                            <li><a href="/#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                            <li><Link to="/municipalities" className="hover:text-blue-400 transition-colors">For Municipalities</Link></li>
                            <li><Link to="/success-stories" className="hover:text-blue-400 transition-colors">Success Stories</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="/#about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                            <li><Link to="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-service" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Connect</h4>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                {/* Twitter icon substitute */}
                                <span className="font-bold">X</span>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                {/* LinkedIn icon substitute */}
                                <span className="font-bold">in</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs opacity-60">
                    <p>© 2026 Nagar Alert Hub. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span>Made with ❤️ in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
