import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const buildingsRouter = Router();

// Secure all building endpoints
buildingsRouter.use(authenticateToken);

// Helper to format a building row
function formatBuildingRow(b: any) {
  let polygon = [];
  try {
    polygon = typeof b.coords_json === 'string' ? JSON.parse(b.coords_json || '[]') : (b.coords_json || []);
  } catch {
    polygon = [];
  }

  let center = { x: 0, y: 0 };
  try {
    center = typeof b.center_json === 'string' ? JSON.parse(b.center_json || '{"x":0,"y":0}') : (b.center_json || { x: 0, y: 0 });
  } catch {
    center = { x: 0, y: 0 };
  }

  const liveDevices = b.live_device_count !== undefined && b.live_device_count !== null ? Number(b.live_device_count) : null;
  const liveRacks = b.live_rack_count !== undefined && b.live_rack_count !== null ? Number(b.live_rack_count) : null;

  return {
    id: b.id,
    name: b.name,
    code: b.code,
    category: b.category || 'production',
    status: b.status || 'healthy',
    color: b.color || null,
    polygon,
    center,
    headIT: b.head_it || '',
    totalDevices: liveDevices !== null ? liveDevices : (Number(b.total_devices) || 0),
    racksCount: liveRacks !== null ? liveRacks : (Number(b.racks_count) || 0),
    description: b.description || '',
    lokasi: b.lokasi || '',
    koordinat: b.koordinat || '',
    mainSwitch: b.main_switch || '',
    apCount: Number(b.ap_count) || 0,
    portCount: Number(b.port_count) || 0,
    connectedUsers: Number(b.connected_users) || 0,
    backboneFrom: b.backbone_from || '',
    backboneCable: b.backbone_cable || '',
    backboneCore: b.backbone_core || '',
    backboneSpeed: b.backbone_speed || '10 Gbps',
    backboneStatus: b.backbone_status || 'normal',
    imageUrl: b.image_url || '',
    createdAt: b.created_at
  };
}

