import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  ChevronRight, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIGS } from '../../types/auth';
import { PwaInstallButton } from '../common/PwaInstallButton';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  openAlertsCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const ROUTE_BREADCRUMBS: Record<string, { section: string; title: string }> = {
  '/dashboard': { section: 'Main', title: 'Dashboard' },
  '/network-layout': { section: 'Main', title: 'Network Layout' },
  '/network-topology': { section: 'Main', title: 'Network Topology' },
  '/buildings': { section: 'Infrastructure', title: 'Buildings' },
  '/devices': { section: 'Infrastructure', title: 'Devices' },
  '/cable-routes': { section: 'Infrastructure', title: 'Cable Routes' },
  '/racks': { section: 'Infrastructure', title: 'Racks & Ports' },
  '/monitoring': { section: 'Operations', title: 'Monitoring' },
  '/maintenance': { section: 'Operations', title: 'Maintenance' },
  '/alerts': { section: 'Operations', title: 'Alerts' },
  '/reports': { section: 'Reporting', title: 'Reports' },
  '/settings': { section: 'System', title: 'Settings' },
};

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  openAlertsCount = 2,
  theme = 'light',
  onToggleTheme
}) => {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const breadcrumb = ROUTE_BREADCRUMBS[location.pathname] || {
    section: 'App',
    title: location.pathname.replace('/', '').replace('-', ' ') || 'Home'
  };

  const currentRoleConfig = ROLE_CONFIGS[role];

  return (
    <header className="h-16 bg-white/95 dark:bg-[#0B132B] backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 z-30 shrink-0 select-none text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="w-7 h-7 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 lg:hidden shrink-0 flex items-center justify-center">
          <img src="/logo-48.png?v=3" alt="Network Map Logo" className="w-full h-full object-contain" />
        </div>

        {/* Dynamic Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans">
          <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
            {breadcrumb.section}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden sm:inline-block" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[150px] sm:max-w-none">
            {breadcrumb.title}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="relative flex-1 max-w-xs md:max-w-md hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari gedung, perangkat, rute kabel, IP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-100 dark:bg-[#111A33] border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls: Install Button, Current Site, Notification, Theme, User Profile */}
      <div className="flex items-center gap-3">
        {/* PWA Add to Home Screen Button */}
        <PwaInstallButton />

        {/* Current Site Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111A33] border border-slate-200 dark:border-slate-700/60 text-xs">
          <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[210px]">
            PT. CBA Chemical Industry
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          title={`Beralih ke tema ${theme === 'dark' ? 'terang' : 'gelap'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notification Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer relative"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4" />
            {openAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {openAlertsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Preview */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-2xl p-3 z-50 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-200">Notifikasi</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{openAlertsCount} Baru</span>
              </div>
              <div className="flex flex-col gap-2 py-2">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#111A33] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-0.5">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 text-[11px]">Core FO Putus - Gedung B</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Peringatan degradasi kabel optik jalur B-01.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#111A33] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-0.5">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 text-[11px]">Switch Distribution Overload</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">CPU load SW-A-02 mencapai 85%.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            
            <div className="text-left hidden lg:block">
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block leading-tight truncate max-w-[130px]">
                {user?.fullName || 'Admin IT'}
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block uppercase">
                {currentRoleConfig.label}
              </span>
            </div>
          </button>

          {/* User Profile Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-2xl p-3 z-50 text-xs animate-in fade-in flex flex-col gap-3">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">{user?.fullName}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5 font-mono">{user?.email}</span>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Role: {currentRoleConfig.label}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Keluar (Sign Out)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
