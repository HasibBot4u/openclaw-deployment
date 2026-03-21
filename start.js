const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

const PORT = process.env.PORT || '10000';
const OPENCLAW_PORT = '18789';

// Start OpenClaw internally
const proc = spawn(
  './node_modules/.bin/openclaw',
  ['start', '--headless'],
  {
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_HOST: '127.0.0.1',
      OPENCLAW_GATEWAY_PORT: OPENCLAW_PORT,
    },
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);

proc.on('error', (err) => console.error('OpenClaw error:', err));
proc.on('exit', (code) => { process.exit(code); });

// Proxy server using only built-in Node modules
const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: OPENCLAW_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', () => {
    res.writeHead(502);
    res.end('OpenClaw is starting up, please refresh in 15 seconds...');
  });
  req.pipe(proxy);
});

// WebSocket proxy
server.on('upgrade', (req, socket, head) => {
  const conn = net.connect(OPENCLAW_PORT, '127.0.0.1', () => {
    conn.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k,v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    );
    conn.write(head);
    socket.pipe(conn);
    conn.pipe(socket);
  });
  conn.on('error', () => socket.destroy());
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on port ${PORT} → OpenClaw on ${OPENCLAW_PORT}`);
});
