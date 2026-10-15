import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.ts';
import { buildingsRouter } from './routes/buildings.ts';
import { devicesRouter } from './routes/devices.ts';
import { cablesRouter } from './routes/cables.ts';
import { alertsRouter } from './routes/alerts.ts';
import { ticketsRouter } from './routes/tickets.ts';
import { monitoringRouter } from './routes/monitoring.ts';
import { authRouter } from './routes/auth.ts';
import { reportsRouter } from './routes/reports.ts';
import { topologyRouter } from './routes/topology.ts';
import { auditRouter } from './routes/audit.ts';
import { racksRouter } from './routes/racks.ts';
import { usersRouter } from './routes/users.ts';
import { settingsRouter } from './routes/settings.ts';
import { dashboardRouter } from './routes/dashboard.ts';
import { startBackgroundPingWorker } from './services/pingService.ts';

const app = express();
const PORT = 5000;
const HOST = '127.0.0.1'; // MUST listen strictly on 127.0.0.1 for secure local backend

app.use(cors());
app.use(express.json());

// Initialize MySQL database and seed initial data
await initDatabase();

// Start Background Ping & Network Probe Engine (Tahap V3)
startBackgroundPingWorker();

// Mount REST API endpoints
app.use('/api/buildings', buildingsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/cables', cablesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/topology', topologyRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/racks', racksRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'CBA Network Map REST API (Tahap V2 & V3)',
    company: 'PT. CBA Chemical Industry',
    features: ['REST_API', 'SQLITE_PERSISTENCE', 'ICMP_PING_ENGINE', 'SSE_LIVE_STREAM', 'TICKETING', 'REPORTS_EXPORT'],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[Backend] CBA Network Map API running at http://${HOST}:${PORT}`);
});
