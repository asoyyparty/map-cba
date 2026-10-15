import { Rack } from '../types';

export interface CreateRackPayload {
  name: string;
  code: string;
  buildingId: string;
  buildingName?: string;
  room?: string;
  uCapacity?: number;
  maxPowerWatts?: number;
  description?: string;
  authorName?: string;
  authorRole?: string;
}

export interface MountDevicePayload {
  deviceId: string;
  uPosition: number;
  uHeight?: number;
  authorName?: string;
  authorRole?: string;
}

const API_BASE = '/api/racks';

class RackService {
  async getRacks(filters?: { building_id?: string; search?: string }): Promise<Rack[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.building_id && filters.building_id !== 'all') {
        params.append('building_id', filters.building_id);
      }
      if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error('[RackService] getRacks error:', err);
    }
    return [];
  }

  async getRackById(id: string): Promise<Rack | null> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.error('[RackService] getRackById error:', err);
    }
    return null;
  }

  async createRack(payload: CreateRackPayload): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { success: res.ok, message: data.message, data: data.data };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi gagal' };
    }
  }

  async updateRack(id: string, payload: Partial<CreateRackPayload & { status?: string }>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi gagal' };
    }
  }

  async deleteRack(id: string, force = false): Promise<{ success: boolean; message: string; requiresConfirmation?: boolean; mountedCount?: number }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}?force=${force}`, { method: 'DELETE' });
      const data = await res.json();
      return {
        success: res.ok,
        message: data.message,
        requiresConfirmation: data.requiresConfirmation,
        mountedCount: data.mountedCount
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi gagal' };
    }
  }

  async mountDevice(rackId: string, payload: MountDevicePayload): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(rackId)}/mount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal memasang perangkat ke rack' };
    }
  }

  async unmountDevice(rackId: string, deviceId: string, authorName = 'Admin IT', authorRole = 'ADMIN'): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(rackId)}/unmount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, authorName, authorRole })
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal melepas perangkat' };
    }
  }
}

export const rackService = new RackService();
