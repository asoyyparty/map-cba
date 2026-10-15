import React, { useState } from 'react';
import { Building, CableRoute } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { FuturisticFactoryCanvas } from '../network-layout/FuturisticFactoryCanvas';
import { 
  Layers, 
  Search, 
  Maximize2, 
  Share2, 
  Server, 
  Shield, 
  Wifi, 
  HardDrive,
  Compass
} from 'lucide-react';

interface MapPanelProps {
  buildings: Building[];
  cableRoutes: CableRoute[];
  onSelectBuilding: (building: Building) => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  buildings,
  cableRoutes,
  onSelectBuilding
}) => {
  const { theme } = useTheme();
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="bg-white dark:bg-[#111A33] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs dark:shadow-xl relative overflow-hidden h-[480px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-500 animate-pulse" />
            Denah Jaringan Kawasan Pabrik
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Peta layout interaktif sebaran FO & switch gedung CBA
          </p>
        </div>

        {/* Top Right Tool Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-1.5 border rounded-lg cursor-pointer transition-all ${
              showLegend
                ? 'bg-blue-50 dark:bg-cyan-950/60 text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-cyan-800/80'
                : 'bg-slate-100 dark:bg-[#172347] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle Legenda"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 bg-slate-100 dark:bg-[#172347] border border-slate-200 dark:border-slate-700/60 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 bg-slate-100 dark:bg-[#172347] border border-slate-200 dark:border-slate-700/60 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 bg-slate-50 dark:bg-[#090F20] rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden flex items-center justify-center">
        {/* Map SVG Canvas */}
        <svg
          className="w-full h-full"
          viewBox="0 0 445 561"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Futuristic Factory Layout Vector Canvas */}
          <FuturisticFactoryCanvas isDark={theme === 'dark'} />

          {/* Cable Lines Layer */}
          {cableRoutes.map((cable) => {
            const isFiber = cable.type === 'fiber';
            const strokeColor = isFiber ? '#06b6d4' : '#3b82f6';

            const pathD = cable.path.reduce((acc, pt, idx) => {
              return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
            }, '');

            return (
              <g key={cable.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isFiber ? 5 : 3.5}
                  filter={isFiber ? 'url(#glow-cyan)' : 'none'}
                />
                <circle r={4} fill="#ffffff">
                  <animateMotion path={pathD} dur="3s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}

          {/* Building Markers Layer */}
          {buildings.map((bld) => (
            <g
              key={bld.id}
              onClick={() => onSelectBuilding(bld)}
              className="cursor-pointer group"
            >
              <polygon
                points={bld.polygon.map(pt => `${pt.x},${pt.y}`).join(' ')}
                fill={bld.status === 'warning' ? '#f59e0b' : '#3b82f6'}
                fillOpacity="0.25"
                stroke={bld.status === 'warning' ? '#f59e0b' : '#38bdf8'}
                strokeWidth="2"
              />
              <circle
                cx={bld.center.x}
                cy={bld.center.y}
                r="7"
                fill={bld.status === 'warning' ? '#f59e0b' : '#10b981'}
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>

        {/* Floating Left Overlay Box (Legenda) */}
        {showLegend && (
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-[#0B132B]/90 backdrop-blur border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl shadow-lg dark:shadow-2xl z-20 w-44 font-sans text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1 text-[11px] uppercase tracking-wider">
              Legenda
            </h4>
            <div className="flex flex-col gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-slate-300 dark:bg-slate-600 rounded"></span> Gedung
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-cyan-500 dark:bg-cyan-400 rounded"></span> Jalur Fiber Optic
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-blue-500 rounded"></span> Jalur UTP
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-amber-500 rounded"></span> Jalur Backbone
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-500 dark:border-amber-400"></span> Jalur Wireless
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800/80 my-1 pt-1.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Switch
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Router
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Wifi className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Access Point
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Server
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800/80 my-1 pt-1.5 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Offline</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Right Compass Ornament */}
        <div className="absolute top-4 right-4 z-10 opacity-70">
          <div className="w-12 h-12 rounded-full border border-slate-700/80 bg-slate-950/80 flex items-center justify-center text-slate-300 font-mono text-[10px] font-bold">
            N
          </div>
        </div>
      </div>
    </div>
  );
};
