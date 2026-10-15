// Building Service Layer (Repository Pattern)
// Connects to Express MySQL backend with fallback to cbaData
import { Building, Rack, Device, CableRoute, Alert } from '../types';
import { INITIAL_BUILDINGS } from '../mock/cbaData';
import { factoryMapService } from './factoryMapService';

export interface BuildingFilters {
  search?: string;
  category?: string;
  status?: string;
}

export interface BuildingInfrastructureDetail extends Building {
  devices?: Device[];
  racks?: Rack[];
  cables?: CableRoute[];
  alerts?: Alert[];
}

export const buildingService = {
  async getBuildings(filters?: BuildingFilters): Promise<Building[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters?.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const res = await fetch(`/api/buildings?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return INITIAL_BUILDINGS;
    } catch (err) {
      console.warn('[buildingService] Failed fetching from API, fallback to local data:', err);
      let list = [...INITIAL_BUILDINGS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
      }
      if (filters?.category && filters.category !== 'all') {
        list = list.filter(b => b.category === filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter(b => b.status === filters.status);
      }
      return list;
    }
  },

  async getBuildingById(id: string): Promise<BuildingInfrastructureDetail | null> {
    try {
      const res = await fetch(`/api/buildings/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return INITIAL_BUILDINGS.find((b: Building) => b.id === id) || null;
    } catch (err) {
      console.warn('[buildingService] Fallback getBuildingById:', err);
      return INITIAL_BUILDINGS.find((b: Building) => b.id === id) || null;
    }
  },

  async createBuilding(payload: Partial<Building>): Promise<{ success: boolean; message: string; data?: Building }> {
    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? 'Gedung berhasil ditambahkan' : 'Gagal menambahkan gedung'),
        data: json.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat menambahkan gedung' };
    }
  },

  async updateBuilding(id: string, payload: Partial<Building>): Promise<{ success: boolean; message: string; data?: Building }> {
    try {
      const res = await fetch(`/api/buildings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? 'Data gedung berhasil diperbarui' : 'Gagal update gedung'),
        data: json.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat update gedung' };
    }
  },

  async deleteBuilding(id: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Synchronize local factory map storage
      try {
        await factoryMapService.deleteBuilding(id);
      } catch {}

      const res = await fetch(`/api/buildings/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? 'Gedung berhasil dihapus' : 'Gagal menghapus gedung'),
        data: json.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat menghapus gedung' };
    }
  },

  async getRacksByBuilding(buildingId: string): Promise<Rack[]> {
    try {
      const res = await fetch(`/api/racks?building_id=${encodeURIComponent(buildingId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {}

    const bldCode = buildingId.replace('bld-', '').toUpperCase();
    return [
      {
        id: `rack-${buildingId}-01`,
        name: `Rack ${bldCode}-01 (Distribution 24U)`,
        code: `RCK-${bldCode}-01`,
        buildingId,
        room: 'Panel IT',
        uCapacity: 24,
        usedU: 8,
        deviceIds: []
      }
    ];
  }
};
