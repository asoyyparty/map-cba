import { Alert, AlertSeverity, AlertStatus } from '../types';

export interface AlertFilters {
  search?: string;
  severity?: string;
  status?: string;
  category?: string;
  buildingId?: string;
}

export interface AlertSummaryMetrics {
  total: number;
  criticalActive: number;
  openCount: number;
  inInvestigation: number;
  resolvedCount: number;
}

export interface CreateAlertPayload {
  id?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category?: string;
  buildingId?: string;
  buildingName?: string;
  deviceId?: string;
}

export interface ConvertTicketPayload {
  priority?: string;
  assignedTo?: string;
  scheduledDate?: string;
  dueDate?: string;
  additionalNotes?: string;
}

const FALLBACK_ALERTS: Alert[] = [
  {
    id: 'alt-1',
    title: 'Access Point AP-D-02 tidak merespons',
    message: 'Access Point di lini formulasi Gedung D mengalami packet loss 12%.',
    severity: 'medium',
    status: 'open',
    category: 'device_offline',
    buildingId: 'bld-d',
    buildingName: 'Gedung D',
    deviceId: 'dev-ap-d-02',
    timeAgo: '35 menit yang lalu',
    timestamp: new Date().toISOString()
  },
  {
    id: 'alt-2',
    title: 'Kabel FO-003 redaman kritis meningkat',
    message: 'Jalur kabel optik FO-003 (Kantor Utama → Gedung D) terdeteksi redaman 3.85 dB melebihi batas toleransi OTDR.',
    severity: 'critical',
    status: 'open',
    category: 'fiber_optical',
    buildingId: 'bld-d',
    buildingName: 'Gedung D',
    timeAgo: '1 jam yang lalu',
    timestamp: new Date().toISOString()
  },
  {
    id: 'alt-3',
    title: 'Latensi Backbone Switch Ku-01 Melonjak',
    message: 'Core Switch SW-CORE-KU-01 mendeteksi lonjakan latency RTT > 85ms pada sesi sinkronisasi SCADA pabrik.',
    severity: 'high',
    status: 'acknowledged',
    category: 'latency_spike',
    buildingId: 'bld-ku',
    buildingName: 'Kantor Utama',
    deviceId: 'dev-sw-ku-01',
    timeAgo: '2 jam yang lalu',
    acknowledgedBy: 'Budi Santoso',
    timestamp: new Date().toISOString()
  },
  {
    id: 'alt-4',
    title: 'Beban Daya Server Rack KU-01 Mendekati 85%',
    message: 'PDU Rack KU-01 terukur konsumsi 2980 Watt dari kapasitas aman 3500 Watt.',
    severity: 'medium',
    status: 'in_progress',
    category: 'power_rack',
    buildingId: 'bld-ku',
    buildingName: 'Kantor Utama',
    timeAgo: '4 jam yang lalu',
    acknowledgedBy: 'Admin IT CBA',
    ticketId: 'TICK-20260917-1002',
    timestamp: new Date().toISOString()
  }
];

export const alertService = {
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search && filters.search.trim()) params.append('search', filters.search.trim());
      if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters?.buildingId && filters.buildingId !== 'all') params.append('buildingId', filters.buildingId);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return FALLBACK_ALERTS;
    } catch (err) {
      console.warn('[alertService] Failed fetching alerts from API, using fallback:', err);
      let list = [...FALLBACK_ALERTS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          (a.buildingName && a.buildingName.toLowerCase().includes(q))
        );
      }
      if (filters?.severity && filters.severity !== 'all') {
        list = list.filter(a => a.severity === filters.severity);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter(a => a.status === filters.status);
      }
      if (filters?.category && filters.category !== 'all') {
        list = list.filter(a => a.category === filters.category);
      }
      return list;
    }
  },

  async getAlertSummary(): Promise<AlertSummaryMetrics> {
    try {
      const res = await fetch('/api/alerts/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return {
        total: FALLBACK_ALERTS.length,
        criticalActive: FALLBACK_ALERTS.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
        openCount: FALLBACK_ALERTS.filter(a => a.status === 'open').length,
        inInvestigation: FALLBACK_ALERTS.filter(a => a.status === 'acknowledged' || a.status === 'in_progress').length,
        resolvedCount: FALLBACK_ALERTS.filter(a => a.status === 'resolved').length
      };
    } catch (err) {
      console.warn('[alertService] getAlertSummary fallback:', err);
      return {
        total: FALLBACK_ALERTS.length,
        criticalActive: 1,
        openCount: 2,
        inInvestigation: 2,
        resolvedCount: 0
      };
    }
  },

  async getAlertById(id: string): Promise<Alert | null> {
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn('[alertService] getAlertById fallback:', err);
      return FALLBACK_ALERTS.find(a => a.id === id) || null;
    }
  },

  async createAlert(
    payload: CreateAlertPayload,
    currentUserName = 'Admin IT',
    currentUserRole = 'ADMIN'
  ): Promise<Alert> {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal memicu alarm baru.');
    }
    return json.data;
  },

  async acknowledgeAlert(
    id: string,
    technicianName = 'Budi Santoso',
    currentUserRole = 'IT_ENGINEER'
  ): Promise<void> {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}/acknowledge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': technicianName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify({ technicianName })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menangani alarm.');
    }
  },

  async resolveAlert(
    id: string,
    resolutionNotes: string,
    technicianName = 'Budi Santoso',
    currentUserRole = 'IT_ENGINEER'
  ): Promise<void> {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': technicianName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify({ resolutionNotes, technicianName })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menyelesaikan alarm.');
    }
  },

  async convertToTicket(
    id: string,
    ticketPayload: ConvertTicketPayload,
    currentUserName = 'Admin IT',
    currentUserRole = 'ADMIN'
  ): Promise<{ ticketNo: string }> {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}/convert-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify(ticketPayload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal mengeskalasikan alarm ke tiket.');
    }
    return json.ticket;
  },

  async deleteAlert(
    id: string,
    currentUserName = 'Admin IT',
    currentUserRole = 'ADMIN'
  ): Promise<void> {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menghapus alarm.');
    }
  }
};
