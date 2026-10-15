import React from 'react';
import { ViewMode } from '../types';
import { 
  Map, 
  GitFork, 
  Server, 
  Network, 
  Zap, 
  Bell, 
  Activity,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  healthyBuildingsCount: number;
  totalBuildingsCount: number;
  openAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  healthyBuildingsCount,
  totalBuildingsCount,
  openAlertsCount,
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'layout', label: 'Layout Pabrik', icon: <Map className="w-4 h-4" /> },
    { id: 'topology', label: 'Topologi Logis', icon: <GitFork className="w-4 h-4" /> },
    { id: 'devices', label: 'Inventaris Perangkat', icon: <Server className="w-4 h-4" /> },
    { id: 'cables', label: 'Jalur Kabel FO/UTP', icon: <Network className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Trace & Impact Analysis', icon: <Zap className="w-4 h-4" /> },
    { 
      id: 'reports', 
      label: 'Monitoring & Ticket', 
      icon: (
        <div className="relative">
          <Bell className="w-4 h-4" />
          {openAlertsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {openAlertsCount}
            </span>
          )}
        </div>
      ) 
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-md shadow-blue-500/10 flex items-center justify-center shrink-0">
          <img src="/logo-96.png?v=3" alt="Network Map Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-lg tracking-wider text-slate-100 font-mono">
              CBA <span className="text-cyan-400">NETWORK MAP</span>
            </h1>
            <span className="bg-cyan-950/80 text-cyan-400 text-xs px-2 py-0.5 rounded border border-cyan-800 font-mono font-semibold">
              v1.0 Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            PT. CBA Chemical Industry — IT Infrastructure & Visualization System
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Gedung Sehat:</span>
          <span className="text-emerald-400 font-bold">{healthyBuildingsCount}/{totalBuildingsCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-slate-300 font-semibold">System Online</span>
        </div>
      </div>
    </header>
  );
};
