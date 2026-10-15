import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  User, 
  Calendar, 
  Building2, 
  Server, 
  Network, 
  HardDrive, 
  X, 
  Send, 
  Trash2, 
  ShieldCheck,
  CheckCircle,
  FileText,
  Lock
} from 'lucide-react';
import { 
  maintenanceService, 
  MaintenanceTicket, 
  TicketTimelineItem, 
  CreateTicketPayload 
} from '../../services/maintenanceService';
import { useAuth } from '../../context/AuthContext';

export const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const isAdmin = user?.role === 'ADMIN';

  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawer
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Aux data for create dropdowns
  const [buildingsList, setBuildingsList] = useState<any[]>([]);
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [cablesList, setCablesList] = useState<any[]>([]);

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateTicketPayload>({
    title: '',
    description: '',
    priority: 'medium',
    assetType: 'Device',
    assetId: '',
    assetName: '',
    buildingId: '',
    deviceId: '',
    cableRouteId: '',
    assignedTo: 'Tim IT Industrial CBA',
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  // Resolution Form State (Inside Drawer)
  const [resolveForm, setResolveForm] = useState({
    status: 'completed' as 'completed' | 'in_progress' | 'pending' | 'cancelled',
    resolution: '',
    rootCause: '',
    actionTaken: '',
    technicianNotes: ''
  });

  // Load auxiliary data
  useEffect(() => {
    async function loadAux() {
      try {
        const [bRes, dRes, cRes] = await Promise.all([
          fetch('/api/buildings'),
          fetch('/api/devices'),
          fetch('/api/cables')
        ]);
        if (bRes.ok) setBuildingsList((await bRes.json()).data || []);
        if (dRes.ok) setDevicesList((await dRes.json()).data || []);
        if (cRes.ok) setCablesList((await cRes.json()).data || []);
      } catch (err) {
        console.error('Error loading aux options:', err);
      }
    }
    loadAux();
  }, []);

  // Check URL params to pre-fill Create modal
  useEffect(() => {
    const assetType = searchParams.get('assetType');
    const assetId = searchParams.get('assetId');
    const assetName = searchParams.get('assetName');
    const buildingId = searchParams.get('buildingId');

    if (assetType || assetId || assetName || buildingId) {
      setCreateForm(prev => ({
        ...prev,
        assetType: (assetType as any) || prev.assetType,
        assetId: assetId || prev.assetId,
        assetName: assetName || prev.assetName,
        buildingId: buildingId || prev.buildingId,
        deviceId: assetType === 'Device' ? (assetId || prev.deviceId) : prev.deviceId,
        title: assetName ? `Investigasi & Pemeliharaan: ${assetName}` : prev.title
      }));
      if (!isViewer) {
        setIsCreateOpen(true);
      }
    }
  }, [searchParams, isViewer]);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maintenanceService.getTickets({
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery
      });
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle ESC key to close drawer/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Submit Create Ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    const res = await maintenanceService.createTicket({
      ...createForm,
      authorName: user?.fullName || 'Teknisi IT',
      authorRole: user?.role || 'ADMIN'
    });

    if (res.success) {
      setIsCreateOpen(false);
      setSearchParams({}); // Clear prefill params
      fetchTickets();
    } else {
      alert(res.message);
    }
  };

  // Submit Resolution
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || isViewer) return;

    const res = await maintenanceService.updateTicket(selectedTicket.id, {
      ...resolveForm,
      authorName: user?.fullName || 'Teknisi IT',
      authorRole: user?.role || 'ADMIN'
    });

    if (res.success) {
      setIsDetailOpen(false);
      fetchTickets();
    } else {
      alert(res.message);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: string, ticketNo: string) => {
    if (!isAdmin) {
      alert('Hanya Administrator yang memiliki hak menghapus tiket pemeliharaan.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus tiket ${ticketNo}? Tindakan ini dicatat dalam audit log.`)) {
      const res = await maintenanceService.deleteTicket(id);
      if (res.success) {
        if (selectedTicket?.id === id) setIsDetailOpen(false);
        fetchTickets();
      } else {
        alert(res.message);
      }
    }
  };

  // Open Detail Drawer
  const openDetail = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setResolveForm({
      status: ticket.status === 'completed' ? 'completed' : 'in_progress',
      resolution: ticket.resolution || '',
      rootCause: ticket.root_cause || '',
      actionTaken: ticket.action_taken || '',
      technicianNotes: ticket.technician_notes || ''
    });
    setIsDetailOpen(true);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 uppercase">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 uppercase">In Progress</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 uppercase">Pending</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30 uppercase">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30 uppercase">{status}</span>;
    }
  };

  // Priority Badge Helper
  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    switch (p) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 uppercase">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/40 uppercase">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 uppercase">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/40 uppercase">Low</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] uppercase text-slate-700 dark:text-slate-300">{priority}</span>;
    }
  };

  // Parse Timeline
  const parsedTimeline: TicketTimelineItem[] = useMemo(() => {
    if (!selectedTicket?.timeline_json) return [];
    try {
      return JSON.parse(selectedTicket.timeline_json);
    } catch {
      return [];
    }
  }, [selectedTicket]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 min-h-screen overflow-y-auto transition-colors duration-200">
      {/* 1. Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B132B]/60 backdrop-blur-md px-6 py-4 sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Wrench className="w-3.5 h-3.5" />
            Infrastructure Maintenance & Incident Handling
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Maintenance Management
            {isViewer && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1 font-normal">
                <Lock className="w-3 h-3" /> Read-Only (Viewer)
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem tiket perbaikan infrastruktur, jadwal pemeliharaan preventif, dan log resolusi teknisi PT. CBA.
          </p>
        </div>

        {/* Create ticket button */}
        {!isViewer ? (
          <button
            onClick={() => {
              setCreateForm({
                title: '',
                description: '',
                priority: 'medium',
                assetType: 'Device',
                assetId: '',
                assetName: '',
                buildingId: '',
                deviceId: '',
                cableRouteId: '',
                assignedTo: 'Tim IT Industrial CBA',
                scheduledDate: new Date().toISOString().split('T')[0],
                dueDate: ''
              });
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md self-start md:self-center font-mono"
          >
            <Plus className="w-4 h-4" />
            Buat Tiket Baru
          </button>
        ) : (
          <div className="text-xs text-slate-500 italic flex items-center gap-1">
            <Lock className="w-3 h-3" /> Mode peninjauan (Viewer)
          </div>
        )}
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* 2. Table Controls & Filters */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tiket, aset, teknisi..."
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Prioritas</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Total: <span className="text-slate-900 dark:text-white font-bold">{tickets.length}</span> tiket pemeliharaan
            </div>
          </div>

          {/* 3. Maintenance List Table (9 Columns) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Ticket Number</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      Memuat daftar tiket pemeliharaan...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      Tidak ada tiket pemeliharaan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  tickets.map(ticket => {
                    const bld = buildingsList.find(b => b.id === ticket.building_id);
                    const bldName = bld ? bld.name : (ticket.building_id || '-');
                    const createdStr = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                    const dueStr = ticket.due_date || '-';

                    return (
                      <tr 
                        key={ticket.id} 
                        onClick={() => openDetail(ticket)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ticket.ticket_no}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors max-w-xs truncate">
                          {ticket.title}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {ticket.asset_type || 'Device'}
                            </span>
                            <span className="font-medium truncate max-w-[120px]">
                              {ticket.asset_name || '-'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {bldName}
                        </td>

                        <td className="py-3.5 px-4">
                          {getPriorityBadge(ticket.priority)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{ticket.assigned_to || 'Tim IT'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(ticket.status)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {createdStr}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {dueStr}
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(ticket)}
                              title="Buka detail tiket"
                              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shadow-2xs"
                            >
                              Detail
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteTicket(ticket.id, ticket.ticket_no)}
                                title="Hapus tiket"
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-700 transition-all shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* ======================================================== */}
      {/* 4. CREATE TICKET MODAL */}
      {/* ======================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Buat Tiket Pemeliharaan Baru</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registrasi gangguan teknis atau jadwal perawatan berkala</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Judul Tiket / Isu *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Contoh: Pembersihan debu switch dan terminasi ulang FO-003"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Asset Type & Building */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipe Aset</label>
                  <select
                    value={createForm.assetType}
                    onChange={(e) => setCreateForm({ ...createForm, assetType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Device">Perangkat (Device)</option>
                    <option value="Building">Gedung (Building)</option>
                    <option value="Cable Route">Jalur Kabel (Cable Route)</option>
                    <option value="Rack">Kabinet Rack</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Lokasi Gedung</label>
                  <select
                    value={createForm.buildingId}
                    onChange={(e) => setCreateForm({ ...createForm, buildingId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {buildingsList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Asset Selection based on type */}
              {createForm.assetType === 'Device' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Perangkat Terkait</label>
                  <select
                    value={createForm.deviceId}
                    onChange={(e) => {
                      const dev = devicesList.find(d => d.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        deviceId: e.target.value,
                        assetId: e.target.value,
                        assetName: dev ? `${dev.code || dev.name} (${dev.ip})` : ''
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Perangkat Jaringan --</option>
                    {devicesList.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code || d.name} — {d.name} ({d.ip}) [{d.buildingName}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.assetType === 'Cable Route' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Jalur Kabel Terkait</label>
                  <select
                    value={createForm.cableRouteId}
                    onChange={(e) => {
                      const cab = cablesList.find(c => c.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        cableRouteId: e.target.value,
                        assetId: e.target.value,
                        assetName: cab ? `${cab.code} - ${cab.name}` : ''
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Kabel Optik --</option>
                    {cablesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} ({c.from_building_name || c.from} → {c.to_building_name || c.to})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority & Assigned To */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tingkat Prioritas</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low (Rendah)</option>
                    <option value="medium">Medium (Sedang)</option>
                    <option value="high">High (Tinggi)</option>
                    <option value="critical">Critical (Kritis / Outage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teknisi Bertanggung Jawab</label>
                  <input
                    type="text"
                    value={createForm.assignedTo}
                    onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                    placeholder="Nama teknisi / Tim IT"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Jadwal Dimulai</label>
                  <input
                    type="date"
                    value={createForm.scheduledDate}
                    onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Batas Waktu (Due Date)</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deskripsi Detail & Tindakan Yang Dibutuhkan *</label>
                <textarea
                  required
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Jelaskan gejala, indikasi kerusakan, atau rencana pemeliharaan preventif..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md font-mono"
                >
                  <Send className="w-3.5 h-3.5" />
                  Buat Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TICKET DETAIL & RESOLUTION RIGHT DRAWER */}
      {/* ======================================================== */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{selectedTicket.ticket_no}</span>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-tight">{selectedTicket.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Overview Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Aset</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedTicket.asset_name || 'Infrastruktur Umum'}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Tipe: {selectedTicket.asset_type || 'Device'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Teknisi PJ</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {selectedTicket.assigned_to || 'Tim IT'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Jadwal / Batas</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono mt-0.5 block">
                    {selectedTicket.scheduled_date || '-'} → {selectedTicket.due_date || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tanggal Selesai</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono mt-0.5 block">
                    {selectedTicket.completed_date ? new Date(selectedTicket.completed_date).toLocaleString('id-ID') : 'Belum selesai'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Deskripsi Permasalahan</h4>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 leading-relaxed shadow-2xs">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Resolution Form / Details */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Resolusi & Penyelesaian Tiket
                  </h4>
                  {selectedTicket.status === 'completed' && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                      RESOLVED
                    </span>
                  )}
                </div>

                {!isViewer ? (
                  <form onSubmit={handleResolveSubmit} className="space-y-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ubah Status</label>
                      <select
                        value={resolveForm.status}
                        onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="in_progress">IN PROGRESS (Sedang Dikerjakan)</option>
                        <option value="pending">PENDING (Menunggu Sparepart/Vendor)</option>
                        <option value="completed">COMPLETED (Selesai & Terverifikasi)</option>
                        <option value="cancelled">CANCELLED (Dibatalkan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Akar Masalah (Root Cause)</label>
                      <input
                        type="text"
                        value={resolveForm.rootCause}
                        onChange={(e) => setResolveForm({ ...resolveForm, rootCause: e.target.value })}
                        placeholder="Contoh: Konektor FO kotor / Patch cord tertekuk"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tindakan Perbaikan (Action Taken)</label>
                      <input
                        type="text"
                        value={resolveForm.actionTaken}
                        onChange={(e) => setResolveForm({ ...resolveForm, actionTaken: e.target.value })}
                        placeholder="Contoh: Pembersihan ferrule optik dengan one-click cleaner dan re-patch"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Catatan Teknisi / Hasil Verifikasi</label>
                      <textarea
                        rows={2}
                        value={resolveForm.technicianNotes}
                        onChange={(e) => setResolveForm({ ...resolveForm, technicianNotes: e.target.value })}
                        placeholder="Contoh: Redaman kabel kembali normal di 0.32 dB. Ping 0% packet loss."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow flex items-center justify-center gap-1.5 mt-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Simpan Update Resolusi
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Akar Masalah: </span>
                      <span>{selectedTicket.root_cause || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Tindakan: </span>
                      <span>{selectedTicket.action_taken || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Catatan: </span>
                      <span>{selectedTicket.technician_notes || '-'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Riwayat Progres & Timeline
                </h4>
                <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                  {parsedTimeline.map((item, idx) => (
                    <div key={item.id || idx} className="relative pl-4">
                      <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{item.action}</span>
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          {new Date(item.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{item.note}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Oleh: {item.by}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
