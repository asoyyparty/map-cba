import React from 'react';
import { Building, Device } from '../../types';
import { 
  Building2, 
  Server, 
  Wifi, 
  Network, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Users
} from 'lucide-react';

interface BuildingTooltipProps {
  building: Building | null;
  position: { x: number; y: number };
  devicesCount?: number;
  onlineCount?: number;
}

export const BuildingTooltip: React.FC<BuildingTooltipProps> = ({
  building,
  position,
  devicesCount,
  onlineCount
}) => {
  if (!building) return null;

  const totalDev = devicesCount ?? building.totalDevices;
  const onlineDev = onlineCount ?? (building.status === 'healthy' ? totalDev : Math.max(0, totalDev - 1));
  const offlineDev = totalDev - onlineDev;

  return (
    <div
      style={{
        left: `${position.x + 16}px`,
        top: `${position.y + 16}px`
      }}
      className="fixed pointer-events-none z-50 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-3.5 shadow-xl dark:shadow-2xl w-60 text-slate-800 dark:text-slate-100 font-sans text-xs animate-in fade-in duration-150"
    >
      {/* Header: Code, Name, Category */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {building.code}
          </span>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{building.name}</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{building.lokasi || building.category}</span>
          </div>
        </div>

        {/* Status indicator */}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
          building.status === 'warning' 
            ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
            : building.status === 'critical'
            ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
        }`}>
          {building.status}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 my-2.5 font-mono text-[11px]">
        <div className="bg-slate-50 dark:bg-[#111A33] p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
            <Server className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            Total Device
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{totalDev} Unit</span>
        </div>

        <div className="bg-slate-50 dark:bg-[#111A33] p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Online / Down
          </span>
          <span className="text-sm font-bold mt-0.5">
            <span className="text-emerald-600 dark:text-emerald-400">{onlineDev}</span>
            <span className="text-slate-400"> / </span>
            <span className={offlineDev > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-400'}>{offlineDev}</span>
          </span>
        </div>
      </div>

      {/* Secondary Specs */}
      <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Main Switch:</span>
          <span className="font-mono text-cyan-700 dark:text-cyan-300 font-semibold">{building.mainSwitch || 'SW-DEFAULT-01'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Backbone Drop:</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">{building.backboneCable || 'FO-001 (12 Core)'}</span>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-center text-cyan-700 dark:text-cyan-400 font-semibold bg-cyan-50 dark:bg-cyan-950/40 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800/40">
        Klik gedung untuk membuka rincian drawer
      </div>
    </div>
  );
};
