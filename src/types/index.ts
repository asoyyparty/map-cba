export type BuildingCategory = 'office' | 'production' | 'warehouse' | 'lab' | 'utility' | 'security' | (string & {});
export type BuildingStatus = 'healthy' | 'warning' | 'critical';

export interface BuildingCategoryItem {
  id: string;
  name: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  buildingsCount?: number;
  createdAt?: string;
}

export type DeviceType = 
  | 'firewall'
  | 'router'
  | 'core-switch' 
  | 'dist-switch' 
  | 'access-switch' 
  | 'server' 
  | 'computer'
  | 'access-point' 
  | 'cctv'
  | 'odf'
  | 'patch-panel'
  | 'ups'
  | 'other'
  | 'internet';

export type DeviceStatus = 'online' | 'warning' | 'offline';
export type CableType = 'fiber' | 'utp' | 'backbone' | 'wireless' | 'backup';
export type CableStatus = 'active' | 'degraded' | 'broken' | 'normal' | 'maintenance';


export interface Point {
  x: number;
  y: number;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  category: BuildingCategory;
  polygon: Point[];
  center: Point;
  status: BuildingStatus;
  color?: string;
  headIT: string;
  totalDevices: number;
  racksCount: number;
  description: string;
  lokasi?: string;
  koordinat?: string;
  mainSwitch?: string;
  apCount?: number;
  portCount?: number;
  connectedUsers?: number;
  backboneFrom?: string;
  backboneCable?: string;
  backboneCore?: string;
  backboneSpeed?: string;
  backboneStatus?: string;
  imageUrl?: string;
}

export interface Port {
  id: string;
  deviceId: string;
  portName: string;
  portType?: string;
  speed?: string;
  status: 'active' | 'idle' | 'down' | 'up' | 'disabled';
  portNumber?: number;
  connectedToDeviceId?: string;
  connectedToPortName?: string;
  connectedToPortNumber?: number;
  vlan?: number | string;
  description?: string;
  cableId?: string;
  createdAt?: string;
}

export interface Device {
  id: string;
  code?: string;
  name: string;
  ip: string;
  mac: string;
  type: DeviceType;
  vendor?: string;
  brand: string;
  model: string;
  serialNumber?: string;
  hostname?: string;
  buildingId: string;
  buildingName: string;
  room: string;
  rackId?: string;
  rackName?: string;
  rackUPosition?: number;
  status: DeviceStatus;
  totalPorts: number;
  activePorts: number;
  uptime: string;
  installationDate?: string;
  description?: string;
  x?: number;
  y?: number;
  pos_x?: number;
  pos_y?: number;
  lastSeen?: string;
  parentId?: string;
}

export interface RackSlot {
  u: number;
  isOccupied: boolean;
  deviceId: string | null;
  device: any | null;
  isDeviceRoot: boolean;
  height: number;
}

export interface Rack {
  id: string;
  name: string;
  code: string;
  buildingId: string;
  buildingName?: string;
  room: string;
  uCapacity: number;
  usedU: number;
  freeU?: number;
  occupancyPercent?: number;
  maxPowerWatts?: number;
  currentPowerWatts?: number;
  maxWeightKg?: number;
  status?: string;
  description?: string;
  deviceIds: string[];
  devicesCount?: number;
  devices?: any[];
  slots?: RackSlot[];
  createdAt?: string;
}

export type FiberCoreStatus = 'connected' | 'reserved' | 'damaged' | 'available';

export interface FiberCoreAllocation {
  coreNumber: number;
  tubeNumber?: number;
  colorName: string;
  colorHex: string;
  status: FiberCoreStatus;
  service?: string;
  sourceDevice?: string;
  sourcePort?: string;
  targetDevice?: string;
  targetPort?: string;
  attenuationDb?: number;
  notes?: string;
}

export interface CableRoute {
  id: string;
  code: string;
  name: string;
  type: CableType;
  fromBuildingId: string;
  fromBuildingName?: string;
  toBuildingId: string;
  toBuildingName?: string;
  fromDeviceId?: string;
  toDeviceId?: string;
  path: Point[];
  labelPos?: Point;
  status: CableStatus;
  totalCores: number;
  usedCores: number;
  lengthMeters: number;
  bandwidth?: string;
  attenuationDb?: number;
  color?: string;
  lineWidth?: number;
  coreAllocations?: FiberCoreAllocation[];
}


export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical' | 'warning';
export type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'in-progress' | 'resolved';
export type AlertCategory = 'fiber_optical' | 'device_offline' | 'latency_spike' | 'power_rack' | 'security' | 'network';

export interface Alert {
  id: string;
  timestamp: string;
  timeAgo?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category?: AlertCategory | string;
  title: string;
  message: string;
  buildingId?: string;
  buildingName?: string;
  deviceId?: string;
  deviceName?: string;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  ticketId?: string | null;
}

export interface ActivityItem {
  id: string;
  title: string;
  timeAgo: string;
  type: 'online' | 'maintenance' | 'offline' | 'addition';
}

export interface NetworkStatusCategory {
  title: string;
  status: 'UP' | 'WARNING' | 'DOWN';
  onlineCount: number;
  totalCount: number;
}

export interface LayerVisibility {
  gedung: boolean;
  fiberOptic: boolean;
  utp: boolean;
  backbone: boolean;
  wireless: boolean;
  switch: boolean;
  router: boolean;
  accessPoint: boolean;
  cctv: boolean;
  server: boolean;
  internet: boolean;
  labels?: boolean;
  flowAnimation?: boolean;
}

export type ViewMode = 
  | 'dashboard' 
  | 'layout' 
  | 'cables' 
  | 'topology' 
  | 'buildings' 
  | 'devices' 
  | 'backbone' 
  | 'racks' 
  | 'monitoring' 
  | 'maintenance' 
  | 'reports' 
  | 'users' 
  | 'settings';
