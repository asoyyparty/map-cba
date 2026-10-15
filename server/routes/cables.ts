import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const cablesRouter = Router();

// Secure all cable endpoints
cablesRouter.use(authenticateToken);

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

function generateDefaultCores(code: string, fromName: string, toName: string, totalCores: number = 12, usedCores: number = 6) {
  const cores = [];
  for (let i = 1; i <= totalCores; i++) {
    const color = TIA_598_COLORS[(i - 1) % 12];
    let status = 'available';
    let service = '';
    let sourceDevice = `SW-${code}-01`;
    let sourcePort = '';
    let targetDevice = `SW-${code}-02`;
    let targetPort = '';
    let attenuation = +(0.22 + (i * 0.03)).toFixed(2);
    let notes = '';

    if (i <= usedCores) {
      status = 'connected';
      if (i === 1) service = `Backbone Primary Trunk (${fromName || 'Site A'} ↔ ${toName || 'Site B'})`;
      else if (i === 2) service = `Backbone Secondary Trunk (${fromName || 'Site A'} ↔ ${toName || 'Site B'})`;
      else if (i === 3) service = `CCTV & Surveillance VLAN 30`;
      else if (i === 4) service = `SCADA / Industrial Automation Link`;
      else service = `Branch Channel #${i}`;
      sourcePort = `SFP+${i}`;
      targetPort = `SFP+${i}`;
    } else if (i === usedCores + 1) {
      status = 'reserved';
      service = `Hot-Spare Backup Core`;
      notes = 'Pre-patched, unlit standby';
    }

    cores.push({
      coreNumber: i,
      tubeNumber: Math.ceil(i / 12),
      colorName: color.name,
      colorHex: color.hex,
      status,
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

// Helper to format cable row
function formatCableRow(c: any) {
  let coreAllocations: any[] = [];
  try {
    if (typeof c.core_allocations_json === 'string') {
      coreAllocations = JSON.parse(c.core_allocations_json || '[]');
    } else if (Array.isArray(c.core_allocations_json)) {
      coreAllocations = c.core_allocations_json;
    }
  } catch {
    coreAllocations = [];
  }

  return {
    ...c,
    path: typeof c.path_coords_json === 'string' ? JSON.parse(c.path_coords_json || '[]') : (c.path_coords_json || []),
    fromBuildingId: c.from_building_id,
    fromBuildingName: c.from_building_name,
    toBuildingId: c.to_building_id,
    toBuildingName: c.to_building_name,
    totalCores: Number(c.total_cores) || 12,
    usedCores: Number(c.used_cores) || 0,
    lengthMeters: Number(c.length_meters) || 0,
    attenuationDb: Number(c.attenuation_db) || 0.4,
    color: c.color || null,
    lineWidth: c.line_width ? Number(c.line_width) : (c.type === 'backbone' ? 3.5 : c.type === 'fiber' ? 2.5 : 2),
    coreAllocations
  };
}

// GET all cables with search & filter support
cablesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, building_id, type, status } = req.query;

    let sql = 'SELECT * FROM cable_routes WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (code LIKE ? OR name LIKE ? OR from_building_name LIKE ? OR to_building_name LIKE ?)';
      params.push(q, q, q, q);
    }

    if (building_id && typeof building_id === 'string' && building_id.trim()) {
      sql += ' AND (from_building_id = ? OR to_building_id = ?)';
      params.push(building_id.trim(), building_id.trim());
    }

    if (type && typeof type === 'string' && type.trim() && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type.trim());
    }

    if (status && typeof status === 'string' && status.trim() && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status.trim());
    }

    sql += ' ORDER BY code ASC;';

    const rows = await db.query(sql, params);
    const cables = rows.map(formatCableRow);
    res.json({ success: true, count: cables.length, data: cables });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single cable by ID
cablesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const c = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    if (!c) {
      return res.status(404).json({ success: false, message: 'Jalur kabel tidak ditemukan' });
    }
    res.json({ success: true, data: formatCableRow(c) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update specific optical core in a cable route
cablesRouter.post('/:id/cores/assign', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      coreNumber,
      status = 'connected',
      service = '',
      sourceDevice = '',
      sourcePort = '',
      targetDevice = '',
      targetPort = '',
      attenuationDb,
      notes = '',
      user = 'System User'
    } = req.body;

    if (!coreNumber || typeof coreNumber !== 'number') {
      return res.status(400).json({ success: false, message: 'Nomor core (coreNumber) wajib disertakan' });
    }

    const c = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    if (!c) {
      return res.status(404).json({ success: false, message: 'Jalur kabel tidak ditemukan' });
    }

    let cores: any[] = [];
    try {
      cores = typeof c.core_allocations_json === 'string' ? JSON.parse(c.core_allocations_json || '[]') : (c.core_allocations_json || []);
    } catch {
      cores = [];
    }

    // Find core or create if needed
    let coreIndex = cores.findIndex((item: any) => item.coreNumber === coreNumber);
    if (coreIndex === -1) {
      const color = TIA_598_COLORS[(coreNumber - 1) % 12];
      cores.push({
        coreNumber,
        tubeNumber: Math.ceil(coreNumber / 12),
        colorName: color.name,
        colorHex: color.hex,
        status,
        service,
        sourceDevice,
        sourcePort,
        targetDevice,
        targetPort,
        attenuationDb: attenuationDb !== undefined ? Number(attenuationDb) : 0.35,
        notes
      });
    } else {
      cores[coreIndex] = {
        ...cores[coreIndex],
        status,
        service,
        sourceDevice,
        sourcePort,
        targetDevice,
        targetPort,
        attenuationDb: attenuationDb !== undefined ? Number(attenuationDb) : cores[coreIndex].attenuationDb,
        notes: notes !== undefined ? notes : cores[coreIndex].notes
      };
    }

    // Recalculate used cores
    const usedCores = cores.filter((item: any) => item.status && item.status !== 'available').length;

    // Check if cable route should be marked degraded if any core is damaged
    let routeStatus = c.status;
    const hasDamagedCore = cores.some((item: any) => item.status === 'damaged' || (item.attenuationDb && item.attenuationDb > 3.0));
    if (hasDamagedCore && (routeStatus === 'active' || routeStatus === 'normal')) {
      routeStatus = 'degraded';
    } else if (!hasDamagedCore && routeStatus === 'degraded') {
      routeStatus = 'active';
    }

    await db.execute(`
      UPDATE cable_routes SET
        core_allocations_json = ?,
        used_cores = ?,
        status = ?
      WHERE id = ?;
    `, [JSON.stringify(cores), usedCores, routeStatus, id]);

    await logAuditEvent({
      username: (req as any).user?.email || user || 'it-engineer@cba.co.id',
      userRole: (req as any).user?.role || 'IT_ENGINEER',
      action: 'UPDATE_CORE_ALLOCATION',
      entity: 'cable_core',
      entityId: `${c.code}-C${coreNumber}`,
      details: `Updated core #${coreNumber} on ${c.code} (${c.name}) to status [${status}], service: "${service || 'N/A'}"`
    });

    const updated = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    res.json({
      success: true,
      message: `Core #${coreNumber} pada rute kabel ${c.code} berhasil diperbarui`,
      data: formatCableRow(updated)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update cable route (full edit & partial update)
cablesRouter.put('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      name, 
      type, 
      fromBuildingId, 
      fromBuildingName, 
      toBuildingId, 
      toBuildingName, 
      path, 
      totalCores, 
      usedCores, 
      lengthMeters, 
      bandwidth, 
      status, 
      attenuationDb,
      color,
      lineWidth,
      coreAllocations
    } = req.body;

    const existing = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Jalur kabel tidak ditemukan' });
    }

    const pathJson = path ? JSON.stringify(path) : existing.path_coords_json;
    const coreAllocationsJson = coreAllocations ? JSON.stringify(coreAllocations) : existing.core_allocations_json;

    // If coreAllocations is supplied, compute usedCores from it
    let resolvedUsedCores = usedCores !== undefined ? Number(usedCores) : null;
    if (coreAllocations && Array.isArray(coreAllocations)) {
      resolvedUsedCores = coreAllocations.filter((item: any) => item.status && item.status !== 'available').length;
    }

    const sql = `
      UPDATE cable_routes SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        from_building_id = COALESCE(?, from_building_id),
        from_building_name = COALESCE(?, from_building_name),
        to_building_id = COALESCE(?, to_building_id),
        to_building_name = COALESCE(?, to_building_name),
        path_coords_json = ?,
        total_cores = COALESCE(?, total_cores),
        used_cores = COALESCE(?, used_cores),
        length_meters = COALESCE(?, length_meters),
        bandwidth = COALESCE(?, bandwidth),
        status = COALESCE(?, status),
        attenuation_db = COALESCE(?, attenuation_db),
        color = ?,
        line_width = COALESCE(?, line_width),
        core_allocations_json = COALESCE(?, core_allocations_json)
      WHERE id = ?;
    `;

    await db.execute(sql, [
      code ?? null,
      name ?? null,
      type ?? null,
      fromBuildingId ?? null,
      fromBuildingName ?? null,
      toBuildingId ?? null,
      toBuildingName ?? null,
      pathJson,
      totalCores !== undefined ? Number(totalCores) : null,
      resolvedUsedCores,
      lengthMeters !== undefined ? Number(lengthMeters) : null,
      bandwidth ?? null,
      status ?? null,
      attenuationDb !== undefined ? Number(attenuationDb) : null,
      color !== undefined ? color : existing.color,
      lineWidth !== undefined ? Number(lineWidth) : null,
      coreAllocationsJson,
      id
    ]);

    await logAuditEvent({
      username: (req as any).user?.email || 'admin@cba.co.id',
      userRole: (req as any).user?.role || 'ADMIN',
      action: 'UPDATE_CABLE_ROUTE',
      entity: 'cable_routes',
      entityId: id,
      details: `Updated cable route ${code || existing.code} (${name || existing.name})`
    });

    const updated = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Data jalur kabel berhasil diperbarui', data: formatCableRow(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create new cable route
cablesRouter.post('/', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      code,
      name,
      type = 'fiber',
      fromBuildingId = '',
      fromBuildingName = '',
      toBuildingId = '',
      toBuildingName = '',
      path = [],
      totalCores = 12,
      usedCores = 0,
      lengthMeters = 0,
      bandwidth = '10 Gbps',
      status = 'normal',
      color = null,
      lineWidth = 2.5,
      coreAllocations
    } = req.body;

    const id = `cab-${Date.now()}`;
    const pathJson = JSON.stringify(path);
    const resolvedTotalCores = Number(totalCores) || 12;
    const resolvedUsedCores = Number(usedCores) || 0;

    const resolvedCores = coreAllocations && Array.isArray(coreAllocations) && coreAllocations.length > 0
      ? coreAllocations
      : generateDefaultCores(code || 'NEW', fromBuildingName, toBuildingName, resolvedTotalCores, resolvedUsedCores);

    const sql = `
      INSERT INTO cable_routes (
        id, code, name, type,
        from_building_id, from_building_name,
        to_building_id, to_building_name,
        path_coords_json, total_cores, used_cores,
        status, length_meters, bandwidth,
        color, line_width, core_allocations_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.execute(sql, [
      id,
      code || `CBL-${Date.now().toString().slice(-4)}`,
      name || 'Jalur Kabel Baru',
      type,
      fromBuildingId,
      fromBuildingName,
      toBuildingId,
      toBuildingName,
      pathJson,
      resolvedTotalCores,
      resolvedUsedCores,
      status,
      Number(lengthMeters) || 0,
      bandwidth,
      color || null,
      Number(lineWidth) || 2.5,
      JSON.stringify(resolvedCores)
    ]);

    await logAuditEvent({
      username: (req as any).user?.email || 'admin@cba.co.id',
      userRole: (req as any).user?.role || 'ADMIN',
      action: 'CREATE_CABLE_ROUTE',
      entity: 'cable_routes',
      entityId: id,
      details: `Created new cable route ${code || id} (${name || 'New Cable'})`
    });

    const created = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    res.status(201).json({ success: true, message: 'Rute kabel berhasil disimpan', data: formatCableRow(created) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE remove cable route
cablesRouter.delete('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.queryOne('SELECT * FROM cable_routes WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Jalur kabel tidak ditemukan' });
    }

    await db.execute('DELETE FROM cable_routes WHERE id = ?;', [id]);

    await logAuditEvent({
      username: (req as any).user?.email || 'admin@cba.co.id',
      userRole: (req as any).user?.role || 'ADMIN',
      action: 'DELETE_CABLE_ROUTE',
      entity: 'cable_routes',
      entityId: id,
      details: `Deleted cable route ${existing.code} (${existing.name})`
    });

    res.json({ success: true, message: `Rute kabel ${existing.code} berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
