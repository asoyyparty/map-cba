import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Building, Device } from '../../../types';
import { map2Dto3D, CBA_SCALE } from './FactoryGround3D';

interface Building3DProps {
  building: Building;
  isSelected: boolean;
  showLabel?: boolean;
  showDevice?: boolean;
  device?: Device | null;
  onSelectDevice?: (dev: Device) => void;
  onHover?: (bld: Building | null, pos?: { x: number; y: number }) => void;
  onClick: () => void;
}

export const Building3D: React.FC<Building3DProps> = ({
  building,
  isSelected,
  showLabel = true,
  showDevice = true,
  device = null,
  onSelectDevice,
  onHover,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 1. Calculate physical shape, extrude geometry, and world coordinates directly from polygon
  const { shape, extrudeGeometry, edgesGeometry, height, position } = useMemo(() => {
    // Determine polygon vertices (with fallback rectangle if < 3 points)
    let poly = building.polygon && building.polygon.length >= 3 ? building.polygon : [];
    if (poly.length < 3) {
      const w = 24;
      const d = 18;
      poly = [
        { x: building.center.x - w / 2, y: building.center.y - d / 2 },
        { x: building.center.x + w / 2, y: building.center.y - d / 2 },
        { x: building.center.x + w / 2, y: building.center.y + d / 2 },
        { x: building.center.x - w / 2, y: building.center.y + d / 2 }
      ];
    }

    const cx = building.center.x;
    const cy = building.center.y;

    // Convert polygon to local (u, v) coordinates relative to building center
    let localPts = poly.map(p => ({
      u: (p.x - cx) * CBA_SCALE,
      v: -(p.y - cy) * CBA_SCALE
    }));

    // Ensure Counter-Clockwise (CCW) winding for proper outward-facing Three.js normals
    let signedArea = 0;
    for (let i = 0; i < localPts.length; i++) {
      const j = (i + 1) % localPts.length;
      signedArea += localPts[i].u * localPts[j].v - localPts[j].u * localPts[i].v;
    }
    if (signedArea < 0) {
      localPts.reverse();
    }

    // Build THREE.Shape matching the exact 2D Masterplan polygon
    const s = new THREE.Shape();
    s.moveTo(localPts[0].u, localPts[0].v);
    for (let i = 1; i < localPts.length; i++) {
      s.lineTo(localPts[i].u, localPts[i].v);
    }
    s.closePath();

    // Height based on building significance / category / name
    let calcHeight = 2.8;
    const code = building.code?.toUpperCase() || '';
    const name = building.name?.toLowerCase() || '';
    if (building.category === 'office' || code === 'KU' || name.includes('kantor') || name.includes('lab')) {
      calcHeight = 4.2;
    } else if (building.category === 'production' || name.includes('prod')) {
      calcHeight = 3.6;
    } else if (building.category === 'warehouse' || name.includes('gudang')) {
      calcHeight = 3.2;
    } else if (name.includes('security') || name.includes('pos') || name.includes('gajebo') || name.includes('tps') || name.includes('timbangan')) {
      calcHeight = 2.2;
    }

    // Extrude 2D shape into 3D architectural volume
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: calcHeight,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
      steps: 1
    };

    const geom = new THREE.ExtrudeGeometry(s, extrudeSettings);
    geom.computeVertexNormals();

    // Compute sharp architectural edges matching the polygon outline
    const edgeGeom = new THREE.EdgesGeometry(geom, 25);

    // World position of building ground base
    const [worldX, , worldZ] = map2Dto3D(cx, cy, 0);

    return {
      shape: s,
      extrudeGeometry: geom,
      edgesGeometry: edgeGeom,
      height: calcHeight,
      position: [worldX, 0, worldZ] as [number, number, number]
    };
  }, [building.polygon, building.center, building.category, building.code, building.name]);

  // Clean up WebGL geometry resources on change/unmount
  useEffect(() => {
    return () => {
      extrudeGeometry.dispose();
      edgesGeometry.dispose();
    };
  }, [extrudeGeometry, edgesGeometry]);

  // 2. Determine color palette based on status and selection
  const statusColors = useMemo(() => {
    const isOffline = building.status === 'critical';
    const isWarning = building.status === 'warning';

    if (isOffline) {
      return {
        body: '#450a0a',
        edge: '#f43f5e',
        emissive: '#e11d48',
        accent: 'bg-rose-500'
      };
    }
    if (isWarning) {
      return {
        body: '#451a03',
        edge: '#f59e0b',
        emissive: '#d97706',
        accent: 'bg-amber-500'
      };
    }
    // Healthy / Custom building color
    const customColor = building.color || '#06b6d4';
    return {
      body: building.color ? '#131e36' : '#0f172a',
      edge: customColor,
      emissive: customColor,
      accent: 'bg-cyan-500'
    };
  }, [building.status, building.color]);

  const activeEdgeColor = building.color || (isSelected ? '#38bdf8' : isHovered ? '#67e8f9' : statusColors.edge);
  const activeEmissive = building.color || (isSelected ? '#0284c7' : isHovered ? '#0ea5e9' : statusColors.emissive);
  const activeEmissiveIntensity = isSelected ? 0.75 : isHovered ? 0.55 : (building.color ? 0.32 : 0.12);

  return (
    <group position={[position[0], isHovered ? 0.25 : 0, position[2]]}>
      {/* Rotated Container: maps extruded +Z into vertical +Y in world */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Main Extruded 3D Building Volume */}
        <mesh
          geometry={extrudeGeometry}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setIsHovered(true);
            onHover?.(building, { x: e.clientX, y: e.clientY });
          }}
          onPointerOut={() => {
            setIsHovered(false);
            onHover?.(null);
          }}
        >
          <meshStandardMaterial
            color={statusColors.body}
            emissive={activeEmissive}
            emissiveIntensity={activeEmissiveIntensity}
            roughness={0.25}
            metalness={0.75}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Exact Rooftop Polygon Accent Cap for Colored Buildings */}
        {building.color && (
          <mesh position={[0, 0, height + 0.09]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial
              color={building.color}
              emissive={building.color}
              emissiveIntensity={isSelected ? 0.7 : isHovered ? 0.5 : 0.35}
              roughness={0.25}
              metalness={0.65}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        )}

        {/* Futuristic Wireframe Outlines (Glow Edges conforming to polygon) */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial
            color={activeEdgeColor}
            linewidth={isSelected || isHovered ? 2 : 1}
            transparent
            opacity={isSelected || isHovered ? 0.95 : (building.color ? 0.85 : 0.65)}
          />
        </lineSegments>
      </group>

      {/* Beacon Light on Roof */}
      <pointLight
        position={[0, height + 0.5, 0]}
        color={activeEdgeColor}
        intensity={isSelected ? 3.2 : isHovered ? 2.2 : (building.color ? 1.4 : 0.8)}
        distance={7}
      />

      {/* Floating 3D HUD Badge */}
      {showLabel && (
        <Html
          position={[0, height + 1.1, 0]}
          center
          distanceFactor={32}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            onMouseEnter={(e) => {
              setIsHovered(true);
              onHover?.(building, { x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => {
              setIsHovered(false);
              onHover?.(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-200 cursor-pointer select-none text-xs font-sans ${
              isSelected
                ? 'bg-blue-950/95 border-blue-400 text-white scale-110 shadow-blue-500/40 ring-1 ring-blue-400/50'
                : isHovered
                ? 'bg-slate-900/95 border-cyan-400 text-cyan-200 scale-105 shadow-cyan-500/30'
                : 'bg-slate-950/85 border-slate-700/80 text-slate-200 hover:border-slate-500'
            }`}
            style={{
              borderColor: building.color ? (isSelected ? '#ffffff' : building.color) : undefined,
              boxShadow: building.color ? `0 0 12px ${building.color}60` : undefined
            }}
          >
            {/* Status Pulse Indicator */}
            <span 
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${building.status !== 'critical' ? 'animate-pulse' : ''} ${building.color ? 'border border-white/80' : ''}`} 
              style={{ backgroundColor: building.color || undefined }}
            />

            <span className="font-bold tracking-wide whitespace-nowrap text-xs">
              {building.name}
            </span>

            {building.totalDevices > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-mono font-semibold ml-0.5 border border-blue-500/30" title={`${building.totalDevices} Perangkat terpasang`}>
                {building.totalDevices}
              </span>
            )}

            {/* Interactive Switch Chip (matching 3D Masterplan SW button) */}
            {showDevice && device && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDevice?.(device);
                }}
                className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                title={`Buka rincian switch ${device.name}`}
              >
                SW
              </button>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
