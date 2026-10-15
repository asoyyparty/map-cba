import React from 'react';
import { Plus, Minus, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MinimapControlsProps {
  zoom: number;
  pan: { x: number; y: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const MinimapControls: React.FC<MinimapControlsProps> = ({
  zoom,
  pan,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  const { theme } = useTheme();
  // Calculate relative indicator position in minimap
  // Base SVG dimensions: 445 x 561
  const scale = 1 / zoom;
  const clampedScale = Math.min(Math.max(scale, 0.25), 1);
  const offsetX = -pan.x / (445 * zoom) * 100;
  const offsetY = -pan.y / (561 * zoom) * 100;

  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-end gap-2 select-none">
      {/* Minimap Box */}
      <div className="relative w-36 h-28 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg dark:shadow-2xl p-1.5 flex flex-col justify-between">
        <div className="relative w-full h-20 flex items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <svg viewBox="0 0 445 561" className="w-full h-full object-contain opacity-85 pointer-events-none">
            <image href="/cba_layout_3d.jpg" width="445" height="561" preserveAspectRatio="none" />
          </svg>
          {/* Dynamic GIS Viewport Frame */}
          <div
            className="absolute border-2 border-cyan-500 dark:border-cyan-400 bg-cyan-500/20 rounded pointer-events-none transition-all duration-75 shadow-xs"
            style={{
              width: `${Math.round(clampedScale * 88)}%`,
              height: `${Math.round(clampedScale * 88)}%`,
              transform: `translate(${Math.max(-25, Math.min(25, offsetX))}%, ${Math.max(-25, Math.min(25, offsetY))}%)`
            }}
          />
        </div>

        {/* Zoom percentage tag */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">GIS View</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Zoom / Pan Action Buttons */}
      <div className="flex flex-col gap-1 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 p-1.5 rounded-2xl shadow-lg dark:shadow-xl">
        <button
          onClick={onZoomIn}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
          title="Perbesar (Zoom In)"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
          title="Perkecil (Zoom Out)"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
          title="Reset Posisi & Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={`p-2 rounded-xl transition-all ${
              isFullscreen 
                ? 'text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/60 hover:bg-blue-100 dark:hover:bg-cyan-900/60' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
