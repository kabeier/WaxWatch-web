import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";

type RouteState = "loading" | "empty" | "error" | "rate_limited" | "ready";

export default async function AlertSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string; retryAfter?: string }>;
}) {
  const { state: stateParam, retryAfter } = await (searchParams ??
    Promise.resolve({} as { state?: string; retryAfter?: string }));
  const state = (stateParam as RouteState | undefined) ?? "ready";

  return (
    <section>
      <h1>Alert Delivery Settings</h1>
      <p>Configure quiet hours, delivery channels, and notification frequency.</p>
      {state === "loading" ? <StateLoading message="Loading delivery settings…" /> : null}
      {state === "empty" ? <StateEmpty message="No delivery settings configured yet." /> : null}
      {state === "error" ? <StateError message="Could not load alert delivery settings." /> : null}
      {state === "rate_limited" ? (
        <StateRateLimited
          message="Delivery settings are temporarily rate limited."
          retryAfterSeconds={retryAfter ? Number(retryAfter) : undefined}
        />
      ) : null}
      {state === "ready" ? <button type="button">Save alert delivery preferences</button> : null}
    </section>
  );
}
