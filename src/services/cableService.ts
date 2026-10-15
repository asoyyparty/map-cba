import { CableRoute, FiberCoreAllocation } from '../types';

export interface CableFilters {
  search?: string;
  building_id?: string;
  type?: string;
  status?: string;
}

export interface AssignCorePayload {
  coreNumber: number;
  status: 'connected' | 'reserved' | 'damaged' | 'available';
  service?: string;
  sourceDevice?: string;
  sourcePort?: string;
  targetDevice?: string;
  targetPort?: string;
  attenuationDb?: number;
  notes?: string;
  user?: string;
}

const API_BASE = '/api/cables';

class CableService {
  async getCables(filters?: CableFilters): Promise<CableRoute[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters?.building_id && filters.building_id !== 'all') {
        params.append('building_id', filters.building_id);
      }
      if (filters?.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error('[CableService] getCables error:', err);
    }
    return [];
  }

  async getCableById(id: string): Promise<CableRoute | null> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.error('[CableService] getCableById error:', err);
    }
    return null;
  }

  async createCable(payload: Partial<CableRoute>): Promise<{ success: boolean; message: string; data?: CableRoute }> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message || (res.ok ? 'Rute kabel berhasil dibuat' : 'Gagal membuat rute kabel'),
        data: data.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat membuat rute kabel' };
    }
  }

  async updateCable(id: string, payload: Partial<CableRoute>): Promise<{ success: boolean; message: string; data?: CableRoute }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message || (res.ok ? 'Rute kabel berhasil diperbarui' : 'Gagal memperbarui rute kabel'),
        data: data.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat update rute kabel' };
    }
  }

  async deleteCable(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message || (res.ok ? 'Rute kabel berhasil dihapus' : 'Gagal menghapus rute kabel')
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat menghapus rute kabel' };
    }
  }

  async assignCore(id: string, payload: AssignCorePayload): Promise<{ success: boolean; message: string; data?: CableRoute }> {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/cores/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message || (res.ok ? 'Alokasi core berhasil disimpan' : 'Gagal update core'),
        data: data.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error saat alokasi core' };
    }
  }
}

export const cableService = new CableService();
