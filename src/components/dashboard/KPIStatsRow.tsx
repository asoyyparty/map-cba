import React from 'react';
import { Building2, Server, Network, Wifi, Globe } from 'lucide-react';

interface KPIStatsRowProps {
  totalGedung: number;
  totalDevices: number;
  totalCables: number;
  networkAvailability: number;
}

export const KPIStatsRow: React.FC<KPIStatsRowProps> = ({
  totalGedung,
  totalDevices,
  totalCables,
  networkAvailability
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 select-none font-sans">
      {/* Card 1: Total Gedung */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-medium">Total Gedung</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 font-mono">{totalGedung}</span>
            <span className="text-[10px] text-slate-500 font-mono">Unit</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Area Kawasan Pabrik</span>
        </div>
        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
          <Building2 className="w-4 h-4" />
        </div>
      </div>

      {/* Card 2: Perangkat Jaringan */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-medium">Perangkat IT</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 font-mono">{totalDevices}</span>
            <span className="text-[10px] text-slate-500 font-mono">Nodes</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono mt-1">100% Terpantau</span>
        </div>
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
          <Server className="w-4 h-4" />
        </div>
      </div>

      {/* Card 3: Jalur Kabel */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-medium">Jalur Kabel</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 font-mono">{totalCables}</span>
            <span className="text-[10px] text-slate-500 font-mono">Rute</span>
          </div>
          <span className="text-[10px] text-cyan-600 font-mono mt-1">FO & Industrial UTP</span>
        </div>
        <div className="p-2.5 bg-cyan-50 border border-cyan-100 rounded-lg text-cyan-600">
          <Network className="w-4 h-4" />
        </div>
      </div>

      {/* Card 4: Network Availability */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-medium">Ketersediaan</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-emerald-600 font-mono">{networkAvailability}%</span>
            <span className="text-[10px] text-slate-500 font-mono">SLA</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Target: ≥ 99.5%</span>
        </div>
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
          <Wifi className="w-4 h-4" />
        </div>
      </div>

      {/* Card 5: Internet Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors col-span-2 md:col-span-1">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-medium">Backbone ISP</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-bold text-slate-900 font-mono">ONLINE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Dual Link Active</span>
        </div>
        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
          <Globe className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
