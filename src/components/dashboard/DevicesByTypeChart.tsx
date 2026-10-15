import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Server, Layers } from 'lucide-react';
import { DeviceTypeCount } from '../../services/dashboardRepository';

interface DevicesByTypeChartProps {
  devicesByType: DeviceTypeCount[];
}

export const DevicesByTypeChart: React.FC<DevicesByTypeChartProps> = ({ devicesByType }) => {
  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Infrastructure Summary: Devices by Type
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribution of network hardware assets across CBA industrial plants
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
          8 Kategori
        </span>
      </div>

      {/* Bar Chart Container */}
      <div className="w-full h-56 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={devicesByType}
            margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            barSize={24}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700/60" />
            <XAxis 
              dataKey="type" 
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={{ stroke: '#64748B' }}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'currentColor', opacity: 0.08 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DeviceTypeCount;
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-800">
                      <p className="font-bold text-slate-200 mb-1">{data.type}</p>
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Total Unit:</span>
                          <span className="font-bold text-white">{data.count}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-emerald-400">Online:</span>
                          <span className="font-bold text-emerald-300">{data.online}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-blue-400">Health Rate:</span>
                          <span className="font-bold text-blue-300">{data.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {devicesByType.map((entry, index) => (
                <Cell key={`bar-cell-${index}`} fill={entry.color || '#3B82F6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Quick Summary Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Hardware Backbone: Cisco Catalyst, MikroTik, Ubiquiti, Fortinet</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
          Total: {devicesByType.reduce((acc, c) => acc + c.count, 0)} Units
        </span>
      </div>
    </div>
  );
};
