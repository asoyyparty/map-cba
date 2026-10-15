// Dashboard Repository Abstraction Layer for CBA Network Map
// Encapsulates all dashboard data queries so UI components never hardcode data directly.
// Easily swappable to Supabase, REST API, or GraphQL in future iterations.

import { factoryMapService } from './factoryMapService';

export type HealthStatus = 'online' | 'warning' | 'offline' | 'unknown';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type MaintenanceStatus = 'In Progress' | 'Scheduled' | 'Pending Parts' | 'Completed';

export interface StatCardData {
  id: string;
  label: string;
  value: number | string;
  trend: string;
  trendPositive?: boolean;
  path: string;
  category: 'buildings' | 'devices' | 'cables' | 'alerts' | 'maintenance' | 'availability';
}

export interface NetworkHealthSummary {
  online: number;
  warning: number;
  offline: number;
  unknown: number;
  total: number;
  availabilityRate: number; // e.g., 99.8%
}

export interface DeviceTypeCount {
  type: string;
  count: number;
  online: number;
  percentage: number;
  color: string;
}

export interface BuildingNetworkStatusItem {
  id: string;
  code: string;
  name: string;
  devices: number;
  online: number;
  offline: number;
  cableRoutes: number;
  status: 'healthy' | 'warning' | 'critical';
  mainSwitch?: string;
  utilization: number;
}

export interface RecentAlertItem {
  id: string;
  title: string;
  asset: string;
  building: string;
  severity: SeverityLevel;
  time: string;
  status: 'Active' | 'Investigating' | 'Resolved';
}

export interface RecentMaintenanceItem {
  id: string;
  ticket: string;
  asset: string;
  building: string;
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  assignedAvatar?: string;
  status: MaintenanceStatus;
  dueDate: string;
}

export interface DashboardData {
  site: string;
  lastUpdated: string;
  stats: StatCardData[];
  health: NetworkHealthSummary;
  devicesByType: DeviceTypeCount[];
  buildings: BuildingNetworkStatusItem[];
  recentAlerts: RecentAlertItem[];
  recentMaintenance: RecentMaintenanceItem[];
}

export interface IDashboardRepository {
  getDashboardData(site?: string): Promise<DashboardData>;
  refresh(): Promise<DashboardData>;
  addDevice(device: Partial<any>): Promise<{ success: boolean; message: string }>;
  addCableRoute(route: Partial<any>): Promise<{ success: boolean; message: string }>;
  createMaintenanceTicket(ticket: Partial<RecentMaintenanceItem>): Promise<{ success: boolean; message: string }>;
}

// Initial Structured Enterprise Dataset for PT. CBA Chemical Industry
const INITIAL_BUILDINGS: BuildingNetworkStatusItem[] = [
  { id: 'bld-ku', code: 'KU', name: 'Kantor Utama & Data Center', devices: 28, online: 28, offline: 0, cableRoutes: 8, status: 'healthy', mainSwitch: 'SW-CORE-KU01', utilization: 84 },
  { id: 'bld-mtc', code: 'MTC', name: 'Gedung Maintenance & Workshop', devices: 14, online: 13, offline: 1, cableRoutes: 4, status: 'warning', mainSwitch: 'SW-DIST-MTC01', utilization: 62 },
  { id: 'bld-a', code: 'A', name: 'Plant Produksi A (Synthesis)', devices: 22, online: 22, offline: 0, cableRoutes: 5, status: 'healthy', mainSwitch: 'SW-ACC-PLTA01', utilization: 91 },
  { id: 'bld-b', code: 'B', name: 'Plant Produksi B (Formulasi)', devices: 18, online: 17, offline: 1, cableRoutes: 4, status: 'warning', mainSwitch: 'SW-ACC-PLTB01', utilization: 78 },
  { id: 'bld-c', code: 'C', name: 'Plant Produksi C (Packaging)', devices: 16, online: 16, offline: 0, cableRoutes: 4, status: 'healthy', mainSwitch: 'SW-ACC-PLTC01', utilization: 65 },
  { id: 'bld-d', code: 'D', name: 'Warehouse Bahan Baku', devices: 10, online: 10, offline: 0, cableRoutes: 3, status: 'healthy', mainSwitch: 'SW-ACC-WHD01', utilization: 48 },
  { id: 'bld-e', code: 'E', name: 'Warehouse Barang Jadi', devices: 12, online: 12, offline: 0, cableRoutes: 3, status: 'healthy', mainSwitch: 'SW-ACC-WHE01', utilization: 54 },
  { id: 'bld-f', code: 'F', name: 'Laboratorium R&D & QA/QC', devices: 15, online: 15, offline: 0, cableRoutes: 4, status: 'healthy', mainSwitch: 'SW-DIST-LAB01', utilization: 72 },
  { id: 'bld-h', code: 'H', name: 'Utility & Power Substation', devices: 8, online: 7, offline: 1, cableRoutes: 2, status: 'critical', mainSwitch: 'SW-UTL-SUB01', utilization: 88 },
  { id: 'bld-j', code: 'J', name: 'Pos Satpam & Gerbang Utama', devices: 6, online: 6, offline: 0, cableRoutes: 2, status: 'healthy', mainSwitch: 'SW-SEC-GT01', utilization: 35 }
];

