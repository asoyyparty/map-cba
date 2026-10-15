import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronLeft, 
  ChevronRight,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIGS } from '../../types/auth';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title: string;
  items: {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredRole?: string;
  }[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/network-layout', label: 'Network Layout', icon: Map },
      { path: '/network-topology', label: 'Network Topology', icon: GitFork },
    ]
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { path: '/buildings', label: 'Buildings', icon: Building2 },
      { path: '/devices', label: 'Devices', icon: Server },
      { path: '/cable-routes', label: 'Cable Routes', icon: Network },
      { path: '/racks', label: 'Racks & Ports', icon: HardDrive },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { path: '/monitoring', label: 'Monitoring', icon: Activity },
      { path: '/maintenance', label: 'Maintenance', icon: Wrench },
      { path: '/alerts', label: 'Alerts', icon: Bell },
    ]
  },
  {
    title: 'REPORTING',
    items: [
      { path: '/reports', label: 'Reports', icon: FileText },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { role, user, signOut } = useAuth();
  const roleConfig = ROLE_CONFIGS[role];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 h-full z-50 bg-white dark:bg-[#0B132B] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        {isCollapsed ? (
          <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center relative px-2 shrink-0">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 text-white font-black text-xs tracking-wider flex items-center justify-center shadow-xs cursor-pointer transition-all hover:scale-105 group relative overflow-hidden p-1"
              title="CBA Network Map (Klik untuk memperluas sidebar)"
            >
              <img src="/logo-96.png?v=3" alt="Network Map Logo" className="w-full h-full object-contain group-hover:opacity-20 transition-opacity" />
              <ChevronRight className="w-5 h-5 text-blue-600 dark:text-cyan-400 absolute hidden group-hover:block transition-all" />
            </button>
            {/* Edge floating toggle button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:scale-110 transition-all z-30 cursor-pointer"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xs shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
                <img src="/logo-96.png?v=3" alt="Network Map Logo" className="w-full h-full object-contain" />
              </div>
              <div className="truncate">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block leading-tight tracking-tight truncate">
                  CBA Network Map
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                  Enterprise IT System
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white items-center justify-center transition-colors cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-700/50"
              title="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Menu Groups */}
        <div className={`flex-1 overflow-y-auto py-4 flex flex-col gap-6 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!isCollapsed ? (
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-3 mb-1">
                  {section.title}
                </span>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800/80 w-8 mx-auto my-1" />
              )}

              {section.items.map((item) => {
                const IconComponent = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobileOpen) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 rounded-xl text-xs font-medium transition-all group cursor-pointer relative
                      ${isCollapsed ? 'justify-center w-10 h-10 mx-auto !p-0' : 'px-3 py-2'}
                      ${isActive 
                        ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive 
                            ? 'text-white' 
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        }`} />
                        
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Active User & Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/60">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                  {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="truncate">
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                    {user?.fullName || 'User'}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block truncate">
                    {roleConfig.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="Keluar (Sign Out)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={signOut}
              className="w-10 h-10 mx-auto rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors" 
              title={`Keluar (${user?.fullName || roleConfig.label})`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
