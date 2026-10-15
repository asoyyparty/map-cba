import React, { useState } from 'react';
import { Building, Device, Rack, CableRoute } from '../types';
import { RackViewer } from './RackViewer';
import { 
  X, 
  Building2, 
  User, 
  Server, 
  Network, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  HardDrive
} from 'lucide-react';

interface BuildingDrawerProps {
  building: Building | null;
  devices: Device[];
  racks: Rack[];
  cables: CableRoute[];
  onClose: () => void;
}

export const BuildingDrawer: React.FC<BuildingDrawerProps> = ({
  building,
  devices,
  racks,
  cables,
  onClose
}) => {
  if (!building) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'devices' | 'racks' | 'cables'>('info');

  const buildingDevices = devices.filter(d => d.buildingId === building.id);
  const buildingRacks = racks.filter(r => r.buildingId === building.id);
  const buildingCables = cables.filter(
    c => c.fromBuildingId === building.id || c.toBuildingId === building.id
  );

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[680px] bg-slate-950 border-l border-slate-800 shadow-2xl z-40 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-800">
              {building.code}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              building.status === 'healthy' 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {building.status === 'healthy' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {building.status.toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">{building.name}</h2>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>IT In-Charge: <strong>{building.headIT}</strong></span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 bg-slate-900/60 border-b border-slate-800 px-4 pt-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'info'
              ? 'bg-slate-950 border-slate-800 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Informasi & Overview
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'devices'
              ? 'bg-slate-950 border-slate-800 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Perangkat ({buildingDevices.length})
        </button>
        <button
          onClick={() => setActiveTab('racks')}
          className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'racks'
              ? 'bg-slate-950 border-slate-800 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rack 42U ({buildingRacks.length})
        </button>
        <button
          onClick={() => setActiveTab('cables')}
          className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'cables'
              ? 'bg-slate-950 border-slate-800 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Kabel FO/UTP ({buildingCables.length})
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Tab 1: Overview Info */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Deskripsi Gedung</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{building.description}</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TOTAL PERANGKAT</span>
                <span className="text-lg font-bold text-cyan-400">{buildingDevices.length} Unit</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RACK CABINET</span>
                <span className="text-lg font-bold text-amber-400">{buildingRacks.length} Rack</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">JALUR KABEL FO</span>
                <span className="text-lg font-bold text-rose-400">{buildingCables.length} Route</span>
              </div>
            </div>

            {/* Installed Devices Quick List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Daftar Perangkat Utama di Gedung Ini
              </h3>
              <div className="flex flex-col gap-2">
                {buildingDevices.map(d => (
                  <div key={d.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-slate-200 font-bold">{d.name}</span>
                        <span className="text-slate-500 text-[10px] block">IP: {d.ip} | Room: {d.room}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Devices List */}
        {activeTab === 'devices' && (
          <div className="flex flex-col gap-3">
            {buildingDevices.map(d => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-800">
                      {d.type.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100">{d.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.status === 'online' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2 rounded-lg text-slate-300">
                  <div>IP Address: <strong>{d.ip}</strong></div>
                  <div>MAC: <strong>{d.mac}</strong></div>
                  <div>Model: <strong>{d.brand} {d.model}</strong></div>
                  <div>Ports Active: <strong>{d.activePorts}/{d.totalPorts}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Racks Viewer */}
        {activeTab === 'racks' && (
          <div className="flex flex-col gap-4">
            {buildingRacks.length > 0 ? (
              buildingRacks.map(rack => (
                <RackViewer
                  key={rack.id}
                  rack={rack}
                  devicesInRack={buildingDevices.filter(d => d.rackId === rack.id)}
                />
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                Tidak ada rack cabinet terdaftar di gedung ini.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Cables */}
        {activeTab === 'cables' && (
          <div className="flex flex-col gap-3">
            {buildingCables.map(c => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{c.code} — {c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.type === 'fiber' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {c.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Panjang: {c.lengthMeters} Meter | Cores Terpakai: {c.usedCores}/{c.totalCores}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
