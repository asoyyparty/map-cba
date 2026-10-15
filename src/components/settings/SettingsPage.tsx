import React, { useState, useEffect } from 'react';
import {
  Users,
  Settings,
  Shield,
  Database,
  Bell,
  Sliders,
  Key,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  HardDrive,
  Server,
  Mail,
  Building2,
  Activity,
  Phone,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAccount, UserRole, ROLE_CONFIGS } from '../../types/auth';
import { SystemSettingsConfig, DatabaseStats } from '../../types/settings';
import { userService } from '../../services/userService';
import { settingsService } from '../../services/settingsService';

type SettingsTab = 'users' | 'general' | 'monitoring' | 'notifications' | 'database' | 'security';

export const SettingsPage: React.FC = () => {
  const { user: currentUser, role: currentRole, hasPermission } = useAuth();
  const isViewer = currentRole === 'VIEWER';
  const isAdmin = currentRole === 'ADMIN';
  const canManageUsers = hasPermission('users:manage');
  const canManageSettings = hasPermission('settings:manage');

  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals for User Management
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPwOpen, setIsResetPwOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'VIEWER' as UserRole,
    password: '',
    department: 'IT & Automation',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [newPassword, setNewPassword] = useState('');

  // Settings State
  const [settingsData, setSettingsData] = useState<SystemSettingsConfig | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);

  // Load all initial data
  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [usersList, settingsRes, statsRes] = await Promise.all([
        userService.getUsers({
          search: userSearch,
          role: roleFilter,
          status: statusFilter
        }),
        settingsService.getSettings(),
        settingsService.getDatabaseStats()
      ]);

      setUsers(usersList);
      setSettingsData(settingsRes);
      setDbStats(statsRes);
    } catch (err: any) {
      console.error('[SettingsPage] Error loading data:', err);
      setActionError('Gagal memuat beberapa data sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userSearch, roleFilter, statusFilter]);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setActionSuccess(null);
    } else {
      setActionSuccess(msg);
      setActionError(null);
    }
    setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 4500);
  };

  // User Actions
  const handleOpenAdd = () => {
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang dapat menambah pengguna.', true);
      return;
    }
    setUserForm({
      username: '',
      email: '',
      fullName: '',
      role: 'IT_ENGINEER',
      password: '',
      department: 'IT Infrastructure & Security',
      phone: '',
      status: 'active'
    });
    setIsAddUserOpen(true);
  };

  const handleOpenEdit = (u: UserAccount) => {
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang dapat mengedit data pengguna.', true);
      return;
    }
    setSelectedUser(u);
    setUserForm({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      password: '',
      department: u.department,
      phone: u.phone === '-' ? '' : u.phone,
      status: u.status
    });
    setIsEditUserOpen(true);
  };

  const handleOpenResetPw = (u: UserAccount) => {
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang dapat mereset kata sandi.', true);
      return;
    }
    setSelectedUser(u);
    setNewPassword('');
    setIsResetPwOpen(true);
  };

  const handleOpenDelete = (u: UserAccount) => {
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang dapat menghapus akun pengguna.', true);
      return;
    }
    setSelectedUser(u);
    setIsDeleteOpen(true);
  };

  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang berwenang mendaftarkan pengguna.', true);
      return;
    }
    if (!userForm.username.trim() || !userForm.fullName.trim()) {
      showToast('Username dan Nama Lengkap wajib diisi.', true);
      return;
    }

    setSaving(true);
    try {
      await userService.createUser(
        {
          username: userForm.username,
          email: userForm.email || `${userForm.username}@cba-chemical.co.id`,
          fullName: userForm.fullName,
          role: userForm.role,
          password: userForm.password || 'cba123',
          department: userForm.department,
          phone: userForm.phone,
          status: userForm.status
        },
        currentUser?.fullName || 'Admin',
        currentRole
      );
      showToast(`Pengguna ${userForm.username} berhasil didaftarkan.`);
      setIsAddUserOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan pengguna.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang berwenang memperbarui pengguna.', true);
      return;
    }
    if (!selectedUser) return;

    setSaving(true);
    try {
      await userService.updateUser(
        selectedUser.id,
        {
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          department: userForm.department,
          phone: userForm.phone,
          status: userForm.status
        },
        currentUser?.fullName || 'Admin',
        currentRole
      );
      showToast(`Data pengguna ${selectedUser.username} berhasil diperbarui.`);
      setIsEditUserOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui pengguna.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang berwenang mereset kata sandi.', true);
      return;
    }
    if (!selectedUser) return;
    if (!newPassword || newPassword.trim().length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.', true);
      return;
    }

    setSaving(true);
    try {
      await userService.resetPassword(
        selectedUser.id,
        newPassword.trim(),
        currentUser?.fullName || 'Admin',
        currentRole
      );
      showToast(`Kata sandi untuk ${selectedUser.username} berhasil direset.`);
      setIsResetPwOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset kata sandi.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canManageUsers) {
      showToast('Akses ditolak: Hanya Administrator yang berwenang menghapus akun pengguna.', true);
      return;
    }
    if (!selectedUser) return;

    setSaving(true);
    try {
      await userService.deleteUser(
        selectedUser.id,
        currentUser?.id || '',
        currentUser?.fullName || 'Admin',
        currentRole
      );
      showToast(`Pengguna ${selectedUser.username} telah dihapus.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pengguna.', true);
    } finally {
      setSaving(false);
    }
  };

  // Settings Save Handlers
  const handleSaveSettingsCategory = async (category: string, values: Record<string, any>) => {
    if (!canManageSettings) {
      showToast('Akses ditolak: Hanya Administrator yang memiliki hak mengubah konfigurasi sistem.', true);
      return;
    }
    setSaving(true);
    try {
      await settingsService.updateSettings(
        category,
        values,
        currentUser?.fullName || 'Admin',
        currentRole
      );
      showToast(`Pengaturan [${category.toUpperCase()}] berhasil disimpan.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan.', true);
    } finally {
      setSaving(false);
    }
  };

  // Instant Snapshot Backup Download
  const handleTriggerBackup = async () => {
    if (isViewer) {
      showToast('Akses ditolak: Akun dengan peran Viewer tidak berwenang mengunduh snapshot cadangan database.', true);
      return;
    }
    setBackupLoading(true);
    try {
      await settingsService.downloadBackup(currentUser?.fullName || 'Admin', currentRole);
      showToast('Snapshot cadangan data berhasil dibuat dan diunduh.');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat cadangan data.', true);
    } finally {
      setBackupLoading(false);
    }
  };

  // Purge Old Logs
  const handlePurgeLogs = async () => {
    if (!canManageSettings) {
      showToast('Akses ditolak: Hanya Administrator yang memiliki hak membersihkan log audit.', true);
      return;
    }
    setPurgeLoading(true);
    try {
      const count = await settingsService.clearOldLogs(purgeDays, currentUser?.fullName || 'Admin', currentRole);
      showToast(`Pembersihan selesai. ${count} rekaman log audit lama berhasil dibersihkan.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membersihkan log audit.', true);
    } finally {
      setPurgeLoading(false);
    }
  };

  // User Counts
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const engineerCount = users.filter(u => u.role === 'IT_ENGINEER').length;
  const viewerCount = users.filter(u => u.role === 'VIEWER').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 p-6 space-y-6 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                Settings & User Management
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                  PT. CBA Chemical Industry
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Konfigurasi parameter sistem, manajemen akun pengguna, hak akses peran (RBAC), ambang batas SLA, dan pencadangan database.
              </p>
            </div>
          </div>
        </div>

        {/* User Role Indicator & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
            <span className="text-slate-500 dark:text-slate-400">Role Anda:</span>
            <span className={`font-semibold px-2 py-0.5 rounded ${
              currentRole === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800' :
              currentRole === 'IT_ENGINEER' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
              'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {currentRole}
            </span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-xs disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notifications / Toast */}
      {actionSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm animate-fade-in shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Manajemen Pengguna
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-900/20 dark:bg-slate-900/60 border border-current">
            {totalUsers}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'general'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Profil Pabrik & Umum
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'monitoring'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Ambang Batas & SLA
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'notifications'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifikasi & Integrasi
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'database'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          Database & Backup
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          Kebijakan Keamanan
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER MANAGEMENT                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {!canManageUsers && (
            <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-blue-800 dark:text-blue-300 text-xs shadow-xs">
              <Shield className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span><strong>Mode Tinjauan Pengguna:</strong> Anda dapat melihat daftar akun pengguna. Operasi penambahan, pengeditan, reset password, dan penghapusan akun dibatasi khusus untuk <strong>Administrator</strong>.</span>
            </div>
          )}

          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Pengguna</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalUsers}</div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Semua Divisi Pabrik</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 border border-purple-200 dark:border-purple-900/40 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-purple-600 dark:text-purple-300">Administrator</span>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-200 mt-1">{adminCount}</div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Full System Access</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-blue-600 dark:text-blue-300">IT Engineer</span>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mt-1">{engineerCount}</div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Infrastructure Operations</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Operator / Viewer</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-200 mt-1">{viewerCount}</div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Read-Only Access</span>
            </div>
          </div>

          {/* User Controls Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 p-4 rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, username, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Peran (Role)</option>
                <option value="ADMIN">Administrator</option>
                <option value="IT_ENGINEER">IT Engineer</option>
                <option value="VIEWER">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              disabled={!canManageUsers}
              title={!canManageUsers ? 'Hanya Administrator yang dapat mendaftarkan pengguna baru' : 'Tambah Pengguna Baru'}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/30"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna Baru
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl overflow-hidden shadow-xs dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5">Pengguna & Akun</th>
                    <th className="px-5 py-3.5">Peran (Role)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Departemen / Divisi</th>
                    <th className="px-5 py-3.5">Telepon</th>
                    <th className="px-5 py-3.5">Terakhir Masuk</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                              alt={u.username}
                              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover bg-slate-100 dark:bg-slate-900"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{u.fullName}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">@{u.username} • {u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80'
                                : u.role === 'IT_ENGINEER'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/80'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {u.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                            {ROLE_CONFIGS[u.role]?.label || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              u.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/50'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                u.status === 'active' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'
                              }`}
                            />
                            {u.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                          {u.department || 'IT & Automation'}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                          {u.phone || '-'}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })
                            : 'Belum pernah'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenResetPw(u)}
                              disabled={!canManageUsers}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title={!canManageUsers ? 'Hanya Administrator yang berwenang mereset kata sandi' : 'Reset Password'}
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              disabled={!canManageUsers}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title={!canManageUsers ? 'Hanya Administrator yang berwenang mengedit profil pengguna' : 'Edit Profil'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(u)}
                              disabled={!canManageUsers || u.username === 'admin' || u.id === currentUser?.id}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                              title={
                                !canManageUsers
                                  ? 'Hanya Administrator yang berwenang menghapus pengguna'
                                  : u.username === 'admin'
                                  ? 'Root Admin tidak dapat dihapus'
                                  : u.id === currentUser?.id
                                  ? 'Tidak dapat menghapus akun sendiri'
                                  : 'Hapus Pengguna'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role & Permissions Guide Table */}
          <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Matriks Hak Akses Peran Pengguna (Role-Based Access Control)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setiap akun memiliki batasan hak operasional yang diproteksi di tingkat server REST API dan peramban.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Modul & Fitur</th>
                    <th className="py-2.5 px-4 text-center text-purple-700 dark:text-purple-300 font-semibold">ADMIN</th>
                    <th className="py-2.5 px-4 text-center text-blue-700 dark:text-blue-300 font-semibold">IT ENGINEER</th>
                    <th className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">VIEWER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-2.5 px-4">Peta Pabrik, Topologi & Monitoring Status</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">Lihat & Kontrol</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">Lihat & Kontrol</td>
                    <td className="py-2.5 px-4 text-center text-slate-500 dark:text-slate-400">Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Inventaris Perangkat & Rute Kabel Fiber Optik</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">CRUD Penuh</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">CRUD Penuh</td>
                    <td className="py-2.5 px-4 text-center text-slate-500 dark:text-slate-400">Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Tiket Pemeliharaan & Troubleshooting</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">Buat, Edit, Hapus</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">Buat & Update</td>
                    <td className="py-2.5 px-4 text-center text-slate-500 dark:text-slate-400">Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Laporan & Ekspor Data (CSV / JSON / PDF)</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">Semua + Log Audit</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">Semua + Log Audit</td>
                    <td className="py-2.5 px-4 text-center text-amber-600 dark:text-amber-400">Inventaris Dasar</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Manajemen Pengguna & Password Reset</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">Penuh</td>
                    <td className="py-2.5 px-4 text-center text-rose-600 dark:text-rose-400 font-medium">Dibatasi (Lihat)</td>
                    <td className="py-2.5 px-4 text-center text-rose-600 dark:text-rose-500 font-medium">Tidak Ada Akses</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Konfigurasi Sistem, Backup Snapshot & Purge Logs</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">Penuh</td>
                    <td className="py-2.5 px-4 text-center text-amber-600 dark:text-amber-400 font-medium">Hanya Backup</td>
                    <td className="py-2.5 px-4 text-center text-rose-600 dark:text-rose-500 font-medium">Tidak Ada Akses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GENERAL & PLANT PROFILE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'general' && settingsData && (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 space-y-6 max-w-4xl shadow-xs">
          {!canManageSettings && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs shadow-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span><strong>Mode Konfigurasi Terproteksi:</strong> Pengaturan profil pabrik hanya dapat dimodifikasi oleh <strong>Administrator</strong>. Akun Anda beroperasi dalam mode baca.</span>
            </div>
          )}

          <div className="border-b border-slate-200 dark:border-slate-700/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Profil Fasilitas Pabrik & Konfigurasi Umum
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Metadata resmi entitas pabrik kimia dan parameter identifikasi site PT. CBA Chemical Industry.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettingsCategory('general', settingsData.general);
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Nama Resmi Perusahaan
                </label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={settingsData.general.company_name}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      general: { ...settingsData.general, company_name: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kode Pengenal Jaringan Site
                </label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={settingsData.general.network_code}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      general: { ...settingsData.general, network_code: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Lokasi Kawasan Industri & Alamat Pabrik
                </label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={settingsData.general.plant_location}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      general: { ...settingsData.general, plant_location: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Zona Waktu Operasional
                </label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={settingsData.general.timezone}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      general: { ...settingsData.general, timezone: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Helpdesk IT & OT NOC
                </label>
                <input
                  type="email"
                  disabled={!canManageSettings}
                  value={settingsData.general.contact_email}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      general: { ...settingsData.general, contact_email: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kontak Darurat IT NOC (Ext.)
                </label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={settingsData.general.emergency_phone || ''}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      general: { ...settingsData.general, emergency_phone: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700/80">
              <button
                type="submit"
                disabled={!canManageSettings || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Profil Pabrik'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONITORING & SLA THRESHOLDS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'monitoring' && settingsData && (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 space-y-6 max-w-4xl shadow-xs">
          {!canManageSettings && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs shadow-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span><strong>Mode Konfigurasi Terproteksi:</strong> Ambang batas SLA dan pemantauan jaringan hanya dapat diubah oleh <strong>Administrator</strong>.</span>
            </div>
          )}

          <div className="border-b border-slate-200 dark:border-slate-700/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Ambang Batas Pengawasan & SLA Jaringan Pabrik
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Batas toleransi latensi ICMP, toleransi redaman kabel serat optik (OTDR), dan ambang utilisasi daya kabinet server.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettingsCategory('monitoring', settingsData.monitoring);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ping Interval */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Interval Ping Probe Berkala (Detik)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Frekuensi background engine memeriksa status switch & access point.</p>
                <input
                  type="number"
                  min={5}
                  max={300}
                  disabled={!canManageSettings}
                  value={settingsData.monitoring.ping_interval_seconds}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      monitoring: { ...settingsData.monitoring, ping_interval_seconds: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              {/* Latency Thresholds */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ambang Batas Latensi (Round-Trip Time ms)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Peringatan (Warning)</span>
                    <input
                      type="number"
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.latency_warning_ms}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, latency_warning_ms: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Kritis (Critical)</span>
                    <input
                      type="number"
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.latency_critical_ms}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, latency_critical_ms: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Packet Loss */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ambang Batas Packet Loss (%)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Warning (%)</span>
                    <input
                      type="number"
                      step={0.5}
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.packet_loss_warning_pct}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, packet_loss_warning_pct: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Critical (%)</span>
                    <input
                      type="number"
                      step={0.5}
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.packet_loss_critical_pct}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, packet_loss_critical_pct: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Fiber Optical Attenuation */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ambang Batas Redaman Kabel FO (dB)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Warning (&gt; dB)</span>
                    <input
                      type="number"
                      step={0.1}
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.attenuation_warning_db}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, attenuation_warning_db: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Critical (&gt; dB)</span>
                    <input
                      type="number"
                      step={0.1}
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.attenuation_critical_db}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, attenuation_critical_db: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Rack Utilization */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ambang Batas Beban Server Rack Kabinet
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Peringatan Utilisasi Ruang Unit U (%)</span>
                    <input
                      type="number"
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.rack_space_warning_pct}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, rack_space_warning_pct: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Peringatan Konsumsi Daya Listrik (%)</span>
                    <input
                      type="number"
                      disabled={!canManageSettings}
                      value={settingsData.monitoring.rack_power_warning_pct}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          monitoring: { ...settingsData.monitoring, rack_power_warning_pct: Number(e.target.value) }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700/80">
              <button
                type="submit"
                disabled={!canManageSettings || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Ambang Batas SLA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NOTIFICATIONS & INTEGRATIONS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && settingsData && (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 space-y-6 max-w-4xl shadow-xs">
          {!canManageSettings && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs shadow-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span><strong>Mode Konfigurasi Terproteksi:</strong> Saluran integrasi dan notifikasi insiden hanya dapat dikonfigurasi oleh <strong>Administrator</strong>.</span>
            </div>
          )}

          <div className="border-b border-slate-200 dark:border-slate-700/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Notifikasi Insiden & Saluran Integrasi IT NOC
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pengaturan pengiriman surel darurat ketika terjadi pemutusan link fiber optik atau switch down.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettingsCategory('notifications', settingsData.notifications);
            }}
            className="space-y-6"
          >
            {/* Email Notification Toggle */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Aktifkan Notifikasi Email Otomatis</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kirim surel darurat saat terjadi insiden berprioritas Kritis (Critical).</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManageSettings}
                  checked={settingsData.notifications.email_alerts_enabled}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      notifications: { ...settingsData.notifications, email_alerts_enabled: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* SMTP Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Host Server SMTP
                </label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={settingsData.notifications.smtp_host}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      notifications: { ...settingsData.notifications, smtp_host: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Port SMTP
                </label>
                <input
                  type="number"
                  disabled={!canManageSettings}
                  value={settingsData.notifications.smtp_port}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      notifications: { ...settingsData.notifications, smtp_port: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Akun Pengirim Notifikasi (Sender Email)
                </label>
                <input
                  type="email"
                  disabled={!canManageSettings}
                  value={settingsData.notifications.smtp_user}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      notifications: { ...settingsData.notifications, smtp_user: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Daftar Email Penerima Darurat (Dipisah Koma)
                </label>
                <textarea
                  rows={2}
                  disabled={!canManageSettings}
                  value={settingsData.notifications.alert_recipients}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      notifications: { ...settingsData.notifications, alert_recipients: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Webhook / Telegram Bot Toggle */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">Integrasi Webhook / Telegram Bot NOC</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Meneruskan status insiden ke endpoint eksternal secara real-time.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={settingsData.notifications.webhook_enabled}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        notifications: { ...settingsData.notifications, webhook_enabled: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {settingsData.notifications.webhook_enabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Webhook Destination URL
                  </label>
                  <input
                    type="url"
                    disabled={!canManageSettings}
                    value={settingsData.notifications.webhook_url}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        notifications: { ...settingsData.notifications, webhook_url: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700/80">
              <button
                type="submit"
                disabled={!canManageSettings || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DATABASE & BACKUP                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6 max-w-5xl">
          {/* Health & Engine Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Database Engine</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{dbStats?.dbEngine || 'MySQL (XAMPP)'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Host: {dbStats?.serverHost || '127.0.0.1:3306'}</div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Database Name</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{dbStats?.databaseName || 'cba_network_map'}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Total Record: {dbStats?.totalRows || 0} Baris</div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Memory RSS & Uptime</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{dbStats?.memoryRssMb || 0} MB</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Node Process Uptime: {Math.floor((dbStats?.nodeUptimeSeconds || 0) / 60)} Menit</div>
            </div>
          </div>

          {/* Table Breakdown Grid */}
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Rincian Kuantitas Baris Tabel Infrastruktur
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Perangkat (devices):</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{dbStats?.tables?.devices || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Gedung (buildings):</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{dbStats?.tables?.buildings || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Kabel FO (cable_routes):</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{dbStats?.tables?.cableRoutes || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Server Racks (racks):</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{dbStats?.tables?.racks || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Port Perangkat (device_ports):</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{dbStats?.tables?.devicePorts || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Tiket Pemeliharaan:</span>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{dbStats?.tables?.tickets || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Peringatan (alerts):</span>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{dbStats?.tables?.alerts || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Log Audit (audit_logs):</span>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">{dbStats?.tables?.auditLogs || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-slate-500 dark:text-slate-400">Akun Pengguna (users):</span>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{dbStats?.tables?.users || 0}</div>
              </div>
            </div>
          </div>

          {/* Backup Snapshot & Log Purge Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup Generator Card */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
                  <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Cadangan Snapshot Database Instan
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Menghasilkan arsip data mandiri berformat JSON yang merangkum seluruh tabel infrastruktur, gedung, rute serat optik, alokasi core, tiket, dan konfigurasi sistem.
                </p>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-800">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Terakhir dicadangkan: <strong className="text-slate-800 dark:text-slate-200">{settingsData?.backup.last_backup_at ? new Date(settingsData.backup.last_backup_at).toLocaleString('id-ID') : 'Belum tercatat'}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={handleTriggerBackup}
                disabled={isViewer || backupLoading}
                title={isViewer ? 'Akun dengan peran Viewer tidak berwenang mengunduh cadangan database' : 'Unduh Backup Snapshot Sekarang (JSON)'}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className={`w-4 h-4 ${backupLoading ? 'animate-bounce' : ''}`} />
                {backupLoading ? 'Menghasilkan Snapshot...' : 'Unduh Backup Snapshot Sekarang (JSON)'}
              </button>
            </div>

            {/* Log Maintenance & Purge Card */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Pembersihan Riwayat Log Audit Kadaluarsa
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Hapus rekaman jejak audit yang telah melewati masa retensi untuk mengoptimalkan ruang penyimpanan MySQL pabrik.
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Batas Retensi Pembersihan (Hari):
                  </label>
                  <select
                    value={purgeDays}
                    onChange={(e) => setPurgeDays(Number(e.target.value))}
                    disabled={!canManageSettings}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200"
                  >
                    <option value={30}>Lebih lama dari 30 Hari</option>
                    <option value={60}>Lebih lama dari 60 Hari</option>
                    <option value={90}>Lebih lama dari 90 Hari (Rekomendasi Standar)</option>
                    <option value={180}>Lebih lama dari 180 Hari</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handlePurgeLogs}
                disabled={!canManageSettings || purgeLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/60 dark:hover:bg-rose-800/80 border border-rose-200 dark:border-rose-700/50 text-rose-700 dark:text-rose-200 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {purgeLoading ? 'Membersihkan...' : `Bersihkan Log Lama (> ${purgeDays} Hari)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SECURITY & SESSION POLICIES                                        */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 6: SECURITY & SESSION POLICIES                                        */}
      {/* ========================================================================= */}
      {activeTab === 'security' && settingsData && (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-6 space-y-6 max-w-4xl shadow-xs dark:shadow-sm">
          {!canManageSettings && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs shadow-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span><strong>Mode Konfigurasi Terproteksi:</strong> Kebijakan keamanan akun dan manajemen sesi hanya dapat dimodifikasi oleh <strong>Administrator</strong>.</span>
            </div>
          )}

          <div className="border-b border-slate-200 dark:border-slate-700/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Kebijakan Keamanan Akun & Manajemen Sesi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Standar perlindungan integritas kredensial dan batas kedaluwarsa sesi sistem pemetaan jaringan CBA.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettingsCategory('security', settingsData.security);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Batas Waktu Sesi Tidak Aktif (Menit)
                </label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  disabled={!canManageSettings}
                  value={settingsData.security.session_timeout_minutes}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      security: { ...settingsData.security, session_timeout_minutes: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Pengguna akan logout otomatis jika tidak ada aktivitas.</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Panjang Karakter Kata Sandi Minimal
                </label>
                <input
                  type="number"
                  min={6}
                  max={32}
                  disabled={!canManageSettings}
                  value={settingsData.security.min_password_length}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      security: { ...settingsData.security, min_password_length: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Standar keamanan minimum untuk semua akun.</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Batas Percobaan Login Salah (Brute-Force Limit)
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  disabled={!canManageSettings}
                  value={settingsData.security.max_failed_logins}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      security: { ...settingsData.security, max_failed_logins: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Akun akan ditangguhkan sementara bila melebihi batas ini.</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">Wajib Jejak Audit Keamanan</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mewajibkan pencatatan permanen ke audit_logs untuk setiap operasi modifikasi.</div>
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Wajib &amp; Aktif Permanen
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700/80">
              <button
                type="submit"
                disabled={!canManageSettings || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Kebijakan Keamanan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW USER                                                       */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Pendaftaran Pengguna Baru
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Budi Santoso"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: budi.s"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Peran (Role) *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VIEWER">Viewer (Read-Only)</option>
                    <option value="IT_ENGINEER">IT Engineer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Resmi Perusahaan</label>
                  <input
                    type="email"
                    placeholder="budi@cba-chemical.co.id"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Awal</label>
                  <input
                    type="password"
                    placeholder="Default: cba123"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+62 812-..."
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Departemen / Area Kerja</label>
                  <input
                    type="text"
                    placeholder="misal: IT Infrastructure, Maintenance, Produksi"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-emerald-900/20"
                >
                  {saving ? 'Mendaftarkan...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER                                                          */}
      {/* ========================================================================= */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Edit Data Pengguna ({selectedUser.username})
              </h3>
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Perusahaan</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Peran (Role)</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="IT_ENGINEER">IT Engineer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status Akun</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif (Suspended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Departemen</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD                                                     */}
      {/* ========================================================================= */}
      {isResetPwOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Reset Kata Sandi
              </h3>
              <button
                onClick={() => setIsResetPwOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPw} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Anda akan mengatur ulang kata sandi untuk pengguna <strong className="text-slate-900 dark:text-white">{selectedUser.fullName}</strong> (@{selectedUser.username}).
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Baru (Minimal 6 Karakter) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetPwOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Mereset...' : 'Reset Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE USER                                                */}
      {/* ========================================================================= */}
      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                Konfirmasi Hapus Pengguna
              </h3>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Apakah Anda yakin ingin menghapus pengguna <strong className="text-slate-900 dark:text-white">{selectedUser.fullName}</strong> (@{selectedUser.username}) dari sistem?
              </p>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                Tindakan ini permanen dan akan dicatat ke dalam log jejak audit keamanan.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
