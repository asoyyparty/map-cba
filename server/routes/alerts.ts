import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const alertsRouter = Router();

// Secure all alert endpoints
alertsRouter.use(authenticateToken);

// GET /api/alerts/summary - KPI Metrics
alertsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const rows: any = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' AND status != 'resolved' THEN 1 ELSE 0 END) as critical_active,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'acknowledged' OR status = 'in_progress' THEN 1 ELSE 0 END) as in_investigation,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM alerts;
    `);

    const firstRow = rows[0] || {};
    const summary = {
      total: Number(firstRow.total) || 0,
      criticalActive: Number(firstRow.critical_active) || 0,
      openCount: Number(firstRow.open_count) || 0,
      inInvestigation: Number(firstRow.in_investigation) || 0,
      resolvedCount: Number(firstRow.resolved_count) || 0
    };

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alerts - List alerts with multi-filtering
alertsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status, severity, category, buildingId } = req.query;
    let query = `
      SELECT 
        id, title, message, severity, status, category,
        building_id, building_name, device_id, time_ago,
        acknowledged_by, acknowledged_at, resolved_by, resolved_at,
        resolution_notes, ticket_id, timestamp
      FROM alerts
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(title) LIKE ? OR LOWER(message) LIKE ? OR LOWER(building_name) LIKE ? OR LOWER(COALESCE(device_id, '')) LIKE ?)`;
      params.push(q, q, q, q);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND LOWER(status) = ?`;
      params.push(status.toLowerCase().trim());
    }

    if (severity && typeof severity === 'string' && severity !== 'all') {
      query += ` AND LOWER(severity) = ?`;
      params.push(severity.toLowerCase().trim());
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND LOWER(category) = ?`;
      params.push(category.toLowerCase().trim());
    }

    if (buildingId && typeof buildingId === 'string' && buildingId !== 'all') {
      query += ` AND building_id = ?`;
      params.push(buildingId.trim());
    }

    query += ` ORDER BY 
      CASE status 
        WHEN 'open' THEN 1 
        WHEN 'acknowledged' THEN 2 
        WHEN 'in_progress' THEN 3 
        WHEN 'resolved' THEN 4 
        ELSE 5 
      END ASC,
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END ASC,
      timestamp DESC;`;

    const rows = await db.query(query, params);
    const alerts = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      status: a.status,
      category: a.category || 'network',
      buildingId: a.building_id,
      buildingName: a.building_name,
      deviceId: a.device_id,
      timeAgo: a.time_ago,
      acknowledgedBy: a.acknowledged_by,
      acknowledgedAt: a.acknowledged_at,
      resolvedBy: a.resolved_by,
      resolvedAt: a.resolved_at,
      resolutionNotes: a.resolution_notes,
      ticketId: a.ticket_id,
      timestamp: a.timestamp
    }));

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alerts/:id - Single alert
alertsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const a = await db.queryOne('SELECT * FROM alerts WHERE id = ? LIMIT 1;', [id]);

    if (!a) {
      return res.status(404).json({ success: false, message: 'Alarm tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        id: a.id,
        title: a.title,
        message: a.message,
        severity: a.severity,
        status: a.status,
        category: a.category || 'network',
        buildingId: a.building_id,
        buildingName: a.building_name,
        deviceId: a.device_id,
        timeAgo: a.time_ago,
        acknowledgedBy: a.acknowledged_by,
        acknowledgedAt: a.acknowledged_at,
        resolvedBy: a.resolved_by,
        resolvedAt: a.resolved_at,
        resolutionNotes: a.resolution_notes,
        ticketId: a.ticket_id,
        timestamp: a.timestamp
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts - Create / Trigger new alert
alertsRouter.post('/', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      id,
      title,
      message,
      severity = 'medium',
      category = 'network',
      buildingId,
      buildingName,
      deviceId
    } = req.body;

    const operatorUser = (req.headers['x-user-name'] as string) || 'System Probe';
    const operatorRole = (req.headers['x-user-role'] as string) || 'ADMIN';

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Field title dan message wajib diisi' });
    }

    const alertId = id || `alt-${Date.now()}`;
    const sql = `
      INSERT INTO alerts (
        id, title, message, severity, status, category,
        building_id, building_name, device_id, time_ago
      )
      VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, 'Baru saja');
    `;

    await db.execute(sql, [
      alertId,
      title.trim(),
      message.trim(),
      severity,
      category,
      buildingId || null,
      buildingName || 'Fasilitas Pabrik',
      deviceId || null
    ]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'CREATE_ALERT',
      entity: 'alerts',
      entityId: alertId,
      details: { title, severity, category, buildingName }
    });

    res.status(201).json({
      success: true,
      message: 'Insiden alarm berhasil didaftarkan.',
      data: {
        id: alertId,
        title,
        message,
        severity,
        status: 'open',
        category,
        buildingId,
        buildingName,
        deviceId
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/alerts/:id/acknowledge - Technician Acknowledges Alert
alertsRouter.put('/:id/acknowledge', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const operatorUser = req.user?.username || req.body.technicianName || 'it-engineer';
    const operatorRole = req.user?.role || 'IT_ENGINEER';

    const existing = await db.queryOne('SELECT * FROM alerts WHERE id = ? LIMIT 1;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alarm tidak ditemukan.' });
    }

    const now = new Date();
    await db.execute(
      `UPDATE alerts SET 
        status = 'acknowledged',
        acknowledged_by = ?,
        acknowledged_at = NOW(),
        time_ago = 'Sedang Ditangani'
      WHERE id = ?;`,
      [operatorUser, id]
    );

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'ACK_ALERT',
      entity: 'alerts',
      entityId: id,
      details: { title: existing.title, acknowledgedBy: operatorUser, time: now.toISOString() }
    });

    res.json({
      success: true,
      message: `Alarm telah ditangani (acknowledged) oleh ${operatorUser}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/alerts/:id/resolve - Resolve Alert with Technical Notes
