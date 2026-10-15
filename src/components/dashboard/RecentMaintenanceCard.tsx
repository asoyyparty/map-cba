import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  ArrowRight, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { RecentMaintenanceItem, MaintenanceStatus } from '../../services/dashboardRepository';

interface RecentMaintenanceCardProps {
  maintenance: RecentMaintenanceItem[];
}

export const RecentMaintenanceCard: React.FC<RecentMaintenanceCardProps> = ({ maintenance }) => {
  const navigate = useNavigate();

  const getPriorityBadge = (priority: RecentMaintenanceItem['priority']) => {
    switch (priority) {
      case 'High':
        return <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 px-1.5 py-0.5 rounded">HIGH</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.5 rounded">MED</span>;
      case 'Low':
        return <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">LOW</span>;
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
      case 'Pending Parts':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
            <AlertCircle className="w-3 h-3" />
            Pending Parts
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            Completed
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
            <Wrench className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            Recent Maintenance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Technician work orders and preventive servicing
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/maintenance')}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
        >
          <span>Semua Tiket</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Maintenance List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 my-2">
        {maintenance.map((item) => (
          <div 
            key={item.id}
            onClick={() => navigate('/maintenance')}
            className="py-3 hover:bg-slate-50/70 dark:hover:bg-slate-700/40 -mx-3 px-3 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
                    {item.ticket}
                  </span>
                  {getPriorityBadge(item.priority)}
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.asset}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.building}</span>
                  <span>•</span>
                  <div className="inline-flex items-center gap-1">
                    {item.assignedAvatar ? (
                      <img 
                        src={item.assignedAvatar} 
                        alt={item.assignedTo} 
                        className="w-4 h-4 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.assignedTo}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <div>{getStatusBadge(item.status)}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono justify-end">
                  <Calendar className="w-3 h-3" />
                  <span>Due: {item.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span>Preventive cycle: Bi-weekly inspections</span>
        <span className="text-violet-600 dark:text-violet-400 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/maintenance')}>
          Kelola Jadwal →
        </span>
      </div>
    </div>
  );
};
