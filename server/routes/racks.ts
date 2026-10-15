import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const racksRouter = Router();

// Secure all rack endpoints
racksRouter.use(authenticateToken);

function mapRackRow(r: any) {
  let deviceIds: string[] = [];
  try {
    deviceIds = r.device_ids_json ? JSON.parse(r.device_ids_json) : [];
  } catch {
    deviceIds = [];
  }

  return {
    id: r.id,
    name: r.name,
    code: r.code,
    buildingId: r.building_id,
    buildingName: r.building_name || '',
    room: r.room || 'Panel IT',
    uCapacity: Number(r.u_capacity) || 42,
    usedU: Number(r.used_u) || 0,
    maxPowerWatts: Number(r.max_power_watts) || 3500,
    currentPowerWatts: Number(r.current_power_watts) || 650,
    maxWeightKg: Number(r.max_weight_kg) || 800,
    status: r.status || 'active',
    description: r.description || '',
    deviceIds,
    createdAt: r.created_at
  };
}

// 1. GET all racks
racksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { building_id, search } = req.query;
    let sql = 'SELECT * FROM racks WHERE 1=1';
    const params: any[] = [];

    if (building_id && building_id !== 'all') {
      sql += ' AND building_id = ?';
      params.push(building_id);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      sql += ' AND (name LIKE ? OR code LIKE ? OR room LIKE ? OR building_name LIKE ?)';
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY code ASC;';

    const rows = await db.query(sql, params);

    // Calculate live used_u and devices count from devices table for accuracy
    const allRacks = await Promise.all(rows.map(async (r: any) => {
      const rackObj = mapRackRow(r);
      const devices = await db.query(
        'SELECT id, name, code, type, status, rack_u_position, rack_u_height FROM devices WHERE rack_id = ?;',
        [rackObj.id]
      );
      const calculatedUsedU = devices.reduce((sum, d) => sum + (Number(d.rack_u_height) || 1), 0);
      return {
        ...rackObj,
        usedU: calculatedUsedU > 0 ? calculatedUsedU : rackObj.usedU,
        devicesCount: devices.length,
        freeU: Math.max(0, rackObj.uCapacity - (calculatedUsedU > 0 ? calculatedUsedU : rackObj.usedU)),
        occupancyPercent: Math.round(((calculatedUsedU > 0 ? calculatedUsedU : rackObj.usedU) / rackObj.uCapacity) * 100)
      };
    }));

    res.json({ success: true, count: allRacks.length, data: allRacks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET single rack by ID with full U-slots grid and mounted devices
racksRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rackRow = await db.queryOne('SELECT * FROM racks WHERE id = ? OR code = ?;', [id, id]);
    if (!rackRow) {
      return res.status(404).json({ success: false, message: 'Kabinet rack tidak ditemukan' });
    }

    const rack = mapRackRow(rackRow);

    // Fetch all devices mounted in this rack
    const devices = await db.query(
      `SELECT id, name, code, ip, mac, type, vendor, model, status,
              ports_total, ports_active, rack_id, rack_u_position, rack_u_height,
              description
       FROM devices
       WHERE rack_id = ?
       ORDER BY rack_u_position DESC;`,
      [rack.id]
    );

    // Fetch ports for these mounted devices
    const deviceIds = devices.map(d => d.id);
    let portsMap: Record<string, any[]> = {};
    if (deviceIds.length > 0) {
      const placeholders = deviceIds.map(() => '?').join(',');
      const portsRows = await db.query(
        `SELECT id, device_id, port_name, port_type, speed, status, vlan,
                connected_to_device_id, connected_to_port_name, description
         FROM device_ports
         WHERE device_id IN (${placeholders})
         ORDER BY port_name ASC;`,
        deviceIds
      );
      portsRows.forEach((p: any) => {
        portsMap[p.device_id] = portsMap[p.device_id] || [];
        portsMap[p.device_id].push(p);
      });
    }

    // Attach ports to device objects
    const devicesWithPorts = devices.map(d => ({
      ...d,
      ports: portsMap[d.id] || []
    }));

    // Build the U-slot grid array from top (uCapacity) down to 1
    // Each entry: { u: number, isOccupied: boolean, device: any | null, isDeviceRoot: boolean }
    const slots = [];
    const capacity = rack.uCapacity;

    for (let u = capacity; u >= 1; u--) {
      // Find if any device occupies this U
      const occupyingDev = devicesWithPorts.find(d => {
        const startU = Number(d.rack_u_position) || 0;
        const height = Number(d.rack_u_height) || 1;
        // Device spans from startU down to startU - height + 1
        return u <= startU && u > (startU - height);
      });

      if (occupyingDev) {
        slots.push({
          u,
          isOccupied: true,
          deviceId: occupyingDev.id,
          device: occupyingDev,
          isDeviceRoot: Number(occupyingDev.rack_u_position) === u,
          height: Number(occupyingDev.rack_u_height) || 1
        });
      } else {
        slots.push({
          u,
          isOccupied: false,
          deviceId: null,
          device: null,
          isDeviceRoot: false,
          height: 1
        });
      }
    }

    const totalUsedU = devices.reduce((sum, d) => sum + (Number(d.rack_u_height) || 1), 0);

    res.json({
      success: true,
      data: {
        ...rack,
        usedU: totalUsedU,
        freeU: Math.max(0, capacity - totalUsedU),
        occupancyPercent: Math.round((totalUsedU / capacity) * 100),
        devices: devicesWithPorts,
        slots
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST create new rack
racksRouter.post('/', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      code,
      buildingId,
      buildingName,
      room,
      uCapacity = 24,
      maxPowerWatts = 2500,
      description = '',
      authorName = 'Admin IT',
      authorRole = 'ADMIN'
    } = req.body;

    if (!name || !code || !buildingId) {
      return res.status(400).json({ success: false, message: 'Nama rack, kode, dan gedung wajib diisi' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await db.queryOne('SELECT id FROM racks WHERE code = ?;', [cleanCode]);
    if (existing) {
      return res.status(409).json({ success: false, message: `Kode rack "${cleanCode}" sudah digunakan.` });
    }

    const rackId = `rack-${Date.now()}`;
    await db.execute(`
      INSERT INTO racks (
        id, name, code, building_id, building_name, room, 
        u_capacity, used_u, max_power_watts, current_power_watts, max_weight_kg, status, description, device_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 800, 'active', ?, '[]');
    `, [
      rackId,
      name.trim(),
      cleanCode,
      buildingId,
      buildingName || '',
      room || 'Panel IT',
      Number(uCapacity) || 24,
      Number(maxPowerWatts) || 2500,
      description.trim()
    ]);

    await logAuditEvent({
      username: authorName,
      userRole: authorRole,
      action: 'CREATE_RACK',
      entity: 'RACK',
      entityId: rackId,
      details: { name, code: cleanCode, buildingName, uCapacity }
    });

    res.status(201).json({
      success: true,
      message: `Rack "${name}" (${cleanCode}) berhasil ditambahkan.`,
      data: { id: rackId, code: cleanCode }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUT update rack
racksRouter.put('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const current = await db.queryOne('SELECT * FROM racks WHERE id = ?;', [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Rack tidak ditemukan' });
    }

    const {
      name,
      code,
      buildingId,
      buildingName,
      room,
      uCapacity,
      maxPowerWatts,
      description,
      status,
      authorName = 'Admin IT',
      authorRole = 'ADMIN'
    } = req.body;

    if (code && code.trim().toUpperCase() !== current.code) {
      const codeCheck = await db.queryOne('SELECT id FROM racks WHERE code = ? AND id != ?;', [code.trim().toUpperCase(), id]);
      if (codeCheck) {
        return res.status(409).json({ success: false, message: `Kode rack "${code}" sudah terdaftar.` });
      }
    }

    await db.execute(`
      UPDATE racks SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        building_id = COALESCE(?, building_id),
        building_name = COALESCE(?, building_name),
        room = COALESCE(?, room),
        u_capacity = COALESCE(?, u_capacity),
        max_power_watts = COALESCE(?, max_power_watts),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
      WHERE id = ?;
    `, [
      name ? name.trim() : null,
      code ? code.trim().toUpperCase() : null,
      buildingId ?? null,
      buildingName ?? null,
      room ?? null,
      uCapacity ? Number(uCapacity) : null,
      maxPowerWatts ? Number(maxPowerWatts) : null,
      description ?? null,
      status ?? null,
      id
    ]);

    await logAuditEvent({
      username: authorName,
      userRole: authorRole,
      action: 'UPDATE_RACK',
      entity: 'RACK',
      entityId: id,
      details: { code: current.code, updatedName: name || current.name }
    });

    const updated = await db.queryOne('SELECT * FROM racks WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Data rack berhasil diperbarui.', data: mapRackRow(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE rack
racksRouter.delete('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { force, authorName = 'Admin IT', authorRole = 'ADMIN' } = req.query;

    const current = await db.queryOne('SELECT * FROM racks WHERE id = ?;', [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Rack tidak ditemukan' });
    }

    // Check mounted devices
    const mounted = await db.query('SELECT id, name, code FROM devices WHERE rack_id = ?;', [id]);
    if (mounted.length > 0 && force !== 'true') {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message: `Rack "${current.name}" masih memiliki ${mounted.length} perangkat terpasang. Lepaskan perangkat terlebih dahulu atau konfirmasi hapus paksa.`,
        mountedCount: mounted.length,
        devices: mounted
      });
    }

    // Unmount any devices if forced
    await db.execute('UPDATE devices SET rack_id = NULL, rack_u_position = NULL WHERE rack_id = ?;', [id]);
    await db.execute('DELETE FROM racks WHERE id = ?;', [id]);

    await logAuditEvent({
      username: (authorName as string) || 'Admin IT',
      userRole: (authorRole as string) || 'ADMIN',
      action: 'DELETE_RACK',
      entity: 'RACK',
      entityId: id,
      details: { code: current.code, name: current.name, unmountedCount: mounted.length }
    });

    res.json({ success: true, message: `Rack "${current.name}" (${current.code}) berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST mount device to rack
racksRouter.post('/:id/mount', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deviceId, uPosition, uHeight = 1, authorName = 'Admin IT', authorRole = 'ADMIN' } = req.body;

    if (!deviceId || !uPosition) {
      return res.status(400).json({ success: false, message: 'deviceId dan uPosition wajib diisi' });
    }

    const rack = await db.queryOne('SELECT * FROM racks WHERE id = ?;', [id]);
    if (!rack) {
      return res.status(404).json({ success: false, message: 'Rack tidak ditemukan' });
    }

    const device = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [deviceId]);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }

    const pos = Number(uPosition);
    const height = Math.max(1, Number(uHeight) || 1);
    const capacity = Number(rack.u_capacity);

    if (pos < 1 || pos > capacity) {
      return res.status(400).json({
        success: false,
        message: `Posisi U harus berada di antara 1 dan ${capacity}.`
      });
    }

    if (pos - height + 1 < 1) {
      return res.status(400).json({
        success: false,
        message: `Tinggi perangkat (${height}U) melebihi batas bawah rack dari posisi U${pos}.`
      });
    }

    // Check collision with other devices in this rack
    const otherDevices = await db.query(
      'SELECT id, name, code, rack_u_position, rack_u_height FROM devices WHERE rack_id = ? AND id != ? AND rack_u_position IS NOT NULL;',
      [id, deviceId]
    );

    const targetSlots = new Set<number>();
    for (let i = 0; i < height; i++) {
      targetSlots.add(pos - i);
    }

    for (const other of otherDevices) {
      const oPos = Number(other.rack_u_position);
      const oHeight = Number(other.rack_u_height) || 1;
      for (let i = 0; i < oHeight; i++) {
        const slot = oPos - i;
        if (targetSlots.has(slot)) {
          return res.status(409).json({
            success: false,
            message: `Tabrakan slot U: Unit U${slot} sudah ditempati oleh perangkat "${other.code || other.name}".`
          });
        }
      }
    }

    // Mount device
    await db.execute(
      'UPDATE devices SET rack_id = ?, rack_u_position = ?, rack_u_height = ? WHERE id = ?;',
      [id, pos, height, deviceId]
    );

    await logAuditEvent({
      username: authorName,
      userRole: authorRole,
      action: 'MOUNT_DEVICE',
      entity: 'RACK',
      entityId: id,
      details: { rackCode: rack.code, deviceCode: device.code, uPosition: pos, uHeight: height }
    });

    res.json({
      success: true,
      message: `Perangkat "${device.code || device.name}" berhasil dipasang di ${rack.code} pada slot U${pos}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST unmount device from rack
racksRouter.post('/:id/unmount', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deviceId, authorName = 'Admin IT', authorRole = 'ADMIN' } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId wajib diisi' });
    }

    const device = await db.queryOne('SELECT * FROM devices WHERE id = ? AND rack_id = ?;', [deviceId, id]);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan di rack ini' });
    }

    await db.execute(
      'UPDATE devices SET rack_id = NULL, rack_u_position = NULL WHERE id = ?;',
      [deviceId]
    );

    await logAuditEvent({
      username: authorName,
      userRole: authorRole,
      action: 'UNMOUNT_DEVICE',
      entity: 'RACK',
      entityId: id,
      details: { rackId: id, deviceCode: device.code, formerUPos: device.rack_u_position }
    });

    res.json({
      success: true,
      message: `Perangkat "${device.code || device.name}" berhasil dilepas dari rack.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
