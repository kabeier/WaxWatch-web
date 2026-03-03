import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import { routeViewModels } from "@/lib/view-models/routes";

type RouteState = "loading" | "empty" | "error" | "rate_limited" | "ready";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string; retryAfter?: string }>;
}) {
  const viewModel = routeViewModels.search;
  const { state: stateParam, retryAfter } = await (searchParams ??
    Promise.resolve({} as { state?: string; retryAfter?: string }));
  const state = (stateParam as RouteState | undefined) ?? "ready";

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      {state === "loading" ? <StateLoading message="Loading search results…" /> : null}
      {state === "empty" ? <StateEmpty message="No search results yet." /> : null}
      {state === "error" ? <StateError message="Could not run search." /> : null}
      {state === "rate_limited" ? (
        <StateRateLimited
          message="Search rate limit reached."
          retryAfterSeconds={retryAfter ? Number(retryAfter) : undefined}
        />
      ) : null}
      {state === "ready" ? (
        <>
          <p>
            API operations:{" "}
            {viewModel.operations.map((operation) => operation.serviceMethod).join(", ")}.
          </p>
          <button type="button">Run search</button>
          <button type="button">Save as alert</button>
        </>
      ) : null}
    </section>
  );
}
