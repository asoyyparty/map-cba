import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ArrowRight, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { RecentAlertItem, SeverityLevel } from '../../services/dashboardRepository';

interface RecentAlertsCardProps {
  alerts: RecentAlertItem[];
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({ alerts }) => {
  const navigate = useNavigate();

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 uppercase tracking-wider">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 uppercase tracking-wider">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50 uppercase tracking-wider">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  const getStatusIndicator = (status: RecentAlertItem['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'Investigating':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Investigating
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Recent Alerts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active incidents and latency warnings
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/alerts')}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
        >
          <span>Semua Alert</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 my-2">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            onClick={() => navigate('/alerts')}
            className="py-3 hover:bg-slate-50/70 dark:hover:bg-slate-700/40 -mx-3 px-3 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {alert.title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                    <HardDrive className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {alert.asset}
                  </span>
                  <span>•</span>
                  <span>{alert.building}</span>
                </div>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <div>{getStatusIndicator(alert.status)}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono justify-end">
                  <Clock className="w-3 h-3" />
                  <span>{alert.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span>ICMP ping engine polling interval: 30s</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/alerts')}>
          Audit Log →
        </span>
      </div>
    </div>
  );
};
