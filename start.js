const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || '10000';
const OPENCLAW_PORT = '18789';
const configDir = path.join(os.homedir(), '.openclaw');
const configFile = path.join(configDir, 'openclaw.json');

// Write config file if it doesn't exist
if (!fs.existsSync(configFile)) {
  fs.mkdirSync(configDir, { recursive: true });
  const config = {
    gateway: {
      port: parseInt(OPENCLAW_PORT),
      bind: '0.0.0.0',
      auth: {
        mode: 'password',
        password: process.env.OPENCLAW_GATEWAY_PASSWORD || 'MySecret2026!'
      }
    },
    env: {
      vars: {
        GOOGLE_GENERATIVEAI_API_KEY: process.env.GOOGLE_GENERATIVEAI_API_KEY || '',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || ''
      }
    }
  };
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  console.log('Config file created at', configFile);
}

// Start OpenClaw
const proc = spawn(
  './node_modules/.bin/openclaw',
  ['start', '--headless'],
  {
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_HOST: '0.0.0.0',
      OPENCLAW_GATEWAY_PORT: OPENCLAW_PORT,
    },
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);

proc.on('error', (err) => console.error('OpenClaw error:', err));
proc.on('exit', (code) => { process.exit(code); });

// Proxy server - waits 40 seconds for OpenClaw to fully start
const CANVAS_PATH = '/__openclaw__/canvas/';

const server = http.createServer((req, res) => {
  // Redirect root to the OpenClaw canvas UI
  if (req.url === '/' || req.url === '') {
    res.writeHead(302, { Location: CANVAS_PATH });
    res.end();
    return;
  }

  const options = {
    hostname: '127.0.0.1',
    port: OPENCLAW_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${OPENCLAW_PORT}` },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', () => {
    res.writeHead(503);
    res.end('OpenClaw is warming up... Please refresh in 30 seconds.');
  });

  req.pipe(proxy);
});

// WebSocket proxy
server.on('upgrade', (req, socket, head) => {
  const conn = net.connect(OPENCLAW_PORT, '127.0.0.1', () => {
    const headers = Object.entries(req.headers)
      .map(([k, v]) => `${k}: ${v}`).join('\r\n');
    conn.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    if (head && head.length) conn.write(head);
    socket.pipe(conn);
    conn.pipe(socket);
  });
  conn.on('error', () => socket.destroy());
  socket.on('error', () => conn.destroy());
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy on port ${PORT} → OpenClaw on ${OPENCLAW_PORT}`);
  console.log(`UI will be at: http://localhost:${PORT}${CANVAS_PATH}`);
});
