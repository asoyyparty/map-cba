// Device Service Layer (Repository Pattern)
// Handles complete CRUD operations, searching, filtering, and connection dependency checks
import { Device } from '../types';

export interface DeviceFilterParams {
  search?: string;
  building_id?: string;
  type?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}

export interface DeviceListResponse {
  data: Device[];
  total: number;
}

export interface DeviceConnectionCheck {
  hasConnections: boolean;
  cablesCount: number;
  activePortsCount: number;
  activeAlertsCount: number;
  details: string[];
}

export const deviceService = {
  async getDevices(filters?: DeviceFilterParams): Promise<DeviceListResponse> {
    try {
      const query = new URLSearchParams();
      if (filters?.search) query.append('search', filters.search);
      if (filters?.building_id) query.append('building_id', filters.building_id);
      if (filters?.type) query.append('type', filters.type);
      if (filters?.status) query.append('status', filters.status);
      if (filters?.sort_by) query.append('sort_by', filters.sort_by);
      if (filters?.sort_order) query.append('sort_order', filters.sort_order);
      if (filters?.page) query.append('page', filters.page.toString());
      if (filters?.limit) query.append('limit', filters.limit.toString());

      const res = await fetch(`/api/devices?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return {
          data: json.data,
          total: json.total || json.data.length
        };
      }
    } catch (err) {
      console.warn('[deviceService] Failed fetching from API, fallback to local data:', err);
    }

    // Fallback if network/API fails
    const list: Device[] = [];
    return {
      data: list,
      total: 0
    };
  },

  async getDeviceById(id: string): Promise<Device | null> {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('[deviceService] Fallback getDeviceById:', err);
    }

    return null;
  },

  async createDevice(data: Partial<Device>): Promise<Device> {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menambahkan perangkat');
    }
    return json.data;
  },

  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal memperbarui perangkat');
    }
    return json.data;
  },

  async deleteDevice(id: string): Promise<boolean> {
    const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menghapus perangkat');
    }
    return true;
  },

  async checkDeviceConnections(id: string): Promise<DeviceConnectionCheck> {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(id)}/connections`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return {
            hasConnections: json.hasConnections,
            cablesCount: json.cablesCount || 0,
            activePortsCount: json.activePortsCount || 0,
            activeAlertsCount: json.activeAlertsCount || 0,
            details: json.details || []
          };
        }
      }
    } catch (err) {
      console.warn('[deviceService] Failed checking connections via API:', err);
    }

    // Default safe fallback
    return {
      hasConnections: false,
      cablesCount: 0,
      activePortsCount: 0,
      activeAlertsCount: 0,
      details: []
    };
  }
};
