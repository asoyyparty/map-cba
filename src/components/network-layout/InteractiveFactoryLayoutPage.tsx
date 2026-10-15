import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, 
  CableRoute, 
  Device, 
  Alert, 
  Rack,
  CableType
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { factoryMapService, FactoryMapData } from '../../services/factoryMapService';
import { MapToolbar, MapToolMode, MapLayerToggles, MapViewStyle } from './MapToolbar';
import { Factory3DScene } from './Factory3DScene';
import { MapFilterPanel, MapFilters } from './MapFilterPanel';
import { MapSearchBar, SearchResultItem } from './MapSearchBar';
import { BuildingTooltip } from './BuildingTooltip';
import { BuildingDetailPanel } from './BuildingDetailPanel';
import { CableDrawer } from '../cables/CableDrawer';
import { DeviceDrawer } from '../devices/DeviceDrawer';
import { CompassRose } from './CompassRose';
import { MinimapControls } from './MinimapControls';
import { FuturisticFactoryCanvas } from './FuturisticFactoryCanvas';
import { AddCableOnMapModal } from './AddCableOnMapModal';
import { AddBuildingOnMapModal } from './AddBuildingOnMapModal';
import { EditBuildingOnMapModal } from './EditBuildingOnMapModal';
import { EditCableOnMapModal } from './EditCableOnMapModal';
import { cableService } from '../../services/cableService';
import { 
  AddDeviceModal, 
  AddCableRouteModal, 
  CreateMaintenanceModal 
} from '../dashboard/DashboardModals';
import { getDeviceTypeInfo } from '../devices/DeviceIconHelper';
import { 
  Loader2, 
  MapPin, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Minimize2,
  Boxes,
  Image as ImageIcon,
  GitFork,
  Server,
  Network,
  Activity,
  CheckCircle2,
  Building2,
  PenTool,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Point } from '../../types';

export const InteractiveFactoryLayoutPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1. Data States
  const [mapData, setMapData] = useState<FactoryMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Selection & Inspection States
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedCable, setSelectedCable] = useState<CableRoute | null>(null);

  // Hover Tooltip States
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3. Pan, Zoom & Tool Mode
  const [toolMode, setToolMode] = useState<MapToolMode>('select');
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapViewStyle, setMapViewStyle] = useState<MapViewStyle>('3d_render');

  // --- Authoring & Drawing States ---
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Draw Cable states
  const [drawingCablePoints, setDrawingCablePoints] = useState<Point[]>([]);
  const [drawingCableHover, setDrawingCableHover] = useState<Point | null>(null);
  const [startBuildingForCable, setStartBuildingForCable] = useState<Building | null>(null);
  const [endBuildingForCable, setEndBuildingForCable] = useState<Building | null>(null);
  const [isAddCableModalOpen, setIsAddCableModalOpen] = useState(false);

  // Draw Building states
  const [drawingBuildingPoints, setDrawingBuildingPoints] = useState<Point[]>([]);
  const [drawingBuildingHover, setDrawingBuildingHover] = useState<Point | null>(null);
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);

  // Add Device direct target
  const [targetBuildingForDevice, setTargetBuildingForDevice] = useState<Building | null>(null);
  const [targetPointForDevice, setTargetPointForDevice] = useState<Point | null>(null);

  // Edit Mode Dragging states
  const [draggingBuilding, setDraggingBuilding] = useState<Building | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ cableId: string; pointIdx: number } | null>(null);
  const [draggingDevice, setDraggingDevice] = useState<Device | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Deletion & Editing states
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);
  const [cableToDelete, setCableToDelete] = useState<CableRoute | null>(null);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);
  const [cableToEdit, setCableToEdit] = useState<CableRoute | null>(null);
  const [draggingVertex, setDraggingVertex] = useState<{ buildingId: string; vertexIdx: number } | null>(null);
  const [isClearMapModalOpen, setIsClearMapModalOpen] = useState(false);

  // 4. Layer & Filter States
  const [layers, setLayers] = useState<MapLayerToggles>({
    buildings: true,
    cables: true,
    devices: true,
    labels: true
  });

  const [filters, setFilters] = useState<MapFilters>({
    entity: 'all',
    status: 'all'
  });

  // 5. Fullscreen & References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddCableOpen, setIsAddCableOpen] = useState(false);
  const [isCreateMaintOpen, setIsCreateMaintOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load factory layout data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await factoryMapService.loadMapData();
        setMapData(data);

        // Check if query param requests a specific building, e.g. /network-layout?code=KU
        const codeQuery = searchParams.get('code');
        if (codeQuery) {
          const target = data.buildings.find(b => b.code.toLowerCase() === codeQuery.toLowerCase());
          if (target) {
            setSelectedBuilding(target);
          }
        }
      } catch (err) {
        console.error('[FactoryLayout] Error loading map data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

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
      console.warn('[FactoryLayout] Fullscreen error:', err);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.6));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    showToast('Tampilan posisi dan zoom denah direset ke 100%');
  };

  const handleFitToScreen = () => {
    if (!canvasRef.current) return;
    const { clientWidth, clientHeight } = canvasRef.current;
    const imgWidth = 445;
    const imgHeight = 561;

    const scaleX = (clientWidth - 80) / imgWidth;
    const scaleY = (clientHeight - 80) / imgHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.8);

    setZoom(Number(Math.max(fitScale, 0.7).toFixed(2)));
    setPan({ x: 0, y: 0 });
    showToast('Tampilan denah disesuaikan ke ukuran layar (Fit to Screen)');
  };

  // Screen to SVG Coordinate Mapping (W3C standard CTM projection)
  const getSvgCoords = useCallback((e: React.MouseEvent): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.round(Math.max(0, Math.min(445, transformed.x))),
      y: Math.round(Math.max(0, Math.min(561, transformed.y)))
    };
  }, []);

  // Pan & Canvas Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    // Enable pan in pan mode or with middle mouse button
    if (toolMode === 'pan' || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (toolMode === 'draw_cable') {
      setDrawingCableHover(getSvgCoords(e));
    } else if (toolMode === 'draw_building') {
      setDrawingBuildingHover(getSvgCoords(e));
    } else if (toolMode === 'edit_layout' && draggingBuilding && mapData) {
      const pt = getSvgCoords(e);
      const dx = pt.x - draggingBuilding.center.x;
      const dy = pt.y - draggingBuilding.center.y;

      const updatedBuildings = mapData.buildings.map(b => {
        if (b.id === draggingBuilding.id) {
          return {
            ...b,
            center: { x: pt.x, y: pt.y },
            polygon: b.polygon.map(p => ({ x: p.x + dx, y: p.y + dy }))
          };
        }
        return b;
      });

      setMapData({ ...mapData, buildings: updatedBuildings });
      setDraggingBuilding(prev => prev ? {
        ...prev,
        center: { x: pt.x, y: pt.y },
        polygon: prev.polygon.map(p => ({ x: p.x + dx, y: p.y + dy }))
      } : null);
      setHasUnsavedChanges(true);
    } else if (toolMode === 'edit_layout' && draggingWaypoint && mapData) {
      const pt = getSvgCoords(e);
      const updatedCables = mapData.cableRoutes.map(c => {
        if (c.id === draggingWaypoint.cableId) {
          const newPath = [...c.path];
          newPath[draggingWaypoint.pointIdx] = pt;
          return { ...c, path: newPath };
        }
        return c;
      });
      setMapData({ ...mapData, cableRoutes: updatedCables });
      setHasUnsavedChanges(true);
    } else if (toolMode === 'edit_layout' && draggingDevice && mapData) {
      const pt = getSvgCoords(e);
      const updatedDevices = mapData.devices.map(d => {
        if (d.id === draggingDevice.id) {
          return { ...d, x: pt.x, y: pt.y, pos_x: pt.x, pos_y: pt.y };
        }
        return d;
      });
      setMapData({ ...mapData, devices: updatedDevices });
      setDraggingDevice(prev => prev ? { ...prev, x: pt.x, y: pt.y, pos_x: pt.x, pos_y: pt.y } : null);
      setHasUnsavedChanges(true);
    } else if (toolMode === 'edit_layout' && draggingVertex && mapData) {
      const pt = getSvgCoords(e);
      const updatedBuildings = mapData.buildings.map(b => {
        if (b.id === draggingVertex.buildingId) {
          const newPoly = [...b.polygon];
          newPoly[draggingVertex.vertexIdx] = pt;
          const sumX = newPoly.reduce((acc, p) => acc + p.x, 0);
          const sumY = newPoly.reduce((acc, p) => acc + p.y, 0);
          const newCenter = {
            x: Math.round(sumX / newPoly.length),
            y: Math.round(sumY / newPoly.length)
          };
          return { ...b, polygon: newPoly, center: newCenter };
        }
        return b;
      });
      setMapData({ ...mapData, buildings: updatedBuildings });
      setHasUnsavedChanges(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (draggingBuilding) setDraggingBuilding(null);
    if (draggingWaypoint) setDraggingWaypoint(null);
    if (draggingVertex) setDraggingVertex(null);
    if (draggingDevice) setDraggingDevice(null);
  };

  // Mobile Touch Gestures (1-finger pan, 2-finger pinch zoom)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchPinchDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      touchPinchDistRef.current = null;
      if (toolMode === 'pan') {
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchPinchDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = null;
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current && (toolMode === 'pan' || isDragging)) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - touchStartRef.current.x,
        y: touch.clientY - touchStartRef.current.y
      });
    } else if (e.touches.length === 2 && touchPinchDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = newDist / touchPinchDistRef.current;
      touchPinchDistRef.current = newDist;

      if (ratio && Number.isFinite(ratio) && Math.abs(ratio - 1) > 0.008) {
        setZoom(prevZoom => {
          const nextZoom = Math.min(Math.max(Number((prevZoom * ratio).toFixed(2)), 0.5), 4.0);
          return nextZoom;
        });
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchPinchDistRef.current = null;
    setIsDragging(false);
  };

  // Authoring Canvas Clicks
  const handleSvgCanvasClick = (e: React.MouseEvent) => {
    if (toolMode === 'add_device') {
      const pt = getSvgCoords(e);
      const nearbyBld = mapData?.buildings.find(b => Math.hypot(b.center.x - pt.x, b.center.y - pt.y) < 25);
      setTargetPointForDevice(pt);
      setTargetBuildingForDevice(nearbyBld || null);
      setIsAddDeviceOpen(true);
      showToast(`Menandai koordinat perangkat X:${Math.round(pt.x)}, Y:${Math.round(pt.y)}`);
    } else if (toolMode === 'draw_cable') {
      const pt = getSvgCoords(e);
      // Snap to building center if close (radius 22)
      const nearbyBld = mapData?.buildings.find(b => Math.hypot(b.center.x - pt.x, b.center.y - pt.y) < 22);
      const finalPt = nearbyBld ? nearbyBld.center : pt;

      if (drawingCablePoints.length === 0) {
        setDrawingCablePoints([finalPt]);
        if (nearbyBld) setStartBuildingForCable(nearbyBld);
      } else {
        if (nearbyBld && startBuildingForCable && nearbyBld.id !== startBuildingForCable.id) {
          setDrawingCablePoints(prev => [...prev, finalPt]);
          setEndBuildingForCable(nearbyBld);
          setIsAddCableModalOpen(true);
        } else {
          setDrawingCablePoints(prev => [...prev, finalPt]);
        }
      }
    } else if (toolMode === 'draw_building') {
      const pt = getSvgCoords(e);
      setDrawingBuildingPoints(prev => [...prev, pt]);
    }
  };

  const handleSvgDoubleClick = () => {
    if (toolMode === 'draw_cable' && drawingCablePoints.length >= 2) {
      setIsAddCableModalOpen(true);
    } else if (toolMode === 'draw_building' && drawingBuildingPoints.length >= 3) {
      setIsAddBuildingModalOpen(true);
    }
  };

  // Authoring Save Handlers
  const handleSaveNewCable = async (newCable: CableRoute) => {
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk menambah kabel.');
      return;
    }
    await factoryMapService.addCableRoute(newCable);
    setMapData(prev => prev ? {
      ...prev,
      cableRoutes: [...prev.cableRoutes, newCable]
    } : prev);
    setDrawingCablePoints([]);
    setDrawingCableHover(null);
    setStartBuildingForCable(null);
    setEndBuildingForCable(null);
    setToolMode('select');
    showToast(`Rute kabel ${newCable.code} (${newCable.name}) berhasil ditambahkan dan aktif!`);
  };

  const handleSaveNewBuilding = async (newBuilding: Building) => {
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk menambah gedung.');
      return;
    }
    await factoryMapService.addBuilding(newBuilding);
    setMapData(prev => prev ? {
      ...prev,
      buildings: [...prev.buildings, newBuilding]
    } : prev);
    setDrawingBuildingPoints([]);
    setDrawingBuildingHover(null);
    setToolMode('select');
    showToast(`Gedung ${newBuilding.code} - ${newBuilding.name} berhasil ditambahkan!`);
  };

  const handleSaveLayoutChanges = async () => {
    if (!mapData) return;
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk menyimpan perubahan layout.');
      return;
    }
    factoryMapService.saveToStorage();

    // Sync moved buildings, cables, and devices to backend MySQL API
    try {
      await Promise.all([
        ...mapData.buildings.map(b =>
          fetch(`/api/buildings/${encodeURIComponent(b.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(b)
          })
        ),
        ...mapData.cableRoutes.map(c =>
          fetch(`/api/cables/${encodeURIComponent(c.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c)
          })
        ),
        ...mapData.devices.map(d =>
          fetch(`/api/devices/${encodeURIComponent(d.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...d, pos_x: d.x ?? d.pos_x, pos_y: d.y ?? d.pos_y })
          })
        )
      ]);
    } catch (e) {
      console.warn('[InteractiveFactoryLayoutPage] API sync notice during layout save:', e);
    }

    setHasUnsavedChanges(false);
    showToast('Perubahan posisi denah pabrik berhasil disimpan ke database!');
  };

  const handleConfirmClearMap = async () => {
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk mengosongkan denah.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await factoryMapService.clearAllMapData();
      setMapData({
        buildings: [],
        cableRoutes: [],
        devices: [],
        alerts: [],
        racks: []
      });
      setSelectedBuilding(null);
      setSelectedCable(null);
      setSelectedDevice(null);
      setIsClearMapModalOpen(false);
      showToast(res.message || 'Denah pabrik berhasil dikosongkan.');
    } catch (err: any) {
      showToast('Gagal mengosongkan denah pabrik: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFactoryDefaults = async () => {
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk memulihkan default.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await factoryMapService.resetToFactoryDefaults();
      const reloaded = await factoryMapService.loadMapData();
      setMapData(reloaded);
      setSelectedBuilding(null);
      setSelectedCable(null);
      setSelectedDevice(null);
      showToast(res.message || 'Layout default pabrik CBA berhasil dipulihkan.');
    } catch (err: any) {
      showToast('Gagal memulihkan data default: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditedBuilding = async (updatedBuilding: Building) => {
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk mengedit gedung.');
      return;
    }
    // 1. Optimistic update: instantly reflect color and changes in UI
    setMapData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        buildings: prev.buildings.map(b => b.id === updatedBuilding.id ? { ...b, ...updatedBuilding } : b)
      };
    });
    if (selectedBuilding?.id === updatedBuilding.id) {
      setSelectedBuilding(updatedBuilding);
    }
    setBuildingToEdit(null);

    // 2. Persist to backend and reload single-source-of-truth
    try {
      await factoryMapService.updateBuilding(updatedBuilding);
      const reloaded = await factoryMapService.loadMapData();
      setMapData(reloaded);
      if (selectedBuilding?.id === updatedBuilding.id) {
        const found = reloaded.buildings.find(b => b.id === updatedBuilding.id);
        if (found) setSelectedBuilding(found);
      }
    } catch (err) {
      console.warn('Failed to sync building edit:', err);
    }
    showToast(`Data Gedung ${updatedBuilding.code} (${updatedBuilding.name}) berhasil diperbarui!`);
  };

  const handleSaveEditedCable = async (updatedCable: CableRoute) => {
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk mengedit kabel.');
      return;
    }
    try {
      const res = await cableService.updateCable(updatedCable.id, updatedCable);
      if (res.success) {
        const reloaded = await factoryMapService.loadMapData();
        setMapData(reloaded);
        if (selectedCable?.id === updatedCable.id) {
          setSelectedCable(updatedCable);
        }
        setCableToEdit(null);
        showToast(`Rute kabel ${updatedCable.code} (${updatedCable.name}) berhasil diperbarui!`);
      } else {
        showToast(`Gagal update kabel: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Gagal menyimpan perubahan kabel'}`);
    }
  };

  const confirmDeleteBuilding = async () => {
    if (!buildingToDelete) return;
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk menghapus gedung.');
      return;
    }
    const res = await factoryMapService.deleteBuilding(buildingToDelete.id);
    const reloaded = await factoryMapService.loadMapData();
    setMapData(reloaded);
    if (selectedBuilding?.id === buildingToDelete.id) {
      setSelectedBuilding(null);
    }
    showToast(res.message || `Gedung ${buildingToDelete.code} (${buildingToDelete.name}) beserta seluruh aset di dalamnya berhasil dihapus!`);
    setBuildingToDelete(null);
  };

  const confirmDeleteCable = async () => {
    if (!cableToDelete) return;
    if (isViewer) {
      showToast('Akses ditolak: Peran Viewer tidak memiliki izin untuk menghapus kabel.');
      return;
    }
    await factoryMapService.deleteCableRoute(cableToDelete.id);
    const reloaded = await factoryMapService.loadMapData();
    setMapData(reloaded);
    if (selectedCable?.id === cableToDelete.id) {
      setSelectedCable(null);
    }
    showToast(`Jalur kabel ${cableToDelete.code} berhasil dihapus dari denah!`);
    setCableToDelete(null);
  };

  const cancelDrawingMode = () => {
    setDrawingCablePoints([]);
    setDrawingCableHover(null);
    setStartBuildingForCable(null);
    setEndBuildingForCable(null);
    setDrawingBuildingPoints([]);
    setDrawingBuildingHover(null);
    setToolMode('select');
  };

  // Universal Building Click Handler (Works identically in both 2D Denah and 3D Twin)
  const handleUniversalBuildingClick = (bld: Building) => {
    if (toolMode === 'add_device') {
      setTargetBuildingForDevice(bld);
      setIsAddDeviceOpen(true);
      showToast(`Memasang perangkat baru di Gedung ${bld.code} - ${bld.name}`);
      return;
    }
    if (toolMode === 'draw_cable') {
      if (drawingCablePoints.length === 0) {
        setDrawingCablePoints([bld.center]);
        setStartBuildingForCable(bld);
        showToast(`Titik awal kabel: Gedung ${bld.code}. Klik belokan tanah atau klik gedung tujuan.`);
      } else {
        if (startBuildingForCable && bld.id !== startBuildingForCable.id) {
          setDrawingCablePoints(prev => [...prev, bld.center]);
          setEndBuildingForCable(bld);
          setIsAddCableModalOpen(true);
        }
      }
      return;
    }
    if (toolMode === 'edit_layout') {
      setBuildingToEdit(bld);
      showToast(`Membuka formulir edit spesifikasi & tata letak Gedung ${bld.code}`);
      return;
    }
    // Normal selection
    setSelectedBuilding(bld);
    setSelectedDevice(null);
    setSelectedCable(null);
    showToast(`Membuka drawer gedung ${bld.code} - ${bld.name}`);
  };

  const handleUniversalCableClick = (cable: CableRoute) => {
    if (toolMode === 'edit_layout') {
      setCableToEdit(cable);
      showToast(`Membuka formulir edit rute kabel ${cable.code}`);
      return;
    }
    setSelectedCable(cable);
    setSelectedBuilding(null);
    setSelectedDevice(null);
    showToast(`Memilih rute kabel ${cable.code} - ${cable.name}`);
  };

  const handleUniversalDeviceClick = (dev: Device) => {
    setSelectedDevice(dev);
    setSelectedBuilding(null);
    setSelectedCable(null);
    showToast(`Membuka rincian switch ${dev.name}`);
  };

  // Native mouse wheel zoom with focal point tracking (zoom towards mouse cursor)
  useEffect(() => {
    if (isLoading || !mapData) return;

    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Don't zoom if user is scrolling inside a drawer or modal dialog
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.custom-scrollbar') || target?.closest?.('[role="dialog"]')) {
        return;
      }

      e.preventDefault();

      const rect = el.getBoundingClientRect();
      // Mouse position relative to center of the canvas viewport
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;

      // Smooth zoom factor based on deltaY magnitude
      const isZoomIn = e.deltaY < 0;
      const deltaRatio = Math.min(Math.max(Math.abs(e.deltaY) / 100, 0.5), 2.2);
      const zoomFactor = isZoomIn ? (1 + 0.12 * deltaRatio) : (1 - 0.11 * deltaRatio);

      setZoom(prevZoom => {
        const nextZoom = Math.min(Math.max(Number((prevZoom * zoomFactor).toFixed(3)), 0.4), 4.5);
        if (nextZoom === prevZoom) return prevZoom;

        const ratio = nextZoom / prevZoom;
        setPan(prevPan => ({
          x: Math.round(cx - (cx - prevPan.x) * ratio),
          y: Math.round(cy - (cy - prevPan.y) * ratio)
        }));

        return nextZoom;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isLoading, mapData]);

  // Center & focus camera to specific coordinates
  const focusCoordinates = (x: number, y: number, targetZoom = 1.45) => {
    // 445 / 2 = 222.5, 561 / 2 = 280.5 (center of coordinate system)
    const targetPanX = (222.5 - x) * targetZoom;
    const targetPanY = (280.5 - y) * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Unified Search Selection Handler
  const handleSelectSearchResult = (result: SearchResultItem) => {
    if (result.type === 'building') {
      const bld = result.targetObject as Building;
      setSelectedBuilding(bld);
      setSelectedDevice(null);
      setSelectedCable(null);
      focusCoordinates(bld.center.x, bld.center.y);
      showToast(`Memusatkan kamera ke ${bld.code} (${bld.name})`);
    } else if (result.type === 'device') {
      const dev = result.targetObject as Device;
      setSelectedDevice(dev);
      setSelectedBuilding(null);
      setSelectedCable(null);

      // Find device building to focus
      const bld = mapData?.buildings.find(b => b.id === dev.buildingId);
      if (bld) {
        focusCoordinates(bld.center.x, bld.center.y, 1.7);
      }
      showToast(`Menampilkan perangkat ${dev.name} (${dev.ip})`);
    } else if (result.type === 'cable') {
      const cable = result.targetObject as CableRoute;
      setSelectedCable(cable);
      setSelectedBuilding(null);
      setSelectedDevice(null);

      if (cable.path && cable.path.length > 0) {
        const midIdx = Math.floor(cable.path.length / 2);
        const midPt = cable.path[midIdx] || cable.path[0];
        focusCoordinates(midPt.x, midPt.y, 1.5);
      }
      showToast(`Menampilkan jalur kabel ${cable.code} (${cable.name})`);
    }
  };

  // Filter calculations
  const counts = useMemo(() => {
    if (!mapData) {
      return { buildings: 0, devices: 0, cables: 0, online: 0, offline: 0, warning: 0, unknown: 0 };
    }

    const bCount = mapData.buildings.length;
    const dCount = mapData.devices.length;
    const cCount = mapData.cableRoutes.length;

    let online = 0;
    let offline = 0;
    let warning = 0;
    let unknown = 0;

    mapData.devices.forEach(d => {
      if (d.status === 'online') online++;
      else if (d.status === 'offline') offline++;
      else if (d.status === 'warning') warning++;
      else unknown++;
    });

    return { buildings: bCount, devices: dCount, cables: cCount, online, offline, warning, unknown };
  }, [mapData]);

  // Check if an item matches the current active filters
  const isBuildingVisible = (bld: Building) => {
    if (!layers.buildings) return false;
    if (filters.entity !== 'all' && filters.entity !== 'buildings') return false;
    if (filters.status === 'all') return true;

    if (filters.status === 'online' && bld.status === 'healthy') return true;
    if (filters.status === 'warning' && bld.status === 'warning') return true;
    if (filters.status === 'offline' && bld.status === 'critical') return true;
    if (filters.status === 'unknown' && bld.status !== 'healthy' && bld.status !== 'warning' && bld.status !== 'critical') return true;

    return false;
  };

  const isCableVisible = (cable: CableRoute) => {
    if (!layers.cables) return false;
    if (filters.entity !== 'all' && filters.entity !== 'cables') return false;
    if (filters.status === 'all') return true;

    if (filters.status === 'online' && (cable.status === 'active' || cable.status === 'normal')) return true;
    if (filters.status === 'warning' && cable.status === 'degraded') return true;
    if (filters.status === 'offline' && cable.status === 'broken') return true;
    if (filters.status === 'unknown' && cable.status === 'maintenance') return true;

    return false;
  };

  const isDeviceVisible = (device: Device) => {
    if (!layers.devices) return false;
    if (filters.entity !== 'all' && filters.entity !== 'devices') return false;
    if (filters.status === 'all') return true;
    return device.status === filters.status;
  };

  if (isLoading || !mapData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 font-sans gap-3">
        <Loader2 className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider">
          Memuat Interactive Factory Layout GIS (PT. CBA Chemical Industry)...
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] bg-slate-100 dark:bg-[#080D1A] overflow-hidden select-none font-sans"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-cyan-500/50 flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-300 pointer-events-auto max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-medium truncate">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Header Toolbar Overlay */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-30 flex items-center justify-between gap-1.5 sm:gap-3 pointer-events-none">
        {/* Left: Search Bar & Filter Panel */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto flex-1 min-w-0 max-w-sm sm:max-w-md">
          <MapSearchBar
            buildings={mapData.buildings}
            devices={mapData.devices}
            cableRoutes={mapData.cableRoutes}
            onSelectResult={handleSelectSearchResult}
          />
          <MapFilterPanel
            filters={filters}
            onChangeFilters={setFilters}
            counts={counts}
          />
        </div>

        {/* Right: Map Toolbar (View Switcher, Select, Pan, Authoring Tools, Zoom, Reset, Fit, Fullscreen, Layer Toggles) */}
        <div className="pointer-events-auto shrink-0">
          <MapToolbar
            isViewer={isViewer}
            toolMode={toolMode}
            onToolModeChange={(mode) => {
              if (isViewer && mode !== 'select' && mode !== 'pan') {
                showToast('Akses ditolak: Peran Viewer hanya memiliki hak akses baca (Read-Only).');
                return;
              }
              // If exiting draw mode, clear incomplete points
              if (toolMode === 'draw_cable' || toolMode === 'draw_building') {
                cancelDrawingMode();
              }
              setToolMode(mode);
            }}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            onFitToScreen={handleFitToScreen}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            layers={layers}
            onToggleLayer={(key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
            onSaveLayout={handleSaveLayoutChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            mapViewStyle={mapViewStyle}
            onToggleMapViewStyle={setMapViewStyle}
            onClearMap={() => setIsClearMapModalOpen(true)}
            onResetFactoryDefaults={handleResetFactoryDefaults}
          />
        </div>
      </div>

      {/* Floating Authoring Guidance Banner (Top HUD) */}
      {toolMode !== 'select' && toolMode !== 'pan' && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-2 sm:px-4 sm:py-2 shadow-2xl flex items-center gap-2 sm:gap-3 text-xs select-none animate-in fade-in slide-in-from-top-2 pointer-events-auto max-w-[94vw] w-max">
          {toolMode === 'draw_cable' && (
            <>
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                <GitFork className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  Mode Tarik Kabel: {drawingCablePoints.length === 0 ? 'Klik gedung / titik awal' : `${drawingCablePoints.length} titik dibuat.`}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Klik gedung akhir atau tombol "Selesai" untuk menyimpan jalur kabel.
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {drawingCablePoints.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setIsAddCableModalOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs text-xs"
                  >
                    Selesai ({drawingCablePoints.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={cancelDrawingMode}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium cursor-pointer transition-all text-xs"
                >
                  Batal
                </button>
              </div>
            </>
          )}

          {toolMode === 'add_device' && (
            <>
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  Mode Tambah Device: Klik gedung untuk pasang
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Mendukung Switch, Access Point, Router, Firewall, Server.
                </span>
              </div>
              <button
                type="button"
                onClick={cancelDrawingMode}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium cursor-pointer transition-all ml-auto shrink-0 text-xs"
              >
                Batal
              </button>
            </>
          )}

          {toolMode === 'draw_building' && (
            <>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  Gambar Gedung: {drawingBuildingPoints.length < 3 ? `Klik sudut (${drawingBuildingPoints.length}/3 min)` : `${drawingBuildingPoints.length} sudut.`}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {mapViewStyle === '3d_interactive'
                    ? 'Klik di tanah 3D untuk menandai sudut tapak gedung.'
                    : 'Tentukan sudut batas gedung, lalu klik "Selesai".'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {drawingBuildingPoints.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => setIsAddBuildingModalOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs text-xs"
                  >
                    Selesai ({drawingBuildingPoints.length})
                  </button>
                )}
                {mapViewStyle === '3d_interactive' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMapViewStyle('3d_render');
                      showToast('Beralih ke Masterplan 2D untuk menggambar denah');
                    }}
                    className="hidden sm:inline-block px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 rounded-xl font-semibold cursor-pointer transition-all text-xs"
                    title="Beralih ke tampilan Masterplan 2D untuk tracing denah"
                  >
                    Ke 2D
                  </button>
                )}
                <button
                  type="button"
                  onClick={cancelDrawingMode}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium cursor-pointer transition-all text-xs"
                >
                  Batal
                </button>
              </div>
            </>
          )}

          {toolMode === 'edit_layout' && (
            <>
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <PenTool className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {mapViewStyle === '3d_interactive' ? 'Mode Edit 3D: Klik gedung' : 'Mode Edit: Geser penanda gedung / kabel'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {mapViewStyle === '3d_interactive'
                    ? 'Klik gedung 3D untuk mengedit informasi.'
                    : 'Drag titik kuning (gedung) atau cyan (kabel).'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={handleSaveLayoutChanges}
                    className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs text-xs"
                  >
                    Simpan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setToolMode('select')}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium cursor-pointer transition-all text-xs"
                >
                  Selesai
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden touch-none bg-slate-100 dark:bg-[#080D1A] ${
          mapViewStyle === '3d_interactive'
            ? 'cursor-default'
            : toolMode === 'pan'
            ? (isDragging ? 'cursor-grabbing' : 'cursor-grab')
            : toolMode === 'draw_cable' || toolMode === 'draw_building'
            ? 'cursor-crosshair'
            : toolMode === 'add_device'
            ? 'cursor-cell'
            : 'cursor-default'
        }`}
        onMouseDown={mapViewStyle === '3d_interactive' ? undefined : handleMouseDown}
        onMouseMove={mapViewStyle === '3d_interactive' ? undefined : handleMouseMove}
        onMouseUp={mapViewStyle === '3d_interactive' ? undefined : handleMouseUp}
        onMouseLeave={mapViewStyle === '3d_interactive' ? undefined : handleMouseUp}
        onTouchStart={mapViewStyle === '3d_interactive' ? undefined : handleTouchStart}
        onTouchMove={mapViewStyle === '3d_interactive' ? undefined : handleTouchMove}
        onTouchEnd={mapViewStyle === '3d_interactive' ? undefined : handleTouchEnd}
        onTouchCancel={mapViewStyle === '3d_interactive' ? undefined : handleTouchEnd}
      >
        {mapViewStyle === '3d_interactive' ? (
          <div className="absolute inset-0 w-full h-full z-10">
            <Factory3DScene
              buildings={mapData.buildings.filter(isBuildingVisible)}
              cableRoutes={mapData.cableRoutes.filter(isCableVisible)}
              devices={mapData.devices}
              selectedBuilding={selectedBuilding}
              selectedCable={selectedCable}
              onSelectBuilding={handleUniversalBuildingClick}
              onSelectCable={handleUniversalCableClick}
              onSelectDevice={handleUniversalDeviceClick}
              onHoverBuilding={(bld, pos) => {
                setHoveredBuilding(bld);
                if (pos) setTooltipPos(pos);
              }}
              layers={layers}
              theme={theme === 'dark' ? 'dark' : 'light'}
              toolMode={toolMode}
              drawingBuildingPoints={drawingBuildingPoints}
              onAddBuildingPoint={(pt) => {
                setDrawingBuildingPoints(prev => [...prev, pt]);
                showToast(`Sudut tapak gedung ke-${drawingBuildingPoints.length + 1} ditandai di tanah 3D`);
              }}
              drawingCablePoints={drawingCablePoints}
              onAddCablePoint={(pt) => {
                const nearbyBld = mapData?.buildings.find(b => Math.hypot(b.center.x - pt.x, b.center.y - pt.y) < 22);
                const finalPt = nearbyBld ? nearbyBld.center : pt;
                if (drawingCablePoints.length === 0) {
                  setDrawingCablePoints([finalPt]);
                  if (nearbyBld) setStartBuildingForCable(nearbyBld);
                } else {
                  if (nearbyBld && startBuildingForCable && nearbyBld.id !== startBuildingForCable.id) {
                    setDrawingCablePoints(prev => [...prev, finalPt]);
                    setEndBuildingForCable(nearbyBld);
                    setIsAddCableModalOpen(true);
                  } else {
                    setDrawingCablePoints(prev => [...prev, finalPt]);
                  }
                }
              }}
            />
          </div>
        ) : (
          <>
            {/* Compass Widget */}
            <div className="hidden sm:block">
              <CompassRose />
            </div>

            {/* Minimap & Secondary Zoom Widget */}
            <div className="hidden md:flex">
              <MinimapControls
                zoom={zoom}
                pan={pan}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onReset={handleReset}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
              />
            </div>

            {/* Scalable & Pannable SVG Layout Container (Dimension: 445 x 561) */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 120ms cubic-bezier(0, 0, 0.2, 1)'
              }}
              className="relative shrink-0 shadow-2xl"
            >
          <svg
            ref={svgRef}
            width="445"
            height="561"
            viewBox="0 0 445 561"
            className="overflow-visible"
            style={{ display: 'block' }}
            onClick={handleSvgCanvasClick}
            onDoubleClick={handleSvgDoubleClick}
          >
            {/* Definitions: SVG Glow Filters & Markers */}
            <defs>
              <filter id="cba-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.0" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="cba-glow-amber" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.0" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="cba-glow-rose" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* LAYER 1: 3D Aerial Masterplan Render */}
            <g id="layer-3d-aerial-masterplan">
              <image
                href="/cba_layout_3d.jpg"
                x="0"
                y="0"
                width="445"
                height="561"
                preserveAspectRatio="none"
                className="transition-all duration-300 pointer-events-none"
                style={{
                  filter: theme === 'dark'
                    ? 'brightness(0.92) contrast(1.10) saturate(1.05)'
                    : 'brightness(1.0) contrast(1.02)'
                }}
              />
              {/* Subtle contrast overlay for high-tech digital twin readability */}
              <rect
                x="0"
                y="0"
                width="445"
                height="561"
                fill={theme === 'dark' ? 'rgba(5, 11, 24, 0.18)' : 'rgba(255, 255, 255, 0.02)'}
                pointerEvents="none"
              />
            </g>

            {/* LAYER 2: Cable Routes Overlay */}
            {mapData.cableRoutes.map((cable) => {
              if (!isCableVisible(cable)) return null;

              const isBackbone = cable.type === 'backbone';
              const isWireless = cable.type === 'wireless';
              const isSelected = selectedCable?.id === cable.id;

              const strokeColor = cable.color || (
                isBackbone ? '#f97316' : cable.type === 'fiber' ? '#06b6d4' : cable.type === 'utp' ? '#10b981' : '#eab308'
              );

              const strokeWidth = isSelected 
                ? (isBackbone ? 5.5 : 4.5) 
                : (isBackbone ? 3.5 : 2.5);

              const pathD = cable.path.reduce((acc, pt, idx) => {
                return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
              }, '');

              const midIdx = Math.floor(cable.path.length / 2);
              const midPt = cable.path[midIdx] || cable.path[0];
              const tagPos = cable.labelPos || midPt;

              return (
                <g
                  key={cable.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (toolMode === 'edit_layout') {
                      setCableToEdit(cable);
                      showToast(`Membuka formulir edit rute kabel ${cable.code}`);
                      return;
                    }
                    setSelectedCable(cable);
                    setSelectedBuilding(null);
                    setSelectedDevice(null);
                    showToast(`Membuka rincian kabel ${cable.code}`);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Invisible Hit Area */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="18" />

                  {/* Visible Cable Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isWireless ? '4 3' : 'none'}
                    filter={isSelected ? 'url(#cba-glow-cyan)' : 'none'}
                    className="transition-all duration-150 group-hover:brightness-125"
                  />

                  {/* Flow Particle Animation */}
                  {!isWireless && (
                    <circle r={isSelected ? 3.5 : 2.5} fill="#ffffff">
                      <animateMotion path={pathD} dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Cable Label Tag */}
                  {layers.labels && tagPos && (
                    <g transform={`translate(${tagPos.x}, ${tagPos.y})`} className="pointer-events-none">
                      <rect
                        x="-16"
                        y="-6"
                        width="32"
                        height="12"
                        rx="3"
                        fill="#070f20"
                        fillOpacity="0.94"
                        stroke={strokeColor}
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="2.5"
                        fill="#ffffff"
                        fontSize="5"
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

            {/* LAYER 3A: Building Footprints & Polygons */}
            <g id="layer-building-polygons">
              {mapData.buildings.map((bld) => {
                if (!isBuildingVisible(bld)) return null;

                const isSelected = selectedBuilding?.id === bld.id;
                const isHovered = hoveredBuilding?.id === bld.id;
                const pointsStr = bld.polygon.map(pt => `${pt.x},${pt.y}`).join(' ');

                return (
                  <g
                    key={`bld-poly-${bld.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toolMode === 'draw_building') {
                        handleSvgCanvasClick(e);
                        return;
                      }
                      if (toolMode === 'add_device') {
                        setTargetBuildingForDevice(bld);
                        setIsAddDeviceOpen(true);
                        showToast(`Menambahkan perangkat untuk Gedung ${bld.code} (${bld.name})`);
                        return;
                      }
                      if (toolMode === 'draw_cable') {
                        if (drawingCablePoints.length === 0) {
                          setDrawingCablePoints([bld.center]);
                          setStartBuildingForCable(bld);
                          showToast(`Titik awal kabel: Gedung ${bld.code}. Klik belokan jalan atau klik gedung tujuan.`);
                        } else {
                          setDrawingCablePoints(prev => [...prev, bld.center]);
                          setEndBuildingForCable(bld);
                          setIsAddCableModalOpen(true);
                        }
                        return;
                      }
                      if (toolMode === 'edit_layout') {
                        setBuildingToEdit(bld);
                        showToast(`Membuka formulir edit data Gedung ${bld.code}`);
                        return;
                      }
                      setSelectedBuilding(bld);
                      setSelectedDevice(null);
                      setSelectedCable(null);
                      showToast(`Membuka drawer gedung ${bld.code} - ${bld.name}`);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredBuilding(bld);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredBuilding(null);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Inner Roof Surface Highlight for Colored Buildings */}
                    {bld.color && bld.polygon.length >= 3 && (
                      <polygon
                        points={bld.polygon.map(p => {
                          const dx = bld.center.x - p.x;
                          const dy = bld.center.y - p.y;
                          return `${Math.round(p.x + dx * 0.18)},${Math.round(p.y + dy * 0.18)}`;
                        }).join(' ')}
                        fill={bld.color}
                        fillOpacity={isSelected ? 0.32 : isHovered ? 0.22 : 0.15}
                        stroke={bld.color}
                        strokeWidth="1.0"
                        strokeOpacity="0.75"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Building Polygon Hotspot Overlay */}
                    <polygon
                      points={pointsStr}
                      fill={
                        bld.color
                          ? bld.color
                          : isSelected
                          ? '#0284c7'
                          : isHovered
                          ? '#38bdf8'
                          : 'transparent'
                      }
                      fillOpacity={
                        bld.color
                          ? (isSelected ? 0.52 : isHovered ? 0.40 : 0.30)
                          : (isSelected ? 0.35 : isHovered ? 0.22 : 0)
                      }
                      stroke={
                        bld.color
                          ? bld.color
                          : isSelected
                          ? '#00f2fe'
                          : isHovered
                          ? '#38bdf8'
                          : (theme === 'dark' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)')
                      }
                      strokeWidth={isSelected ? 3.0 : isHovered ? 2.2 : (bld.color ? 1.8 : 0.9)}
                      strokeDasharray="none"
                      filter={
                        isSelected
                          ? 'url(#cba-glow-cyan)'
                          : isHovered
                          ? 'url(#cba-glow-cyan)'
                          : 'none'
                      }
                      className="cursor-pointer transition-all duration-150"
                    />

                    {/* Pulsing Selection Radar Beacon */}
                    {isSelected && (
                      <g className="pointer-events-none">
                        <circle
                          cx={bld.center.x}
                          cy={bld.center.y}
                          r="18"
                          fill="none"
                          stroke={bld.color || '#00f2fe'}
                          strokeWidth="1.6"
                          opacity="0.9"
                        >
                          <animate attributeName="r" values="8;30" dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.95;0" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                        <circle
                          cx={bld.center.x}
                          cy={bld.center.y}
                          r="3.5"
                          fill={bld.color || '#00f2fe'}
                          filter="url(#cba-glow-cyan)"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* LAYER 3B: Building Hotspot Badges & Labels (Rendered ON TOP of all building polygons) */}
            <g id="layer-building-badges">
              {mapData.buildings.map((bld) => {
                if (!isBuildingVisible(bld)) return null;

                const isSelected = selectedBuilding?.id === bld.id;
                const isHovered = hoveredBuilding?.id === bld.id;
                const bldDev = mapData.devices.find(d => d.buildingId === bld.id);

                const statusColor = bld.status === 'healthy' 
                  ? '#10b981' 
                  : bld.status === 'warning' 
                  ? '#f59e0b' 
                  : bld.status === 'critical'
                  ? '#f43f5e'
                  : '#64748b';

                const labelText = (bld.name || bld.code || '').trim();
                const hasDev = Boolean(layers.devices && bldDev);
                const showLabelText = Boolean(layers.labels && labelText.length > 0);

                // Calculate pill dimensions based on whether label text is active or not
                const textLen = showLabelText ? labelText.length : 0;
                const swWidth = hasDev ? 22 : 0;
                const pillW = showLabelText 
                  ? Math.max(38, Math.round(textLen * 5.4 + 20 + swWidth))
                  : (hasDev ? 30 : 18);
                const pillH = 14;

                if (!showLabelText && !hasDev) return null;

                return (
                  <g
                    key={`bld-badge-${bld.id}`}
                    transform={`translate(${bld.center.x}, ${bld.center.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toolMode === 'add_device') {
                        setTargetBuildingForDevice(bld);
                        setIsAddDeviceOpen(true);
                        showToast(`Menambahkan perangkat untuk Gedung ${bld.code} (${bld.name})`);
                        return;
                      }
                      if (toolMode === 'edit_layout') {
                        setBuildingToEdit(bld);
                        showToast(`Membuka formulir edit data Gedung ${bld.code}`);
                        return;
                      }
                      setSelectedBuilding(bld);
                      setSelectedDevice(null);
                      setSelectedCable(null);
                      showToast(`Membuka drawer gedung ${bld.code} - ${bld.name}`);
                    }}
                    className="cursor-pointer group pointer-events-auto"
                  >
                    {/* Glass Pill Backdrop */}
                    <rect
                      x={-pillW / 2}
                      y={-pillH / 2}
                      width={pillW}
                      height={pillH}
                      rx={4}
                      fill={isSelected ? (bld.color ? '#0a1020' : '#03264c') : '#070f20'}
                      fillOpacity="0.95"
                      stroke={
                        isSelected 
                          ? (bld.color || '#00f2fe')
                          : isHovered 
                          ? (bld.color || '#38bdf8') 
                          : (bld.color || '#334155')
                      }
                      strokeWidth={isSelected ? 2.0 : bld.color ? 1.5 : 0.8}
                      filter={isSelected ? 'url(#cba-glow-cyan)' : 'none'}
                      className="transition-all duration-150"
                    />

                    {/* Status Indicator Dot */}
                    <circle
                      cx={-pillW / 2 + 5.5}
                      cy="0"
                      r={bld.color ? 2.6 : 2.2}
                      fill={bld.color || statusColor}
                      stroke={bld.color ? '#ffffff' : 'none'}
                      strokeWidth={bld.color ? 0.6 : 0}
                    />

                    {/* Building Name Text */}
                    {showLabelText && (
                      <text
                        x={-pillW / 2 + 10.5}
                        y="2.2"
                        fill="#ffffff"
                        fontSize="5.2"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontWeight="bold"
                        textAnchor="start"
                        className="pointer-events-none select-none"
                      >
                        {labelText}
                      </text>
                    )}

                    {/* Integrated Switch Chip (if devices layer enabled & switch exists) */}
                    {hasDev && (
                      <g
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bldDev) {
                            setSelectedDevice(bldDev);
                            setSelectedBuilding(null);
                            setSelectedCable(null);
                            showToast(`Membuka Switch ${bldDev.name}`);
                          }
                        }}
                        className="cursor-pointer group/sw"
                      >
                        {/* Divider */}
                        {showLabelText && (
                          <line
                            x1={pillW / 2 - 18}
                            y1={-pillH / 2 + 2.5}
                            x2={pillW / 2 - 18}
                            y2={pillH / 2 - 2.5}
                            stroke="#334155"
                            strokeWidth="0.8"
                          />
                        )}
                        {/* SW Button */}
                        <rect
                          x={showLabelText ? (pillW / 2 - 16) : -6}
                          y="-4.5"
                          width="12"
                          height="9"
                          rx="2"
                          fill="#1d4ed8"
                          stroke="#60a5fa"
                          strokeWidth="0.5"
                          className="transition-colors group-hover/sw:fill-blue-500"
                        />
                        <text
                          x={showLabelText ? (pillW / 2 - 10) : 0}
                          y="2"
                          fill="#ffffff"
                          fontSize="4.2"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          SW
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* LAYER 3.5: Standalone & Attached Device Nodes */}
            {layers.devices && mapData.devices.map((dev) => {
              if (!isDeviceVisible(dev)) return null;

              let posX = dev.x ?? dev.pos_x;
              let posY = dev.y ?? dev.pos_y;

              if ((posX === undefined || posX === null || posY === undefined || posY === null) && dev.buildingId) {
                const bld = mapData.buildings.find(b => b.id === dev.buildingId);
                if (bld) {
                  const devIndexInBld = mapData.devices.filter(d => d.buildingId === dev.buildingId).findIndex(d => d.id === dev.id);
                  posX = bld.center.x + (devIndexInBld % 3 - 1) * 16;
                  posY = bld.center.y + (Math.floor(devIndexInBld / 3) + 1) * 14;
                }
              }

              if (posX === undefined || posX === null || posY === undefined || posY === null) {
                return null;
              }

              const isSelected = selectedDevice?.id === dev.id;
              const devInfo = getDeviceTypeInfo(dev.type);

              const statusDotColor = dev.status === 'online'
                ? '#10b981'
                : dev.status === 'warning'
                ? '#f59e0b'
                : dev.status === 'offline'
                ? '#f43f5e'
                : '#94a3b8';

              return (
                <g
                  key={`dev-node-${dev.id}`}
                  transform={`translate(${posX}, ${posY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDevice(dev);
                    setSelectedBuilding(null);
                    setSelectedCable(null);
                    showToast(`Memilih ${devInfo.label}: ${dev.name} (${dev.ip || 'No IP'})`);
                  }}
                  onMouseDown={(e) => {
                    if (toolMode === 'edit_layout') {
                      e.stopPropagation();
                      setDraggingDevice(dev);
                    }
                  }}
                  className="cursor-pointer group pointer-events-auto"
                >
                  {/* Selection Pulsing Beacon */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="12"
                      fill="none"
                      stroke={devInfo.color}
                      strokeWidth="2"
                      filter="url(#cba-glow-cyan)"
                    >
                      <animate attributeName="r" values="8;14;8" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Device Base Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="9"
                    fill="#070f20"
                    fillOpacity="0.95"
                    stroke={isSelected ? devInfo.color : (theme === 'dark' ? '#334155' : '#64748b')}
                    strokeWidth={isSelected ? 2 : 1.2}
                    className="transition-all duration-150 group-hover:scale-110"
                  />

                  {/* Status Dot Indicator */}
                  <circle
                    cx="6"
                    cy="-6"
                    r="2.5"
                    fill={statusDotColor}
                    stroke="#ffffff"
                    strokeWidth="0.7"
                  />

                  {/* Icon symbol */}
                  <text
                    x="0"
                    y="3"
                    fill={devInfo.color}
                    fontSize="7"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {dev.type === 'cctv' ? '📷' : dev.type === 'computer' ? '💻' : dev.type === 'access-point' ? '📶' : dev.type === 'router' ? '📡' : dev.type === 'firewall' ? '🛡️' : dev.type === 'server' ? '🖥️' : dev.type === 'ups' ? '🔋' : '⚡'}
                  </text>
                </g>
              );
            })}

            {/* LAYER 4: Authoring Overlays & Live Previews */}
            {/* Cable Drawing Live Preview */}
            {drawingCablePoints.length > 0 && (
              <g className="pointer-events-none">
                <path
                  d={drawingCablePoints.reduce((acc, pt, idx) => idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '')}
                  fill="none"
                  stroke="#00f2fe"
                  strokeWidth="3.5"
                  strokeDasharray="4 2"
                  filter="url(#cba-glow-cyan)"
                />
                {drawingCableHover && (
                  <line
                    x1={drawingCablePoints[drawingCablePoints.length - 1].x}
                    y1={drawingCablePoints[drawingCablePoints.length - 1].y}
                    x2={drawingCableHover.x}
                    y2={drawingCableHover.y}
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                  />
                )}
                {drawingCablePoints.map((pt, idx) => (
                  <circle
                    key={`draw-cbl-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="#00f2fe"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}

            {/* Building Drawing Live Preview */}
            {drawingBuildingPoints.length > 0 && (
              <g className="pointer-events-none">
                {drawingBuildingPoints.length >= 3 && (
                  <polygon
                    points={drawingBuildingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#00f2fe"
                    strokeWidth="2"
                    filter="url(#cba-glow-cyan)"
                  />
                )}
                <path
                  d={drawingBuildingPoints.reduce((acc, pt, idx) => idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                {drawingBuildingHover && (
                  <line
                    x1={drawingBuildingPoints[drawingBuildingPoints.length - 1].x}
                    y1={drawingBuildingPoints[drawingBuildingPoints.length - 1].y}
                    x2={drawingBuildingHover.x}
                    y2={drawingBuildingHover.y}
                    stroke="#00f2fe"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}
                {drawingBuildingPoints.map((pt, idx) => (
                  <circle
                    key={`draw-bld-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}

            {/* Edit Mode Interactive Knots (Move buildings & cable waypoints) */}
            {toolMode === 'edit_layout' && (
              <g className="pointer-events-auto">
                {/* Cable Waypoint Knots */}
                {mapData.cableRoutes.map(cable => 
                  cable.path.map((pt, idx) => (
                    <circle
                      key={`wpt-${cable.id}-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-move hover:scale-125 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingWaypoint({ cableId: cable.id, pointIdx: idx });
                      }}
                    />
                  ))
                )}
                {/* Building Corner Vertex Knots (to resize/reshape polygon) */}
                {mapData.buildings.map(bld => 
                  bld.polygon.map((pt, idx) => (
                    <circle
                      key={`bld-vtx-${bld.id}-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      className="cursor-crosshair hover:scale-150 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingVertex({ buildingId: bld.id, vertexIdx: idx });
                      }}
                    />
                  ))
                )}
                {/* Building Center Knots */}
                {mapData.buildings.map(bld => (
                  <g
                    key={`bld-drag-${bld.id}`}
                    transform={`translate(${bld.center.x}, ${bld.center.y})`}
                    className="cursor-move group"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingBuilding(bld);
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="8"
                      fill="#f59e0b"
                      fillOpacity="0.85"
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#cba-glow-amber)"
                      className="group-hover:scale-125 transition-transform"
                    />
                    <text
                      x="0"
                      y="2.5"
                      fill="#ffffff"
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      ✥
                    </text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
          </>
        )}
      </div>

      {/* Hover Tooltip */}
      <BuildingTooltip
        building={hoveredBuilding}
        position={tooltipPos}
      />

      {/* Right Detail Drawers Overlay */}
      {(selectedBuilding || selectedDevice || selectedCable) && (
        <div className="absolute top-0 right-0 bottom-0 z-40 flex flex-col h-full w-full sm:w-auto max-w-full pointer-events-auto shadow-2xl">
          {selectedBuilding && (
            <BuildingDetailPanel
              isViewer={isViewer}
              building={selectedBuilding}
              devices={mapData.devices.filter(d => d.buildingId === selectedBuilding.id)}
              cables={mapData.cableRoutes.filter(c => c.fromBuildingId === selectedBuilding.id || c.toBuildingId === selectedBuilding.id)}
              alerts={mapData.alerts.filter(a => a.buildingId === selectedBuilding.id)}
              racks={mapData.racks.filter(r => r.buildingId === selectedBuilding.id)}
              onClose={() => setSelectedBuilding(null)}
              onViewCableRoute={(cable) => {
                if (cable) {
                  setSelectedCable(cable);
                  setSelectedBuilding(null);
                }
              }}
              onSelectDevice={(device) => {
                setSelectedDevice(device);
                setSelectedBuilding(null);
              }}
              onFocusMap={(bld) => {
                focusCoordinates(bld.center.x, bld.center.y);
              }}
              onAddDevice={() => setIsAddDeviceOpen(true)}
              onAddCableRoute={() => setIsAddCableOpen(true)}
              onCreateMaintenance={() => setIsCreateMaintOpen(true)}
              onViewTopology={(bld) => {
                navigate(`/network-topology?buildingId=${bld.id}`);
              }}
              onTraceConnection={(bld) => {
                showToast(`Tracing jalur koneksi fisik untuk Gedung ${bld.code}...`);
              }}
              onDeleteBuilding={(bld) => setBuildingToDelete(bld)}
              onEditBuilding={(bld) => setBuildingToEdit(bld)}
            />
          )}

          {selectedDevice && (
            <DeviceDrawer
              device={selectedDevice}
              building={mapData.buildings.find(b => b.id === selectedDevice.buildingId) || null}
              onClose={() => setSelectedDevice(null)}
              theme={theme}
            />
          )}

          {selectedCable && (
            <CableDrawer
              cable={selectedCable}
              buildings={mapData.buildings}
              onClose={() => setSelectedCable(null)}
              onEditRoute={(cbl) => setCableToEdit(cbl)}
              onDeleteRoute={(cbl) => setCableToDelete(cbl)}
              theme={theme}
            />
          )}
        </div>
      )}

      {/* Interactive Action Modals */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        initialBuildingCode={targetBuildingForDevice?.code}
        targetBuilding={targetBuildingForDevice}
        targetPoint={targetPointForDevice}
        buildingsList={mapData?.buildings || []}
        onClose={() => {
          setIsAddDeviceOpen(false);
          setTargetBuildingForDevice(null);
          setTargetPointForDevice(null);
        }}
        onSuccess={async (msg) => {
          showToast(msg);
          const reloaded = await factoryMapService.loadMapData();
          setMapData(reloaded);
          setTargetBuildingForDevice(null);
          setTargetPointForDevice(null);
        }}
      />

      <AddCableOnMapModal
        isOpen={isAddCableModalOpen}
        onClose={() => setIsAddCableModalOpen(false)}
        pathPoints={drawingCablePoints}
        startBuilding={startBuildingForCable}
        endBuilding={endBuildingForCable}
        existingCablesCount={mapData?.cableRoutes.length || 0}
        onSave={handleSaveNewCable}
      />

      <AddBuildingOnMapModal
        isOpen={isAddBuildingModalOpen}
        onClose={() => setIsAddBuildingModalOpen(false)}
        polygonPoints={drawingBuildingPoints}
        existingBuildings={mapData?.buildings || []}
        existingBuildingsCount={mapData?.buildings.length || 0}
        onSave={handleSaveNewBuilding}
      />

      <AddCableRouteModal
        isOpen={isAddCableOpen}
        onClose={() => setIsAddCableOpen(false)}
        onSuccess={async (msg) => {
          showToast(msg);
          const reloaded = await factoryMapService.loadMapData();
          setMapData(reloaded);
        }}
      />

      <EditBuildingOnMapModal
        isOpen={Boolean(buildingToEdit)}
        building={buildingToEdit}
        onClose={() => setBuildingToEdit(null)}
        onSave={handleSaveEditedBuilding}
      />

      <EditCableOnMapModal
        isOpen={Boolean(cableToEdit)}
        cable={cableToEdit}
        buildings={mapData?.buildings || []}
        onClose={() => setCableToEdit(null)}
        onSave={handleSaveEditedCable}
        onRedrawPath={(cbl) => {
          setDrawingCablePoints([]);
          setStartBuildingForCable(mapData?.buildings.find(b => b.id === cbl.fromBuildingId) || null);
          setEndBuildingForCable(mapData?.buildings.find(b => b.id === cbl.toBuildingId) || null);
          setToolMode('draw_cable');
          showToast(`Menggambar ulang rute ${cbl.code}. Klik titik baru di denah.`);
        }}
      />

      <CreateMaintenanceModal
        isOpen={isCreateMaintOpen}
        onClose={() => setIsCreateMaintOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
        }}
      />

      {/* Delete Building Confirmation Modal */}
      {buildingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0B132B] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/15 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  Hapus Gedung & Relasi Data?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  Gedung {buildingToDelete.code} — {buildingToDelete.name}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-white">Gedung {buildingToDelete.code} ({buildingToDelete.name})</strong> dari denah pabrik?
              </p>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 space-y-1">
                <span className="font-bold block flex items-center gap-1">⚠️ Perhatian Relasi Data Antar-Menu:</span>
                <p>Tindakan ini akan <strong>menghapus seluruh aset di dalam gedung ini</strong> secara permanen:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1 text-slate-700 dark:text-slate-300">
                  <li>Perangkat switch, AP, router (menu Devices)</li>
                  <li>Rak server & port IT (menu Racks)</li>
                  <li>Rute kabel terhubung (menu Cable Routes)</li>
                  <li>Riwayat alert & monitoring gedung</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBuildingToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteBuilding}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cable Route Confirmation Modal */}
      {cableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0B132B] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/15 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  Hapus Jalur Kabel?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {cableToDelete.code} — {cableToDelete.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus jalur kabel <strong className="text-slate-900 dark:text-white">{cableToDelete.code}</strong> dari denah pabrik? Garis rute dan animasi aliran data kabel ini akan dihapus dari peta.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCableToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteCable}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Rute Kabel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Map Data Confirmation Modal */}
      {isClearMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0B132B] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/15 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kosongkan Seluruh Denah Pabrik?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mulai mendesain denah pabrik baru dari kanvas kosong
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>Tindakan ini akan <strong>menghapus seluruh gedung, rute kabel, perangkat, dan rak</strong> dari database MySQL dan cache lokal denah.</p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                <span>Tip: Anda dapat menggambar denah pabrik sendiri dari nol, atau memulihkan layout bawaan sewaktu-waktu melalui tombol <strong>"Default CBA"</strong>.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearMapModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearMap}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan Denah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
