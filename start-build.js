process.env.NODE_NO_WARNINGS = '1'; // suppress DEP0190 (shell:true with known-safe hardcoded args)
const { spawnSync } = require('child_process');

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const php = isWindows ? 'php.exe' : 'php';

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    // .cmd files on Windows require shell:true to be invoked correctly
    shell: isWindows,
    ...options,
  });

  if (result.error) {
    console.error(`Failed to run: ${command}`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(npm, ['install', '--no-audit']);
run(npm, ['run', 'build', '-w', 'frontend']);
run(php, ['artisan', 'config:cache'], { cwd: 'backend' });
run(php, ['artisan', 'route:cache'], { cwd: 'backend' });

console.log('\nPRISKILA build completed.');