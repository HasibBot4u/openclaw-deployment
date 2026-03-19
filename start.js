const { spawn } = require('child_process');
const path = require('path');

const bin = path.join(
  require.resolve('openclaw/package.json'),
  '../bin/openclaw.js'
);

const proc = spawn(process.execPath, [bin, 'start', '--headless'], {
  env: {
    ...process.env,
    OPENCLAW_GATEWAY_HOST: '0.0.0.0',
    OPENCLAW_GATEWAY_PORT: process.env.PORT || '10000',
  },
  stdio: 'inherit',
});

proc.on('error', (err) => console.error('Start error:', err));
proc.on('exit', (code) => {
  console.log('OpenClaw exited with code:', code);
  process.exit(code);
});
