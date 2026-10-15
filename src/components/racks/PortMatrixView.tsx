import React, { useState } from 'react';
import { 
  Server, 
  Activity, 
  Wifi, 
  Radio, 
  Shield, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Network,
  Zap
} from 'lucide-react';

interface PortMatrixViewProps {
  device: any;
  onClose?: () => void;
}

export const PortMatrixView: React.FC<PortMatrixViewProps> = ({ device, onClose }) => {
  const [selectedPort, setSelectedPort] = useState<any | null>(null);

  if (!device) {
    return (
      <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        Pilih perangkat pada rak untuk melihat port matrix interaktif.
      </div>
    );
  }

  const ports: any[] = device.ports || [];
  const totalPorts = Number(device.ports_total) || 24;

  // Separate RJ45 Ethernet and SFP optical ports
  const rj45Ports = ports.filter(p => !p.port_name?.toLowerCase().includes('sfp'));
  const sfpPorts = ports.filter(p => p.port_name?.toLowerCase().includes('sfp'));

  // Split RJ45 into 2 rows (Top: odd ports, Bottom: even ports)
  const topRow = rj45Ports.filter((_, idx) => idx % 2 === 0);
  const bottomRow = rj45Ports.filter((_, idx) => idx % 2 === 1);

  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl font-sans text-slate-800 dark:text-slate-100 flex flex-col gap-4">
      {/* 1. Device Header on Faceplate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{device.code || device.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                {device.vendor || 'Cisco'} {device.model || ''}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                device.status === 'online' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                device.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
              }`}>
                {device.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              IP: <span className="text-slate-800 dark:text-slate-200 font-semibold">{device.ip}</span> • Slot: <span className="text-cyan-600 dark:text-cyan-400 font-bold">U{device.rack_u_position || 'N/A'}</span> ({device.rack_u_height || 1}U)
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Link Up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Down</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
            <span>SFP+ 10G</span>
          </div>
        </div>
      </div>

      {/* 2. Switch Front-Panel Chassis Visual */}
      <div className="bg-slate-100 dark:bg-[#070B19] border-2 border-slate-300 dark:border-slate-700/80 rounded-xl p-4 shadow-inner">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-x-auto pb-2">
          {/* RJ45 Port Matrix Cages */}
          <div className="flex flex-col gap-2 min-w-[520px]">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Network className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              10/100/1000Base-T Ethernet RJ45 Ports ({rj45Ports.length} Ports)
            </div>

            {/* Top Row Ports */}
            <div className="flex items-center gap-1.5">
              {topRow.map((port, idx) => {
                const isUp = port.status === 'up' || port.status === 'active';
                const isSelected = selectedPort?.id === port.id;
                return (
                  <button
                    key={port.id || idx}
                    onClick={() => setSelectedPort(port)}
                    className={`group relative flex flex-col items-center justify-center w-8 h-8 rounded bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-2xs ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50 dark:bg-blue-950/60' 
                        : isUp 
                        ? 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/80' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Link LED */}
                    <span className={`w-1.5 h-1.5 rounded-full mb-0.5 ${
                      isUp ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs shadow-emerald-400/80 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {idx * 2 + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row Ports */}
            <div className="flex items-center gap-1.5">
              {bottomRow.map((port, idx) => {
                const isUp = port.status === 'up' || port.status === 'active';
                const isSelected = selectedPort?.id === port.id;
                return (
                  <button
                    key={port.id || idx}
                    onClick={() => setSelectedPort(port)}
                    className={`group relative flex flex-col items-center justify-center w-8 h-8 rounded bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-2xs ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50 dark:bg-blue-950/60' 
                        : isUp 
                        ? 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/80' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Link LED */}
                    <span className={`w-1.5 h-1.5 rounded-full mb-0.5 ${
                      isUp ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs shadow-emerald-400/80 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {(idx + 1) * 2}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SFP+ Optical Uplink Cages */}
          <div className="border-l border-slate-200 dark:border-slate-800 pl-6 flex flex-col gap-2 shrink-0">
            <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" />
              SFP+ 10G Optical
            </div>
            <div className="flex items-center gap-3">
              {(sfpPorts.length > 0 ? sfpPorts : [
                { id: 'sfp-1', port_name: 'SFP1', speed: '10 Gbps', status: 'up', vlan: 'Trunk', description: 'Core Backbone Uplink' },
                { id: 'sfp-2', port_name: 'SFP2', speed: '10 Gbps', status: 'down', vlan: 'Trunk', description: 'Standby Redundant' }
              ]).map((sfp, idx) => {
                const isUp = sfp.status === 'up';
                const isSelected = selectedPort?.id === sfp.id;
                return (
                  <button
                    key={sfp.id || idx}
                    onClick={() => setSelectedPort(sfp)}
                    className={`w-12 h-14 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border flex flex-col items-center justify-between py-1.5 cursor-pointer transition-all shadow-xs ${
                      isSelected
                        ? 'border-cyan-500 ring-2 ring-cyan-500/40'
                        : isUp
                        ? 'border-cyan-400/80 dark:border-cyan-500/60 hover:border-cyan-500'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-cyan-500 dark:bg-cyan-400 shadow-xs shadow-cyan-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className="text-[8px] font-mono text-cyan-700 dark:text-cyan-300 font-bold">10G</span>
                    </div>
                    <div className="w-6 h-4 border border-cyan-300 dark:border-cyan-800/60 rounded bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">
                      <div className="w-3 h-1.5 bg-cyan-500/60 rounded-xs" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {sfp.port_name || `SFP${idx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Selected Port Inspector Card */}
      {selectedPort && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{selectedPort.port_name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                  selectedPort.status === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {selectedPort.status}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                  Speed: {selectedPort.speed || '1 Gbps'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                  VLAN: {selectedPort.vlan || '1'}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {selectedPort.description || 'Port koneksi terminal klien industrial PT. CBA.'}
              </div>
              {selectedPort.connected_to_device_id && (
                <div className="text-xs text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                  <span>→ Terhubung ke:</span>
                  <span className="font-bold underline">{selectedPort.connected_to_device_id}</span>
                  {selectedPort.connected_to_port_name && <span>({selectedPort.connected_to_port_name})</span>}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setSelectedPort(null)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            Tutup Inspeksi
          </button>
        </div>
      )}
    </div>
  );
};
