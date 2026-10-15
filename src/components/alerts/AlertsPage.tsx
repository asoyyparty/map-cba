import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Wrench,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Radio,
  Building2,
  Server,
  Zap,
  Check,
  X,
  Trash2,
  FileText,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Alert, AlertSeverity, AlertStatus } from '../../types';
import { alertService, AlertSummaryMetrics } from '../../services/alertService';
import { buildingService } from '../../services/buildingService';
import { Building } from '../../types';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole } = useAuth();
  const isViewer = currentRole === 'VIEWER';
  const isAdmin = currentRole === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummaryMetrics>({
    total: 0,
    criticalActive: 0,
    openCount: 0,
    inInvestigation: 0,
    resolvedCount: 0
  });
  const [buildings, setBuildings] = useState<Building[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Forms
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const [addForm, setAddForm] = useState({
    title: '',
    message: '',
    severity: 'high' as AlertSeverity,
    category: 'fiber_optical',
    buildingId: '',
    deviceId: ''
  });

  const [resolveNotes, setResolveNotes] = useState('');
  const [ticketForm, setTicketForm] = useState({
    priority: 'HIGH',
    assignedTo: 'Budi Santoso',
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    additionalNotes: ''
  });

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, summaryData, bldData] = await Promise.all([
        alertService.getAlerts({
          search,
          severity: severityFilter,
          status: statusFilter,
          category: categoryFilter,
          buildingId: buildingFilter
        }),
        alertService.getAlertSummary(),
        buildingService.getBuildings()
      ]);

      setAlerts(alertsData);
      setSummary(summaryData);
      setBuildings(bldData);
    } catch (err: any) {
      console.error('[AlertsPage] Error loading data:', err);
      showToast('Gagal memuat daftar alarm.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, severityFilter, statusFilter, categoryFilter, buildingFilter]);

  // Acknowledge Alert Handler
  const handleAcknowledge = async (alert: Alert) => {
    if (isViewer) {
      showToast('Akses ditolak: Viewer hanya memiliki hak baca.', true);
      return;
    }
    setActionLoading(true);
    try {
      await alertService.acknowledgeAlert(
        alert.id,
        currentUser?.fullName || 'Budi Santoso',
        currentRole
      );
      showToast(`Alarm "${alert.title}" telah ditangani.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menangani alarm.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Resolve Modal
  const handleOpenResolve = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolveNotes('');
    setIsResolveModalOpen(true);
  };

  const handleSaveResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    if (isViewer) {
      showToast('Akses ditolak: Viewer hanya memiliki hak baca.', true);
      return;
    }
    setActionLoading(true);
    try {
      await alertService.resolveAlert(
        selectedAlert.id,
        resolveNotes,
        currentUser?.fullName || 'Budi Santoso',
        currentRole
      );
      showToast(`Alarm "${selectedAlert.title}" berhasil diselesaikan.`);
      setIsResolveModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyelesaikan alarm.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Escalate to Ticket Modal
  const handleOpenTicketModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setTicketForm({
      priority: alert.severity === 'critical' ? 'CRITICAL' : 'HIGH',
      assignedTo: 'Budi Santoso',
      scheduledDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      additionalNotes: ''
    });
    setIsTicketModalOpen(true);
  };

  const handleSaveConvertTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    if (isViewer) {
      showToast('Akses ditolak: Viewer hanya memiliki hak baca.', true);
      return;
    }
    setActionLoading(true);
    try {
      const ticketRes = await alertService.convertToTicket(
        selectedAlert.id,
        ticketForm,
        currentUser?.fullName || 'Admin IT',
        currentRole
      );
      showToast(`Tiket pemeliharaan #${ticketRes.ticketNo} berhasil diterbitkan.`);
      setIsTicketModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengeskalasikan alarm ke tiket.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Alert
  const handleOpenDelete = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAlert) return;
    if (isViewer) {
      showToast('Akses ditolak: Viewer hanya memiliki hak baca.', true);
      return;
    }
    setActionLoading(true);
    try {
      await alertService.deleteAlert(
        selectedAlert.id,
        currentUser?.fullName || 'Admin IT',
        currentRole
      );
      showToast(`Alarm "${selectedAlert.title}" telah dihapus.`);
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus alarm.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Create Manual Alert
  const handleSaveAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      showToast('Akses ditolak: Viewer hanya memiliki hak baca.', true);
      return;
    }
    if (!addForm.title.trim() || !addForm.message.trim()) {
      showToast('Judul dan rincian pesan wajib diisi.', true);
      return;
    }

    setActionLoading(true);
    try {
      const bld = buildings.find(b => b.id === addForm.buildingId);
      await alertService.createAlert(
        {
          title: addForm.title,
          message: addForm.message,
          severity: addForm.severity,
          category: addForm.category,
          buildingId: addForm.buildingId || undefined,
          buildingName: bld?.name || 'Fasilitas Pabrik',
          deviceId: addForm.deviceId || undefined
        },
        currentUser?.fullName || 'Admin IT',
        currentRole
      );
      showToast(`Alarm baru berhasil dipicu.`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat alarm.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper formatting functions
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            Baru (Open)
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
            <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Ditangani
          </span>
        );
      case 'in_progress':
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
            <Wrench className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Tiket Terbit
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Selesai
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 dark:text-slate-400">{status}</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fiber_optical':
        return <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
      case 'device_offline':
        return <Server className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />;
      case 'latency_spike':
        return <Activity className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />;
      case 'power_rack':
        return <Layers className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'fiber_optical': return 'Kabel Fiber Optik';
      case 'device_offline': return 'Perangkat Offline';
      case 'latency_spike': return 'Lonjakan Latensi';
      case 'power_rack': return 'Daya / Suhu Rak';
      case 'security': return 'Keamanan Sesi';
      default: return 'Jaringan Pabrik';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 p-6 space-y-6 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Incident & Alert Management Hub
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                Live NOC Stream
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pusat penanganan alarm insiden pabrik, monitoring redaman serat optik, penugasan teknisi, dan eskalasi langsung ke tiket pemeliharaan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={isViewer}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-rose-950/20 font-mono"
          >
            <Plus className="w-4 h-4" />
            Picu Alarm / Simulasi
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 shadow-xs"
            title="Muat Ulang Alarm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-500 dark:text-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm animate-fade-in shadow-lg ${
            toastMsg.isError
              ? 'bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {toastMsg.isError ? (
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{toastMsg.text}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/50 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 relative overflow-hidden shadow-xs dark:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold uppercase tracking-wider">Alarm Kritis Aktif</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{summary.criticalActive}</div>
          <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">Memerlukan mitigasi darurat NOC</div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs dark:shadow-sm">
          <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">Menunggu Penanganan</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{summary.openCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Insiden baru berstatus Open</div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 shadow-xs dark:shadow-sm">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wider">Sedang Diinvestigasi</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{summary.inInvestigation}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Teknisi ditugaskan / Tiket terbit</div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-xs dark:shadow-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">Berhasil Diselesaikan</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{summary.resolvedCount}</div>
          <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">SLA Pemulihan Normal</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs dark:shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari alarm, pesan, gedung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="all">Semua Keparahan (Severity)</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="open">Open (Baru)</option>
            <option value="acknowledged">Acknowledged (Ditangani)</option>
            <option value="in_progress">In Progress (Tiket)</option>
            <option value="resolved">Resolved (Selesai)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            <option value="fiber_optical">Fiber Optik (Redaman)</option>
            <option value="device_offline">Perangkat Offline</option>
            <option value="latency_spike">Lonjakan Latensi</option>
            <option value="power_rack">Daya / Suhu Rak</option>
            <option value="network">Jaringan Umum</option>
          </select>

          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="all">Semua Gedung Pabrik</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Main List: Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.length === 0 ? (
            <div className="col-span-2 bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
              <div className="text-base font-semibold text-slate-800 dark:text-slate-300">Tidak ada alarm aktif saat ini</div>
              <p className="text-xs text-slate-500 mt-1">Seluruh rute fiber optik dan perangkat jaringan beroperasi normal.</p>
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className={`border rounded-xl p-5 transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                  a.severity === 'critical'
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700/80 shadow-md shadow-rose-950/5 dark:shadow-rose-950/20'
                    : a.severity === 'high'
                    ? 'bg-orange-50/70 dark:bg-orange-950/15 border-orange-200 dark:border-orange-900/60 hover:border-orange-300 dark:hover:border-orange-700/80'
                    : a.status === 'resolved'
                    ? 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/70 opacity-80'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(a.severity)}
                      {getStatusBadge(a.status)}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {getCategoryIcon(a.category || 'network')}
                        {getCategoryLabel(a.category || 'network')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                      {a.timeAgo || new Date(a.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">{a.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{a.message}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {a.buildingName || 'Seluruh Pabrik'}
                    </span>
                    {a.deviceId && (
                      <span className="flex items-center gap-1 font-mono text-blue-600 dark:text-blue-300">
                        <Server className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                        {a.deviceId}
                      </span>
                    )}
                    {a.ticketId && (
                      <button
                        onClick={() => navigate('/maintenance')}
                        className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 underline font-mono"
                        title="Buka tiket di modul Maintenance"
                      >
                        <Wrench className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        #{a.ticketId}
                      </button>
                    )}
                  </div>

                  {a.acknowledgedBy && (
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Ditangani oleh: <strong className="text-slate-800 dark:text-slate-200">{a.acknowledgedBy}</strong>
                    </div>
                  )}

                  {a.resolutionNotes && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                      <strong>Catatan Resolusi:</strong> {a.resolutionNotes}
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                  <div className="flex items-center gap-2">
                    {a.status === 'open' && (
                      <button
                        onClick={() => handleAcknowledge(a)}
                        disabled={isViewer || actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs font-mono"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Tangani
                      </button>
                    )}

                    {a.status !== 'resolved' && !a.ticketId && (
                      <button
                        onClick={() => handleOpenTicketModal(a)}
                        disabled={isViewer || actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs font-mono"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Eskalasi ke Tiket
                      </button>
                    )}

                    {a.status !== 'resolved' && (
                      <button
                        onClick={() => handleOpenResolve(a)}
                        disabled={isViewer || actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs font-mono"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Selesaikan
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenDelete(a)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
                      title="Hapus Alarm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main List: Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl overflow-hidden shadow-xs dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Alarm & Pesan</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Gedung / Alat</th>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                      Tidak ada alarm yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-5 py-4 max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-white">{a.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{a.message}</div>
                      </td>
                      <td className="px-5 py-4">{getSeverityBadge(a.severity)}</td>
                      <td className="px-5 py-4">{getStatusBadge(a.status)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                          {getCategoryIcon(a.category || 'network')}
                          {getCategoryLabel(a.category || 'network')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{a.buildingName}</div>
                        {a.deviceId && <div className="font-mono text-slate-500 dark:text-slate-400">{a.deviceId}</div>}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {a.timeAgo || new Date(a.timestamp).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {a.status === 'open' && (
                            <button
                              onClick={() => handleAcknowledge(a)}
                              disabled={isViewer}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-40 shadow-2xs font-mono"
                              title="Tangani"
                            >
                              Tangani
                            </button>
                          )}
                          {a.status !== 'resolved' && (
                            <button
                              onClick={() => handleOpenResolve(a)}
                              disabled={isViewer}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-40 shadow-2xs font-mono"
                              title="Selesaikan"
                            >
                              Selesai
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenDelete(a)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRIGGER NEW / SIMULATED ALERT                                      */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                Picu Alarm Baru / Simulasi Insiden
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddAlert} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Judul Alarm Insiden *
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Kabel FO-004 Putus di Dekat Workshop"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tingkat Keparahan (Severity)
                  </label>
                  <select
                    value={addForm.severity}
                    onChange={(e) => setAddForm({ ...addForm, severity: e.target.value as AlertSeverity })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="critical">Critical (Darurat Pabrik)</option>
                    <option value="high">High (Tinggi)</option>
                    <option value="medium">Medium (Sedang)</option>
                    <option value="low">Low (Rendah)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kategori Gangguan
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="fiber_optical">Kabel Fiber Optik</option>
                    <option value="device_offline">Perangkat Tidak Merespons</option>
                    <option value="latency_spike">Lonjakan Latensi</option>
                    <option value="power_rack">Daya / Suhu Rak Server</option>
                    <option value="network">Jaringan Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fasilitas Gedung
                  </label>
                  <select
                    value={addForm.buildingId}
                    onChange={(e) => setAddForm({ ...addForm, buildingId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Pilih Fasilitas...</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kode Perangkat Terdampak
                  </label>
                  <input
                    type="text"
                    placeholder="misal: dev-sw-d-01"
                    value={addForm.deviceId}
                    onChange={(e) => setAddForm({ ...addForm, deviceId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Deskripsi Kronologi & Dampak Insiden *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan detail anomali, redaman dB, atau packet loss yang terdeteksi..."
                  value={addForm.message}
                  onChange={(e) => setAddForm({ ...addForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 font-mono shadow-md"
                >
                  {actionLoading ? 'Memicu...' : 'Picu Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESOLVE ALERT                                                      */}
      {/* ========================================================================= */}
      {isResolveModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                Penyelesaian Alarm Insiden
              </h3>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolve} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                <div className="text-xs text-slate-500 dark:text-slate-400">Menyelesaikan Alarm:</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedAlert.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedAlert.buildingName}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Catatan Tindakan Teknisi & Akar Masalah (Resolution Notes) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan perbaikan yang dilakukan (misal: Splicing ulang core optik, penggantian modul SFP+, reboot switch)..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 font-mono shadow-md"
                >
                  {actionLoading ? 'Menyimpan...' : 'Tandai Selesai (Resolved)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ESCALATE ALERT TO MAINTENANCE TICKET                               */}
      {/* ========================================================================= */}
      {isTicketModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Eskalasi ke Tiket Pemeliharaan (Maintenance)
              </h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConvertTicket} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1 shadow-2xs">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Alarm Asal:</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedAlert.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Lokasi: {selectedAlert.buildingName}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Prioritas Tiket
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Teknisi Ditugaskan
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.assignedTo}
                    onChange={(e) => setTicketForm({ ...ticketForm, assignedTo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Jadwal Pengerjaan
                  </label>
                  <input
                    type="date"
                    value={ticketForm.scheduledDate}
                    onChange={(e) => setTicketForm({ ...ticketForm, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Batas Waktu (Due Date)
                  </label>
                  <input
                    type="date"
                    value={ticketForm.dueDate}
                    onChange={(e) => setTicketForm({ ...ticketForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Catatan Instruksi untuk Teknisi
                </label>
                <textarea
                  rows={2}
                  placeholder="misal: Bawa OTDR, power meter, dan kabel patch cord cadangan..."
                  value={ticketForm.additionalNotes}
                  onChange={(e) => setTicketForm({ ...ticketForm, additionalNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 font-mono shadow-md"
                >
                  {actionLoading ? 'Menerbitkan...' : 'Terbitkan Tiket Pemeliharaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ALERT CONFIRMATION                                          */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                Hapus Alarm Insiden
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Apakah Anda yakin ingin menghapus alarm <strong className="text-slate-900 dark:text-white">{selectedAlert.title}</strong>?
              </p>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                Tindakan ini permanen dan akan dicatat ke dalam log jejak audit keamanan.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 font-mono shadow-md"
                >
                  {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
