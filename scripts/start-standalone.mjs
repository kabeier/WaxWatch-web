import { spawn } from 'node:child_process';
import { validateEnv } from './env-contract.mjs';

validateEnv();

const child = spawn('node', ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT ?? '4173',
    HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0',
  },
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: 'info', message: 'shutdown_initiated', signal }));
  child.kill(signal);

  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
