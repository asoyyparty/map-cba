import { SystemSettingsConfig, DatabaseStats } from '../types/settings';

const DEFAULT_SETTINGS: SystemSettingsConfig = {
  general: {
    company_name: 'PT. CBA Chemical Industry',
    plant_location: 'Kawasan Industri Modern Cikande, Serang - Banten',
    timezone: 'Asia/Jakarta (WIB - UTC+7)',
    contact_email: 'it.support@cba-chemical.co.id',
    network_code: 'CBA-NET-CIKANDE',
    emergency_phone: '+62 254 401500 (Ext. 204)'
  },
  monitoring: {
    ping_interval_seconds: 30,
    latency_warning_ms: 45,
    latency_critical_ms: 100,
    packet_loss_warning_pct: 3,
    packet_loss_critical_pct: 10,
    attenuation_warning_db: 2.5,
    attenuation_critical_db: 5.0,
    rack_power_warning_pct: 80,
    rack_space_warning_pct: 85
  },
  notifications: {
    email_alerts_enabled: true,
    smtp_host: 'smtp.cba-chemical.co.id',
    smtp_port: 587,
    smtp_user: 'network-alerts@cba-chemical.co.id',
    alert_recipients: 'noc@cba-chemical.co.id, it-infra@cba-chemical.co.id',
    webhook_enabled: false,
    webhook_url: 'https://api.telegram.org/botTOKEN/sendMessage'
  },
  backup: {
    auto_backup_enabled: true,
    backup_schedule: 'daily',
    retention_days: 90,
    storage_path: 'C:\\IT\\BACKUP\\cba_network',
    last_backup_at: new Date().toISOString()
  },
  security: {
    session_timeout_minutes: 60,
    min_password_length: 8,
    require_strong_password: true,
    max_failed_logins: 5,
    enforce_audit_logging: true
  }
};

export const settingsService = {
  async getSettings(): Promise<SystemSettingsConfig> {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return {
          general: { ...DEFAULT_SETTINGS.general, ...json.data.general },
          monitoring: { ...DEFAULT_SETTINGS.monitoring, ...json.data.monitoring },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...json.data.notifications },
          backup: { ...DEFAULT_SETTINGS.backup, ...json.data.backup },
          security: { ...DEFAULT_SETTINGS.security, ...json.data.security }
        };
      }
      return DEFAULT_SETTINGS;
    } catch (err) {
      console.warn('[settingsService] Failed fetching settings, using defaults:', err);
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(
    category: string,
    settings: Record<string, any>,
    currentUserName = 'Admin IT',
    currentUserRole = 'ADMIN'
  ): Promise<void> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify({ category, settings })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menyimpan pengaturan.');
    }
  },

  async getDatabaseStats(): Promise<DatabaseStats | null> {
    try {
      const res = await fetch('/api/settings/database-stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn('[settingsService] Failed fetching db stats:', err);
      return {
        databaseName: 'cba_network_map',
        dbEngine: 'MySQL 8.0 / MariaDB (XAMPP)',
        serverHost: '127.0.0.1:3306',
        connectionStatus: 'connected',
        totalRows: 230,
        tables: {
          devices: 11,
          buildings: 10,
          cableRoutes: 14,
          racks: 7,
          devicePorts: 154,
          tickets: 6,
          alerts: 4,
          auditLogs: 35,
          users: 3
        },
        nodeUptimeSeconds: 3600,
        memoryRssMb: 85,
        nodeVersion: 'v20.x',
        platform: 'win32'
      };
    }
  },

  async downloadBackup(currentUserName = 'Admin IT', currentUserRole = 'ADMIN'): Promise<void> {
    const res = await fetch('/api/settings/backup', {
      method: 'POST',
      headers: {
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      }
    });

    if (!res.ok) {
      throw new Error(`Gagal membuat cadangan data (HTTP ${res.status})`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `cba-network-map-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async clearOldLogs(
    retentionDays = 90,
    currentUserName = 'Admin IT',
    currentUserRole = 'ADMIN'
  ): Promise<number> {
    const res = await fetch('/api/settings/clear-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify({ retentionDays })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal membersihkan log audit.');
    }
    return json.purgedCount || 0;
  }
};
