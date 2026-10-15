import React, { Suspense } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export const CBA_MAP_WIDTH = 445;
export const CBA_MAP_HEIGHT = 561;
export const CBA_SCALE = 0.15;

export const GROUND_WIDTH = CBA_MAP_WIDTH * CBA_SCALE;   // ~66.75
export const GROUND_HEIGHT = CBA_MAP_HEIGHT * CBA_SCALE; // ~84.15

/**
 * Converts 2D SVG map coordinates (0..445, 0..561) to 3D Three.js world coordinates
 */
export function map2Dto3D(x: number, y: number, elevation = 0): [number, number, number] {
  const worldX = (x - CBA_MAP_WIDTH / 2) * CBA_SCALE;
  const worldZ = (y - CBA_MAP_HEIGHT / 2) * CBA_SCALE;
  return [worldX, elevation, worldZ];
}

/**
 * Converts 3D Three.js world coordinates (worldX, worldZ) back to 2D SVG coordinates (0..445, 0..561)
 */
export function map3Dto2D(worldX: number, worldZ: number): { x: number; y: number } {
  const x = Math.round(worldX / CBA_SCALE + CBA_MAP_WIDTH / 2);
  const y = Math.round(worldZ / CBA_SCALE + CBA_MAP_HEIGHT / 2);
  return {
    x: Math.max(0, Math.min(CBA_MAP_WIDTH, x)),
    y: Math.max(0, Math.min(CBA_MAP_HEIGHT, y))
  };
}

interface FactoryGround3DProps {
  onGroundClick?: (pt: { x: number; y: number }) => void;
  isDrawingMode?: boolean;
}

function TexturedGround({ onGroundClick, isDrawingMode }: FactoryGround3DProps) {
  const texture = useTexture('/cba_layout_3d.jpg');
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerDown={(e) => {
        if (isDrawingMode && onGroundClick) {
          e.stopPropagation();
          const pt = map3Dto2D(e.point.x, e.point.z);
          onGroundClick(pt);
        }
      }}
    >
      <planeGeometry args={[GROUND_WIDTH, GROUND_HEIGHT]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0.15}
      />
    </mesh>
  );
}

function FallbackGround({ onGroundClick, isDrawingMode }: FactoryGround3DProps) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerDown={(e) => {
        if (isDrawingMode && onGroundClick) {
          e.stopPropagation();
          const pt = map3Dto2D(e.point.x, e.point.z);
          onGroundClick(pt);
        }
      }}
    >
      <planeGeometry args={[GROUND_WIDTH, GROUND_HEIGHT]} />
      <meshStandardMaterial color="#0B132B" roughness={0.8} />
    </mesh>
  );
}

export const FactoryGround3D: React.FC<FactoryGround3DProps> = ({
  onGroundClick,
  isDrawingMode = false
}) => {
  return (
    <group name="FactoryGround">
      {/* Aerial Layout Plane with Texture */}
      <Suspense fallback={<FallbackGround onGroundClick={onGroundClick} isDrawingMode={isDrawingMode} />}>
        <TexturedGround onGroundClick={onGroundClick} isDrawingMode={isDrawingMode} />
      </Suspense>

      {/* Cyberpunk Blueprint Boundary Frame */}
      <lineSegments position={[0, 0.02, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(GROUND_WIDTH, 0.01, GROUND_HEIGHT)]} />
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.4} />
      </lineSegments>

      {/* Extended Digital Twin Coordinate Grid */}
      <gridHelper
        args={[150, 75, '#0284c7', '#0f172a']}
        position={[0, -0.05, 0]}
      />
    </group>
  );
};
