const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

// Stream to persist traffic logs
const trafficLogPath = path.join(logsDir, 'api-traffic.log');
const trafficStream = fs.createWriteStream(trafficLogPath, { flags: 'a' });

// In-memory traffic snapshot
const trafficSnapshot = {
  totalRequests: 0,
  byRoute: {},    // e.g. { 'GET /api/jobs': 12 }
  byStatus: {},   // e.g. { '200': 10, '404': 2 }
  byClient: {},   // e.g. { 'web-app': 8, 'mobile-app': 4 }
  lastRequests: [], // last 50 requests
  lastUpdated: null
};

const MAX_LAST_REQUESTS = 50;

function normalizeRoute(req) {
  const url = req.originalUrl || req.url || '';
  const [cleanPath] = url.split('?');
  return `${req.method} ${cleanPath}`;
}

function updateSnapshot(entry) {
  trafficSnapshot.totalRequests += 1;
  trafficSnapshot.lastUpdated = entry.timestamp;

  const route = entry.route;
  const status = String(entry.status);
  const client = entry.client;

  trafficSnapshot.byRoute[route] = (trafficSnapshot.byRoute[route] || 0) + 1;
  trafficSnapshot.byStatus[status] = (trafficSnapshot.byStatus[status] || 0) + 1;
  trafficSnapshot.byClient[client] = (trafficSnapshot.byClient[client] || 0) + 1;

  trafficSnapshot.lastRequests.push(entry);
  if (trafficSnapshot.lastRequests.length > MAX_LAST_REQUESTS) {
    trafficSnapshot.lastRequests.shift();
  }
}

function trafficRecorder(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const entry = {
      timestamp: new Date().toISOString(),
      route: normalizeRoute(req),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      client: req.headers['x-client-source'] || 'unknown',
      ip: req.ip || req.connection?.remoteAddress || 'unknown'
    };

    // Persist to log file
    trafficStream.write(`${JSON.stringify(entry)}\n`);

    // Update in-memory snapshot
    updateSnapshot(entry);
  });

  next();
}

function getTrafficSnapshot() {
  return {
    ...trafficSnapshot,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  trafficRecorder,
  getTrafficSnapshot,
  trafficLogPath
};

