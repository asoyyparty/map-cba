import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CableRoute } from '../../../types';
import { map2Dto3D } from './FactoryGround3D';

interface CableRoute3DProps {
  cable: CableRoute;
  isSelected: boolean;
  showLabel?: boolean;
  onClick: () => void;
}

export const CableRoute3D: React.FC<CableRoute3DProps> = ({
  cable,
  isSelected,
  showLabel = true,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const pulseRef1 = useRef<THREE.Mesh>(null);
  const pulseRef2 = useRef<THREE.Mesh>(null);

  const isBackbone = cable.type === 'backbone';
  const isWireless = cable.type === 'wireless';

  // 1. Convert 2D waypoints to 3D curve
  const { curve, points } = useMemo(() => {
    if (!cable.path || cable.path.length < 2) {
      return { curve: null, points: [] };
    }

    const baseElevation = isBackbone ? 0.55 : cable.type === 'fiber' ? 0.45 : 0.35;

    // For wireless connections, create an elevated parabolic arc
    if (isWireless) {
      const pStart = cable.path[0];
      const pEnd = cable.path[cable.path.length - 1];
      const [startX, , startZ] = map2Dto3D(pStart.x, pStart.y, 2.0);
      const [endX, , endZ] = map2Dto3D(pEnd.x, pEnd.y, 2.0);
      const midX = (startX + endX) / 2;
      const midZ = (startZ + endZ) / 2;
      const arcElevation = 5.0; // Peak arc height

      const arcPoints = [
        new THREE.Vector3(startX, 2.0, startZ),
        new THREE.Vector3(midX, arcElevation, midZ),
        new THREE.Vector3(endX, 2.0, endZ)
      ];
      return {
        curve: new THREE.CatmullRomCurve3(arcPoints, false, 'catmullrom', 0.2),
        points: arcPoints
      };
    }

    // Ground cable tray route
    const pts = cable.path.map(p => {
      const [x, , z] = map2Dto3D(p.x, p.y, baseElevation);
      return new THREE.Vector3(x, baseElevation, z);
    });

    return {
      curve: new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05),
      points: pts
    };
  }, [cable.path, cable.type, isBackbone, isWireless]);

  // 2. Color styling
  const color = useMemo(() => {
    if (cable.color) return cable.color;
    if (isBackbone) return '#f97316'; // Vivid Orange
    if (cable.type === 'fiber') return '#06b6d4'; // High-Tech Cyan
    if (cable.type === 'utp') return '#10b981'; // Emerald Green
    return '#eab308'; // Amber for wireless
  }, [cable.color, cable.type, isBackbone]);

  const radius = isSelected ? 0.16 : isHovered ? 0.13 : isBackbone ? 0.11 : 0.08;

  // 3. World position for 3D floating cable label
  const labelWorldPos = useMemo((): [number, number, number] | null => {
    if (!cable.path || cable.path.length === 0) return null;
    const midIdx = Math.floor(cable.path.length / 2);
    const targetPt = cable.labelPos || cable.path[midIdx] || cable.path[0];
    const baseElevation = isBackbone ? 0.55 : cable.type === 'fiber' ? 0.45 : 0.35;
    const [lx, , lz] = map2Dto3D(targetPt.x, targetPt.y, baseElevation);
    return [lx, isWireless ? 4.8 : baseElevation + 0.65, lz];
  }, [cable.path, cable.labelPos, isBackbone, isWireless, cable.type]);

  // 4. Dynamic Packet Flow Animation along the 3D curve
  useFrame((state) => {
    if (!curve) return;
    const time = state.clock.getElapsedTime();
    const speed = isBackbone ? 0.45 : 0.3; // Speed factor

    if (pulseRef1.current) {
      const t1 = (time * speed) % 1;
      const pos1 = curve.getPointAt(t1);
      pulseRef1.current.position.copy(pos1);
    }

    if (pulseRef2.current) {
      const t2 = (time * speed + 0.5) % 1;
      const pos2 = curve.getPointAt(t2);
      pulseRef2.current.position.copy(pos2);
    }
  });

  if (!curve || points.length < 2) return null;

  return (
    <group name={`cable-${cable.id}`}>
      {/* 3D Cable Pipe */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={() => setIsHovered(false)}
      >
        <tubeGeometry args={[curve, Math.max(32, points.length * 16), radius, 8, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.6 : isHovered ? 1.2 : 0.6}
          roughness={0.2}
          metalness={0.6}
          transparent={isWireless}
          opacity={isWireless ? 0.6 : 0.95}
        />
      </mesh>

      {/* Animated Data Packet Pulses */}
      <mesh ref={pulseRef1}>
        <sphereGeometry args={[radius * 1.8, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <mesh ref={pulseRef2}>
        <sphereGeometry args={[radius * 1.5, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 3D Floating Cable Label Tag (Identical to 3D Masterplan cable badge) */}
      {showLabel && labelWorldPos && (
        <Html
          position={labelWorldPos}
          center
          distanceFactor={28}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-all border shadow-lg select-none whitespace-nowrap ${
              isSelected
                ? 'bg-blue-950 text-white border-cyan-400 scale-110 ring-2 ring-cyan-400/50 shadow-cyan-500/50'
                : isHovered
                ? 'bg-slate-900 text-cyan-200 border-cyan-400 scale-105 shadow-cyan-500/30'
                : 'bg-slate-950/92 text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
            style={{ borderColor: isSelected || isHovered ? '#38bdf8' : color }}
            title={`Rute Kabel ${cable.code}: ${cable.name}`}
          >
            {cable.code}
          </div>
        </Html>
      )}
    </group>
  );
};
