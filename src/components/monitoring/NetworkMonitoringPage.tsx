import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ArrowUpDown, 
  Send, 
  Wrench, 
  GitFork, 
  ShieldAlert, 
  Radio, 
  HardDrive, 
  Layers, 
  Server,
  Zap,
  Info
} from 'lucide-react';
import { monitoringService, MonitoringSummary, MonitoredDevice, MonitoringAlert } from '../../services/monitoringService';
import { useNavigate } from 'react-router-dom';

export const NetworkMonitoringPage: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<MonitoringSummary>({
    networkAvailability: 99.8,
    onlineDevices: 0,
    offlineDevices: 0,
    warningDevices: 0,
    totalDevices: 0,
    avgLatencyMs: 1.8,
    packetLossPercent: 0.0,
    activeAlerts: 0,
    uploadMbps: 0,
    downloadMbps: 0
  });

  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh interval (seconds, 0 = off)
  const [refreshInterval, setRefreshInterval] = useState<number>(30);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');

  // Ping probe states
  const [pingingDeviceId, setPingingDeviceId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{
    deviceId: string;
    deviceName: string;
    ip: string;
    latencyMs: number;
    packetLossPercent: number;
    status: string;
  } | null>(null);

  // Fetch telemetry
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [sum, devs, alrts] = await Promise.all([
        monitoringService.getNetworkStatus(),
        monitoringService.getMonitoredDevices(),
        monitoringService.getActiveAlerts()
      ]);
      setSummary(sum);
      setDevices(devs);
      setAlerts(alrts);
    } catch (err) {
      console.error('[MonitoringPage] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle auto-refresh timer
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchData(true);
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, fetchData]);

  // Subscribe to SSE stream for live updates
  useEffect(() => {
    const cleanup = monitoringService.subscribeLiveStream((telemetry) => {
      if (telemetry && telemetry.deviceId) {
        setDevices(prev => prev.map(d => {
          if (d.id === telemetry.deviceId) {
            return {
              ...d,
              status: telemetry.status || d.status,
              latencyMs: telemetry.latencyMs ?? d.latencyMs,
              packetLossPercent: telemetry.packetLossPercent ?? d.packetLossPercent,
              lastCheck: new Date().toLocaleTimeString('id-ID')
            };
          }
          return d;
        }));
      }
    });
    return cleanup;
  }, []);

  // Ping probe trigger
  const handlePing = async (dev: MonitoredDevice) => {
    setPingingDeviceId(dev.id);
    try {
      const res = await monitoringService.pingDevice(dev.id);
      setPingResult({
        deviceId: dev.id,
        deviceName: dev.name,
        ip: dev.ip,
        latencyMs: res.latencyMs,
        packetLossPercent: res.packetLossPercent,
        status: res.status
      });
    } catch (err) {
      console.error('Ping probe failed:', err);
    } finally {
      setPingingDeviceId(null);
    }
  };

  // Building list from devices
  const buildingOptions = useMemo(() => {
    const bSet = new Set<string>();
    devices.forEach(d => {
      if (d.buildingName) bSet.add(d.buildingName);
    });
    return Array.from(bSet).sort();
  }, [devices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (buildingFilter !== 'all' && d.buildingName !== buildingFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchCode = d.code?.toLowerCase().includes(q);
        const matchIp = d.ip.toLowerCase().includes(q);
        const matchBld = d.buildingName.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchIp && !matchBld) return false;
      }
      return true;
    });
  }, [devices, statusFilter, buildingFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 min-h-screen overflow-y-auto transition-colors duration-200">
      {/* 1. Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B132B]/60 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500 dark:text-emerald-400" />
            Live Network Telemetry & Diagnostics
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Network Monitoring
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-normal">
              ICMP / SNMP Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pemantauan real-time ketersediaan node jaringan pabrik, latensi respon ICMP, dan degradasi paket.
          </p>
        </div>

        {/* Refresh controls & Auto Refresh Selector */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Auto Refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-900 dark:text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Off</option>
              <option value={10} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">10 Detik</option>
              <option value={30} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">30 Detik</option>
              <option value={60} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1 Menit</option>
              <option value={300} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">5 Menit</option>
            </select>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-medium transition-all disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* 2. Seven (7) Stat KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {/* Card 1: Network Availability */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Availability</span>
              <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {summary.networkAvailability}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              SLA target 99.5%
            </div>
          </div>

          {/* Card 2: Online Devices */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Online Devices</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {summary.onlineDevices}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">/ {summary.totalDevices}</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium">
              Normal Operation
            </div>
          </div>

          {/* Card 3: Offline Devices */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Offline</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${summary.offlineDevices > 0 ? 'text-rose-600 dark:text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                {summary.offlineDevices}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {summary.offlineDevices > 0 ? 'Perlu tindakan segera' : 'Zero outage'}
            </div>
          </div>

          {/* Card 4: Warning Devices */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Warning</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${summary.warningDevices > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {summary.warningDevices}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Degraded / High Latency
            </div>
          </div>

          {/* Card 5: Average Latency */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Avg Latency</span>
              <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {summary.avgLatencyMs}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">ms</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Sangat Cepat (&lt;5ms)
            </div>
          </div>

          {/* Card 6: Packet Loss */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Packet Loss</span>
              <Radio className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${summary.packetLossPercent > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {summary.packetLossPercent}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Kualitas transmisi optik
            </div>
          </div>

          {/* Card 7: Active Alerts */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Active Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${summary.activeAlerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {summary.activeAlerts}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Open incident ticket
            </div>
          </div>
        </div>

        {/* 3. Active Incident Banner / Alert bar if alerts exist */}
        {alerts.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                  Peringatan Aktif Sistem Jaringan ({alerts.length} Isu Terdeteksi)
                </div>
                <div className="text-xs text-rose-700 dark:text-rose-200/80 mt-0.5">
                  {alerts[0].title} — {alerts[0].message}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/maintenance')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                Buka Tiket Perbaikan
              </button>
            </div>
          </div>
        )}

        {/* 4. Ping Probe Result Modal / Banner */}
        {pingResult && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-blue-200 dark:border-blue-500/50 shadow-lg flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                <Radio className="w-5 h-5 animate-pulse text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Hasil Diagnostik Ping: {pingResult.deviceName} ({pingResult.ip})
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                    pingResult.status === 'online' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                    pingResult.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' :
                    'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                  }`}>
                    {pingResult.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-1">
                  RTT Latency: <span className="text-blue-600 dark:text-blue-400 font-bold">{pingResult.latencyMs} ms</span> | 
                  Packet Loss: <span className={pingResult.packetLossPercent > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}> {pingResult.packetLossPercent}%</span> | 
                  Protocol: ICMP Echo / Port Response Up
                </div>
              </div>
            </div>
            <button
              onClick={() => setPingResult(null)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 5. Device Telemetry Table Controls */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari perangkat, IP, gedung..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>

              {/* Building Filter */}
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Gedung</option>
                {buildingOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Menampilkan <span className="text-slate-900 dark:text-white font-bold">{filteredDevices.length}</span> dari {devices.length} perangkat
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Lokasi Gedung</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">ICMP Latency</th>
                  <th className="py-3 px-4">Packet Loss</th>
                  <th className="py-3 px-4">Uptime</th>
                  <th className="py-3 px-4">Pemeriksaan Terakhir</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Tidak ada perangkat yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map(dev => {
                    const isPinging = pingingDeviceId === dev.id;
                    const statusColor = 
                      dev.status === 'online' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                      dev.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                      'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';

                    const latencyColor = 
                      dev.latencyMs === 0 ? 'text-slate-400 dark:text-slate-500' :
                      dev.latencyMs < 15 ? 'text-emerald-600 dark:text-emerald-400' :
                      dev.latencyMs < 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

                    return (
                      <tr key={dev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                              <Server className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold">{dev.code || dev.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{dev.name} • {dev.type}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {dev.ip}
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {dev.buildingName}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${statusColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              dev.status === 'online' ? 'bg-emerald-500 dark:bg-emerald-400' :
                              dev.status === 'warning' ? 'bg-amber-500 dark:bg-amber-400 animate-pulse' : 'bg-rose-500 animate-ping'
                            }`} />
                            {dev.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className={`font-bold ${latencyColor}`}>
                            {dev.latencyMs > 0 ? `${dev.latencyMs} ms` : 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className={dev.packetLossPercent > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-400'}>
                            {dev.packetLossPercent}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {dev.uptime}
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {dev.lastCheck}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ping button */}
                            <button
                              onClick={() => handlePing(dev)}
                              disabled={isPinging}
                              title="Kirim probe ICMP Ping"
                              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-[11px] flex items-center gap-1 shadow-2xs"
                            >
                              <Send className={`w-3 h-3 ${isPinging ? 'animate-spin text-blue-500 dark:text-blue-400' : 'text-slate-400'}`} />
                              Ping
                            </button>

                            {/* Trace Path button */}
                            <button
                              onClick={() => navigate(`/network-topology?building=${encodeURIComponent(dev.buildingName)}`)}
                              title="Lihat alur dalam topologi"
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-600/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/40 transition-all shadow-2xs"
                            >
                              <GitFork className="w-3.5 h-3.5" />
                            </button>

                            {/* Ticket button */}
                            <button
                              onClick={() => navigate(`/maintenance?assetType=Device&assetId=${dev.id}&assetName=${encodeURIComponent(dev.code || dev.name)}&buildingId=${dev.buildingId}`)}
                              title="Buat tiket pemeliharaan"
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-600/30 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/40 transition-all shadow-2xs"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
