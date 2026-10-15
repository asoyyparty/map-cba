import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Scan, 
  Building2, 
  Network, 
  Server, 
  Tag,
  Check,
  GitFork,
  Plus,
  PenTool,
  Sliders,
  Box,
  Boxes,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock
} from 'lucide-react';

export type MapToolMode = 'select' | 'pan' | 'draw_cable' | 'add_device' | 'draw_building' | 'edit_layout';

export interface MapLayerToggles {
  buildings: boolean;
  cables: boolean;
  devices: boolean;
  labels: boolean;
}

export type MapViewStyle = '3d_interactive' | '3d_render';

interface MapToolbarProps {
  toolMode: MapToolMode;
  onToolModeChange: (mode: MapToolMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFitToScreen: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  layers: MapLayerToggles;
  onToggleLayer: (layerKey: keyof MapLayerToggles) => void;
  onSaveLayout?: () => void;
  hasUnsavedChanges?: boolean;
  mapViewStyle?: MapViewStyle;
  onToggleMapViewStyle?: (style: MapViewStyle) => void;
  onClearMap?: () => void;
  onResetFactoryDefaults?: () => void;
  isViewer?: boolean;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  toolMode,
  onToolModeChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitToScreen,
  isFullscreen,
  onToggleFullscreen,
  layers,
  onToggleLayer,
  onSaveLayout,
  hasUnsavedChanges = false,
  mapViewStyle = '3d_render',
  onToggleMapViewStyle,
  onClearMap,
  onResetFactoryDefaults,
  isViewer = false
}) => {
  const [isMobileLayersOpen, setIsMobileLayersOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const mobileLayersRef = useRef<HTMLDivElement | null>(null);
  const mobileToolsRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileLayersRef.current && !mobileLayersRef.current.contains(e.target as Node)) {
        setIsMobileLayersOpen(false);
      }
      if (mobileToolsRef.current && !mobileToolsRef.current.contains(e.target as Node)) {
        setIsMobileToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* DESKTOP TOOLBAR (Screens >= md) */}
      <div className="hidden md:flex bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1.5 shadow-xl dark:shadow-2xl flex-col gap-1.5 text-xs font-sans select-none z-30 pointer-events-auto">
      {/* Row 1: Pengaturan Mode Tampilan & Visibilitas Layer */}
      <div className="flex items-center gap-1.5">
        {/* 1. View Mode Switcher (3D Twin | 3D Masterplan) */}
        {onToggleMapViewStyle && (
          <div className="flex items-center bg-slate-100 dark:bg-[#111A33] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onToggleMapViewStyle('3d_interactive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                mapViewStyle === '3d_interactive'
                  ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="3D Twin: Digital Twin Interaktif Tiga Dimensi Pabrik CBA"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>3D Twin</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMapViewStyle('3d_render')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                mapViewStyle === '3d_render'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="3D Masterplan: Tampilan Aerial Fotorealistik Pabrik CBA"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>3D Masterplan</span>
            </button>
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* 2. Layer Toggles: Buildings, Cables, Devices, Labels */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#111A33] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onToggleLayer('buildings')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              layers.buildings
                ? 'bg-blue-50 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 opacity-70'
            }`}
            title="Toggle Tampilan Gedung"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Buildings</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('cables')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              layers.cables
                ? 'bg-cyan-50 dark:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 opacity-70'
            }`}
            title="Toggle Tampilan Rute Kabel"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Cables</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('devices')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              layers.devices
                ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 opacity-70'
            }`}
            title="Toggle Tampilan Hardware Device"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Devices</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('labels')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              layers.labels
                ? 'bg-amber-50 dark:bg-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 opacity-70'
            }`}
            title="Toggle Label Teks Denah"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Labels</span>
          </button>
        </div>

        {/* Unsaved changes badge or save button */}
        {!isViewer && hasUnsavedChanges && onSaveLayout && (
          <button
            type="button"
            onClick={onSaveLayout}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer font-semibold animate-bounce ml-auto"
            title="Simpan Perubahan Layout ke Penyimpanan"
          >
            <span>Simpan</span>
          </button>
        )}
      </div>

      {/* Row 2: Alat Desain, Navigasi & Kontrol Layar/Zoom */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {/* 1. Core Navigation: Select & Pan */}
        <div className="flex items-center bg-slate-100 dark:bg-[#111A33] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onToolModeChange('select')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
              toolMode === 'select'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Select Mode: Klik untuk memilih gedung, perangkat, atau rute kabel"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Pilih</span>
          </button>
          <button
            type="button"
            onClick={() => onToolModeChange('pan')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
              toolMode === 'pan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Pan Mode: Geser denah dengan mouse"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Geser</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* 2. Interactive Authoring Suite or Read-Only Notice Badge */}
        {!isViewer ? (
          <div className="flex items-center bg-slate-100 dark:bg-[#111A33] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onToolModeChange(toolMode === 'draw_cable' ? 'select' : 'draw_cable')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                toolMode === 'draw_cable'
                  ? 'bg-cyan-600 text-white shadow-xs animate-pulse'
                  : 'text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50'
              }`}
              title="Tarik Kabel: Hubungkan kabel FO/UTP antar gedung (2D atau 3D)"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Tarik Kabel</span>
            </button>

            <button
              type="button"
              onClick={() => onToolModeChange(toolMode === 'add_device' ? 'select' : 'add_device')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                toolMode === 'add_device'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
              }`}
              title="Tambah Device: Klik gedung di 2D atau 3D untuk memasang Switch, Router, AP atau Server"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Tambah Device</span>
            </button>

            <button
              type="button"
              onClick={() => onToolModeChange(toolMode === 'draw_building' ? 'select' : 'draw_building')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                toolMode === 'draw_building'
                  ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
              }`}
              title="Gambar Gedung: Klik titik sudut di denah atau tanah 3D untuk membuat gedung baru"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Gambar Gedung</span>
            </button>

            <button
              type="button"
              onClick={() => onToolModeChange(toolMode === 'edit_layout' ? 'select' : 'edit_layout')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                toolMode === 'edit_layout'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
              }`}
              title="Edit Layout: Klik gedung di 3D atau geser titik di denah 2D"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Edit Layout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Mode Baca-Saja (Viewer)</span>
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* 3. Zoom & Canvas Actions */}
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-[#111A33] rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Position */}
          <button
            type="button"
            onClick={onReset}
            className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#111A33] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 rounded-xl transition-all cursor-pointer"
            title="Reset Zoom & Posisi (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fit to Screen */}
          <button
            type="button"
            onClick={onFitToScreen}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#111A33] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer font-semibold"
            title="Sesuaikan denah pabrik ke layar (Fit to Screen)"
          >
            <Scan className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Fit</span>
          </button>

          {/* Factory Data Management: Kosongkan Denah */}
          {!isViewer && onClearMap && (
            <div className="flex items-center bg-slate-100 dark:bg-[#111A33] rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
              <button
                type="button"
                onClick={onClearMap}
                className="flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer font-medium"
                title="Kosongkan semua gedung & kabel denah (Mulai mendesain dari nol)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Kosongkan</span>
              </button>
            </div>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`p-1 rounded-xl border transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-blue-50 dark:bg-blue-900/60 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-cyan-300'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#111A33] dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>

      {/* MOBILE COMPACT TOP CONTROLS (Screens < md) */}
      <div className="flex md:hidden items-center gap-1.5 pointer-events-auto select-none text-xs font-sans">
        {/* 1. View Mode Switcher Compact (3D / 2D) */}
        {onToggleMapViewStyle && (
          <button
            type="button"
            onClick={() => onToggleMapViewStyle(mapViewStyle === '3d_interactive' ? '3d_render' : '3d_interactive')}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-2xl border transition-all cursor-pointer shadow-md backdrop-blur-md font-bold text-xs ${
              mapViewStyle === '3d_interactive'
                ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white border-cyan-400'
                : 'bg-white/95 dark:bg-[#0B132B]/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
            }`}
            title="Ganti Mode Tampilan (3D Twin / Masterplan 2D)"
          >
            {mapViewStyle === '3d_interactive' ? (
              <>
                <Boxes className="w-3.5 h-3.5" />
                <span>3D</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>2D</span>
              </>
            )}
          </button>
        )}

        {/* 2. Mobile Layers & Options Popover */}
        <div ref={mobileLayersRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMobileLayersOpen(!isMobileLayersOpen)}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-2xl border transition-all cursor-pointer shadow-md backdrop-blur-md font-semibold text-xs ${
              isMobileLayersOpen
                ? 'bg-blue-600 text-white border-blue-400 font-bold'
                : 'bg-white/95 dark:bg-[#0B132B]/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
            }`}
            title="Pengaturan Lapisan & Opsi Peta"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Lapisan</span>
          </button>

          {isMobileLayersOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Visibilitas Lapisan
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileLayersOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleLayer('buildings')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    layers.buildings
                      ? 'bg-blue-50 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40'
                      : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Gedung</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLayer('cables')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    layers.cables
                      ? 'bg-cyan-50 dark:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40'
                      : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Kabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLayer('devices')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    layers.devices
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40'
                      : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLayer('labels')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    layers.labels
                      ? 'bg-amber-50 dark:bg-amber-600/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                      : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Label</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#111A33] text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
                </button>
                {onClearMap && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileLayersOpen(false);
                      onClearMap();
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium cursor-pointer"
                    title="Kosongkan Denah"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Mobile Save Button (if dirty) */}
        {hasUnsavedChanges && onSaveLayout && (
          <button
            type="button"
            onClick={onSaveLayout}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-2xl shadow-md cursor-pointer font-bold text-xs animate-bounce"
            title="Simpan Perubahan Layout"
          >
            <span>Simpan</span>
          </button>
        )}
      </div>

      {/* MOBILE BOTTOM FLOATING ACTION DOCK (Screens < md) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex md:hidden items-center gap-1 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1.5 shadow-2xl pointer-events-auto max-w-[calc(100vw-1.5rem)]">
        {/* Core Navigation: Select & Pan */}
        <div className="flex items-center bg-slate-100 dark:bg-[#111A33] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onToolModeChange('select');
              setIsMobileToolsOpen(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              toolMode === 'select'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Pilih Objek"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Pilih</span>
          </button>

          {mapViewStyle !== '3d_interactive' && (
            <button
              type="button"
              onClick={() => {
                onToolModeChange('pan');
                setIsMobileToolsOpen(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                toolMode === 'pan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Geser Denah"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Geser</span>
            </button>
          )}
        </div>

        {/* Alat Desain Dropdown Trigger */}
        {!isViewer && (
          <div ref={mobileToolsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                toolMode !== 'select' && toolMode !== 'pan'
                  ? 'bg-cyan-600 text-white shadow-xs animate-pulse'
                  : isMobileToolsOpen
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50'
              }`}
              title="Buka Alat Desain & Authoring"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Alat</span>
              {isMobileToolsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>

          {/* Mobile Tools Popover */}
          {isMobileToolsOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5">
                Alat Desain Denah
              </div>

              <button
                type="button"
                onClick={() => {
                  onToolModeChange(toolMode === 'draw_cable' ? 'select' : 'draw_cable');
                  setIsMobileToolsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  toolMode === 'draw_cable'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40'
                }`}
              >
                <GitFork className="w-4 h-4 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-bold">Tarik Kabel</div>
                  <div className="text-[10px] opacity-80 truncate">Rute FO/UTP antar gedung</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToolModeChange(toolMode === 'add_device' ? 'select' : 'add_device');
                  setIsMobileToolsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  toolMode === 'add_device'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                }`}
              >
                <Server className="w-4 h-4 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-bold">Tambah Device</div>
                  <div className="text-[10px] opacity-80 truncate">Switch, Router, AP, Server</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToolModeChange(toolMode === 'draw_building' ? 'select' : 'draw_building');
                  setIsMobileToolsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  toolMode === 'draw_building'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-bold">Gambar Gedung</div>
                  <div className="text-[10px] opacity-80 truncate">Tandai batas tapak gedung baru</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToolModeChange(toolMode === 'edit_layout' ? 'select' : 'edit_layout');
                  setIsMobileToolsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  toolMode === 'edit_layout'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <PenTool className="w-4 h-4 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-bold">Edit Layout</div>
                  <div className="text-[10px] opacity-80 truncate">Geser titik denah & gedung</div>
                </div>
              </button>

              {hasUnsavedChanges && onSaveLayout && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveLayout();
                    setIsMobileToolsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Layout</span>
                </button>
              )}
            </div>
          )}
        </div>
        )}

        {/* Fit Button */}
        {mapViewStyle !== '3d_interactive' && (
          <button
            type="button"
            onClick={onFitToScreen}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sesuaikan ke layar"
          >
            <Scan className="w-4 h-4 text-blue-500" />
          </button>
        )}

        {/* Zoom Controls */}
        {mapViewStyle !== '3d_interactive' && (
          <div className="flex items-center bg-slate-100 dark:bg-[#111A33] rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
