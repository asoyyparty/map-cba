import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/database.ts';
import { monitoringEmitter, triggerSimulatedImpact, type LiveMetricUpdate } from '../services/pingService.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const monitoringRouter = Router();

// Secure all monitoring endpoints
monitoringRouter.use(authenticateToken);

// SSE Live Stream Endpoint for real-time telemetry updates
monitoringRouter.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Send initial connected greeting
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to CBA Live Network Stream', time: new Date().toISOString() })}\n\n`);

  const telemetryHandler = (data: LiveMetricUpdate) => {
    res.write(`event: telemetry\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const impactHandler = (data: any) => {
    res.write(`event: impact\ndata: ${JSON.stringify(data)}\n\n`);
  };

  monitoringEmitter.on('telemetry', telemetryHandler);
  monitoringEmitter.on('impact', impactHandler);

  // Clean up when client disconnects
  req.on('close', () => {
    monitoringEmitter.off('telemetry', telemetryHandler);
    monitoringEmitter.off('impact', impactHandler);
  });
});

// Simulate Outage / Impact Endpoint
monitoringRouter.post('/simulate-impact', requireRole('ADMIN', 'IT_ENGINEER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId, status } = req.body;
    if (!deviceId || !status) {
      return res.status(400).json({ success: false, message: 'deviceId dan status wajib diisi' });
    }

    const result = await triggerSimulatedImpact(deviceId, status);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }

    res.json({ success: true, message: 'Simulasi dampak berhasil dijalankan', data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET network status overview
monitoringRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const devicesCount = await db.queryOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
      FROM devices;
    `);

    const buildingsCount = await db.queryOne('SELECT COUNT(*) as count FROM buildings;');
    const cablesCount = await db.queryOne('SELECT COUNT(*) as count FROM cable_routes;');
    const openAlertsCount = await db.queryOne("SELECT COUNT(*) as count FROM alerts WHERE status = 'open';");

    res.json({
      success: true,
      data: {
        totalBuildings: buildingsCount?.count || 0,
        totalCables: cablesCount?.count || 0,
        openAlerts: openAlertsCount?.count || 0,
        devices: {
          total: devicesCount?.total || 0,
          online: Number(devicesCount?.online) || 0,
          warning: Number(devicesCount?.warning) || 0,
          offline: Number(devicesCount?.offline) || 0
        },
        traffic: {
          uploadMbps: 320.4,
          downloadMbps: 280.8,
          avgLatencyMs: 1.8,
          packetLossPercent: 0.0
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ping probe endpoint (simulates ICMP latency check to device IP)
monitoringRouter.get('/ping/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [id]);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
    }

    // Realistic network latency simulation based on device status
    let latency = 1.2 + Math.random() * 1.5;
    let status = device.status;
    let packetLoss = 0;

    if (device.status === 'warning') {
      latency = 45.0 + Math.random() * 20.0;
      packetLoss = 5.0;
    } else if (device.status === 'offline') {
      latency = 0;
      packetLoss = 100.0;
    }

    res.json({
      success: true,
      data: {
        deviceId: device.id,
        deviceName: device.name,
        ip: device.ip,
        status: status,
        latencyMs: Math.round(latency * 10) / 10,
        packetLossPercent: packetLoss,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
