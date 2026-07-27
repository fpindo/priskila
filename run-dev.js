const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '  PRISKILA - Starting Backend & Frontend Servers   ');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

const isWindows = process.platform === 'win32';

// 1. Start Backend (Laravel)
const backend = spawn('php', ['artisan', 'serve'], {
  cwd: path.join(__dirname, 'backend'),
  shell: isWindows,
});

// 2. Start Frontend (Next.js)
const frontend = spawn('npm', ['run', 'dev', '-w', 'frontend'], {
  cwd: __dirname,
  shell: isWindows,
});

// Buffer and print logs with distinct prefixes and colors
function setupLogBuffer(stream, prefix, colorCode) {
  let buffer = '';
  stream.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop(); // Keep the last incomplete line in buffer

    lines.forEach((line) => {
      console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
    });
  });

  stream.on('end', () => {
    if (buffer.trim()) {
      console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${buffer}`);
    }
  });
}

// Blue for Laravel Backend
setupLogBuffer(backend.stdout, 'Backend', '34');
setupLogBuffer(backend.stderr, 'Backend Error', '31');

// Green for Next.js Frontend
setupLogBuffer(frontend.stdout, 'Frontend', '32');
setupLogBuffer(frontend.stderr, 'Frontend Error', '31');

// Error handling for initial spawning failures
backend.on('error', (err) => {
  console.error(`\x1b[31m[Backend Failed to Start]\x1b[0m`, err.message);
});

frontend.on('error', (err) => {
  console.error(`\x1b[31m[Frontend Failed to Start]\x1b[0m`, err.message);
});

// Safe termination logic
let isShuttingDown = false;
function shutdown(exitCode) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\x1b[33mStopping both servers...\x1b[0m');

  if (isWindows) {
    // Windows process tree termination
    try {
      spawn('taskkill', ['/pid', backend.pid, '/f', '/t'], { stdio: 'ignore' });
    } catch (e) {}
    try {
      spawn('taskkill', ['/pid', frontend.pid, '/f', '/t'], { stdio: 'ignore' });
    } catch (e) {}
  } else {
    // POSIX termination
    try {
      backend.kill('SIGTERM');
    } catch (e) {}
    try {
      frontend.kill('SIGTERM');
    } catch (e) {}
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 500);
}

backend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\x1b[33mBackend process exited with code ${code}\x1b[0m`);
  }
  shutdown(code || 0);
});

frontend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\x1b[33mFrontend process exited with code ${code}\x1b[0m`);
  }
  shutdown(code || 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
