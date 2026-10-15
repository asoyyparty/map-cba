import React from 'react';
import { Building2, Server, Network, Globe, ArrowUp, ArrowDown } from 'lucide-react';

export const TopologyBottomBar: React.FC = () => {
  const connectedDevices = [
    { id: 'SW-KU-01', name: 'Core Switch', type: 'Switch', location: 'Kantor Utama', status: 'Online' },
    { id: 'SW-A-01', name: 'Distribution A', type: 'Switch', location: 'Gedung A', status: 'Online' },
    { id: 'SW-B-01', name: 'Distribution B', type: 'Switch', location: 'Gedung B', status: 'Online' },
    { id: 'SW-C-01', name: 'Distribution C', type: 'Switch', location: 'Gedung C', status: 'Warning' },
    { id: 'SW-D-01', name: 'Distribution D', type: 'Switch', location: 'Gedung D', status: 'Online' },
  ];

  return (
    <div className="bg-white dark:bg-[#0B132B] border-t border-slate-200 dark:border-slate-800/80 p-3.5 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3.5 shrink-0 select-none z-20 font-sans shadow-xs dark:shadow-none">
      {/* Card 1: Ringkasan Topologi */}
      <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between shadow-xs dark:shadow-md">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Ringkasan Topologi</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-xl text-blue-600 dark:text-blue-400 mb-1">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">10</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">Gedung</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-600 dark:text-emerald-400 mb-1">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">24</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">Perangkat Jaringan</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 rounded-xl text-purple-600 dark:text-purple-400 mb-1">
              <Network className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">18</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">Jalur Kabel</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 rounded-xl text-cyan-600 dark:text-cyan-400 mb-1">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">1</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">Internet</span>
          </div>
        </div>
      </div>

      {/* Card 2: Daftar Perangkat Terhubung (Spans 2 columns on xl) */}
      <div className="xl:col-span-2 bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between shadow-xs dark:shadow-md overflow-x-auto">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Daftar Perangkat Terhubung</h4>
        <table className="w-full text-left text-[11px] font-mono">
          <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 pb-1 text-[10px]">
            <tr>
              <th className="pb-1 font-semibold">ID</th>
              <th className="pb-1 font-semibold">Nama Perangkat</th>
              <th className="pb-1 font-semibold">Tipe</th>
              <th className="pb-1 font-semibold">Lokasi</th>
              <th className="pb-1 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
            {connectedDevices.map((d) => (
              <tr key={d.id} className="hover:bg-slate-100/80 dark:hover:bg-[#172347]/40 transition-colors">
                <td className="py-1 font-bold text-blue-600 dark:text-blue-400">{d.id}</td>
                <td className="py-1 text-slate-900 dark:text-slate-200">{d.name}</td>
                <td className="py-1 text-slate-500 dark:text-slate-400">{d.type}</td>
                <td className="py-1 text-slate-600 dark:text-slate-300">{d.location}</td>
                <td className="py-1">
                  <span className={`inline-flex items-center gap-1 font-sans text-[10px] font-bold ${
                    d.status === 'Online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      d.status === 'Online' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'
                    }`} />
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card 3: Traffic Network */}
      <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between shadow-xs dark:shadow-md">
        <div className="flex items-start justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Traffic Network</h4>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold">
              <ArrowUp className="w-3 h-3" /> 320 Mbps
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <ArrowDown className="w-3 h-3" /> 280 Mbps
            </span>
          </div>
        </div>

        {/* Dual Area Wave Chart */}
        <div className="h-16 w-full mt-2 relative">
          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cyanWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="blueWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Path 1: Cyan Wave */}
            <path
              d="M 0 45 Q 35 15, 70 35 T 140 20 T 200 40 L 200 60 L 0 60 Z"
              fill="url(#cyanWave)"
            />
            <path
              d="M 0 45 Q 35 15, 70 35 T 140 20 T 200 40"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />

            {/* Path 2: Blue Wave */}
            <path
              d="M 0 52 Q 35 25, 70 45 T 140 30 T 200 48 L 200 60 L 0 60 Z"
              fill="url(#blueWave)"
            />
            <path
              d="M 0 52 Q 35 25, 70 45 T 140 30 T 200 48"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
          <span className="flex items-center gap-1 text-cyan-400">● Upload</span>
          <span className="flex items-center gap-1 text-blue-400">● Download</span>
        </div>
      </div>
    </div>
  );
};
