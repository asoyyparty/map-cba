import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const ticketsRouter = Router();

// Secure all ticket endpoints
ticketsRouter.use(authenticateToken);

// GET all maintenance tickets
ticketsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, building_id, asset_type, search } = req.query;
    let query = 'SELECT * FROM maintenance_tickets WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND LOWER(status) = ?';
      params.push((status as string).toLowerCase());
    }
    if (priority && priority !== 'all') {
      query += ' AND LOWER(priority) = ?';
      params.push((priority as string).toLowerCase());
    }
    if (building_id && building_id !== 'all') {
      query += ' AND building_id = ?';
      params.push(building_id);
    }
    if (asset_type && asset_type !== 'all') {
      query += ' AND LOWER(asset_type) = ?';
      params.push((asset_type as string).toLowerCase());
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query += ' AND (ticket_no LIKE ? OR title LIKE ? OR description LIKE ? OR assigned_to LIKE ? OR asset_name LIKE ?)';
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY created_at DESC;';

    const rows = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single ticket by ID
ticketsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await db.queryOne('SELECT * FROM maintenance_tickets WHERE id = ? OR ticket_no = ?;', [id, id]);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Tiket pemeliharaan tidak ditemukan' });
    }
    res.json({ success: true, data: ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new maintenance ticket
ticketsRouter.post('/', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      assetType = 'Device',
      assetId,
      assetName,
      buildingId,
      deviceId,
      cableRouteId,
      assignedTo = 'Tim Infrastruktur IT',
      scheduledDate,
      dueDate,
      authorName = 'Admin IT',
      authorRole = 'ADMIN'
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Judul tiket dan deskripsi wajib diisi' });
    }

    const ticketId = `tkt-${Date.now()}`;
    const countRow = await db.queryOne('SELECT COUNT(*) as count FROM maintenance_tickets;');
    const nextNum = (countRow?.count || 0) + 1;
    const ticketNo = `TKT-2026-${String(nextNum).padStart(3, '0')}`;

    const now = new Date().toISOString();
    const initialTimeline = [
      {
        id: `tl-${Date.now()}-1`,
        action: 'TICKET_CREATED',
        note: `Tiket dibuat dengan prioritas ${priority.toUpperCase()}`,
        by: authorName,
        timestamp: now
      }
    ];

    const sql = `
      INSERT INTO maintenance_tickets (
        id, ticket_no, title, description, priority, status,
        asset_type, asset_id, asset_name, building_id, device_id, cable_route_id,
        assigned_to, scheduled_date, due_date, timeline_json
      ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.execute(sql, [
      ticketId,
      ticketNo,
      title,
      description,
      priority.toLowerCase(),
      assetType,
      assetId || null,
      assetName || null,
      buildingId || null,
      deviceId || null,
      cableRouteId || null,
      assignedTo,
      scheduledDate || null,
      dueDate || null,
      JSON.stringify(initialTimeline)
    ]);

    // Log audit event
    await logAuditEvent({
      username: authorName,
      userRole: authorRole,
      action: 'CREATE_TICKET',
      entity: 'MAINTENANCE',
      entityId: ticketId,
      details: { ticketNo, title, priority, assetType, assetName }
    });

    res.status(201).json({
      success: true,
      message: `Tiket pemeliharaan ${ticketNo} berhasil dibuat`,
      data: { id: ticketId, ticketNo }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update / resolve ticket
ticketsRouter.put('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      assignedTo,
      priority,
      resolution,
      rootCause,
      actionTaken,
      technicianNotes,
      completedDate,
      authorName = 'Admin IT',
      authorRole = 'ADMIN'
    } = req.body;

    const current = await db.queryOne('SELECT * FROM maintenance_tickets WHERE id = ?;', [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    }

    let timeline: any[] = [];
    try {
      timeline = current.timeline_json ? JSON.parse(current.timeline_json) : [];
    } catch {
      timeline = [];
    }

    const now = new Date().toISOString();

    if (status && status.toLowerCase() !== current.status?.toLowerCase()) {
      timeline.push({
        id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        action: 'STATUS_CHANGE',
        note: `Status diubah dari ${current.status?.toUpperCase()} ke ${status.toUpperCase()}`,
        by: authorName,
        timestamp: now
      });
    }

    if (technicianNotes || resolution) {
      timeline.push({
        id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        action: 'NOTE_ADDED',
        note: technicianNotes || resolution,
        by: authorName,
        timestamp: now
      });
    }

    const nextStatus = status ? status.toLowerCase() : current.status;
    const finalCompletedDate = nextStatus === 'completed' ? (completedDate || now) : current.completed_date;

    await db.execute(`
      UPDATE maintenance_tickets SET
        status = ?,
        priority = COALESCE(?, priority),
        assigned_to = COALESCE(?, assigned_to),
        resolution = COALESCE(?, resolution),
        root_cause = COALESCE(?, root_cause),
        action_taken = COALESCE(?, action_taken),
        technician_notes = COALESCE(?, technician_notes),
        completed_date = ?,
        timeline_json = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
    `, [
      nextStatus,
      priority ? priority.toLowerCase() : null,
      assignedTo ?? null,
      resolution ?? null,
      rootCause ?? null,
      actionTaken ?? null,
      technicianNotes ?? null,
      finalCompletedDate ?? null,
      JSON.stringify(timeline),
      id
    ]);

    // Log audit event
    await logAuditEvent({
      username: authorName,
      userRole: authorRole,
      action: nextStatus === 'completed' ? 'RESOLVE_TICKET' : 'UPDATE_TICKET',
      entity: 'MAINTENANCE',
      entityId: id,
      details: { ticketNo: current.ticket_no, oldStatus: current.status, newStatus: nextStatus, resolution }
    });

    const updated = await db.queryOne('SELECT * FROM maintenance_tickets WHERE id = ?;', [id]);

    res.json({
      success: true,
      message: 'Tiket berhasil diperbarui',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE ticket
ticketsRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const current = await db.queryOne('SELECT * FROM maintenance_tickets WHERE id = ?;', [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    }

    await db.execute('DELETE FROM maintenance_tickets WHERE id = ?;', [id]);

    await logAuditEvent({
      username: (req.query.username as string) || 'Admin IT',
      userRole: 'ADMIN',
      action: 'DELETE_TICKET',
      entity: 'MAINTENANCE',
      entityId: id,
      details: { ticketNo: current.ticket_no, title: current.title }
    });

    res.json({ success: true, message: `Tiket ${current.ticket_no} berhasil dihapus` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
