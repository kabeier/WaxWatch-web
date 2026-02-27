const requiredEnv = {
  NODE_ENV: ['development', 'test', 'production'] as const,
  APP_BASE_URL: 'url',
  NEXT_PUBLIC_APP_NAME: 'string',
  NEXT_PUBLIC_RELEASE_VERSION: 'string',
  NEXT_PUBLIC_SENTRY_DSN: 'string',
  SENTRY_DSN: 'string',
  AWS_REGION: 'string',
  AWS_SECRETS_PREFIX: 'string',
  SESSION_COOKIE_NAME: 'string',
  TRUSTED_PROXY_CIDRS: 'string',
  LOG_LEVEL: ['debug', 'info', 'warn', 'error'] as const
};

type Env = {
  [K in keyof typeof requiredEnv]: string;
};

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function readAndValidateEnv(source: NodeJS.ProcessEnv): Env {
  const errors: string[] = [];
  const parsed = {} as Env;

  (Object.keys(requiredEnv) as Array<keyof typeof requiredEnv>).forEach((key) => {
    const rule = requiredEnv[key];
    const value = source[key];

    if (!value) {
      errors.push(`${key} is required`);
      return;
    }

    if (Array.isArray(rule) && !rule.includes(value as never)) {
      errors.push(`${key} must be one of: ${rule.join(', ')}`);
      return;
    }

    if (rule === 'url' && !isUrl(value)) {
      errors.push(`${key} must be a valid URL`);
      return;
    }

    parsed[key] = value;
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return parsed;
}

export const env = readAndValidateEnv(process.env);
