import React, { useState, useEffect } from 'react';
import { Alert } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  FileSpreadsheet, 
  Wrench, 
  ClipboardList, 
  X,
  Clock,
  User
} from 'lucide-react';
import { api } from '../services/api';

import { useToast } from '../context/ToastContext';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';

interface AlertsManagerProps {
  alerts: Alert[];
  onAddAlert: (newAlert: Alert) => void;
  onResolveAlert?: (alertId: string) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({ 
  alerts, 
  onAddAlert,
  onResolveAlert 
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'alerts' | 'tickets'>('alerts');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // New ticket form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('high');
  const [newAssignedTo, setNewAssignedTo] = useState('Budi Santoso');
  const [newBuilding, setNewBuilding] = useState('Kantor Utama');

  // Load tickets from SQLite Backend
  const fetchTickets = async () => {
    try {
      const res = await api.getTickets();
      if (res?.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.warn('[Tickets] Error fetching tickets from backend:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredAlerts = alerts.filter(a => filterStatus === 'all' || a.status === filterStatus);

  const handleSimulateNewAlert = async () => {
    const alertData = {
      id: `alt-${Date.now()}`,
      title: 'Peringatan Degradasi Link FO Gedung B',
      message: 'Deteksi fluktuasi sinyal optik pada core 4-8. Sistem merekomendasikan pengecekan konektor LC/UPC.',
      severity: 'warning' as const,
      buildingId: 'bld-b',
      buildingName: 'Gedung B',
      timeAgo: 'Baru saja',
      status: 'open' as const,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onAddAlert(alertData);
    showToast('Simulasi alert baru berhasil ditambahkan.', 'warning', 'Peringatan Baru');
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await api.resolveAlert(id);
      if (onResolveAlert) {
        onResolveAlert(id);
      }
      showToast('Peringatan jaringan berhasil diselesaikan (Resolved).', 'success', 'Alert Resolved');
    } catch (err) {
      console.error('[Alerts] Error resolving alert:', err);
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    try {
      await api.createTicket({
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        buildingId: newBuilding,
        assignedTo: newAssignedTo
      });

      // Refresh list & reset form
      await fetchTickets();
      setIsCreatingTicket(false);
      setNewTitle('');
      setNewDescription('');
      showToast(`Tiket pemeliharaan "${newTitle}" berhasil dibuat!`, 'success', 'Tiket Terdaftar');
    } catch (err) {
      console.error('[Tickets] Error creating ticket:', err);
      showToast('Gagal membuat tiket pemeliharaan.', 'error', 'Error');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.updateTicket(ticketId, { status });
      await fetchTickets();
      showToast(`Status tiket diperbarui menjadi: ${status.toUpperCase()}`, 'info', 'Status Tiket');
    } catch (err) {
      console.error('[Tickets] Error updating ticket status:', err);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-auto flex flex-col gap-5 font-sans text-slate-900">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Pusat Insiden & Tiket Perawatan (Tahap V3)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring anomali jaringan real-time, audit infrastruktur, dan sistem tiket maintenance terintegrasi database.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={api.downloadInventoryCsvUrl()}
            download
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Unduh Laporan Inventaris (.CSV)
          </a>

          {activeTab === 'alerts' ? (
            <button
              onClick={handleSimulateNewAlert}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Simulasikan Alert
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingTicket(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Tiket Baru
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Log Insiden & Alerts ({alerts.filter(a => a.status === 'open').length} Aktif)
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
            Tiket Maintenance ({tickets.filter(t => t.status !== 'resolved').length} Berjalan)
          </button>
        </div>

        {activeTab === 'alerts' && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({alerts.length})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                filterStatus === 'open' ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Open ({alerts.filter(a => a.status === 'open').length})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                filterStatus === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Resolved ({alerts.filter(a => a.status === 'resolved').length})
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Alerts List */}
      {activeTab === 'alerts' && (
        <div className="flex flex-col gap-2.5">
          {filteredAlerts.length === 0 ? (
            <EmptyState
              title="Tidak Ada Alert"
              description="Tidak ada alert jaringan yang sesuai dengan filter yang dipilih saat ini."
            />
          ) : (
            filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors hover:border-slate-300 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      alt.severity === 'critical' || alt.severity === 'high'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {alt.timestamp || alt.timeAgo}
                      </span>
                      {alt.buildingName && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          {alt.buildingName}
                        </span>
                      )}
                      <StatusBadge status={alt.status} size="sm" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 mt-1 font-sans">
                      {alt.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-sans mt-0.5 leading-relaxed max-w-2xl">
                      {alt.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-sans">
                  {alt.status === 'open' ? (
                    <button
                      onClick={() => handleResolveAlert(alt.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesaikan
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs font-mono">
                      ✓ Diselesaikan
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Maintenance Tickets List */}
      {activeTab === 'tickets' && (
        <div className="flex flex-col gap-2.5">
          {tickets.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-6 h-6 text-slate-400" />}
              title="Belum Ada Tiket Maintenance"
              description="Belum ada tiket perawatan aktif saat ini. Anda dapat membuat tiket baru untuk mencatat penugasan tim."
              actionLabel="Buat Tiket Baru"
              onAction={() => setIsCreatingTicket(true)}
            />
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors hover:border-slate-300 shadow-xs font-sans"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 mt-0.5 shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-blue-600">{t.ticket_no}</span>
                      <StatusBadge status={t.priority} size="sm" label={t.priority.toUpperCase()} />
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" /> {t.created_at}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-slate-900 mt-1">{t.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">{t.description}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> PIC: <strong className="text-slate-800 font-sans">{t.assigned_to}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <select
                    value={t.status}
                    onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="open">OPEN</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Ticket */}
      {isCreatingTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col gap-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" /> Buat Tiket Maintenance Baru
              </h3>
              <button onClick={() => setIsCreatingTicket(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Judul Permasalahan / Tindakan</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Splicing ulang kabel FO Gedung C"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Deskripsi & Catatan Teknis</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Jelaskan detail tindakan perbaikan yang diperlukan..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Teknisi PIC</label>
                  <input
                    type="text"
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingTicket(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Simpan Tiket ke Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
