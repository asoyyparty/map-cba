import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Eye, 
  MapPin, 
  GitFork, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  HardDrive, 
  Radio, 
  Wifi, 
  Shield, 
  Video, 
  Copy, 
  Check, 
  Loader2, 
  SlidersHorizontal,
  X,
  Wrench,
  Lock,
  Monitor
} from 'lucide-react';
import { Device, DeviceType, DeviceStatus, Building } from '../../types';
import { deviceService } from '../../services/deviceService';
import { buildingService } from '../../services/buildingService';
import { DeviceFormModal } from './DeviceFormModal';
import { DeleteDeviceModal } from './DeleteDeviceModal';
import { DeviceDrawer } from './DeviceDrawer';
import { CreateMaintenanceModal } from '../dashboard/DashboardModals';
import { useAuth } from '../../context/AuthContext';

const DEVICE_TYPE_LABELS: Record<DeviceType, { label: string; icon: React.ReactNode; color: string }> = {
  'firewall': { label: 'Firewall', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  'router': { label: 'Router', icon: <Radio className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  'core-switch': { label: 'Core Switch', icon: <Server className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  'dist-switch': { label: 'Distribution Switch', icon: <Server className="w-3.5 h-3.5" />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  'access-switch': { label: 'Access Switch', icon: <Server className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  'server': { label: 'Server', icon: <HardDrive className="w-3.5 h-3.5" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  'access-point': { label: 'Access Point', icon: <Wifi className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'cctv': { label: 'CCTV Camera', icon: <Video className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  'computer': { label: 'Komputer / PC', icon: <Monitor className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'odf': { label: 'ODF Rack', icon: <HardDrive className="w-3.5 h-3.5" />, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  'patch-panel': { label: 'Patch Panel', icon: <SlidersHorizontal className="w-3.5 h-3.5" />, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  'ups': { label: 'UPS Power', icon: <Activity className="w-3.5 h-3.5" />, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  'other': { label: 'Other Device', icon: <Server className="w-3.5 h-3.5" />, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  'internet': { label: 'Gateway ISP', icon: <Radio className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' }
};

type SortField = 'code' | 'name' | 'type' | 'vendor' | 'model' | 'ip' | 'building' | 'status' | 'lastSeen';

export const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  // Data states
  const [devices, setDevices] = useState<Device[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Interactive Modals and Drawers
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<Device | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deviceForMaintenance, setDeviceForMaintenance] = useState<Device | null>(null);

  // Clipboard feedback
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Load buildings
  useEffect(() => {
    buildingService.getBuildings()
      .then(bList => setBuildings(bList))
      .catch(e => console.warn('Failed loading buildings:', e));
  }, []);

  // Fetch devices
  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await deviceService.getDevices({
        search: searchTerm,
        building_id: selectedBuilding,
        type: selectedType,
        status: selectedStatus,
        sort_by: sortField,
        sort_order: sortOrder
      });
      setDevices(res.data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data perangkat');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [searchTerm, selectedBuilding, selectedType, selectedStatus, sortField, sortOrder]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const warning = devices.filter(d => d.status === 'warning').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    return { total, online, warning, offline };
  }, [devices]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filtered & Paginated items
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return devices.slice(start, start + pageSize);
  }, [devices, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(devices.length / pageSize));

  // Copy IP
  const handleCopyIp = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // View on map action
  const handleViewOnMap = (device: Device) => {
    navigate(`/network-layout?building=${encodeURIComponent(device.buildingId)}&device=${encodeURIComponent(device.id)}`);
  };

  // View topology action
  const handleViewTopology = (device: Device) => {
    navigate(`/network-topology?device=${encodeURIComponent(device.id)}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Page Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  Devices Inventory
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {stats.total} Units
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manajemen inventaris perangkat switch, router, server, firewall, dan access point pabrik CBA.
              </p>
            </div>
          </div>

          {/* Header Action Buttons & Stats */}
          <div className="flex items-center gap-3">
            {/* Quick Status Badges */}
            <div className="hidden lg:flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {stats.online} Online
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {stats.warning} Warning
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {stats.offline} Offline
              </span>
            </div>

            <button
              onClick={() => fetchDevices()}
              disabled={isLoading}
              title="Muat ulang data perangkat"
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
            </button>

            {!isViewer ? (
              <button
                onClick={() => {
                  setDeviceToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer font-mono"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Perangkat</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Read-Only</span>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode, nama, IP, model, vendor..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Building */}
          <div>
            <select
              value={selectedBuilding}
              onChange={e => {
                setSelectedBuilding(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Semua Gedung Pabrik (All)</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Device Type */}
          <div>
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Semua Tipe Perangkat (All)</option>
              {Object.entries(DEVICE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Semua Status (All)</option>
              <option value="online">Online Normal</option>
              <option value="warning">Warning / Terganggu</option>
              <option value="offline">Offline / Mati</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content Container */}
      <div className="flex-1 overflow-auto p-6 flex flex-col justify-between">
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#0B132B]/60 shadow-xs dark:shadow-xl backdrop-blur-xs flex flex-col">
          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchDevices()}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-[11px] font-mono font-semibold text-red-600 dark:text-red-200 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider select-none">
                  {/* Device Code */}
                  <th 
                    onClick={() => handleSort('code')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Device Code</span>
                      {sortField === 'code' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Device Name */}
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Device Name</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Type */}
                  <th 
                    onClick={() => handleSort('type')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type</span>
                      {sortField === 'type' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Vendor */}
                  <th 
                    onClick={() => handleSort('vendor')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Vendor</span>
                      {sortField === 'vendor' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Model */}
                  <th 
                    onClick={() => handleSort('model')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Model</span>
                      {sortField === 'model' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* IP Address */}
                  <th 
                    onClick={() => handleSort('ip')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>IP Address</span>
                      {sortField === 'ip' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Building */}
                  <th 
                    onClick={() => handleSort('building')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Building</span>
                      {sortField === 'building' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Rack */}
                  <th className="py-3.5 px-4 font-semibold">Rack</th>

                  {/* Status */}
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Last Seen */}
                  <th 
                    onClick={() => handleSort('lastSeen')}
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Last Seen</span>
                      {sortField === 'lastSeen' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </th>

                  {/* Actions */}
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {/* Loading State Skeleton */}
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedDevices.length === 0 ? (
                  /* Empty State */
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                          <Server className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Tidak Ada Perangkat Ditemukan
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {searchTerm || selectedBuilding !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                            ? 'Tidak ada perangkat yang cocok dengan kriteria pencarian atau filter aktif.'
                            : 'Belum ada perangkat yang terdaftar di inventaris jaringan pabrik.'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {(searchTerm || selectedBuilding !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
                            <button
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedBuilding('all');
                                setSelectedType('all');
                                setSelectedStatus('all');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono transition-colors cursor-pointer"
                            >
                              Reset Filter
                            </button>
                          )}
                          {!isViewer && (
                            <button
                              onClick={() => {
                                setDeviceToEdit(null);
                                setIsFormModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-mono font-semibold shadow-md transition-colors cursor-pointer"
                            >
                              + Tambah Perangkat
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* Table Rows */
                  paginatedDevices.map(device => {
                    const typeConfig = DEVICE_TYPE_LABELS[device.type] || DEVICE_TYPE_LABELS.other;

                    return (
                      <tr 
                        key={device.id}
                        onClick={() => setSelectedDeviceForDetail(device)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Device Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {device.code || device.name}
                        </td>

                        {/* Device Name */}
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-200">
                          <span className="line-clamp-1">{device.name}</span>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${typeConfig.color}`}>
                            {typeConfig.icon}
                            <span>{typeConfig.label}</span>
                          </span>
                        </td>

                        {/* Vendor */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">
                          {device.vendor || device.brand || 'Generic'}
                        </td>

                        {/* Model */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <span className="line-clamp-1">{device.model}</span>
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="inline-flex items-center gap-1 text-slate-900 dark:text-slate-200">
                            <span>{device.ip}</span>
                            <button
                              type="button"
                              onClick={e => handleCopyIp(device.ip, e)}
                              title="Salin IP Address"
                              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {copiedIp === device.ip ? (
                                <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Building */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="line-clamp-1">{device.buildingName}</span>
                          </div>
                        </td>

                        {/* Rack */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {device.rackId ? 'Rack Mounted' : 'Standalone / Wall'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            device.status === 'online'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : device.status === 'warning'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              device.status === 'online' ? 'bg-emerald-500 animate-pulse' : device.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <span>{device.status}</span>
                          </span>
                        </td>

                        {/* Last Seen */}
                        <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                          {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Aktif'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            {/* View Detail */}
                            <button
                              type="button"
                              onClick={() => setSelectedDeviceForDetail(device)}
                              title="Lihat Detail & Ports"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* View on Map */}
                            <button
                              type="button"
                              onClick={() => handleViewOnMap(device)}
                              title="Lihat pada Denah Pabrik (View on Map)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Device */}
                            {!isViewer && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeviceToEdit(device);
                                  setIsFormModalOpen(true);
                                }}
                                title="Edit Perangkat"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Device */}
                            {!isViewer && (
                              <button
                                type="button"
                                onClick={() => setDeviceToDelete(device)}
                                title="Hapus Perangkat (Safe Delete)"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span>Menampilkan {devices.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, devices.length)} dari {devices.length} perangkat</span>
              
              {/* Page size selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Baris:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                Halaman {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Device Modal */}
      <DeviceFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={(saved) => {
          fetchDevices();
          if (selectedDeviceForDetail && selectedDeviceForDetail.id === saved.id) {
            setSelectedDeviceForDetail(saved);
          }
        }}
        deviceToEdit={deviceToEdit}
      />

      {/* Delete Confirmation Modal with Connection Checks */}
      <DeleteDeviceModal
        isOpen={!!deviceToDelete}
        device={deviceToDelete}
        onClose={() => setDeviceToDelete(null)}
        onDeleted={(deletedId) => {
          fetchDevices();
          if (selectedDeviceForDetail && selectedDeviceForDetail.id === deletedId) {
            setSelectedDeviceForDetail(null);
          }
        }}
      />

      {/* Device Detail Drawer (Right-side) */}
      {selectedDeviceForDetail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative h-full flex">
            <DeviceDrawer
              device={selectedDeviceForDetail}
              building={buildings.find(b => b.id === selectedDeviceForDetail.buildingId)}
              onClose={() => setSelectedDeviceForDetail(null)}
              onViewOnMap={handleViewOnMap}
              onViewTopology={handleViewTopology}
              onTraceConnection={(dev) => {
                navigate(`/network-layout?building=${encodeURIComponent(dev.buildingId)}&trace=true`);
              }}
              onEditDevice={(dev) => {
                setDeviceToEdit(dev);
                setIsFormModalOpen(true);
              }}
              onCreateMaintenance={(dev) => {
                setDeviceForMaintenance(dev);
              }}
            />
          </div>
        </div>
      )}

      {/* Create Maintenance Modal */}
      <CreateMaintenanceModal
        isOpen={!!deviceForMaintenance}
        onClose={() => setDeviceForMaintenance(null)}
        onSuccess={() => {
          setDeviceForMaintenance(null);
        }}
      />
    </div>
  );
};
