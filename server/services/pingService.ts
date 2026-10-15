import { EventEmitter } from 'node:events';
import { db } from '../db/database.ts';

export const monitoringEmitter = new EventEmitter();

let isRunning = false;
let intervalTimer: NodeJS.Timeout | null = null;

export interface LiveMetricUpdate {
  timestamp: string;
  traffic: {
    uploadMbps: number;
    downloadMbps: number;
    avgLatencyMs: number;
  };
  deviceUpdates: {
    id: string;
    status: string;
    latencyMs: number;
  }[];
  newAlert?: {
    id: string;
    title: string;
    message: string;
    severity: string;
  };
}

// Background Ping Worker - simulates periodic ICMP probe & traffic telemetry
export function startBackgroundPingWorker() {
  if (isRunning) return;
  isRunning = true;
  console.log('[PingService] Background Network Probe Worker started.');

  // Run initial probe immediately
  runProbeCycle();

  // Run probe every 12 seconds
  intervalTimer = setInterval(() => {
    runProbeCycle();
  }, 12000);
}

export function stopBackgroundPingWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  isRunning = false;
  console.log('[PingService] Background Network Probe Worker stopped.');
}

async function runProbeCycle() {
  try {
    const devices = await db.query('SELECT id, name, ip, status FROM devices;');
    if (!devices || devices.length === 0) return;

    const deviceUpdates: { id: string; status: string; latencyMs: number }[] = [];
    let totalLatency = 0;

    for (const dev of devices) {
      let latency = 1.0 + Math.random() * 2.0;

      if (dev.status === 'warning') {
        latency = 45.0 + Math.random() * 25.0;
      } else if (dev.status === 'offline') {
        latency = 0;
      }

      totalLatency += latency;
      deviceUpdates.push({
        id: dev.id,
        status: dev.status,
        latencyMs: Math.round(latency * 10) / 10
      });
    }

    const avgLatency = Math.round((totalLatency / devices.length) * 10) / 10;
    
    // Simulate real-time bandwidth variation (±10% fluctuation)
    const baseUpload = 320.0;
    const baseDownload = 280.0;
    const uploadMbps = Math.round((baseUpload + (Math.random() * 20 - 10)) * 10) / 10;
    const downloadMbps = Math.round((baseDownload + (Math.random() * 20 - 10)) * 10) / 10;

    const metricPayload: LiveMetricUpdate = {
      timestamp: new Date().toISOString(),
      traffic: {
        uploadMbps,
        downloadMbps,
        avgLatencyMs: avgLatency
      },
      deviceUpdates
    };

    // Store sample in monitoring_metrics
    const sql = `
      INSERT INTO monitoring_metrics (device_id, latency_ms, packet_loss, cpu_load, upload_mbps, download_mbps, status)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    await db.execute(sql, ['SW-KU-01', avgLatency, 0.0, 18.0 + Math.random() * 5, uploadMbps, downloadMbps, 'online']);

    // Broadcast update to all connected SSE clients
    monitoringEmitter.emit('telemetry', metricPayload);
  } catch (err) {
    console.error('[PingService] Error in probe cycle:', err);
  }
}

// Trigger instant simulated impact (e.g. cable cut or device outage)
export async function triggerSimulatedImpact(targetDeviceId: string, newStatus: 'warning' | 'offline' | 'online') {
  try {
    const dev = await db.queryOne('SELECT * FROM devices WHERE id = ?;', [targetDeviceId]);
    if (!dev) return null;

    await db.execute('UPDATE devices SET status = ? WHERE id = ?;', [newStatus, targetDeviceId]);

    let alertData = undefined;
    if (newStatus === 'offline' || newStatus === 'warning') {
      const alertId = `alt-${Date.now()}`;
      const title = newStatus === 'offline' ? `Outage Terdeteksi: ${dev.name}` : `High Latency Degradation: ${dev.name}`;
      const message = newStatus === 'offline'
        ? `Perangkat ${dev.name} (${dev.ip}) tidak merespons ICMP ping probe. Kemungkinan jalur kabel putus atau power supply padam.`
        : `Latensi perangkat ${dev.name} melonjak di atas 60ms dengan packet loss 5%.`;

      const insertAlertSql = `
        INSERT INTO alerts (id, title, message, severity, status, building_id, building_name, device_id, time_ago)
        VALUES (?, ?, ?, ?, 'open', ?, ?, ?, 'Baru saja');
      `;
      await db.execute(insertAlertSql, [alertId, title, message, newStatus === 'offline' ? 'critical' : 'warning', dev.building_id, dev.building_name, dev.id]);

      alertData = { id: alertId, title, message, severity: newStatus === 'offline' ? 'critical' : 'warning' };
    }

    const payload = {
      targetDeviceId,
      newStatus,
      alert: alertData,
      timestamp: new Date().toISOString()
    };

    monitoringEmitter.emit('impact', payload);
    return payload;
  } catch (err) {
    console.error('[PingService] Error triggering simulated impact:', err);
    throw err;
  }
}

