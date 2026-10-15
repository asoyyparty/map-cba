import React from 'react';
import { ActivityItem } from '../../types';
import { INITIAL_ACTIVITIES } from '../../mock/cbaData';
import { Clock, CheckCircle2, Wrench, XCircle, PlusCircle, MoreVertical } from 'lucide-react';

export const ActivityWidget: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'online': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-emerald-400" />;
      case 'offline': return <XCircle className="w-4 h-4 text-rose-400" />;
      default: return <PlusCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-semibold text-slate-800">Aktivitas Terakhir</h3>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {INITIAL_ACTIVITIES.slice(0, 3).map((act) => (
          <div 
            key={act.id}
            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs font-sans"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white border border-slate-200 shrink-0 shadow-2xs">
                {getIcon(act.type)}
              </div>
              <div>
                <h4 className="font-medium text-slate-800 text-xs">{act.title}</h4>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{act.timeAgo}</span>
              </div>
            </div>

            <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
