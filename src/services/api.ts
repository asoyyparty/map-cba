// Centralized API client for CBA Network Map (Tahap V2 & V3)

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export const api = {
  // Buildings API
  async getBuildings() {
    const res = await fetch('/api/buildings');
    if (!res.ok) throw new Error('Failed to fetch buildings');
    return res.json();
  },

  async getBuildingById(id: string) {
    const res = await fetch(`/api/buildings/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch building');
    return res.json();
  },

  async updateBuilding(id: string, data: any) {
    const res = await fetch(`/api/buildings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update building');
    return res.json();
  },

  // Devices API
  async getDevices(params?: { building_id?: string; status?: string; type?: string }) {
    const query = new URLSearchParams();
    if (params?.building_id) query.append('building_id', params.building_id);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);

    const res = await fetch(`/api/devices?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async getDeviceById(id: string) {
    const res = await fetch(`/api/devices/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch device');
    return res.json();
  },

  async updateDevice(id: string, data: any) {
    const res = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update device');
    return res.json();
  },

  // Cable Routes API
  async getCables() {
    const res = await fetch('/api/cables');
    if (!res.ok) throw new Error('Failed to fetch cables');
    return res.json();
  },

  async createCable(data: any) {
    const res = await fetch('/api/cables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create cable');
    return res.json();
  },

  async updateCable(id: string, data: any) {
    const res = await fetch(`/api/cables/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update cable');
    return res.json();
  },

  async deleteCable(id: string) {
    const res = await fetch(`/api/cables/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete cable');
    return res.json();
  },


  // Alerts API
  async getAlerts(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`/api/alerts${query}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async resolveAlert(id: string) {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  // Maintenance Tickets API
  async getTickets() {
    const res = await fetch('/api/tickets');
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async createTicket(ticket: {
    title: string;
    description: string;
    priority?: string;
    buildingId?: string;
    deviceId?: string;
    assignedTo?: string;
  }) {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },

  async updateTicket(id: string, data: { status?: string; assignedTo?: string }) {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update ticket');
    return res.json();
  },

  // Monitoring API
  async getMonitoringStatus() {
    const res = await fetch('/api/monitoring/status');
    if (!res.ok) throw new Error('Failed to fetch monitoring status');
    return res.json();
  },

  async pingDevice(id: string) {
    const res = await fetch(`/api/monitoring/ping/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to ping device');
    return res.json();
  },

  async simulateImpact(deviceId: string, status: 'online' | 'warning' | 'offline') {
    const res = await fetch('/api/monitoring/simulate-impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, status })
    });
    if (!res.ok) throw new Error('Failed to trigger impact simulation');
    return res.json();
  },

  // SSE Live Monitoring Stream
  subscribeToMonitoringStream(
    onTelemetry?: (data: any) => void,
    onImpact?: (data: any) => void
  ): () => void {
    if (typeof window === 'undefined' || !window.EventSource) {
      return () => {};
    }

    const eventSource = new EventSource('/api/monitoring/stream');

    eventSource.addEventListener('telemetry', (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onTelemetry?.(parsed);
      } catch (err) {
        console.error('[SSE] Telemetry parse error:', err);
      }
    });

    eventSource.addEventListener('impact', (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onImpact?.(parsed);
      } catch (err) {
        console.error('[SSE] Impact parse error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  },

  // Reports API
  async getReportsSummary() {
    const res = await fetch('/api/reports/summary');
    if (!res.ok) throw new Error('Failed to fetch reports summary');
    return res.json();
  },

  downloadInventoryCsvUrl() {
    return '/api/reports/inventory-csv';
  },

  // Health API
  async checkHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  }
};
