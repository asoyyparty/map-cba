import React, { useState } from 'react';
import { CableRoute, Building } from '../types';
import { 
  Network, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Search, 
  Filter, 
  Layers, 
  Eye, 
  Plus,
  ArrowRight,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { CableDrawer } from './cables/CableDrawer';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';

interface CableManagerProps {
  cableRoutes: CableRoute[];
  buildings: Building[];
  onNavigateView?: (view: any) => void;
}

export const CableManager: React.FC<CableManagerProps> = ({ 
  cableRoutes, 
  buildings,
  onNavigateView 
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [activeCable, setActiveCable] = useState<CableRoute | null>(null);

  const getBuildingName = (id: string, fallback?: string) => {
    return buildings.find(b => b.id === id)?.name || fallback || id;
  };

  const filteredCables = cableRoutes.filter(cable => {
    const fromName = getBuildingName(cable.fromBuildingId, cable.fromBuildingName);
    const toName = getBuildingName(cable.toBuildingId, cable.toBuildingName);

    const matchesSearch = 
      cable.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || cable.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || cable.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-hidden flex flex-col gap-6 font-sans text-slate-900">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              MANAJEMEN JALUR KABEL FO & UTP
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              {filteredCables.length} / {cableRoutes.length} Rute
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Pemetaan kabel serat optik backbone, UTP industrial, kapasitas core, dan redaman dB.
          </p>
        </div>

        {/* Filter Inputs & View Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto font-sans">
          {/* Search */}
          <div className="relative flex-1 lg:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode, rute, gedung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
          >
            <option value="all">Semua Tipe</option>
            <option value="fiber">Fiber Optic</option>
            <option value="utp">UTP Cat6</option>
            <option value="backbone">Backbone Core</option>
            <option value="wireless">Wireless</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="normal">Normal</option>
            <option value="degraded">Degraded</option>
          </select>

          {/* View Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'} transition-colors cursor-pointer`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'} transition-colors cursor-pointer`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area + Drawer */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Table / Cards View */}
        <div className="flex-1 bg-white border border-slate-200 shadow-xs rounded-xl overflow-y-auto">
          {filteredCables.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Tidak Ada Rute Kabel yang Sesuai"
                description={`Tidak ditemukan rute kabel dengan kata kunci "${searchTerm}" atau filter yang dipilih.`}
                actionLabel="Reset Pencarian"
                onAction={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                }}
              />
            </div>
          ) : viewMode === 'table' ? (
            <table className="w-full text-left text-xs font-mono enterprise-table">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] z-10">
                <tr>
                  <th className="px-4 py-3">KODE RUTE</th>
                  <th className="px-3 py-3">NAMA JALUR</th>
                  <th className="px-3 py-3">TIPE</th>
                  <th className="px-3 py-3">DARI GEDUNG</th>
                  <th className="px-3 py-3">KE GEDUNG</th>
                  <th className="px-3 py-3">CORE / KAPASITAS</th>
                  <th className="px-3 py-3">PANJANG</th>
                  <th className="px-3 py-3">STATUS</th>
                  <th className="px-3 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCables.map((c) => {
                  const usagePercent = Math.round(((c.usedCores || 6) / (c.totalCores || 12)) * 100);
                  const isSelected = activeCable?.id === c.id;

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setActiveCable(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 border-l-2 border-blue-600' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-bold text-blue-600">{c.code}</td>
                      <td className="px-3 py-2.5 text-slate-800 font-sans text-xs">{c.name}</td>
                      <td className="px-3 py-2.5">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 uppercase">
                          {c.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 font-sans text-xs">{getBuildingName(c.fromBuildingId, c.fromBuildingName)}</td>
                      <td className="px-3 py-2.5 text-slate-700 font-sans text-xs">{getBuildingName(c.toBuildingId, c.toBuildingName)}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-800">{c.usedCores || 6} / {c.totalCores || 12} Core</span>
                        <span className="text-slate-500 text-[10px] block font-mono">({usagePercent}%)</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-mono text-xs">{c.lengthMeters || 120} m</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCable(c);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3 h-3 text-blue-600" /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              {filteredCables.map(cable => {
                const usagePercent = Math.round(((cable.usedCores || 6) / (cable.totalCores || 12)) * 100);
                const isSelected = activeCable?.id === cable.id;

                return (
                  <div 
                    key={cable.id}
                    onClick={() => setActiveCable(cable)}
                    className={`bg-white border rounded-xl p-3.5 flex flex-col gap-3 cursor-pointer transition-all shadow-xs ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 uppercase">
                          {cable.type}
                        </span>
                        <h3 className="font-bold text-xs text-blue-600 mt-1 font-mono">{cable.code}</h3>
                        <p className="text-xs text-slate-800 font-sans truncate">{cable.name}</p>
                      </div>

                      <StatusBadge status={cable.status} size="sm" />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between font-sans">
                      <div className="truncate">
                        <span className="text-slate-500 text-[9px] block uppercase font-mono">DARI</span>
                        <span className="text-slate-800 font-medium text-xs truncate block">{getBuildingName(cable.fromBuildingId, cable.fromBuildingName)}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mx-2" />
                      <div className="text-right truncate">
                        <span className="text-slate-500 text-[9px] block uppercase font-mono">KE</span>
                        <span className="text-slate-800 font-medium text-xs truncate block">{getBuildingName(cable.toBuildingId, cable.toBuildingName)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-500 text-[10px]">Kapasitas Core:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{cable.usedCores || 6} / {cable.totalCores || 12} ({usagePercent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-blue-600 transition-all rounded-full"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cable Detail Drawer */}
        {activeCable && (
          <CableDrawer
            cable={activeCable}
            buildings={buildings}
            theme="light"
            onClose={() => setActiveCable(null)}
            onTraceRoute={() => {
              if (onNavigateView) onNavigateView('monitoring');
            }}
          />
        )}
      </div>
    </div>
  );
};
