import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Map, 
  PlusCircle, 
  Network, 
  Wrench, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface QuickActionsBarProps {
  onOpenAddDevice: () => void;
  onOpenAddCable: () => void;
  onOpenCreateMaintenance: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenAddDevice,
  onOpenAddCable,
  onOpenCreateMaintenance
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-[#0B132B] dark:via-[#111c3a] dark:to-[#162544] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Description */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Aksi Cepat Operasional Jaringan
          </h3>
          <p className="text-xs text-slate-300 dark:text-slate-400">
            Akses langsung visualisasi layout denah pabrik atau daftarkan konfigurasi baru
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
        {/* 1. Open Network Map */}
        <button
          type="button"
          onClick={() => navigate('/network-layout')}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Map className="w-4 h-4 shrink-0" />
          <span className="truncate">Network Map</span>
        </button>

        {/* 2. Add Device */}
        <button
          type="button"
          onClick={onOpenAddDevice}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white border border-white/15 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">Add Device</span>
        </button>

        {/* 3. Add Cable Route */}
        <button
          type="button"
          onClick={onOpenAddCable}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white border border-white/15 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <Network className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">Add Cable</span>
        </button>

        {/* 4. Create Maintenance */}
        <button
          type="button"
          onClick={onOpenCreateMaintenance}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white border border-white/15 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <Wrench className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="truncate">Maintenance</span>
        </button>
      </div>
    </div>
  );
};
