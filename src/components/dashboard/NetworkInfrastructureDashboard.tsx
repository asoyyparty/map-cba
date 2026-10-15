import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  X,
  ServerOff
} from 'lucide-react';
import { 
  dashboardRepository, 
  DashboardData 
} from '../../services/dashboardRepository';
import { DashboardHeader } from './DashboardHeader';
import { StatCardsGrid } from './StatCardsGrid';
import { NetworkHealthDonut } from './NetworkHealthDonut';
import { DevicesByTypeChart } from './DevicesByTypeChart';
import { BuildingStatusTable } from './BuildingStatusTable';
import { RecentAlertsCard } from './RecentAlertsCard';
import { RecentMaintenanceCard } from './RecentMaintenanceCard';
import { QuickActionsBar } from './QuickActionsBar';
import { 
  AddDeviceModal, 
  AddCableRouteModal, 
  CreateMaintenanceModal 
} from './DashboardModals';

export const NetworkInfrastructureDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSite, setCurrentSite] = useState<string>('PT. CBA Chemical Industry - Main Plant Cikande');
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddCableOpen, setIsAddCableOpen] = useState(false);
  const [isCreateMaintOpen, setIsCreateMaintOpen] = useState(false);

  const loadData = async (siteName = currentSite) => {
    try {
      setError(null);
      const result = await dashboardRepository.getDashboardData(siteName);
      setData(result);
    } catch (err: any) {
      console.error('[Dashboard] Error fetching dashboard metrics:', err);
      setError(err.message || 'Gagal memuat metrik dashboard infrastruktur.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentSite);

    // 1. Live SSE Stream subscription
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/monitoring/stream');
      
      eventSource.addEventListener('telemetry', () => {
        dashboardRepository.getDashboardData(currentSite).then((fresh) => {
          setData(fresh);
        }).catch(() => {});
      });

      eventSource.addEventListener('impact', () => {
        dashboardRepository.getDashboardData(currentSite).then((fresh) => {
          setData(fresh);
        }).catch(() => {});
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    } catch {
      // EventSource fallback
    }

    // 2. Realtime 5-second background sync
    const liveTimer = setInterval(() => {
      dashboardRepository.getDashboardData(currentSite).then((fresh) => {
        setData(fresh);
      }).catch(() => {});
    }, 5000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(liveTimer);
    };
  }, [currentSite]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await dashboardRepository.refresh();
      setData(refreshed);
      showToast('Data telemetri jaringan berhasil diperbarui.');
    } catch (err: any) {
      setError('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleActionSuccess = async (message: string) => {
    showToast(message);
    const updated = await dashboardRepository.getDashboardData(currentSite);
    setData(updated);
  };

  // 1. Loading State Skeleton
  if (isLoading && !data) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="h-6 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
          </div>
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="h-20 bg-slate-200 dark:bg-slate-800/80 rounded-2xl"></div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Chart Rows Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
          <div className="h-72 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error && !data) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
          <ServerOff className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kendala Memuat Metrik Dashboard</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            loadData();
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header with DateTime, Site Selector, Refresh */}
      <DashboardHeader
        currentSite={currentSite}
        onSiteChange={(site) => setCurrentSite(site)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={data.lastUpdated}
      />

      {/* 2. Quick Actions Banner */}
      <QuickActionsBar
        onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        onOpenAddCable={() => setIsAddCableOpen(true)}
        onOpenCreateMaintenance={() => setIsCreateMaintOpen(true)}
      />

      {/* 3. Stat Cards Grid (8 Cards) */}
      <StatCardsGrid stats={data.stats} />

      {/* 4. Network Health Overview & Devices by Type Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetworkHealthDonut health={data.health} />
        <DevicesByTypeChart devicesByType={data.devicesByType} />
      </div>

      {/* 5. Building Network Status Table */}
      <BuildingStatusTable buildings={data.buildings} />

      {/* 6. Recent Alerts & Recent Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlertsCard alerts={data.recentAlerts} />
        <RecentMaintenanceCard maintenance={data.recentMaintenance} />
      </div>

      {/* 7. Interactive Modals */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <AddCableRouteModal
        isOpen={isAddCableOpen}
        onClose={() => setIsAddCableOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <CreateMaintenanceModal
        isOpen={isCreateMaintOpen}
        onClose={() => setIsCreateMaintOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};
