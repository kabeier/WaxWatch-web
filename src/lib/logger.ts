import { env } from '@/config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const severityByLevel: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogPayload = {
  level: LogLevel;
  message: string;
  requestId?: string;
  path?: string;
  [key: string]: unknown;
};

type LogInput = Omit<LogPayload, 'level'>;

function serialize(payload: LogPayload): string {
  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
  };

  return JSON.stringify(entry);
}

function writeLine(payload: LogPayload): void {
  const line = serialize(payload);

  if (payload.level === 'error') {
    console.error(line);
    return;
  }
  if (payload.level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

function createLogger(logLevel: LogLevel) {
  const threshold = severityByLevel[logLevel];

  const log = (payload: LogPayload): void => {
    if (severityByLevel[payload.level] < threshold) {
      return;
    }

    writeLine(payload);
  };

  const writeAtLevel = (level: LogLevel, payload: LogInput): void => {
    log({ ...payload, level } as LogPayload);
  };

  return {
    log,
    debug(payload: LogInput): void {
      writeAtLevel('debug', payload);
    },
    info(payload: LogInput): void {
      writeAtLevel('info', payload);
    },
    warn(payload: LogInput): void {
      writeAtLevel('warn', payload);
    },
    error(payload: LogInput): void {
      writeAtLevel('error', payload);
    },
  };
}

const logger = createLogger(env.LOG_LEVEL as LogLevel);

export const { log, debug, info, warn, error } = logger;
