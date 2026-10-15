import React, { useState, useRef, useEffect } from 'react';
import { Building, CableRoute, Device, LayerVisibility, ViewMode, CableType, Alert, Rack } from '../../types';
import { LayerControlOverlay } from './LayerControlOverlay';
import { BuildingDetailPanel } from './BuildingDetailPanel';
import { BottomStatsBar } from './BottomStatsBar';
import { MinimapControls } from './MinimapControls';
import { CompassRose } from './CompassRose';
import { CableDrawer } from '../cables/CableDrawer';
import { DeviceDrawer } from '../devices/DeviceDrawer';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FuturisticFactoryCanvas } from './FuturisticFactoryCanvas';
import { api } from '../../services/api';
import { 
  Map, 
  Search, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  X, 
  Plus, 
  Minus, 
  Save, 
  Network, 
  GitFork, 
  PenTool, 
  Check, 
  Activity,
  Layers,
  Server,
  Wrench,
  Trash2,
  Palette,
  Sliders,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

interface NetworkLayoutViewProps {
  buildings: Building[];
  cableRoutes: CableRoute[];
  devices: Device[];
  alerts?: Alert[];
  racks?: Rack[];
  onNavigateView: (view: ViewMode) => void;
  onViewTopologyWithBuilding?: (building: Building) => void;
  initialFocusedBuilding?: Building | null;
  initialFocusedDevice?: Device | null;
}

const DEMO_BUILDING_CODES = ['KU', 'MTC', 'A', 'B', 'C', 'D', 'E', 'F', 'H', 'J'];

const PRESET_COLORS = [
  { label: 'Cyan (FO)', value: '#06b6d4' },
  { label: 'Orange (BB)', value: '#f97316' },
  { label: 'Emerald (UTP)', value: '#10b981' },
  { label: 'Amber (WL)', value: '#eab308' },
  { label: 'Rose (Sec)', value: '#f43f5e' },
  { label: 'Purple (VLAN)', value: '#8b5cf6' },
  { label: 'Blue (Core)', value: '#3b82f6' }
];

const PRESET_WIDTHS = [1.5, 2.5, 3.5, 5.0, 6.5];

export const NetworkLayoutView: React.FC<NetworkLayoutViewProps> = ({
  buildings,
  cableRoutes: initialCableRoutes,
  devices: initialDevices,
  alerts = [],
  racks = [],
  onNavigateView,
  onViewTopologyWithBuilding,
  initialFocusedBuilding,
  initialFocusedDevice
}) => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const { theme } = useTheme();
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  useEffect(() => {
    if (initialDevices && initialDevices.length > 0) {
      setDevices(initialDevices);
    }
  }, [initialDevices]);
  const { showToast } = useToast();
  const [cableRoutes, setCableRoutes] = useState<CableRoute[]>(initialCableRoutes);

  useEffect(() => {
    if (initialCableRoutes && initialCableRoutes.length > 0) {
      setCableRoutes(initialCableRoutes);
    }
  }, [initialCableRoutes]);

  // Selected entities
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    buildings.find(b => b.code === 'A') || buildings[0] || null
  );
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Quick Add Device Modal
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [deviceModalBuilding, setDeviceModalBuilding] = useState<Building | null>(null);
  const [newDevName, setNewDevName] = useState('');
  const [newDevType, setNewDevType] = useState<any>('access-switch');
  const [newDevIp, setNewDevIp] = useState('');
  const [newDevModel, setNewDevModel] = useState('Cisco Catalyst 2960X');

  // Quick Maintenance Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintModalBuilding, setMaintModalBuilding] = useState<Building | null>(null);
  const [newMaintTitle, setNewMaintTitle] = useState('');
  const [newMaintPriority, setNewMaintPriority] = useState('medium');
  const [newMaintDesc, setNewMaintDesc] = useState('');
  const [selectedCable, setSelectedCable] = useState<CableRoute | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Fullscreen & DOM References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // ----------------------------------------------------
  // CABLE ROUTE DRAWING & EDITING STATE (FLOW 1 - 11)
  // ----------------------------------------------------
  const [showAddCableModal, setShowAddCableModal] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isEditingCable, setIsEditingCable] = useState<CableRoute | null>(null);
  const [cableToDelete, setCableToDelete] = useState<CableRoute | null>(null);

  // Drawing properties
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CableType>('fiber');
  const [newFromBld, setNewFromBld] = useState('bld-ku');
  const [newToBld, setNewToBld] = useState('bld-a');
  const [newColor, setNewColor] = useState('#06b6d4');
  const [newLineWidth, setNewLineWidth] = useState(3.0);
  const [newCores, setNewCores] = useState(12);
  const [newBandwidth, setNewBandwidth] = useState('10 Gbps');
  const [drawnPoints, setDrawnPoints] = useState<{ x: number; y: number }[]>([]);
  const [mouseSvgPos, setMouseSvgPos] = useState<{ x: number; y: number } | null>(null);
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showWidthPopover, setShowWidthPopover] = useState(false);
  const [isSavingCable, setIsSavingCable] = useState(false);

  // Layer Visibility state
  const [layers, setLayers] = useState<LayerVisibility>({
    gedung: true,
    fiberOptic: true,
    utp: true,
    backbone: true,
    wireless: true,
    switch: true,
    router: true,
    accessPoint: true,
    cctv: true,
    server: true,
    internet: true,
    labels: true,
    flowAnimation: true
  });

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // HTML5 Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('[GIS] Fullscreen error:', err);
    }
  };

  // Smooth native mouse wheel zoom on canvas container
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      setZoom(prev => {
        const next = Math.min(Math.max(Number((prev * zoomFactor).toFixed(2)), 0.6), 3.5);
        return next;
      });
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.6));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    showToast('Tampilan GIS direset ke posisi awal', 'info', 'Reset Map');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawingMode) return;
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isDrawingMode) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Focus on building coordinates (SVG viewBox: 0 0 445 561, center is 222.5, 280.5)
  // Auto-center camera with drawer offset (-45px scaled) so building is dead-center in visible map
  const focusBuilding = (bld: Building, forcedZoom?: number) => {
    setSelectedBuilding(bld);
    setSelectedCable(null);
    setSelectedDevice(null);
    const targetZoom = forcedZoom ?? Math.max(zoom, 1.55);
    const targetPanX = Math.round((222.5 - bld.center.x) * targetZoom - 45);
    const targetPanY = Math.round((280.5 - bld.center.y) * targetZoom);
    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setIsSearchFocused(false);
    setSearchQuery('');
    showToast(`Fokus ke ${bld.name} (${bld.code})`, 'info', 'Navigasi Gedung');
  };

  // Handle cross-view incoming navigation from Topology (View on Map)
  useEffect(() => {
    if (initialFocusedDevice) {
      setSelectedDevice(initialFocusedDevice);
      setSelectedCable(null);
      const targetBld = buildings.find(b => b.id === initialFocusedDevice.buildingId);
      if (targetBld) {
        setSelectedBuilding(targetBld);
        focusBuilding(targetBld, 1.8);
      }
    } else if (initialFocusedBuilding) {
      setSelectedBuilding(initialFocusedBuilding);
      focusBuilding(initialFocusedBuilding, 1.8);
    }
  }, [initialFocusedDevice, initialFocusedBuilding]);

  // ----------------------------------------------------
  // EXACT SVG COORDINATE CALCULATOR (Immune to Zoom & Pan)
  // ----------------------------------------------------
  const getSvgCoordinates = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const svgPoint = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.round(Math.max(0, Math.min(445, svgPoint.x))),
      y: Math.round(Math.max(0, Math.min(561, svgPoint.y)))
    };
  };

  // Mouse move on SVG canvas for drawing preview rubber-band line
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    const coords = getSvgCoordinates(e);
    if (coords) {
      setMouseSvgPos(coords);
    }
  };

  // SVG Click Handler for Interactive Cable Drawing
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    const coords = getSvgCoordinates(e);
    if (coords) {
      setDrawnPoints(prev => [...prev, coords]);
    }
  };

  // ----------------------------------------------------
  // WORKFLOW: ADD CABLE ROUTE (FLOW 1 - 5)
  // ----------------------------------------------------
  const handleOpenAddCableModal = () => {
    const nextIdx = cableRoutes.length + 1;
    const prefix = newType === 'fiber' ? 'FO' : newType === 'backbone' ? 'BB' : newType === 'utp' ? 'UTP' : 'WL';
    const code = `${prefix}-00${nextIdx}`;
    const fromBld = buildings.find(b => b.id === newFromBld) || buildings[0];
    const toBld = buildings.find(b => b.id === newToBld) || buildings[1];

    setNewCode(code);
    setNewName(`Jalur ${prefix} ${fromBld?.name || 'KU'} → ${toBld?.name || 'Gedung'}`);
    setNewColor(newType === 'fiber' ? '#06b6d4' : newType === 'backbone' ? '#f97316' : newType === 'utp' ? '#10b981' : '#eab308');
    setNewLineWidth(newType === 'backbone' ? 3.5 : 2.5);
    setShowAddCableModal(true);
  };

  const handleStartDrawingFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAddCableModal(false);
    setIsEditingCable(null);
    setIsDrawingMode(true);

    // Optional: seed point 1 with source building center
    const fromBld = buildings.find(b => b.id === newFromBld);
    if (fromBld && drawnPoints.length === 0) {
      setDrawnPoints([fromBld.center]);
    }

    showToast(`Mode Gambar Aktif: ${newCode}. Klik pada denah untuk membuat rute kabel.`, 'info', 'Mulai Gambar Jalur');
  };

  // ----------------------------------------------------
  // WORKFLOW: EDIT CABLE ROUTE (FITUR EDIT ROUTE)
  // ----------------------------------------------------
  const handleStartEditCable = (cable: CableRoute) => {
    setIsEditingCable(cable);
    setNewCode(cable.code);
    setNewName(cable.name);
    setNewType(cable.type);
    setNewFromBld(cable.fromBuildingId);
    setNewToBld(cable.toBuildingId);
    setNewColor(cable.color || (cable.type === 'backbone' ? '#f97316' : cable.type === 'fiber' ? '#06b6d4' : cable.type === 'utp' ? '#10b981' : '#eab308'));
    setNewLineWidth(cable.lineWidth || (cable.type === 'backbone' ? 3.5 : 2.5));
    setNewCores(cable.totalCores || 12);
    setNewBandwidth(cable.bandwidth || '10 Gbps');
    setDrawnPoints([...(cable.path || [])]);
    setSelectedCable(null);
    setIsDrawingMode(true);
    showToast(`Mode Edit Rute Aktif untuk ${cable.code}. Anda dapat menambah titik, undo, ubah warna, atau simpan.`, 'info', 'Edit Rute');
  };

  // ----------------------------------------------------
  // WORKFLOW: SAVE CABLE ROUTE (FLOW 9 - 11)
  // ----------------------------------------------------
  const handleSaveCableSubmit = async () => {
    if (drawnPoints.length < 2) {
      showToast('Minimal tentukan 2 titik koordinat untuk membuat rute kabel!', 'warning', 'Titik Belum Cukup');
      return;
    }

    setIsSavingCable(true);

    let lengthPx = 0;
    for (let i = 1; i < drawnPoints.length; i++) {
      const dx = drawnPoints[i].x - drawnPoints[i - 1].x;
      const dy = drawnPoints[i].y - drawnPoints[i - 1].y;
      lengthPx += Math.sqrt(dx * dx + dy * dy);
    }
    const estimatedMeters = Math.max(10, Math.round(lengthPx * 0.85));

    const fromBuilding = buildings.find(b => b.id === newFromBld);
    const toBuilding = buildings.find(b => b.id === newToBld);

    if (isEditingCable) {
      // Update existing cable route
      const updatedCableObj: CableRoute = {
        ...isEditingCable,
        code: newCode || isEditingCable.code,
        name: newName || isEditingCable.name,
        type: newType,
        fromBuildingId: newFromBld,
        fromBuildingName: fromBuilding?.name || isEditingCable.fromBuildingName,
        toBuildingId: newToBld,
        toBuildingName: toBuilding?.name || isEditingCable.toBuildingName,
        path: drawnPoints,
        totalCores: Number(newCores) || 12,
        lengthMeters: estimatedMeters,
        bandwidth: newBandwidth || '10 Gbps',
        color: newColor,
        lineWidth: newLineWidth
      };

      try {
        await api.updateCable(isEditingCable.id, updatedCableObj);
        showToast(`Rute kabel ${updatedCableObj.code} berhasil diperbarui di database!`, 'success', 'Rute Diperbarui');
      } catch (err) {
        console.warn('[NetworkLayoutView] Saved locally (offline fallback):', err);
        showToast(`Rute kabel ${updatedCableObj.code} disimpan offline.`, 'info', 'Penyimpanan Offline');
      }

      setCableRoutes(prev => prev.map(c => c.id === isEditingCable.id ? updatedCableObj : c));
      setSelectedCable(updatedCableObj);
    } else {
      // Create new cable route
      const newCableObj: CableRoute = {
        id: `cable-${Date.now()}`,
        code: newCode || `CBL-00${cableRoutes.length + 1}`,
        name: newName || `Jalur Kabel ${fromBuilding?.name || 'KU'} - ${toBuilding?.name || 'Gedung'}`,
        type: newType,
        fromBuildingId: newFromBld,
        fromBuildingName: fromBuilding?.name || 'Kantor Utama',
        toBuildingId: newToBld,
        toBuildingName: toBuilding?.name || 'Gedung Tujuan',
        path: drawnPoints,
        totalCores: Number(newCores) || 12,
        usedCores: 2,
        status: 'normal',
        lengthMeters: estimatedMeters,
        attenuationDb: 0.38,
        bandwidth: newBandwidth || (newType === 'backbone' ? '40 Gbps' : newType === 'fiber' ? '10 Gbps' : '1 Gbps'),
        color: newColor,
        lineWidth: newLineWidth
      };

      try {
        await api.createCable(newCableObj);
        showToast(`Rute kabel ${newCableObj.code} (${newCableObj.name}) berhasil disimpan secara permanen!`, 'success', 'Rute Kabel Tersimpan');
      } catch (err) {
        console.warn('[NetworkLayoutView] Saved locally (offline fallback):', err);
        showToast(`Rute kabel ${newCableObj.code} disimpan offline.`, 'info', 'Penyimpanan Offline');
      }

      setCableRoutes(prev => [...prev, newCableObj]);
      setSelectedCable(newCableObj);
    }

    setSelectedBuilding(null);
    setSelectedDevice(null);
    setIsDrawingMode(false);
    setIsEditingCable(null);
    setDrawnPoints([]);
    setMouseSvgPos(null);
    setIsSavingCable(false);
  };

  // ----------------------------------------------------
  // WORKFLOW: DELETE CABLE ROUTE (FITUR DELETE ROUTE)
  // ----------------------------------------------------
  const handleConfirmDeleteCable = async () => {
    if (!cableToDelete) return;
    try {
      await api.deleteCable(cableToDelete.id);
      showToast(`Rute kabel ${cableToDelete.code} berhasil dihapus dari sistem!`, 'success', 'Rute Dihapus');
    } catch (err) {
      console.warn('[NetworkLayoutView] Deleted locally (offline fallback):', err);
      showToast(`Rute kabel ${cableToDelete.code} dihapus offline.`, 'info', 'Penyimpanan Offline');
    }

    setCableRoutes(prev => prev.filter(c => c.id !== cableToDelete.id));
    if (selectedCable?.id === cableToDelete.id) {
      setSelectedCable(null);
    }
    setCableToDelete(null);
  };

  // Cancel Drawing Mode
  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setIsEditingCable(null);
    setDrawnPoints([]);
    setMouseSvgPos(null);
    showToast('Mode gambar rute kabel dibatalkan', 'info', 'Mode Gambar Selesai');
  };

  // Filtered buildings for search
  const filteredBuildings = buildings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#080D1A] flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Top Header & GIS Toolbar */}
      <div className="h-14 bg-[#0B132B] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-30 gap-3">
        {/* Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-xl bg-blue-950/90 border border-blue-700/60 text-cyan-400 shadow-md">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Network Layout GIS
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-cyan-400 font-mono border border-blue-800/60">
                Site Map
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Visualisasi denah interaktif infrastruktur pabrik CBA
            </p>
          </div>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Cari gedung (KU, MTC, A-J)..."
              className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0B132B] border border-cyan-500/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-2 border-b border-slate-800/80 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
                <span>Pilih Gedung untuk Fokus Kamera:</span>
                <span className="text-cyan-400">{filteredBuildings.length} gedung ditemukan</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/50">
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map(bld => (
                    <button
                      key={bld.id}
                      onClick={() => focusBuilding(bld)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-5 rounded bg-blue-950/80 border border-blue-800 text-cyan-300 font-bold text-[10px] flex items-center justify-center font-mono group-hover:border-cyan-400">
                          {bld.code}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-200 block text-xs">{bld.name}</span>
                          <span className="text-[10px] text-slate-400">{bld.lokasi || bld.category}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        bld.status === 'warning' ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      }`}>
                        {bld.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    Tidak ada gedung yang cocok dengan "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Quick Jump Pills (KU, MTC, A, B, C, D, E, F, H, J) */}
        <div className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Demo:</span>
          {DEMO_BUILDING_CODES.map(code => {
            const targetBld = buildings.find(b => b.code === code);
            const isCurrent = selectedBuilding?.code === code;
            return (
              <button
                key={code}
                onClick={() => {
                  if (targetBld) focusBuilding(targetBld);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  isCurrent 
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105' 
                    : 'bg-[#111A33] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300'
                }`}
                title={`Pusatkan ke ${targetBld?.name || code}`}
              >
                {code}
              </button>
            );
          })}
        </div>

        {/* GIS Actions: Add Cable Route, Zoom, Reset, Fullscreen, Topology */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {/* FLOW STEP 1: Add Cable Route Button */}
          <button 
            onClick={handleOpenAddCableModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/30 active:scale-95"
            title="Tambah rute kabel baru di atas peta layout"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Cable Route</span>
          </button>

          {/* Zoom controls inline */}
          <div className="hidden sm:flex items-center bg-[#111A33] border border-slate-700/60 rounded-xl p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-bold text-cyan-400 select-none min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-2 bg-[#131D3B] hover:bg-slate-800 border border-slate-700/70 rounded-xl text-slate-300 hover:text-amber-300 transition-all"
            title="Reset Posisi & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all ${
              isFullscreen 
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300' 
                : 'bg-[#131D3B] hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
            }`}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Topology View Navigator */}
          <button 
            onClick={() => onNavigateView('topology')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131D3B] hover:bg-blue-600/20 border border-blue-500/60 rounded-xl text-blue-400 hover:text-blue-300 transition-all text-xs font-semibold"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Topology</span>
          </button>
        </div>
      </div>

      {/* Center Layout Body (Map Canvas + Right Detail Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Canvas Area */}
        <div 
          ref={canvasContainerRef}
          className={`flex-1 relative bg-[#090F20] overflow-hidden flex items-center justify-center ${
            isDrawingMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Compass Widget */}
          <CompassRose />

          {/* Left Layer Checkbox Panel */}
          <LayerControlOverlay
            layers={layers}
            onChangeLayer={toggleLayer}
          />

          {/* Minimap & Zoom Controls */}
          <MinimapControls
            zoom={zoom}
            pan={pan}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />

          {/* ---------------------------------------------------- */}
          {/* FLOATING ACTION TOOLBAR: CABLE ROUTE DRAWING MODE    */}
          {/* ---------------------------------------------------- */}
          {isDrawingMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#0B132B]/95 border border-amber-500/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in duration-200 ring-1 ring-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-xs font-bold text-amber-300">
                  {isEditingCable ? `Edit Rute: ${newCode}` : `Gambar Rute: ${newCode}`}
                </span>
              </div>

              <div className="h-4 w-px bg-slate-700"></div>

              {/* Titik Counter */}
              <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                <span>Titik:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {drawnPoints.length}
                </span>
              </div>

              {/* Live Color Picker Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowColorPopover(!showColorPopover);
                    setShowWidthPopover(false);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200"
                  title="Ganti Warna Rute"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: newColor }} />
                  <Palette className="w-3 h-3 text-slate-400" />
                </button>

                {showColorPopover && (
                  <div className="absolute top-full left-0 mt-2 bg-[#0B132B] border border-slate-700 rounded-xl p-2.5 shadow-2xl z-50 flex flex-col gap-2 w-44">
                    <span className="text-[10px] font-semibold text-slate-400">Pilih Warna Garis:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setNewColor(c.value);
                            setShowColorPopover(false);
                          }}
                          className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                            newColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <span className="text-[9px] text-slate-400">Kustom:</span>
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-full h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Line Width Selector Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowWidthPopover(!showWidthPopover);
                    setShowColorPopover(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200"
                  title="Ganti Ketebalan Garis"
                >
                  <Sliders className="w-3 h-3 text-slate-400" />
                  <span>{newLineWidth}px</span>
                </button>

                {showWidthPopover && (
                  <div className="absolute top-full left-0 mt-2 bg-[#0B132B] border border-slate-700 rounded-xl p-2.5 shadow-2xl z-50 flex flex-col gap-1.5 w-36">
                    <span className="text-[10px] font-semibold text-slate-400">Tebal Garis:</span>
                    {PRESET_WIDTHS.map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          setNewLineWidth(w);
                          setShowWidthPopover(false);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center justify-between transition-all ${
                          newLineWidth === w ? 'bg-cyan-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{w} px</span>
                        <span className="w-8 h-0.5 rounded" style={{ height: `${Math.min(w, 4)}px`, backgroundColor: newColor }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-slate-700"></div>

              {/* Fitur: Undo Last Point */}
              <button
                type="button"
                onClick={() => setDrawnPoints(prev => prev.slice(0, -1))}
                disabled={drawnPoints.length === 0}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Hapus titik terakhir"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              {/* Fitur: Clear Route */}
              <button
                type="button"
                onClick={() => setDrawnPoints([])}
                disabled={drawnPoints.length === 0}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Hapus semua titik yang digambar"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear</span>
              </button>

              {/* Fitur: Save Route */}
              <button
                type="button"
                onClick={handleSaveCableSubmit}
                disabled={drawnPoints.length < 2 || isSavingCable}
                className="px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                title="Simpan rute kabel ke peta dan database"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isSavingCable ? 'Menyimpan...' : 'Save'}</span>
              </button>

              {/* Cancel Drawing */}
              <button
                type="button"
                onClick={handleCancelDrawing}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                title="Batalkan Mode Gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SVG CANVAS: Calibrated strictly to 445x561 pixel map  */}
          {/* ---------------------------------------------------- */}
          <svg
            ref={svgRef}
            onClick={handleSvgClick}
            onMouseMove={handleSvgMouseMove}
            className="w-full h-full max-h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            viewBox="0 0 445 561"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-cyan-bold" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-cyan-subtle" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Factory Layout: Futuristic Digital Twin Vector Canvas */}
            <FuturisticFactoryCanvas isDark={theme === 'dark'} />

            {/* Cable Routes Layer (Permanent SVG Lines & Labels) */}
            {cableRoutes.map((cable) => {
              if (cable.type === 'fiber' && !layers.fiberOptic) return null;
              if (cable.type === 'utp' && !layers.utp) return null;
              if (cable.type === 'backbone' && !layers.backbone) return null;
              if (cable.type === 'wireless' && !layers.wireless) return null;

              const isBackbone = cable.type === 'backbone';
              const isWireless = cable.type === 'wireless';
              const isSelected = selectedCable?.id === cable.id;

              const strokeColor = cable.color || (
                isBackbone 
                  ? '#f97316' 
                  : cable.type === 'fiber' 
                    ? '#06b6d4' 
                    : cable.type === 'utp' 
                      ? '#10b981' 
                      : '#eab308'
              );

              const strokeW = isSelected 
                ? (cable.lineWidth ? cable.lineWidth + 2 : isBackbone ? 4.5 : 3.5)
                : (cable.lineWidth || (isBackbone ? 3 : cable.type === 'fiber' ? 2.5 : 2));

              const pathD = cable.path.reduce((acc, pt, idx) => {
                return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
              }, '');

              // Midpoint for route label tag
              const midIdx = Math.floor(cable.path.length / 2);
              const midPt = cable.path[midIdx] || cable.path[0];

              return (
                <g 
                  key={cable.id}
                  onClick={(e) => {
                    if (isDrawingMode) return;
                    e.stopPropagation();
                    setSelectedCable(cable);
                    setSelectedBuilding(null);
                    setSelectedDevice(null);
                    showToast(`Membuka rute kabel ${cable.code} (${cable.name})`, 'info', 'Kabel Dipilih');
                  }}
                  className="cursor-pointer group"
                >
                  {/* Invisible hit-area for easy clicking */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />

                  {/* Visible Cable Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeDasharray={isWireless ? '4 3' : 'none'}
                    filter={isSelected ? 'url(#glow-cyan)' : isBackbone ? 'url(#glow-orange)' : 'none'}
                    className="transition-all duration-150"
                  />

                  {/* Flow Particle Animation */}
                  {!isWireless && layers.flowAnimation !== false && (
                    <circle r={isSelected ? 3.5 : 2.5} fill="#ffffff">
                      <animateMotion path={pathD} dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Fitur: Show Route Label Badge */}
                  {layers.labels !== false && midPt && (
                    <g transform={`translate(${midPt.x}, ${midPt.y})`} className="pointer-events-none">
                      <rect
                        x="-20"
                        y="-7"
                        width="40"
                        height="13"
                        rx="3"
                        fill="#0B132B"
                        fillOpacity="0.92"
                        stroke={isSelected ? '#38bdf8' : strokeColor}
                        strokeWidth={isSelected ? 1.2 : 0.8}
                      />
                      <text
                        x="0"
                        y="2.5"
                        fill="#ffffff"
                        fontSize="6"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {cable.code}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* ---------------------------------------------------- */}
            {/* ACTIVE DRAWING PREVIEW LAYER (FLOW 7 & 8)            */}
            {/* ---------------------------------------------------- */}
            {isDrawingMode && (
              <g className="pointer-events-none">
                {/* Drawn Polyline Segments */}
                {drawnPoints.length > 1 && (
                  <polyline
                    points={drawnPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={newColor}
                    strokeWidth={newLineWidth}
                    strokeDasharray="4 2"
                    filter="url(#glow-amber)"
                  />
                )}

                {/* Rubber-band preview line to cursor */}
                {drawnPoints.length > 0 && mouseSvgPos && (
                  <line
                    x1={drawnPoints[drawnPoints.length - 1].x}
                    y1={drawnPoints[drawnPoints.length - 1].y}
                    x2={mouseSvgPos.x}
                    y2={mouseSvgPos.y}
                    stroke={newColor}
                    strokeWidth={newLineWidth}
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                {/* Vertex Markers */}
                {drawnPoints.map((pt, idx) => (
                  <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle r="4.5" fill={newColor} stroke="#ffffff" strokeWidth="1.5" />
                    <rect x="6" y="-7" width="46" height="12" rx="3" fill="#0B132B" fillOpacity="0.9" stroke={newColor} strokeWidth="0.8" />
                    <text x="29" y="1" fill="#fde68a" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      P${idx + 1} (${pt.x},${pt.y})
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Clickable Buildings Hotspots Layer (KU, MTC, A, B, C, D, E, F, H, J) */}
            {layers.gedung && buildings.map((bld) => {
              const isSelected = selectedBuilding?.id === bld.id;
              const isHovered = hoveredBuildingId === bld.id;
              const pointsStr = bld.polygon.map(pt => `${pt.x},${pt.y}`).join(' ');

              return (
                <g
                  key={bld.id}
                  onClick={(e) => {
                    if (isDrawingMode) return;
                    e.stopPropagation();
                    focusBuilding(bld);
                  }}
                  onMouseEnter={(e) => {
                    if (isDrawingMode) return;
                    setHoveredBuildingId(bld.id);
                    setHoveredBuilding(bld);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    if (isDrawingMode) return;
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredBuildingId(null);
                    setHoveredBuilding(null);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Building Polygon Overlay with subtle hover highlight & electric cyan selected outline */}
                  <polygon
                    points={pointsStr}
                    fill={
                      isSelected 
                        ? (bld.status === 'warning' ? '#b45309' : '#0284c7') 
                        : isHovered 
                          ? '#0284c7' 
                          : '#1e293b'
                    }
                    fillOpacity={isSelected ? 0.48 : isHovered ? 0.28 : 0.08}
                    stroke={
                      isSelected 
                        ? '#00f2fe' 
                        : isHovered 
                          ? '#38bdf8' 
                          : '#64748b'
                    }
                    strokeWidth={isSelected ? 3.0 : isHovered ? 2.0 : 1.0}
                    filter={
                      isSelected 
                        ? (bld.status === 'warning' ? 'url(#glow-amber)' : 'url(#glow-cyan-bold)') 
                        : isHovered 
                          ? 'url(#glow-cyan-subtle)' 
                          : 'none'
                    }
                    className="cursor-pointer transition-all duration-150"
                  />

                  {/* Pulsing Selection Beacon Ring on Building Center */}
                  {isSelected && (
                    <g className="pointer-events-none">
                      <circle
                        cx={bld.center.x}
                        cy={bld.center.y}
                        r="16"
                        fill="none"
                        stroke="#00f2fe"
                        strokeWidth="2"
                        opacity="0.9"
                      >
                        <animate attributeName="r" values="8;28" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.95;0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        cx={bld.center.x}
                        cy={bld.center.y}
                        r="3.5"
                        fill="#00f2fe"
                        filter="url(#glow-cyan-bold)"
                      />
                    </g>
                  )}

                  {/* Building Label Tag */}
                  {layers.labels !== false && (
                    <g transform={`translate(${bld.center.x}, ${bld.center.y})`}>
                      <rect
                        x="-36"
                        y="-8"
                        width="72"
                        height="16"
                        rx="4"
                        fill={isSelected ? '#0284c7' : '#0B132B'}
                        fillOpacity={isSelected ? 0.95 : 0.88}
                        stroke={isSelected ? '#00f2fe' : isHovered ? '#38bdf8' : '#475569'}
                        strokeWidth={isSelected ? 1.8 : 0.8}
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill="#ffffff"
                        fontSize="6.5"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {bld.code} - {bld.name}
                      </text>
                    </g>
                  )}

                  {/* Switch Badge Marker - Click opens DeviceDrawer */}
                  {layers.switch && (
                    <g 
                      transform={`translate(${bld.center.x - 14}, ${bld.center.y - 14})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const bldDev = devices.find(d => d.buildingId === bld.id);
                        if (bldDev) {
                          setSelectedDevice(bldDev);
                          setSelectedBuilding(null);
                          setSelectedCable(null);
                          showToast(`Membuka detail perangkat ${bldDev.name} (${bldDev.buildingName})`, 'info', 'Perangkat Dipilih');
                        }
                      }}
                      className="cursor-pointer hover:scale-125 transition-transform"
                    >
                      <title>Klik untuk membuka detail Switch Gedung</title>
                      <rect x="0" y="0" width="8" height="8" rx="2" fill="#2563eb" stroke="#ffffff" strokeWidth="0.5" />
                      <circle cx="4" cy="4" r="1.5" fill="#ffffff" />
                    </g>
                  )}

                  {/* Access Point Badge Marker */}
                  {layers.accessPoint && (
                    <g 
                      transform={`translate(${bld.center.x + 8}, ${bld.center.y - 14})`}
                      className="cursor-pointer hover:scale-125 transition-transform"
                    >
                      <title>Access Point Aktif</title>
                      <circle cx="4" cy="4" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="0.5" />
                      <circle cx="4" cy="4" r="1.5" fill="#ffffff" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Internet Drop Point Marker (Top-Right of Factory Canvas) */}
            {layers.internet && (
              <g 
                transform="translate(412, 72)" 
                className="cursor-pointer group"
                onClick={() => {
                  const ispDev = devices.find(d => d.type === 'firewall') || devices[0];
                  if (ispDev) {
                    setSelectedDevice(ispDev);
                    setSelectedBuilding(null);
                    setSelectedCable(null);
                    showToast(`Membuka gateway Internet & Firewall: ${ispDev.name}`, 'info', 'Internet Gateway');
                  }
                }}
              >
                <circle cx="0" cy="0" r="12" fill="#2563eb" filter="url(#glow-cyan)" />
                <circle cx="0" cy="0" r="5" fill="#ffffff" />
                <rect x="-18" y="14" width="36" height="12" rx="3" fill="#0B132B" stroke="#3b82f6" strokeWidth="0.8" />
                <text x="0" y="22" fill="#60a5fa" fontSize="6" fontWeight="bold" textAnchor="middle">
                  Internet
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right Side Inspector Drawer: BuildingDetailPanel / DeviceDrawer / CableDrawer */}
        {selectedDevice ? (
          <DeviceDrawer
            device={selectedDevice}
            building={buildings.find(b => b.id === selectedDevice.buildingId)}
            onClose={() => setSelectedDevice(null)}
            onTraceConnection={() => onNavigateView('monitoring')}
            onViewOnMap={(d) => {
              const bld = buildings.find(b => b.id === d.buildingId);
              if (bld) focusBuilding(bld);
            }}
            onCreateMaintenance={() => onNavigateView('maintenance')}
          />
        ) : selectedCable ? (
          <CableDrawer
            cable={selectedCable}
            buildings={buildings}
            onClose={() => setSelectedCable(null)}
            onTraceRoute={() => {
              onNavigateView('monitoring');
            }}
            onEditRoute={handleStartEditCable}
            onDeleteRoute={(cable) => setCableToDelete(cable)}
          />
        ) : (
          <BuildingDetailPanel
            isViewer={isViewer}
            building={selectedBuilding}
            devices={devices}
            cables={cableRoutes}
            alerts={alerts}
            racks={racks}
            onClose={() => setSelectedBuilding(null)}
            onViewCableRoute={(c) => {
              if (c) {
                setSelectedCable(c);
                setSelectedBuilding(null);
                setSelectedDevice(null);
              } else {
                const matchedCable = cableRoutes.find(cr => cr.fromBuildingId === selectedBuilding?.id || cr.toBuildingId === selectedBuilding?.id);
                if (matchedCable) {
                  setSelectedCable(matchedCable);
                  setSelectedBuilding(null);
                  setSelectedDevice(null);
                } else {
                  onNavigateView('cables');
                }
              }
            }}
            onViewTopology={() => {
              if (onViewTopologyWithBuilding && selectedBuilding) {
                onViewTopologyWithBuilding(selectedBuilding);
              } else {
                onNavigateView('topology');
              }
            }}
            onViewDevices={() => onNavigateView('devices')}
            onTraceConnection={() => onNavigateView('monitoring')}
            onAddDevice={(bld) => {
              setDeviceModalBuilding(bld);
              setNewDevName(`SW-${bld.code}-0${devices.filter(d => d.buildingId === bld.id).length + 1}`);
              setNewDevIp(`192.168.1.${Math.floor(20 + Math.random() * 200)}`);
              setShowAddDeviceModal(true);
            }}
            onAddCableRoute={(bld) => {
              setNewFromBld(bld.id);
              const otherBld = buildings.find(b => b.id !== bld.id) || buildings[0];
              setNewToBld(otherBld.id);
              setNewCode(`FO-${Math.floor(100 + Math.random() * 900)}`);
              setNewName(`Rute FO: ${bld.name} → ${otherBld.name}`);
              setShowAddCableModal(true);
              showToast(`Memulai rute kabel dari ${bld.name}`, 'info', 'Add Cable Route');
            }}
            onCreateMaintenance={(bld) => {
              setMaintModalBuilding(bld);
              setNewMaintTitle(`Preventive Maintenance: ${bld.name}`);
              setShowMaintenanceModal(true);
            }}
            onFocusMap={(bld) => focusBuilding(bld)}
            onSelectDevice={(d) => {
              setSelectedDevice(d);
              setSelectedBuilding(null);
              setSelectedCable(null);
              showToast(`Membuka perangkat ${d.name}`, 'info', 'Perangkat Dipilih');
            }}
          />
        )}
      </div>

      {/* Bottom Stats & Legend Bar */}
      <BottomStatsBar
        selectedCable={selectedCable}
        totalGedung={buildings.length}
        totalDevices={devices.length}
        totalCables={cableRoutes.length}
        onViewCableDetail={() => {
          if (selectedCable) {
            // Already active
          } else if (cableRoutes.length > 0) {
            setSelectedCable(cableRoutes[0]);
            setSelectedBuilding(null);
          }
        }}
      />

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: ADD CABLE ROUTE CONFIGURATION (FLOW 1 - 5)   */}
      {/* ---------------------------------------------------- */}
      {showAddCableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0B132B] border border-cyan-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden font-sans text-slate-100">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Add Cable Route</h3>
                  <p className="text-[10px] text-slate-400">Atur parameter jalur sebelum menggambar di atas denah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCableModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleStartDrawingFromModal} className="p-5 flex flex-col gap-4 text-xs">
              {/* Flow 2: Pilih Cable Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Kode Rute</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    placeholder="FO-006"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tipe Kabel (Cable Type)</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setNewType(t);
                      setNewColor(t === 'fiber' ? '#06b6d4' : t === 'backbone' ? '#f97316' : t === 'utp' ? '#10b981' : '#eab308');
                      setNewLineWidth(t === 'backbone' ? 3.5 : 2.5);
                    }}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="fiber">Fiber Optic (Single Mode)</option>
                    <option value="backbone">Backbone Core 40G</option>
                    <option value="utp">UTP Cat6 (Industrial)</option>
                    <option value="wireless">Wireless Point-to-Point</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nama Rute Jalur</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Jalur Fiber Optic Kantor Utama ke Gedung H"
                />
              </div>

              {/* Flow 3 & 4: Source & Destination Building */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Source Building (Asal)</label>
                  <select
                    value={newFromBld}
                    onChange={(e) => setNewFromBld(e.target.value)}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Destination Building (Tujuan)</label>
                  <select
                    value={newToBld}
                    onChange={(e) => setNewToBld(e.target.value)}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fitur: Change Route Color & Line Width */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Warna Garis</label>
                  <div className="flex items-center gap-2 bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-1.5">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-slate-200">{newColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ketebalan Garis</label>
                  <select
                    value={newLineWidth}
                    onChange={(e) => setNewLineWidth(Number(e.target.value))}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {PRESET_WIDTHS.map(w => (
                      <option key={w} value={w}>{w} px</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cores & Bandwidth */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Kapasitas Core</label>
                  <select
                    value={newCores}
                    onChange={(e) => setNewCores(Number(e.target.value))}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={4}>4 Core</option>
                    <option value={8}>8 Core</option>
                    <option value={12}>12 Core (Standard)</option>
                    <option value={24}>24 Core</option>
                    <option value={48}>48 Core</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Bandwidth</label>
                  <select
                    value={newBandwidth}
                    onChange={(e) => setNewBandwidth(e.target.value)}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="1 Gbps">1 Gbps</option>
                    <option value="10 Gbps">10 Gbps</option>
                    <option value="40 Gbps">40 Gbps</option>
                    <option value="100 Gbps">100 Gbps</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-semibold"
                >
                  Batal
                </button>
                {/* Flow 5: Aktifkan Drawing Mode */}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Aktifkan Drawing Mode</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: CONFIRM DELETE CABLE ROUTE                  */}
      {/* ---------------------------------------------------- */}
      {cableToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0B132B] border border-rose-500/50 rounded-2xl max-w-sm w-full shadow-2xl p-5 text-slate-100 font-sans">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Hapus Rute Kabel?</h3>
                <span className="text-[10px] text-slate-400 font-mono">{cableToDelete.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus rute <strong>{cableToDelete.code} ({cableToDelete.name})</strong>? 
              Jalur ini akan dihapus secara permanen dari denah dan database.
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCableToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCable}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FLOATING HOVER TOOLTIP (GIS ENTERPRISE ASSET CARD)   */}
      {/* ---------------------------------------------------- */}
      {hoveredBuilding && !isDrawingMode && (
        <div 
          className="fixed pointer-events-none z-50 bg-[#0B132B]/95 border border-cyan-500/70 rounded-xl p-3 shadow-2xl backdrop-blur-md text-slate-100 font-sans min-w-[240px] transform -translate-x-1/2 -translate-y-[calc(100%+14px)] animate-in fade-in duration-100 ring-1 ring-cyan-500/40"
          style={{
            left: Math.min(Math.max(tooltipPos.x, 140), window.innerWidth - 150),
            top: tooltipPos.y
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-cyan-300 font-mono font-bold text-[10px]">
                {hoveredBuilding.code}
              </span>
              <span className="font-bold text-xs text-white">{hoveredBuilding.name}</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              hoveredBuilding.status === 'warning' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {hoveredBuilding.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
            <div>
              <span className="text-slate-500 block text-[9px]">Kategori</span>
              <span className="font-semibold capitalize text-slate-200">{hoveredBuilding.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Perangkat</span>
              <span className="font-semibold text-cyan-400">
                {devices.filter(d => d.buildingId === hoveredBuilding.id).length || hoveredBuilding.totalDevices || 0} unit
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Rute Kabel</span>
              <span className="font-semibold text-rose-400">
                {cableRoutes.filter(c => c.fromBuildingId === hoveredBuilding.id || c.toBuildingId === hoveredBuilding.id).length} jalur
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Koordinat</span>
              <span className="font-semibold text-slate-400">({hoveredBuilding.center.x}, {hoveredBuilding.center.y})</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-cyan-400 flex items-center justify-between font-mono">
            <span>Klik untuk membuka detail</span>
            <span>Enterprise Node</span>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* QUICK MODAL: ADD DEVICE (FROM BUILDING DRAWER)       */}
      {/* ---------------------------------------------------- */}
      {showAddDeviceModal && deviceModalBuilding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0B132B] border border-cyan-500/50 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden font-sans text-slate-100">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Add Device to Building</h3>
                  <p className="text-[10px] text-slate-400">{deviceModalBuilding.name} ({deviceModalBuilding.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeviceModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const newDev: Device = {
                  id: `dev-${Date.now()}`,
                  name: newDevName || `DEV-${deviceModalBuilding.code}-01`,
                  ip: newDevIp || '192.168.1.50',
                  mac: `00:2A:10:${Math.floor(10 + Math.random()*89)}:${Math.floor(10 + Math.random()*89)}:${Math.floor(10 + Math.random()*89)}`,
                  type: newDevType,
                  buildingId: deviceModalBuilding.id,
                  buildingName: deviceModalBuilding.name,
                  room: 'Panel IT Gedung',
                  status: 'online',
                  brand: 'Cisco',
                  model: newDevModel || 'Catalyst 2960X',
                  totalPorts: 24,
                  activePorts: 12,
                  uptime: 'Baru Dikonfigurasi'
                };
                setDevices(prev => [newDev, ...prev]);
                setShowAddDeviceModal(false);
                showToast(`Perangkat ${newDev.name} berhasil ditambahkan ke ${deviceModalBuilding.name}`, 'success', 'Perangkat Didaftarkan');
              }}
              className="p-5 flex flex-col gap-3.5 text-xs font-mono"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nama / Hostname Perangkat</label>
                <input
                  type="text"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  placeholder="e.g. SW-A-02"
                  required
                  className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tipe Perangkat</label>
                  <select
                    value={newDevType}
                    onChange={(e) => setNewDevType(e.target.value as any)}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="access-switch">Access Switch</option>
                    <option value="dist-switch">Dist Switch</option>
                    <option value="access-point">Access Point</option>
                    <option value="router">Router</option>
                    <option value="server">Server</option>
                    <option value="firewall">Firewall</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Alamat IP Static</label>
                  <input
                    type="text"
                    value={newDevIp}
                    onChange={(e) => setNewDevIp(e.target.value)}
                    placeholder="192.168.1.50"
                    required
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Brand & Model</label>
                <input
                  type="text"
                  value={newDevModel}
                  onChange={(e) => setNewDevModel(e.target.value)}
                  placeholder="Cisco Catalyst 2960X-24TS"
                  className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Perangkat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* QUICK MODAL: CREATE MAINTENANCE TICKET               */}
      {/* ---------------------------------------------------- */}
      {showMaintenanceModal && maintModalBuilding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0B132B] border border-amber-500/50 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden font-sans text-slate-100">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Create Maintenance Ticket</h3>
                  <p className="text-[10px] text-slate-400">{maintModalBuilding.name} ({maintModalBuilding.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setShowMaintenanceModal(false);
                showToast(`Tiket #${Math.floor(1000 + Math.random()*9000)} "${newMaintTitle}" dibuat untuk ${maintModalBuilding.name}`, 'success', 'Tiket Maintenance');
              }}
              className="p-5 flex flex-col gap-3.5 text-xs font-mono"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Judul Pekerjaan Maintenance</label>
                <input
                  type="text"
                  value={newMaintTitle}
                  onChange={(e) => setNewMaintTitle(e.target.value)}
                  placeholder="e.g. Audit ODF & Pembersihan Rack"
                  required
                  className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Prioritas</label>
                  <select
                    value={newMaintPriority}
                    onChange={(e) => setNewMaintPriority(e.target.value)}
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="low">Rendah (Rutin)</option>
                    <option value="medium">Sedang (Preventif)</option>
                    <option value="high">Tinggi (Perlu Segera)</option>
                    <option value="critical">Kritis (Emergency)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Teknisi Bertugas</label>
                  <input
                    type="text"
                    defaultValue="Budi Santoso (Head IT)"
                    className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Deskripsi Kerusakan / Prosedur</label>
                <textarea
                  rows={3}
                  value={newMaintDesc}
                  onChange={(e) => setNewMaintDesc(e.target.value)}
                  placeholder="Tuliskan catatan teknis pemeriksaan patch cord, suhu rack, atau redaman dB..."
                  className="w-full bg-[#111A33] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition-all active:scale-95"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Kirim Tiket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
