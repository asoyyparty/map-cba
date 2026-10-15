import React, { useState } from 'react';
import { CableRoute, Building } from '../../types';
import { 
  Network, 
  X, 
  Activity, 
  FileText, 
  PenTool, 
  Trash2,
  Palette,
  Sliders
} from 'lucide-react';

import { StatusBadge } from '../common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

interface CableDrawerProps {
  cable: CableRoute | null;
  buildings: Building[];
  theme?: 'light' | 'dark';
  onClose: () => void;
  onTraceRoute?: (cable: CableRoute) => void;
  onEditRoute?: (cable: CableRoute) => void;
  onDeleteRoute?: (cable: CableRoute) => void;
}

export const CableDrawer: React.FC<CableDrawerProps> = ({
  cable,
  buildings,
  theme: propTheme,
  onClose,
  onTraceRoute,
  onEditRoute,
  onDeleteRoute
}) => {
  const { theme: ctxTheme } = useTheme();
  const effectiveTheme = propTheme || ctxTheme;
  const isLight = effectiveTheme === 'light';
  const [activeTab, setActiveTab] = useState<'overview' | 'physical' | 'connections' | 'maintenance' | 'documents'>('overview');

  if (!cable) return null;

  const fromBld = buildings.find(b => b.id === cable.fromBuildingId)?.name || cable.fromBuildingName || 'Ruang Server';
  const toBld = buildings.find(b => b.id === cable.toBuildingId)?.name || cable.toBuildingName || 'Gedung Tujuan';

  const usagePercent = Math.round(((cable.usedCores || 6) / (cable.totalCores || 12)) * 100);
  const cableColor = cable.color || (
    cable.type === 'backbone' ? '#f97316' : 
    cable.type === 'fiber' ? '#06b6d4' : 
    cable.type === 'utp' ? '#10b981' : '#eab308'
  );

  return (
    <div className="w-full sm:w-84 md:w-96 max-w-full h-full max-h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-800 dark:text-slate-100 flex flex-col justify-between shrink-0 select-none shadow-2xl z-40 overflow-hidden font-sans animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#080D1A]/95 backdrop-blur-md shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            className="p-2 rounded-xl border shadow-xs shrink-0"
            style={{ 
              backgroundColor: `${cableColor}15`, 
              borderColor: `${cableColor}40`,
              color: cableColor
            }}
          >
            <Network className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs font-mono text-slate-900 dark:text-slate-100 truncate">{cable.code}</h3>
              <span 
                className="w-2 h-2 rounded-full inline-block shrink-0"
                style={{ backgroundColor: cableColor }}
                title={`Warna Rute: ${cableColor}`}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">{cable.name}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
          title="Tutup (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {/* Status Banner */}
        <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-[#111A33]">
          <div className="flex items-center gap-2">
            <StatusBadge status={cable.status} size="sm" />
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-cyan-800/80">
            {cable.bandwidth || '10 Gbps'}
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#111A33] text-[10px] font-medium">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'physical', label: 'Fisik' },
            { id: 'connections', label: 'Koneksi' },
            { id: 'maintenance', label: 'Perawatan' },
            { id: 'documents', label: 'Docs' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1 px-1.5 rounded-lg transition-colors text-center cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white font-semibold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111A33] flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tipe Kabel</span> 
                <span className="font-bold text-slate-800 dark:text-slate-200">{cable.type === 'fiber' ? 'Fiber Optic' : cable.type === 'backbone' ? 'Backbone 40G' : cable.type === 'utp' ? 'UTP Cat6' : 'Wireless P2P'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gedung Asal</span> 
                <span className="font-bold text-blue-600 dark:text-cyan-400">{fromBld}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gedung Tujuan</span> 
                <span className="font-bold text-blue-600 dark:text-cyan-400">{toBld}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Panjang Rute</span> 
                <span className="font-bold text-slate-800 dark:text-slate-200">{cable.lengthMeters || 120} meter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Jumlah Titik SVG</span> 
                <span className="font-bold text-slate-800 dark:text-slate-200">{cable.path?.length || 0} titik</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Warna Rute</span> 
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs" style={{ backgroundColor: cableColor }} />
                  <span className="font-mono text-[10px]">{cableColor}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ketebalan Garis</span> 
                <span className="font-bold text-slate-800 dark:text-slate-200">{cable.lineWidth || (cable.type === 'backbone' ? 3.5 : 2.5)} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Redaman Optik</span> 
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{cable.attenuationDb || 0.45} dB</span>
              </div>
            </div>

            {/* Core Usage Progress */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111A33] flex flex-col gap-2">
              <div className="flex justify-between text-[11px]">
                <span className="font-sans font-semibold text-slate-600 dark:text-slate-400">Kapasitas Core Serat</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{cable.usedCores || 6} / {cable.totalCores || 12} Core ({usagePercent}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden border bg-slate-200 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="bg-blue-600 dark:bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${usagePercent}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Physical Route */}
        {activeTab === 'physical' && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111A33] flex flex-col gap-2 text-xs">
            <span className="text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-400">Koordinat Titik Jalur (SVG):</span>
            <div className="flex flex-col gap-1.5 font-mono text-[10px] max-h-48 overflow-y-auto pr-1 text-slate-700 dark:text-slate-300">
              {cable.path && cable.path.length > 0 ? (
                cable.path.map((pt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded border bg-white dark:bg-[#080D1A] border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-cyan-400 font-bold">P{idx + 1}</span>
                    <span className="text-slate-500 dark:text-slate-400">X: {pt.x}, Y: {pt.y}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500">Tidak ada koordinat tersimpan.</span>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Connections */}
        {activeTab === 'connections' && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111A33] flex flex-col gap-2 text-xs">
            <span className="text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-400">Alokasi Pair Core:</span>
            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Core 1 - 2 (Tx/Rx)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Uplink Utama (10 Gbps)</span>
              </div>
              <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Core 3 - 4 (Tx/Rx)</span>
                <span className="text-blue-600 dark:text-cyan-400 font-bold">● CCTV & IP-Camera Trunk</span>
              </div>
              <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Core 5 - 6 (Tx/Rx)</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">● Hot Standby Backup</span>
              </div>
              <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] flex justify-between text-slate-500">
                <span>Core 7 - 12</span>
                <span>Dark Fiber (Available)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Maintenance */}
        {activeTab === 'maintenance' && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111A33] flex flex-col gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Riwayat Inspeksi & OTDR:</span>
            <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] text-[10px] font-mono">
              <span className="text-blue-600 dark:text-cyan-400 block font-bold">12 Jan 2026 - Uji OTDR Berkala</span>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">Seluruh core dinyatakan lulus uji redaman dengan rata-rata 0.35 dB/km.</p>
            </div>
          </div>
        )}

        {/* Tab 5: Documents */}
        {activeTab === 'documents' && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111A33] flex flex-col gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Lampiran Dokumen:</span>
            <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D1A] text-[10px] font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" /> as-built-drawing-FO.pdf</span>
              <span className="text-slate-500">2.4 MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Action Buttons Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#080D1A]/95 shrink-0 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {onEditRoute && (
            <button
              type="button"
              onClick={() => onEditRoute(cable)}
              className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" /> Edit Rute
            </button>
          )}

          {onDeleteRoute && (
            <button
              type="button"
              onClick={() => onDeleteRoute(cable)}
              className="py-2.5 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 dark:bg-rose-600/20 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-500/50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Rute
            </button>
          )}
        </div>

        {onTraceRoute && (
          <button
            type="button"
            onClick={() => onTraceRoute(cable)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Activity className="w-4 h-4" /> Trace Jalur di Monitoring
          </button>
        )}
      </div>
    </div>
  );
};
