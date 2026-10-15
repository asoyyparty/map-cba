export interface MaintenanceTicket {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'pending' | 'completed' | 'cancelled';
  asset_type?: 'Building' | 'Device' | 'Cable Route' | 'Rack' | 'Other';
  asset_id?: string;
  asset_name?: string;
  building_id?: string;
  device_id?: string;
  cable_route_id?: string;
  assigned_to?: string;
  scheduled_date?: string;
  due_date?: string;
  resolution?: string;
  root_cause?: string;
  action_taken?: string;
  completed_date?: string;
  technician_notes?: string;
  timeline_json?: string;
  created_at: string;
  updated_at?: string;
}

export interface TicketTimelineItem {
  id: string;
  action: string;
  note: string;
  by: string;
  timestamp: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assetType?: string;
  assetId?: string;
  assetName?: string;
  buildingId?: string;
  deviceId?: string;
  cableRouteId?: string;
  assignedTo?: string;
  scheduledDate?: string;
  dueDate?: string;
  authorName?: string;
  authorRole?: string;
}

export interface ResolveTicketPayload {
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled';
  resolution?: string;
  rootCause?: string;
  actionTaken?: string;
  technicianNotes?: string;
  completedDate?: string;
  authorName?: string;
  authorRole?: string;
}

const API_BASE = '/api/tickets';

class MaintenanceService {
  async getTickets(filters?: {
    status?: string;
    priority?: string;
    buildingId?: string;
    assetType?: string;
    search?: string;
  }): Promise<MaintenanceTicket[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters?.buildingId && filters.buildingId !== 'all') params.append('building_id', filters.buildingId);
      if (filters?.assetType && filters.assetType !== 'all') params.append('asset_type', filters.assetType);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error('[MaintenanceService] Error fetching tickets:', err);
    }
    return [];
  }

  async getTicketById(id: string): Promise<MaintenanceTicket | null> {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.error('[MaintenanceService] Error fetching ticket:', err);
    }
    return null;
  }

  async createTicket(payload: CreateTicketPayload): Promise<{ success: boolean; message: string; ticketNo?: string }> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message, ticketNo: data.data?.ticketNo };
      }
      return { success: false, message: data.message || 'Gagal membuat tiket' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi gagal' };
    }
  }

  async updateTicket(id: string, payload: Partial<ResolveTicketPayload & { assignedTo?: string; priority?: string }>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal memperbarui tiket' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi gagal' };
    }
  }

  async deleteTicket(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal menghapus tiket' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi gagal' };
    }
  }
}

export const maintenanceService = new MaintenanceService();
