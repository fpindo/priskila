const { execSync } = require('child_process');

const isWindows = process.platform === 'win32';

function run(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    if (error.status !== 128) process.exitCode = error.status || 1;
  }
}

console.log('Stopping PRISKILA servers...');

if (isWindows) {
  run('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }"');
} else {
  run('fuser -k 3000/tcp 8000/tcp');
}

console.log('PRISKILA servers stopped.');