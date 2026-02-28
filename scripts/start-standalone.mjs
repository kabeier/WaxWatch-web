import { spawn } from 'node:child_process';
import { validateEnv } from './env-contract.mjs';

function serializeError(error) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    };
  }

  return { errorMessage: String(error) };
}

function log(level, message, context = {}) {
  const line = JSON.stringify({ level, message, ...context });
  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

process.env.NODE_ENV ??= 'production';
process.env.PORT ??= '4173';
process.env.HOSTNAME ??= '0.0.0.0';

try {
  validateEnv();
} catch (error) {
  log('error', 'startup_validation_failure', serializeError(error));
  process.exit(1);
}

const child = spawn('node', ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: process.env,
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('info', 'shutdown_initiated', { signal });
  child.kill(signal);

  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  log('error', 'startup_runtime_failure', serializeError(error));
  shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  log('error', 'startup_runtime_failure', serializeError(reason));
  shutdown('SIGTERM');
});

child.on('error', (error) => {
  log('error', 'startup_runtime_failure', serializeError(error));
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
