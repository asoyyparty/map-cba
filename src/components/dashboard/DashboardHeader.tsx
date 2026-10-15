import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown,
  Clock,
  Sparkles
} from 'lucide-react';

interface DashboardHeaderProps {
  currentSite: string;
  onSiteChange: (site: string) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  lastUpdated: string;
}

const AVAILABLE_SITES = [
  { id: 'cba-plant-cikande', name: 'PT. CBA Chemical Industry - Main Plant Cikande', location: 'Serang, Banten' },
  { id: 'cba-plant-merak', name: 'PT. CBA Chemical Industry - Terminal Merak', location: 'Cilegon, Banten' },
  { id: 'cba-logistics-subang', name: 'PT. CBA Logistics Hub Subang', location: 'Subang, Jawa Barat' }
];

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentSite,
  onSiteChange,
  onRefresh,
  isRefreshing,
  lastUpdated
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB'
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Network Infrastructure Dashboard
          </h1>
          <span 
            title={`Telemetri Real-Time aktif • Pembaruan terakhir: ${lastUpdated || 'Baru saja'}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs cursor-default select-none"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE</span>
          </span>
        </div>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Overview of IT infrastructure and network health.
        </p>
      </div>

      {/* Controls: Date/Time, Site Selector, Refresh Button */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
        {/* Live Date/Time Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs shadow-xs font-mono max-w-full overflow-hidden">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate">{currentDate}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-white shrink-0">{currentTime}</span>
        </div>

        {/* Site Selector Dropdown */}
        <div className="relative flex-1 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsSiteMenuOpen(!isSiteMenuOpen)}
            className="w-full flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[210px]">
              {currentSite}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isSiteMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Pilih Kawasan Pabrik
              </div>
              {AVAILABLE_SITES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSiteChange(s.name);
                    setIsSiteMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                    currentSite.includes(s.location) || currentSite === s.name
                      ? 'bg-blue-50/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-medium leading-tight">{s.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.location}</p>
                  </div>
                  {(currentSite.includes(s.location) || currentSite === s.name) && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title={`Terakhir diperbarui: ${lastUpdated}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
};
