import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/config/env';
import { log } from '@/lib/logger';
import { shouldUseSecureCookies } from '@/lib/request-context';

let booted = false;

export default function ready(req: NextApiRequest, res: NextApiResponse) {
  if (!booted) {
    booted = true;
  }

  const requestId = req.headers['x-request-id'];
  log({
    level: 'info',
    message: 'readiness_check',
    path: req.url,
    requestId: typeof requestId === 'string' ? requestId : undefined,
    secureCookies: shouldUseSecureCookies(req),
  });

  res.status(booted ? 200 : 503).json({ status: booted ? 'ready' : 'starting', app: env.NEXT_PUBLIC_APP_NAME, release: env.NEXT_PUBLIC_RELEASE_VERSION });
}
