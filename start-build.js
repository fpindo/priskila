const { spawnSync } = require('child_process');

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const php = isWindows ? 'php.exe' : 'php';

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) process.exit(result.status || 1);
}

run(npm, ['install']);
run(npm, ['run', 'build', '-w', 'frontend']);
run(php, ['artisan', 'config:cache'], { cwd: 'backend' });
run(php, ['artisan', 'route:cache'], { cwd: 'backend' });

console.log('\nPRISKILA build completed.');