import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ArrowUpRight } from 'lucide-react';

const data = [
  { time: '08:00', download: 180, upload: 85 },
  { time: '10:00', download: 320, upload: 140 },
  { time: '12:00', download: 280, upload: 120 },
  { time: '14:00', download: 410, upload: 195 },
  { time: '16:00', download: 350, upload: 160 },
  { time: '18:00', download: 210, upload: 95 },
  { time: '20:00', download: 150, upload: 60 },
];

export const BandwidthChart: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm font-sans">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Penggunaan Bandwidth (Recharts)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Total Traffic Backbone (Download & Upload Mbps)
          </p>
        </div>

        <div className="text-right font-mono text-[11px]">
          <span className="text-slate-500">Rata-rata: <strong className="text-slate-800">271 Mbps</strong></span>
          <span className="text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +12%
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="mt-3 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            />
            <Area
              type="monotone"
              dataKey="download"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDownload)"
              name="Download (Mbps)"
            />
            <Area
              type="monotone"
              dataKey="upload"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUpload)"
              name="Upload (Mbps)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Download
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Upload
        </div>
      </div>
    </div>
  );
};
