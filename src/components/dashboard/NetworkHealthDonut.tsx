import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { ShieldCheck, Activity } from 'lucide-react';
import { NetworkHealthSummary } from '../../services/dashboardRepository';

interface NetworkHealthDonutProps {
  health: NetworkHealthSummary;
}

const COLORS = {
  Online: '#10B981', // Emerald
  Warning: '#F59E0B', // Amber
  Offline: '#EF4444', // Red
  Unknown: '#94A3B8'  // Slate Gray
};

export const NetworkHealthDonut: React.FC<NetworkHealthDonutProps> = ({ health }) => {
  const data = [
    { name: 'Online', value: health.online, color: COLORS.Online },
    { name: 'Warning', value: health.warning, color: COLORS.Warning },
    { name: 'Offline', value: health.offline, color: COLORS.Offline },
    { name: 'Unknown', value: health.unknown, color: COLORS.Unknown }
  ];

  const total = health.total || data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Network Health Overview
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time status breakdown across all factory nodes
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          {health.availabilityRate}% Uptime
        </span>
      </div>

      {/* Donut Chart Container with Center Summary */}
      <div className="relative w-full h-52 flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  const percent = ((Number(item.value) / total) * 100).toFixed(1);
                  return (
                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color }}></span>
                        <span className="font-semibold">{item.name}:</span>
                        <span className="font-mono font-bold">{item.value} node</span>
                        <span className="text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Metric */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Node
          </span>
        </div>
      </div>

      {/* Legend & Breakdown Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
        {data.map((item) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={item.name} className="flex flex-col p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{item.value}</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
