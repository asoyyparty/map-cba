import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Server } from 'lucide-react';

const data = [
  { name: 'Online', value: 22, color: '#10b981' },
  { name: 'Warning', value: 2, color: '#f59e0b' },
  { name: 'Offline', value: 1, color: '#ef4444' },
];

export const StatusDonutChart: React.FC = () => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const onlineCount = data.find(d => d.name === 'Online')?.value || 0;
  const percentage = Math.round((onlineCount / total) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          Status Perangkat (Recharts)
        </h3>
        <span className="text-[10px] font-mono text-slate-500">Total: {total} Units</span>
      </div>

      <div className="flex items-center justify-between gap-4 my-auto pt-2">
        {/* Recharts Pie Donut */}
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={48}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base font-bold text-slate-800 font-mono">{percentage}%</span>
            <span className="text-[9px] text-slate-500 uppercase font-semibold">Online</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex flex-col gap-2 flex-1 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Online
            </span>
            <span className="font-semibold text-slate-900">22</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning
            </span>
            <span className="font-semibold text-slate-900">2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Offline
            </span>
            <span className="font-semibold text-slate-900">1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
