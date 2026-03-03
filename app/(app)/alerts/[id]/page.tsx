import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import { routeViewModels } from "@/lib/view-models/routes";

type RouteState = "loading" | "empty" | "error" | "rate_limited" | "ready";

export default async function AlertDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ state?: string; retryAfter?: string }>;
}) {
  const { id } = await params;
  const { state: stateParam, retryAfter } = await (searchParams ??
    Promise.resolve({} as { state?: string; retryAfter?: string }));
  const state = (stateParam as RouteState | undefined) ?? "ready";
  const viewModel = routeViewModels.alertDetail;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        Alert id: <code>{id}</code>
      </p>

      {state === "loading" ? <StateLoading message="Loading alert detail…" /> : null}
      {state === "empty" ? <StateEmpty message="Alert not found." /> : null}
      {state === "error" ? <StateError message="Could not load alert detail." /> : null}
      {state === "rate_limited" ? (
        <StateRateLimited
          message="Alert detail is temporarily rate limited."
          retryAfterSeconds={retryAfter ? Number(retryAfter) : undefined}
        />
      ) : null}
      {state === "ready" ? (
        <>
          <ul>
            {viewModel.operations.map((operation) => (
              <li key={operation.id}>
                {operation.label}: <code>{operation.serviceMethod}</code>
              </li>
            ))}
          </ul>

          <button type="button">Retry alert detail load</button>
          <button type="button">Save alert updates</button>
          <button type="button">Delete alert</button>
        </>
      ) : null}
    </section>
  );
}
