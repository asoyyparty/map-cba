import React from 'react';
import { Alert } from '../../types';
import { Bell, AlertTriangle, ChevronRight } from 'lucide-react';

interface NotificationWidgetProps {
  alerts: Alert[];
}

export const NotificationWidget: React.FC<NotificationWidgetProps> = ({ alerts }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-semibold text-slate-800">Peringatan Aktif</h3>
          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono border border-rose-200">
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {alerts.slice(0, 3).map((alt) => (
          <div 
            key={alt.id}
            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                alt.severity === 'high' || alt.severity === 'critical'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-medium text-slate-800 truncate">
                  {alt.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {alt.timeAgo || alt.timestamp}
                </span>
              </div>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
};
