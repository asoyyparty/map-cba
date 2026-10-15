import React, { useState, useEffect } from 'react';
import { Device, Building, Port } from '../../types';
import { 
  Server, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Clock, 
  FileText, 
  Layers, 
  Wrench, 
  ArrowRight,
  Zap,
  Network,
  Cpu,
  Shield,
  Wifi,
  HardDrive,
  Sliders,
  ExternalLink,
  MapPin,
  Calendar,
  Key,
  GitFork,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Check
} from 'lucide-react';

import { StatusBadge } from '../common/StatusBadge';
import { portService } from '../../services/portService';
import { useTheme } from '../../context/ThemeContext';

interface DeviceDrawerProps {
  device: Device | null;
  building?: Building | null;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onTraceConnection?: (device: Device) => void;
  onViewOnMap?: (device: Device) => void;
  onViewTopology?: (device: Device) => void;
  onEditDevice?: (device: Device) => void;
  onCreateMaintenance?: (device: Device) => void;
}

export const DeviceDrawer: React.FC<DeviceDrawerProps> = ({
  device,
  building,
  theme: propTheme,
  onClose,
  onTraceConnection,
  onViewOnMap,
  onViewTopology,
  onEditDevice,
  onCreateMaintenance
}) => {
  const { theme: ctxTheme } = useTheme();
  const effectiveTheme = propTheme || ctxTheme;
  const isLight = effectiveTheme === 'light';
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ports' | 'interfaces' | 'connections' | 'monitoring' | 'maintenance' | 'documents'
  >('overview');

  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [portsList, setPortsList] = useState<Port[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);
  const [isAddingPort, setIsAddingPort] = useState(false);
  const [newPortName, setNewPortName] = useState('');
  const [newPortType, setNewPortType] = useState('Ethernet');
  const [newPortSpeed, setNewPortSpeed] = useState('1 Gbps');
  const [newPortStatus, setNewPortStatus] = useState<'up' | 'down' | 'disabled'>('up');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [portActionMsg, setPortActionMsg] = useState<string | null>(null);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load ports
  useEffect(() => {
    if (!device) return;
    setIsLoadingPorts(true);
    portService.getPortsByDeviceId(device.id)
      .then(res => setPortsList(res))
      .catch(err => console.warn('Failed loading ports:', err))
      .finally(() => setIsLoadingPorts(false));
  }, [device]);

  const handleCreatePort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !newPortName.trim()) return;

    try {
      const created = await portService.createPort(device.id, {
        portName: newPortName.trim(),
        portType: newPortType,
        speed: newPortSpeed,
        status: newPortStatus,
        description: newPortDesc.trim() || 'Custom port'
      });
      setPortsList(prev => [...prev, created]);
      setIsAddingPort(false);
      setNewPortName('');
      setNewPortDesc('');
      setPortActionMsg('Port berhasil ditambahkan!');
      setTimeout(() => setPortActionMsg(null), 3000);
    } catch (err: any) {
      setPortActionMsg(err.message || 'Gagal menambahkan port');
    }
  };

  const handleTogglePort = async (port: Port) => {
    if (!device) return;
    const nextStatus = port.status === 'up' ? 'down' : 'up';
    try {
      const updated = await portService.updatePort(device.id, port.id, { status: nextStatus });
      setPortsList(prev => prev.map(p => p.id === port.id ? updated : p));
    } catch (err: any) {
      console.error('Failed toggling port:', err);
    }
  };

  const handleDeletePort = async (portId: string) => {
    if (!device) return;
    try {
      await portService.deletePort(device.id, portId);
      setPortsList(prev => prev.filter(p => p.id !== portId));
    } catch (err: any) {
      console.error('Failed deleting port:', err);
    }
  };

  if (!device) return null;

  const totalPorts = device.totalPorts || 24;
  const activePorts = device.activePorts || 16;

  return (
    <div className={`w-full sm:w-84 md:w-96 max-w-full h-full max-h-full border-l flex flex-col justify-between shrink-0 select-none shadow-2xl z-40 overflow-y-auto font-sans animate-in slide-in-from-right duration-300 ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-800' 
        : 'bg-[#0B132B] border-slate-800/80 text-slate-100'
    }`}>
      {/* Top Header */}
      <div>
        <div className={`p-3.5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800/80 bg-transparent'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              isLight 
                ? 'bg-blue-50 text-blue-600 border-blue-200' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-semibold text-xs font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{device.name}</h3>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>ID: {device.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card Banner */}
        <div className="p-3.5 pb-0 flex flex-col gap-2.5">
          <div className={`border p-3 rounded-xl flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/80'
          }`}>
            <div>
              <span className={`text-xs font-semibold block uppercase font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {device.type.replace('-', ' ')}
              </span>
              <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {device.ip}
              </span>
            </div>

            <StatusBadge status={device.status} size="sm" />
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className={`flex flex-wrap gap-1 p-1 rounded-lg border text-[10px] font-medium ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#111A33] border-slate-800'
          }`}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'ports', label: `Ports (${activePorts})` },
              { id: 'interfaces', label: 'Interfaces' },
              { id: 'connections', label: 'Koneksi' },
              { id: 'monitoring', label: 'Monitor' },
              { id: 'maintenance', label: 'Rawat' },
              { id: 'documents', label: 'Docs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1 px-2 rounded transition-colors text-center cursor-pointer ${
                  activeTab === tab.id
                    ? isLight 
                      ? 'bg-white text-blue-600 font-semibold shadow-xs' 
                      : 'bg-blue-600 text-white font-semibold'
                    : isLight 
                      ? 'text-slate-600 hover:text-slate-900' 
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 flex flex-col gap-4 text-xs">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-3 font-mono">
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Vendor / Brand</span> <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{device.brand}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Model Perangkat</span> <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{device.model}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>MAC Address</span> <span className="font-bold text-blue-600">{device.mac}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Gedung</span> <span className="font-bold text-blue-600">{device.buildingName}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Ruangan</span> <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{device.room || 'Panel IT'}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Rack Position</span> <span className="font-bold text-amber-600">{device.rackName ? `${device.rackName} (U${device.rackUPosition || 24})` : 'Wallmount / Standalone'}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Uptime</span> <span className="font-bold text-emerald-600">{device.uptime || '45 days, 12 hrs'}</span></div>
                <div className="flex justify-between"><span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Installed Date</span> <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>15 Jan 2024</span></div>
              </div>

              {/* Port Capacity Card */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <div className="flex justify-between text-[11px]">
                  <span className={`font-sans font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Penggunaan Port Fisik</span>
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{activePorts} / {totalPorts} Port ({Math.round((activePorts / totalPorts) * 100)}%)</span>
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden border ${
                  isLight ? 'bg-slate-200 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.round((activePorts / totalPorts) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Ports Interactive Visualizer & Management */}
          {activeTab === 'ports' && (
            <div className="flex flex-col gap-3">
              {/* Front Panel Visualization */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Visualisasi Front Panel Port ({totalPorts} Ports):</span>
                
                {/* 2-Row Port Grid */}
                <div className={`grid grid-cols-12 gap-1.5 p-2 rounded-xl border font-mono ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#080D1A] border-slate-800'
                }`}>
                  {Array.from({ length: totalPorts }).map((_, idx) => {
                    const portNum = idx + 1;
                    const isActive = portNum <= activePorts;
                    const isSelected = selectedPort === portNum;

                    return (
                      <button
                        key={portNum}
                        onClick={() => setSelectedPort(portNum)}
                        className={`h-7 rounded flex flex-col items-center justify-center border text-[9px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : isActive
                            ? isLight 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900'
                            : isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                              : 'bg-slate-900/80 border-slate-800 text-slate-600 hover:bg-slate-800'
                        }`}
                        title={`Port ${portNum} - ${isActive ? 'Active (Up)' : 'Down / Empty'}`}
                      >
                        <span className={`w-1 h-1 rounded-full mb-0.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span>{portNum}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Port Detail Card */}
                {selectedPort && (
                  <div className={`p-3 rounded-xl border font-mono text-[11px] flex flex-col gap-1 mt-1 animate-in fade-in ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#080D1A] border-slate-800'
                  }`}>
                    <div className="flex justify-between font-bold text-blue-600">
                      <span>Port #{selectedPort}</span>
                      <span className={selectedPort <= activePorts ? 'text-emerald-600' : 'text-slate-500'}>
                        {selectedPort <= activePorts ? 'LINK UP (1 Gbps Full Duplex)' : 'LINK DOWN'}
                      </span>
                    </div>
                    <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>VLAN: <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>VLAN {selectedPort % 2 === 0 ? '10 (Corporate)' : '20 (Production)'}</strong></div>
                    <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>PoE Output: <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{selectedPort <= 8 ? 'PoE+ (15.4W)' : 'None'}</strong></div>
                    <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>Connected: <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{selectedPort <= activePorts ? `Client Host / AP-${device.buildingName?.slice(0, 3)}-0${selectedPort}` : 'Unconnected'}</strong></div>
                  </div>
                )}
              </div>

              {/* Port Management Section */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span className={`text-xs font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      Daftar Port Terkonfigurasi ({portsList.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingPort(!isAddingPort)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingPort ? 'Tutup Form' : 'Tambah Port'}</span>
                  </button>
                </div>

                {portActionMsg && (
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-mono flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>{portActionMsg}</span>
                  </div>
                )}

                {/* Inline Add Port Form */}
                {isAddingPort && (
                  <form onSubmit={handleCreatePort} className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 space-y-2.5 font-mono text-[11px]">
                    <span className="font-semibold text-blue-400 block">Form Registrasi Port Baru</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-0.5">Nama Port (misal Gi1/0/25, SFP1)</label>
                        <input
                          type="text"
                          required
                          value={newPortName}
                          onChange={e => setNewPortName(e.target.value)}
                          placeholder="e.g. Gi1/0/25, SFP+"
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-0.5">Tipe Port</label>
                        <select
                          value={newPortType}
                          onChange={e => setNewPortType(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                        >
                          <option value="Ethernet">Ethernet (RJ45)</option>
                          <option value="SFP">SFP</option>
                          <option value="SFP+">SFP+</option>
                          <option value="Fiber">Fiber Optic</option>
                          <option value="Console">Console</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-0.5">Kecepatan</label>
                        <select
                          value={newPortSpeed}
                          onChange={e => setNewPortSpeed(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                        >
                          <option value="10 Gbps">10 Gbps</option>
                          <option value="1 Gbps">1 Gbps</option>
                          <option value="100 Mbps">100 Mbps</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-0.5">Status Awal</label>
                        <select
                          value={newPortStatus}
                          onChange={e => setNewPortStatus(e.target.value as any)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                        >
                          <option value="up">Link UP (Aktif)</option>
                          <option value="down">Link DOWN (Nonaktif)</option>
                          <option value="disabled">Disabled (Admin)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Deskripsi / Peruntukan</label>
                      <input
                        type="text"
                        value={newPortDesc}
                        onChange={e => setNewPortDesc(e.target.value)}
                        placeholder="e.g. Uplink ke SW-Distribution atau Drop ke CCTV"
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingPort(false)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Simpan Port
                      </button>
                    </div>
                  </form>
                )}

                {/* Ports List Table */}
                {isLoadingPorts ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Memuat data port...</span>
                  </div>
                ) : portsList.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs">
                    Belum ada port terdaftar untuk perangkat ini.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {portsList.map(p => (
                      <div
                        key={p.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-[11px] font-mono transition-colors ${
                          isLight ? 'bg-white border-slate-200' : 'bg-[#080D1A] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            p.status === 'up' ? 'bg-emerald-500' : p.status === 'disabled' ? 'bg-amber-500' : 'bg-slate-500'
                          }`} />
                          <div>
                            <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {p.portName}
                            </span>
                            <span className="text-slate-500 text-[10px] ml-2">
                              {p.portType || 'Ethernet'} • {p.speed || '1 Gbps'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePort(p)}
                            title="Klik untuk toggle UP / DOWN"
                            className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                              p.status === 'up' 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {p.status === 'up' ? 'UP' : 'DOWN'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePort(p.id)}
                            title="Hapus port"
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Network Interfaces */}
          {activeTab === 'interfaces' && (
            <div className="flex flex-col gap-2.5 font-mono text-[11px]">
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <div className="flex justify-between items-center font-bold text-blue-600">
                  <span>GigabitEthernet 0/1 (Uplink)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                  }`}>CONNECTED</span>
                </div>
                <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Speed: 10 Gbps | MTU: 1500 | Duplex: Full | SFP+ Single Mode</div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <div className="flex justify-between items-center font-bold text-blue-600">
                  <span>VLAN 1 (Management)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                  }`}>ACTIVE</span>
                </div>
                <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>IP: {device.ip}/24 | Gateway: 192.168.1.1</div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <div className={`flex justify-between items-center font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  <span>Loopback 0</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                  }`}>UP</span>
                </div>
                <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>IP: 10.255.255.{device.ip.split('.')[3] || '1'}/32</div>
              </div>
            </div>
          )}

          {/* Tab 4: Connections */}
          {activeTab === 'connections' && (
            <div className="flex flex-col gap-2.5 font-mono text-[11px]">
              <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Uplink Backbone:</span>
                <div className={`flex items-center justify-between p-2 rounded border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#080D1A] border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-blue-600 block">FO-001 (Fiber Optic)</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Core Switch (SW-KU-01)</span>
                  </div>
                  <span className="text-emerald-600 font-bold text-[10px]">10 Gbps</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Downlink Distribution:</span>
                <div className={`flex items-center justify-between p-2 rounded border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#080D1A] border-slate-800'
                }`}>
                  <div>
                    <span className={`font-bold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>SW-SUB-01</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Sub-distribution Panel</span>
                  </div>
                  <span className="text-blue-600 font-bold text-[10px]">1 Gbps</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Monitoring */}
          {activeTab === 'monitoring' && (
            <div className="flex flex-col gap-3 font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
                }`}>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>PING LATENCY</span>
                  <span className="text-base font-bold text-emerald-600">1.8 ms</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
                }`}>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>PACKET LOSS</span>
                  <span className="text-base font-bold text-emerald-600">0.0 %</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
                }`}>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>CPU LOAD</span>
                  <span className="text-base font-bold text-blue-600">14.2 %</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
                }`}>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>MEMORY USAGE</span>
                  <span className="text-base font-bold text-amber-600">38.6 %</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className={`font-semibold text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>LIVE BANDWIDTH:</span>
                <div className={`flex justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <span>Inbound (Rx): <strong>142.5 Mbps</strong></span>
                  <span>Outbound (Tx): <strong>48.2 Mbps</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Maintenance */}
          {activeTab === 'maintenance' && (
            <div className="flex flex-col gap-2.5">
              <div className={`p-3 rounded-xl border flex flex-col gap-1 text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className="font-bold text-blue-600">Jadwal Perawatan Berkala Q3</span>
                <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Inspeksi debu modul kipas pendingin & backup configuration file.</span>
                <span className="text-slate-500 text-[10px] mt-1 font-mono">Petugas: IT Infrastructure Team</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-1 text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className="font-bold text-emerald-600">Firmware Update v17.6.5 Applied</span>
                <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Update keamanan CVE-2025 berhasil dipasang tanpa kendala outage.</span>
                <span className="text-slate-500 text-[10px] mt-1 font-mono">Tanggal: 10 Feb 2026</span>
              </div>
            </div>
          )}

          {/* Tab 7: Documents */}
          {activeTab === 'documents' && (
            <div className="flex flex-col gap-2 text-[11px] font-mono">
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className={`flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}><FileText className="w-4 h-4 text-blue-600" /> config-backup-2026.cfg</span>
                <span className="text-slate-500 text-[10px]">184 KB</span>
              </div>
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111A33] border-slate-800/60'
              }`}>
                <span className={`flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}><FileText className="w-4 h-4 text-emerald-600" /> datasheet-switch-specs.pdf</span>
                <span className="text-slate-500 text-[10px]">1.2 MB</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer (Section 13) */}
      <div className={`p-4 border-t flex flex-col gap-2 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#080D1A] border-slate-800/80'
      }`}>
        <div className="grid grid-cols-2 gap-2">
          {onViewOnMap && (
            <button
              onClick={() => onViewOnMap(device)}
              className={`py-2 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-[#131D3B] hover:bg-blue-600/30 border border-blue-500/50 text-blue-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> View on Map
            </button>
          )}

          {onViewTopology && (
            <button
              onClick={() => onViewTopology(device)}
              className={`py-2 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border border-slate-200 text-purple-700 shadow-xs'
                  : 'bg-[#1a1236] hover:bg-purple-600/30 border border-purple-500/50 text-purple-300'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" /> View Topology
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onTraceConnection && (
            <button
              onClick={() => onTraceConnection(device)}
              className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" /> Trace Path
            </button>
          )}

          {onEditDevice && (
            <button
              onClick={() => onEditDevice(device)}
              className={`py-2 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Perangkat
            </button>
          )}
        </div>

        {onCreateMaintenance && (
          <button
            onClick={() => onCreateMaintenance(device)}
            className={`w-full py-2 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Buat Tiket Maintenance
          </button>
        )}
      </div>
    </div>
  );
};
