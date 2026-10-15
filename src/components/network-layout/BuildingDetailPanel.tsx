import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Device, CableRoute, Alert, Rack } from '../../types';
import { 
  Building2, 
  X, 
  MapPin, 
  Crosshair, 
  Server, 
  Wifi, 
  Network, 
  Users, 
  GitFork, 
  ExternalLink, 
  Activity, 
  Wrench, 
  FileText, 
  Plus, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Thermometer, 
  Layers, 
  ArrowRight, 
  Download, 
  Clock, 
  Calendar, 
  Eye, 
  HardDrive, 
  FileCheck,
  Check,
  Trash2,
  PenTool
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export type BuildingDetailTab = 
  | 'overview' 
  | 'devices' 
  | 'cables' 
  | 'racks' 
  | 'network' 
  | 'maintenance' 
  | 'documents';

interface BuildingDetailPanelProps {
  building: Building | null;
  devices?: Device[];
  cables?: CableRoute[];
  alerts?: Alert[];
  racks?: Rack[];
  isLoading?: boolean;
  onClose: () => void;
  onViewCableRoute?: (cable: CableRoute) => void;
  onViewTopology?: (building: Building) => void;
  onViewDevices?: (building: Building) => void;
  onTraceConnection?: (building: Building) => void;
  onAddDevice?: (building: Building) => void;
  onAddCableRoute?: (building: Building) => void;
  onCreateMaintenance?: (building: Building) => void;
  onFocusMap?: (building: Building) => void;
  onSelectDevice?: (device: Device) => void;
  onDeleteBuilding?: (building: Building) => void;
  onEditBuilding?: (building: Building) => void;
  isViewer?: boolean;
}

export const BuildingDetailPanel: React.FC<BuildingDetailPanelProps> = ({
  building,
  devices = [],
  cables = [],
  alerts = [],
  racks = [],
  isLoading = false,
  onClose,
  onViewCableRoute,
  onViewTopology,
  onViewDevices,
  onTraceConnection,
  onAddDevice,
  onAddCableRoute,
  onCreateMaintenance,
  onFocusMap,
  onSelectDevice,
  onDeleteBuilding,
  onEditBuilding,
  isViewer = false
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BuildingDetailTab>('overview');

  // ESC key support to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!building) return null;

  // Filter entities specifically belonging to this building
  const bldDevices = devices.filter(d => d.buildingId === building.id);
  const bldCables = cables.filter(
    c => c.fromBuildingId === building.id || c.toBuildingId === building.id
  );
  const bldAlerts = alerts.filter(a => a.buildingId === building.id && a.status !== 'resolved');
  const bldRacks = racks.filter(r => r.buildingId === building.id);

  const totalDevs = bldDevices.length > 0 ? bldDevices.length : (building.totalDevices || 6);
  const onlineDevs = bldDevices.filter(d => d.status === 'online').length || (building.status === 'healthy' ? totalDevs : Math.max(1, totalDevs - 1));
  const offlineDevs = Math.max(0, totalDevs - onlineDevs);
  const activeAlertsCount = bldAlerts.length || (building.status === 'warning' ? 1 : building.status === 'critical' ? 2 : 0);

  // Status text determination
  const statusLabel = building.status === 'healthy' ? 'ONLINE' : building.status === 'warning' ? 'WARNING' : 'CRITICAL';
  const statusBadgeBg = building.status === 'healthy' 
    ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/50' 
    : building.status === 'warning' 
    ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/50' 
    : 'bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/50';

  return (
    <div className="w-full sm:w-96 md:w-[420px] h-full max-h-full bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none shadow-2xl z-40 overflow-hidden font-sans text-slate-800 dark:text-slate-100 animate-in slide-in-from-right duration-300">
      {/* 1. Header (Building Name, Building Code, Status, Close Button) */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#080D1A]/95 backdrop-blur-md sticky top-0 z-30 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border shadow-xs bg-blue-500/10 dark:bg-blue-600/20 border-blue-500/20 dark:border-blue-500/40 text-blue-600 dark:text-cyan-400"
            style={building.color ? {
              backgroundColor: `${building.color}20`,
              borderColor: `${building.color}50`,
              color: building.color
            } : undefined}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-mono tracking-wider text-blue-600 dark:text-cyan-300 uppercase">
                GEDUNG {building.code}
              </span>
              {building.color && (
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-black/20 shadow-xs"
                  style={{ backgroundColor: building.color }}
                  title={`Warna Gedung: ${building.color}`}
                />
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1 ${statusBadgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  building.status === 'healthy' ? 'bg-emerald-500 dark:bg-emerald-400' : building.status === 'warning' ? 'bg-amber-500 dark:bg-amber-400 animate-pulse' : 'bg-rose-500 dark:bg-rose-400 animate-ping'
                }`} />
                {statusLabel}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate leading-snug mt-0.5">
              {building.name}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Building {building.code} • {building.lokasi || 'Kawasan Industri CBA'}
            </p>
          </div>
        </div>

        {/* Actions & Close Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isViewer && onEditBuilding && (
            <button
              type="button"
              onClick={() => onEditBuilding(building)}
              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors cursor-pointer"
              title="Edit Informasi Gedung"
            >
              <PenTool className="w-4 h-4 text-amber-500 hover:scale-110 transition-transform" />
            </button>
          )}
          {!isViewer && onDeleteBuilding && (
            <button
              type="button"
              onClick={() => onDeleteBuilding(building)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Hapus Gedung Ini dari Denah"
            >
              <Trash2 className="w-4 h-4 text-rose-500 hover:scale-110 transition-transform" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* 2. SUMMARY (6 Cards: Devices, Racks, Cable Routes, Online, Offline, Active Alerts) */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>Ringkasan Infrastruktur</span>
            <span className="text-blue-600 dark:text-cyan-400 font-mono">Real-time KPI</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            {/* Devices */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">Devices</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">{totalDevs}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Total Unit</span>
            </div>

            {/* Racks */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">Racks</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">{building.racksCount || bldRacks.length || 1}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Kabinet</span>
            </div>

            {/* Cable Routes */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">Cable Routes</span>
              <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-1">{bldCables.length || 3}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Jalur FO/UTP</span>
            </div>

            {/* Online Devices */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">Online Dev.</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{onlineDevs}</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-500/80">Normal</span>
            </div>

            {/* Offline Devices */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">Offline Dev.</span>
              <span className={`text-sm font-bold mt-1 ${offlineDevs > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {offlineDevs}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Terputus</span>
            </div>

            {/* Active Alerts */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">Active Alerts</span>
              <span className={`text-sm font-bold mt-1 ${activeAlertsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeAlertsCount}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Insiden</span>
            </div>
          </div>
        </div>

        {/* 3. TABS NAVIGATION (7 Tabs) */}
        <div className="border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 overflow-x-auto custom-scrollbar">
          <div className="flex gap-1 min-w-max pb-1 text-xs">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'devices', label: `Devices (${totalDevs})` },
              { id: 'cables', label: `Cable Routes (${bldCables.length || 3})` },
              { id: 'racks', label: `Racks (${building.racksCount || 1})` },
              { id: 'network', label: 'Network' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'documents', label: 'Documents' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as BuildingDetailTab)}
                className={`px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. TAB CONTENTS */}
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5 text-xs animate-in fade-in">
            {/* Building Photo / Diagram */}
            <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 group">
              <img
                src={building.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'}
                alt={building.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 dark:from-[#0B132B] via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="font-bold text-white text-xs drop-shadow">{building.name}</span>
                <span className="font-mono text-[10px] text-cyan-300 bg-slate-900/80 dark:bg-[#0B132B]/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {building.koordinat || `X: ${building.center.x}, Y: ${building.center.y}`}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Deskripsi Fasilitas
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {building.description || 'Fasilitas operasional dan manufaktur terintegrasi PT. CBA Chemical Industry.'}
              </p>
            </div>

            {/* Key Information Table */}
            <div className="bg-slate-50 dark:bg-[#111A33] rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Lokasi Gedung:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  {building.lokasi || 'Zona Pabrik Selatan'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kategori Fasilitas:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 uppercase">{building.category}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Penanggung Jawab (PIC IT):</span>
                <span className="font-semibold text-blue-600 dark:text-cyan-300">{building.headIT || 'Tim IT Infrastructure CBA'}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Inspeksi Terakhir:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  12 Sept 2026 (Normal)
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status Operasional:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">{statusLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEVICES */}
        {activeTab === 'devices' && (
          <div className="space-y-2.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daftar Hardware Gedung
              </span>
              <button
                type="button"
                onClick={() => onAddDevice && onAddDevice(building)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Device</span>
              </button>
            </div>

            {bldDevices.length > 0 ? (
              <div className="space-y-2">
                {bldDevices.map(dev => (
                  <div
                    key={dev.id}
                    onClick={() => onSelectDevice && onSelectDevice(dev)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {dev.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {dev.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                        <span>IP: {dev.ip}</span>
                        <span>•</span>
                        <span>{dev.room || 'Rack Room'}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        dev.status === 'online' 
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {dev.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 space-y-2">
                <Server className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-slate-500 dark:text-slate-400 text-xs">Belum ada perangkat terdaftar di gedung ini.</p>
                <button
                  type="button"
                  onClick={() => onAddDevice && onAddDevice(building)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Perangkat</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CABLE ROUTES */}
        {activeTab === 'cables' && (
          <div className="space-y-2.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Jalur Kabel Serat Optik & UTP
              </span>
              <button
                type="button"
                onClick={() => onAddCableRoute && onAddCableRoute(building)}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Cable</span>
              </button>
            </div>

            {bldCables.length > 0 ? (
              <div className="space-y-2">
                {bldCables.map(cable => {
                  const dest = cable.fromBuildingId === building.id ? cable.toBuildingName : cable.fromBuildingName;
                  return (
                    <div
                      key={cable.id}
                      onClick={() => onViewCableRoute && onViewCableRoute(cable)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {cable.code}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-mono uppercase">
                            {cable.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>Ke: {dest || 'Gedung Terhubung'}</span>
                          <span>•</span>
                          <span className="font-mono">{cable.lengthMeters || 180}m</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
                          {cable.status}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 space-y-2">
                <Network className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-slate-500 dark:text-slate-400 text-xs">Belum ada jalur kabel terdaftar untuk gedung ini.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RACKS */}
        {activeTab === 'racks' && (
          <div className="space-y-3 text-xs animate-in fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Server Racks & Distribution Cabinets
            </span>

            {/* Rack Elevation Card */}
            <div className="bg-slate-50 dark:bg-[#111A33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Rack 01 - Main Distribution (MDF)</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Room: Server Area • 42U Standard</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  24 / 42 U Used
                </span>
              </div>

              {/* Progress Bar of Rack capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Kapasitas Unit U:</span>
                  <span>57% Terpakai</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '57%' }} />
                </div>
              </div>

              {/* Mounted Equipment List */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Perangkat Terpasang:</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-transparent flex justify-between">
                    <span className="text-slate-700 dark:text-slate-300">U40-42: Fiber Patch Panel 24 Core</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Active</span>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-transparent flex justify-between">
                    <span className="text-slate-700 dark:text-slate-300">U38-39: {building.mainSwitch || 'Cisco Catalyst 2960X'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-transparent flex justify-between">
                    <span className="text-slate-700 dark:text-slate-300">U01-04: Online UPS APC Smart-UPS 3000VA</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: NETWORK */}
        {activeTab === 'network' && (
          <div className="space-y-3 text-xs animate-in fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Parameter Jaringan & Backbone Telemetri
            </span>

            <div className="bg-slate-50 dark:bg-[#111A33] rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800/80">
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Main Switch:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">{building.mainSwitch || `SW-${building.code}-01`}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Backbone Drop Dari:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{building.backboneFrom || 'Kantor Utama (KU)'}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kabel Backbone:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{building.backboneCable || 'FO-001'}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kapasitas Core:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">{building.backboneCore || '12 Core Singlemode'}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kecepatan Backbone:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{building.backboneSpeed || '10 Gbps'}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Access Points (Wi-Fi):</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{building.apCount || 4} Unit AP</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Port Kapasitas:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{building.portCount || 24} Ports</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Connected Users:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{building.connectedUsers || 18} Klien</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="space-y-2.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Riwayat & Tiket Maintenance
              </span>
              <button
                type="button"
                onClick={() => onCreateMaintenance && onCreateMaintenance(building)}
                className="text-[11px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Buat Tiket</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">TKT-2026-088</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase font-bold">
                    IN PROGRESS
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Pembersihan Dust Filter & Uji Redaman FO</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>PIC: Budi Santoso</span>
                  <span>Due: 22 Sept 2026</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 space-y-1.5 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">TKT-2026-062</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase font-bold">
                    COMPLETED
                  </span>
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-xs">Upgrade Firmware Switch Access Cisco</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>PIC: Ahmad Fauzi</span>
                  <span>Selesai: 04 Sept 2026</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-2.5 text-xs animate-in fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Dokumentasi Teknis Jaringan
            </span>

            <div className="space-y-2">
              {[
                { name: `As-Built Drawing - Gedung ${building.code}.dwg`, size: '4.2 MB', date: 'Jan 2026' },
                { name: `Single Line Diagram (SLD) FO-${building.code}.pdf`, size: '1.8 MB', date: 'Feb 2026' },
                { name: `OTDR Fiber Attenuation Test Report.pdf`, size: '820 KB', date: 'Agust 2026' },
                { name: `Rack 42U Server Layout Elevation.pdf`, size: '640 KB', date: 'Juli 2026' }
              ].map((doc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Mengunduh berkas ${doc.name}...`)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Actions Bar (View Topology, Trace Connection, Add Device, Add Cable, Create Maint, View on Map) */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#080D1A]/95 backdrop-blur space-y-2">
        {/* Quick View on Map button */}
        <button
          type="button"
          onClick={() => onFocusMap && onFocusMap(building)}
          className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 dark:bg-cyan-600/20 hover:bg-cyan-500/20 dark:hover:bg-cyan-600/30 border border-cyan-500/30 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Fokuskan Kamera Denah (View on Map)</span>
        </button>

        {/* 5 Action Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* View Topology */}
          <button
            type="button"
            onClick={() => {
              if (onViewTopology) onViewTopology(building);
              else navigate(`/network-topology?buildingId=${building.id}`);
            }}
            className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#111A33] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>View Topology</span>
          </button>

          {/* Trace Connection */}
          <button
            type="button"
            onClick={() => onTraceConnection && onTraceConnection(building)}
            className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#111A33] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Trace Connection</span>
          </button>

          {/* Add Device */}
          {!isViewer && (
            <button
              type="button"
              onClick={() => onAddDevice && onAddDevice(building)}
              className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#111A33] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Add Device</span>
            </button>
          )}

          {/* Add Cable Route */}
          {!isViewer && (
            <button
              type="button"
              onClick={() => onAddCableRoute && onAddCableRoute(building)}
              className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#111A33] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Add Cable</span>
            </button>
          )}
        </div>

        {/* Create Maintenance Ticket */}
        {!isViewer && (
          <button
            type="button"
            onClick={() => onCreateMaintenance && onCreateMaintenance(building)}
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Create Maintenance Ticket</span>
          </button>
        )}

        {/* Edit & Delete Action Buttons */}
        {!isViewer && (
          <div className="grid grid-cols-2 gap-2">
            {onEditBuilding && (
              <button
                type="button"
                onClick={() => onEditBuilding(building)}
                className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-amber-500" />
                <span>Edit Gedung</span>
              </button>
            )}

            {onDeleteBuilding && (
              <button
                type="button"
                onClick={() => onDeleteBuilding(building)}
                className={`py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${!onEditBuilding ? 'col-span-2' : ''}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus Gedung</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
