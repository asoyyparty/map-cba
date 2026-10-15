import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/database.ts';
import {
  authenticateToken,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const topologyRouter = Router();

// Secure all topology endpoints
topologyRouter.use(authenticateToken);

// GET /api/topology - Complete React Flow graph nodes and edges
topologyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { building_id, status } = req.query;

    // 1. Fetch devices
    let devSql = 'SELECT * FROM devices WHERE 1=1';
    const devParams: any[] = [];
    if (building_id && building_id !== 'all') {
      devSql += ' AND building_id = ?';
      devParams.push(building_id);
    }
    if (status && status !== 'all') {
      devSql += ' AND status = ?';
      devParams.push(status);
    }
    const devices = await db.query(devSql, devParams);

    // 2. Fetch network links
    const links = await db.query('SELECT * FROM network_links');

    // 3. Fetch cable routes for extra context
    const cables = await db.query('SELECT * FROM cable_routes');

    // Map tier / level for hierarchical visualization
    // Tier 1: Firewall, Router (Top)
    // Tier 2: Core Switch (Middle-High)
    // Tier 3: Distribution Switch / Access Switch (Middle)
    // Tier 4: Server, Access Point, CCTV, UPS (Bottom)
    function getTier(type: string): number {
      const t = (type || '').toLowerCase();
      if (t.includes('firewall') || t.includes('router')) return 1;
      if (t.includes('core')) return 2;
      if (t.includes('switch')) return 3;
      if (t.includes('server')) return 4;
      if (t.includes('access_point') || t.includes('ap') || t.includes('cctv')) return 5;
      return 4;
    }

    // Auto calculate layout positions (Tiered layout)
    const tierGroups: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const d of devices) {
      const tier = getTier(d.type);
      tierGroups[tier] = tierGroups[tier] || [];
      tierGroups[tier].push(d);
    }

    const nodes: any[] = [];
    const TIER_Y_SPACING = 180;
    const NODE_X_SPACING = 240;

    Object.entries(tierGroups).forEach(([tierStr, devs]) => {
      const tier = Number(tierStr);
      const totalInTier = devs.length;
      const startX = -(totalInTier - 1) * (NODE_X_SPACING / 2) + 600;
      const y = (tier - 1) * TIER_Y_SPACING + 100;

      devs.forEach((d, idx) => {
        nodes.push({
          id: d.id,
          type: 'networkDeviceNode',
          position: {
            x: Math.round(startX + idx * NODE_X_SPACING),
            y: Math.round(y)
          },
          data: {
            id: d.id,
            name: d.name,
            code: d.code || d.name,
            type: d.type,
            ip: d.ip,
            mac: d.mac,
            status: d.status || 'online',
            buildingId: d.building_id,
            buildingName: d.building_name || '',
            room: d.room || 'Panel IT',
            portsTotal: Number(d.ports_total) || 24,
            portsActive: Number(d.ports_active) || 0,
            tier: tier
          }
        });
      });
    });

    // Create edge objects with multi-line labels
    const deviceIdSet = new Set(devices.map(d => d.id));
    const edges: any[] = [];

    for (const link of links) {
      // Only include edge if both source and target exist in queried nodes (or if no filter)
      if (building_id && building_id !== 'all') {
        if (!deviceIdSet.has(link.source_device_id) && !deviceIdSet.has(link.target_device_id)) {
          continue;
        }
      }

      const isUp = link.status === 'up';
      const edgeColor = !isUp ? '#ef4444' : link.speed?.includes('10 G') ? '#3b82f6' : '#10b981';

      edges.push({
        id: link.id,
        source: link.source_device_id,
        target: link.target_device_id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        animated: isUp,
        style: {
          stroke: edgeColor,
          strokeWidth: 2.5
        },
        data: {
          id: link.id,
          cableCode: link.cable_code,
          speed: link.speed || '10 Gbps',
          bandwidth: link.bandwidth || '10 Gbps',
          sourcePort: link.source_port_name,
          targetPort: link.target_port_name,
          status: link.status,
          labelMain: link.cable_code,
          labelSub: `${link.speed || '10 Gbps'} • ${link.source_port_name} → ${link.target_port_name}`
        }
      });
    }

    res.json({
      success: true,
      data: {
        nodes,
        edges,
        cablesSummary: cables.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          from: c.from_building_name,
          to: c.to_building_name,
          status: c.status,
          cores: `${c.used_cores}/${c.total_cores}`
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/topology/trace - Trace network connection path between devices
topologyRouter.post('/trace', async (req: Request, res: Response) => {
  try {
    const { fromDeviceId, toDeviceId } = req.body;
    if (!fromDeviceId) {
      return res.status(400).json({ success: false, message: 'fromDeviceId is required' });
    }

    const allLinks = await db.query('SELECT * FROM network_links');
    const allDevices = await db.query('SELECT id, name, code, type, ip, status, building_name FROM devices');
    const devMap = new Map<string, any>(allDevices.map(d => [d.id, d]));

    // BFS pathfinder
    const adjacency = new Map<string, Array<{ target: string; link: any }>>();
    for (const l of allLinks) {
      if (!adjacency.has(l.source_device_id)) adjacency.set(l.source_device_id, []);
      if (!adjacency.has(l.target_device_id)) adjacency.set(l.target_device_id, []);

      adjacency.get(l.source_device_id)!.push({ target: l.target_device_id, link: l });
      adjacency.get(l.target_device_id)!.push({ target: l.source_device_id, link: l });
    }

    const targetId = toDeviceId || 'dev-fw-ku-01'; // Default target to Perimeter Firewall
    const queue: Array<{ current: string; path: string[]; linkPath: any[] }> = [
      { current: fromDeviceId, path: [fromDeviceId], linkPath: [] }
    ];
    const visited = new Set<string>([fromDeviceId]);

    let foundPath: string[] | null = null;
    let foundLinks: any[] = [];

    while (queue.length > 0) {
      const { current, path, linkPath } = queue.shift()!;
      if (current === targetId) {
        foundPath = path;
        foundLinks = linkPath;
        break;
      }

      const neighbors = adjacency.get(current) || [];
      for (const n of neighbors) {
        if (!visited.has(n.target)) {
          visited.add(n.target);
          queue.push({
            current: n.target,
            path: [...path, n.target],
            linkPath: [...linkPath, n.link]
          });
        }
      }
    }

    const hopDetails = (foundPath || [fromDeviceId]).map(id => devMap.get(id)).filter(Boolean);

    res.json({
      success: true,
      data: {
        from: devMap.get(fromDeviceId),
        to: devMap.get(targetId),
        hopsCount: hopDetails.length,
        hops: hopDetails,
        links: foundLinks,
        pathStatus: hopDetails.every(h => h.status === 'online') ? 'healthy' : 'degraded'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
