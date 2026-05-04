import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { Permission } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; permission?: Permission }> = ({ children, permission }) => {
  const { hasPermission } = useAuth();
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Pages
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { LeadsPage } from './pages/Leads';
import { ClientsPage } from './pages/Clients';
import { TeamPage } from './pages/Team';
import { FinancePage } from './pages/Finance';
import { SettingsPage } from './pages/Settings';
import { AdminNotificationTool } from './components/AdminNotificationTool';

export default function App() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-dark-bg font-sans selection:bg-brand-purple/30 text-gray-100 overflow-x-hidden">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-5%] w-[35%] h-[35%] bg-brand-blue/10 blur-[100px] rounded-full" />
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="lg:pl-[220px] flex flex-col min-h-screen relative z-10 font-sans">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<ProtectedRoute permission="view_dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute permission="view_dashboard"><TasksPage /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute permission="manage_leads"><LeadsPage /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute permission="manage_clients"><ClientsPage /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute permission="manage_team"><TeamPage /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute permission="view_finance"><FinancePage /></ProtectedRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <footer className="pt-12 pb-6 mt-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5 text-gray-500 font-medium text-[10px] tracking-widest uppercase">
            <p>© 2026 Nexorith Studio Inc.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Help</a>
              <a href="#" className="hover:text-white transition-colors">Status</a>
            </div>
          </footer>
        </main>
      </div>
      <AdminNotificationTool />
    </div>
  );
}

