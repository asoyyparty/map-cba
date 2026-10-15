import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  GitFork, 
  Building2, 
  Server, 
  Network, 
  HardDrive, 
  Activity, 
  Wrench, 
  Bell, 
  FileText, 
  Settings,
  Loader2
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './components/auth/LoginPage';
import { RoutePlaceholder } from './components/common/RoutePlaceholder';
import { NetworkInfrastructureDashboard } from './components/dashboard/NetworkInfrastructureDashboard';
import { InteractiveFactoryLayoutPage } from './components/network-layout/InteractiveFactoryLayoutPage';
import { DevicesPage } from './components/devices/DevicesPage';
import { NetworkTopologyPage } from './components/topology/NetworkTopologyPage';
import { NetworkMonitoringPage } from './components/monitoring/NetworkMonitoringPage';
import { MaintenancePage } from './components/maintenance/MaintenancePage';
import { RacksPage } from './components/racks/RacksPage';
import { CableRoutesPage } from './components/cables/CableRoutesPage';
import { BuildingsPage } from './components/buildings/BuildingsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AlertsPage } from './components/alerts/AlertsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#050811] text-slate-100 font-sans gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono tracking-wider">
          Memuat CBA Network Map...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Login Route Guard: redirect to /dashboard if already logged in
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC AUTH ROUTES */}
            <Route 
              path="/login" 
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              } 
            />

            {/* PROTECTED WORKSPACE ROUTES */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* MAIN */}
              <Route path="dashboard" element={<NetworkInfrastructureDashboard />} />
              <Route path="network-layout" element={<InteractiveFactoryLayoutPage />} />
              <Route path="network-topology" element={<NetworkTopologyPage />} />

              {/* INFRASTRUCTURE */}
              <Route path="buildings" element={<BuildingsPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="cable-routes" element={<CableRoutesPage />} />
              <Route path="racks" element={<RacksPage />} />

              {/* OPERATIONS */}
              <Route path="monitoring" element={<NetworkMonitoringPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="alerts" element={<AlertsPage />} />

              {/* REPORTING */}
              <Route path="reports" element={<ReportsPage />} />

              {/* SYSTEM */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all Wildcard Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
