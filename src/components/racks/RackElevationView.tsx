import React from 'react';
import { 
  Server, 
  Shield, 
  HardDrive, 
  Radio, 
  Wifi, 
  Zap, 
  Activity, 
  SlidersHorizontal,
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { Rack, RackSlot } from '../../types';

interface RackElevationViewProps {
  rack: Rack;
  selectedDeviceId?: string | null;
  onSelectDevice: (device: any) => void;
  onMountAtU?: (u: number) => void;
  onUnmountDevice?: (deviceId: string) => void;
  isViewer?: boolean;
}

export const RackElevationView: React.FC<RackElevationViewProps> = ({
  rack,
  selectedDeviceId,
  onSelectDevice,
  onMountAtU,
  onUnmountDevice,
  isViewer = false
}) => {
  const slots = rack.slots || [];
  const uCapacity = rack.uCapacity || 42;

  // Device type styling helper
  const getDeviceBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('firewall')) return { icon: <Shield className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />, border: 'border-rose-200 dark:border-rose-500/50 bg-rose-50/60 dark:bg-rose-950/20' };
    if (t.includes('core')) return { icon: <Server className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />, border: 'border-blue-200 dark:border-blue-500/50 bg-blue-50/60 dark:bg-blue-950/20' };
    if (t.includes('switch')) return { icon: <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />, border: 'border-cyan-200 dark:border-cyan-500/50 bg-cyan-50/60 dark:bg-cyan-950/20' };
    if (t.includes('server')) return { icon: <HardDrive className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />, border: 'border-purple-200 dark:border-purple-500/50 bg-purple-50/60 dark:bg-purple-950/20' };
    if (t.includes('ups')) return { icon: <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />, border: 'border-amber-200 dark:border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20' };
    return { icon: <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />, border: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40' };
  };

  // We group consecutive occupied slots belonging to the same device
  // Since slots are ordered from top U (e.g. 42) down to 1,
  // we render when isDeviceRoot is true, spanning `height` units.
  const renderedElements = [];
  let skipCount = 0;

  for (let i = 0; i < slots.length; i++) {
    if (skipCount > 0) {
      skipCount--;
      continue;
    }

    const slot = slots[i];

    if (slot.isOccupied && slot.device) {
      const dev = slot.device;
      const height = slot.height || 1;
      skipCount = height - 1;

      const isSelected = selectedDeviceId === dev.id;
      const config = getDeviceBadge(dev.type);

      renderedElements.push(
        <div 
          key={`slot-dev-${slot.u}-${dev.id}`}
          onClick={() => onSelectDevice(dev)}
          style={{ height: `${height * 36}px` }}
          className={`relative w-full rounded-md border flex items-center justify-between px-3 transition-all cursor-pointer group select-none shadow-xs dark:shadow-sm ${config.border} ${
            isSelected 
              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/40 z-10' 
              : 'hover:border-slate-400 dark:hover:border-slate-500'
          }`}
        >
          {/* Left U markers */}
          <div className="absolute -left-9 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold w-7 text-right">
            U{slot.u}
          </div>

          {/* Device Faceplate info */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
              {config.icon}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">{dev.code || dev.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline-block truncate">
                  ({dev.model || dev.vendor || dev.type})
                </span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-200 dark:border-cyan-800/60">
                  {height}U
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>IP: {dev.ip}</span>
                <span className="hidden md:inline text-slate-400 dark:text-slate-600">•</span>
                <span className="hidden md:inline">Ports: {dev.ports_active || dev.portsActive || 0}/{dev.ports_total || dev.portsTotal || 24} Active</span>
              </div>
            </div>
          </div>

          {/* Right Status LED & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* LED */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${
                dev.status === 'online' ? 'bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' :
                dev.status === 'warning' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-rose-500'
              }`} />
              <span className="text-[9px] font-mono uppercase text-slate-700 dark:text-slate-300 font-bold hidden sm:inline">
                {dev.status}
              </span>
            </div>

            {/* Inspect button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDevice(dev);
              }}
              title="Lihat Port Matrix"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Unmount button */}
            {!isViewer && onUnmountDevice && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Lepas perangkat "${dev.code || dev.name}" dari rack?`)) {
                    onUnmountDevice(dev.id);
                  }
                }}
                title="Lepas dari Rack (Unmount)"
                className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    } else {
      // Empty Slot
      renderedElements.push(
        <div
          key={`slot-empty-${slot.u}`}
          className="relative w-full h-[36px] rounded border border-dashed border-slate-300 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/30 flex items-center justify-between px-3 group hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
        >
          {/* U label */}
          <div className="absolute -left-9 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400 dark:text-slate-600 font-semibold w-7 text-right">
            U{slot.u}
          </div>

          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 tracking-wider">
            [ Slot Kosong U{slot.u} ]
          </span>

          {/* Mount action on empty slot */}
          {!isViewer && onMountAtU && (
            <button
              onClick={() => onMountAtU(slot.u)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/30"
            >
              <Plus className="w-3 h-3" />
              <span>Mount</span>
            </button>
          )}
        </div>
      );
    }
  }

  return (
    <div className="bg-slate-100/90 dark:bg-[#070B19] border-4 border-slate-300 dark:border-slate-800 rounded-2xl p-4 shadow-xl font-sans text-slate-800 dark:text-slate-100 flex flex-col gap-3">
      {/* Top Rack Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-bold text-slate-900 dark:text-slate-200">{rack.name}</span>
          <span className="text-slate-500 dark:text-slate-400">• {rack.code} ({uCapacity}U Chassis)</span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Okupansi: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rack.usedU}U</span> / {uCapacity}U ({rack.occupancyPercent || 0}%)
        </div>
      </div>

      {/* Rack Rails & Slots Container */}
      <div className="relative pl-10 pr-2 py-2 flex flex-col gap-1.5 bg-slate-50 dark:bg-[#050811] rounded-xl border border-slate-200 dark:border-slate-800/80 max-h-[640px] overflow-y-auto">
        {/* Left Vertical Mounting Rail */}
        <div className="absolute left-9 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 shadow-xs" />

        {/* Device & Empty Slots */}
        {renderedElements}
      </div>

      {/* Rack Base Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div>Ruang: <span className="text-slate-800 dark:text-slate-200 font-semibold">{rack.room}</span> [{rack.buildingName}]</div>
        <div>Kapasitas Daya: <span className="text-amber-600 dark:text-amber-400 font-bold">{rack.currentPowerWatts || 650}W</span> / {rack.maxPowerWatts || 3500}W</div>
      </div>
    </div>
  );
};