const INITIAL_DEVICES_BY_TYPE: DeviceTypeCount[] = [];

const INITIAL_ALERTS: RecentAlertItem[] = [
  { id: 'alt-01', title: 'High Link Latency (142ms) on Backbone Drop', asset: 'SW-UTL-SUB01 (Port 24)', building: 'Utility & Substation (H)', severity: 'Critical', time: '12 menit lalu', status: 'Active' },
  { id: 'alt-02', title: 'Power Fluctuation Detected on UPS Unit 2', asset: 'UPS-APC-KU-02', building: 'Kantor Utama (KU)', severity: 'High', time: '28 menit lalu', status: 'Investigating' },
  { id: 'alt-03', title: 'Fiber Core #4 Attenuation Spike (-24.2 dB)', asset: 'FO-KU-MTC-01', building: 'Maintenance (MTC)', severity: 'Medium', time: '1 jam lalu', status: 'Active' },
  { id: 'alt-04', title: 'Secondary AP Offline in Formulasi Area', asset: 'AP-PLTB-OUT02', building: 'Plant B Formulasi', severity: 'Low', time: '2 jam lalu', status: 'Resolved' },
  { id: 'alt-05', title: 'Fan Speed Warning on Industrial Switch', asset: 'SW-ACC-PLTA02', building: 'Plant A Synthesis', severity: 'Medium', time: '3 jam lalu', status: 'Resolved' }
];

