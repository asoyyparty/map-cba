import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Building, CableRoute, Device, Point } from '../../types';
import { FactoryGround3D, map2Dto3D } from './3d/FactoryGround3D';
import { Building3D } from './3d/Building3D';
import { CableRoute3D } from './3d/CableRoute3D';
import { Compass, RotateCcw, Eye, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ThreeErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[Factory3DScene] WebGL 3D render error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#070D1E] text-slate-200 p-6 text-center font-sans">
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl mb-3 text-rose-400 shadow-xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base mb-1 text-white">Gagal Memuat Mode 3D WebGL</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            Perangkat grafis Anda tidak mendukung WebGL2 Hardware Acceleration atau tab browser kehabisan memori grafis.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Coba Muat Ulang 3D
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Factory3DSceneProps {
  buildings: Building[];
  cableRoutes: CableRoute[];
  devices?: Device[];
  selectedBuilding: Building | null;
  selectedCable: CableRoute | null;
  onSelectBuilding: (building: Building) => void;
  onSelectCable: (cable: CableRoute) => void;
  onSelectDevice?: (device: Device) => void;
  onHoverBuilding?: (building: Building | null, pos?: { x: number; y: number }) => void;
  layers?: {
    buildings: boolean;
    cables: boolean;
    devices: boolean;
    labels: boolean;
  };
  theme?: 'dark' | 'light';
  toolMode?: string;
  drawingBuildingPoints?: Point[];
  onAddBuildingPoint?: (pt: Point) => void;
  drawingCablePoints?: Point[];
  onAddCablePoint?: (pt: Point) => void;
}

const Factory3DSceneInner: React.FC<Factory3DSceneProps> = ({
  buildings,
  cableRoutes,
  devices = [],
  selectedBuilding,
  selectedCable,
  onSelectBuilding,
  onSelectCable,
  onSelectDevice,
  onHoverBuilding,
  layers = { buildings: true, cables: true, devices: true, labels: true },
  theme = 'dark',
  toolMode = 'select',
  drawingBuildingPoints = [],
  onAddBuildingPoint,
  drawingCablePoints = [],
  onAddCablePoint
}) => {
  const controlsRef = useRef<any>(null);

  // Preset Camera Angles
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, 50, 60);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleTopDownView = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 75, 0.1);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleFrontGateView = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 18, 55);
      controlsRef.current.target.set(0, 5, 0);
      controlsRef.current.update();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#060b19]">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 50, 60], fov: 45, near: 0.5, far: 1000 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Sky / Scene Background Color */}
        <color attach="background" args={[isDark ? '#060B19' : '#e2e8f0']} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={isDark ? 0.75 : 1.1} />
        <directionalLight
          position={[35, 60, 35]}
          intensity={isDark ? 1.8 : 2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />

        {/* Cyber Cyan & Rose Backlight Accents */}
        <pointLight position={[-40, 30, -35]} color="#0ea5e9" intensity={0.9} distance={120} />
        <pointLight position={[40, 25, 40]} color="#38bdf8" intensity={0.6} distance={100} />

        {/* Orbit Camera Controls (360° Rotate, Pan, Zoom) */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          dampingFactor={0.06}
          enableDamping
          maxPolarAngle={Math.PI / 2.1} // Prevent going beneath ground
          minDistance={12}
          maxDistance={150}
        />

        {/* 3D Scene Assets with Suspense Fallback */}
        <Suspense fallback={null}>
          {/* 1. Factory Ground Plane (High-Res Aerial + Grid) */}
          <FactoryGround3D
            isDrawingMode={toolMode === 'draw_building' || toolMode === 'draw_cable'}
            onGroundClick={(pt) => {
              if (toolMode === 'draw_building') {
                onAddBuildingPoint?.(pt);
              } else if (toolMode === 'draw_cable') {
                onAddCablePoint?.(pt);
              }
            }}
          />

          {/* 1.1 In-Progress 3D Building Drawing Markers */}
          {toolMode === 'draw_building' && drawingBuildingPoints.length > 0 && (
            <group name="DrawingBuildingPoints3D">
              {drawingBuildingPoints.map((pt, idx) => {
                const [wx, , wz] = map2Dto3D(pt.x, pt.y, 0.2);
                return (
                  <group key={idx} position={[wx, 0.2, wz]}>
                    <mesh>
                      <cylinderGeometry args={[0.7, 0.7, 0.4, 16]} />
                      <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1} />
                    </mesh>
                    <mesh position={[0, 4, 0]}>
                      <cylinderGeometry args={[0.06, 0.06, 8, 8]} />
                      <meshBasicMaterial color="#34d399" transparent opacity={0.8} />
                    </mesh>
                  </group>
                );
              })}
            </group>
          )}

          {/* 1.2 In-Progress 3D Cable Drawing Markers */}
          {toolMode === 'draw_cable' && drawingCablePoints.length > 0 && (
            <group name="DrawingCablePoints3D">
              {drawingCablePoints.map((pt, idx) => {
                const [wx, , wz] = map2Dto3D(pt.x, pt.y, 0.2);
                return (
                  <group key={idx} position={[wx, 0.2, wz]}>
                    <mesh>
                      <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
                      <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={1} />
                    </mesh>
                    <mesh position={[0, 3, 0]}>
                      <cylinderGeometry args={[0.05, 0.05, 6, 8]} />
                      <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
                    </mesh>
                  </group>
                );
              })}
            </group>
          )}

          {/* 2. 3D Buildings Layer */}
          {layers.buildings && (
            <group name="Layer-Buildings">
              {buildings.map((b) => {
                const bldDev = devices.find(d => d.buildingId === b.id);
                return (
                  <Building3D
                    key={b.id}
                    building={b}
                    isSelected={selectedBuilding?.id === b.id}
                    showLabel={layers.labels}
                    showDevice={layers.devices}
                    device={bldDev}
                    onSelectDevice={onSelectDevice}
                    onHover={onHoverBuilding}
                    onClick={() => onSelectBuilding(b)}
                  />
                );
              })}
            </group>
          )}

          {/* 3. 3D Cable Routes Layer */}
          {layers.cables && (
            <group name="Layer-Cables">
              {cableRoutes.map((c) => (
                <CableRoute3D
                  key={c.id}
                  cable={c}
                  isSelected={selectedCable?.id === c.id}
                  showLabel={layers.labels}
                  onClick={() => onSelectCable(c)}
                />
              ))}
            </group>
          )}
        </Suspense>
      </Canvas>

      {/* Floating 3D Navigation HUD (Angle Presets) */}
      <div className="absolute bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 z-20 flex items-center gap-1 sm:gap-1.5 bg-white/90 dark:bg-[#0B132B]/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1 sm:p-1.5 shadow-xl text-xs font-sans max-w-[calc(100vw-1.5rem)]">
        <span className="px-1.5 sm:px-2 font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Camera</span>
        </span>

        <button
          type="button"
          onClick={handleResetCamera}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all font-medium cursor-pointer shrink-0"
          title="Sudut Pandang Isometrik Default (45°)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Isometrik</span>
        </button>

        <button
          type="button"
          onClick={handleTopDownView}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all font-medium cursor-pointer shrink-0"
          title="Sudut Pandang Atas (Top-Down Aerial)"
        >
          <Eye className="w-3 h-3 text-cyan-500" />
          <span>Top-Down</span>
        </button>

        <button
          type="button"
          onClick={handleFrontGateView}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all font-medium cursor-pointer shrink-0"
          title="Sudut Pandang Gerbang Utama Depan"
        >
          <span className="hidden sm:inline">Gerbang </span>
          <span>Depan</span>
        </button>
      </div>

      {/* Floating 3D Interaction Tip Footer */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden md:flex items-center gap-3 bg-white/80 dark:bg-[#0B132B]/85 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 shadow-lg">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300">Klik Kiri</kbd> Putar 360°
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300">Klik Kanan</kbd> Geser Posisi
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300">Scroll</kbd> Zoom In/Out
        </span>
      </div>
    </div>
  );
};

export const Factory3DScene: React.FC<Factory3DSceneProps> = (props) => {
  return (
    <ThreeErrorBoundary>
      <Factory3DSceneInner {...props} />
    </ThreeErrorBoundary>
  );
};
