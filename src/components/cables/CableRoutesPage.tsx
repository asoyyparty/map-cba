import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CableRoute, Building, FiberCoreAllocation } from '../../types';
import { cableService } from '../../services/cableService';
import { CoreAllocationMatrix } from './CoreAllocationMatrix';
import { 
  GitCommit, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Layers, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  ChevronRight, 
  Building2, 
  Network, 
  ArrowRight, 
  Edit, 
  Trash2, 
  Info, 
  X, 
  Check, 
  FileText,
  Compass,
  Gauge,
  Cable
} from 'lucide-react';

export const CableRoutesPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  // Data state
  const [cables, setCables] = useState<CableRoute[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cores' | 'path' | 'info'>('cores');

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingCable, setEditingCable] = useState<CableRoute | null>(null);
  const [isAssignCoreModalOpen, setIsAssignCoreModalOpen] = useState<boolean>(false);
  const [targetCore, setTargetCore] = useState<FiberCoreAllocation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [cableToDelete, setCableToDelete] = useState<CableRoute | null>(null);

  // Form states
  const [cableForm, setCableForm] = useState({
    code: '',
    name: '',
    type: 'fiber' as 'fiber' | 'backbone' | 'utp',
    fromBuildingId: '',
    fromBuildingName: '',
    toBuildingId: '',
    toBuildingName: '',
    totalCores: 12,
    lengthMeters: 100,
    bandwidth: '10 Gbps',
    status: 'active' as 'active' | 'degraded' | 'broken' | 'normal' | 'maintenance',
    color: '#3b82f6',
    lineWidth: 3
  });

  const [coreForm, setCoreForm] = useState({
    status: 'connected' as 'connected' | 'reserved' | 'damaged' | 'available',
    service: '',
    sourceDevice: '',
    sourcePort: '',
    targetDevice: '',
    targetPort: '',
    attenuationDb: 0.35,
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load buildings
  useEffect(() => {
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setBuildings(data.data);
        }
      })
      .catch(err => console.error('Failed to load buildings:', err));
  }, []);

  // Load cables
  const loadCables = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await cableService.getCables({
        search: searchQuery,
        building_id: selectedBuilding,
        type: selectedType,
        status: selectedStatus
      });
      setCables(data);

      if (data.length > 0) {
        if (!selectedCableId || !data.some(c => c.id === selectedCableId)) {
          setSelectedCableId(data[0].id);
        }
      } else {
        setSelectedCableId(null);
      }
    } catch (err) {
      console.error('Failed to load cables:', err);
      showToast('error', 'Gagal memuat daftar rute kabel');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedBuilding, selectedType, selectedStatus, selectedCableId]);

  useEffect(() => {
    loadCables();
  }, [loadCables]);

  const selectedCable = useMemo(() => {
    return cables.find(c => c.id === selectedCableId) || null;
  }, [cables, selectedCableId]);

  // Statistics KPI Calculations
  const stats = useMemo(() => {
    const totalRoutes = cables.length;
    const totalLengthM = cables.reduce((acc, c) => acc + (Number(c.lengthMeters) || 0), 0);
    const totalCores = cables.reduce((acc, c) => acc + (Number(c.totalCores) || 0), 0);
    const usedCores = cables.reduce((acc, c) => acc + (Number(c.usedCores) || 0), 0);
    const utilizationPct = totalCores > 0 ? Math.round((usedCores / totalCores) * 100) : 0;
    const degradedCount = cables.filter(c => c.status === 'degraded' || c.status === 'broken').length;

    return {
      totalRoutes,
      totalLengthM,
      totalCores,
      usedCores,
      utilizationPct,
      degradedCount
    };
  }, [cables]);

  // Handle Add/Edit Cable Modal Open
  const handleOpenAddModal = () => {
    setEditingCable(null);
    setCableForm({
      code: `FO-${String(cables.length + 1).padStart(3, '0')}`,
      name: 'Backbone Fiber Optic Baru',
      type: 'fiber',
      fromBuildingId: buildings[0]?.id || '',
      fromBuildingName: buildings[0]?.name || '',
      toBuildingId: buildings[1]?.id || '',
      toBuildingName: buildings[1]?.name || '',
      totalCores: 12,
      lengthMeters: 120,
      bandwidth: '10 Gbps',
      status: 'active',
      color: '#3b82f6',
      lineWidth: 3
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (cable: CableRoute) => {
    setEditingCable(cable);
    setCableForm({
      code: cable.code,
      name: cable.name,
      type: (cable.type as any) || 'fiber',
      fromBuildingId: cable.fromBuildingId,
      fromBuildingName: cable.fromBuildingName || '',
      toBuildingId: cable.toBuildingId,
      toBuildingName: cable.toBuildingName || '',
      totalCores: cable.totalCores,
      lengthMeters: cable.lengthMeters,
      bandwidth: cable.bandwidth || '10 Gbps',
      status: (cable.status as any) || 'active',
      color: cable.color || '#3b82f6',
      lineWidth: cable.lineWidth || 3
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveCable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      showToast('error', 'Akses ditolak: Anda tidak memiliki izin untuk mengubah data kabel.');
      return;
    }
    if (!cableForm.code || !cableForm.name) {
      showToast('error', 'Kode dan nama rute kabel wajib diisi');
      return;
    }

    const fromBld = buildings.find(b => b.id === cableForm.fromBuildingId);
    const toBld = buildings.find(b => b.id === cableForm.toBuildingId);

    const payload = {
      ...cableForm,
      fromBuildingName: fromBld?.name || cableForm.fromBuildingName,
      toBuildingName: toBld?.name || cableForm.toBuildingName
    };

    if (editingCable) {
      const res = await cableService.updateCable(editingCable.id, payload);
      if (res.success) {
        showToast('success', res.message);
        setIsAddEditModalOpen(false);
        loadCables(true);
      } else {
        showToast('error', res.message);
      }
    } else {
      const res = await cableService.createCable(payload);
      if (res.success) {
        showToast('success', res.message);
        setIsAddEditModalOpen(false);
        if (res.data) {
          setSelectedCableId(res.data.id);
        }
        loadCables(true);
      } else {
        showToast('error', res.message);
      }
    }
  };

  // Handle Delete Cable
  const handleDeleteCable = async () => {
    if (!cableToDelete) return;
    if (isViewer) {
      showToast('error', 'Akses ditolak: Anda tidak memiliki izin untuk menghapus kabel.');
      return;
    }
    const res = await cableService.deleteCable(cableToDelete.id);
    if (res.success) {
      showToast('success', res.message);
      setIsDeleteModalOpen(false);
      setCableToDelete(null);
      loadCables();
    } else {
      showToast('error', res.message);
    }
  };

  // Handle Open Assign Core Modal
  const handleOpenAssignCore = (core: FiberCoreAllocation) => {
    setTargetCore(core);
    setCoreForm({
      status: core.status,
      service: core.service || '',
      sourceDevice: core.sourceDevice || '',
      sourcePort: core.sourcePort || '',
      targetDevice: core.targetDevice || '',
      targetPort: core.targetPort || '',
      attenuationDb: core.attenuationDb !== undefined ? core.attenuationDb : 0.35,
      notes: core.notes || ''
    });
    setIsAssignCoreModalOpen(true);
  };

  const handleSaveAssignCore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCable || !targetCore) return;
    if (isViewer) {
      showToast('error', 'Akses ditolak: Anda tidak memiliki izin untuk mengalokasikan core kabel.');
      return;
    }

    const res = await cableService.assignCore(selectedCable.id, {
      coreNumber: targetCore.coreNumber,
      status: coreForm.status,
      service: coreForm.service,
      sourceDevice: coreForm.sourceDevice,
      sourcePort: coreForm.sourcePort,
      targetDevice: coreForm.targetDevice,
      targetPort: coreForm.targetPort,
      attenuationDb: Number(coreForm.attenuationDb),
      notes: coreForm.notes,
      user: user?.fullName || user?.email
    });

    if (res.success) {
      showToast('success', res.message);
      setIsAssignCoreModalOpen(false);
      loadCables(true);
    } else {
      showToast('error', res.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Normal
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Degraded
          </span>
        );
      case 'broken':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" /> Terputus
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Layers className="w-3 h-3" /> Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-6 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
        }`}>
          {toastMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30">
              <Cable className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Manajemen Rute Kabel & Core FO
                {isViewer && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-normal">
                    Mode Read-Only (Viewer)
                  </span>
                )}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Infrastruktur kabel fiber optik, matriks alokasi core TIA-598-C, ODF patching, dan redaman optical (dB)
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => loadCables(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {!isViewer && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rute Kabel</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Routes */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Rute</span>
            <Network className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalRoutes}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Backbone & Distribusi</span>
        </div>

        {/* Total Fiber Run */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Jarak FO</span>
            <Compass className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {stats.totalLengthM >= 1000
              ? `${(stats.totalLengthM / 1000).toFixed(2)} km`
              : `${stats.totalLengthM} m`}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Kabel Terbentang</span>
        </div>

        {/* Total Cores */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Kapasitas Core</span>
            <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalCores} C</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Total Optical Core</span>
        </div>

        {/* Used Cores */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Core Terpakai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.usedCores} C</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Patching Aktif</span>
        </div>

        {/* Utilization % */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Utilisasi Core</span>
            <Gauge className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.utilizationPct}%</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.utilizationPct)}%` }}
            />
          </div>
        </div>

        {/* Optical Health Status */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Kondisi Optik</span>
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold flex items-center gap-1.5">
            {stats.degradedCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 text-base">Semua Sehat</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">{stats.degradedCount} Gangguan</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {stats.degradedCount === 0 ? 'Loss redaman normal' : 'Perlu inspeksi OTDR'}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs dark:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari kode rute, nama jalur, atau gedung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs md:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Building Filter */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Gedung</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Tipe Kabel</option>
            <option value="fiber">Fiber Optic (Single/Multi Mode)</option>
            <option value="backbone">Backbone Trunk</option>
            <option value="utp">UTP / Ethernet Copper</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Normal / Active</option>
            <option value="degraded">Degraded (High Loss)</option>
            <option value="broken">Broken / Cut</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {/* Reset Filters */}
          {(searchQuery || selectedBuilding !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBuilding('all');
                setSelectedType('all');
                setSelectedStatus('all');
              }}
              className="px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cable Routes List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Cable className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Daftar Rute Kabel ({cables.length})
            </h3>
            <span className="text-xs text-slate-500">Pilih untuk detail ODF</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-3" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : cables.length === 0 ? (
            <div className="bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
              <Network className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Tidak ada rute kabel ditemukan</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba sesuaikan filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {cables.map((c) => {
                const isSelected = c.id === selectedCableId;
                const usedCores = Number(c.usedCores) || 0;
                const totalCores = Number(c.totalCores) || 12;
                const utilPct = Math.round((usedCores / totalCores) * 100);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCableId(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-slate-850 border-indigo-400 dark:border-indigo-500/70 shadow-sm ring-1 ring-indigo-400/50 dark:ring-indigo-500/30'
                        : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850/60'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {c.code}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">
                            {c.type}
                          </span>
                          {c.bandwidth && (
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 px-1.5 py-0.2 rounded font-mono">
                              {c.bandwidth}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mt-1.5 line-clamp-1">
                          {c.name}
                        </h4>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>

                    {/* From / To Endpoints */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{c.fromBuildingName || 'Origin'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{c.toBuildingName || 'Destinasi'}</span>
                    </div>

                    {/* Core Utilization & Length */}
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          Core: <strong className="text-slate-800 dark:text-slate-200">{usedCores}/{totalCores}</strong> ({utilPct}%)
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">|</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Jarak: <strong className="text-slate-800 dark:text-slate-200">{c.lengthMeters} m</strong>
                        </span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {c.attenuationDb !== undefined ? `${c.attenuationDb} dB` : ''}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilPct > 85 ? 'bg-rose-500' : utilPct > 65 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-indigo-600 dark:bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, utilPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Cable Details & Core Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCable ? (
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs dark:shadow-sm space-y-5">
              {/* Cable Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 px-2.5 py-0.5 rounded">
                      {selectedCable.code}
                    </span>
                    {getStatusBadge(selectedCable.status)}
                    <span className="text-xs text-slate-600 dark:text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Tipe: {selectedCable.type}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedCable.name}
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-slate-700 dark:text-slate-300">{selectedCable.fromBuildingName}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{selectedCable.toBuildingName}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>Panjang: <strong className="text-slate-800 dark:text-slate-200">{selectedCable.lengthMeters} m</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>Kapasitas: <strong className="text-slate-800 dark:text-slate-200">{selectedCable.bandwidth || '10 Gbps'}</strong></span>
                  </div>
                </div>

                {/* Cable Action Buttons (Edit & Delete) */}
                {!isViewer && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedCable)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Edit Rute</span>
                    </button>
                    <button
                      onClick={() => {
                        setCableToDelete(selectedCable);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition-colors"
                      title="Hapus Rute Kabel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Detail Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('cores')}
                  className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'cores'
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Matriks Alokasi Core ({selectedCable.coreAllocations?.length || selectedCable.totalCores || 12})
                </button>
                <button
                  onClick={() => setActiveTab('path')}
                  className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'path'
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Koordinat Jalur ({selectedCable.path?.length || 0} Waypoint)
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'info'
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Spesifikasi Teknis
                </button>
              </div>

              {/* Tab 1: Core Allocation Matrix */}
              {activeTab === 'cores' && (
                <div>
                  <CoreAllocationMatrix
                    cable={selectedCable}
                    onEditCore={handleOpenAssignCore}
                    isReadOnly={isViewer}
                  />
                </div>
              )}

              {/* Tab 2: Path Waypoints */}
              {activeTab === 'path' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Visualisasi Titik Koordinat Jalur Pada Base Map Pabrik
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Jalur ini digambar dan dirender overlay SVG di peta interaktif Network Layout pabrik CBA.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedCable.path && selectedCable.path.length > 0 ? (
                        selectedCable.path.map((pt, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-mono">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold block">P-{idx + 1}</span>
                            <span className="text-slate-700 dark:text-slate-300">X: {pt.x}</span>, <span className="text-slate-700 dark:text-slate-300">Y: {pt.y}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-4 text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                          Belum ada data koordinat waypoint jalur. Gunakan tool gambar di Interactive Layout untuk memplot.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Technical Specs */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Karakteristik Kabel</h4>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Tipe Media:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{selectedCable.type} (G.652D OS2)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Total Panjang:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCable.lengthMeters} meter</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Bandwidth Backbone:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCable.bandwidth || '10 Gbps'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Standard Pewarnaan:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">TIA-598-C (12 Coring Tubes)</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Kondisi & Audit Optik</h4>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Kondisi Jalur:</span>
                      <span>{getStatusBadge(selectedCable.status)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Rata-rata Redaman:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCable.attenuationDb || 0.35} dB</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Warna Garis Map:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700" style={{ backgroundColor: selectedCable.color || '#3b82f6' }} />
                        <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCable.color || '#3b82f6'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Tebal Garis Map:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCable.lineWidth || 3} px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
              <Cable className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">Pilih Jalur Kabel</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Pilih salah satu rute kabel di panel sebelah kiri untuk menampilkan visualisasi ODF core matrix dan alokasi port.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add/Edit Cable Route */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Cable className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {editingCable ? 'Edit Rute Kabel' : 'Tambah Rute Kabel Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCable} className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Kode Rute *</label>
                  <input
                    type="text"
                    required
                    value={cableForm.code}
                    onChange={(e) => setCableForm({ ...cableForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: FO-006"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Tipe Kabel</label>
                  <select
                    value={cableForm.type}
                    onChange={(e) => setCableForm({ ...cableForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="fiber">Fiber Optic</option>
                    <option value="backbone">Backbone Trunk</option>
                    <option value="utp">UTP Copper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Nama Rute *</label>
                <input
                  type="text"
                  required
                  value={cableForm.name}
                  onChange={(e) => setCableForm({ ...cableForm, name: e.target.value })}
                  placeholder="Contoh: Backbone FO: Kantor Utama → Gedung E"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Gedung Asal (Origin)</label>
                  <select
                    value={cableForm.fromBuildingId}
                    onChange={(e) => {
                      const bld = buildings.find(b => b.id === e.target.value);
                      setCableForm({
                        ...cableForm,
                        fromBuildingId: e.target.value,
                        fromBuildingName: bld?.name || ''
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Gedung Tujuan (Destination)</label>
                  <select
                    value={cableForm.toBuildingId}
                    onChange={(e) => {
                      const bld = buildings.find(b => b.id === e.target.value);
                      setCableForm({
                        ...cableForm,
                        toBuildingId: e.target.value,
                        toBuildingName: bld?.name || ''
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Total Cores</label>
                  <select
                    value={cableForm.totalCores}
                    onChange={(e) => setCableForm({ ...cableForm, totalCores: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="6">6 Core</option>
                    <option value="12">12 Core</option>
                    <option value="24">24 Core</option>
                    <option value="48">48 Core</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Panjang (m)</label>
                  <input
                    type="number"
                    value={cableForm.lengthMeters}
                    onChange={(e) => setCableForm({ ...cableForm, lengthMeters: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Bandwidth</label>
                  <input
                    type="text"
                    value={cableForm.bandwidth}
                    onChange={(e) => setCableForm({ ...cableForm, bandwidth: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Status Rute</label>
                  <select
                    value={cableForm.status}
                    onChange={(e) => setCableForm({ ...cableForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active (Normal)</option>
                    <option value="degraded">Degraded (High Loss)</option>
                    <option value="broken">Broken / Cut</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Warna Garis Map</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cableForm.color}
                      onChange={(e) => setCableForm({ ...cableForm, color: e.target.value })}
                      className="w-10 h-9 p-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cableForm.color}
                      onChange={(e) => setCableForm({ ...cableForm, color: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  {editingCable ? 'Simpan Perubahan' : 'Buat Rute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Optical Core */}
      {isAssignCoreModalOpen && targetCore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm inline-block"
                  style={{ backgroundColor: targetCore.colorHex }}
                />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Alokasi Core #{targetCore.coreNumber} ({targetCore.colorName})
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {selectedCable?.code} • Tube {targetCore.tubeNumber || Math.ceil(targetCore.coreNumber / 12)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAssignCoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignCore} className="p-6 space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Status Core *</label>
                <select
                  value={coreForm.status}
                  onChange={(e) => setCoreForm({ ...coreForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="connected">Aktif Digunakan (Connected)</option>
                  <option value="reserved">Cadangan / Standby (Reserved)</option>
                  <option value="available">Tersedia / Kosong (Available)</option>
                  <option value="damaged">Rusak / High Loss (Damaged)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Service / Fungsi Jalur</label>
                <input
                  type="text"
                  value={coreForm.service}
                  onChange={(e) => setCoreForm({ ...coreForm, service: e.target.value })}
                  placeholder="Contoh: Primary Backbone Trunk VLAN 10,20"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Source Device</label>
                  <input
                    type="text"
                    value={coreForm.sourceDevice}
                    onChange={(e) => setCoreForm({ ...coreForm, sourceDevice: e.target.value })}
                    placeholder="Contoh: SW-KU-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Source Port</label>
                  <input
                    type="text"
                    value={coreForm.sourcePort}
                    onChange={(e) => setCoreForm({ ...coreForm, sourcePort: e.target.value })}
                    placeholder="Contoh: SFP+1"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Target Device</label>
                  <input
                    type="text"
                    value={coreForm.targetDevice}
                    onChange={(e) => setCoreForm({ ...coreForm, targetDevice: e.target.value })}
                    placeholder="Contoh: SW-A-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Target Port</label>
                  <input
                    type="text"
                    value={coreForm.targetPort}
                    onChange={(e) => setCoreForm({ ...coreForm, targetPort: e.target.value })}
                    placeholder="Contoh: SFP+1"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Redaman Optik (dB)</label>
                <input
                  type="number"
                  step="0.01"
                  value={coreForm.attenuationDb}
                  onChange={(e) => setCoreForm({ ...coreForm, attenuationDb: parseFloat(e.target.value) || 0 })}
                  placeholder="0.35"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Nilai normal single-mode standard: 0.20 - 0.50 dB. Di atas 2.5 dB ditandai degradasi.
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-400 mb-1">Catatan Tambahan / OTDR</label>
                <textarea
                  rows={2}
                  value={coreForm.notes}
                  onChange={(e) => setCoreForm({ ...coreForm, notes: e.target.value })}
                  placeholder="Catatan OTDR, lokasi patch panel, dsb..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignCoreModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  Simpan Alokasi Core
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {isDeleteModalOpen && cableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4 text-slate-900 dark:text-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Hapus Rute Kabel?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus rute kabel <strong className="text-slate-800 dark:text-slate-200">{cableToDelete.code}</strong> ({cableToDelete.name})? Seluruh data alokasi core pada rute ini akan dihapus.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCableToDelete(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteCable}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer"
              >
                Hapus Rute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
