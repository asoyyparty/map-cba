export interface GeneralSettings {
  company_name: string;
  plant_location: string;
  timezone: string;
  contact_email: string;
  network_code: string;
  emergency_phone?: string;
}

export interface MonitoringThresholds {
  ping_interval_seconds: number;
  latency_warning_ms: number;
  latency_critical_ms: number;
  packet_loss_warning_pct: number;
  packet_loss_critical_pct: number;
  attenuation_warning_db: number;
  attenuation_critical_db: number;
  rack_power_warning_pct: number;
  rack_space_warning_pct: number;
}

export interface NotificationSettings {
  email_alerts_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  alert_recipients: string;
  webhook_enabled: boolean;
  webhook_url: string;
}

export interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_schedule: 'daily' | 'weekly';
  retention_days: number;
  storage_path: string;
  last_backup_at: string;
}

export interface SecuritySettings {
  session_timeout_minutes: number;
  min_password_length: number;
  require_strong_password: boolean;
  max_failed_logins: number;
  enforce_audit_logging: boolean;
}

export interface SystemSettingsConfig {
  general: GeneralSettings;
  monitoring: MonitoringThresholds;
  notifications: NotificationSettings;
  backup: BackupSettings;
  security: SecuritySettings;
}

export interface DatabaseStats {
  databaseName: string;
  dbEngine: string;
  serverHost: string;
  connectionStatus: 'connected' | 'degraded' | 'disconnected';
  totalRows: number;
  tables: {
    devices: number;
    buildings: number;
    cableRoutes: number;
    racks: number;
    devicePorts: number;
    tickets: number;
    alerts: number;
    auditLogs: number;
    users: number;
  };
  nodeUptimeSeconds: number;
  memoryRssMb: number;
  nodeVersion: string;
  platform: string;
}
