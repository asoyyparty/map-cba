import mysql from 'mysql2/promise';
import { hashPassword } from '../services/authService.ts';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'cba_network_map';

let pool: mysql.Pool;

export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!pool) await initDatabase();
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  },
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!pool) await initDatabase();
    const [rows] = await pool.query(sql, params);
    return ((rows as any[])[0] as T) || null;
  },
  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!pool) await initDatabase();
    const [result] = await pool.execute(sql, params);
    return result;
  },
  getPool() {
    return pool;
  }
};

// TIA-598 Optical Core Standard Colors
const TIA_598_COLORS = [
  { number: 1, name: 'Blue', hex: '#2563eb' },
  { number: 2, name: 'Orange', hex: '#ea580c' },
  { number: 3, name: 'Green', hex: '#16a34a' },
  { number: 4, name: 'Brown', hex: '#854d0e' },
  { number: 5, name: 'Slate', hex: '#64748b' },
  { number: 6, name: 'White', hex: '#f8fafc' },
  { number: 7, name: 'Red', hex: '#dc2626' },
  { number: 8, name: 'Black', hex: '#1e293b' },
  { number: 9, name: 'Yellow', hex: '#eab308' },
  { number: 10, name: 'Violet', hex: '#9333ea' },
  { number: 11, name: 'Rose', hex: '#f43f5e' },
  { number: 12, name: 'Aqua', hex: '#06b6d4' }
];

function buildDefaultCoreAllocations(code: string, fromName: string, toName: string, totalCores: number = 12, usedCores: number = 6, status: string = 'active') {
  const cores = [];
  for (let i = 1; i <= totalCores; i++) {
    const color = TIA_598_COLORS[(i - 1) % 12];
    let coreStatus = 'available';
    let service = '';
    let sourceDevice = `SW-${code}-01`;
    let sourcePort = '';
    let targetDevice = `SW-${code}-02`;
    let targetPort = '';
    let attenuation = +(0.22 + (i * 0.03)).toFixed(2);
    let notes = '';

    if (i <= usedCores) {
      coreStatus = 'connected';
      if (i === 1) service = `Backbone Primary Trunk (${fromName} ↔ ${toName})`;
      else if (i === 2) service = `Backbone Secondary Trunk (${fromName} ↔ ${toName})`;
      else if (i === 3) service = `CCTV & Surveillance VLAN 30`;
      else if (i === 4) service = `SCADA / Industrial Automation Link`;
      else if (i === 5 && status === 'degraded') {
        coreStatus = 'damaged';
        service = `High Attenuation Fault Channel`;
        attenuation = 4.85;
        notes = 'OTDR detected optical microbend at 112m';
      } else if (i === 5) {
        service = `VoIP Telephony Trunk`;
      } else if (i === 6) {
        service = `Guest Wi-Fi / AP Management VLAN`;
      } else {
        service = `Dedicated Line Link #${i}`;
      }
      sourcePort = `SFP+${i}`;
      targetPort = `SFP+${i}`;
    } else if (i === usedCores + 1) {
      coreStatus = 'reserved';
      service = `Hot-Spare Backup Core`;
      notes = 'Pre-patched, dark fiber standby';
    }

    cores.push({
      coreNumber: i,
      tubeNumber: Math.ceil(i / 12),
      colorName: color.name,
      colorHex: color.hex,
      status: coreStatus,
      service,
      sourceDevice,
      sourcePort,
      targetDevice,
      targetPort,
      attenuationDb: attenuation,
      notes
    });
  }
  return cores;
}

