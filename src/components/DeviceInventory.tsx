import React, { useState } from 'react';
import { Device, DeviceType, DeviceStatus, Building } from '../types';
import { 
  Server, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HardDrive,
  Plus,
  Eye,
  Activity,
  MapPin,
  X,
  Check
} from 'lucide-react';
import { DeviceDrawer } from './devices/DeviceDrawer';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';

interface DeviceInventoryProps {
  devices: Device[];
  buildings?: Building[];
  onNavigateView?: (view: any) => void;
}

export const DeviceInventory: React.FC<DeviceInventoryProps> = ({ 
  devices: initialDevices,
  buildings = [],
  onNavigateView 
}) => {
  const { showToast } = useToast();
  const [deviceList, setDeviceList] = useState<Device[]>(initialDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);

  // Add Device Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<DeviceType>('dist-switch');
  const [newIp, setNewIp] = useState('');
  const [newMac, setNewMac] = useState('');
  const [newBuilding, setNewBuilding] = useState('Gedung A');
  const [newBrand, setNewBrand] = useState('Cisco');
  const [newModel, setNewModel] = useState('Catalyst 2960X');

  const filteredDevices = deviceList.filter(dev => {
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || dev.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || dev.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Device = {
      id: `dev-${Date.now()}`,
      name: newCode || newName,
      ip: newIp || '192.168.1.100',
      mac: newMac || '00:1A:2B:3C:4D:99',
      type: newType,
      buildingId: 'bld-a',
      buildingName: newBuilding,
      room: 'Panel Ruang IT',
      status: 'online',
      brand: newBrand,
      model: newModel,
      totalPorts: 24,
      activePorts: 12,
      uptime: '1 hari'
    };

    setDeviceList(prev => [created, ...prev]);
    setShowAddModal(false);
    showToast(`Perangkat ${created.name} (${created.ip}) berhasil ditambahkan ke inventaris!`, 'success', 'Perangkat Ditambahkan');
  };

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-hidden flex flex-col gap-6 font-sans text-slate-900">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              INVENTARIS PERANGKAT IT
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              {filteredDevices.length} / {deviceList.length} Nodes
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Database lengkap switch, router, firewall, server, dan wireless AP di kawasan pabrik.
          </p>
        </div>

        {/* Filter Inputs & Add Device */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto font-sans">
          {/* Search Input */}
          <div className="relative flex-1 lg:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, IP, MAC, gedung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
          >
            <option value="all">Semua Tipe</option>
            <option value="firewall">Firewall</option>
            <option value="core-switch">Core Switch</option>
            <option value="dist-switch">Distribution Switch</option>
            <option value="access-switch">Access Switch</option>
            <option value="router">Router</option>
            <option value="server">Server</option>
            <option value="access-point">Access Point</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Perangkat
          </button>
        </div>
      </div>

      {/* Main Table + Drawer Container */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Table View */}
        <div className="flex-1 bg-white border border-slate-200 shadow-xs rounded-xl overflow-y-auto">
          {filteredDevices.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Tidak Ada Perangkat yang Sesuai"
                description={`Tidak ditemukan perangkat dengan kata kunci "${searchTerm}" atau filter yang dipilih.`}
                actionLabel="Reset Pencarian"
                onAction={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                }}
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono enterprise-table">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] z-10">
                <tr>
                  <th className="px-4 py-3">PERANGKAT</th>
                  <th className="px-3 py-3">TIPE</th>
                  <th className="px-3 py-3">IP ADDRESS</th>
                  <th className="px-3 py-3">MAC ADDRESS</th>
                  <th className="px-3 py-3">LOKASI</th>
                  <th className="px-3 py-3">BRAND / MODEL</th>
                  <th className="px-3 py-3">PORT</th>
                  <th className="px-3 py-3">STATUS</th>
                  <th className="px-3 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((dev) => (
                  <tr 
                    key={dev.id} 
                    onClick={() => setActiveDevice(dev)}
                    className={`cursor-pointer transition-colors ${
                      activeDevice?.id === dev.id ? 'bg-blue-50/70 border-l-2 border-blue-600' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[140px] font-semibold">{dev.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 uppercase">
                        {dev.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-blue-600 font-bold">{dev.ip}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-[11px]">{dev.mac}</td>
                    <td className="px-3 py-2.5 font-sans">
                      <span className="block font-medium text-slate-800 text-xs">{dev.buildingName}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{dev.room}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-sans text-xs">{dev.brand} {dev.model}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">
                      <span className="text-emerald-600">{dev.activePorts}</span>
                      <span className="text-slate-400 font-normal">/{dev.totalPorts}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={dev.status} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDevice(dev);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3 h-3 text-blue-600" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Device Drawer Side Panel when active */}
        {activeDevice && (
          <DeviceDrawer
            device={activeDevice}
            theme="light"
            onClose={() => setActiveDevice(null)}
            onTraceConnection={() => {
              if (onNavigateView) onNavigateView('monitoring');
            }}
            onViewOnMap={() => {
              if (onNavigateView) onNavigateView('layout');
            }}
            onCreateMaintenance={() => {
              if (onNavigateView) onNavigateView('maintenance');
            }}
          />
        )}
      </div>

      {/* Add Device Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden font-sans text-slate-900">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider font-mono">
                  Registrasi Perangkat Jaringan Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeviceSubmit} className="p-4 flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                  KODE / HOSTNAME PERANGKAT *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SW-A-ACC-02"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                    TIPE PERANGKAT
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DeviceType)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer text-xs"
                  >
                    <option value="access-switch">Access Switch</option>
                    <option value="dist-switch">Distribution Switch</option>
                    <option value="core-switch">Core Switch</option>
                    <option value="firewall">Firewall</option>
                    <option value="router">Router</option>
                    <option value="server">Server</option>
                    <option value="access-point">Access Point</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                    LOKASI GEDUNG
                  </label>
                  <select
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer text-xs"
                  >
                    <option value="Kantor Utama">Kantor Utama (KU)</option>
                    <option value="Gedung A">Gedung A</option>
                    <option value="Gedung B">Gedung B</option>
                    <option value="Gedung C">Gedung C</option>
                    <option value="Gedung D">Gedung D</option>
                    <option value="Gedung E">Gedung E</option>
                    <option value="Gedung F">Gedung F</option>
                    <option value="Gedung H">Gedung H</option>
                    <option value="Gedung J">Gedung J</option>
                    <option value="Workshop MTC">Workshop MTC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                    IP ADDRESS *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.50"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                    MAC ADDRESS
                  </label>
                  <input
                    type="text"
                    placeholder="00:1A:2B:3C:4D:5E"
                    value={newMac}
                    onChange={(e) => setNewMac(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                    MERK / BRAND
                  </label>
                  <input
                    type="text"
                    placeholder="Cisco, Mikrotik..."
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-mono text-[10px] uppercase mb-1">
                    MODEL PERANGKAT
                  </label>
                  <input
                    type="text"
                    placeholder="Catalyst 2960X"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Perangkat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
