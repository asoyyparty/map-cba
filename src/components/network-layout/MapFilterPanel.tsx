import React, { useState } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Server, 
  Network, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';

export type StatusFilterOption = 'all' | 'online' | 'offline' | 'warning' | 'unknown';
export type EntityFilterOption = 'all' | 'buildings' | 'devices' | 'cables';

export interface MapFilters {
  entity: EntityFilterOption;
  status: StatusFilterOption;
}

interface MapFilterPanelProps {
  filters: MapFilters;
  onChangeFilters: (newFilters: MapFilters) => void;
  counts: {
    buildings: number;
    devices: number;
    cables: number;
    online: number;
    offline: number;
    warning: number;
    unknown: number;
  };
}

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  filters,
  onChangeFilters,
  counts
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = filters.entity !== 'all' || filters.status !== 'all';

  const resetFilters = () => {
    onChangeFilters({ entity: 'all', status: 'all' });
  };

  return (
    <div className="relative font-sans text-xs select-none shrink-0">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-2xl border transition-all cursor-pointer shadow-md backdrop-blur-md whitespace-nowrap shrink-0 ${
          hasActiveFilters
            ? 'bg-blue-600 text-white border-blue-400 font-bold'
            : 'bg-white/95 dark:bg-[#0B132B]/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        title="Filter objek di peta"
      >
        <Filter className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden md:inline whitespace-nowrap font-medium">Filter Layer & Status</span>
        <span className="hidden sm:inline md:hidden whitespace-nowrap font-medium">Filter</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse shrink-0"></span>
        )}
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {/* Floating Filter Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xl dark:shadow-2xl z-40 animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Filter Visual Peta
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-mono underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* 1. Entity Filter: Buildings, Devices, Cable Routes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              Entitas
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, entity: 'all' })}
                className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.entity === 'all'
                    ? 'bg-blue-50 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-cyan-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>Semua Entitas</span>
                {filters.entity === 'all' && <Check className="w-3 h-3 text-blue-600 dark:text-cyan-300" />}
              </button>

              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, entity: 'buildings' })}
                className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.entity === 'buildings'
                    ? 'bg-blue-50 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-cyan-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Buildings ({counts.buildings})</span>
                </div>
                {filters.entity === 'buildings' && <Check className="w-3 h-3 text-blue-600 dark:text-cyan-300" />}
              </button>

              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, entity: 'devices' })}
                className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.entity === 'devices'
                    ? 'bg-blue-50 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-cyan-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Devices ({counts.devices})</span>
                </div>
                {filters.entity === 'devices' && <Check className="w-3 h-3 text-blue-600 dark:text-cyan-300" />}
              </button>

              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, entity: 'cables' })}
                className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.entity === 'cables'
                    ? 'bg-blue-50 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-cyan-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Cables ({counts.cables})</span>
                </div>
                {filters.entity === 'cables' && <Check className="w-3 h-3 text-blue-600 dark:text-cyan-300" />}
              </button>
            </div>
          </div>

          {/* 2. Status Filter: Online, Offline, Warning, Unknown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
              Status Operasional
            </label>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: 'all' })}
                className={`px-3 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.status === 'all'
                    ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>Semua Status</span>
                {filters.status === 'all' && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
              </button>

              {/* Online */}
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: 'online' })}
                className={`px-3 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.status === 'online'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Online Normal ({counts.online})</span>
                </div>
                {filters.status === 'online' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>

              {/* Warning */}
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: 'warning' })}
                className={`px-3 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.status === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500 text-amber-800 dark:text-amber-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Warning / Degradasi ({counts.warning})</span>
                </div>
                {filters.status === 'warning' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              </button>

              {/* Offline */}
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: 'offline' })}
                className={`px-3 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.status === 'offline'
                    ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500 text-rose-800 dark:text-rose-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Offline / Down ({counts.offline})</span>
                </div>
                {filters.status === 'offline' && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
              </button>

              {/* Unknown */}
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: 'unknown' })}
                className={`px-3 py-1.5 rounded-xl text-left flex items-center justify-between border transition-colors cursor-pointer ${
                  filters.status === 'unknown'
                    ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-slate-200 font-semibold'
                    : 'bg-slate-50 dark:bg-[#111A33] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Unknown / Standby ({counts.unknown})</span>
                </div>
                {filters.status === 'unknown' && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
