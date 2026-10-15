import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building, Device, Rack, CableRoute, Alert, BuildingCategoryItem } from '../../types';
import { buildingService, BuildingInfrastructureDetail } from '../../services/buildingService';
import { buildingCategoryService } from '../../services/buildingCategoryService';
import { getNextBuildingCode } from '../../utils/buildingCodeHelper';
import { CategoryManagerModal } from './CategoryManagerModal';
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  LayoutGrid, 
  Table as TableIcon, 
  Server, 
  Layers, 
  Users, 
  Network, 
  ArrowRight, 
  Edit, 
  Trash2, 
  MapPin, 
  Compass, 
  ExternalLink, 
  Activity, 
  X, 
  Check, 
  Radio, 
  Cable,
  HardDrive,
  Info,
  Shield,
  Zap,
  Settings2
} from 'lucide-react';

export const BuildingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  // State
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Drawer state
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<BuildingInfrastructureDetail | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'devices' | 'racks' | 'cables' | 'alerts'>('overview');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<BuildingCategoryItem[]>([]);

  useEffect(() => {
    buildingCategoryService.getCategories().then(setCategories);
  }, []);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'production' as any,
    status: 'healthy' as 'healthy' | 'warning' | 'critical',
    headIT: 'Budi Santoso',
    lokasi: 'Area Pabrik Barat',
    koordinat: 'Zona Plant 1',
    mainSwitch: 'SW-DIST-01',
    apCount: 2,
    portCount: 24,
    connectedUsers: 25,
    backboneFrom: 'Kantor Utama',
    backboneCable: 'FO-001',
    backboneCore: 'Core 1-2',
    backboneSpeed: '10 Gbps',
    backboneStatus: 'normal',
    description: '',
    imageUrl: ''
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Load buildings
  const loadBuildings = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await buildingService.getBuildings({
        search: searchQuery,
        category: selectedCategory,
        status: selectedStatus
      });
      setBuildings(data);
    } catch (err: any) {
      showToast('error', 'Gagal memuat data gedung');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Initial load
  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  // 2. Load Drawer detail
  const loadDrawerDetail = useCallback(async (bldId: string) => {
    setIsDrawerLoading(true);
    try {
      const detail = await buildingService.getBuildingById(bldId);
      setDrawerDetail(detail);
    } catch (err: any) {
      showToast('error', 'Gagal memuat detail infrastruktur gedung');
    } finally {
      setIsDrawerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      loadDrawerDetail(selectedBuildingId);
    } else {
      setDrawerDetail(null);
    }
  }, [selectedBuildingId, loadDrawerDetail]);

  const openDrawer = (bld: Building) => {
    setSelectedBuildingId(bld.id);
    setDrawerTab('overview');
  };

  const closeDrawer = () => {
    setSelectedBuildingId(null);
    setDrawerDetail(null);
  };

  // 3. Stats calculation
  const stats = useMemo(() => {
    const total = buildings.length;
    const healthy = buildings.filter(b => b.status === 'healthy').length;
    const warning = buildings.filter(b => b.status === 'warning' || b.status === 'critical').length;
    const devices = buildings.reduce((acc, b) => acc + (Number(b.totalDevices) || 0), 0);
    const racks = buildings.reduce((acc, b) => acc + (Number(b.racksCount) || 0), 0);
    const users = buildings.reduce((acc, b) => acc + (Number(b.connectedUsers) || 0), 0);

    return { total, healthy, warning, devices, racks, users };
  }, [buildings]);

  // 4. Modal handlers
  const handleOpenAddModal = () => {
    const nextCode = getNextBuildingCode(buildings);
    setEditingBuilding(null);
    setForm({
      code: nextCode,
      name: `Gedung ${nextCode.replace('GD-', '')}`,
      category: (categories[0]?.id as any) || 'production',
      status: 'healthy',
      headIT: 'Budi Santoso',
      lokasi: 'Area Pabrik',
      koordinat: 'Zona Plant',
      mainSwitch: 'SW-DIST-01',
      apCount: 2,
      portCount: 24,
      connectedUsers: 20,
      backboneFrom: 'Kantor Utama',
      backboneCable: 'FO-001',
      backboneCore: 'Core 1-2',
      backboneSpeed: '10 Gbps',
      backboneStatus: 'normal',
      description: '',
      imageUrl: ''
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (bld: Building) => {
    setEditingBuilding(bld);
    setForm({
      code: bld.code,
      name: bld.name,
      category: bld.category || 'production',
      status: bld.status || 'healthy',
      headIT: bld.headIT || '',
      lokasi: bld.lokasi || '',
      koordinat: bld.koordinat || '',
      mainSwitch: bld.mainSwitch || '',
      apCount: bld.apCount || 0,
      portCount: bld.portCount || 0,
      connectedUsers: bld.connectedUsers || 0,
      backboneFrom: bld.backboneFrom || 'Kantor Utama',
      backboneCable: bld.backboneCable || '',
      backboneCore: bld.backboneCore || 'Core 1-2',
      backboneSpeed: bld.backboneSpeed || '10 Gbps',
      backboneStatus: bld.backboneStatus || 'normal',
      description: bld.description || '',
      imageUrl: bld.imageUrl || ''
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      showToast('error', 'Akses ditolak: Anda tidak memiliki izin untuk mengubah data gedung.');
      return;
    }
    if (!form.code || !form.name) {
      showToast('error', 'Kode dan nama gedung wajib diisi');
      return;
    }

    if (editingBuilding) {
      const res = await buildingService.updateBuilding(editingBuilding.id, form);
      if (res.success) {
        showToast('success', res.message);
        setIsAddEditModalOpen(false);
        loadBuildings(true);
        if (selectedBuildingId === editingBuilding.id) {
          openDrawer(editingBuilding);
        }
      } else {
        showToast('error', res.message);
      }
    } else {
      const res = await buildingService.createBuilding(form);
      if (res.success) {
        showToast('success', res.message);
        setIsAddEditModalOpen(false);
        loadBuildings(true);
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleDeleteBuilding = async () => {
    if (!buildingToDelete) return;
    if (isViewer) {
      showToast('error', 'Akses ditolak: Anda tidak memiliki izin untuk menghapus gedung.');
      return;
    }
    const res = await buildingService.deleteBuilding(buildingToDelete.id);
    if (res.success) {
      showToast('success', res.message);
      setIsDeleteModalOpen(false);
      setBuildingToDelete(null);
      if (selectedBuildingId === buildingToDelete.id) {
        closeDrawer();
      }
      loadBuildings();
    } else {
      showToast('error', res.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Normal
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" /> Kritis
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { label: string; color: string }> = {
      office: { label: 'Perkantoran', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
      production: { label: 'Produksi', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
      warehouse: { label: 'Gudang', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
      lab: { label: 'Laboratorium', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
      utility: { label: 'Utilitas', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
      security: { label: 'Keamanan', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
    };
    const c = map[category] || { label: category, color: 'bg-slate-700 text-slate-300 border-slate-600' };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${c.color} uppercase tracking-wider`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-6 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm animate-in slide-in-from-top-3 duration-300 max-w-[90vw] ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50'
            : 'bg-rose-950/95 text-rose-200 border-rose-500/50'
        }`}>
          {toastMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Manajemen Fasilitas & Gedung
                {isViewer && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-normal">
                    Mode Read-Only (Viewer)
                  </span>
                )}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Inventaris gedung kawasan industri PT. CBA Chemical Industry, panel distribusi, backbone serat optik, dan perangkat IT
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Tampilan Tabel Data"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => loadBuildings(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Refresh</span>
          </button>

          {!isViewer && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Gedung</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Buildings */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Fasilitas</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.total} Gedung</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Kawasan Pabrik CBA</span>
        </div>

        {/* Healthy */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Gedung Normal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.healthy}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Jaringan Stabil</span>
        </div>

        {/* Warning / Issue */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Perlu Perhatian</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.warning}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Ada Anomali/Loss</span>
        </div>

        {/* Total Devices */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Perangkat IT</span>
            <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.devices} Unit</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Switch, Router, AP</span>
        </div>

        {/* Total Racks */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Server Racks</span>
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400">{stats.racks} Kabinet</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Rack 42U & 24U</span>
        </div>

        {/* Total Connected Users */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Klien Aktif</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.users}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">User & Terminal PLC</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode gedung, nama, lokasi, atau penanggung jawab IT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs md:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="healthy">Normal / Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          {/* Reset Filters */}
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      ) : buildings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
          <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tidak ada data gedung ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">Sesuaikan kriteria filter atau kata kunci pencarian Anda.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 hover:border-blue-400 dark:hover:border-slate-700 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-700/50 px-2.5 py-0.5 rounded">
                      {b.code}
                    </span>
                    {getCategoryBadge(b.category)}
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                {/* Building Name & Location */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {b.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span>{b.lokasi || b.koordinat || 'Kawasan Pabrik CBA'}</span>
                  </p>
                </div>

                {/* Description if any */}
                {b.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                )}

                {/* Mini Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Perangkat</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{b.totalDevices}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Server Racks</span>
                    <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{b.racksCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Connected</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{b.connectedUsers}</span>
                  </div>
                </div>

                {/* Backbone Link Info */}
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Cable className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Backbone Link:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-300 font-mono">
                      {b.backboneCable || 'N/A'} ({b.backboneSpeed || '10G'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Network className="w-3 h-3 text-emerald-400" /> Switch Utama:
                    </span>
                    <span className="font-medium text-slate-300 font-mono">
                      {b.mainSwitch || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openDrawer(b)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-all flex items-center gap-1"
                  >
                    <span>Infrastruktur</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate(`/network-layout?building=${encodeURIComponent(b.id)}`)}
                    className="p-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
                    title="Buka Pada Interactive Layout Peta"
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!isViewer && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      className="p-1.5 text-xs rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                      title="Edit Gedung"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setBuildingToDelete(b);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-xs rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Hapus Gedung"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Gedung / Fasilitas</th>
                  <th className="py-3.5 px-3">Kategori</th>
                  <th className="py-3.5 px-3">Area Pabrik</th>
                  <th className="py-3.5 px-3">Penanggung Jawab</th>
                  <th className="py-3.5 px-3 text-center">Perangkat</th>
                  <th className="py-3.5 px-3 text-center">Rak</th>
                  <th className="py-3.5 px-4">Switch Distribusi</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {buildings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => openDrawer(b)}
                  >
                    {/* Building Name & Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 px-2 py-0.5 rounded">
                          {b.code}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{b.name}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ID: {b.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      {getCategoryBadge(b.category)}
                    </td>

                    {/* Lokasi */}
                    <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                      {b.lokasi || b.koordinat || '-'}
                    </td>

                    {/* Head IT */}
                    <td className="py-3 px-3 text-xs text-slate-800 dark:text-slate-300">
                      {b.headIT || '-'}
                    </td>

                    {/* Devices Count */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-900 dark:text-white">
                      {b.totalDevices}
                    </td>

                    {/* Racks Count */}
                    <td className="py-3 px-3 text-center font-semibold text-sky-600 dark:text-sky-400">
                      {b.racksCount}
                    </td>

                    {/* Main Switch & Backbone */}
                    <td className="py-3 px-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                      <div>{b.mainSwitch || '-'}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{b.backboneCable || 'FO-001'}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {getStatusBadge(b.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDrawer(b)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Lihat Detail Infrastruktur"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/network-layout?building=${encodeURIComponent(b.id)}`)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Lihat di Layout Peta"
                        >
                          <Compass className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(b)}
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Gedung"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setBuildingToDelete(b);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus Gedung"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL INSPECTION DRAWER */}
      {selectedBuildingId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700/50 px-2.5 py-1 rounded">
                  {drawerDetail?.code || 'BLD'}
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {drawerDetail?.name || 'Memuat...'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {drawerDetail && getCategoryBadge(drawerDetail.category)}
                    {drawerDetail && getStatusBadge(drawerDetail.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/network-layout?building=${encodeURIComponent(selectedBuildingId)}`)}
                  className="p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Buka di Peta Layout"
                >
                  <Compass className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <span className="hidden sm:inline">Peta</span>
                </button>
                <button
                  onClick={closeDrawer}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/30 overflow-x-auto">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                Overview
              </button>
              <button
                onClick={() => setDrawerTab('devices')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  drawerTab === 'devices'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Perangkat ({drawerDetail?.devices?.length || drawerDetail?.totalDevices || 0})
              </button>
              <button
                onClick={() => setDrawerTab('racks')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  drawerTab === 'racks'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Server Racks ({drawerDetail?.racks?.length || drawerDetail?.racksCount || 0})
              </button>
              <button
                onClick={() => setDrawerTab('cables')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  drawerTab === 'cables'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Cable className="w-3.5 h-3.5" />
                Jalur FO ({drawerDetail?.cables?.length || 0})
              </button>
              <button
                onClick={() => setDrawerTab('alerts')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  drawerTab === 'alerts'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Alerts ({drawerDetail?.alerts?.length || 0})
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isDrawerLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-24 bg-slate-800/50 rounded-xl" />
                  <div className="h-32 bg-slate-800/50 rounded-xl" />
                </div>
              ) : drawerDetail ? (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {drawerTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Location & PIC Card */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Area Pabrik / Zona</span>
                          <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            {drawerDetail.lokasi || drawerDetail.koordinat || 'Plant CBA West'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">Penanggung Jawab IT</span>
                          <span className="text-sm font-medium text-slate-200 mt-0.5 block">
                            {drawerDetail.headIT || 'Budi Santoso'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">Switch Distribusi Utama</span>
                          <span className="text-sm font-mono text-slate-200 mt-0.5 block">
                            {drawerDetail.mainSwitch || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">Uplink Asal (Backbone)</span>
                          <span className="text-sm font-medium text-slate-200 mt-0.5 block">
                            {drawerDetail.backboneFrom || 'Kantor Utama'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Deskripsi & Fungsi Fasilitas
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {drawerDetail.description || 'Tidak ada deskripsi detail untuk gedung ini.'}
                        </p>
                      </div>

                      {/* Quick Navigation Links */}
                      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Akses Cepat Modul Terkait
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            onClick={() => navigate(`/devices?building_id=${encodeURIComponent(drawerDetail.id)}`)}
                            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left flex items-center justify-between"
                          >
                            <span>Daftar Perangkat</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/racks?building_id=${encodeURIComponent(drawerDetail.id)}`)}
                            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left flex items-center justify-between"
                          >
                            <span>Server Racks</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/network-topology?building=${encodeURIComponent(drawerDetail.code)}`)}
                            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left flex items-center justify-between"
                          >
                            <span>Bagan Topologi</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/cable-routes?building_id=${encodeURIComponent(drawerDetail.id)}`)}
                            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left flex items-center justify-between"
                          >
                            <span>Rute Kabel Optik</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DEVICES */}
                  {drawerTab === 'devices' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                          Daftar Perangkat di {drawerDetail.name} ({drawerDetail.devices?.length || 0})
                        </span>
                        <button
                          onClick={() => navigate(`/devices?building_id=${encodeURIComponent(drawerDetail.id)}`)}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Buka di Devices</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {drawerDetail.devices && drawerDetail.devices.length > 0 ? (
                        <div className="space-y-2">
                          {drawerDetail.devices.map((dev: any) => (
                            <div
                              key={dev.id}
                              className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                  dev.status === 'online' ? 'bg-emerald-400' :
                                  dev.status === 'warning' ? 'bg-amber-400' : 'bg-rose-500'
                                }`} />
                                <div>
                                  <div className="font-semibold text-slate-200">{dev.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {dev.ip} • {dev.type}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {dev.ports_active || 0}/{dev.ports_total || 24} Ports
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          Belum ada perangkat terpasang di gedung ini.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: RACKS */}
                  {drawerTab === 'racks' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                          Kabinet Rack di {drawerDetail.name} ({drawerDetail.racks?.length || 0})
                        </span>
                        <button
                          onClick={() => navigate(`/racks?building_id=${encodeURIComponent(drawerDetail.id)}`)}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Buka di Racks</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {drawerDetail.racks && drawerDetail.racks.length > 0 ? (
                        <div className="space-y-2">
                          {drawerDetail.racks.map((rack: any) => (
                            <div
                              key={rack.id}
                              className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-mono text-indigo-300 font-bold block">{rack.code}</span>
                                <span className="font-medium text-slate-200">{rack.name}</span>
                                <span className="text-[11px] text-slate-500 block">{rack.room}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-sky-400 font-mono block">
                                  {rack.u_capacity || 24}U
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Terpakai: {rack.used_u || 0}U
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          Belum ada kabinet rack server di gedung ini.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: CABLES */}
                  {drawerTab === 'cables' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                          Rute Kabel Serat Optik Terhubung ({drawerDetail.cables?.length || 0})
                        </span>
                        <button
                          onClick={() => navigate(`/cable-routes?building_id=${encodeURIComponent(drawerDetail.id)}`)}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Buka di Cable Routes</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {drawerDetail.cables && drawerDetail.cables.length > 0 ? (
                        <div className="space-y-2">
                          {drawerDetail.cables.map((c: any) => (
                            <div
                              key={c.id}
                              className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-indigo-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                  {c.code}
                                </span>
                                <span className="font-mono text-slate-400">{c.attenuation_db || 0.35} dB</span>
                              </div>
                              <div className="font-medium text-slate-200">{c.name}</div>
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <span>{c.from_building_name}</span>
                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                <span>{c.to_building_name}</span>
                                <span className="text-slate-600">•</span>
                                <span>{c.length_meters} m</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          Belum ada data kabel optik terdaftar untuk gedung ini.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: ALERTS */}
                  {drawerTab === 'alerts' && (
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-slate-400 block">
                        Riwayat Gangguan & Peringatan Aktif ({drawerDetail.alerts?.length || 0})
                      </span>

                      {drawerDetail.alerts && drawerDetail.alerts.length > 0 ? (
                        <div className="space-y-2">
                          {drawerDetail.alerts.map((alt: any) => (
                            <div
                              key={alt.id}
                              className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">{alt.title}</span>
                                <span className="text-[10px] text-slate-500">{alt.time_ago || 'Baru'}</span>
                              </div>
                              <p className="text-slate-400 text-[11px]">{alt.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          Tidak ada gangguan atau alert aktif pada gedung ini.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BUILDING */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {editingBuilding ? 'Edit Fasilitas Gedung' : 'Tambah Fasilitas Gedung Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuilding} className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kode Gedung *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: K atau MTC"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kategori Fasilitas</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      title="Kelola Daftar Kategori Gedung"
                    >
                      <Settings2 className="w-3 h-3" />
                      <span>Kelola</span>
                    </button>
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      if (e.target.value === '__manage__') {
                        setIsCategoryModalOpen(true);
                      } else {
                        setForm({ ...form, category: e.target.value as any });
                      }
                    }}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="__manage__" className="text-indigo-500 font-semibold">
                      + Kelola Kategori...
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Gedung *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Gedung K (Gudang Bahan Baku)"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Area / Lokasi Pabrik</label>
                  <input
                    type="text"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    placeholder="Contoh: Zona Pabrik Barat"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Penanggung Jawab IT (PIC)</label>
                  <input
                    type="text"
                    value={form.headIT}
                    onChange={(e) => setForm({ ...form, headIT: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Switch Distribusi Utama</label>
                  <input
                    type="text"
                    value={form.mainSwitch}
                    onChange={(e) => setForm({ ...form, mainSwitch: e.target.value })}
                    placeholder="Contoh: SW-DIST-K-01"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Kesehatan Jaringan</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="healthy">Normal (Healthy)</option>
                    <option value="warning">Peringatan (Warning)</option>
                    <option value="critical">Kritis (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Uplink Asal (Backbone From)</label>
                  <input
                    type="text"
                    value={form.backboneFrom}
                    onChange={(e) => setForm({ ...form, backboneFrom: e.target.value })}
                    placeholder="Kantor Utama"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kabel Backbone FO</label>
                  <input
                    type="text"
                    value={form.backboneCable}
                    onChange={(e) => setForm({ ...form, backboneCable: e.target.value })}
                    placeholder="Contoh: FO-006"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Fasilitas</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi kegiatan produksi atau fasilitas di gedung ini..."
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  {editingBuilding ? 'Simpan Perubahan' : 'Tambah Gedung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {isDeleteModalOpen && buildingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 text-slate-900 dark:text-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Hapus Gedung & Relasi Data?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-slate-200">{buildingToDelete.name} ({buildingToDelete.code})</strong>?
                <br /><br />
                <span className="text-rose-600 dark:text-rose-400 font-semibold block">⚠️ Perhatian Relasi Data:</span>
                Tindakan ini akan <strong>otomatis menghapus semua data di dalamnya</strong> yang ada di menu lain:
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <li>Seluruh perangkat jaringan di gedung ini (menu Devices)</li>
                  <li>Seluruh rak IT & panel distribusi (menu Racks)</li>
                  <li>Seluruh rute kabel penghubung ke gedung ini (menu Cable Routes)</li>
                  <li>Data monitoring dan riwayat gangguan terkait (menu Monitoring & Alerts)</li>
                </ul>
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setBuildingToDelete(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteBuilding}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategorySelected={(newCat) => {
          setForm(prev => ({ ...prev, category: newCat.id as any }));
          buildingCategoryService.getCategories().then(setCategories);
        }}
        onCategoriesChanged={(cats) => {
          setCategories(cats);
        }}
      />
    </div>
  );
};
