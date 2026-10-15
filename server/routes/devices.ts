import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const devicesRouter = Router();

// Secure all device endpoints
devicesRouter.use(authenticateToken);

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

// Helper to map DB row to frontend camelCase Device object
function mapDeviceRow(d: any) {
  const posX = d.pos_x !== null && d.pos_x !== undefined ? Number(d.pos_x) : (d.x !== null && d.x !== undefined ? Number(d.x) : null);
  const posY = d.pos_y !== null && d.pos_y !== undefined ? Number(d.pos_y) : (d.y !== null && d.y !== undefined ? Number(d.y) : null);

  return {
    id: d.id,
    code: d.code || d.name,
    name: d.name,
    ip: d.ip,
    mac: d.mac || '',
    type: d.type,
    vendor: d.vendor || d.brand || 'Generic',
    brand: d.brand || d.vendor || 'Generic',
    model: d.model || 'Enterprise Unit',
    serialNumber: d.serial_number || '',
    hostname: d.hostname || `${d.name?.toLowerCase() || 'device'}.cba-chemical.local`,
    buildingId: d.building_id,
    buildingName: d.building_name || '',
    room: d.room || 'Panel IT',
    rackId: d.rack_id || null,
    status: d.status || 'online',
    portsTotal: Number(d.ports_total) || 24,
    portsActive: Number(d.ports_active) || 0,
    firmware: d.firmware || 'v1.0.0',
    uptime: d.uptime || '15 hari',
    installationDate: d.installation_date || '2024-01-15',
    description: d.description || '',
    x: posX,
    y: posY,
    lastSeen: d.last_seen || d.created_at || new Date().toISOString()
  };
}

// Helper to map DB row to Port object
function mapPortRow(p: any) {
  return {
    id: p.id,
    deviceId: p.device_id,
    portName: p.port_name,
    portType: p.port_type || 'Ethernet',
    speed: p.speed || '1 Gbps',
    status: p.status || 'up',
    vlan: p.vlan || '1',
    connectedToDeviceId: p.connected_to_device_id || null,
    connectedToPortName: p.connected_to_port_name || null,
    cableId: p.cable_id || null,
    description: p.description || '',
    createdAt: p.created_at
  };
}

