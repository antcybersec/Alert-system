import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/AuthPages/Login';
import Register from './pages/AuthPages/Register';
import ForgotPassword from './pages/AuthPages/ForgotPassword';
import OTPVerify from './pages/AuthPages/OTPVerify';

// Civic Pages
import CitizenDashboard from './pages/civic/Dashboard';
import ReportIssue from './pages/civic/ReportIssue';
import LiveMap from './pages/civic/LiveMap';
import SOS from './pages/civic/SOS';
import MyReports from './pages/civic/MyReports';
import Leaderboard from './pages/civic/Leaderboard';
import Profile from './pages/civic/Profile';
import Notifications from './pages/civic/Notifications';
// import AboutStats from './pages/civic/AboutStats';
import WhatsAppGuide from './pages/civic/WhatsAppGuide';
import ReportDetail from './pages/civic/ReportDetail';
import Achievements from './pages/civic/Achievements';
import PrivacySecurity from './pages/civic/PrivacySecurity';
import Preferences from './pages/civic/Preferences';
import DataUsage from './pages/civic/DataUsage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import IncidentList from './pages/admin/Incidents';
import AdminMap from './pages/admin/LiveMap';
import Analytics from './pages/admin/Analytics';
import Broadcast from './pages/admin/Broadcast';
import IncidentDetail from './pages/admin/IncidentDetail';
import Tasks from './pages/admin/Tasks';
import Settings from './pages/admin/Settings';
import OfficerProfile from './pages/admin/OfficerProfile';
import AdminNotifications from './pages/admin/Notifications';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="*" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<OTPVerify />} />

            {/* Civic Routes (Protected) */}
            <Route path="/citizen/dashboard" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/civic/dashboard" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />

            <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
            <Route path="/civic/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />

            <Route path="/civic/map" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
            <Route path="/sos" element={<ProtectedRoute><SOS /></ProtectedRoute>} />

            <Route path="/civic/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
            <Route path="/citizen/reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />

            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/civic/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/civic/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            {/* <Route path="/civic/stats" element={<ProtectedRoute><AboutStats /></ProtectedRoute>} /> */}
            <Route path="/civic/guide" element={<ProtectedRoute><WhatsAppGuide /></ProtectedRoute>} />
            <Route path="/civic/report/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
            <Route path="/civic/privacy" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
            <Route path="/civic/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
            <Route path="/civic/data-usage" element={<ProtectedRoute><DataUsage /></ProtectedRoute>} />

            {/* Admin Routes (Protected + Role Check) */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/incidents" element={<ProtectedRoute allowedRoles={['admin']}><IncidentList /></ProtectedRoute>} />
            <Route path="/admin/map" element={<ProtectedRoute allowedRoles={['admin']}><AdminMap /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
            <Route path="/admin/broadcast" element={<ProtectedRoute allowedRoles={['admin']}><Broadcast /></ProtectedRoute>} />
            <Route path="/admin/incident/:id" element={<ProtectedRoute allowedRoles={['admin']}><IncidentDetail /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute allowedRoles={['admin']}><Tasks /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><OfficerProfile /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />


          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;