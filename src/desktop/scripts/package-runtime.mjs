import { cp, mkdir, rm } from 'fs/promises';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(desktopDir, '..', '..');
const frontendDir = path.join(repoRoot, 'src', 'frontend');
const runtimeDir = path.join(desktopDir, 'src-tauri', 'resources', 'runtime');
const npmCli = process.env.npm_execpath;

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...extraEnv
    },
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function main() {
  if (!npmCli) {
    throw new Error('npm_execpath is not available; run this script through npm.');
  }

  run(process.execPath, [npmCli, 'run', 'build:frontend'], repoRoot, {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.servaan.com/api',
    NEXT_PRIVATE_BUILD_WORKER: process.env.NEXT_PRIVATE_BUILD_WORKER || '1',
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096'
  });

  const standaloneDir = path.join(frontendDir, '.next', 'standalone');
  const staticDir = path.join(frontendDir, '.next', 'static');
  const publicDir = path.join(frontendDir, 'public');

  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });

  await cp(standaloneDir, runtimeDir, { recursive: true });
  await mkdir(path.join(runtimeDir, '.next'), { recursive: true });
  await cp(staticDir, path.join(runtimeDir, '.next', 'static'), { recursive: true });

  try {
    await cp(publicDir, path.join(runtimeDir, 'public'), { recursive: true });
  } catch {
    // Public assets are optional for this runtime slice.
  }

  await cp(process.execPath, path.join(runtimeDir, 'node.exe'));

  console.log(`Packaged desktop runtime at ${runtimeDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
