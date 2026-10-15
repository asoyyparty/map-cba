import React, { useState, useRef } from 'react';
import { Building, CableRoute, Device } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FuturisticFactoryCanvas } from './network-layout/FuturisticFactoryCanvas';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Eye, 
  EyeOff, 
  Building2, 
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin
} from 'lucide-react';

interface FactoryMapProps {
  buildings: Building[];
  cableRoutes: CableRoute[];
  devices: Device[];
  selectedBuildingId?: string;
  onSelectBuilding: (building: Building) => void;
  onSelectCable?: (cable: CableRoute) => void;
  impactedBuildingIds?: string[];
  impactedCableIds?: string[];
}

export const FactoryMap: React.FC<FactoryMapProps> = ({
  buildings,
  cableRoutes,
  devices,
  selectedBuildingId,
  onSelectBuilding,
  onSelectCable,
  impactedBuildingIds = [],
  impactedCableIds = []
}) => {
  const { theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer Controls
  const [showLayoutImage, setShowLayoutImage] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showFiber, setShowFiber] = useState(true);
  const [showUtp, setShowUtp] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
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
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getStatusBg = (status: string, isImpacted: boolean) => {
    if (isImpacted) return 'fill-rose-950/80 stroke-rose-500';
    switch (status) {
      case 'critical': return 'fill-rose-950/80 stroke-rose-500';
      case 'warning': return 'fill-amber-950/80 stroke-amber-500';
      default: return 'fill-cyan-950/60 stroke-cyan-400';
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Map Layer Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Layer Denah Pabrik:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLayoutImage(!showLayoutImage)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all border ${
              showLayoutImage
                ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Denah Gambar Asli
          </button>

          <button
            onClick={() => setShowBuildings(!showBuildings)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all border ${
              showBuildings
                ? 'bg-blue-950 border-blue-700 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Polygon Gedung (25 Titik)
          </button>

          <button
            onClick={() => setShowFiber(!showFiber)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all border ${
              showFiber
                ? 'bg-rose-950 border-rose-700 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Kabel Fiber Optic
          </button>

          <button
            onClick={() => setShowUtp(!showUtp)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all border ${
              showUtp
                ? 'bg-blue-950 border-blue-700 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Kabel UTP
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all border ${
              showLabels
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Label Gedung
          </button>
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div 
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center relative bg-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          viewBox="0 0 445 561"
        >
          <defs>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Base Vector Layout */}
          {showLayoutImage && (
            <FuturisticFactoryCanvas isDark={theme === 'dark'} />
          )}

          {/* 2. Cable Routes Layer */}
          {cableRoutes.map((cable) => {
            if (cable.type === 'fiber' && !showFiber) return null;
            if (cable.type === 'utp' && !showUtp) return null;

            const isImpacted = impactedCableIds.includes(cable.id);
            const isFiber = cable.type === 'fiber';
            const strokeColor = isImpacted 
              ? '#ef4444' 
              : isFiber 
                ? (cable.status === 'degraded' ? '#f59e0b' : '#f43f5e') 
                : '#3b82f6';

            const pathD = cable.path.reduce((acc, pt, idx) => {
              return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
            }, '');

            return (
              <g 
                key={cable.id} 
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCable && onSelectCable(cable);
                }}
              >
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="18" />

                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isFiber ? 5 : 3.5}
                  strokeDasharray={isImpacted ? '6 4' : isFiber ? 'none' : '5 5'}
                  filter={isFiber ? 'url(#glow-red)' : 'none'}
                  className={isImpacted ? 'animate-pulse' : ''}
                />

                {!isImpacted && (
                  <circle r={isFiber ? 5 : 3.5} fill={isFiber ? '#ffe4e6' : '#93c5fd'}>
                    <animateMotion
                      path={pathD}
                      dur={isFiber ? '3s' : '5s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <title>{`${cable.name} (${cable.code})`}</title>
              </g>
            );
          })}

          {/* 3. Buildings Polygon Layer */}
          {showBuildings && buildings.map((bld) => {
            const isSelected = selectedBuildingId === bld.id;
            const isImpacted = impactedBuildingIds.includes(bld.id);

            const pointsStr = bld.polygon.map(pt => `${pt.x},${pt.y}`).join(' ');

            return (
              <g 
                key={bld.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBuilding(bld);
                }}
                className="cursor-pointer group"
              >
                {/* Status Glow Aura */}
                {showHeatmap && (
                  <polygon
                    points={pointsStr}
                    fill={isImpacted ? '#ef4444' : bld.status === 'warning' ? '#f59e0b' : '#06b6d4'}
                    fillOpacity={isImpacted ? 0.35 : isSelected ? 0.4 : 0.15}
                    stroke={isImpacted ? '#ef4444' : isSelected ? '#38bdf8' : 'none'}
                    strokeWidth={isSelected ? 3 : 0}
                  />
                )}

                {/* Building Polygon */}
                <polygon
                  points={pointsStr}
                  className={`${getStatusBg(bld.status, isImpacted)} transition-all duration-200 group-hover:fill-slate-800/90`}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={isImpacted ? '4 4' : 'none'}
                />

                {/* Center Node Marker */}
                <circle
                  cx={bld.center.x}
                  cy={bld.center.y}
                  r={isSelected ? 10 : 7}
                  fill={isImpacted ? '#ef4444' : bld.status === 'warning' ? '#f59e0b' : '#10b981'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Building Name Label */}
                {showLabels && (
                  <g transform={`translate(${bld.center.x}, ${bld.center.y + 20})`}>
                    <rect
                      x="-70"
                      y="-12"
                      width="140"
                      height="22"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      fill={isImpacted ? '#fca5a5' : '#f8fafc'}
                      fontSize="10"
                      fontFamily="sans-serif"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {bld.code}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 p-1.5 rounded-xl shadow-2xl z-20">
          <button onClick={handleZoomIn} className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={handleZoomOut} className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={handleReset} className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg" title="Reset View">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Quick Helper Badge */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 z-20 font-mono">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Denah Asli PT. CBA Chemical Industry (25 Titik Patroli Keamanan & IT).</span>
        </div>
      </div>
    </div>
  );
};
