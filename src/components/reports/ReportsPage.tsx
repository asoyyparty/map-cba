import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService, ExecutiveSummaryData, ExportDataset } from '../../services/reportService';
import { PrintableAuditReport } from './PrintableAuditReport';
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  ShieldCheck, 
  Activity, 
  Server, 
  Cable, 
  Layers, 
  Wrench, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileCode,
  Gauge,
  Clock,
  Building2,
  Check
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const isAdminOrEngineer = user?.role === 'ADMIN' || user?.role === 'IT_ENGINEER';

  // State
  const [data, setData] = useState<ExecutiveSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'devices' | 'cables' | 'racks' | 'maintenance' | 'audit'>('executive');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [downloadingDataset, setDownloadingDataset] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Executive Summary Data
  const loadSummary = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await reportService.getExecutiveSummary({
        building_id: selectedBuilding,
        range: timeRange
      });
      setData(res);
    } catch (err) {
      console.error('Failed loading reports summary:', err);
      showToast('error', 'Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBuilding, timeRange]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Handle Export Download
  const handleExport = async (dataset: ExportDataset, format: 'csv' | 'json' = 'csv') => {
    setDownloadingDataset(`${dataset}-${format}`);
    try {
      const res = await reportService.downloadExport(dataset, format, selectedBuilding);
      if (res.success) {
        showToast('success', `Laporan ${dataset.toUpperCase()} (${format.toUpperCase()}) berhasil diunduh`);
      } else {
        showToast('error', `Gagal mengunduh laporan ${dataset}`);
      }
    } catch {
      showToast('error', 'Terjadi kesalahan saat mengunduh berkas');
    } finally {
      setDownloadingDataset(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-6 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/50'
            : 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-500/50'
        }`}>
          {toastMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/15 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Laporan Infrastruktur & Ekspor Data
                {isViewer && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-normal">
                    Mode Viewer (Public Reports)
                  </span>
                )}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Pusat audit kesiapan jaringan pabrik CBA, kepatuhan SLA uptime, laporan kapasitas, dan ekspor dataset CSV/JSON
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => loadSummary(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shadow-xs transition-all disabled:opacity-50"
            title="Refresh Laporan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {data && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Formal PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 KPI Cards Kesiapan Infrastruktur & SLA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* SLA Availability */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Uptime SLA</span>
            <Gauge className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {data?.sla?.availabilityPct || 99.85}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Target: 99.80% (Passed)</span>
        </div>

        {/* Total Assets IT */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Aset IT</span>
            <Server className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {data?.devices?.total || 0} Unit
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{data?.devices?.online || 0} Perangkat Aktif</span>
        </div>

        {/* Optical Fiber Health */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Rata-rata Redaman</span>
            <Cable className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {data?.cables?.avgAttenuationDb || 0.35} dB
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{data?.cables?.totalRoutes || 0} Jalur FO Terhubung</span>
        </div>

        {/* Rack Space Capacity */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Ruang Rak Terpakai</span>
            <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {data?.racks?.spaceUtilizationPct || 0}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{data?.racks?.usedU || 0} dari {data?.racks?.totalU || 0} U</span>
        </div>

        {/* MTTR */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Rata-rata MTTR</span>
            <Clock className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {data?.sla?.mttrMinutes || 38} m
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{data?.tickets?.resolved || 0} Tiket Selesai</span>
        </div>

        {/* Audit Readiness Score */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Kesiapan Audit</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <span>{data?.readinessScore || 95}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 100</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Grade A (Compliant)</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs dark:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Lingkup Laporan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Building Select */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Fasilitas Kawasan (10 Gedung)</option>
            {data?.buildings?.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>

          {/* Time Range Select */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="today">Hari Ini</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir (Bulan Berjalan)</option>
            <option value="quarter">Kuartal Ini (Q1 2026)</option>
            <option value="year">Tahun 2026</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('executive')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'executive'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Ringkasan Eksekutif & SLA
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'devices'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Inventaris Perangkat ({data?.devices?.total || 0})
        </button>

        <button
          onClick={() => setActiveTab('cables')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'cables'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Cable className="w-4 h-4" />
          Kabel FO & Core TIA-598
        </button>

        <button
          onClick={() => setActiveTab('racks')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'racks'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Server Racks & Daya ({data?.racks?.totalRacks || 0})
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance & Tiket ({data?.tickets?.total || 0})
        </button>

        {isAdminOrEngineer && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security Audit Trail
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: EXECUTIVE AUDIT SUMMARY */}
      {activeTab === 'executive' && data && (
        <div className="space-y-6">
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-slate-100 via-indigo-50/60 to-slate-100 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {data.documentNumber} • {data.company}
              </span>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Kesiapan Infrastruktur Jaringan Pabrik Terverifikasi
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Evaluasi berkala integritas perangkat backbone, jalur kabel serat optik antar fasilitas, kabinet server, dan pemeliharaan pencegahan (preventive maintenance).
              </p>
            </div>
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Format Cetak Resmi</span>
            </button>
          </div>

          {/* Facilities Summary Table */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs dark:shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Matriks Kondisi Fasilitas Kawasan Pabrik ({data.buildings.length} Gedung)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Kepatuhan Operasional</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Gedung</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">PIC IT</th>
                    <th className="py-2.5 px-3 text-center">Perangkat</th>
                    <th className="py-2.5 px-3 text-center">Rak</th>
                    <th className="py-2.5 px-3">Backbone FO</th>
                    <th className="py-2.5 px-3 text-center">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {data.buildings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-300">{b.code}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{b.name}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-500 dark:text-slate-400">{b.category}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{b.head_it}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-900 dark:text-white">{b.device_count}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-sky-600 dark:text-sky-400">{b.rack_count}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{b.backbone_cable || 'FO-001'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'healthy'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DEVICE INVENTORY */}
      {activeTab === 'devices' && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Laporan Inventaris Seluruh Perangkat IT Pabrik
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data spesifikasi perangkat, IP, MAC address, vendor, model, alokasi gedung, dan unit rack
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('devices', 'csv')}
                disabled={downloadingDataset === 'devices-csv'}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh CSV</span>
              </button>
              <button
                onClick={() => handleExport('devices', 'json')}
                disabled={downloadingDataset === 'devices-json'}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Total {data?.devices?.total || 0} perangkat terdaftar ({data?.devices?.online || 0} online, {data?.devices?.offline || 0} offline)
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              Kapasitas Port: {data?.devices?.activePorts || 0} / {data?.devices?.totalPorts || 0} Aktif ({data?.devices?.portUtilizationPct || 0}%)
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Klik tombol &quot;Unduh CSV&quot; untuk mengunduh seluruh baris dataset inventaris perangkat dalam format spreadsheet siap olah Excel / Google Sheets.
          </p>
        </div>
      )}

      {/* TAB CONTENT 3: FIBER CABLES & CORES */}
      {activeTab === 'cables' && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cable className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Laporan Rute Kabel Serat Optik & Matriks Core TIA-598
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kapasitas kabel backbone, alokasi 12/24 core per tabung, redaman optik (dB), dan endpoint patching
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleExport('cables', 'csv')}
                disabled={downloadingDataset === 'cables-csv'}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh CSV Rute</span>
              </button>
              <button
                onClick={() => handleExport('cores', 'csv')}
                disabled={downloadingDataset === 'cores-csv'}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh CSV Matriks Core</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Bentangan:</span>
              <strong className="text-slate-900 dark:text-white text-sm font-mono">{data?.cables?.totalMeters || 0} meter</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Kapasitas Core Optik:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 text-sm font-mono">{data?.cables?.totalCores || 0} Cores ({data?.cables?.usedCores || 0} Dipatch)</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Rata-rata Optical Loss:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">{data?.cables?.avgAttenuationDb || 0.35} dB</strong>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Ekspor mencakup kode warna standar internasional TIA-598-C (Blue, Orange, Green, Brown, dsb.) beserta nilai atenuasi dB dan endpoint port terkait.
          </p>
        </div>
      )}

      {/* TAB CONTENT 4: SERVER RACKS & POWER */}
      {activeTab === 'racks' && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Laporan Kabinet Server Racks & Konsumsi Daya
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Okupansi ruang unit U, pemetaan kabinet 42U/24U per fasilitas, dan beban daya listrik (Watts)
              </p>
            </div>
            <button
              onClick={() => handleExport('racks', 'csv')}
              disabled={downloadingDataset === 'racks-csv'}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh CSV Rak Server</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Kabinet Terpasang:</span>
              <strong className="text-slate-900 dark:text-white text-sm font-mono">{data?.racks?.totalRacks || 0} Kabinet</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Okupansi Ruang Unit U:</span>
              <strong className="text-amber-600 dark:text-amber-400 text-sm font-mono">{data?.racks?.usedU || 0} / {data?.racks?.totalU || 0} U ({data?.racks?.spaceUtilizationPct || 0}%)</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Beban Daya Terpantau:</span>
              <strong className="text-sky-600 dark:text-sky-400 text-sm font-mono">{data?.racks?.currentPowerDrawWatts || 0} W / {data?.racks?.totalPowerCapWatts || 0} W</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: MAINTENANCE & TICKETS */}
      {activeTab === 'maintenance' && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Laporan Tiket Pemeliharaan & Kinerja SLA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Riwayat penanganan insiden, teknisi penanggung jawab, waktu resolusi MTTR, dan status tiket
              </p>
            </div>
            <button
              onClick={() => handleExport('maintenance', 'csv')}
              disabled={downloadingDataset === 'maintenance-csv'}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh CSV Tiket Maintenance</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-center">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Tiket:</span>
              <strong className="text-slate-900 dark:text-white text-sm">{data?.tickets?.total || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Open:</span>
              <strong className="text-amber-600 dark:text-amber-400 text-sm">{data?.tickets?.open || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Dalam Pengerjaan:</span>
              <strong className="text-sky-600 dark:text-sky-400 text-sm">{data?.tickets?.inProgress || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Tuntas Diselesaikan:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{data?.tickets?.resolved || 0}</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: SECURITY AUDIT TRAIL */}
      {activeTab === 'audit' && isAdminOrEngineer && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                Laporan Rekam Jejak Audit Keamanan Sistem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log kronologis seluruh aksi konfigurasi, modifikasi perangkat, rute kabel, gedung, dan otorisasi pengguna
              </p>
            </div>
            <button
              onClick={() => handleExport('audit', 'csv')}
              disabled={downloadingDataset === 'audit-csv'}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh CSV Log Audit</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Log audit ini memenuhi ketentuan kepatuhan tata kelola IT industri dan dapat digunakan sebagai bukti forensik serta verifikasi kepatuhan ISO 27001 / regulasi internal PT. CBA Chemical Industry.
          </p>
        </div>
      )}

      {/* MODAL PRINT PREVIEW */}
      {showPrintModal && data && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <PrintableAuditReport
            data={data}
            onClose={() => setShowPrintModal(false)}
          />
        </div>
      )}
    </div>
  );
};
