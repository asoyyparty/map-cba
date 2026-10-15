import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Server, 
  CheckCircle2, 
  AlertOctagon, 
  GitFork, 
  Bell, 
  Wrench, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { StatCardData } from '../../services/dashboardRepository';

interface StatCardsGridProps {
  stats: StatCardData[];
}

export const StatCardsGrid: React.FC<StatCardsGridProps> = ({ stats }) => {
  const navigate = useNavigate();

  const getCardIcon = (category: StatCardData['category'], id: string) => {
    switch (id) {
      case 'total-buildings':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'total-devices':
        return <Server className="w-5 h-5 text-indigo-600" />;
      case 'online-devices':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'offline-devices':
        return <AlertOctagon className="w-5 h-5 text-rose-600" />;
      case 'cable-routes':
        return <GitFork className="w-5 h-5 text-cyan-600" />;
      case 'active-alerts':
        return <Bell className="w-5 h-5 text-amber-600" />;
      case 'open-maintenance':
        return <Wrench className="w-5 h-5 text-violet-600" />;
      case 'network-availability':
        return <Activity className="w-5 h-5 text-teal-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = (id: string) => {
    switch (id) {
      case 'total-buildings':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/40 text-blue-600 dark:text-blue-400';
      case 'total-devices':
        return 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400';
      case 'online-devices':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400';
      case 'offline-devices':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-800/40 text-rose-600 dark:text-rose-400';
      case 'cable-routes':
        return 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400';
      case 'active-alerts':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800/40 text-amber-600 dark:text-amber-400';
      case 'open-maintenance':
        return 'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800/40 text-violet-600 dark:text-violet-400';
      case 'network-availability':
        return 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-800/40 text-teal-600 dark:text-teal-400';
      default:
        return 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {stats.map((stat) => (
        <div
          key={stat.id}
          onClick={() => stat.path && navigate(stat.path)}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0"
        >
          {/* Header Row: Label & Icon */}
          <div className="flex items-start justify-between gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors truncate">
              {stat.label}
            </span>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${getIconBg(stat.id)}`}>
              {getCardIcon(stat.category, stat.id)}
            </div>
          </div>

          {/* Value Row */}
          <div className="my-1.5 sm:my-2 flex items-baseline justify-between min-w-0">
            <span className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono truncate">
              {stat.value}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 ml-1" />
          </div>

          {/* Footer Trend Row */}
          <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] sm:text-[11px] min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
              {stat.trend}
            </span>
            {stat.id === 'network-availability' ? (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded shrink-0 ml-1">
                SLA OK
              </span>
            ) : stat.id === 'offline-devices' ? (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1 py-0.5 rounded shrink-0 ml-1">
                Alert
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};
