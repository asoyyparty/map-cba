import React from 'react';
import { Building, CableRoute, Device, Alert } from '../../types';
import { KPIStatsRow } from './KPIStatsRow';
import { MapPanel } from './MapPanel';
import { StatusJaringanWidget } from './StatusJaringanWidget';
import { NotificationWidget } from './NotificationWidget';
import { ActivityWidget } from './ActivityWidget';
import { BandwidthChart } from './BandwidthChart';
import { StatusDonutChart } from './StatusDonutChart';
import { KabelDonutChart } from './KabelDonutChart';

interface DashboardViewProps {
  buildings: Building[];
  cableRoutes: CableRoute[];
  devices: Device[];
  alerts: Alert[];
  onSelectBuilding: (building: Building) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  buildings,
  cableRoutes,
  devices,
  alerts,
  onSelectBuilding
}) => {
  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-y-auto flex flex-col gap-5 text-slate-900 font-sans">
      {/* Dashboard Subtitle Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans">Dashboard Infrastruktur</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan status perangkat, topologi, utilisasi kabel, dan monitoring real-time di PT. CBA Chemical Industry.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Status Sistem: <strong>Normal Active</strong></span>
        </div>
      </div>

      {/* Row 1: KPI Stats Cards (5 Columns) */}
      <KPIStatsRow
        totalGedung={buildings.length}
        totalDevices={devices.length}
        totalCables={cableRoutes.length}
        networkAvailability={98}
      />

      {/* Row 2: Main Layout Map + Right Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2/3 width): Interactive Map Panel */}
        <div className="lg:col-span-2">
          <MapPanel
            buildings={buildings}
            cableRoutes={cableRoutes}
            onSelectBuilding={onSelectBuilding}
          />
        </div>

        {/* Right Column (1/3 width): Stacked Status & Notifications */}
        <div className="flex flex-col gap-4">
          <StatusJaringanWidget />
          <NotificationWidget alerts={alerts} />
          <ActivityWidget />
        </div>
      </div>

      {/* Row 3: Bottom Analytics Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <BandwidthChart />
        <StatusDonutChart />
        <KabelDonutChart />
      </div>
    </div>
  );
};
