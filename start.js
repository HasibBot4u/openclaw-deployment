const { spawn } = require('child_process');

const proc = spawn(
  './node_modules/.bin/openclaw',
  ['start', '--headless'],
  {
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_HOST: '0.0.0.0',
      OPENCLAW_GATEWAY_PORT: process.env.PORT || '10000',
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
```

4. Tap **Commit changes**
5. Render will **automatically redeploy** — wait 3–5 minutes
6. Watch the logs — you should now see:
```
[gateway] listening on ws://0.0.0.0:10000
[telegram] starting provider
