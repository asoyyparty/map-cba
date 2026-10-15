import { Router } from 'express';
import type { Response } from 'express';
import { db, logAuditEvent, seedDatabase } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const settingsRouter = Router();

// Apply authentication to ALL settings routes
settingsRouter.use(authenticateToken);

// Helper to structure key-value records into nested categorized object
function parseSettings(rows: any[]) {
  const result: Record<string, any> = {
    general: {},
    monitoring: {},
    notifications: {},
    backup: {},
    security: {}
  };

  for (const row of rows) {
    let parsedVal = row.setting_value;
    try {
      parsedVal = JSON.parse(row.setting_value);
    } catch {
      parsedVal = row.setting_value;
    }

    const [cat, subKey] = (row.setting_key || '').split('.');
    if (cat && subKey) {
      if (!result[cat]) result[cat] = {};
      result[cat][subKey] = parsedVal;
    } else {
      const category = row.category || 'general';
      if (!result[category]) result[category] = {};
      result[category][row.setting_key] = parsedVal;
    }
  }

  return result;
}

// GET /api/settings - Retrieve all system settings (Authenticated)
settingsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await db.query('SELECT setting_key, setting_value, category, description, updated_at, updated_by FROM system_settings;');
    const structured = parseSettings(rows);

    res.json({
      success: true,
      data: structured,
      raw: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings - Update settings (ADMIN ONLY)
settingsRouter.put('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, settings } = req.body;
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Objek data settings wajib disertakan.' });
    }

    const updatedKeys: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      // Check if key has prefix category
      const fullKey = key.includes('.') ? key : (category ? `${category}.${key}` : key);
      const cat = category || fullKey.split('.')[0] || 'general';
      const serialized = JSON.stringify(value);

      await db.query(`
        INSERT INTO system_settings (setting_key, setting_value, category, updated_by)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          category = VALUES(category),
          updated_by = VALUES(updated_by);
      `, [fullKey, serialized, cat, operatorUser]);

      updatedKeys.push(fullKey);
    }

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'UPDATE_SETTINGS',
      entity: 'system_settings',
      entityId: category || 'general',
      details: {
        category,
        updatedKeys,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Pengaturan sistem berhasil diperbarui.',
      updatedKeys
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings/database-stats - System & database metrics (Authenticated)
settingsRouter.get('/database-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Count rows across all primary tables
    const [devRows, bldRows, cableRows, rackRows, portRows, ticketRows, alertRows, auditRows, userRows]: any = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM devices;'),
      db.query('SELECT COUNT(*) as c FROM buildings;'),
      db.query('SELECT COUNT(*) as c FROM cable_routes;'),
      db.query('SELECT COUNT(*) as c FROM racks;'),
      db.query('SELECT COUNT(*) as c FROM device_ports;'),
      db.query('SELECT COUNT(*) as c FROM maintenance_tickets;'),
      db.query('SELECT COUNT(*) as c FROM alerts;'),
      db.query('SELECT COUNT(*) as c FROM audit_logs;'),
      db.query('SELECT COUNT(*) as c FROM users;')
    ]);

    const devCount = Number(devRows[0]?.c) || 0;
    const bldCount = Number(bldRows[0]?.c) || 0;
    const cableCount = Number(cableRows[0]?.c) || 0;
    const rackCount = Number(rackRows[0]?.c) || 0;
    const portCount = Number(portRows[0]?.c) || 0;
    const ticketCount = Number(ticketRows[0]?.c) || 0;
    const alertCount = Number(alertRows[0]?.c) || 0;
    const auditCount = Number(auditRows[0]?.c) || 0;
    const userCount = Number(userRows[0]?.c) || 0;

    const totalRows = devCount + bldCount + cableCount + rackCount + portCount + ticketCount + alertCount + auditCount + userCount;
    const mem = process.memoryUsage();

    res.json({
      success: true,
      data: {
        databaseName: 'cba_network_map',
        dbEngine: 'MySQL 8.0 / MariaDB (XAMPP)',
        serverHost: '127.0.0.1:3306',
        connectionStatus: 'connected',
        totalRows,
        tables: {
          devices: devCount,
          buildings: bldCount,
          cableRoutes: cableCount,
          racks: rackCount,
          devicePorts: portCount,
          tickets: ticketCount,
          alerts: alertCount,
          auditLogs: auditCount,
          users: userCount
        },
        nodeUptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/backup - Generate instant JSON snapshot backup (ADMIN & IT_ENGINEER)
settingsRouter.post('/backup', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    // Fetch snapshot of all tables
    const [
      buildings,
      devices,
      devicePorts,
      cableRoutes,
      cableConnections,
      networkLinks,
      racks,
      tickets,
      alerts,
      users,
      settings
    ] = await Promise.all([
      db.query('SELECT * FROM buildings;'),
      db.query('SELECT * FROM devices;'),
      db.query('SELECT * FROM device_ports;'),
      db.query('SELECT * FROM cable_routes;'),
      db.query('SELECT * FROM cable_connections;'),
      db.query('SELECT * FROM network_links;'),
      db.query('SELECT * FROM racks;'),
      db.query('SELECT * FROM maintenance_tickets;'),
      db.query('SELECT * FROM alerts;'),
      db.query('SELECT id, username, email, full_name, role, status, department, phone, avatar_url, created_at FROM users;'),
      db.query('SELECT * FROM system_settings;')
    ]);

    const backupPayload = {
      meta: {
        application: 'CBA Network Map',
        company: 'PT. CBA Chemical Industry',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: operatorUser,
        environment: 'Production On-Premise'
      },
      counts: {
        buildings: buildings.length,
        devices: devices.length,
        devicePorts: devicePorts.length,
        cableRoutes: cableRoutes.length,
        cableConnections: cableConnections.length,
        networkLinks: networkLinks.length,
        racks: racks.length,
        maintenanceTickets: tickets.length,
        alerts: alerts.length,
        users: users.length,
        settings: settings.length
      },
      data: {
        buildings,
        devices,
        devicePorts,
        cableRoutes,
        cableConnections,
        networkLinks,
        racks,
        maintenanceTickets: tickets,
        alerts,
        users,
        settings
      }
    };

    // Update last_backup_at setting
    const nowIso = new Date().toISOString();
    await db.query(`
      INSERT INTO system_settings (setting_key, setting_value, category, updated_by)
      VALUES ('backup.last_backup_at', ?, 'backup', ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by);
    `, [JSON.stringify(nowIso), operatorUser]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'TRIGGER_BACKUP',
      entity: 'database',
      entityId: 'cba_network_map',
      details: {
        totalRecords: Object.values(backupPayload.counts).reduce((a, b) => a + b, 0),
        timestamp: nowIso
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `cba-network-map-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backupPayload, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/clear-logs - Purge old audit logs (ADMIN ONLY)
settingsRouter.post('/clear-logs', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { retentionDays = 90 } = req.body;
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    const days = Math.max(7, Number(retentionDays) || 90);
    const [result]: any = await db.execute(
      `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL ? DAY;`,
      [days]
    );

    const deletedCount = result?.affectedRows || 0;

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'PURGE_AUDIT_LOGS',
      entity: 'audit_logs',
      details: {
        retentionDays: days,
        recordsPurged: deletedCount,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: `Pembersihan berhasil. Sebanyak ${deletedCount} baris log audit (> ${days} hari) telah dibersihkan.`,
      purgedCount: deletedCount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/reset-factory-defaults - Restore Section 22 CBA calibrated layout (ADMIN ONLY)
settingsRouter.post('/reset-factory-defaults', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    await seedDatabase();

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'RESET_FACTORY_DEFAULTS',
      entity: 'factory_map',
      details: {
        timestamp: new Date().toISOString(),
        message: 'Reset denah ke data default pabrik CBA'
      }
    });

    res.json({
      success: true,
      message: 'Denah bawaan pabrik PT. CBA Chemical Industry (10 Gedung & 8 Jalur Kabel) berhasil dimuat ulang.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/clear-factory-map - Wipe all buildings and cables cleanly (ADMIN ONLY)
settingsRouter.post('/clear-factory-map', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    // Delete related network assets in proper dependency order
    await db.execute('DELETE FROM network_links;');
    await db.execute('DELETE FROM device_ports;');
    await db.execute('DELETE FROM cable_connections;');
    await db.execute('DELETE FROM cable_routes;');
    await db.execute('DELETE FROM alerts;');
    await db.execute('DELETE FROM devices;');
    await db.execute('DELETE FROM racks;');
    await db.execute('DELETE FROM buildings;');

    // Mark map as seeded so it stays empty on server reboot
    await db.execute(`
      INSERT INTO system_settings (setting_key, setting_value, category, description, updated_by)
      VALUES ('map_seeded', 'true', 'general', 'Status seeding data denah pabrik', ?)
      ON DUPLICATE KEY UPDATE setting_value = 'true';
    `, [operatorUser]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'CLEAR_FACTORY_MAP',
      entity: 'factory_map',
      details: {
        timestamp: new Date().toISOString(),
        message: 'Mengosongkan seluruh gedung dan kabel denah pabrik'
      }
    });

    res.json({
      success: true,
      message: 'Seluruh data denah pabrik (gedung, kabel, dan perangkat terkait) telah berhasil dikosongkan.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
