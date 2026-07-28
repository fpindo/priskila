const { spawn } = require('child_process');
const path = require('path');

const rootPath = __dirname;
const isWindows = process.platform === 'win32';

const processes = [];
let isShuttingDown = false;

function start(name, command, args, cwd, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd,
    shell: isWindows,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  processes.push({ name, child });

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));

  child.on('close', (code) => {
    if (!isShuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code || 1);
    }
  });

  child.on('error', (error) => {
    console.error(`[${name}] failed: ${error.message}`);
    shutdown(1);
  });
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  for (const { child } of processes) {
    if (!child.pid) continue;

    if (isWindows) {
      spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(exitCode), 500);
}

console.log('Starting PRISKILA production services...');

start('Laravel API', 'php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], path.join(rootPath, 'backend'), {
  PRISKILA_SKIP_FRONTEND: '1',
});
start('Next.js', 'npm', ['run', 'start', '-w', 'frontend'], rootPath, {
  NODE_ENV: 'production',
  HOSTNAME: process.env.HOSTNAME || '127.0.0.1',
  PORT: process.env.PORT || '3000',
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));