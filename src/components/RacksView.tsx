import React, { useState } from 'react';
import { Rack, Device } from '../types';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';

interface RacksViewProps {
  racks: Rack[];
  devices: Device[];
}

export const RacksView: React.FC<RacksViewProps> = ({ racks, devices }) => {
  const [selectedRackId, setSelectedRackId] = useState<string>(racks[0]?.id || 'rack-srv-01');
  const [selectedU, setSelectedU] = useState<number | null>(42);
  const [selectedPort, setSelectedPort] = useState<number | null>(1);

  const currentRack = racks.find(r => r.id === selectedRackId) || racks[0] || {
    id: 'rack-srv-01',
    code: 'RACK-SRV-01',
    name: 'Server Rack Data Center 01',
    buildingId: 'bld-ruang-server',
    room: 'Ruang Server Lt. 1',
    uCapacity: 42,
    usedU: 18,
    deviceIds: ['SW-KU-01', 'FW-01']
  };

  // Mock rack equipment assignments
  const rackEquipments: { [key: number]: { name: string; type: string; status: 'online' | 'warning' | 'offline'; model: string; ports: number; uHeight: number } } = {
    42: { name: 'Patch Panel Fiber ODF 24-Port', type: 'ODF', status: 'online', model: 'Panduit Opticom 1U', ports: 24, uHeight: 1 },
    41: { name: 'Core Switch Cisco Catalyst 9500', type: 'Core Switch', status: 'online', model: 'C9500-48Y4C', ports: 48, uHeight: 1 },
    40: { name: 'Cable Management Duct Horisontal', type: 'Organizer', status: 'online', model: '1U Brush Panel', ports: 0, uHeight: 1 },
    39: { name: 'Firewall Fortinet FortiGate 200F', type: 'Firewall', status: 'online', model: 'FG-200F', ports: 18, uHeight: 1 },
    38: { name: 'Distribution Switch A (SW-A-01)', type: 'Switch', status: 'online', model: 'C3850-24T', ports: 24, uHeight: 1 },
    35: { name: 'Server Farm Node 1 - ERP Database', type: 'Server', status: 'online', model: 'Dell PowerEdge R740 2U', ports: 8, uHeight: 2 },
    30: { name: 'NVR CCTV Central 64-Channel', type: 'NVR', status: 'online', model: 'Hikvision DS-9664NI', ports: 16, uHeight: 2 },
    2: { name: 'Online Smart UPS RT 3000VA', type: 'UPS', status: 'online', model: 'APC Smart-UPS RT 3kVA', ports: 4, uHeight: 2 },
  };

  const selectedEquipment = selectedU ? rackEquipments[selectedU] : null;

  const uSlots = Array.from({ length: currentRack.uCapacity || 42 }, (_, i) => (currentRack.uCapacity || 42) - i);

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-auto flex flex-col gap-6 font-sans text-slate-900 select-none">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              MANAJEMEN KABINET RACK & ODF ({currentRack.uCapacity}U)
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Visualisasi kabinet server, manajemen posisi unit U, dan pemetaan port switch.
            </p>
          </div>
        </div>

        {/* Rack Selector Dropdown */}
        <div className="flex items-center gap-2.5 font-sans">
          <span className="text-xs text-slate-500">Pilih Kabinet:</span>
          <select
            value={selectedRackId}
            onChange={(e) => {
              setSelectedRackId(e.target.value);
              setSelectedU(42);
            }}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs rounded-lg px-3 py-1.5 text-slate-800 cursor-pointer focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="rack-srv-01">RACK-SRV-01 (42U - Ruang Server Pusat)</option>
            <option value="rack-a-01">RACK-A-01 (24U - Gedung A)</option>
            <option value="rack-b-01">RACK-B-01 (24U - Gedung B)</option>
            <option value="rack-c-01">RACK-C-01 (24U - Gedung C)</option>
            <option value="rack-d-01">RACK-D-01 (24U - Gedung D)</option>
            <option value="rack-e-01">RACK-E-01 (24U - Gedung E)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Visual Cabinet (Left) + Equipment & Port Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Visual Rack Frame (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-xs rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-xs text-slate-900 font-mono">{currentRack.name}</h3>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold">
              {currentRack.uCapacity}U Frame
            </span>
          </div>

          {/* 42U Vertical Rack Rails Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col gap-1 overflow-y-auto max-h-[620px] shadow-inner">
            {uSlots.map(u => {
              const eq = rackEquipments[u];
              const isSelected = selectedU === u;

              return (
                <div
                  key={u}
                  onClick={() => eq && setSelectedU(u)}
                  className={`h-7 px-2.5 rounded flex items-center justify-between font-mono text-[10px] transition-colors border ${
                    eq
                      ? isSelected
                        ? 'bg-blue-600/30 border-cyan-400 text-white cursor-pointer shadow-xs'
                        : 'bg-[#111A33] border-slate-800 text-slate-200 hover:border-slate-600 cursor-pointer'
                      : 'bg-transparent border-transparent text-slate-700'
                  }`}
                >
                  <span className="w-6 text-[9px] font-semibold text-slate-500">{u}U</span>

                  {eq ? (
                    <div className="flex-1 flex items-center justify-between ml-2 truncate font-sans">
                      <span className="truncate font-medium flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {eq.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">{eq.type}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-700 italic ml-2 font-mono">-- Empty Slot --</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details: Equipment Info & Interactive Port Matrix (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {selectedEquipment ? (
            <>
              {/* Equipment Card */}
              <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl flex flex-col gap-3 font-sans">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold uppercase tracking-wider">
                      Position: Slot {selectedU}U
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900 mt-0.5">{selectedEquipment.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">Model: {selectedEquipment.model}</p>
                  </div>

                  <StatusBadge status={selectedEquipment.status} size="sm" />
                </div>

                {/* Ports Management Matrix (e.g. 24 or 48 ports) */}
                {selectedEquipment.ports > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">
                        Port Patch Status ({selectedEquipment.ports} Ports)
                      </h4>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-700 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected</span>
                        <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Empty</span>
                      </div>
                    </div>

                    {/* Interactive 2-row Port Grid */}
                    <div className="grid grid-cols-12 gap-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      {Array.from({ length: selectedEquipment.ports }, (_, i) => i + 1).map(portNum => {
                        const isUp = portNum <= Math.floor(selectedEquipment.ports * 0.7);
                        const isPortSelected = selectedPort === portNum;

                        return (
                          <button
                            key={portNum}
                            onClick={() => setSelectedPort(portNum)}
                            className={`p-1.5 rounded text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isPortSelected
                                ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 shadow-xs'
                                : isUp
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800'
                                  : 'bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-[8px] font-mono">{portNum}</span>
                            <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isUp ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Port Inspector */}
                {selectedPort && selectedEquipment.ports > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">PORT NUMBER</span>
                      <span className="font-bold text-slate-800">Gi1/0/{selectedPort}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">SPEED & DUPLEX</span>
                      <span className="font-bold text-slate-800">1000 Mbps Full</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">VLAN ID</span>
                      <span className="font-bold text-blue-600">VLAN 10 (Prod)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">STATUS</span>
                      <span className="font-bold text-emerald-600">UP / ACTIVE</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 p-10 rounded-2xl text-center text-slate-500 text-xs shadow-xs">
              Pilih slot U pada rak kabinet di samping kiri untuk melihat detail perangkat & pemetaan port.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
