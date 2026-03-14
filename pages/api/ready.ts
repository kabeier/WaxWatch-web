import { env } from "@/config/env";
import type { NextApiRequest, NextApiResponse } from "next";
import { withApiRequestLogging } from "@/lib/server/request-logging";
import { getReadinessThresholdSeconds } from "@/lib/server/readiness-threshold";

export default withApiRequestLogging(function ready(_req: NextApiRequest, res: NextApiResponse) {
  const readinessThresholdSeconds = getReadinessThresholdSeconds();
  const isReady = process.uptime() >= readinessThresholdSeconds;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "starting",
    app: env.NEXT_PUBLIC_APP_NAME,
    release: env.NEXT_PUBLIC_RELEASE_VERSION,
  });
});