export async function initDatabase() {
  if (pool) return;

  console.log(`[MySQL] Initializing connection to MySQL XAMPP (${DB_HOST}:${DB_PORT})...`);

  try {
    // 1. Ensure database exists
    const tempConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConn.end();

    // 2. Initialize connection pool
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    console.log(`[MySQL] Connected to database '${DB_NAME}'. Ensuring schema tables...`);

    // 3. Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(128) UNIQUE,
        password VARCHAR(255),
        full_name VARCHAR(128) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'viewer',
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure user table columns if table was created previously without email/password
    try {
      const [userCols] = await pool.query("SHOW COLUMNS FROM users;");
      const existingColNames = (userCols as any[]).map(c => c.Field);
      if (!existingColNames.includes('email')) {
        await pool.query("ALTER TABLE users ADD COLUMN email VARCHAR(128) UNIQUE AFTER username;");
      }
      if (!existingColNames.includes('password')) {
        await pool.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER email;");
      }
      if (!existingColNames.includes('avatar_url')) {
        await pool.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) AFTER role;");
      }

      // Seed / update default user accounts with secure scrypt hashes
      const defaultAdminHash = hashPassword('admin123');
      const defaultEngineerHash = hashPassword('engineer123');
      const defaultViewerHash = hashPassword('viewer123');

      await pool.query(`
        INSERT INTO users (id, username, email, password, full_name, role, avatar_url) VALUES
        ('usr-1', 'admin', 'admin@cba-chemical.co.id', ?, 'Admin IT CBA', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'),
        ('usr-2', 'engineer', 'engineer@cba-chemical.co.id', ?, 'Budi Santoso', 'engineer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'),
        ('usr-3', 'viewer', 'viewer@cba-chemical.co.id', ?, 'Operator Pabrik', 'viewer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces')
        ON DUPLICATE KEY UPDATE 
          email = VALUES(email),
          password = COALESCE(users.password, VALUES(password)),
          avatar_url = VALUES(avatar_url);
      `, [defaultAdminHash, defaultEngineerHash, defaultViewerHash]);

      // Automatically migrate any legacy plaintext passwords to scrypt memory-hard hashes
      try {
        const [unhashed]: any = await pool.query("SELECT id, password FROM users WHERE password IS NOT NULL AND password NOT LIKE 'scrypt$%';");
        if (unhashed && unhashed.length > 0) {
          for (const u of unhashed) {
            if (u.password && typeof u.password === 'string') {
              const upgradedHash = hashPassword(u.password);
              await pool.query('UPDATE users SET password = ? WHERE id = ?;', [upgradedHash, u.id]);
            }
          }
          console.log(`[Security] Upgraded ${unhashed.length} legacy plaintext password(s) to scrypt memory-hard hashes in MySQL.`);
        }
      } catch (hashMigErr: any) {
        console.warn('[Security] Notice during password migration:', hashMigErr.message);
      }

      if (!existingColNames.includes('status')) {
        await pool.query("ALTER TABLE users ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'active' AFTER role;");
      }
      if (!existingColNames.includes('department')) {
        await pool.query("ALTER TABLE users ADD COLUMN department VARCHAR(64) DEFAULT 'IT & Automation' AFTER status;");
      }
      if (!existingColNames.includes('phone')) {
        await pool.query("ALTER TABLE users ADD COLUMN phone VARCHAR(32) DEFAULT NULL AFTER department;");
      }
      if (!existingColNames.includes('last_login')) {
        await pool.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER phone;");
      }

      await pool.query("UPDATE users SET department = 'IT Infrastructure & Security', phone = '+62 811-2345-6781' WHERE id = 'usr-1';");
      await pool.query("UPDATE users SET department = 'Network & Systems Engineering', phone = '+62 812-3456-7892' WHERE id = 'usr-2';");
      await pool.query("UPDATE users SET department = 'Chemical Plant Operations', phone = '+62 813-4567-8903' WHERE id = 'usr-3';");
    } catch (migErr: any) {
      console.warn('[MySQL] Notice during users schema ensure:', migErr.message);
    }

    // Ensure system_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(64) PRIMARY KEY,
        setting_value LONGTEXT NOT NULL,
        category VARCHAR(32) NOT NULL DEFAULT 'general',
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(64) DEFAULT 'system'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default system_settings
    try {
      const defaultSettings = [
        // General
        ['general.company_name', JSON.stringify('PT. CBA Chemical Industry'), 'general', 'Nama Resmi Perusahaan'],
        ['general.plant_location', JSON.stringify('Kawasan Industri Modern Cikande, Serang - Banten'), 'general', 'Lokasi Pabrik & Fasilitas'],
        ['general.timezone', JSON.stringify('Asia/Jakarta (WIB - UTC+7)'), 'general', 'Zona Waktu Operasional'],
        ['general.contact_email', JSON.stringify('it.support@cba-chemical.co.id'), 'general', 'Email Helpdesk & Operasi IT'],
        ['general.network_code', JSON.stringify('CBA-NET-CIKANDE'), 'general', 'Kode Pengenal Jaringan Pabrik'],
        ['general.emergency_phone', JSON.stringify('+62 254 401500 (Ext. 204)'), 'general', 'Kontak Darurat IT NOC'],

        // Monitoring Thresholds
        ['monitoring.ping_interval_seconds', JSON.stringify(30), 'monitoring', 'Interval Ping Berkala (Detik)'],
        ['monitoring.latency_warning_ms', JSON.stringify(45), 'monitoring', 'Ambang Batas Peringatan Latensi (ms)'],
        ['monitoring.latency_critical_ms', JSON.stringify(100), 'monitoring', 'Ambang Batas Kritis Latensi (ms)'],
        ['monitoring.packet_loss_warning_pct', JSON.stringify(3), 'monitoring', 'Ambang Batas Peringatan Packet Loss (%)'],
        ['monitoring.packet_loss_critical_pct', JSON.stringify(10), 'monitoring', 'Ambang Batas Kritis Packet Loss (%)'],
        ['monitoring.attenuation_warning_db', JSON.stringify(2.5), 'monitoring', 'Ambang Batas Redaman FO Warning (dB)'],
        ['monitoring.attenuation_critical_db', JSON.stringify(5.0), 'monitoring', 'Ambang Batas Redaman FO Critical (dB)'],
        ['monitoring.rack_power_warning_pct', JSON.stringify(80), 'monitoring', 'Ambang Batas Peringatan Beban Daya Rak (%)'],
        ['monitoring.rack_space_warning_pct', JSON.stringify(85), 'monitoring', 'Ambang Batas Peringatan Ruang Rak U (%)'],

        // Notifications
        ['notifications.email_alerts_enabled', JSON.stringify(true), 'notifications', 'Notifikasi Email Gangguan Jaringan'],
        ['notifications.smtp_host', JSON.stringify('smtp.cba-chemical.co.id'), 'notifications', 'Host Server SMTP'],
        ['notifications.smtp_port', JSON.stringify(587), 'notifications', 'Port Server SMTP'],
        ['notifications.smtp_user', JSON.stringify('network-alerts@cba-chemical.co.id'), 'notifications', 'Akun Pengirim Notifikasi'],
        ['notifications.alert_recipients', JSON.stringify('noc@cba-chemical.co.id, it-infra@cba-chemical.co.id'), 'notifications', 'Daftar Penerima Email Insiden Kritis'],
        ['notifications.webhook_enabled', JSON.stringify(false), 'notifications', 'Integrasi Webhook / Telegram Bot'],
        ['notifications.webhook_url', JSON.stringify('https://api.telegram.org/botTOKEN/sendMessage'), 'notifications', 'URL Webhook Notifikasi'],

        // Backup
        ['backup.auto_backup_enabled', JSON.stringify(true), 'backup', 'Pencadangan Otomatis Terjadwal'],
        ['backup.backup_schedule', JSON.stringify('daily'), 'backup', 'Jadwal Frekuensi Backup (daily / weekly)'],
        ['backup.retention_days', JSON.stringify(90), 'backup', 'Masa Retensi Arsip Backup (Hari)'],
        ['backup.storage_path', JSON.stringify('C:\\IT\\BACKUP\\cba_network'), 'backup', 'Direktori Penyimpanan Arsip Backup Lokal'],
        ['backup.last_backup_at', JSON.stringify(new Date().toISOString()), 'backup', 'Waktu Terakhir Pencadangan Berhasil'],

        // Security
        ['security.session_timeout_minutes', JSON.stringify(60), 'security', 'Batas Waktu Sesi Tidak Aktif (Menit)'],
        ['security.min_password_length', JSON.stringify(8), 'security', 'Panjang Karakter Kata Sandi Minimal'],
        ['security.require_strong_password', JSON.stringify(true), 'security', 'Wajib Kombinasi Huruf dan Angka'],
        ['security.max_failed_logins', JSON.stringify(5), 'security', 'Batas Percobaan Login Sebelum Terkunci'],
        ['security.enforce_audit_logging', JSON.stringify(true), 'security', 'Wajib Pencatatan Jejak Audit Seluruh Modifikasi']
      ];

      for (const [key, val, cat, desc] of defaultSettings) {
        await pool.query(`
          INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description, updated_by)
          VALUES (?, ?, ?, ?, 'system');
        `, [key, val, cat, desc]);
      }
    } catch (setErr: any) {
      console.warn('[MySQL] Notice during system_settings seeding:', setErr.message);
    }


    await pool.query(`
      CREATE TABLE IF NOT EXISTS buildings (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        code VARCHAR(32) NOT NULL,
        category VARCHAR(64) NOT NULL,
        coords_json LONGTEXT NOT NULL,
        center_json LONGTEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'healthy',
        head_it VARCHAR(128),
        total_devices INT DEFAULT 0,
        racks_count INT DEFAULT 0,
        description TEXT,
        lokasi VARCHAR(128),
        koordinat VARCHAR(64),
        main_switch VARCHAR(64),
        ap_count INT DEFAULT 0,
        port_count INT DEFAULT 0,
        connected_users INT DEFAULT 0,
        backbone_from VARCHAR(128),
        backbone_cable VARCHAR(64),
        backbone_core VARCHAR(64),
        backbone_speed VARCHAR(64),
        backbone_status VARCHAR(64),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create building_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS building_categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        color VARCHAR(32) DEFAULT '#3b82f6',
        description VARCHAR(255) DEFAULT '',
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await pool.query(`
        INSERT IGNORE INTO building_categories (id, name, color, description, is_default) VALUES
        ('production', 'Produksi Kimia (Production)', '#10b981', 'Fasilitas manufaktur, sintesis, formulasi, dan packaging kimia', 1),
        ('warehouse', 'Gudang Logistik (Warehouse)', '#f59e0b', 'Gudang penyimpanan bahan baku, barang jadi, dan logistik distribusi', 1),
        ('office', 'Kantor / Administrasi (Office)', '#3b82f6', 'Gedung kantor pusat, administrasi, manajemen, HRD, dan keuangan', 1),
        ('lab', 'Laboratorium & QC (Lab)', '#8b5cf6', 'Laboratorium penelitian dan pengembangan (R&D) serta kontrol kualitas QA/QC', 1),
        ('utility', 'Utilitas & WTP (Utility)', '#06b6d4', 'Gardu listrik PLN, genset, chiller, boiler, dan instalasi pengolahan air WTP', 1),
        ('security', 'Pos Pengamanan (Security)', '#f97316', 'Pos jaga satpam gerbang utama dan pos pengawasan perimeter', 1);
      `);
    } catch (catErr: any) {
      console.warn('[MySQL] Notice during building_categories seeding:', catErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        ip VARCHAR(45) NOT NULL,
        mac VARCHAR(32) NOT NULL,
        type VARCHAR(64) NOT NULL,
        building_id VARCHAR(64),
        building_name VARCHAR(128),
        rack_id VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'online',
        brand VARCHAR(64),
        model VARCHAR(64),
        ports_total INT DEFAULT 24,
        ports_active INT DEFAULT 0,
        firmware VARCHAR(64),
        uptime VARCHAR(64),
        vlan VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure all extended columns for devices exist
    const deviceCols = [
      { name: 'code', type: 'VARCHAR(64)' },
      { name: 'vendor', type: 'VARCHAR(64)' },
      { name: 'serial_number', type: 'VARCHAR(128)' },
      { name: 'hostname', type: 'VARCHAR(128)' },
      { name: 'room', type: 'VARCHAR(128)' },
      { name: 'installation_date', type: 'VARCHAR(64)' },
      { name: 'description', type: 'TEXT' },
      { name: 'last_seen', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'rack_u_position', type: 'INT DEFAULT NULL' },
      { name: 'rack_u_height', type: 'INT DEFAULT 1' },
      { name: 'pos_x', type: 'DOUBLE DEFAULT NULL' },
      { name: 'pos_y', type: 'DOUBLE DEFAULT NULL' }
    ];
    for (const col of deviceCols) {
      try {
        await pool.query(`ALTER TABLE devices ADD COLUMN ${col.name} ${col.type};`);
      } catch {}
    }

    try {
      await pool.query("UPDATE devices SET code = name WHERE code IS NULL OR code = '';");
      await pool.query("UPDATE devices SET vendor = brand WHERE vendor IS NULL OR vendor = '';");
      await pool.query("UPDATE devices SET hostname = LOWER(CONCAT(name, '.cba-chemical.local')) WHERE hostname IS NULL OR hostname = '';");
      await pool.query("UPDATE devices SET installation_date = '2024-01-15' WHERE installation_date IS NULL OR installation_date = '';");
    } catch {}

    // Create device_ports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_ports (
        id VARCHAR(64) PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        port_name VARCHAR(64) NOT NULL,
        port_type VARCHAR(64) NOT NULL DEFAULT 'Ethernet',
        speed VARCHAR(32) NOT NULL DEFAULT '1 Gbps',
        status VARCHAR(32) NOT NULL DEFAULT 'up',
        vlan VARCHAR(32) DEFAULT '1',
        connected_to_device_id VARCHAR(64),
        connected_to_port_name VARCHAR(64),
        cable_id VARCHAR(64),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_id (device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed ports if device_ports is empty
    try {
      const [portRows] = await pool.query('SELECT COUNT(*) as count FROM device_ports;');
      const portCount = (portRows as any[])[0]?.count || 0;
      if (portCount === 0) {
        const [devList] = await pool.query('SELECT id, name, type, ports_total, ports_active FROM devices;');
        for (const dev of devList as any[]) {
          const total = dev.ports_total || 24;
          const active = dev.ports_active || 12;
          for (let i = 1; i <= Math.min(total, 12); i++) {
            const isUp = i <= active;
            await pool.query(`
              INSERT INTO device_ports (id, device_id, port_name, port_type, speed, status, vlan, description)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              `port-${dev.id}-${i}`,
              dev.id,
              `Gi1/0/${i}`,
              'Ethernet',
              '1 Gbps',
              isUp ? 'up' : 'down',
              i % 2 === 0 ? '10' : '20',
              isUp ? `Access drop port to client terminal` : 'Available port'
            ]);
          }
          // SFP uplink ports
          await pool.query(`
            INSERT INTO device_ports (id, device_id, port_name, port_type, speed, status, vlan, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?);
          `, [
            `port-${dev.id}-sfp1`, dev.id, 'SFP1', 'SFP+', '10 Gbps', 'up', 'Trunk', 'Primary backbone trunk uplink',
            `port-${dev.id}-sfp2`, dev.id, 'SFP2', 'SFP+', '10 Gbps', 'down', 'Trunk', 'Secondary standby optical link'
          ]);
        }
      }
    } catch (e: any) {
      console.warn('[MySQL] Notice during ports seeding:', e.message);
    }


    await pool.query(`
      CREATE TABLE IF NOT EXISTS cable_routes (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        type VARCHAR(32) NOT NULL DEFAULT 'fiber',
        from_building_id VARCHAR(64),
        from_building_name VARCHAR(128),
        to_building_id VARCHAR(64),
        to_building_name VARCHAR(128),
        path_coords_json LONGTEXT NOT NULL,
        total_cores INT DEFAULT 12,
        used_cores INT DEFAULT 6,
        status VARCHAR(32) NOT NULL DEFAULT 'normal',
        length_meters DECIMAL(10, 2) DEFAULT 0.00,
        bandwidth VARCHAR(32) DEFAULT '10 Gbps',
        attenuation_db DECIMAL(5, 2) DEFAULT 0.50,
        color VARCHAR(32) DEFAULT NULL,
        line_width DECIMAL(4, 1) DEFAULT 3.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await pool.query('ALTER TABLE cable_routes ADD COLUMN color VARCHAR(32) DEFAULT NULL;');
    } catch {}
    try {
      await pool.query('ALTER TABLE cable_routes ADD COLUMN line_width DECIMAL(4, 1) DEFAULT 3.0;');
    } catch {}
    try {
      await pool.query('ALTER TABLE cable_routes ADD COLUMN core_allocations_json LONGTEXT DEFAULT NULL;');
    } catch {}

    // Backfill core_allocations_json for existing cable routes
    try {
      const [existingCables]: any = await pool.query('SELECT id, code, from_building_name, to_building_name, total_cores, used_cores, status, core_allocations_json FROM cable_routes;');
      if (existingCables && existingCables.length > 0) {
        for (const row of existingCables) {
          let hasCores = false;
          try {
            const parsed = typeof row.core_allocations_json === 'string' ? JSON.parse(row.core_allocations_json) : row.core_allocations_json;
            if (Array.isArray(parsed) && parsed.length > 0) hasCores = true;
          } catch {
            hasCores = false;
          }

          if (!hasCores) {
            const cores = buildDefaultCoreAllocations(
              row.code,
              row.from_building_name || 'Orig',
              row.to_building_name || 'Dest',
              Number(row.total_cores) || 12,
              Number(row.used_cores) || 6,
              row.status || 'active'
            );
            await pool.query('UPDATE cable_routes SET core_allocations_json = ? WHERE id = ?;', [JSON.stringify(cores), row.id]);
          }
        }
      }
    } catch (backfillErr: any) {
      console.warn('[MySQL] Cable core allocations backfill notice:', backfillErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'open',
        building_id VARCHAR(64),
        building_name VARCHAR(128),
        device_id VARCHAR(64)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure alerts columns
    const alertCols = [
      { name: 'category', type: "VARCHAR(64) DEFAULT 'network'" },
      { name: 'acknowledged_by', type: "VARCHAR(128) DEFAULT NULL" },
      { name: 'acknowledged_at', type: "TIMESTAMP NULL DEFAULT NULL" },
      { name: 'resolved_by', type: "VARCHAR(128) DEFAULT NULL" },
      { name: 'resolved_at', type: "TIMESTAMP NULL DEFAULT NULL" },
      { name: 'resolution_notes', type: "TEXT DEFAULT NULL" },
      { name: 'ticket_id', type: "VARCHAR(64) DEFAULT NULL" }
    ];
    for (const col of alertCols) {
      try {
        await pool.query(`ALTER TABLE alerts ADD COLUMN ${col.name} ${col.type};`);
      } catch {}
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id VARCHAR(64) PRIMARY KEY,
        ticket_no VARCHAR(64) UNIQUE NOT NULL,
        title VARCHAR(128) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'open',
        building_id VARCHAR(64),
        device_id VARCHAR(64),
        assigned_to VARCHAR(128),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(64),
        latency_ms DECIMAL(8, 2) NOT NULL,
        packet_loss DECIMAL(5, 2) NOT NULL,
        cpu_load DECIMAL(5, 2) NOT NULL,
        upload_mbps DECIMAL(8, 2) NOT NULL,
        download_mbps DECIMAL(8, 2) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'online',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS racks (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        code VARCHAR(64) NOT NULL,
        building_id VARCHAR(64),
        room VARCHAR(128),
        u_capacity INT DEFAULT 42,
        used_u INT DEFAULT 0,
        device_ids_json LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure racks columns
    const rackCols = [
      { name: 'building_name', type: 'VARCHAR(128)' },
      { name: 'max_power_watts', type: 'INT DEFAULT 3500' },
      { name: 'current_power_watts', type: 'INT DEFAULT 650' },
      { name: 'max_weight_kg', type: 'INT DEFAULT 800' },
      { name: 'status', type: "VARCHAR(32) DEFAULT 'active'" },
      { name: 'description', type: 'TEXT' }
    ];
    for (const col of rackCols) {
      try {
        await pool.query(`ALTER TABLE racks ADD COLUMN ${col.name} ${col.type};`);
      } catch {}
    }

    try {
      await pool.query("UPDATE devices SET rack_u_position = 40, rack_u_height = 1, rack_id = 'rack-ku-01' WHERE id = 'dev-fw-ku-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
      await pool.query("UPDATE devices SET rack_u_position = 38, rack_u_height = 2, rack_id = 'rack-ku-01' WHERE id = 'dev-sw-ku-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
      await pool.query("UPDATE devices SET rack_u_position = 20, rack_u_height = 1, rack_id = 'rack-a-01' WHERE id = 'dev-sw-a-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
      await pool.query("UPDATE devices SET rack_u_position = 20, rack_u_height = 1, rack_id = 'rack-b-01' WHERE id = 'dev-sw-b-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
      await pool.query("UPDATE devices SET rack_u_position = 20, rack_u_height = 1, rack_id = 'rack-c-01' WHERE id = 'dev-sw-c-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
      await pool.query("UPDATE devices SET rack_u_position = 20, rack_u_height = 1, rack_id = 'rack-d-01' WHERE id = 'dev-sw-d-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
      await pool.query("UPDATE devices SET rack_u_position = 16, rack_u_height = 1, rack_id = 'rack-mtc-01' WHERE id = 'dev-sw-mtc-01' AND (rack_u_position IS NULL OR rack_u_position = 0);");
    } catch {}

    // Ensure maintenance_tickets columns
    const ticketCols = [
      { name: 'asset_type', type: "VARCHAR(64) DEFAULT 'Device'" },
      { name: 'asset_id', type: 'VARCHAR(64)' },
      { name: 'asset_name', type: 'VARCHAR(128)' },
      { name: 'cable_route_id', type: 'VARCHAR(64)' },
      { name: 'scheduled_date', type: 'VARCHAR(64)' },
      { name: 'due_date', type: 'VARCHAR(64)' },
      { name: 'resolution', type: 'TEXT' },
      { name: 'root_cause', type: 'TEXT' },
      { name: 'action_taken', type: 'TEXT' },
      { name: 'completed_date', type: 'VARCHAR(64)' },
      { name: 'technician_notes', type: 'TEXT' },
      { name: 'attachments_json', type: 'LONGTEXT' },
      { name: 'timeline_json', type: 'LONGTEXT' }
    ];
    for (const col of ticketCols) {
      try {
        await pool.query(`ALTER TABLE maintenance_tickets ADD COLUMN ${col.name} ${col.type};`);
      } catch {}
    }

    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        username VARCHAR(64) NOT NULL,
        user_role VARCHAR(32) NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64),
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_time (created_at),
        INDEX idx_audit_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create network_links table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS network_links (
        id VARCHAR(64) PRIMARY KEY,
        source_device_id VARCHAR(64) NOT NULL,
        source_port_name VARCHAR(64) NOT NULL,
        target_device_id VARCHAR(64) NOT NULL,
        target_port_name VARCHAR(64) NOT NULL,
        cable_id VARCHAR(64),
        cable_code VARCHAR(64) NOT NULL,
        link_type VARCHAR(64) DEFAULT 'Trunk',
        speed VARCHAR(32) DEFAULT '10 Gbps',
        bandwidth VARCHAR(32) DEFAULT '10 Gbps',
        vlan VARCHAR(32) DEFAULT 'Trunk',
        status VARCHAR(32) DEFAULT 'up',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_source (source_device_id),
        INDEX idx_target (target_device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create cable_connections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cable_connections (
        id VARCHAR(64) PRIMARY KEY,
        cable_route_id VARCHAR(64) NOT NULL,
        cable_code VARCHAR(64) NOT NULL,
        from_device_id VARCHAR(64),
        from_port_name VARCHAR(64),
        to_device_id VARCHAR(64),
        to_port_name VARCHAR(64),
        connection_type VARCHAR(64) DEFAULT 'Core 1-2 Tx/Rx',
        status VARCHAR(32) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Performance Indexes
    const perfIndexes = [
      'CREATE INDEX idx_dev_code ON devices(code);',
      'CREATE INDEX idx_dev_ip ON devices(ip);',
      'CREATE INDEX idx_dev_status ON devices(status);',
      'CREATE INDEX idx_bld_code ON buildings(code);',
      'CREATE INDEX idx_cable_code ON cable_routes(code);',
      'CREATE INDEX idx_ticket_no ON maintenance_tickets(ticket_no);',
      'CREATE INDEX idx_ticket_status ON maintenance_tickets(status);'
    ];
    for (const idxSql of perfIndexes) {
      try {
        await pool.query(idxSql);
      } catch {}
    }

    // Seed network_links if empty
    try {
      const [linksCountRows] = await pool.query('SELECT COUNT(*) as count FROM network_links;');
      const lCount = (linksCountRows as any[])[0]?.count || 0;
      if (lCount === 0) {
        const seedLinks = [
          { id: 'lnk-01', source_device_id: 'dev-fw-ku-01', source_port_name: 'SFP1', target_device_id: 'dev-sw-ku-01', target_port_name: 'SFP1', cable_id: 'cab-fo-isp', cable_code: 'FO-ISP-01', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-02', source_device_id: 'dev-sw-ku-01', source_port_name: 'SFP1', target_device_id: 'dev-sw-a-01', target_port_name: 'SFP1', cable_id: 'cab-fo-001', cable_code: 'FO-001', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-03', source_device_id: 'dev-sw-ku-01', source_port_name: 'SFP2', target_device_id: 'dev-sw-b-01', target_port_name: 'SFP1', cable_id: 'cab-fo-002', cable_code: 'FO-002', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-04', source_device_id: 'dev-sw-ku-01', source_port_name: 'SFP3', target_device_id: 'dev-sw-d-01', target_port_name: 'SFP1', cable_id: 'cab-fo-003', cable_code: 'FO-003', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'warning' },
          { id: 'lnk-05', source_device_id: 'dev-sw-b-01', source_port_name: 'SFP2', target_device_id: 'dev-sw-f-01', target_port_name: 'SFP1', cable_id: 'cab-fo-004', cable_code: 'FO-004', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-06', source_device_id: 'dev-sw-d-01', source_port_name: 'SFP2', target_device_id: 'dev-sw-c-01', target_port_name: 'SFP1', cable_id: 'cab-fo-005', cable_code: 'FO-005', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-07', source_device_id: 'dev-sw-d-01', source_port_name: 'SFP3', target_device_id: 'dev-sw-e-01', target_port_name: 'SFP1', cable_id: 'cab-fo-003-ext', cable_code: 'FO-003-Ext', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-08', source_device_id: 'dev-sw-ku-01', source_port_name: 'SFP4', target_device_id: 'dev-sw-h-01', target_port_name: 'SFP1', cable_id: 'cab-fo-003', cable_code: 'FO-003', link_type: 'Trunk', speed: '10 Gbps', bandwidth: '10 Gbps', status: 'up' },
          { id: 'lnk-09', source_device_id: 'dev-sw-f-01', source_port_name: 'Gi1/0/1', target_device_id: 'dev-sw-j-01', target_port_name: 'Gi1/0/1', cable_id: 'cab-utp-002', cable_code: 'UTP-002', link_type: 'Access', speed: '1 Gbps', bandwidth: '1 Gbps', status: 'up' },
          { id: 'lnk-10', source_device_id: 'dev-sw-ku-01', source_port_name: 'Gi1/0/10', target_device_id: 'dev-sw-mtc-01', target_port_name: 'Gi1/0/1', cable_id: 'cab-utp-mtc', cable_code: 'UTP-MTC-01', link_type: 'Trunk', speed: '1 Gbps', bandwidth: '1 Gbps', status: 'up' }
        ];

        for (const l of seedLinks) {
          await pool.query(`
            INSERT INTO network_links (id, source_device_id, source_port_name, target_device_id, target_port_name, cable_id, cable_code, link_type, speed, bandwidth, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `, [l.id, l.source_device_id, l.source_port_name, l.target_device_id, l.target_port_name, l.cable_id, l.cable_code, l.link_type, l.speed, l.bandwidth, l.status]);
        }
      }
    } catch (linkErr: any) {
      console.warn('[MySQL] Notice during network links seed:', linkErr.message);
    }

    // 4. Seed if empty and not explicitly marked as seeded
    let hasBeenSeeded = false;
    try {
      const [seedRows]: any = await pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'map_seeded';"
      );
      if (seedRows && seedRows.length > 0) {
        const val = seedRows[0].setting_value;
        hasBeenSeeded = val === 'true' || val === '"true"' || val === true;
      }
    } catch (e: any) {
      console.warn('[MySQL] Notice checking map_seeded setting:', e.message);
    }

    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM buildings;');
    const bldCount = (countRows as any[])[0]?.count || 0;
    if (bldCount === 0 && !hasBeenSeeded) {
      await seedDatabase(pool);
    }

    console.log('[MySQL] Database and tables ready.');
  } catch (err: any) {
    console.error('[MySQL] Database initialization error:', err.message);
    throw err;
  }
}

export async function seedDatabase(p?: mysql.Pool) {
  if (!p) {
    if (!pool) await initDatabase();
    p = pool;
  }
  console.log('[MySQL] Seeding Section 22 demo data for PT. CBA Chemical Industry...');

  // Users
  const adminHash = hashPassword('admin123');
  const engineerHash = hashPassword('engineer123');
  const viewerHash = hashPassword('viewer123');
  await p.query(`
    INSERT IGNORE INTO users (id, username, email, password, full_name, role) VALUES
    ('usr-1', 'admin', 'admin@cba-chemical.co.id', ?, 'Admin IT CBA', 'admin'),
    ('usr-2', 'engineer', 'engineer@cba-chemical.co.id', ?, 'Budi Santoso', 'engineer'),
    ('usr-3', 'viewer', 'viewer@cba-chemical.co.id', ?, 'Operator Pabrik', 'viewer');
  `, [adminHash, engineerHash, viewerHash]);

  // Buildings (KU, MTC, A, B, C, D, E, F, H, J) - Calibrated strictly to cba_layout_3d.jpg
  const buildings = [
    {
      id: 'bld-ku',
      name: 'Kantor Utama',
      code: 'KU',
      category: 'office',
      coords: [{ x: 322, y: 414 }, { x: 386, y: 414 }, { x: 386, y: 462 }, { x: 322, y: 462 }],
      center: { x: 354, y: 438 },
      status: 'healthy',
      head_it: 'Budi Santoso (Head IT)',
      total_devices: 12,
      racks_count: 2,
      description: 'Kantor Direksi, Server Room Utama & Manajemen PT. CBA Chemical Industry.',
      lokasi: 'Area Administrasi Depan',
      koordinat: 'X: 354, Y: 438',
      main_switch: 'SW-KU-01',
      ap_count: 6,
      port_count: 48,
      connected_users: 45,
      backbone_from: 'ISP Primary Fiber (Drop In)',
      backbone_cable: 'FO-ISP-01',
      backbone_core: '24 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-mtc',
      name: 'Kantor MTC',
      code: 'MTC',
      category: 'office',
      coords: [{ x: 232, y: 436 }, { x: 268, y: 436 }, { x: 268, y: 472 }, { x: 232, y: 472 }],
      center: { x: 250, y: 454 },
      status: 'healthy',
      head_it: 'Tim MTC IT',
      total_devices: 4,
      racks_count: 1,
      description: 'Kantor Divisi Maintenance, Kalibrasi Alat & Workshop Mekanik Pabrik.',
      lokasi: 'Area Workshop Selatan',
      koordinat: 'X: 250, Y: 454',
      main_switch: 'SW-MTC-01',
      ap_count: 2,
      port_count: 16,
      connected_users: 8,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'UTP-MTC-01',
      backbone_core: '8 Core',
      backbone_speed: '1 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-a',
      name: 'Gedung A',
      code: 'A',
      category: 'production',
      coords: [{ x: 276, y: 444 }, { x: 312, y: 444 }, { x: 312, y: 532 }, { x: 276, y: 532 }],
      center: { x: 294, y: 504 },
      status: 'healthy',
      head_it: 'Agus P.',
      total_devices: 6,
      racks_count: 1,
      description: 'Gudang barang jadi & lini pengemasan formulasi herbisida/pestisida.',
      lokasi: 'Area Produksi Selatan',
      koordinat: 'X: 294, Y: 504',
      main_switch: 'SW-A-01',
      ap_count: 4,
      port_count: 24,
      connected_users: 18,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-001',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-b',
      name: 'Gedung B',
      code: 'B',
      category: 'warehouse',
      coords: [{ x: 198, y: 110 }, { x: 244, y: 110 }, { x: 244, y: 174 }, { x: 198, y: 174 }],
      center: { x: 221, y: 142 },
      status: 'healthy',
      head_it: 'Bambang S.',
      total_devices: 6,
      racks_count: 1,
      description: 'Gudang Bahan Baku Utama & Transit Raw Material Kimia.',
      lokasi: 'Area Gudang Utara',
      koordinat: 'X: 221, Y: 142',
      main_switch: 'SW-B-01',
      ap_count: 3,
      port_count: 24,
      connected_users: 14,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-002',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-c',
      name: 'Gedung C',
      code: 'C',
      category: 'production',
      coords: [{ x: 304, y: 316 }, { x: 388, y: 316 }, { x: 388, y: 378 }, { x: 304, y: 378 }],
      center: { x: 346, y: 347 },
      status: 'healthy',
      head_it: 'Ahmad Fauzi',
      total_devices: 6,
      racks_count: 1,
      description: 'Line ekstrusi & produksi plastik mulsa pertanian modern.',
      lokasi: 'Area Produksi Mulsa',
      koordinat: 'X: 346, Y: 347',
      main_switch: 'SW-C-01',
      ap_count: 3,
      port_count: 24,
      connected_users: 16,
      backbone_from: 'Gedung D (SW-D-01)',
      backbone_cable: 'FO-005',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-d',
      name: 'Gedung D',
      code: 'D',
      category: 'production',
      coords: [{ x: 296, y: 218 }, { x: 390, y: 218 }, { x: 390, y: 316 }, { x: 296, y: 316 }],
      center: { x: 343, y: 266 },
      status: 'warning',
      head_it: 'Dedi Kurniawan',
      total_devices: 8,
      racks_count: 1,
      description: 'Pabrik blowing botol kemasan pestisida & laboratorium QC.',
      lokasi: 'Area Formulasi Timur',
      koordinat: 'X: 343, Y: 266',
      main_switch: 'SW-D-01',
      ap_count: 4,
      port_count: 24,
      connected_users: 22,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-003',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Warning',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-e',
      name: 'Gedung E',
      code: 'E',
      category: 'production',
      coords: [{ x: 236, y: 216 }, { x: 288, y: 216 }, { x: 288, y: 326 }, { x: 236, y: 326 }],
      center: { x: 262, y: 284 },
      status: 'healthy',
      head_it: 'Syaiful R.',
      total_devices: 7,
      racks_count: 1,
      description: 'Area pencampuran & formulasi produk fungisida dan herbisida cair.',
      lokasi: 'Area Mixing Pestisida',
      koordinat: 'X: 262, Y: 284',
      main_switch: 'SW-E-01',
      ap_count: 3,
      port_count: 24,
      connected_users: 16,
      backbone_from: 'Gedung D (SW-D-01)',
      backbone_cable: 'FO-003-Ext',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-f',
      name: 'Gedung F',
      code: 'F',
      category: 'warehouse',
      coords: [{ x: 172, y: 206 }, { x: 234, y: 206 }, { x: 234, y: 308 }, { x: 172, y: 308 }],
      center: { x: 203, y: 242 },
      status: 'healthy',
      head_it: 'Hendra S.',
      total_devices: 5,
      racks_count: 1,
      description: 'Gudang penyimpanan stok hasil kemasan produk siap distribusi.',
      lokasi: 'Area Pergudangan Tengah',
      koordinat: 'X: 203, Y: 242',
      main_switch: 'SW-F-01',
      ap_count: 2,
      port_count: 24,
      connected_users: 10,
      backbone_from: 'Gedung B (SW-B-01)',
      backbone_cable: 'FO-004',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-h',
      name: 'Gedung H',
      code: 'H',
      category: 'production',
      coords: [{ x: 264, y: 114 }, { x: 314, y: 114 }, { x: 314, y: 210 }, { x: 264, y: 210 }],
      center: { x: 289, y: 162 },
      status: 'healthy',
      head_it: 'Bambang S.',
      total_devices: 7,
      racks_count: 1,
      description: 'Area perakitan sprayer & komponen alsintan pertanian CBA.',
      lokasi: 'Area Assembling Utara',
      koordinat: 'X: 289, Y: 162',
      main_switch: 'SW-H-01',
      ap_count: 4,
      port_count: 24,
      connected_users: 20,
      backbone_from: 'Kantor Utama (SW-KU-01)',
      backbone_cable: 'FO-003',
      backbone_core: '12 Core',
      backbone_speed: '10 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'bld-j',
      name: 'Gedung J',
      code: 'J',
      category: 'warehouse',
      coords: [{ x: 24, y: 212 }, { x: 98, y: 212 }, { x: 98, y: 284 }, { x: 24, y: 284 }],
      center: { x: 61, y: 248 },
      status: 'healthy',
      head_it: 'Rudi H.',
      total_devices: 5,
      racks_count: 1,
      description: 'Gudang logistik barat & terminal bongkar muat armada truk pabrik.',
      lokasi: 'Area Logistik Barat',
      koordinat: 'X: 61, Y: 248',
      main_switch: 'SW-J-01',
      ap_count: 3,
      port_count: 16,
      connected_users: 9,
      backbone_from: 'Gedung F (SW-F-01)',
      backbone_cable: 'UTP-001',
      backbone_core: '8 Core',
      backbone_speed: '1 Gbps',
      backbone_status: 'Active',
      image_url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop&q=80'
    }
  ];

  for (const b of buildings) {
    await p.query(`
      INSERT INTO buildings 
      (id, name, code, category, coords_json, center_json, status, head_it, total_devices, racks_count, description, lokasi, koordinat, main_switch, ap_count, port_count, connected_users, backbone_from, backbone_cable, backbone_core, backbone_speed, backbone_status, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `, [
      b.id, b.name, b.code, b.category,
      JSON.stringify(b.coords), JSON.stringify(b.center),
      b.status, b.head_it, b.total_devices, b.racks_count,
      b.description, b.lokasi, b.koordinat, b.main_switch,
      b.ap_count, b.port_count, b.connected_users,
      b.backbone_from, b.backbone_cable, b.backbone_core, b.backbone_speed, b.backbone_status,
      b.image_url
    ]);
  }

  // Devices: Left completely empty so user can add manual devices from a clean slate
  const devices: any[] = [];

  // Cable Routes - Calibrated strictly to cba_layout_3d.jpg
  const cables = [
    {
      id: 'cab-fo-001',
      code: 'FO-001',
      name: 'Backbone FO: Kantor Utama → Gedung A',
      type: 'fiber',
      from_building_id: 'bld-ku',
      from_building_name: 'Kantor Utama',
      to_building_id: 'bld-a',
      to_building_name: 'Gedung A',
      path: [
        { x: 354, y: 438 },
        { x: 316, y: 438 },
        { x: 316, y: 504 },
        { x: 294, y: 504 }
      ],
      total_cores: 12,
      used_cores: 8,
      status: 'active',
      length_meters: 95.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.35,
      color: '#06b6d4',
      line_width: 2.5
    },
    {
      id: 'cab-fo-002',
      code: 'FO-002',
      name: 'Backbone FO: Kantor Utama → Gedung B',
      type: 'fiber',
      from_building_id: 'bld-ku',
      from_building_name: 'Kantor Utama',
      to_building_id: 'bld-b',
      to_building_name: 'Gedung B',
      path: [
        { x: 354, y: 438 },
        { x: 316, y: 395 },
        { x: 306, y: 220 },
        { x: 221, y: 220 },
        { x: 221, y: 142 }
      ],
      total_cores: 12,
      used_cores: 8,
      status: 'active',
      length_meters: 280.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.42,
      color: '#06b6d4',
      line_width: 2.5
    },
    {
      id: 'cab-fo-003',
      code: 'FO-003',
      name: 'Backbone FO: Kantor Utama → Gedung D',
      type: 'fiber',
      from_building_id: 'bld-ku',
      from_building_name: 'Kantor Utama',
      to_building_id: 'bld-d',
      to_building_name: 'Gedung D',
      path: [
        { x: 354, y: 438 },
        { x: 316, y: 395 },
        { x: 316, y: 266 },
        { x: 343, y: 266 }
      ],
      total_cores: 12,
      used_cores: 6,
      status: 'degraded',
      length_meters: 195.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.85,
      color: '#f59e0b',
      line_width: 2.5
    },
    {
      id: 'cab-fo-004',
      code: 'FO-004',
      name: 'Dist Link: Gedung B → Gedung F',
      type: 'fiber',
      from_building_id: 'bld-b',
      from_building_name: 'Gedung B',
      to_building_id: 'bld-f',
      to_building_name: 'Gedung F',
      path: [
        { x: 221, y: 142 },
        { x: 221, y: 220 },
        { x: 203, y: 220 },
        { x: 203, y: 242 }
      ],
      total_cores: 12,
      used_cores: 6,
      status: 'active',
      length_meters: 140.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.38,
      color: '#06b6d4',
      line_width: 2.5
    },
    {
      id: 'cab-fo-005',
      code: 'FO-005',
      name: 'Distribution FO: Gedung D → Gedung C',
      type: 'fiber',
      from_building_id: 'bld-d',
      from_building_name: 'Gedung D',
      to_building_id: 'bld-c',
      to_building_name: 'Gedung C',
      path: [
        { x: 343, y: 266 },
        { x: 316, y: 266 },
        { x: 316, y: 347 },
        { x: 346, y: 347 }
      ],
      total_cores: 12,
      used_cores: 8,
      status: 'active',
      length_meters: 125.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.32,
      color: '#06b6d4',
      line_width: 2.5
    },
    {
      id: 'cab-utp-001',
      code: 'UTP-001',
      name: 'UTP Link: Gedung F → Gedung J',
      type: 'utp',
      from_building_id: 'bld-f',
      from_building_name: 'Gedung F',
      to_building_id: 'bld-j',
      to_building_name: 'Gedung J',
      path: [
        { x: 203, y: 242 },
        { x: 135, y: 242 },
        { x: 61, y: 248 }
      ],
      total_cores: 8,
      used_cores: 8,
      status: 'active',
      length_meters: 175.0,
      bandwidth: '1 Gbps',
      attenuation_db: 0.45,
      color: '#10b981',
      line_width: 2.0
    },
    {
      id: 'cab-utp-mtc',
      code: 'UTP-MTC-01',
      name: 'UTP MTC Link: Gedung A → Kantor MTC',
      type: 'utp',
      from_building_id: 'bld-a',
      from_building_name: 'Gedung A',
      to_building_id: 'bld-mtc',
      to_building_name: 'Kantor MTC',
      path: [
        { x: 294, y: 504 },
        { x: 274, y: 504 },
        { x: 274, y: 454 },
        { x: 250, y: 454 }
      ],
      total_cores: 8,
      used_cores: 8,
      status: 'active',
      length_meters: 80.0,
      bandwidth: '1 Gbps',
      attenuation_db: 0.40,
      color: '#10b981',
      line_width: 2.0
    },
    {
      id: 'cab-internet-in',
      code: 'FO-ISP-01',
      name: 'Internet Drop Line ISP Primary',
      type: 'backbone',
      from_building_id: 'internet-drop',
      from_building_name: 'ISP Gate',
      to_building_id: 'bld-ku',
      to_building_name: 'Kantor Utama',
      path: [
        { x: 412, y: 72 },
        { x: 405, y: 280 },
        { x: 375, y: 395 },
        { x: 354, y: 438 }
      ],
      total_cores: 24,
      used_cores: 12,
      status: 'active',
      length_meters: 450.0,
      bandwidth: '10 Gbps',
      attenuation_db: 0.28,
      color: '#f97316',
      line_width: 3.5
    }
  ];

  for (const c of cables) {
    const defaultCores = buildDefaultCoreAllocations(c.code, c.from_building_name, c.to_building_name, c.total_cores, c.used_cores, c.status);
    await p.query(`
      INSERT INTO cable_routes
      (id, code, name, type, from_building_id, from_building_name, to_building_id, to_building_name, path_coords_json, total_cores, used_cores, status, length_meters, bandwidth, attenuation_db, color, line_width, core_allocations_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        path_coords_json = VALUES(path_coords_json),
        color = VALUES(color),
        line_width = VALUES(line_width),
        core_allocations_json = COALESCE(cable_routes.core_allocations_json, VALUES(core_allocations_json));
    `, [
      c.id, c.code, c.name, c.type,
      c.from_building_id, c.from_building_name,
      c.to_building_id, c.to_building_name,
      JSON.stringify(c.path),
      c.total_cores, c.used_cores, c.status,
      c.length_meters, c.bandwidth, c.attenuation_db,
      c.color, c.line_width,
      JSON.stringify(defaultCores)
    ]);
  }

  // Backfill existing rows where core_allocations_json is empty or NULL
  try {
    const [existingCables]: any = await p.query('SELECT id, code, from_building_name, to_building_name, total_cores, used_cores, status FROM cable_routes WHERE core_allocations_json IS NULL OR core_allocations_json = "";');
    if (existingCables && existingCables.length > 0) {
      for (const row of existingCables) {
        const cores = buildDefaultCoreAllocations(
          row.code,
          row.from_building_name || 'Orig',
          row.to_building_name || 'Dest',
          Number(row.total_cores) || 12,
          Number(row.used_cores) || 6,
          row.status || 'active'
        );
        await p.query('UPDATE cable_routes SET core_allocations_json = ? WHERE id = ?;', [JSON.stringify(cores), row.id]);
      }
    }
  } catch (err: any) {
    console.warn('[MySQL] Cable core allocations backfill notice:', err.message);
  }

  // Racks (Data Center & Distribution Cabinets)
  const racks = [
    { 
      id: 'rack-ku-01', 
      name: 'Rack Server Utama (HQ 42U)', 
      code: 'RACK-KU-01', 
      building_id: 'bld-ku', 
      building_name: 'Kantor Utama', 
      room: 'Core Server Room (Lt. 1)', 
      u_capacity: 42, 
      used_u: 14, 
      max_power_watts: 4500,
      current_power_watts: 1850,
      max_weight_kg: 900,
      status: 'active',
      description: 'Main Data Center Cabinet untuk Perimeter Firewall, Core Switch 10G, dan Server Storage.',
      device_ids: ['dev-fw-ku-01', 'dev-sw-ku-01'] 
    },
    { 
      id: 'rack-a-01', 
      name: 'Rack Distribution A (24U)', 
      code: 'RACK-A-01', 
      building_id: 'bld-a', 
      building_name: 'Gedung A', 
      room: 'Panel IT Gudang CF', 
      u_capacity: 24, 
      used_u: 6, 
      max_power_watts: 2000,
      current_power_watts: 320,
      max_weight_kg: 500,
      status: 'active',
      description: 'Wallmount distribution rack untuk melayani area Gudang CF dan drop line Kantor MTC.',
      device_ids: ['dev-sw-a-01'] 
    },
    { 
      id: 'rack-b-01', 
      name: 'Rack Distribution B (24U)', 
      code: 'RACK-B-01', 
      building_id: 'bld-b', 
      building_name: 'Gedung B', 
      room: 'Panel Gudang Bahan Baku', 
      u_capacity: 24, 
      used_u: 5, 
      max_power_watts: 2000,
      current_power_watts: 280,
      max_weight_kg: 500,
      status: 'active',
      description: 'Kabinet distribusi optik FO-002 backbone dari Kantor Utama.',
      device_ids: ['dev-sw-b-01'] 
    },
    { 
      id: 'rack-c-01', 
      name: 'Rack Mulsa C (24U)', 
      code: 'RACK-MULSA-C', 
      building_id: 'bld-c', 
      building_name: 'Gedung C', 
      room: 'Panel IT Mulsa (Produksi)', 
      u_capacity: 24, 
      used_u: 5, 
      max_power_watts: 2000,
      current_power_watts: 290,
      max_weight_kg: 500,
      status: 'active',
      description: 'Kabinet switch distribusi lini produksi mulsa dan sensor PLC.',
      device_ids: ['dev-sw-c-01'] 
    },
    { 
      id: 'rack-d-01', 
      name: 'Rack Gedung D (24U)', 
      code: 'RACK-D-01', 
      building_id: 'bld-d', 
      building_name: 'Gedung D', 
      room: 'Panel IT Ekstrusi', 
      u_capacity: 24, 
      used_u: 8, 
      max_power_watts: 2000,
      current_power_watts: 410,
      max_weight_kg: 500,
      status: 'active',
      description: 'Kabinet utama area ekstrusi CBA, terhubung backbone FO-003 dan ODF.',
      device_ids: ['dev-sw-d-01'] 
    },
    { 
      id: 'rack-mtc-01', 
      name: 'Rack Kantor MTC (18U)', 
      code: 'RACK-MTC-01', 
      building_id: 'bld-mtc', 
      building_name: 'Kantor MTC', 
      room: 'Ruang Server Maintenance', 
      u_capacity: 18, 
      used_u: 4, 
      max_power_watts: 1500,
      current_power_watts: 220,
      max_weight_kg: 400,
      status: 'active',
      description: 'Kabinet switch bengkel maintenance & support technical staff.',
      device_ids: ['dev-sw-mtc-01'] 
    },
    { 
      id: 'rack-e-01', 
      name: 'Rack Distribusi E (24U)', 
      code: 'RACK-E-01', 
      building_id: 'bld-e', 
      building_name: 'Gedung E', 
      room: 'Panel IT Mixing Pestisida', 
      u_capacity: 24, 
      used_u: 4, 
      max_power_watts: 2000,
      current_power_watts: 260,
      max_weight_kg: 500,
      status: 'active',
      description: 'Panel switch industri tahan debu & uap kimiawi formulasi herbisida.',
      device_ids: ['dev-sw-e-01'] 
    },
    { 
      id: 'rack-f-01', 
      name: 'Rack Distribusi F (24U)', 
      code: 'RACK-F-01', 
      building_id: 'bld-f', 
      building_name: 'Gedung F', 
      room: 'Panel Gudang Stok Produk', 
      u_capacity: 24, 
      used_u: 4, 
      max_power_watts: 2000,
      current_power_watts: 250,
      max_weight_kg: 500,
      status: 'active',
      description: 'Panel switch distribusi gudang produk jadi siap kirim.',
      device_ids: ['dev-sw-f-01'] 
    },
    { 
      id: 'rack-h-01', 
      name: 'Rack Distribusi H (24U)', 
      code: 'RACK-H-01', 
      building_id: 'bld-h', 
      building_name: 'Gedung H', 
      room: 'Panel IT Formulasi Insektisida', 
      u_capacity: 24, 
      used_u: 4, 
      max_power_watts: 2000,
      current_power_watts: 270,
      max_weight_kg: 500,
      status: 'active',
      description: 'Panel switch otomasi kontrol valve dan terminal formulasi.',
      device_ids: ['dev-sw-h-01'] 
    },
    { 
      id: 'rack-j-01', 
      name: 'Rack Distribusi J (24U)', 
      code: 'RACK-J-01', 
      building_id: 'bld-j', 
      building_name: 'Gedung J', 
      room: 'Panel IT Quality Control', 
      u_capacity: 24, 
      used_u: 4, 
      max_power_watts: 2000,
      current_power_watts: 240,
      max_weight_kg: 500,
      status: 'active',
      description: 'Panel switch laboratorium analisa kimia dan QC.',
      device_ids: ['dev-sw-j-01'] 
    }
  ];

  for (const r of racks) {
    await p.query(`
      INSERT INTO racks (
        id, name, code, building_id, building_name, room, 
        u_capacity, used_u, max_power_watts, current_power_watts, max_weight_kg, status, description, device_ids_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name),
        building_name=VALUES(building_name),
        room=VALUES(room),
        u_capacity=VALUES(u_capacity),
        used_u=VALUES(used_u),
        max_power_watts=VALUES(max_power_watts),
        current_power_watts=VALUES(current_power_watts),
        status=VALUES(status),
        description=VALUES(description);
    `, [
      r.id, r.name, r.code, r.building_id, r.building_name, r.room,
      r.u_capacity, r.used_u, r.max_power_watts, r.current_power_watts, r.max_weight_kg,
      r.status, r.description, JSON.stringify(r.device_ids)
    ]);
  }

  // Update devices with rack position calibration
  const deviceRackPositions = [
    { id: 'dev-fw-ku-01', rack_id: 'rack-ku-01', u_pos: 40, u_height: 1 },
    { id: 'dev-sw-ku-01', rack_id: 'rack-ku-01', u_pos: 38, u_height: 2 },
    { id: 'dev-sw-a-01', rack_id: 'rack-a-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-b-01', rack_id: 'rack-b-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-c-01', rack_id: 'rack-c-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-d-01', rack_id: 'rack-d-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-e-01', rack_id: 'rack-e-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-f-01', rack_id: 'rack-f-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-h-01', rack_id: 'rack-h-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-j-01', rack_id: 'rack-j-01', u_pos: 20, u_height: 1 },
    { id: 'dev-sw-mtc-01', rack_id: 'rack-mtc-01', u_pos: 15, u_height: 1 }
  ];

  for (const pos of deviceRackPositions) {
    try {
      await p.query(
        'UPDATE devices SET rack_id = ?, rack_u_position = ?, rack_u_height = ? WHERE id = ?;',
        [pos.rack_id, pos.u_pos, pos.u_height, pos.id]
      );
    } catch {}
  }

  // Alerts
  await p.query(`
    INSERT INTO alerts (id, title, message, severity, status, category, building_id, building_name, device_id, time_ago, acknowledged_by) VALUES
    ('alt-1', 'Access Point AP-D-02 tidak merespons', 'Access Point di lini formulasi Gedung D mengalami packet loss 12%.', 'medium', 'open', 'device_offline', 'bld-d', 'Gedung D', 'dev-ap-d-02', '35 menit yang lalu', NULL),
    ('alt-2', 'Kabel FO-003 redaman kritis meningkat', 'Jalur kabel optik FO-003 (Kantor Utama → Gedung D) terdeteksi redaman 3.85 dB melebihi batas toleransi OTDR.', 'critical', 'open', 'fiber_optical', 'bld-d', 'Gedung D', NULL, '1 jam yang lalu', NULL),
    ('alt-3', 'Latensi Backbone Switch Ku-01 Melonjak', 'Core Switch SW-CORE-KU-01 mendeteksi lonjakan latency RTT > 85ms pada sesi sinkronisasi SCADA pabrik.', 'high', 'acknowledged', 'latency_spike', 'bld-ku', 'Kantor Utama', 'dev-sw-ku-01', '2 jam yang lalu', 'Budi Santoso'),
    ('alt-4', 'Beban Daya Server Rack KU-01 Mendekati 85%', 'PDU Rack KU-01 terukur konsumsi 2980 Watt dari kapasitas aman 3500 Watt.', 'medium', 'in_progress', 'power_rack', 'bld-ku', 'Kantor Utama', NULL, '4 jam yang lalu', 'Admin IT CBA'),
    ('alt-5', 'Fluktuasi Uplink SFP+ Gedung C', 'Port SFP2 pada switch SW-DIST-C-01 mengalami flapping status link optical.', 'low', 'resolved', 'network', 'bld-c', 'Gedung C', 'dev-sw-c-01', 'Kemarin', 'Budi Santoso')
    ON DUPLICATE KEY UPDATE 
      category = VALUES(category),
      severity = VALUES(severity);
  `);

  // Initial Maintenance Tickets
  await p.query(`
    INSERT INTO maintenance_tickets (id, ticket_no, title, description, priority, status, building_id, asset_name, assigned_to, due_date) VALUES
    ('tkt-01', 'TKT-2026-088', 'Pemeriksaan Latensi Backbone Drop Substation', 'Investigasi latensi RTT pada SW-UTL-SUB01 Port 24 dan ODF utility.', 'high', 'in_progress', 'bld-h', 'SW-UTL-SUB01 (Port 24)', 'Budi Santoso', '24 Sep 2026'),
    ('tkt-02', 'TKT-2026-085', 'Splicing Ulang Core #4 FO-003', 'Redaman optik mencapai -24.2 dB pada jalur Kantor Utama ke Gedung D.', 'medium', 'in_progress', 'bld-d', 'FO-003 Core Splicing', 'Ahmad Fauzi', '25 Sep 2026'),
    ('tkt-03', 'TKT-2026-082', 'Penggantian Unit Battery UPS Rack KU-01', 'Baterai backup UPS unit 2 Kantor Utama memasuki akhir masa siklus.', 'high', 'scheduled', 'bld-ku', 'UPS-APC-KU-02', 'Budi Santoso', '26 Sep 2026'),
    ('tkt-04', 'TKT-2026-079', 'Cleaning Dust Filter Core Switch KU', 'Pembersihan berkala filter intake udara chassis switch Catalyst 9300.', 'low', 'completed', 'bld-ku', 'SW-KU-01', 'Rian Pratama', '18 Sep 2026'),
    ('tkt-05', 'TKT-2026-074', 'Firmware Upgrade Industrial APs', 'Pembaruan firmware keamanan Aruba AP-515 di area warehouse.', 'medium', 'completed', 'bld-d', 'AP-D-01 / AP-E-01', 'Ahmad Fauzi', '16 Sep 2026')
    ON DUPLICATE KEY UPDATE 
      title = VALUES(title),
      status = VALUES(status);
  `);

  try {
    await p.query(`
      INSERT INTO system_settings (setting_key, setting_value, category, description, updated_by)
      VALUES ('map_seeded', 'true', 'general', 'Status seeding data denah pabrik', 'system')
      ON DUPLICATE KEY UPDATE setting_value = 'true';
    `);
  } catch (err: any) {
    console.warn('[MySQL] Notice setting map_seeded flag:', err.message);
  }

  console.log('[MySQL] Seeding complete.');
}

export async function logAuditEvent(params: {
  userId?: string;
  username: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string | object;
  ipAddress?: string;
}) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details) : (params.details || '');
    await db.query(
      `INSERT INTO audit_logs (id, user_id, username, user_role, action, entity, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.userId || null,
        params.username || 'System',
        params.userRole || 'ADMIN',
        params.action,
        params.entity,
        params.entityId || null,
        detailsStr,
        params.ipAddress || '127.0.0.1'
      ]
    );
  } catch (err: any) {
    console.error('[Audit Log Error]', err.message);
  }
}
