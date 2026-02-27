import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/config/env';
import { info } from '@/lib/logger';
import { shouldUseSecureCookies } from '@/lib/request-context';

function getReadinessThresholdSeconds(): number {
  const raw = process.env.READY_MIN_UPTIME_SECONDS ?? '5';
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 5;
  }
  return parsed;
}

export default function ready(req: NextApiRequest, res: NextApiResponse) {
  const readinessThresholdSeconds = getReadinessThresholdSeconds();
  const isReady = process.uptime() >= readinessThresholdSeconds;
  const requestId = req.headers['x-request-id'];

  info({
    message: 'readiness_check',
    path: req.url,
    requestId: typeof requestId === 'string' ? requestId : undefined,
    secureCookies: shouldUseSecureCookies(req),
    uptimeSeconds: process.uptime(),
    readinessThresholdSeconds,
    isReady,
  });

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'starting',
    app: env.NEXT_PUBLIC_APP_NAME,
    release: env.NEXT_PUBLIC_RELEASE_VERSION,
  });
}
