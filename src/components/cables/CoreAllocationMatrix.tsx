import React, { useState } from 'react';
import { CableRoute, FiberCoreAllocation } from '../../types';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Edit3, 
  Activity, 
  Info, 
  ArrowRight,
  Split,
  Maximize2
} from 'lucide-react';

interface CoreAllocationMatrixProps {
  cable: CableRoute;
  onEditCore?: (core: FiberCoreAllocation) => void;
  isReadOnly?: boolean;
}

export const CoreAllocationMatrix: React.FC<CoreAllocationMatrixProps> = ({
  cable,
  onEditCore,
  isReadOnly = false
}) => {
  const [selectedTube, setSelectedTube] = useState<number>(1);
  const [hoveredCore, setHoveredCore] = useState<number | null>(null);

  const cores = cable.coreAllocations || [];
  const totalCores = cable.totalCores || (cores.length > 0 ? cores.length : 12);

  // Group cores into tubes of 12 (TIA-598 standard)
  const tubesCount = Math.max(1, Math.ceil(totalCores / 12));
  const tubeCores = cores.filter(c => (c.tubeNumber || Math.ceil(c.coreNumber / 12)) === selectedTube);

  const connectedCount = cores.filter(c => c.status === 'connected').length;
  const reservedCount = cores.filter(c => c.status === 'reserved').length;
  const damagedCount = cores.filter(c => c.status === 'damaged').length;
  const availableCount = totalCores - connectedCount - reservedCount - damagedCount;

  const validAttenuations = cores.filter(c => typeof c.attenuationDb === 'number' && c.attenuationDb > 0);
  const avgAttenuation = validAttenuations.length > 0
    ? (validAttenuations.reduce((acc, c) => acc + (c.attenuationDb || 0), 0) / validAttenuations.length).toFixed(2)
    : cable.attenuationDb?.toFixed(2) || '0.35';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Aktif
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Layers className="w-3 h-3" /> Reserved
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> Rusak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-600/30">
            Standby
          </span>
        );
    }
  };

  const getAttenuationColor = (db?: number) => {
    if (db === undefined || db === null) return 'text-slate-400';
    if (db <= 0.45) return 'text-emerald-400 font-mono';
    if (db <= 1.0) return 'text-sky-400 font-mono';
    if (db <= 2.5) return 'text-amber-400 font-mono';
    return 'text-rose-400 font-bold font-mono';
  };

  return (
    <div className="space-y-4">
      {/* ODF Cassette Visual Header */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Optical Distribution Frame (ODF) Core Matrix
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  TIA-598-C
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alokasi core kabel fiber optik, standard warna internasional, dan loss optical dB
              </p>
            </div>
          </div>

          {/* Tube Selector (if > 12 cores) */}
          {tubesCount > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 px-2">Tube:</span>
              {Array.from({ length: tubesCount }, (_, i) => i + 1).map(tube => (
                <button
                  key={tube}
                  onClick={() => setSelectedTube(tube)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                    selectedTube === tube
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Tube {tube} ({((tube - 1) * 12) + 1}-{Math.min(tube * 12, totalCores)})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cable KPI Sub-Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Cores</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">{totalCores} C</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Aktif Digunakan</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{connectedCount}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 block">Reserved / Spare</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">{reservedCount}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <span className="text-[11px] text-rose-600 dark:text-rose-400 block">Loss / Rusak</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400">{damagedCount}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <span className="text-[11px] text-sky-600 dark:text-sky-400 block">Rata-rata Redaman</span>
            <span className="text-base font-bold text-sky-600 dark:text-sky-400">{avgAttenuation} dB</span>
          </div>
        </div>

        {/* ODF Tray Visual Strip */}
        <div className="mt-4 p-3 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>Visual Tray ODF (Tube {selectedTube})</span>
            <span className="text-slate-400 dark:text-slate-500">Klik / hover pin core untuk detail</span>
          </div>
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
            {tubeCores.map((core) => {
              const isHovered = hoveredCore === core.coreNumber;
              return (
                <div
                  key={core.coreNumber}
                  onMouseEnter={() => setHoveredCore(core.coreNumber)}
                  onMouseLeave={() => setHoveredCore(null)}
                  onClick={() => !isReadOnly && onEditCore && onEditCore(core)}
                  title={`Core #${core.coreNumber} (${core.colorName}) - ${core.status.toUpperCase()} - ${core.service || 'Standby'}`}
                  className={`relative flex flex-col items-center p-1.5 rounded cursor-pointer transition-all ${
                    isHovered ? 'bg-slate-200 dark:bg-slate-800 scale-105 ring-1 ring-indigo-500 dark:ring-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-900 shadow-inner flex items-center justify-center transition-transform"
                    style={{ backgroundColor: core.colorHex }}
                  >
                    {core.status === 'damaged' && (
                      <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                    #{core.coreNumber}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{
                    backgroundColor: core.status === 'connected' ? '#10b981' :
                                    core.status === 'reserved' ? '#f59e0b' :
                                    core.status === 'damaged' ? '#ef4444' : '#64748b'
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Core Matrix Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 w-16">Core</th>
                <th className="py-3 px-3 w-28">TIA Color</th>
                <th className="py-3 px-3 w-28">Status</th>
                <th className="py-3 px-4">Alokasi Service / Patching</th>
                <th className="py-3 px-4">Endpoint (A ↔ B)</th>
                <th className="py-3 px-3 w-24 text-right">Redaman</th>
                {!isReadOnly && <th className="py-3 px-3 w-20 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {tubeCores.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    Tidak ada data core alokasi pada tube ini.
                  </td>
                </tr>
              ) : (
                tubeCores.map((core) => {
                  const isHovered = hoveredCore === core.coreNumber;
                  return (
                    <tr
                      key={core.coreNumber}
                      onMouseEnter={() => setHoveredCore(core.coreNumber)}
                      onMouseLeave={() => setHoveredCore(null)}
                      className={`transition-colors ${
                        isHovered ? 'bg-slate-100 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Core Number */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                        C-{String(core.coreNumber).padStart(2, '0')}
                      </td>

                      {/* Color with sample dot */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm inline-block flex-shrink-0"
                            style={{ backgroundColor: core.colorHex }}
                          />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{core.colorName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(core.status)}
                      </td>

                      {/* Service / Patching */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {core.service || <span className="text-slate-400 dark:text-slate-500 italic">Belum dialokasikan</span>}
                        </div>
                        {core.notes && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            {core.notes}
                          </div>
                        )}
                      </td>

                      {/* Endpoint (Source -> Target) */}
                      <td className="py-3 px-4">
                        {core.sourceDevice || core.targetDevice ? (
                          <div className="text-xs flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                              {core.sourceDevice || '-'}:{core.sourcePort || 'P'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                              {core.targetDevice || '-'}:{core.targetPort || 'P'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>

                      {/* Optical Attenuation */}
                      <td className="py-3 px-3 text-right">
                        <span className={`text-xs ${getAttenuationColor(core.attenuationDb)}`}>
                          {core.attenuationDb !== undefined && core.attenuationDb !== null
                            ? `${Number(core.attenuationDb).toFixed(2)} dB`
                            : '-'}
                        </span>
                      </td>

                      {/* Action */}
                      {!isReadOnly && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onEditCore && onEditCore(core)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Alokasi Core"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
