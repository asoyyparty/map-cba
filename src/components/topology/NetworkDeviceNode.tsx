import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Device } from '../../types';
import { 
  Shield, 
  GitFork, 
  Layers, 
  Server, 
  HardDrive, 
  Wifi, 
  Flame,
  Activity,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface NetworkDeviceNodeData {
  device: Device;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isTraceOrigin?: boolean;
  onSelect?: (device: Device) => void;
  onViewOnMap?: (device: Device) => void;
  onTrace?: (device: Device) => void;
}

export const NetworkDeviceNode = memo(({ data, selected }: NodeProps<NetworkDeviceNodeData>) => {
  const { device, isHighlighted, isDimmed, isTraceOrigin, onSelect, onViewOnMap, onTrace } = data;

  // Icon & Theme mapping for the 6 required node types
  const getNodeTypeConfig = () => {
    switch (device.type) {
      case 'firewall':
        return {
          label: 'Firewall',
          icon: <Flame className="w-4 h-4 text-orange-400" />,
          borderColor: 'border-orange-500/60',
          badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-800',
          glowColor: 'rgba(249, 115, 22, 0.4)',
          accentBg: 'bg-orange-500/10'
        };
      case 'core-switch':
        return {
          label: 'Core Switch',
          icon: <GitFork className="w-4 h-4 text-cyan-400" />,
          borderColor: 'border-cyan-500/60',
          badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
          glowColor: 'rgba(6, 182, 212, 0.5)',
          accentBg: 'bg-cyan-500/10'
        };
      case 'dist-switch':
        return {
          label: 'Distribution Switch',
          icon: <Layers className="w-4 h-4 text-blue-400" />,
          borderColor: 'border-blue-500/60',
          badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800',
          glowColor: 'rgba(59, 130, 246, 0.4)',
          accentBg: 'bg-blue-500/10'
        };
      case 'access-switch':
        return {
          label: 'Access Switch',
          icon: <Server className="w-4 h-4 text-indigo-400" />,
          borderColor: 'border-indigo-500/60',
          badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
          glowColor: 'rgba(99, 102, 241, 0.4)',
          accentBg: 'bg-indigo-500/10'
        };
      case 'server':
        return {
          label: 'Server',
          icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
          borderColor: 'border-emerald-500/60',
          badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          glowColor: 'rgba(16, 185, 129, 0.4)',
          accentBg: 'bg-emerald-500/10'
        };
      case 'access-point':
        return {
          label: 'Access Point',
          icon: <Wifi className="w-4 h-4 text-amber-400" />,
          borderColor: 'border-amber-500/60',
          badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
          glowColor: 'rgba(245, 158, 11, 0.4)',
          accentBg: 'bg-amber-500/10'
        };
      default:
        return {
          label: 'Network Device',
          icon: <Server className="w-4 h-4 text-slate-400" />,
          borderColor: 'border-slate-700',
          badgeBg: 'bg-slate-900 text-slate-300 border-slate-700',
          glowColor: 'rgba(148, 163, 184, 0.2)',
          accentBg: 'bg-slate-800/40'
        };
    }
  };

  const config = getNodeTypeConfig();

  return (
    <div
      onClick={() => onSelect && onSelect(device)}
      className={`relative min-w-[210px] max-w-[230px] rounded-2xl bg-white dark:bg-[#0B132B] border font-sans text-slate-900 dark:text-slate-100 transition-all duration-200 cursor-pointer shadow-xl select-none group ${
        isDimmed ? 'opacity-25 grayscale-[60%]' : 'opacity-100'
      } ${
        isTraceOrigin 
          ? 'ring-2 ring-amber-400 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-105 z-30'
          : isHighlighted
            ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_25px_rgba(0,242,254,0.6)] scale-105 z-20'
            : selected
              ? 'ring-2 ring-blue-500 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-102 z-10'
              : `${config.borderColor} hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-2xl`
      }`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-300 dark:!bg-slate-700 !border-2 !border-cyan-500 dark:!border-cyan-400 hover:!bg-cyan-500 dark:hover:!bg-cyan-400 !transition-colors"
      />

      {/* Top Header Card */}
      <div className={`p-2.5 border-b border-slate-100 dark:border-slate-800/80 rounded-t-2xl flex items-center justify-between ${config.accentBg}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 shrink-0">
            {config.icon}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
              {device.name}
            </h4>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block truncate">
              {config.label}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border ${
          device.status === 'online' 
            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80' 
            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            device.status === 'online' ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'
          }`} />
          {device.status === 'online' ? 'UP' : 'WARN'}
        </span>
      </div>

      {/* Body Information */}
      <div className="p-3 flex flex-col gap-1.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 dark:text-slate-500">IP:</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-300">{device.ip}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 dark:text-slate-500">Gedung:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px] text-right">
            {device.buildingName}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 dark:text-slate-500">Port Aktif:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <strong className="text-emerald-600 dark:text-emerald-400">{device.activePorts || 12}</strong>/{device.totalPorts || 24}
          </span>
        </div>

        {device.model && (
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-sans truncate pt-1 border-t border-slate-100 dark:border-slate-800/60">
            {device.brand} {device.model}
          </div>
        )}
      </div>

      {/* Quick Action Footer (View on Map & Trace) */}
      <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#080D1A] rounded-b-2xl border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-mono">
        {onViewOnMap && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap(device);
            }}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors py-0.5"
            title="Lihat posisi gedung & perangkat di Network Layout"
          >
            <MapPin className="w-2.5 h-2.5 text-cyan-500 dark:text-cyan-400" />
            <span>View Map</span>
          </button>
        )}

        {onTrace && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTrace(device);
            }}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors py-0.5"
            title="Highlight network path ke gateway"
          >
            <Activity className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
            <span>Trace</span>
          </button>
        )}
      </div>

      {/* React Flow Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-cyan-400 hover:!bg-cyan-400 !transition-colors"
      />
    </div>
  );
});

NetworkDeviceNode.displayName = 'NetworkDeviceNode';
