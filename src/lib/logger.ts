export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const DEFAULT_LOG_LEVEL: LogLevel = 'info';

function resolveLogLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (configured === 'debug' || configured === 'info' || configured === 'warn' || configured === 'error') {
    return configured;
  }

  return DEFAULT_LOG_LEVEL;
}

const severityByLevel: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Minimal log schema contract:
 * Required: `timestamp` (in serialized output), `level`, `message`.
 * Optional canonical metadata: `requestId`, `path`, `status`, `durationMs`, `scope`.
 */
export type LogPayload = {
  /**
   * ISO-8601 timestamp string for when the event occurred.
   * If omitted, logger serialization injects the current timestamp.
   */
  timestamp?: string;
  level: LogLevel;
  message: string;
  /** Canonical request correlation identifier. */
  requestId?: string;
  /** Canonical path for the operation being logged. */
  path?: string;
  /** Canonical HTTP or operation status code. */
  status?: number;
  /** Canonical operation duration in milliseconds. */
  durationMs?: number;
  /** Canonical logical scope for the log (api/server/client/auth/etc.). */
  scope?: string;
  [key: string]: unknown;
};

type LogInput = Omit<LogPayload, 'level'>;

const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_KEYS = new Set(['authorization', 'cookie', 'token', 'password', 'secret', 'set-cookie']);
const SENSITIVE_SUFFIX_PATTERNS = ['token', 'secret', 'password', 'apikey'];
const SENSITIVE_EXACT_NORMALIZED_KEYS = new Set(['authorization', 'cookie', 'setcookie']);

function normalizeKeyForRedaction(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

function shouldRedactKey(key: string): boolean {
  const lowercaseKey = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lowercaseKey)) {
    return true;
  }

  const normalizedKey = normalizeKeyForRedaction(key);
  if (SENSITIVE_EXACT_NORMALIZED_KEYS.has(normalizedKey)) {
    return true;
  }

  if (normalizedKey.startsWith('authorization')) {
    return true;
  }

  if (normalizedKey.startsWith('non')) {
    return false;
  }

  return SENSITIVE_SUFFIX_PATTERNS.some((pattern) => normalizedKey.endsWith(pattern));
}

function sanitizeForSerialization(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForSerialization(item, seen));
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (seen.has(value as object)) {
    return '[Circular]';
  }
  seen.add(value as object);

  if (value instanceof Date) {
    return value.toISOString();
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, entryValue] of Object.entries(value)) {
    if (shouldRedactKey(key)) {
      sanitized[key] = REDACTED_VALUE;
      continue;
    }

    sanitized[key] = sanitizeForSerialization(entryValue, seen);
  }

  return sanitized;
}

function normalizePayload(payload: LogPayload): LogPayload {
  const normalized: LogPayload = { ...payload };

  if (!normalized.path && typeof normalized.pathname === 'string') {
    normalized.path = normalized.pathname;
  }

  if (normalized.status === undefined && typeof normalized.statusCode === 'number') {
    normalized.status = normalized.statusCode;
  }

  if (normalized.durationMs === undefined && typeof normalized.elapsedMs === 'number') {
    normalized.durationMs = normalized.elapsedMs;
  }

  if (!normalized.requestId) {
    if (typeof normalized.requestID === 'string') {
      normalized.requestId = normalized.requestID;
    } else if (typeof normalized.request_id === 'string') {
      normalized.requestId = normalized.request_id;
    }
  }

  delete normalized.pathname;
  delete normalized.statusCode;
  delete normalized.elapsedMs;
  delete normalized.requestID;
  delete normalized.request_id;

  return normalized;
}

function serialize(payload: LogPayload): string {
  const normalizedPayload = normalizePayload(payload);
  const entry = sanitizeForSerialization({
    timestamp: normalizedPayload.timestamp ?? new Date().toISOString(),
    ...normalizedPayload,
  });

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

export function createLogger(logLevel: LogLevel) {
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

const logger = createLogger(resolveLogLevel());

export const { log, debug, info, warn, error } = logger;
