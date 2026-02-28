import { env } from '@/config/env';
import { withApiRequestLogging } from '@/lib/api/request-logging';

function getReadinessThresholdSeconds(): number {
  const raw = process.env.READY_MIN_UPTIME_SECONDS ?? '5';
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 5;
  }
  return parsed;
}

export default withApiRequestLogging(function ready(_req, res) {
  const readinessThresholdSeconds = getReadinessThresholdSeconds();
  const isReady = process.uptime() >= readinessThresholdSeconds;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'starting',
    app: env.NEXT_PUBLIC_APP_NAME,
    release: env.NEXT_PUBLIC_RELEASE_VERSION,
  });
});