// 1. GET all devices (with search, filters, sorting, and pagination)
devicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { building_id, status, type, search, sort_by, sort_order, page, limit } = req.query;

    let query = 'SELECT * FROM devices WHERE 1=1';
    const params: any[] = [];

    if (building_id && building_id !== 'all') {
      query += ' AND building_id = ?';
      params.push(building_id);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query += ' AND (name LIKE ? OR code LIKE ? OR ip LIKE ? OR model LIKE ? OR vendor LIKE ? OR brand LIKE ? OR building_name LIKE ?)';
      params.push(s, s, s, s, s, s, s);
    }

    // Sort column mapping
    const validSortCols: Record<string, string> = {
      name: 'name',
      code: 'code',
      ip: 'ip',
      type: 'type',
      status: 'status',
      vendor: 'vendor',
      building: 'building_name',
      lastSeen: 'last_seen'
    };

    const sortByCol = typeof sort_by === 'string' && validSortCols[sort_by] ? validSortCols[sort_by] : 'name';
    const sortDir = (typeof sort_order === 'string' && sort_order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    query += ` ORDER BY ${sortByCol} ${sortDir}`;

    const allRows = await db.query(query, params);
    const totalCount = allRows.length;

    let rows = allRows;
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
      const offset = (pageNum - 1) * limitNum;
      rows = allRows.slice(offset, offset + limitNum);
    }

    const devices = rows.map(mapDeviceRow);
    res.json({ success: true, total: totalCount, count: devices.length, data: devices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET single device by ID
devicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const d = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [id]);
    if (!d) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }
    res.json({ success: true, data: mapDeviceRow(d) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET active connections & dependencies check for safe delete
devicesRouter.get('/:id/connections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [id]);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }

    // Check cables connected
    const cables = await db.query(
      'SELECT id, code, name FROM cable_routes WHERE from_building_id = ? OR to_building_id = ?;',
      [device.building_id, device.building_id]
    );

    // Check ports with active link
    const ports = await db.query(
      'SELECT id, port_name, status, connected_to_device_id FROM device_ports WHERE device_id = ? AND status = "up";',
      [id]
    );

    // Check open alerts
    const alerts = await db.query(
      'SELECT id, title, severity FROM alerts WHERE device_id = ? AND status != "resolved";',
      [id]
    );

    const details: string[] = [];
    if (ports.length > 0) {
      details.push(`${ports.length} port fisik dalam status aktif (Link UP)`);
    }
    if (cables.length > 0) {
      details.push(`Gedung ${device.building_name || device.building_id} memiliki ${cables.length} rute kabel fiber/UTP terhubung`);
    }
    if (alerts.length > 0) {
      details.push(`${alerts.length} insiden/alert aktif terkait perangkat ini`);
    }

    const hasConnections = ports.length > 0 || cables.length > 0;

    res.json({
      success: true,
      hasConnections,
      cablesCount: cables.length,
      activePortsCount: ports.length,
      activeAlertsCount: alerts.length,
      details
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST create new device
devicesRouter.post('/', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      id, code, name, ip, mac, type, vendor, brand, model, serialNumber,
      hostname, buildingId, buildingName, room, rackId, status,
      portsTotal, portsActive, firmware, installationDate, description
    } = req.body;

    const deviceCode = (code || name || '').trim();
    const deviceName = (name || code || '').trim();
    const deviceIp = (ip || '').trim();
    const deviceType = (type || '').trim();
    const deviceVendor = (vendor || brand || 'Generic').trim();

    // Required fields check
    if (!deviceCode || !deviceName || !deviceIp || !deviceType) {
      return res.status(400).json({
        success: false,
        message: 'Field Kode Perangkat, Nama, IP Address, dan Tipe Perangkat wajib diisi.'
      });
    }

    // IP regex validation
    if (!IPV4_REGEX.test(deviceIp)) {
      return res.status(400).json({
        success: false,
        message: 'Format IP Address tidak valid. Gunakan format IPv4 yang benar (contoh: 192.168.1.10).'
      });
    }

    // MAC regex validation (if provided)
    if (mac && mac.trim() !== '' && !MAC_REGEX.test(mac.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format MAC Address tidak valid. Gunakan format (XX:XX:XX:XX:XX:XX).'
      });
    }

    // Check unique code
    const existing = await db.queryOne('SELECT id FROM devices WHERE code = ? OR id = ?;', [deviceCode, id || deviceCode]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Kode perangkat "${deviceCode}" sudah terdaftar dalam sistem. Gunakan kode unik lain.`
      });
    }

    const deviceId = id || `dev-${deviceCode.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    const posX = req.body.x !== undefined ? req.body.x : (req.body.pos_x !== undefined ? req.body.pos_x : null);
    const posY = req.body.y !== undefined ? req.body.y : (req.body.pos_y !== undefined ? req.body.pos_y : null);

    const sql = `
      INSERT INTO devices (
        id, code, name, ip, mac, type, vendor, brand, model, serial_number,
        hostname, building_id, building_name, room, rack_id, status,
        ports_total, ports_active, firmware, uptime, installation_date, description,
        pos_x, pos_y
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.execute(sql, [
      deviceId,
      deviceCode,
      deviceName,
      deviceIp,
      mac ? mac.trim().toUpperCase() : '',
      deviceType,
      deviceVendor,
      deviceVendor,
      model || 'Enterprise Hardware',
      serialNumber || '',
      hostname || `${deviceCode.toLowerCase()}.cba-chemical.local`,
      buildingId || null,
      buildingName || '',
      room || 'Panel IT',
      rackId || null,
      status || 'online',
      Number(portsTotal) || 24,
      Number(portsActive) || 0,
      firmware || 'v1.0.0',
      'Baru terpasang',
      installationDate || new Date().toISOString().split('T')[0],
      description || '',
      posX !== null && posX !== undefined ? Number(posX) : null,
      posY !== null && posY !== undefined ? Number(posY) : null
    ]);

    // Create default ports for this device
    const totalPortsCount = Number(portsTotal) || 24;
    for (let i = 1; i <= Math.min(totalPortsCount, 8); i++) {
      await db.execute(`
        INSERT INTO device_ports (id, device_id, port_name, port_type, speed, status, vlan, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        `port-${deviceId}-${i}`,
        deviceId,
        `Gi1/0/${i}`,
        'Ethernet',
        '1 Gbps',
        i === 1 ? 'up' : 'down',
        '10',
        i === 1 ? 'Active port' : 'Available port'
      ]);
    }

    const created = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [deviceId]);

    await logAuditEvent({
      username: req.body.authorName || 'Admin IT',
      userRole: req.body.authorRole || 'ADMIN',
      action: 'CREATE_DEVICE',
      entity: 'DEVICE',
      entityId: deviceId,
      details: { code: deviceCode, name: deviceName, ip: deviceIp, building: buildingName }
    });

    res.status(201).json({
      success: true,
      message: 'Perangkat berhasil ditambahkan ke inventaris jaringan.',
      data: mapDeviceRow(created)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. PUT update device
devicesRouter.put('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const current = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }

    const {
      code, name, ip, mac, type, vendor, brand, model, serialNumber,
      hostname, buildingId, buildingName, room, rackId, status,
      portsTotal, portsActive, firmware, uptime, installationDate, description
    } = req.body;

    // Validate IP if provided
    if (ip && !IPV4_REGEX.test(ip.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format IP Address tidak valid. Gunakan format IPv4 yang benar.'
      });
    }

    // Validate MAC if provided
    if (mac && !MAC_REGEX.test(mac.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format MAC Address tidak valid. Gunakan format XX:XX:XX:XX:XX:XX.'
      });
    }

    // Check duplicate IP if changed
    if (ip && ip.trim() !== current.ip) {
      const existingIp = await db.queryOne('SELECT id FROM devices WHERE ip = ? AND id != ?;', [ip.trim(), id]);
      if (existingIp) {
        return res.status(409).json({
          success: false,
          message: `IP Address ${ip} sudah digunakan oleh perangkat lain.`
        });
      }
    }

    // Check duplicate code if changed
    if (code && code.trim() !== current.code) {
      const existingCode = await db.queryOne('SELECT id FROM devices WHERE code = ? AND id != ?;', [code.trim(), id]);
      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: `Kode perangkat ${code} sudah terdaftar.`
        });
      }
    }

    const updateVendor = vendor || brand;
    const posX = req.body.x !== undefined ? req.body.x : (req.body.pos_x !== undefined ? req.body.pos_x : null);
    const posY = req.body.y !== undefined ? req.body.y : (req.body.pos_y !== undefined ? req.body.pos_y : null);

    const sql = `
      UPDATE devices SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        ip = COALESCE(?, ip),
        mac = COALESCE(?, mac),
        type = COALESCE(?, type),
        vendor = COALESCE(?, vendor),
        brand = COALESCE(?, brand),
        model = COALESCE(?, model),
        serial_number = COALESCE(?, serial_number),
        hostname = COALESCE(?, hostname),
        building_id = COALESCE(?, building_id),
        building_name = COALESCE(?, building_name),
        room = COALESCE(?, room),
        rack_id = COALESCE(?, rack_id),
        status = COALESCE(?, status),
        ports_total = COALESCE(?, ports_total),
        ports_active = COALESCE(?, ports_active),
        firmware = COALESCE(?, firmware),
        uptime = COALESCE(?, uptime),
        installation_date = COALESCE(?, installation_date),
        description = COALESCE(?, description),
        pos_x = COALESCE(?, pos_x),
        pos_y = COALESCE(?, pos_y),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
    `;

    await db.execute(sql, [
      code ? code.trim().toUpperCase() : null,
      name ? name.trim() : null,
      ip ? ip.trim() : null,
      mac !== undefined ? mac.trim().toUpperCase() : null,
      type ?? null,
      updateVendor ?? null,
      updateVendor ?? null,
      model ?? null,
      serialNumber ?? null,
      hostname ?? null,
      buildingId ?? null,
      buildingName ?? null,
      room ?? null,
      rackId ?? null,
      status ?? null,
      portsTotal !== undefined ? Number(portsTotal) : null,
      portsActive !== undefined ? Number(portsActive) : null,
      firmware ?? null,
      uptime ?? null,
      installationDate ?? null,
      description ?? null,
      posX !== null && posX !== undefined ? Number(posX) : null,
      posY !== null && posY !== undefined ? Number(posY) : null,
      id
    ]);

    const updated = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [id]);

    await logAuditEvent({
      username: req.body.authorName || 'Admin IT',
      userRole: req.body.authorRole || 'ADMIN',
      action: 'UPDATE_DEVICE',
      entity: 'DEVICE',
      entityId: id,
      details: { code: current.code, name: name || current.name, status: status || current.status }
    });

    res.json({
      success: true,
      message: 'Data perangkat berhasil diperbarui.',
      data: mapDeviceRow(updated)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE device with dependency checking
devicesRouter.delete('/:id', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { force, authorName = 'Admin IT', authorRole = 'ADMIN' } = req.query;
    const current = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [id]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }

    // Check dependencies (active links and open maintenance tickets)
    const activeLinks = await db.query(
      'SELECT id, cable_code, speed FROM network_links WHERE source_device_id = ? OR target_device_id = ?;',
      [id, id]
    );
    const activeTickets = await db.query(
      "SELECT id, ticket_no, title, status FROM maintenance_tickets WHERE device_id = ? AND status != 'completed';",
      [id]
    );

    if (force !== 'true' && (activeLinks.length > 0 || activeTickets.length > 0)) {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message: `Perangkat "${current.code || current.name}" memiliki relasi aktif (${activeLinks.length} tautan link dan ${activeTickets.length} tiket terbuka). Lanjutkan penghapusan paksa?`,
        dependencies: {
          linksCount: activeLinks.length,
          ticketsCount: activeTickets.length,
          links: activeLinks,
          tickets: activeTickets
        }
      });
    }

    // Cascade delete links and ports
    await db.execute('DELETE FROM network_links WHERE source_device_id = ? OR target_device_id = ?;', [id, id]);
    await db.execute('DELETE FROM device_ports WHERE device_id = ?;', [id]);
    await db.execute('DELETE FROM devices WHERE id = ?;', [id]);

    await logAuditEvent({
      username: (authorName as string) || 'Admin IT',
      userRole: (authorRole as string) || 'ADMIN',
      action: 'DELETE_DEVICE',
      entity: 'DEVICE',
      entityId: id,
      details: { code: current.code, name: current.name, deletedLinks: activeLinks.length }
    });

    res.json({
      success: true,
      message: `Perangkat "${current.code || current.name}" beserta relasi port dan link topologinya berhasil dihapus.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PORT MANAGEMENT ENDPOINTS
// ==========================================

// GET all ports of a device
devicesRouter.get('/:id/ports', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await db.query('SELECT * FROM device_ports WHERE device_id = ? ORDER BY port_name ASC;', [id]);
    const ports = rows.map(mapPortRow);
    res.json({ success: true, count: ports.length, data: ports });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new port to device
devicesRouter.post('/:id/ports', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { portName, portType, speed, status, vlan, description } = req.body;

    if (!portName || !portName.trim()) {
      return res.status(400).json({ success: false, message: 'Nama port (misal: Gi1/0/1, SFP1) wajib diisi.' });
    }

    const portId = `port-${id}-${Date.now()}`;
    const sql = `
      INSERT INTO device_ports (id, device_id, port_name, port_type, speed, status, vlan, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.execute(sql, [
      portId,
      id,
      portName.trim(),
      portType || 'Ethernet',
      speed || '1 Gbps',
      status || 'up',
      vlan || '1',
      description || ''
    ]);

    const created = await db.queryOne('SELECT * FROM device_ports WHERE id = ?;', [portId]);
    res.status(201).json({
      success: true,
      message: `Port "${portName}" berhasil ditambahkan.`,
      data: mapPortRow(created)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update port
devicesRouter.put('/:id/ports/:portId', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, portId } = req.params;
    const { portName, portType, speed, status, vlan, description } = req.body;

    const sql = `
      UPDATE device_ports SET
        port_name = COALESCE(?, port_name),
        port_type = COALESCE(?, port_type),
        speed = COALESCE(?, speed),
        status = COALESCE(?, status),
        vlan = COALESCE(?, vlan),
        description = COALESCE(?, description)
      WHERE id = ? AND device_id = ?;
    `;

    await db.execute(sql, [
      portName ? portName.trim() : null,
      portType ?? null,
      speed ?? null,
      status ?? null,
      vlan ?? null,
      description ?? null,
      portId,
      id
    ]);

    const updated = await db.queryOne('SELECT * FROM device_ports WHERE id = ?;', [portId]);
    res.json({
      success: true,
      message: 'Data port berhasil diperbarui.',
      data: updated ? mapPortRow(updated) : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE port
devicesRouter.delete('/:id/ports/:portId', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, portId } = req.params;
    await db.execute('DELETE FROM device_ports WHERE id = ? AND device_id = ?;', [portId, id]);
    res.json({ success: true, message: 'Port berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
