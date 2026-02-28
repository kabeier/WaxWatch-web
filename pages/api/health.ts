import { env } from '@/config/env';
import { withApiRequestLogging } from '@/lib/api/request-logging';

export default withApiRequestLogging(function health(_req, res) {
  res.status(200).json({ status: 'ok', app: env.NEXT_PUBLIC_APP_NAME, release: env.NEXT_PUBLIC_RELEASE_VERSION });
});
