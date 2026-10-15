import React, { useState } from 'react';
import { LayerVisibility } from '../../types';
import { 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Server, 
  Wifi, 
  Globe, 
  Activity, 
  Tag, 
  Building2 
} from 'lucide-react';

interface LayerControlOverlayProps {
  layers: LayerVisibility;
  onChangeLayer: (key: keyof LayerVisibility) => void;
}

export const LayerControlOverlay: React.FC<LayerControlOverlayProps> = ({
  layers,
  onChangeLayer
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-4 left-4 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 px-3 py-2 rounded-xl shadow-xl z-20 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:border-blue-400 dark:hover:border-cyan-500/50 transition-all select-none cursor-pointer"
        title="Buka Panel Layer"
      >
        <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
        <span>Layer</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-4 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-2xl shadow-2xl z-20 w-52 text-xs font-sans select-none animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-200">
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Layer Overlay</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          title="Ciutkan Panel"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 text-[11px] text-slate-700 dark:text-slate-300 max-h-[70vh] overflow-y-auto pr-0.5 custom-scrollbar">
        {/* Grup 1: Area & Label */}
        <div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Area Gedung</span>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.gedung}
                onChange={() => onChangeLayer('gedung')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Gedung (Hotspots)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.labels ?? true}
                onChange={() => onChangeLayer('labels' as any)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Label Nama Gedung</span>
            </label>
          </div>
        </div>

        {/* Grup 2: Jalur Kabel Antar Gedung */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Jalur Kabel</span>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.fiberOptic}
                onChange={() => onChangeLayer('fiberOptic')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <span className="w-3 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full inline-block shadow-sm shadow-cyan-400/50"></span>
              <span>Fiber Optic (FO)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.backbone}
                onChange={() => onChangeLayer('backbone')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <span className="w-3 h-1.5 bg-orange-500 rounded-full inline-block shadow-sm shadow-orange-500/50"></span>
              <span>Backbone Core 40G</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.utp}
                onChange={() => onChangeLayer('utp')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block shadow-sm shadow-emerald-500/50"></span>
              <span>UTP Cat6 Industrial</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.wireless}
                onChange={() => onChangeLayer('wireless')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <span className="w-3 h-0.5 border-b border-dashed border-amber-500 dark:border-amber-400 inline-block"></span>
              <span>Wireless P2P</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white pt-0.5">
              <input
                type="checkbox"
                checked={layers.flowAnimation ?? true}
                onChange={() => onChangeLayer('flowAnimation' as any)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300 animate-pulse" />
              <span>Animasi Traffic Flow</span>
            </label>
          </div>
        </div>

        {/* Grup 3: Perangkat Jaringan */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Perangkat (Devices)</span>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.switch}
                onChange={() => onChangeLayer('switch')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Switch Gedung</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.accessPoint}
                onChange={() => onChangeLayer('accessPoint')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Access Point (AP)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={layers.internet}
                onChange={() => onChangeLayer('internet')}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Internet ISP Drop</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
