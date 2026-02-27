import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/config/env';
import { log } from '@/lib/logger';
import { shouldUseSecureCookies } from '@/lib/request-context';

export default function health(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'];
  log({
    level: 'info',
    message: 'health_check',
    path: req.url,
    requestId: typeof requestId === 'string' ? requestId : undefined,
    secureCookies: shouldUseSecureCookies(req),
  });
  res.status(200).json({ status: 'ok', app: env.NEXT_PUBLIC_APP_NAME, release: env.NEXT_PUBLIC_RELEASE_VERSION });
}
