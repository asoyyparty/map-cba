import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const auditRouter = Router();

// Secure audit endpoints (ADMIN and IT_ENGINEER only)
auditRouter.use(authenticateToken);
auditRouter.use(requireRole('ADMIN', 'IT_ENGINEER'));

// GET all audit logs with pagination, search, and action filter
auditRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { action, entity, search, limit = 50, page = 1 } = req.query;

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (action && action !== 'all') {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (entity && entity !== 'all') {
      sql += ' AND entity = ?';
      params.push(entity);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      sql += ' AND (username LIKE ? OR action LIKE ? OR entity LIKE ? OR details LIKE ?)';
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY created_at DESC';

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.queryOne(countSql, params);
    const total = countResult?.total || 0;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const rows = await db.query(sql, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST manually log an audit event from frontend (e.g. Navigation, Theme change, Logout)
auditRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, username, userRole, action, entity, entityId, details } = req.body;
    if (!action || !entity) {
      return res.status(400).json({ success: false, message: 'Action dan entity wajib diisi' });
    }

    await logAuditEvent({
      userId,
      username: username || 'System',
      userRole: userRole || 'VIEWER',
      action,
      entity,
      entityId,
      details,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({ success: true, message: 'Audit event logged' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