alertsRouter.put('/:id/resolve', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const operatorUser = req.user?.username || req.body.technicianName || 'it-engineer';
    const operatorRole = req.user?.role || 'IT_ENGINEER';

    const existing = await db.queryOne('SELECT * FROM alerts WHERE id = ? LIMIT 1;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alarm tidak ditemukan.' });
    }

    await db.execute(
      `UPDATE alerts SET 
        status = 'resolved',
        resolved_by = ?,
        resolved_at = NOW(),
        resolution_notes = ?,
        time_ago = 'Telah Diselesaikan'
      WHERE id = ?;`,
      [operatorUser, resolutionNotes || 'Insiden telah diinspeksi dan dinormalkan oleh tim teknisi jaringan.', id]
    );

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'RESOLVE_ALERT',
      entity: 'alerts',
      entityId: id,
      details: { title: existing.title, resolvedBy: operatorUser, resolutionNotes }
    });

    res.json({
      success: true,
      message: `Alarm ${existing.title} berhasil diselesaikan.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/:id/convert-ticket - Escalate alert directly to maintenance ticket
alertsRouter.post('/:id/convert-ticket', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      priority = 'HIGH',
      assignedTo = 'Budi Santoso',
      scheduledDate,
      dueDate,
      additionalNotes = ''
    } = req.body;

    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    const alert = await db.queryOne('SELECT * FROM alerts WHERE id = ? LIMIT 1;', [id]);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alarm tidak ditemukan.' });
    }

    // Generate ticket number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNo = `TICK-${dateStr}-${randomSuffix}`;
    const ticketId = `ticket-${Date.now()}`;

    const ticketTitle = `[ESKALASI ALARM] ${alert.title}`;
    const ticketDesc = `${alert.message}\n\nDikonversi otomatis dari Alarm Insiden ID: ${alert.id}\nKategori: ${alert.category || 'Jaringan'}\n${additionalNotes ? `Catatan Tambahan: ${additionalNotes}` : ''}`;

    await db.query(`
      INSERT INTO maintenance_tickets (
        id, ticket_no, title, description, priority, status,
        building_id, device_id, assigned_to, scheduled_date, due_date
      )
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?);
    `, [
      ticketId,
      ticketNo,
      ticketTitle,
      ticketDesc,
      priority,
      alert.building_id || null,
      alert.device_id || null,
      assignedTo,
      scheduledDate || new Date().toISOString().split('T')[0],
      dueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
    ]);

    // Update alert status to in_progress and link ticket_id
    await db.execute(
      `UPDATE alerts SET 
        status = 'in_progress',
        ticket_id = ?,
        acknowledged_by = COALESCE(acknowledged_by, ?),
        acknowledged_at = COALESCE(acknowledged_at, NOW()),
        time_ago = 'Tiket Diterbitkan'
      WHERE id = ?;`,
      [ticketNo, operatorUser, id]
    );

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'ESCALATE_ALERT_TO_TICKET',
      entity: 'alerts',
      entityId: id,
      details: {
        alertTitle: alert.title,
        createdTicketNo: ticketNo,
        assignedTo,
        priority
      }
    });

    res.status(201).json({
      success: true,
      message: `Alarm berhasil dieskalasikan ke Tiket Pemeliharaan ${ticketNo}.`,
      ticket: {
        id: ticketId,
        ticketNo,
        title: ticketTitle,
        assignedTo,
        status: 'open'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/alerts/:id - Delete alert
alertsRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    if (operatorRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Hanya Administrator yang berhak menghapus alarm.'
      });
    }

    const existing = await db.queryOne('SELECT * FROM alerts WHERE id = ? LIMIT 1;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alarm tidak ditemukan.' });
    }

    await db.execute('DELETE FROM alerts WHERE id = ?;', [id]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'DELETE_ALERT',
      entity: 'alerts',
      entityId: id,
      details: { title: existing.title, severity: existing.severity }
    });

    res.json({
      success: true,
      message: `Alarm "${existing.title}" berhasil dihapus.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
