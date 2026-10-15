import React, { useState } from 'react';
import { Building, Device, CableRoute } from '../types';
import { 
  Zap, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowRight, 
  ArrowDown,
  ShieldAlert, 
  Radio,
  Server,
  Building2,
  Cable,
  Activity,
  Layers,
  Check
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface TraceImpactToolProps {
  buildings: Building[];
  devices: Device[];
  cableRoutes: CableRoute[];
  onTriggerImpact: (impactedBuildingIds: string[], impactedCableIds: string[]) => void;
  onNavigateToMap?: (targetBuildingId?: string, targetCableId?: string) => void;
}

export const TraceImpactTool: React.FC<TraceImpactToolProps> = ({
  buildings,
  devices,
  cableRoutes,
  onTriggerImpact,
  onNavigateToMap
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'trace' | 'impact'>('trace');

  // Trace Path State
  const defaultCore = devices.find(d => d.type === 'core-switch') || devices[0];
  const defaultTarget = devices.find(d => d.id === 'dev-sw-d-01') || devices[3] || devices[0];
  const [sourceDevId, setSourceDevId] = useState<string>(defaultCore?.id || '');
  const [targetDevId, setTargetDevId] = useState<string>(defaultTarget?.id || '');

  // Impact Analysis State
  const [selectedCableId, setSelectedCableId] = useState<string>(cableRoutes[0]?.id || '');
  const [impactResult, setImpactResult] = useState<{
    affectedBuildings: string[];
    affectedDevices: string[];
  } | null>(null);

  // Perform Impact Simulation Logic
  const handleSimulateImpact = () => {
    const cable = cableRoutes.find(c => c.id === selectedCableId);
    if (!cable) return;

    let affectedBlds: string[] = [];
    let affectedDevs: string[] = [];

    if (cable.code === 'FO-001') {
      affectedBlds = ['bld-a', 'bld-mtc'];
    } else if (cable.code === 'FO-002') {
      affectedBlds = ['bld-b', 'bld-f', 'bld-j'];
    } else if (cable.code === 'FO-003') {
      affectedBlds = ['bld-d', 'bld-c', 'bld-e', 'bld-h'];
    } else if (cable.code === 'FO-004') {
      affectedBlds = ['bld-f', 'bld-j'];
    } else if (cable.code === 'FO-005') {
      affectedBlds = ['bld-c'];
    } else {
      affectedBlds = [cable.toBuildingId];
    }

    affectedDevs = devices.filter(d => affectedBlds.includes(d.buildingId)).map(d => d.id);

    setImpactResult({
      affectedBuildings: affectedBlds,
      affectedDevices: affectedDevs
    });

    onTriggerImpact(affectedBlds, [cable.id]);
    showToast(`Simulasi gangguan aktif: ${affectedBlds.length} gedung dan ${affectedDevs.length} perangkat terisolasi.`, 'error', 'Simulasi Outage Aktif');
  };

  const handleResetImpact = () => {
    setImpactResult(null);
    onTriggerImpact([], []);
    showToast('Simulasi gangguan direset, status jaringan normal kembali.', 'success', 'Jaringan Normal');
  };

  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || id;
  const getDeviceName = (id: string) => devices.find(d => d.id === id)?.name || id;

  const sourceDev = devices.find(d => d.id === sourceDevId) || devices[0];
  const targetDev = devices.find(d => d.id === targetDevId) || devices[1];
  const targetBuilding = buildings.find(b => b.id === targetDev?.buildingId);

  // Calculate connecting cable route
  const connectingCable = cableRoutes.find(
    c => (c.fromBuildingId === sourceDev?.buildingId && c.toBuildingId === targetDev?.buildingId) ||
         (c.toBuildingId === sourceDev?.buildingId && c.fromBuildingId === targetDev?.buildingId)
  ) || cableRoutes.find(c => c.toBuildingId === targetDev?.buildingId) || cableRoutes[0];

  const sourcePortName = sourceDev?.type === 'core-switch' ? 'Port SFP+ 3 (10G Fiber)' : 'Port GigabitEthernet 0/1';
  const destPortName = targetDev?.type === 'core-switch' ? 'Port SFP+ 1' : 'Port SFP 1 (10G Uplink)';

  return (
    <div className="w-full h-full bg-[#080D1A] p-6 overflow-auto flex flex-col gap-6 font-mono text-slate-100">
      {/* Top Header */}
      <div className="bg-[#0B132B] border border-slate-800/80 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            TRACE NETWORK PATH & IMPACT ANALYSIS (SEKSI 15)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pelacakan alur fisik/logis (Source Device → Port → Cable Route → Dest Port → Dest Device → Building) & simulasi kabel putus.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-[#111A33] p-1 rounded-xl border border-slate-800/60 text-xs">
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'trace'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Trace Connection Path
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'impact'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Simulasi Kabel Putus
          </button>
        </div>
      </div>

      {/* Mode 1: Trace Connection Path (Section 15) */}
      {activeTab === 'trace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Source & Destination Selector Box */}
          <div className="bg-[#0B132B] border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              PILIH NODE KONEKSI
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-sans font-semibold">1. SOURCE DEVICE (PERANGKAT ASAL):</label>
              <select
                value={sourceDevId}
                onChange={(e) => setSourceDevId(e.target.value)}
                className="w-full bg-[#111A33] border border-slate-700/80 text-xs text-slate-200 rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.buildingName} ({d.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-sans font-semibold">2. DESTINATION DEVICE (PERANGKAT TUJUAN):</label>
              <select
                value={targetDevId}
                onChange={(e) => setTargetDevId(e.target.value)}
                className="w-full bg-[#111A33] border border-slate-700/80 text-xs text-slate-200 rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.buildingName} ({d.type})</option>
                ))}
              </select>
            </div>

            <div className="mt-2 bg-[#111A33] p-3 rounded-xl border border-slate-800/60 text-xs text-slate-400">
              <div className="flex justify-between mb-1">
                <span>Rute Terpilih:</span>
                <span className="font-bold text-cyan-400">{connectingCable?.code}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimasi Redaman:</span>
                <span className="font-bold text-emerald-400">{connectingCable?.attenuationDb || 0.45} dB</span>
              </div>
            </div>

            {onNavigateToMap && (
              <button
                onClick={() => {
                  onNavigateToMap(targetDev?.buildingId, connectingCable?.id);
                  showToast(`Menampilkan rute ${connectingCable?.code} pada denah layout pabrik.`, 'info', 'Peta Berpusat');
                }}
                className="w-full py-2.5 bg-[#131D3B] hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Layers className="w-4 h-4" /> Sorot Rute di Denah Pabrik
              </button>
            )}
          </div>

          {/* Section 15 Connection Path Panel */}
          <div className="lg:col-span-2 bg-[#0B132B] border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                PANEL CONNECTION PATH (SEKSI 15 SPESIFIKASI)
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                PATH ESTABLISHED
              </span>
            </div>

            {/* Vertical 6-Step Node Sequence Matching Prompt */}
            <div className="flex flex-col gap-2 max-w-xl mx-auto w-full">
              {/* Step 1: Source Device */}
              <div className="bg-[#111A33] border border-cyan-500/40 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">1. SOURCE DEVICE</span>
                    <span className="font-bold text-sm text-cyan-300">{sourceDev?.name}</span>
                    <span className="text-xs text-slate-400 block font-sans">({sourceDev?.brand} {sourceDev?.model} - IP: {sourceDev?.ip})</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {sourceDev?.buildingName}
                </span>
              </div>

              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-5 h-5 text-cyan-400 animate-bounce" />
              </div>

              {/* Step 2: Source Port */}
              <div className="bg-[#111A33] border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">2. SOURCE PORT</span>
                  <span className="font-bold text-xs text-slate-200">{sourcePortName}</span>
                  <span className="text-[10px] text-slate-400 block">VLAN 10, 20 Trunk | Tx Optical Power: -2.1 dBm</span>
                </div>
              </div>

              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-5 h-5 text-cyan-400" />
              </div>

              {/* Step 3: Cable Route */}
              <div className="bg-[#111A33] border border-rose-500/50 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-700 text-rose-300 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">3. CABLE ROUTE</span>
                    <span className="font-bold text-sm text-rose-300">{connectingCable?.code} — {connectingCable?.name}</span>
                    <span className="text-xs text-slate-400 block font-sans">Panjang: {connectingCable?.lengthMeters}m | Core: 12 Single Mode | Redaman: {connectingCable?.attenuationDb} dB</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  {connectingCable?.bandwidth || '10 Gbps'}
                </span>
              </div>

              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-5 h-5 text-cyan-400" />
              </div>

              {/* Step 4: Destination Port */}
              <div className="bg-[#111A33] border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">4. DESTINATION PORT</span>
                  <span className="font-bold text-xs text-slate-200">{destPortName}</span>
                  <span className="text-[10px] text-slate-400 block">Rx Sensitivity: -18.4 dBm | Link Up</span>
                </div>
              </div>

              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-5 h-5 text-cyan-400" />
              </div>

              {/* Step 5: Destination Device */}
              <div className="bg-[#111A33] border border-emerald-500/40 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">5. DESTINATION DEVICE</span>
                    <span className="font-bold text-sm text-emerald-300">{targetDev?.name}</span>
                    <span className="text-xs text-slate-400 block font-sans">({targetDev?.brand} {targetDev?.model} - IP: {targetDev?.ip})</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  targetDev?.status === 'online' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {targetDev?.status?.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Step 6: Destination Building */}
              <div className="bg-[#111A33] border border-blue-500/40 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-700 text-blue-400 flex items-center justify-center font-bold text-xs">
                    6
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">6. DESTINATION BUILDING</span>
                    <span className="font-bold text-sm text-blue-300">{targetBuilding?.name || targetDev?.buildingName}</span>
                    <span className="text-xs text-slate-400 block font-sans">{targetBuilding?.lokasi || 'Kawasan Pabrik CBA'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {targetBuilding?.code || 'BLD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Impact Analysis */}
      {activeTab === 'impact' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulator Form */}
          <div className="bg-[#0B132B] border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              SIMULASI GANGGUAN / KABEL PUTUS
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-sans font-semibold">PILIH JALUR KABEL SAKAT / PUTUS:</label>
              <select
                value={selectedCableId}
                onChange={(e) => setSelectedCableId(e.target.value)}
                className="w-full bg-[#111A33] border border-slate-700/80 text-xs text-slate-200 rounded-xl p-3 focus:outline-none focus:border-rose-500 font-mono"
              >
                {cableRoutes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name} ({c.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSimulateImpact}
                className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert className="w-4 h-4" /> SIMULASIKAN KABEL PUTUS
              </button>
              {impactResult && (
                <button
                  onClick={handleResetImpact}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 px-4 rounded-xl transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-2 bg-[#0B132B] border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-100">HASIL DAMPAK INFRASTRUKTUR (IMPACT REPORT)</h3>

            {impactResult ? (
              <div className="flex flex-col gap-4">
                <div className="bg-rose-950/60 border border-rose-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-rose-400 font-bold text-xs block">TOTAL GEDUNG TERDAMPAK OFFLINE</span>
                    <span className="text-2xl font-extrabold text-rose-200">{impactResult.affectedBuildings.length} Gedung Pabrik</span>
                  </div>
                  <span className="text-xs bg-rose-900 text-rose-200 px-3 py-1 rounded-full font-bold animate-pulse">
                    CRITICAL OUTAGE
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Daftar Gedung Terisolasi:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {impactResult.affectedBuildings.map(bId => (
                      <div key={bId} className="bg-[#111A33] p-3 rounded-xl border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="font-bold">{getBuildingName(bId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Daftar Perangkat Terdampak:</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {impactResult.affectedDevices.map(dId => (
                      <span key={dId} className="bg-[#111A33] text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800">
                        {getDeviceName(dId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
                <Zap className="w-8 h-8 mb-2 opacity-30" />
                <p>Pilih jalur kabel lalu klik "Simulasikan Kabel Putus" untuk melihat dampaknya pada peta pabrik.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
