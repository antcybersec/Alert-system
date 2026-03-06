import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { currentUser, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium animate-pulse">Verifying Session...</p>
            </div>
        );
    }

    if (!currentUser) {
        // Not logged in, redirect to login page with return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Role mismatch (e.g. Citizen trying to access Admin)
        // Redirect to their appropriate dashboard
        const target = role === 'admin' ? '/admin/dashboard' : '/civic/dashboard';
        return <Navigate to={target} replace />;
    }

    return children;
};

export default ProtectedRoute;
