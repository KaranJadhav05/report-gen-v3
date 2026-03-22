import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage       from './pages/LoginPage';
import UserDashboard   from './pages/UserDashboard';
import AdminDashboard  from './pages/AdminDashboard';
import AttendancePage  from './pages/AttendancePage';
import DashboardLayout from './components/ui/DashboardLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading ReportGen…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to={user ? '/attendance' : '/login'} replace />} />
      <Route path="/attendance"      element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/user-dashboard"  element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
