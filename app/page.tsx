import { redirect } from "next/navigation";

import { routeViewModels } from "@/lib/view-models/routes";

export default function HomeRedirectPage() {
  redirect(routeViewModels.dashboard.path);
}
