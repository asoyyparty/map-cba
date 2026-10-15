import React, { useState } from 'react';
import { 
  Server, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  ArrowUpRight,
  Activity,
  MapPin,
  GitFork,
  Layers,
  HardDrive,
  Wifi,
  Flame,
  Shield,
  Radio,
  RotateCcw
} from 'lucide-react';
import { Device } from '../../types';

interface DeviceDetailSidebarProps {
  selectedDevice: Device | null;
  onClose: () => void;
  onViewOnMap?: (device: Device) => void;
  onTraceConnection?: (device: Device) => void;
  isTracing?: boolean;
}

export const DeviceDetailSidebar: React.FC<DeviceDetailSidebarProps> = ({
  selectedDevice,
  onClose,
  onViewOnMap,
  onTraceConnection,
  isTracing
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'port' | 'koneksi' | 'riwayat'>('info');

  if (!selectedDevice) return null;

  const device = selectedDevice;

  const getNodeIcon = () => {
    switch (device.type) {
      case 'firewall': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'core-switch': return <GitFork className="w-5 h-5 text-cyan-400" />;
      case 'dist-switch': return <Layers className="w-5 h-5 text-blue-400" />;
      case 'access-switch': return <Server className="w-5 h-5 text-indigo-400" />;
      case 'server': return <HardDrive className="w-5 h-5 text-emerald-400" />;
      case 'access-point': return <Wifi className="w-5 h-5 text-amber-400" />;
      default: return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-80 lg:w-96 bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none shadow-xl dark:shadow-2xl z-30 overflow-y-auto font-sans animate-in slide-in-from-right duration-150">
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/90 dark:bg-[#080D1A]/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 font-bold uppercase">
              {device.type}
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {device.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Tutup Detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Device Card Banner */}
          <div className="bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between shadow-xs dark:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                {getNodeIcon()}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{device.name}</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {device.buildingName}
                </span>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs border ${
              device.status === 'online' 
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/80' 
                : 'bg-amber-50 dark:bg-amber-950/90 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/80'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                device.status === 'online' ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'
              }`} />
              {device.status.toUpperCase()}
            </span>
          </div>

          {/* ---------------------------------------------------- */}
          {/* PRIMARY ACTIONS: VIEW ON MAP & TRACE CONNECTION      */}
          {/* ---------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-2">
            {onViewOnMap && (
              <button
                type="button"
                onClick={() => onViewOnMap(device)}
                className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
                title="Pindah ke Network Layout dan fokus ke posisi gedung device ini"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>
            )}

            {onTraceConnection && (
              <button
                type="button"
                onClick={() => onTraceConnection(device)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 border ${
                  isTracing 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30' 
                    : 'bg-slate-100 hover:bg-amber-50 dark:bg-[#131D3B] dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/50'
                }`}
                title="Highlight jalur sinyal ke gateway firewall"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isTracing ? 'Tracing Active' : 'Trace Connection'}</span>
              </button>
            )}
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111A33] p-1 rounded-xl border border-slate-200 dark:border-slate-800/60 text-[11px] font-semibold">
            {(['info', 'port', 'koneksi', 'riwayat'] as const).map((tab) => {
              const labels = {
                info: 'Informasi',
                port: 'Port',
                koneksi: 'Koneksi',
                riwayat: 'Riwayat'
              };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* TAB 1: INFORMASI */}
          {activeTab === 'info' && (
            <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col gap-2.5 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">IP Address</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-300">{device.ip}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">MAC Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{device.mac || '00:2A:10:99:AA:01'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Brand / Vendor</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{device.brand}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Model</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{device.model}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Lokasi Gedung</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{device.buildingName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ruangan Panel</span>
                <span className="font-bold text-slate-800 dark:text-slate-300">{device.room || 'Ruang Panel IT'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Server Rack</span>
                <span className="font-bold text-amber-600 dark:text-amber-300">{device.rackName || 'Rack 42U Unit #1'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Uptime</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{device.uptime || '90 hari 4 jam'}</span>
              </div>
            </div>
          )}

          {/* TAB 2: PORT USAGE */}
          {activeTab === 'port' && (
            <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">Port Terpakai:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {device.activePorts || 16} / {device.totalPorts || 24} Port
                </span>
              </div>

              {/* Visual Port Matrix (Simulated Switch Faceplate) */}
              <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-8 gap-1.5">
                {Array.from({ length: Math.min(device.totalPorts || 24, 24) }).map((_, i) => {
                  const isActive = i < (device.activePorts || 16);
                  return (
                    <div
                      key={i}
                      className={`h-5 rounded flex items-center justify-center text-[8px] font-mono font-bold border transition-all ${
                        isActive 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/80 shadow-xs' 
                          : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-600 border-slate-300 dark:border-slate-800'
                      }`}
                      title={`Port ${i + 1}: ${isActive ? 'Active (Link 1G)' : 'Idle'}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-500 dark:bg-emerald-400" /> Active Link
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-slate-400 dark:bg-slate-700" /> Idle / Down
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: KONEKSI & UPLINK */}
          {activeTab === 'koneksi' && (
            <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Uplink & Downlink Links</h4>
              <div className="flex flex-col gap-1.5 text-xs font-mono">
                {device.parentId && (
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-[#172347]/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">UPSTREAM</span>
                      <span className="text-slate-400 dark:text-slate-500">→</span>
                      <span className="text-slate-800 dark:text-slate-200">{device.parentId}</span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">10 Gbps SFP+</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-[#172347]/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400">LOCAL LAN</span>
                    <span className="text-slate-400 dark:text-slate-500">→</span>
                    <span className="text-slate-800 dark:text-slate-200">{device.buildingName} Clients</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">1 Gbps RJ45</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RIWAYAT / HEALTH */}
          {activeTab === 'riwayat' && (
            <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col gap-2 text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-bold">Riwayat Operasional:</span>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Telemetry Heartbeat OK</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Ping 0.2ms, Packet Loss 0%</span>
                </div>
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold block">Firmware Up-to-Date</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Version 17.6.5 Enterprise Cisco IOS</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
