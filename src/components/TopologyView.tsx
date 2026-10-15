import React, { useState, useEffect, useMemo } from 'react';
import { ViewMode, Device, CableRoute, Building } from '../types';
import { 
  GitFork, 
  Map, 
  ChevronDown, 
  Search, 
  Maximize2,
  Filter,
  RotateCcw,
  X,
  Activity,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { TopologyCanvas } from './topology/TopologyCanvas';
import { DeviceDetailSidebar } from './topology/DeviceDetailSidebar';
import { TopologyBottomBar } from './topology/TopologyBottomBar';

interface TopologyViewProps {
  devices?: Device[];
  cableRoutes?: CableRoute[];
  buildings?: Building[];
  initialBuildingFilter?: string | null;
  onNavigateView?: (view: ViewMode) => void;
  onViewOnMap?: (device: Device) => void;
}

export const TopologyView: React.FC<TopologyViewProps> = ({ 
  devices = [], 
  cableRoutes = [],
  buildings = [],
  initialBuildingFilter,
  onNavigateView,
  onViewOnMap
}) => {
  // Convert initialBuildingFilter (which might be ID like 'bld-a') to building name if possible
  const resolveBuildingName = (bldParam?: string | null) => {
    if (!bParam(bldParam)) return 'Semua Gedung';
    const found = buildings.find(b => b.id === bldParam || b.name.toLowerCase() === bldParam.toLowerCase() || b.code.toLowerCase() === bldParam.toLowerCase());
    return found ? found.name : bldParam;
  };

  function bParam(p?: string | null): p is string {
    return !!p && p !== 'Semua Gedung';
  }

  const [selectedBuilding, setSelectedBuilding] = useState<string>(() => 
    resolveBuildingName(initialBuildingFilter)
  );

  useEffect(() => {
    if (initialBuildingFilter) {
      setSelectedBuilding(resolveBuildingName(initialBuildingFilter));
    }
  }, [initialBuildingFilter]);

  const [selectedDeviceType, setSelectedDeviceType] = useState('Semua Perangkat');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected device for inspector drawer
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(() => {
    return devices.find(d => d.type === 'core-switch') || devices[0] || null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tracedDeviceId, setTracedDeviceId] = useState<string | null>(null);

  // If initial device is not set, set to core switch
  useEffect(() => {
    if (!selectedDevice && devices.length > 0) {
      setSelectedDevice(devices.find(d => d.type === 'core-switch') || devices[0]);
    }
  }, [devices, selectedDevice]);

  // Filtered devices count for top bar feedback
  const buildingFilteredCount = useMemo(() => {
    if (selectedBuilding === 'Semua Gedung') return devices.length;
    return devices.filter(d => d.buildingName.toLowerCase() === selectedBuilding.toLowerCase()).length;
  }, [devices, selectedBuilding]);

  return (
    <div className="w-full h-full bg-slate-100 dark:bg-[#080D1A] flex flex-col overflow-hidden font-sans text-slate-800 dark:text-slate-100 select-none">
      {/* Top Header & Subheader Controls */}
      <div className="bg-white dark:bg-[#0B132B] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex flex-col gap-2 shrink-0 z-20 shadow-xs dark:shadow-none">
        {/* Title Bar + View Toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Network Topology
                </h2>
                {selectedBuilding !== 'Semua Gedung' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                    <Filter className="w-2.5 h-2.5" />
                    Filter: {selectedBuilding}
                  </span>
                )}
                {tracedDeviceId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center gap-1 animate-pulse">
                    <Activity className="w-2.5 h-2.5" />
                    Tracing Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Visualisasi hierarkis dinamis hubungan perangkat jaringan (React Flow Engine).
              </p>
            </div>
          </div>

          {/* Mode Switch Buttons */}
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/80 transition-all"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Topology View</span>
            </button>

            <button 
              onClick={() => onNavigateView?.('layout')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#111A33] dark:hover:bg-[#172347] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 transition-all cursor-pointer"
            >
              <Map className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Layout View</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Strip */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Filter 1: Gedung (Automatically linked from Network Layout) */}
            <div className="relative">
              <select 
                value={selectedBuilding} 
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-[#111A33] border border-slate-300 dark:border-slate-700/70 hover:border-cyan-500 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-cyan-400 font-sans"
              >
                <option value="Semua Gedung">Semua Gedung ({devices.length} Devices)</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filter Button if a specific building is selected */}
            {selectedBuilding !== 'Semua Gedung' && (
              <button
                type="button"
                onClick={() => setSelectedBuilding('Semua Gedung')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition-all border border-slate-300 dark:border-slate-700"
                title="Tampilkan semua gedung"
              >
                <X className="w-3 h-3 text-slate-400" />
                <span>Reset Filter</span>
              </button>
            )}

            {/* Filter 2: Perangkat */}
            <div className="relative">
              <select 
                value={selectedDeviceType} 
                onChange={(e) => setSelectedDeviceType(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-[#111A33] border border-slate-300 dark:border-slate-700/70 hover:border-slate-600 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500 font-sans"
              >
                <option value="Semua Perangkat">Semua Tipe Node</option>
                <option value="core-switch">Core Switch</option>
                <option value="dist-switch">Distribution Switch</option>
                <option value="access-switch">Access Switch</option>
                <option value="firewall">Firewall</option>
                <option value="server">Server</option>
                <option value="access-point">Access Point</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter 3: Status */}
            <div className="relative">
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-[#111A33] border border-slate-300 dark:border-slate-700/70 hover:border-slate-600 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500 font-sans"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Reset Trace Button */}
            {tracedDeviceId && (
              <button
                type="button"
                onClick={() => setTracedDeviceId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-600/30 dark:hover:bg-amber-600/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-500/50 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Stop Trace</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Menampilkan <strong>{buildingFilteredCount}</strong> dari {devices.length} perangkat</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (Left React Flow Canvas + Right Detail Sidebar) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Canvas */}
        <div className="flex-1 flex flex-col gap-3.5 p-4 overflow-hidden min-w-0">
          <div className="flex-1 min-h-[460px] relative">
            <TopologyCanvas 
              devices={devices}
              cableRoutes={cableRoutes}
              buildings={buildings}
              selectedDeviceId={selectedDevice?.id}
              selectedBuildingFilter={selectedBuilding}
              onSelectDevice={(device) => {
                setSelectedDevice(device);
                setSidebarOpen(true);
              }}
              onViewOnMap={(device) => {
                if (onViewOnMap) {
                  onViewOnMap(device);
                } else if (onNavigateView) {
                  onNavigateView('layout');
                }
              }}
              tracedDeviceId={tracedDeviceId}
              onClearTrace={() => setTracedDeviceId(null)}
              onTraceDevice={(device) => {
                setTracedDeviceId(device.id);
                setSelectedDevice(device);
                setSidebarOpen(true);
              }}
            />
          </div>
        </div>

        {/* Right Column: Device Detail Sidebar */}
        {sidebarOpen && selectedDevice && (
          <DeviceDetailSidebar 
            selectedDevice={selectedDevice}
            onClose={() => setSidebarOpen(false)}
            onViewOnMap={(device) => {
              if (onViewOnMap) {
                onViewOnMap(device);
              } else if (onNavigateView) {
                onNavigateView('layout');
              }
            }}
            onTraceConnection={(device) => {
              setTracedDeviceId(prev => prev === device.id ? null : device.id);
            }}
            isTracing={tracedDeviceId === selectedDevice.id}
          />
        )}
      </div>
    </div>
  );
};
