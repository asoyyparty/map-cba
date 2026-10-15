import React, { useState } from 'react';
import { Rack, Device } from '../types';
import { Server, Cpu, HardDrive, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface RackViewerProps {
  rack: Rack;
  devicesInRack: Device[];
}

export const RackViewer: React.FC<RackViewerProps> = ({ rack, devicesInRack }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(
    devicesInRack[0] || null
  );
  const [selectedPort, setSelectedPort] = useState<number | null>(null);

  // Map U position to device
  const uSlots = Array.from({ length: rack.uCapacity }, (_, i) => rack.uCapacity - i);

  const getDeviceAtU = (u: number) => {
    return devicesInRack.find(d => d.rackUPosition === u);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-6">
      {/* Rack Cabinet Frame */}
      <div className="w-full lg:w-72 bg-slate-950 border-2 border-slate-800 rounded-xl p-3 shadow-2xl flex flex-col">
        {/* Rack Header */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-slate-200">{rack.code}</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            Capacity: {rack.uCapacity}U
          </span>
        </div>

        {/* 42U Vertical Rails */}
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 flex flex-col gap-1 overflow-y-auto max-h-[460px]">
          {uSlots.map(u => {
            const dev = getDeviceAtU(u);
            const isSelected = selectedDevice?.id === dev?.id;

            return (
              <div 
                key={u}
                className={`h-7 flex items-center gap-2 px-2 rounded font-mono text-[11px] transition-all border ${
                  dev 
                    ? isSelected
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-900 text-slate-700'
                }`}
                onClick={() => dev && setSelectedDevice(dev)}
              >
                <span className="w-6 text-[10px] text-slate-500 font-bold select-none">{u}U</span>
                {dev ? (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        dev.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      {dev.name}
                    </span>
                    <span className="text-[9px] text-slate-400 bg-slate-900 px-1 rounded">
                      {dev.brand}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-800 font-mono">-- Empty Slot --</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Device & Port Detail Panel */}
      <div className="flex-1 flex flex-col gap-4">
        {selectedDevice ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {selectedDevice.type.toUpperCase()}
                  </span>
                  <h3 className="font-bold text-base text-slate-100">{selectedDevice.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  IP: {selectedDevice.ip} | MAC: {selectedDevice.mac} | Room: {selectedDevice.room}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  selectedDevice.status === 'online'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedDevice.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Device Hardware Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">BRAND & MODEL</span>
                <span className="text-slate-200 font-semibold truncate block">{selectedDevice.brand} {selectedDevice.model}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TOTAL PORTS</span>
                <span className="text-cyan-400 font-semibold block">{selectedDevice.activePorts} / {selectedDevice.totalPorts} Active</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">UPTIME</span>
                <span className="text-emerald-400 font-semibold block">{selectedDevice.uptime}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RACK POSITION</span>
                <span className="text-amber-400 font-semibold block">{selectedDevice.rackUPosition}U Slot</span>
              </div>
            </div>

            {/* Switch Port Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Port Mapping Status Matrix ({selectedDevice.totalPorts} Ports)
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400"></span> Active</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-700"></span> Idle</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> Down</span>
                </div>
              </div>

              {/* Port Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                {Array.from({ length: selectedDevice.totalPorts }, (_, idx) => {
                  const portNum = idx + 1;
                  const isActive = portNum <= selectedDevice.activePorts;
                  const isSelectedPort = selectedPort === portNum;

                  return (
                    <button
                      key={portNum}
                      onClick={() => setSelectedPort(portNum)}
                      className={`h-9 rounded flex flex-col items-center justify-center font-mono text-[10px] transition-all border ${
                        isActive
                          ? isSelectedPort
                            ? 'bg-emerald-500 text-slate-950 border-white font-bold ring-2 ring-emerald-400'
                            : 'bg-emerald-950 border-emerald-700 text-emerald-300 hover:border-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full mb-0.5 bg-current" />
                      P{portNum}
                    </button>
                  );
                })}
              </div>

              {/* Selected Port Inspection Box */}
              {selectedPort && (
                <div className="mt-3 bg-slate-900 border border-cyan-800/60 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-slate-200 font-bold">Port #{selectedPort} Details</span>
                      <p className="text-slate-400 text-[11px]">
                        VLAN: 10 (DATA_PABRIK) | Speed: 1000Mbps Full-Duplex | Status: Linked UP
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-950 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-800">
                    PoE 802.3at Active
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
            <Server className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-xs">Pilih perangkat di dalam rack cabinet untuk melihat detail port.</p>
          </div>
        )}
      </div>
    </div>
  );
};
