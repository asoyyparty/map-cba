import React, { useMemo, useCallback, useState, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge, 
  MarkerType, 
  useNodesState, 
  useEdgesState,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Device, CableRoute, Building } from '../../types';
import { NetworkDeviceNode, NetworkDeviceNodeData } from './NetworkDeviceNode';
import { 
  Activity, 
  X, 
  RotateCcw, 
  Filter, 
  Info, 
  CheckCircle2, 
  GitFork, 
  Layers, 
  Server, 
  HardDrive, 
  Wifi, 
  Flame,
  ArrowRight,
  Plus
} from 'lucide-react';

export const SwitchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h16M16 4l4 4-4 4" />
    <path d="M20 16H4M8 12l-4 4 4 4" />
  </svg>
);

interface TopologyCanvasProps {
  devices: Device[];
  cableRoutes?: CableRoute[];
  buildings?: Building[];
  selectedDeviceId?: string;
  selectedBuildingFilter?: string; // 'Semua Gedung' or building ID / name
  onSelectDevice: (device: Device) => void;
  onViewOnMap?: (device: Device) => void;
  tracedDeviceId?: string | null;
  onClearTrace?: () => void;
  onTraceDevice?: (device: Device) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  devices = [],
  cableRoutes = [],
  buildings = [],
  selectedDeviceId,
  selectedBuildingFilter = 'Semua Gedung',
  onSelectDevice,
  onViewOnMap,
  tracedDeviceId,
  onClearTrace,
  onTraceDevice
}) => {
  // Register custom node types
  const nodeTypes = useMemo(() => ({
    networkDevice: NetworkDeviceNode
  }), []);

  // ----------------------------------------------------
  // TRACE PATH COMPUTATION (ANCESTOR CHAIN & CHILDREN)
  // ----------------------------------------------------
  const { pathNodeIds, pathEdgeIds, tracedDevice } = useMemo(() => {
    if (!tracedDeviceId) {
      return { pathNodeIds: new Set<string>(), pathEdgeIds: new Set<string>(), tracedDevice: null };
    }

    const nodeSet = new Set<string>();
    const edgeSet = new Set<string>();
    const target = devices.find(d => d.id === tracedDeviceId);
    if (!target) return { pathNodeIds: nodeSet, pathEdgeIds: edgeSet, tracedDevice: null };

    nodeSet.add(target.id);

    // 1. Walk up to Core Switch & Gateway Firewall
    let curr: Device | undefined = target;
    while (curr && curr.parentId) {
      const parent: Device | undefined = devices.find(d => d.id === curr!.parentId);
      if (parent) {
        nodeSet.add(parent.id);
        edgeSet.add(`e-${parent.id}-${curr.id}`);
        curr = parent;
      } else {
        break;
      }
    }

    // 2. Add immediate direct children of target
    const children = devices.filter(d => d.parentId === target.id);
    children.forEach(child => {
      nodeSet.add(child.id);
      edgeSet.add(`e-${target.id}-${child.id}`);
    });

    return { pathNodeIds: nodeSet, pathEdgeIds: edgeSet, tracedDevice: target };
  }, [tracedDeviceId, devices]);

  // ----------------------------------------------------
  // FILTERING DEVICES BASED ON SELECTED BUILDING
  // ----------------------------------------------------
  const filteredDevices = useMemo(() => {
    if (!selectedBuildingFilter || selectedBuildingFilter === 'Semua Gedung') {
      return devices;
    }

    const matchedBld = buildings.find(
      b => b.id === selectedBuildingFilter || b.name.toLowerCase() === selectedBuildingFilter.toLowerCase() || b.code.toLowerCase() === selectedBuildingFilter.toLowerCase()
    );

    const bldId = matchedBld ? matchedBld.id : selectedBuildingFilter;

    // Filter devices belonging to this building
    const bldDevices = devices.filter(d => d.buildingId === bldId);

    // Always include upstream Core Switch and Firewall for topology context
    const coreSwitch = devices.find(d => d.type === 'core-switch');
    const firewall = devices.find(d => d.type === 'firewall');

    const result = [...bldDevices];
    if (coreSwitch && !result.some(d => d.id === coreSwitch.id)) {
      result.unshift(coreSwitch);
    }
    if (firewall && !result.some(d => d.id === firewall.id)) {
      result.unshift(firewall);
    }

    return result;
  }, [devices, selectedBuildingFilter, buildings]);

  // ----------------------------------------------------
  // HIERARCHICAL LAYOUT GENERATOR (TIERS 0 TO 4)
  // ----------------------------------------------------
  const { initialNodes, initialEdges } = useMemo(() => {
    // Partition devices into logical hierarchy levels
    const tier0 = filteredDevices.filter(d => d.type === 'firewall');
    const tier1 = filteredDevices.filter(d => d.type === 'core-switch' || (d.type === 'server' && d.buildingId === 'bld-ku'));
    const tier2 = filteredDevices.filter(d => d.type === 'dist-switch');
    const tier3 = filteredDevices.filter(d => d.type === 'access-switch' || (d.type === 'server' && d.buildingId !== 'bld-ku'));
    const tier4 = filteredDevices.filter(d => d.type === 'access-point' || (!['firewall', 'core-switch', 'dist-switch', 'access-switch', 'server'].includes(d.type)));

    const generatedNodes: Node<NetworkDeviceNodeData>[] = [];
    const generatedEdges: Edge[] = [];

    const nodeWidth = 220;
    const nodeSpacingX = 260;
    const canvasCenterX = Math.max(tier2.length, 4) * nodeSpacingX / 2;

    // Helper to position a row of nodes horizontally centered
    const positionRow = (rowItems: Device[], yPos: number, startX?: number) => {
      const rowWidth = (rowItems.length - 1) * nodeSpacingX;
      const initialX = startX !== undefined ? startX : (canvasCenterX - rowWidth / 2);

      rowItems.forEach((dev, idx) => {
        const x = initialX + idx * nodeSpacingX;
        const isTraced = tracedDeviceId === dev.id;
        const isPath = pathNodeIds.has(dev.id);
        const isDimmed = tracedDeviceId ? !isPath : false;

        generatedNodes.push({
          id: dev.id,
          type: 'networkDevice',
          position: { x, y: yPos },
          selected: selectedDeviceId === dev.id,
          data: {
            device: dev,
            isHighlighted: isPath,
            isDimmed,
            isTraceOrigin: isTraced,
            onSelect: (d) => onSelectDevice(d),
            onViewOnMap: (d) => onViewOnMap && onViewOnMap(d),
            onTrace: (d) => onTraceDevice && onTraceDevice(d)
          }
        });
      });
    };

    // Position Tiers
    positionRow(tier0, 40);
    positionRow(tier1, 200);
    positionRow(tier2, 380);
    positionRow(tier3, 580);
    positionRow(tier4, 780);

    // ----------------------------------------------------
    // BUILD EDGES (FROM PARENT ID & CABLE ROUTES)
    // ----------------------------------------------------
    const deviceMap = new Map(filteredDevices.map(d => [d.id, d]));

    filteredDevices.forEach(dev => {
      if (dev.parentId && deviceMap.has(dev.parentId)) {
        const parent = deviceMap.get(dev.parentId)!;
        const edgeId = `e-${parent.id}-${dev.id}`;
        const isPathEdge = pathEdgeIds.has(edgeId);

        // Find if there is a matching physical cable route
        const cable = cableRoutes.find(c => 
          (c.fromBuildingId === parent.buildingId && c.toBuildingId === dev.buildingId) ||
          (c.fromBuildingId === dev.buildingId && c.toBuildingId === parent.buildingId)
        );

        const edgeTypeColor = isPathEdge 
          ? '#00f2fe' 
          : cable?.color || (
              parent.type === 'core-switch' ? '#06b6d4' :
              dev.type === 'access-point' ? '#f59e0b' :
              dev.type === 'server' ? '#10b981' : '#3b82f6'
            );

        const edgeWidth = isPathEdge ? 4 : cable?.lineWidth || (parent.type === 'core-switch' ? 2.5 : 1.8);

        generatedEdges.push({
          id: edgeId,
          source: parent.id,
          target: dev.id,
          animated: isPathEdge || cable?.type !== 'backup',
          style: {
            stroke: edgeTypeColor,
            strokeWidth: edgeWidth,
            opacity: tracedDeviceId ? (isPathEdge ? 1.0 : 0.15) : 0.85,
            filter: isPathEdge ? 'drop-shadow(0 0 8px #00f2fe)' : 'none'
          },
          label: isPathEdge ? 'ACTIVE PATH' : cable ? `${cable.code} • ${cable.bandwidth || '10G'}` : undefined,
          labelStyle: {
            fill: isPathEdge ? '#00f2fe' : '#94a3b8',
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: isPathEdge ? 'bold' : 'normal'
          },
          labelBgStyle: {
            fill: '#0B132B',
            fillOpacity: 0.9,
            stroke: isPathEdge ? '#00f2fe' : '#334155',
            strokeWidth: isPathEdge ? 1.2 : 0.8,
            rx: 3
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeTypeColor,
            width: 14,
            height: 14
          }
        });
      }
    });

    return { initialNodes: generatedNodes, initialEdges: generatedEdges };
  }, [filteredDevices, cableRoutes, selectedDeviceId, tracedDeviceId, pathNodeIds, pathEdgeIds, onSelectDevice, onViewOnMap, onTraceDevice]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when data or layout changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node selection from React Flow canvas
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const clickedDev = devices.find(d => d.id === node.id);
    if (clickedDev) {
      onSelectDevice(clickedDev);
    }
  }, [devices, onSelectDevice]);

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-[#070e20] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden select-none font-sans">
      {/* ---------------------------------------------------- */}
      {/* TOP FLOATING BANNER: TRACE CONNECTION ACTIVE         */}
      {/* ---------------------------------------------------- */}
      {tracedDeviceId && tracedDevice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-[#0B132B]/95 border border-cyan-500 dark:border-cyan-400 rounded-2xl px-4 py-2.5 shadow-xl dark:shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in ring-2 ring-cyan-400/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
              Tracing Network Path: {tracedDevice.name} ({tracedDevice.buildingName})
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
            {pathNodeIds.size} Hops Terkoneksi ke Core Gateway
          </span>

          <button
            type="button"
            onClick={onClearTrace}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-300 dark:border-slate-700"
            title="Hentikan Trace Path"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Trace</span>
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TOP-LEFT FLOATING LEGEND BOX                         */}
      {/* ---------------------------------------------------- */}
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#0B132B]/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-3 rounded-2xl shadow-lg dark:shadow-2xl z-20 text-xs font-sans pointer-events-auto">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 font-mono">
          Link & Node Legend:
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full" /> FO Backbone
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-blue-500 rounded-full" /> Dist Switch
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-500 rounded-full" /> UTP Cat6
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-indigo-500 rounded-full" /> Access Switch
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-amber-500 dark:bg-amber-400 rounded-full" /> Wi-Fi AP
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" /> Enterprise Server
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* REACT FLOW CANVAS                                    */}
      {/* ---------------------------------------------------- */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25, duration: 600 }}
        minZoom={0.2}
        maxZoom={2.0}
        attributionPosition="bottom-left"
        className="react-flow-dark"
      >
        <Background 
          color="#94a3b8" 
          gap={24} 
          size={1.5} 
          variant={BackgroundVariant.Dots} 
          className="opacity-40 dark:opacity-20"
        />
        <Controls 
          className="!bg-white dark:!bg-[#0B132B] !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-lg dark:!shadow-2xl [&>button]:!bg-slate-50 dark:[&>button]:!bg-[#111A33] [&>button]:!border-slate-200 dark:[&>button]:!border-slate-700 [&>button]:!text-slate-700 dark:[&>button]:!text-slate-200 hover:[&>button]:!bg-slate-100 dark:hover:[&>button]:!bg-slate-700" 
        />
        <MiniMap
          nodeColor={(node) => {
            const dev = (node.data as NetworkDeviceNodeData)?.device;
            if (!dev) return '#64748b';
            switch (dev.type) {
              case 'firewall': return '#f97316';
              case 'core-switch': return '#06b6d4';
              case 'dist-switch': return '#3b82f6';
              case 'access-switch': return '#6366f1';
              case 'server': return '#10b981';
              case 'access-point': return '#f59e0b';
              default: return '#64748b';
            }
          }}
          maskColor="rgba(148, 163, 184, 0.3)"
          className="!bg-white dark:!bg-[#0B132B] !border-slate-200 dark:!border-slate-800 !rounded-xl !overflow-hidden shadow-md dark:shadow-none"
        />
      </ReactFlow>

      {/* Empty State Overlay */}
      {devices.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-auto bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-[#0E172F] border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md text-center mx-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/50">
              <Server className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Belum Ada Perangkat Jaringan
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Seluruh data perangkat default bawaan telah dibersihkan. Anda dapat mulai menambahkan Switch, Router, Server, AP, dll secara manual.
            </p>
            <a
              href="/devices"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Kelola & Tambah Perangkat</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
