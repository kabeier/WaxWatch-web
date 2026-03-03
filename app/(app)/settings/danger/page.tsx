import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";

type RouteState = "loading" | "empty" | "error" | "rate_limited" | "ready";

export default async function DangerSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string; retryAfter?: string }>;
}) {
  const { state: stateParam, retryAfter } = await (searchParams ?? Promise.resolve({} as { state?: string; retryAfter?: string }));
  const state = (stateParam as RouteState | undefined) ?? "ready";

  return (
    <section>
      <h1>Danger Zone</h1>
      <p>Deactivate or permanently remove your account.</p>
      {state === "loading" ? <StateLoading message="Loading account danger-zone options…" /> : null}
      {state === "empty" ? <StateEmpty message="No danger-zone actions available." /> : null}
      {state === "error" ? <StateError message="Could not load danger-zone settings." /> : null}
      {state === "rate_limited" ? (
        <StateRateLimited
          message="Danger-zone actions are temporarily rate limited."
          retryAfterSeconds={retryAfter ? Number(retryAfter) : undefined}
        />
      ) : null}
      {state === "ready" ? (
        <>
          <button type="button">Deactivate account</button>
          <button type="button">Permanently delete account</button>
        </>
      ) : null}
    </section>
  );
}