const INITIAL_MAINTENANCE: RecentMaintenanceItem[] = [
  { id: 'maint-01', ticket: 'TKT-2026-088', asset: 'SW-UTL-SUB01', building: 'Utility (H)', priority: 'High', assignedTo: 'Budi Santoso', assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces', status: 'In Progress', dueDate: '18 Sept 2026' },
  { id: 'maint-02', ticket: 'TKT-2026-085', asset: 'FO-KU-MTC-01 Core Splicing', building: 'Maintenance (MTC)', priority: 'Medium', assignedTo: 'Ahmad Fauzi', assignedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces', status: 'Scheduled', dueDate: '19 Sept 2026' },
  { id: 'maint-03', ticket: 'TKT-2026-082', asset: 'Battery Replacement Rack 02', building: 'Kantor Utama (KU)', priority: 'High', assignedTo: 'Budi Santoso', assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces', status: 'Pending Parts', dueDate: '21 Sept 2026' },
  { id: 'maint-04', ticket: 'TKT-2026-079', asset: 'Cleaning Dust Filters Core Switch', building: 'Kantor Utama (KU)', priority: 'Low', assignedTo: 'Rian Pratama', assignedAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=faces', status: 'Completed', dueDate: '16 Sept 2026' },
  { id: 'maint-05', ticket: 'TKT-2026-074', asset: 'Firmware Upgrade Access Points', building: 'Warehouse (D & E)', priority: 'Medium', assignedTo: 'Ahmad Fauzi', assignedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces', status: 'Completed', dueDate: '15 Sept 2026' }
];

export class DashboardRepository implements IDashboardRepository {
  private buildingsState: BuildingNetworkStatusItem[] = [...INITIAL_BUILDINGS];
  private devicesByTypeState: DeviceTypeCount[] = [...INITIAL_DEVICES_BY_TYPE];
  private alertsState: RecentAlertItem[] = [...INITIAL_ALERTS];
  private maintenanceState: RecentMaintenanceItem[] = [...INITIAL_MAINTENANCE];

  async getDashboardData(site = 'PT. CBA Chemical Industry - Main Plant Cikande'): Promise<DashboardData> {
    // 1. Fetch 100% live aggregated data from MySQL backend
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Update cached state for smooth offline transition if needed
          if (Array.isArray(json.data.buildings)) this.buildingsState = json.data.buildings;
          if (Array.isArray(json.data.devicesByType)) this.devicesByTypeState = json.data.devicesByType;
          if (Array.isArray(json.data.recentAlerts)) this.alertsState = json.data.recentAlerts;
          if (Array.isArray(json.data.recentMaintenance)) this.maintenanceState = json.data.recentMaintenance;

          return json.data;
        }
      }
    } catch (err) {
      console.warn('[DashboardRepository] Live MySQL fetch failed, falling back to cached state:', err);
    }

    // 2. Resilient local fallback when backend is unreachable
    const totalDevices = this.devicesByTypeState.reduce((acc, curr) => acc + curr.count, 0);
    const onlineDevices = this.devicesByTypeState.reduce((acc, curr) => acc + curr.online, 0);
    const offlineDevices = totalDevices - onlineDevices;
    const warningDevices = 1;
    const unknownDevices = 0;

    const totalBuildings = this.buildingsState.length;
    const activeAlertsCount = this.alertsState.filter(a => a.status !== 'Resolved').length;
    const openMaintenanceCount = this.maintenanceState.filter(m => m.status !== 'Completed').length;
    const availability = totalDevices > 0 ? Number(((onlineDevices / totalDevices) * 100).toFixed(1)) : 100.0;

    const stats: StatCardData[] = [
      {
        id: 'total-buildings',
        label: 'Total Buildings',
        value: totalBuildings,
        trend: `${totalBuildings} Industrial Zones`,
        trendPositive: true,
        path: '/buildings',
        category: 'buildings'
      },
      {
        id: 'total-devices',
        label: 'Total Devices',
        value: totalDevices,
        trend: '+4 baru bulan ini',
        trendPositive: true,
        path: '/devices',
        category: 'devices'
      },
      {
        id: 'online-devices',
        label: 'Online Devices',
        value: onlineDevices,
        trend: `${availability}% Operasional`,
        trendPositive: true,
        path: '/devices?status=online',
        category: 'devices'
      },
      {
        id: 'offline-devices',
        label: 'Offline Devices',
        value: offlineDevices,
        trend: offlineDevices > 0 ? 'Perlu atensi teknisi' : 'Seluruh node normal',
        trendPositive: offlineDevices === 0,
        path: '/devices?status=offline',
        category: 'devices'
      },
      {
        id: 'cable-routes',
        label: 'Cable Routes',
        value: 8,
        trend: 'Fiber & Industrial UTP',
        trendPositive: true,
        path: '/cable-routes',
        category: 'cables'
      },
      {
        id: 'active-alerts',
        label: 'Active Alerts',
        value: activeAlertsCount,
        trend: '1 Kritis, 1 High',
        trendPositive: activeAlertsCount === 0,
        path: '/alerts',
        category: 'alerts'
      },
      {
        id: 'open-maintenance',
        label: 'Open Maintenance',
        value: openMaintenanceCount,
        trend: '1 Sedang berjalan',
        trendPositive: true,
        path: '/maintenance',
        category: 'maintenance'
      },
      {
        id: 'network-availability',
        label: 'Network Availability',
        value: `${availability}%`,
        trend: 'SLA Target: 99.5%',
        trendPositive: availability >= 99.0,
        path: '/monitoring',
        category: 'availability'
      }
    ];

    const health: NetworkHealthSummary = {
      online: onlineDevices,
      warning: warningDevices,
      offline: offlineDevices,
      unknown: unknownDevices,
      total: totalDevices,
      availabilityRate: availability
    };

    return {
      site,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
      stats,
      health,
      devicesByType: this.devicesByTypeState,
      buildings: this.buildingsState,
      recentAlerts: this.alertsState,
      recentMaintenance: this.maintenanceState
    };
  }

  async refresh(): Promise<DashboardData> {
    return this.getDashboardData();
  }

  async addDevice(device: any): Promise<{ success: boolean; message: string }> {
    try {
      const typeSlug = (device.type || 'access-switch').toLowerCase().replace(/\s+/g, '-');
      const payload = {
        code: device.name || `DEV-${Date.now().toString().slice(-4)}`,
        name: device.name || 'Perangkat Baru',
        ip: device.ip,
        type: typeSlug,
        buildingId: device.buildingId || 'bld-ku',
        buildingName: device.buildingName || 'Kawasan Pabrik (Outdoor)',
        room: device.room || 'Panel IT',
        status: device.status || 'online',
        brand: device.brand || 'Generic',
        model: device.model || 'Enterprise Unit',
        x: device.x,
        y: device.y,
        pos_x: device.x,
        pos_y: device.y
      };

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan perangkat');

      // Sync to factoryMapService in-memory cache so the map updates instantly
      try {
        await factoryMapService.addDevice({
          id: data.data?.id || `dev-${Date.now()}`,
          code: payload.code,
          name: payload.name,
          ip: payload.ip,
          mac: device.mac || '',
          type: payload.type as any,
          brand: payload.brand,
          model: payload.model,
          buildingId: payload.buildingId,
          buildingName: payload.buildingName,
          room: payload.room,
          status: payload.status as any,
          totalPorts: 24,
          activePorts: 0,
          uptime: '1 hari',
          x: device.x,
          y: device.y,
          pos_x: device.x,
          pos_y: device.y
        });
      } catch (e) {
        console.warn('[dashboardRepository] Notice syncing device to map cache:', e);
      }

      return { success: true, message: data.message || `Perangkat ${device.name} berhasil ditambahkan ke database.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menambahkan perangkat' };
    }
  }

  async addCableRoute(route: any): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        code: route.code,
        name: route.name || route.code,
        type: route.type || 'fiber',
        fromBuildingName: route.fromBuildingName,
        toBuildingName: route.toBuildingName,
        totalCores: Number(route.totalCores) || 12,
        lengthMeters: Number(route.lengthMeters) || 50,
        status: route.status || 'normal'
      };

      const res = await fetch('/api/cables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mendaftarkan rute kabel');
      return { success: true, message: data.message || `Rute kabel ${route.code} berhasil didaftarkan ke database.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menambahkan rute kabel' };
    }
  }

  async createMaintenanceTicket(ticket: any): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        title: `Pemeliharaan ${ticket.asset || 'Jaringan'}`,
        description: `Pekerjaan servis dan kalibrasi perangkat ${ticket.asset} di ${ticket.building || 'pabrik'}.`,
        priority: (ticket.priority || 'medium').toLowerCase(),
        assetName: ticket.asset || 'Network Asset',
        assignedTo: ticket.assignedTo || 'Budi Santoso',
        dueDate: ticket.dueDate || 'Segera'
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat tiket pemeliharaan');
      return { success: true, message: data.message || `Tiket perbaikan berhasil didaftarkan ke database.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal membuat tiket pemeliharaan' };
    }
  }
}

// Export singleton instance
export const dashboardRepository = new DashboardRepository();
