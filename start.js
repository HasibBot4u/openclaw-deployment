const { spawn } = require('child_process');
const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || '10000';
const OPENCLAW_PORT = '18789';

// Start OpenClaw internally on port 18789
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
proc.on('exit', (code) => {
  console.log('OpenClaw exited:', code);
  process.exit(code);
});

// Wait for OpenClaw to start then proxy all traffic to it
setTimeout(() => {
  const proxy = httpProxy.createProxyServer({
    target: `http://127.0.0.1:${OPENCLAW_PORT}`,
    ws: true,
  });

  proxy.on('error', (err, req, res) => {
    if (res && res.writeHead) {
      res.writeHead(502);
      res.end('OpenClaw is starting, please refresh in 10 seconds...');
    }
  });

  const server = http.createServer((req, res) => {
    proxy.web(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    proxy.ws(req, socket, head);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy listening on port ${PORT} → OpenClaw on ${OPENCLAW_PORT}`);
  });
}, 15000); // wait 15 seconds for OpenClaw to boot
