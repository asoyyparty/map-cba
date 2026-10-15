// Factory Map Service Layer
// Loads calibrated industrial layout data with fallback to MySQL backend API

import { Building, CableRoute, Device, Alert, Rack } from '../types';
import { 
  INITIAL_BUILDINGS, 
  INITIAL_CABLE_ROUTES, 
  INITIAL_ALERTS, 
  INITIAL_RACKS 
} from '../mock/cbaData';

export interface FactoryMapData {
  buildings: Building[];
  cableRoutes: CableRoute[];
  devices: Device[];
  alerts: Alert[];
  racks: Rack[];
}

const STORAGE_KEY = 'cba_factory_map_custom_data_v2';

export class FactoryMapService {
  private cache: FactoryMapData = {
    buildings: [...INITIAL_BUILDINGS],
    cableRoutes: [...INITIAL_CABLE_ROUTES],
    devices: [],
    alerts: [...INITIAL_ALERTS],
    racks: [...INITIAL_RACKS]
  };

  private loadFromStorage(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.buildings) && Array.isArray(parsed.cableRoutes)) {
        this.cache.buildings = parsed.buildings;
        this.cache.cableRoutes = parsed.cableRoutes;
        if (Array.isArray(parsed.devices)) this.cache.devices = parsed.devices;
        return true;
      }
    } catch (e) {
      console.warn('[FactoryMapService] Failed to load local custom map data:', e);
    }
    return false;
  }

  saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        buildings: this.cache.buildings,
        cableRoutes: this.cache.cableRoutes,
        devices: this.cache.devices
      }));
    } catch (e) {
      console.warn('[FactoryMapService] Failed to save local custom map data:', e);
    }
  }

  async loadMapData(): Promise<FactoryMapData> {
    // 1. Initial check on local cache
    const hasLocal = this.loadFromStorage();

    try {
      // 2. Fetch directly from MySQL backend API (Single Source of Truth)
      const [bldRes, cableRes, devRes, alertRes] = await Promise.allSettled([
        fetch('/api/buildings'),
        fetch('/api/cables'),
        fetch('/api/devices'),
        fetch('/api/alerts')
      ]);

      let backendConnected = false;

      if (bldRes.status === 'fulfilled' && bldRes.value.ok) {
        const json = await bldRes.value.json();
        if (Array.isArray(json.data)) {
          backendConnected = true;
          this.cache.buildings = json.data.map((dbBld: any) => {
            const staticBld = INITIAL_BUILDINGS.find(b => b.code === dbBld.code || b.id === dbBld.id);
            return {
              ...staticBld,
              ...dbBld,
              polygon: dbBld.polygon && dbBld.polygon.length > 0 ? dbBld.polygon : (staticBld?.polygon || []),
              center: dbBld.center && (dbBld.center.x !== 0 || dbBld.center.y !== 0) ? dbBld.center : (staticBld?.center || { x: 200, y: 200 }),
              status: dbBld.status || staticBld?.status || 'healthy'
            };
          });
        }
      }

      if (cableRes.status === 'fulfilled' && cableRes.value.ok) {
        const json = await cableRes.value.json();
        if (Array.isArray(json.data)) {
          backendConnected = true;
          this.cache.cableRoutes = json.data.map((dbCable: any) => {
            const staticCable = INITIAL_CABLE_ROUTES.find(c => c.code === dbCable.code || c.id === dbCable.id);
            return {
              ...staticCable,
              ...dbCable,
              path: dbCable.path && dbCable.path.length > 0 ? dbCable.path : (staticCable?.path || []),
              color: dbCable.color || staticCable?.color,
              lineWidth: dbCable.lineWidth || staticCable?.lineWidth
            };
          });
        }
      }

      if (devRes.status === 'fulfilled' && devRes.value.ok) {
        const json = await devRes.value.json();
        if (Array.isArray(json.data)) {
          this.cache.devices = json.data;
        }
      }

      if (alertRes.status === 'fulfilled' && alertRes.value.ok) {
        const json = await alertRes.value.json();
        if (Array.isArray(json.data)) {
          this.cache.alerts = json.data;
        }
      }

      // If backend was reached and responded with database state, refresh local cache
      if (backendConnected) {
        this.saveToStorage();
        return this.cache;
      }
    } catch (err) {
      console.warn('[FactoryMapService] Notice syncing with backend:', err);
    }

    // 3. Offline fallback only if backend completely unreachable and no local storage
    if (!hasLocal && this.cache.buildings.length === 0) {
      this.cache.buildings = [...INITIAL_BUILDINGS];
      this.cache.cableRoutes = [...INITIAL_CABLE_ROUTES];
      this.cache.devices = [];
    }

    return this.cache;
  }

  // --- CABLE ROUTES CRUD ---
  async addCableRoute(cable: CableRoute): Promise<void> {
    this.cache.cableRoutes.push(cable);
    this.saveToStorage();

    // Background sync to backend API if available
    try {
      const res = await fetch('/api/cables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cable)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const idx = this.cache.cableRoutes.findIndex(c => c.id === cable.id);
          if (idx >= 0) {
            this.cache.cableRoutes[idx] = { ...this.cache.cableRoutes[idx], ...json.data };
            this.saveToStorage();
          }
        }
      }
    } catch (e) {
      console.warn('[FactoryMapService] API add cable notice:', e);
    }
  }

  async updateCableRoute(cable: CableRoute): Promise<void> {
    const idx = this.cache.cableRoutes.findIndex(c => c.id === cable.id);
    if (idx >= 0) {
      this.cache.cableRoutes[idx] = { ...cable };
      this.saveToStorage();

      try {
        const res = await fetch(`/api/cables/${encodeURIComponent(cable.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cable)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            this.cache.cableRoutes[idx] = { ...this.cache.cableRoutes[idx], ...json.data };
            this.saveToStorage();
          }
        }
      } catch (e) {
        console.warn('[FactoryMapService] API update cable notice:', e);
      }
    }
  }

  async deleteCableRoute(id: string): Promise<void> {
    this.cache.cableRoutes = this.cache.cableRoutes.filter(c => c.id !== id);
    this.saveToStorage();

    try {
      await fetch(`/api/cables/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('[FactoryMapService] API delete cable notice:', e);
    }
  }

  // --- BUILDINGS CRUD ---
  async addBuilding(bld: Building): Promise<void> {
    this.cache.buildings.push(bld);
    this.saveToStorage();

    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bld)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const idx = this.cache.buildings.findIndex(b => b.id === bld.id);
          if (idx >= 0) {
            this.cache.buildings[idx] = { ...this.cache.buildings[idx], ...json.data };
            this.saveToStorage();
          }
        }
      }
    } catch (e) {
      console.warn('[FactoryMapService] API add building notice:', e);
    }
  }

  async updateBuilding(bld: Building): Promise<void> {
    const idx = this.cache.buildings.findIndex(b => b.id === bld.id);
    if (idx >= 0) {
      this.cache.buildings[idx] = { ...bld };
      this.saveToStorage();

      try {
        const res = await fetch(`/api/buildings/${encodeURIComponent(bld.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bld)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            this.cache.buildings[idx] = { ...this.cache.buildings[idx], ...json.data };
            this.saveToStorage();
          }
        }
      } catch (e) {
        console.warn('[FactoryMapService] API update building notice:', e);
      }
    }
  }

  async deleteBuilding(id: string): Promise<{ success: boolean; message: string }> {
    this.cache.buildings = this.cache.buildings.filter(b => b.id !== id);
    // Cascade remove devices inside this building
    this.cache.devices = this.cache.devices.filter(d => d.buildingId !== id);
    // Cascade remove cables attached to this building
    this.cache.cableRoutes = this.cache.cableRoutes.filter(
      c => c.fromBuildingId !== id && c.toBuildingId !== id
    );
    // Cascade remove racks in this building
    if (this.cache.racks) {
      this.cache.racks = this.cache.racks.filter(r => r.buildingId !== id);
    }
    // Cascade remove alerts in this building
    if (this.cache.alerts) {
      this.cache.alerts = this.cache.alerts.filter(a => a.buildingId !== id);
    }
    this.saveToStorage();

    try {
      const res = await fetch(`/api/buildings/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || 'Gedung dan data terkait berhasil dihapus'
      };
    } catch (e: any) {
      console.warn('[FactoryMapService] API delete call notice:', e);
      return { success: true, message: 'Gedung dan data terkait berhasil dihapus dari denah' };
    }
  }

  // --- DEVICES CRUD ---
  async addDevice(dev: Device): Promise<void> {
    this.cache.devices.push(dev);
    // Update building device count
    const bld = this.cache.buildings.find(b => b.id === dev.buildingId);
    if (bld) {
      bld.totalDevices = (bld.totalDevices || 0) + 1;
      if (dev.type.includes('switch') && !bld.mainSwitch) {
        bld.mainSwitch = dev.name;
      }
    }
    this.saveToStorage();

    try {
      fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dev)
      }).catch(() => {});
    } catch (e) {}
  }

  // Wipe all buildings and cables from database and cache (Clean canvas)
  async clearAllMapData(): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.cache.buildings = [];
    this.cache.cableRoutes = [];
    this.cache.devices = [];
    this.cache.alerts = [];

    try {
      const res = await fetch('/api/settings/clear-factory-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      this.saveToStorage();
      return {
        success: json.success ?? res.ok,
        message: json.message || 'Denah pabrik berhasil dikosongkan.'
      };
    } catch (e: any) {
      this.saveToStorage();
      return { success: true, message: 'Denah pabrik telah dikosongkan secara lokal.' };
    }
  }

  // Restore Section 22 CBA standard factory layout
  async resetToFactoryDefaults(): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }

    try {
      const res = await fetch('/api/settings/reset-factory-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      await this.loadMapData();
      return {
        success: json.success ?? res.ok,
        message: json.message || 'Denah default PT. CBA Chemical Industry berhasil dimuat ulang.'
      };
    } catch (e: any) {
      this.cache.buildings = [...INITIAL_BUILDINGS];
      this.cache.cableRoutes = [...INITIAL_CABLE_ROUTES];
      this.cache.devices = [];
      this.saveToStorage();
      return { success: true, message: 'Denah default dimuat dari data cadangan lokal.' };
    }
  }

  // Legacy reset fallback
  resetToDefaults(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.cache.buildings = [...INITIAL_BUILDINGS];
    this.cache.cableRoutes = [...INITIAL_CABLE_ROUTES];
    this.cache.devices = [];
  }

  getCalibratedDimensions() {
    return {
      width: 445,
      height: 561,
      aspectRatio: 445 / 561
    };
  }
}

export const factoryMapService = new FactoryMapService();
