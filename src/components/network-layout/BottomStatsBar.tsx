import React from 'react';
import { CableRoute } from '../../types';
import { Server, ArrowRight, Building2, HardDrive, Network } from 'lucide-react';

interface BottomStatsBarProps {
  selectedCable?: CableRoute | null;
  totalGedung: number;
  totalDevices: number;
  totalCables: number;
  onViewCableDetail?: () => void;
}

export const BottomStatsBar: React.FC<BottomStatsBarProps> = ({
  selectedCable,
  totalGedung,
  totalDevices,
  totalCables,
  onViewCableDetail
}) => {
  return (
    <div className="bg-white dark:bg-[#0B132B] border-t border-slate-200 dark:border-slate-800/80 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0 select-none z-20">
      {/* Card 1: Jalur Kabel Terpilih */}
      <div className="bg-slate-50 dark:bg-[#111A33] p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3 shadow-xs dark:shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-[11px] font-mono">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 font-sans">
                {selectedCable?.code || 'FO-001'}
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                ● Active
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] flex flex-col gap-0.5">
              <span>Dari : <strong className="text-slate-700 dark:text-slate-200">{selectedCable?.fromBuildingId === 'bld-kantor-utama' ? 'Kantor Utama' : 'Kantor Utama'}</strong></span>
              <span>Ke : <strong className="text-slate-700 dark:text-slate-200">{selectedCable?.toBuildingId === 'bld-c' ? 'Gedung C' : 'Gedung A'}</strong></span>
              <span>Jenis : <strong className="text-slate-700 dark:text-slate-200">Fiber Optic (12 Core)</strong></span>
              <span>Panjang : <strong className="text-slate-700 dark:text-slate-200">180 Meter</strong></span>
            </div>
          </div>
        </div>

        <button 
          onClick={onViewCableDetail}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[10px] font-semibold flex items-center gap-1 shrink-0 self-end mb-1 cursor-pointer"
        >
          Lihat Detail <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Card 2: Legenda Jalur Kabel */}
      <div className="bg-slate-50 dark:bg-[#111A33] p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between shadow-xs dark:shadow-md text-[11px] font-sans">
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">Legenda Jalur Kabel</span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-cyan-500 dark:bg-cyan-400 rounded"></span> Fiber Optic
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-emerald-500 rounded"></span> UTP
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-amber-500 rounded"></span> Backbone
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-yellow-500 dark:border-yellow-400"></span> Wireless
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-yellow-700 dark:bg-yellow-600 rounded"></span> Backup Link
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-rose-500 rounded"></span> Offline
          </div>
        </div>
      </div>

      {/* Card 3: Status Perangkat */}
      <div className="bg-slate-50 dark:bg-[#111A33] p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between shadow-xs dark:shadow-md text-xs font-mono">
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5 font-sans">Status Perangkat</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Online
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">22</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400"></span> Warning
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Offline
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">1</span>
          </div>
        </div>
      </div>

      {/* Card 4: Informasi Cepat */}
      <div className="bg-slate-50 dark:bg-[#111A33] p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between shadow-xs dark:shadow-md text-xs font-mono">
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5 font-sans">Informasi Cepat</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Total Gedung
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{totalGedung}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Total Perangkat
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{totalDevices}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <Network className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Total Jalur Kabel
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{totalCables}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
