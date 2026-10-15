import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HardDrive, 
  Plus, 
  Search, 
  Filter, 
  Server, 
  Building2, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  Lock, 
  Network,
  Activity,
  Layers,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { rackService, CreateRackPayload } from '../../services/rackService';
import { deviceService } from '../../services/deviceService';
import { buildingService } from '../../services/buildingService';
import { Rack, Device, Building } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RackElevationView } from './RackElevationView';
import { PortMatrixView } from './PortMatrixView';

export const RacksPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [racks, setRacks] = useState<Rack[]>([]);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [activeRackDetail, setActiveRackDetail] = useState<Rack | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [unmountedDevices, setUnmountedDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddRackOpen, setIsAddRackOpen] = useState<boolean>(false);
  const [isMountModalOpen, setIsMountModalOpen] = useState<boolean>(false);
  const [mountTargetU, setMountTargetU] = useState<number>(1);

  // Add Rack Form State
  const [rackForm, setRackForm] = useState<CreateRackPayload>({
    name: '',
    code: '',
    buildingId: '',
    buildingName: '',
    room: 'Panel IT',
    uCapacity: 24,
    maxPowerWatts: 2500,
    description: ''
  });

  // Mount Device Form State
  const [mountForm, setMountForm] = useState<{
    deviceId: string;
    uPosition: number;
    uHeight: number;
  }>({
    deviceId: '',
    uPosition: 1,
    uHeight: 1
  });

  // 1. Fetch racks & buildings
  const loadRacks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setRefreshing(true);
    try {
      const data = await rackService.getRacks({
        building_id: selectedBuilding,
        search: searchQuery
      });
      setRacks(data);

      // Auto select first rack if none selected or selected not in list
      if (data.length > 0) {
        if (!selectedRackId || !data.some(r => r.id === selectedRackId)) {
          setSelectedRackId(data[0].id);
        }
      } else {
        setSelectedRackId(null);
        setActiveRackDetail(null);
      }
    } catch (err) {
      console.error('Failed to load racks:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedBuilding, searchQuery, selectedRackId]);

  useEffect(() => {
    loadRacks();
  }, [loadRacks]);

  // Load buildings once
  useEffect(() => {
    buildingService.getBuildings().then(setBuildings).catch(console.warn);
  }, []);

  // 2. Fetch active rack detail whenever selectedRackId changes
  useEffect(() => {
    if (!selectedRackId) return;
    let isMounted = true;
    rackService.getRackById(selectedRackId).then(detail => {
      if (isMounted && detail) {
        setActiveRackDetail(detail);
        // Select first device of rack for port matrix preview if available
        if (detail.devices && detail.devices.length > 0) {
          setSelectedDevice(detail.devices[0]);
        } else {
          setSelectedDevice(null);
        }
      }
    }).catch(console.error);

    return () => { isMounted = false; };
  }, [selectedRackId]);

  // 3. Load unmounted devices for mounting modal
  const fetchUnmountedDevices = async () => {
    try {
      const res = await deviceService.getDevices({ page: 1, limit: 100 });
      // Devices not mounted to this rack or without rack_u_position
      const unmounted = res.data.filter((d: any) => !d.rack_u_position || d.rackId !== selectedRackId);
      setUnmountedDevices(unmounted);
    } catch (err) {
      console.error('Failed to fetch unmounted devices:', err);
    }
  };

  // Open Mount modal at specific U
  const handleOpenMountAtU = (u: number) => {
    if (isViewer) return;
    setMountTargetU(u);
    setMountForm({
      deviceId: '',
      uPosition: u,
      uHeight: 1
    });
    fetchUnmountedDevices();
    setIsMountModalOpen(true);
  };

  // Submit Mount Device
  const handleMountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRackId || isViewer) return;

    const res = await rackService.mountDevice(selectedRackId, {
      deviceId: mountForm.deviceId,
      uPosition: Number(mountForm.uPosition),
      uHeight: Number(mountForm.uHeight),
      authorName: user?.fullName || 'Admin IT',
      authorRole: user?.role || 'ADMIN'
    });

    if (res.success) {
      setIsMountModalOpen(false);
      // Reload active rack
      const updated = await rackService.getRackById(selectedRackId);
      if (updated) {
        setActiveRackDetail(updated);
        const newlyMounted = updated.devices?.find(d => d.id === mountForm.deviceId);
        if (newlyMounted) setSelectedDevice(newlyMounted);
      }
      loadRacks(true);
    } else {
      alert(res.message);
    }
  };

  // Submit Unmount Device
  const handleUnmountDevice = async (deviceId: string) => {
    if (!selectedRackId || isViewer) return;
    const res = await rackService.unmountDevice(
      selectedRackId, 
      deviceId, 
      user?.fullName || 'Admin IT', 
      user?.role || 'ADMIN'
    );
    if (res.success) {
      const updated = await rackService.getRackById(selectedRackId);
      if (updated) setActiveRackDetail(updated);
      if (selectedDevice?.id === deviceId) setSelectedDevice(null);
      loadRacks(true);
    } else {
      alert(res.message);
    }
  };

  // Submit Add Rack
  const handleAddRackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    const selectedBldObj = buildings.find(b => b.id === rackForm.buildingId);
    const res = await rackService.createRack({
      ...rackForm,
      buildingName: selectedBldObj ? selectedBldObj.name : rackForm.buildingName,
      authorName: user?.fullName || 'Admin IT',
      authorRole: user?.role || 'ADMIN'
    });

    if (res.success) {
      setIsAddRackOpen(false);
      loadRacks();
      if (res.data?.id) setSelectedRackId(res.data.id);
    } else {
      alert(res.message);
    }
  };

  // Delete Rack
  const handleDeleteRack = async (rack: Rack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isViewer) return;

    const res = await rackService.deleteRack(rack.id, false);
    if (res.requiresConfirmation) {
      if (confirm(`${res.message}\nApakah Anda yakin ingin melepas semua perangkat dan menghapus rack ini?`)) {
        const forceRes = await rackService.deleteRack(rack.id, true);
        if (forceRes.success) {
          loadRacks();
        } else {
          alert(forceRes.message);
        }
      }
    } else if (res.success) {
      loadRacks();
    } else {
      alert(res.message);
    }
  };

  // Overall KPI metrics
  const totalCapacityU = useMemo(() => racks.reduce((s, r) => s + (r.uCapacity || 0), 0), [racks]);
  const totalUsedU = useMemo(() => racks.reduce((s, r) => s + (r.usedU || 0), 0), [racks]);
  const totalFreeU = Math.max(0, totalCapacityU - totalUsedU);
  const avgOccupancy = totalCapacityU > 0 ? Math.round((totalUsedU / totalCapacityU) * 100) : 0;
  const totalPower = useMemo(() => racks.reduce((s, r) => s + (r.currentPowerWatts || 0), 0), [racks]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 min-h-screen overflow-y-auto transition-colors duration-200">
      {/* 1. Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B132B]/60 backdrop-blur-md px-6 py-4 sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <HardDrive className="w-3.5 h-3.5" />
            Data Center Cabinets & Front-Panel Ports
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Racks & Ports Management
            {isViewer && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1 font-normal">
                <Lock className="w-3 h-3" /> Read-Only (Viewer)
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualisasi fisik kabinet rak server 42U/24U kawasan pabrik CBA dan pemetaan port front-panel switch.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={() => loadRacks()}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
          </button>

          {!isViewer && (
            <button
              onClick={() => {
                setRackForm({
                  name: '',
                  code: '',
                  buildingId: buildings[0]?.id || '',
                  buildingName: buildings[0]?.name || '',
                  room: 'Panel IT',
                  uCapacity: 24,
                  maxPowerWatts: 2500,
                  description: ''
                });
                setIsAddRackOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rack Baru</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* 2. KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Total Racks */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <span>Total Racks</span>
              <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">{racks.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Kabinet aktif</div>
          </div>

          {/* Total Capacity U */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <span>Total Space</span>
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1.5">{totalCapacityU}U</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Kapasitas U rak</div>
          </div>

          {/* Used U */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <span>Occupied U</span>
              <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">{totalUsedU}U</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Unit terpasang</div>
          </div>

          {/* Free U */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <span>Free Space</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1.5">{totalFreeU}U</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Slot kosong tersedia</div>
          </div>

          {/* Occupancy Rate */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <span>Okupansi Rata-rata</span>
              <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1.5">{avgOccupancy}%</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Utilisasi kabinet</div>
          </div>

          {/* Total Power */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <span>Beban Daya</span>
              <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-400 mt-1.5">{totalPower}W</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Konsumsi listrik aktif</div>
          </div>
        </div>

        {/* 3. Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama rack, kode, ruang..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Building Filter */}
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Semua Gedung</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono self-end sm:self-center">
            Menampilkan <span className="text-slate-900 dark:text-white font-bold">{racks.length}</span> kabinet server
          </div>
        </div>

        {/* 4. Main Split Content (Left: Racks Cards list, Right: Elevation & Port Matrix) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Rack Cards List (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3 max-h-[820px] overflow-y-auto pr-1">
            {racks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                Tidak ada kabinet rack ditemukan.
              </div>
            ) : (
              racks.map(rack => {
                const isSelected = selectedRackId === rack.id;
                const occ = rack.occupancyPercent || 0;
                return (
                  <div
                    key={rack.id}
                    onClick={() => setSelectedRackId(rack.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative group ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-slate-900 border-blue-500/80 ring-1 ring-blue-500/50 shadow-md'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{rack.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                            {rack.uCapacity}U
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">{rack.name}</h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{rack.buildingName || rack.buildingId}</span>
                          <span className="text-slate-400 dark:text-slate-600">•</span>
                          <span>{rack.room}</span>
                        </div>
                      </div>

                      {!isViewer && (
                        <button
                          onClick={(e) => handleDeleteRack(rack, e)}
                          title="Hapus rack"
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Progress Bar of U occupancy */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
                        <span>Okupansi Space</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{rack.usedU}U / {rack.uCapacity}U ({occ}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            occ > 80 ? 'bg-rose-500' : occ > 50 ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(occ, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: 2D Elevation View + Interactive Port Matrix (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {activeRackDetail ? (
              <>
                {/* 2D Vertical Elevation */}
                <RackElevationView
                  rack={activeRackDetail}
                  selectedDeviceId={selectedDevice?.id}
                  onSelectDevice={(dev) => setSelectedDevice(dev)}
                  onMountAtU={handleOpenMountAtU}
                  onUnmountDevice={handleUnmountDevice}
                  isViewer={isViewer}
                />

                {/* Port Matrix Faceplate for Selected Device */}
                <PortMatrixView
                  device={selectedDevice}
                />
              </>
            ) : (
              <div className="p-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                Pilih kabinet rack di sebelah kiri untuk melihat visualisasi elevasi unit dan port switch.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. ADD RACK MODAL */}
      {/* ======================================================== */}
      {isAddRackOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tambah Kabinet Rack Baru</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registrasi rak data center atau panel distribusi</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRackOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRackSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nama Kabinet Rack *</label>
                <input
                  type="text"
                  required
                  value={rackForm.name}
                  onChange={(e) => setRackForm({ ...rackForm, name: e.target.value })}
                  placeholder="Contoh: Rack Gudang CF-02 (24U)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kode Rack *</label>
                  <input
                    type="text"
                    required
                    value={rackForm.code}
                    onChange={(e) => setRackForm({ ...rackForm, code: e.target.value.toUpperCase() })}
                    placeholder="RACK-A-02"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono uppercase text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kapasitas Unit (U) *</label>
                  <select
                    value={rackForm.uCapacity}
                    onChange={(e) => setRackForm({ ...rackForm, uCapacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={42}>42U (Standard Server Cabinet)</option>
                    <option value={24}>24U (Distribution Cabinet)</option>
                    <option value={18}>18U (Wallmount / Compact)</option>
                    <option value={12}>12U (Small Panel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gedung Penempatan *</label>
                  <select
                    required
                    value={rackForm.buildingId}
                    onChange={(e) => {
                      const b = buildings.find(x => x.id === e.target.value);
                      setRackForm({
                        ...rackForm,
                        buildingId: e.target.value,
                        buildingName: b ? b.name : ''
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ruang / Lokasi</label>
                  <input
                    type="text"
                    value={rackForm.room}
                    onChange={(e) => setRackForm({ ...rackForm, room: e.target.value })}
                    placeholder="Panel IT / Ruang Server"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  value={rackForm.description}
                  onChange={(e) => setRackForm({ ...rackForm, description: e.target.value })}
                  placeholder="Keterangan sirkulasi pendingin, grounding kabel, dsb."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRackOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simpan Rack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MOUNT DEVICE MODAL */}
      {/* ======================================================== */}
      {isMountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pasang Perangkat (Mount to U{mountTargetU})</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pilih perangkat jaringan untuk ditempatkan pada kabinet rak</p>
                </div>
              </div>
              <button
                onClick={() => setIsMountModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMountSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pilih Perangkat Jaringan *</label>
                <select
                  required
                  value={mountForm.deviceId}
                  onChange={(e) => setMountForm({ ...mountForm, deviceId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Pilih Perangkat yang Belum Terpasang --</option>
                  {unmountedDevices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code || d.name} — {d.name} ({d.ip}) [{d.type}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Posisi Slot Awal (U) *</label>
                  <input
                    type="number"
                    min={1}
                    max={activeRackDetail?.uCapacity || 42}
                    required
                    value={mountForm.uPosition}
                    onChange={(e) => setMountForm({ ...mountForm, uPosition: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tinggi Perangkat (Unit) *</label>
                  <select
                    value={mountForm.uHeight}
                    onChange={(e) => setMountForm({ ...mountForm, uHeight: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1U (Switch / Firewall 1RU)</option>
                    <option value={2}>2U (Core Switch / Server 2RU)</option>
                    <option value={3}>3U (Heavy Storage)</option>
                    <option value={4}>4U (UPS Battery Pack / Blade)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                Perangkat akan menempati unit <strong>U{mountForm.uPosition}</strong> hingga <strong>U{Math.max(1, mountForm.uPosition - mountForm.uHeight + 1)}</strong>. Sistem akan otomatis memvalidasi agar tidak terjadi tabrakan slot.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMountModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Pasang Perangkat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
