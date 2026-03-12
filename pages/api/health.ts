import { env } from "@/config/env";
import type { NextApiRequest, NextApiResponse } from "next";
import { withApiRequestLogging } from "@/lib/server/request-logging";

export default withApiRequestLogging(function health(_req: NextApiRequest, res: NextApiResponse) {
  res
    .status(200)
    .json({
      status: "ok",
      app: env.NEXT_PUBLIC_APP_NAME,
      release: env.NEXT_PUBLIC_RELEASE_VERSION,
    });
});
