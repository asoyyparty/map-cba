export interface ExecutiveSummaryData {
  company: string;
  division: string;
  reportDate: string;
  documentNumber: string;
  sla: {
    availabilityPct: number;
    targetSlaPct: number;
    mttrMinutes: number;
    status: 'COMPLIANT' | 'ATTENTION';
  };
  readinessScore: number;
  devices: {
    total: number;
    online: number;
    warning: number;
    offline: number;
    totalPorts: number;
    activePorts: number;
    portUtilizationPct: number;
  };
  cables: {
    totalRoutes: number;
    totalMeters: number;
    totalCores: number;
    usedCores: number;
    coreUtilizationPct: number;
    avgAttenuationDb: number;
    healthyRoutes: number;
    degradedRoutes: number;
  };
  racks: {
    totalRacks: number;
    totalU: number;
    usedU: number;
    spaceUtilizationPct: number;
    totalPowerCapWatts: number;
    currentPowerDrawWatts: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
  buildings: Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    status: string;
    head_it: string;
    lokasi: string;
    main_switch: string;
    backbone_cable: string;
    backbone_speed: string;
    device_count: number;
    rack_count: number;
    alert_count: number;
  }>;
}

export type ExportDataset = 'devices' | 'cables' | 'cores' | 'racks' | 'maintenance' | 'audit';

export const reportService = {
  async getExecutiveSummary(filters?: { building_id?: string; range?: string }): Promise<ExecutiveSummaryData | null> {
    try {
      const params = new URLSearchParams();
      if (filters?.building_id && filters.building_id !== 'all') {
        params.append('building_id', filters.building_id);
      }
      if (filters?.range) {
        params.append('range', filters.range);
      }

      const res = await fetch(`/api/reports/executive-summary?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.error('[reportService] Failed fetching executive summary:', err);
    }
    return null;
  },

  async downloadExport(dataset: ExportDataset, format: 'csv' | 'json' = 'csv', buildingId?: string) {
    try {
      if (format === 'csv') {
        const params = new URLSearchParams();
        if (buildingId && buildingId !== 'all') {
          params.append('building_id', buildingId);
        }
        const url = `/api/reports/export/${dataset}-csv?${params.toString()}`;
        
        // Trigger browser native download via hidden link
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `CBA_${dataset}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return { success: true };
      } else {
        // JSON Export via API fetch
        let endpoint = `/api/${dataset === 'maintenance' ? 'tickets' : dataset === 'audit' ? 'audit-logs' : dataset}`;
        if (dataset === 'cores') endpoint = '/api/cables';

        const res = await fetch(endpoint);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CBA_${dataset}_Export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      }
    } catch (err: any) {
      console.error('[reportService] Download error:', err);
      return { success: false, error: err.message };
    }
  }
};
