import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AlertBanner = () => {
    const { currentUser } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    useEffect(() => {
        fetchAlerts();
        // Poll for new alerts every 30 seconds
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const res = await fetch(`${API_BASE_URL}/api/alerts/active`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data.alerts || []);
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    };

    const handleDismiss = async (alertId) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            await fetch(`${API_BASE_URL}/api/alerts/dismiss`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, userId: currentUser?.uid })
            });

            setDismissedAlerts([...dismissedAlerts, alertId]);
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
        }
    };

    const handleView = async (alertId) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            await fetch(`${API_BASE_URL}/api/alerts/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId })
            });
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    };

    const getUrgencyStyles = (urgency) => {
        switch (urgency) {
            case 'high':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    text: 'text-red-900 dark:text-red-100',
                    icon: 'text-red-600 dark:text-red-400'
                };
            case 'medium':
                return {
                    bg: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-200 dark:border-orange-800',
                    text: 'text-orange-900 dark:text-orange-100',
                    icon: 'text-orange-600 dark:text-orange-400'
                };
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    text: 'text-blue-900 dark:text-blue-100',
                    icon: 'text-blue-600 dark:text-blue-400'
                };
        }
    };

    // Filter out dismissed alerts
    const activeAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

    if (activeAlerts.length === 0) return null;

    return (
        <div className="space-y-3 mb-6">
            <AnimatePresence>
                {activeAlerts.map((alert, index) => {
                    const styles = getUrgencyStyles(alert.urgency);

                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ delay: index * 0.1 }}
                            className={`${styles.bg} ${styles.border} border rounded-lg p-4 shadow-sm`}
                            onMouseEnter={() => handleView(alert.id)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`${styles.icon} mt-0.5`}>
                                    {alert.urgency === 'high' ? (
                                        <AlertTriangle size={20} />
                                    ) : (
                                        <Bell size={20} />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className={`font-bold ${styles.text} text-sm mb-1`}>
                                                {alert.emoji} {alert.title}
                                            </h4>
                                            <p className={`${styles.text} text-sm`}>
                                                {alert.message}
                                            </p>
                                            {alert.estimatedTime && (
                                                <p className={`${styles.icon} text-xs mt-1 font-medium`}>
                                                    ⏱️ {alert.estimatedTime}
                                                </p>
                                            )}
                                        </div>

                                        {/* Dismiss Button */}
                                        <button
                                            onClick={() => handleDismiss(alert.id)}
                                            className={`${styles.icon} hover:opacity-70 transition-opacity shrink-0`}
                                            aria-label="Dismiss alert"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span className={`${styles.icon} font-medium`}>
                                            📍 {alert.affectedArea}
                                        </span>
                                        {alert.department && (
                                            <span className={`${styles.icon} font-medium`}>
                                                🏢 {alert.department}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default AlertBanner;
