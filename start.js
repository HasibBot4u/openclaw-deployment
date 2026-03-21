const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || '10000';

// Small HTTP server so Render detects the open port
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OpenClaw is running');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('HTTP keepalive listening on port', PORT);
});

// Start OpenClaw on port 18789 internally
const proc = spawn(
  './node_modules/.bin/openclaw',
  ['start', '--headless'],
  {
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_HOST: '0.0.0.0',
      OPENCLAW_GATEWAY_PORT: '18789',
    },
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);

proc.on('error', (err) => console.error('Start error:', err));
proc.on('exit', (code) => {
  console.log('OpenClaw exited with code:', code);
  process.exit(code);
});
