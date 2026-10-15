import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '../../context/ThemeContext';

export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div className="w-screen h-screen flex bg-slate-50 dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Left Collapsible Sidebar (Full Screen Height) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Right Column: Header + Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <Header
          onToggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Center Content View Area with Outlet */}
        <main className="flex-1 relative overflow-y-auto bg-slate-50 dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
