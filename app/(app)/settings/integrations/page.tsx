import { redirect } from "next/navigation";

import { routeViewModels } from "@/lib/view-models/routes";

export default function LegacyIntegrationsRoute() {
  redirect(routeViewModels.integrations.path);
}
