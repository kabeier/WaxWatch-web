import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";

type RouteState = "loading" | "empty" | "error" | "rate_limited" | "ready";

export default async function NewAlertPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string; retryAfter?: string }>;
}) {
  const { state: stateParam, retryAfter } = await (searchParams ?? Promise.resolve({} as { state?: string; retryAfter?: string }));
  const state = (stateParam as RouteState | undefined) ?? "ready";

  return (
    <section>
      <h1>Create Alert</h1>
      <p>Create a new alert rule from saved search criteria.</p>

      {state === "loading" ? <StateLoading message="Loading alert preset data…" /> : null}
      {state === "empty" ? <StateEmpty message="No saved search criteria available." /> : null}
      {state === "error" ? <StateError message="Could not load alert setup data." /> : null}
      {state === "rate_limited" ? (
        <StateRateLimited
          message="Alert setup is temporarily rate limited."
          retryAfterSeconds={retryAfter ? Number(retryAfter) : undefined}
        />
      ) : null}
      {state === "ready" ? <button type="button">Save new alert</button> : null}
    </section>
  );
}