// GET all buildings with search & filters and live asset aggregation
buildingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;

    let sql = `
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM devices WHERE building_id = b.id) as live_device_count,
        (SELECT COUNT(*) FROM racks WHERE building_id = b.id) as live_rack_count
      FROM buildings b
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (b.name LIKE ? OR b.code LIKE ? OR b.head_it LIKE ? OR b.lokasi LIKE ?)';
      params.push(q, q, q, q);
    }

    if (category && typeof category === 'string' && category.trim() && category !== 'all') {
      sql += ' AND b.category = ?';
      params.push(category.trim());
    }

    if (status && typeof status === 'string' && status.trim() && status !== 'all') {
      sql += ' AND b.status = ?';
      params.push(status.trim());
    }

    sql += ' ORDER BY b.code ASC, b.name ASC;';

    const rows = await db.query(sql, params);
    const buildings = rows.map(formatBuildingRow);
    res.json({ success: true, count: buildings.length, data: buildings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/buildings/categories - List all building categories with building count
buildingsRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const rows = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.color, 
        c.description, 
        c.is_default, 
        c.created_at,
        COUNT(b.id) as buildings_count
      FROM building_categories c
      LEFT JOIN buildings b ON b.category = c.id
      GROUP BY c.id, c.name, c.color, c.description, c.is_default, c.created_at
      ORDER BY c.is_default DESC, c.name ASC;
    `);

    const data = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      color: r.color || '#3b82f6',
      description: r.description || '',
      isDefault: Boolean(r.is_default),
      buildingsCount: Number(r.buildings_count) || 0,
      createdAt: r.created_at
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/buildings/categories - Create a new building category
buildingsRouter.post('/categories', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, name, color, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    let catId = (id || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 64);

    if (!catId) catId = `cat_${Date.now()}`;

    const existing = await db.queryOne('SELECT id FROM building_categories WHERE id = ?;', [catId]);
    if (existing) {
      catId = `${catId}_${Math.floor(Math.random() * 1000)}`;
    }

    const catColor = color || '#3b82f6';
    const catDesc = description || '';

    await db.execute(`
      INSERT INTO building_categories (id, name, color, description, is_default)
      VALUES (?, ?, ?, ?, 0);
    `, [catId, name.trim(), catColor, catDesc.trim()]);

    const created = await db.queryOne('SELECT * FROM building_categories WHERE id = ?;', [catId]);

    res.status(201).json({
      success: true,
      message: `Kategori "${name.trim()}" berhasil ditambahkan`,
      data: {
        id: created.id,
        name: created.name,
        color: created.color,
        description: created.description,
        isDefault: Boolean(created.is_default),
        buildingsCount: 0,
        createdAt: created.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/buildings/categories/:catId - Update a category
buildingsRouter.put('/categories/:catId', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { catId } = req.params;
    const { name, color, description } = req.body;

    const existing = await db.queryOne('SELECT * FROM building_categories WHERE id = ?;', [catId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const newName = name?.trim() || existing.name;
    const newColor = color || existing.color;
    const newDesc = description !== undefined ? description.trim() : existing.description;

    await db.execute(`
      UPDATE building_categories
      SET name = ?, color = ?, description = ?
      WHERE id = ?;
    `, [newName, newColor, newDesc, catId]);

    const updated = await db.queryOne('SELECT * FROM building_categories WHERE id = ?;', [catId]);

    res.json({
      success: true,
      message: `Kategori "${newName}" berhasil diperbarui`,
      data: {
        id: updated.id,
        name: updated.name,
        color: updated.color,
        description: updated.description,
        isDefault: Boolean(updated.is_default)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/buildings/categories/:catId - Delete a category
buildingsRouter.delete('/categories/:catId', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { catId } = req.params;

    const existing = await db.queryOne('SELECT * FROM building_categories WHERE id = ?;', [catId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const usedRow = await db.queryOne('SELECT COUNT(*) as count FROM buildings WHERE category = ?;', [catId]);
    const usedCount = Number(usedRow?.count) || 0;

    if (usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${existing.name}" tidak dapat dihapus karena sedang digunakan oleh ${usedCount} gedung.`
      });
    }

    await db.execute('DELETE FROM building_categories WHERE id = ?;', [catId]);

    res.json({
      success: true,
      message: `Kategori "${existing.name}" berhasil dihapus`,
      data: { deletedId: catId }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single building by ID with full infrastructure details
buildingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM devices WHERE building_id = b.id) as live_device_count,
        (SELECT COUNT(*) FROM racks WHERE building_id = b.id) as live_rack_count
      FROM buildings b
      WHERE b.id = ?;
    `;
    const b = await db.queryOne(sql, [id]);
    if (!b) {
      return res.status(404).json({ success: false, message: 'Gedung tidak ditemukan' });
    }

    // Fetch related entities
    const devices = await db.query('SELECT * FROM devices WHERE building_id = ? ORDER BY name ASC;', [id]);
    const racks = await db.query('SELECT * FROM racks WHERE building_id = ? ORDER BY name ASC;', [id]);
    const cables = await db.query('SELECT * FROM cable_routes WHERE from_building_id = ? OR to_building_id = ? ORDER BY code ASC;', [id, id]);
    const alerts = await db.query('SELECT * FROM alerts WHERE building_id = ? ORDER BY timestamp DESC LIMIT 10;', [id]);

    const formattedCables = cables.map((c: any) => ({
      ...c,
      path: typeof c.path_coords_json === 'string' ? JSON.parse(c.path_coords_json || '[]') : (c.path_coords_json || []),
      coreAllocations: typeof c.core_allocations_json === 'string' ? JSON.parse(c.core_allocations_json || '[]') : (c.core_allocations_json || [])
    }));

    res.json({
      success: true,
      data: {
        ...formatBuildingRow(b),
        devices: devices || [],
        racks: racks || [],
        cables: formattedCables || [],
        alerts: alerts || []
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create new building
buildingsRouter.post('/', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      code,
      category = 'production',
      polygon = [],
      center = { x: 300, y: 300 },
      headIT = '',
      description = '',
      lokasi = '',
      koordinat = '',
      mainSwitch = '',
      apCount = 0,
      portCount = 24,
      connectedUsers = 0,
      backboneFrom = 'Kantor Utama',
      backboneCable = '',
      backboneCore = 'Core 1-2',
      backboneSpeed = '10 Gbps',
      backboneStatus = 'normal',
      imageUrl = '',
      status = 'healthy',
      color = null
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Nama dan kode gedung wajib diisi' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await db.queryOne('SELECT id FROM buildings WHERE code = ?;', [cleanCode]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Gedung dengan kode ${cleanCode} sudah terdaftar` });
    }

    const id = req.body.id || `bld-${cleanCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    // Default polygon fallback if empty
    const resolvedPolygon = Array.isArray(polygon) && polygon.length >= 3
      ? polygon
      : [
          { x: center.x - 30, y: center.y - 20 },
          { x: center.x + 30, y: center.y - 20 },
          { x: center.x + 30, y: center.y + 20 },
          { x: center.x - 30, y: center.y + 20 }
        ];

    const sql = `
      INSERT INTO buildings (
        id, name, code, category, coords_json, center_json, status, color,
        head_it, description, lokasi, koordinat, main_switch,
        ap_count, port_count, connected_users,
        backbone_from, backbone_cable, backbone_core, backbone_speed, backbone_status,
        image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.execute(sql, [
      id,
      name.trim(),
      cleanCode,
      category,
      JSON.stringify(resolvedPolygon),
      JSON.stringify(center),
      status,
      color || null,
      headIT || '',
      description || '',
      lokasi || '',
      koordinat || '',
      mainSwitch || '',
      Number(apCount) || 0,
      Number(portCount) || 0,
      Number(connectedUsers) || 0,
      backboneFrom || '',
      backboneCable || '',
      backboneCore || '',
      backboneSpeed || '10 Gbps',
      backboneStatus || 'normal',
      imageUrl || ''
    ]);

    await logAuditEvent({
      username: (req as any).user?.email || 'admin@cba.co.id',
      userRole: (req as any).user?.role || 'ADMIN',
      action: 'CREATE_BUILDING',
      entity: 'buildings',
      entityId: id,
      details: `Created new building ${cleanCode} - ${name} (Category: ${category})`
    });

    const created = await db.queryOne('SELECT * FROM buildings WHERE id = ?;', [id]);
    res.status(201).json({
      success: true,
      message: `Gedung ${name} (${cleanCode}) berhasil ditambahkan`,
      data: formatBuildingRow(created)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update building details
buildingsRouter.put('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      category,
      polygon,
      center,
      status,
      headIT,
      description,
      lokasi,
      koordinat,
      mainSwitch,
      apCount,
      portCount,
      connectedUsers,
      backboneFrom,
      backboneCable,
      backboneCore,
      backboneSpeed,
      backboneStatus,
      imageUrl,
      color
    } = req.body;

    const existing = await db.queryOne('SELECT * FROM buildings WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gedung tidak ditemukan' });
    }

    const polygonJson = polygon ? JSON.stringify(polygon) : existing.coords_json;
    const centerJson = center ? JSON.stringify(center) : existing.center_json;

    const sql = `
      UPDATE buildings SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        category = COALESCE(?, category),
        coords_json = ?,
        center_json = ?,
        status = COALESCE(?, status),
        color = ?,
        head_it = COALESCE(?, head_it),
        description = COALESCE(?, description),
        lokasi = COALESCE(?, lokasi),
        koordinat = COALESCE(?, koordinat),
        main_switch = COALESCE(?, main_switch),
        ap_count = COALESCE(?, ap_count),
        port_count = COALESCE(?, port_count),
        connected_users = COALESCE(?, connected_users),
        backbone_from = COALESCE(?, backbone_from),
        backbone_cable = COALESCE(?, backbone_cable),
        backbone_core = COALESCE(?, backbone_core),
        backbone_speed = COALESCE(?, backbone_speed),
        backbone_status = COALESCE(?, backbone_status),
        image_url = COALESCE(?, image_url)
      WHERE id = ?;
    `;

    await db.execute(sql, [
      name ?? null,
      code ? code.toUpperCase() : null,
      category ?? null,
      polygonJson,
      centerJson,
      status ?? null,
      color !== undefined ? color : existing.color,
      headIT ?? null,
      description ?? null,
      lokasi ?? null,
      koordinat ?? null,
      mainSwitch ?? null,
      apCount !== undefined ? Number(apCount) : null,
      portCount !== undefined ? Number(portCount) : null,
      connectedUsers !== undefined ? Number(connectedUsers) : null,
      backboneFrom ?? null,
      backboneCable ?? null,
      backboneCore ?? null,
      backboneSpeed ?? null,
      backboneStatus ?? null,
      imageUrl ?? null,
      id
    ]);

    await logAuditEvent({
      username: (req as any).user?.email || 'admin@cba.co.id',
      userRole: (req as any).user?.role || 'ADMIN',
      action: 'UPDATE_BUILDING',
      entity: 'buildings',
      entityId: id,
      details: `Updated building ${code || existing.code} - ${name || existing.name}`
    });

    const updated = await db.queryOne('SELECT * FROM buildings WHERE id = ?;', [id]);
    res.json({
      success: true,
      message: 'Data gedung berhasil diperbarui',
      data: formatBuildingRow(updated)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE remove building with complete cascading deletion of all associated infrastructure
buildingsRouter.delete('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.queryOne('SELECT * FROM buildings WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gedung tidak ditemukan' });
    }

    // 1. Find all devices located in this building
    const devRows = await db.query('SELECT id, name FROM devices WHERE building_id = ?;', [id]);
    const devIds = (devRows || []).map((d: any) => d.id);
    const devicesCount = devIds.length;

    // 2. Cascade delete device dependencies (ports, metrics, alerts, tickets)
    if (devicesCount > 0) {
      const placeholders = devIds.map(() => '?').join(',');
      try {
        await db.execute(`DELETE FROM device_ports WHERE device_id IN (${placeholders});`, devIds);
      } catch {}
      try {
        await db.execute(`DELETE FROM monitoring_metrics WHERE device_id IN (${placeholders});`, devIds);
      } catch {}
      try {
        await db.execute(`DELETE FROM alerts WHERE device_id IN (${placeholders}) OR building_id = ?;`, [...devIds, id]);
      } catch {}
      try {
        await db.execute(`DELETE FROM tickets WHERE device_id IN (${placeholders}) OR building_id = ?;`, [...devIds, id]);
      } catch {}

      // Delete the devices in this building
      await db.execute('DELETE FROM devices WHERE building_id = ?;', [id]);
    } else {
      // Clear any alerts or tickets pointing to this building
      try {
        await db.execute('DELETE FROM alerts WHERE building_id = ?;', [id]);
      } catch {}
      try {
        await db.execute('DELETE FROM tickets WHERE building_id = ?;', [id]);
      } catch {}
    }

    // 3. Cascade delete racks in this building
    const rackRow = await db.queryOne('SELECT COUNT(*) as count FROM racks WHERE building_id = ?;', [id]);
    const racksCount = rackRow?.count || 0;
    if (racksCount > 0) {
      await db.execute('DELETE FROM racks WHERE building_id = ?;', [id]);
    }

    // 4. Cascade delete cable routes connected to this building
    const cableRow = await db.queryOne('SELECT COUNT(*) as count FROM cable_routes WHERE from_building_id = ? OR to_building_id = ?;', [id, id]);
    const cablesCount = cableRow?.count || 0;
    if (cablesCount > 0) {
      await db.execute('DELETE FROM cable_routes WHERE from_building_id = ? OR to_building_id = ?;', [id, id]);
    }

    // 5. Delete the building record
    await db.execute('DELETE FROM buildings WHERE id = ?;', [id]);

    // 6. Audit logging
    await logAuditEvent({
      username: (req as any).user?.email || 'admin@cba-chemical.co.id',
      userRole: (req as any).user?.role || 'ADMIN',
      action: 'DELETE_BUILDING_CASCADE',
      entity: 'buildings',
      entityId: id,
      details: `Deleted building ${existing.code} (${existing.name}) and cascaded ${devicesCount} devices, ${racksCount} racks, ${cablesCount} cables`
    });

    const cascadedDetails: string[] = [];
    if (devicesCount > 0) cascadedDetails.push(`${devicesCount} perangkat`);
    if (racksCount > 0) cascadedDetails.push(`${racksCount} rak`);
    if (cablesCount > 0) cascadedDetails.push(`${cablesCount} rute kabel`);

    const cascadeSummary = cascadedDetails.length > 0
      ? ` beserta seluruh data di dalamnya (${cascadedDetails.join(', ')})`
      : '';

    res.json({
      success: true,
      message: `Gedung ${existing.name} (${existing.code})${cascadeSummary} berhasil dihapus dari sistem dan denah.`,
      data: {
        deletedBuildingId: id,
        deletedDevicesCount: devicesCount,
        deletedRacksCount: racksCount,
        deletedCablesCount: cablesCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
