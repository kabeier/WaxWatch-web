import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  useCreateWatchRuleMutation,
  useDiscogsConnectMutation,
  useUpdateProfileMutation,
} from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";

vi.mock("@/lib/query/api", () => ({
  waxwatchApi: {
    watchRules: {
      create: vi.fn(),
    },
    me: {
      updateProfile: vi.fn(),
    },
    integrations: {
      discogs: {
        connect: vi.fn(),
      },
    },
  },
}));

import { waxwatchApi } from "@/lib/query/api";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function MutationHarness<TInput>({
  useMutation,
  onMutate,
  onState,
}: {
  useMutation: () => {
    mutate: (input: TInput) => void;
    isPending: boolean;
  };
  onMutate: (mutate: (input: TInput) => void) => void;
  onState: (isPending: boolean) => void;
}) {
  const mutation = useMutation();

  useEffect(() => {
    onMutate(mutation.mutate);
  }, [mutation.mutate, onMutate]);

  useEffect(() => {
    onState(mutation.isPending);
  }, [mutation.isPending, onState]);

  return null;
}

function renderWithClient(ui: ReactNode, queryClient: QueryClient) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("query hooks mutation success side effects", () => {
  it("limits watch-rule success side effects to latest mutation while preserving pending state", async () => {
    const first = createDeferred<{ id: string }>();
    const second = createDeferred<{ id: string }>();
    vi.mocked(waxwatchApi.watchRules.create)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const pendingStates: boolean[] = [];
    let mutate!: (input: { name: string }) => void;

    renderWithClient(
      <MutationHarness
        useMutation={useCreateWatchRuleMutation}
        onMutate={(nextMutate) => {
          mutate = nextMutate;
        }}
        onState={(isPending) => {
          pendingStates.push(isPending);
        }}
      />,
      queryClient,
    );

    await waitFor(() => expect(mutate).toBeDefined());

    act(() => {
      mutate({ name: "first" });
      mutate({ name: "second" });
    });

    await act(async () => {
      second.resolve({ id: "latest" });
      await second.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: queryKeys.watchRules.list });

    await act(async () => {
      first.resolve({ id: "stale" });
      await first.promise;
    });
    await waitFor(() => expect(pendingStates.at(-1)).toBe(false));

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(pendingStates).toContain(true);
  });

  it("limits profile-update success side effects to latest mutation", async () => {
    const first = createDeferred<{ ok: boolean }>();
    const second = createDeferred<{ ok: boolean }>();
    vi.mocked(waxwatchApi.me.updateProfile)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    let mutate!: (input: { preferences: { timezone: string } }) => void;

    renderWithClient(
      <MutationHarness
        useMutation={useUpdateProfileMutation}
        onMutate={(nextMutate) => {
          mutate = nextMutate;
        }}
        onState={() => undefined}
      />,
      queryClient,
    );

    await waitFor(() => expect(mutate).toBeDefined());

    act(() => {
      mutate({ preferences: { timezone: "UTC" } });
      mutate({ preferences: { timezone: "America/New_York" } });
    });

    await act(async () => {
      second.resolve({ ok: true });
      await second.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: queryKeys.me });

    await act(async () => {
      first.resolve({ ok: true });
      await first.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
  });

  it("limits integrations success side effects to latest mutation", async () => {
    const first = createDeferred<{ connected: boolean }>();
    const second = createDeferred<{ connected: boolean }>();
    vi.mocked(waxwatchApi.integrations.discogs.connect)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    let mutate!: (input: string) => void;

    renderWithClient(
      <MutationHarness
        useMutation={useDiscogsConnectMutation}
        onMutate={(nextMutate) => {
          mutate = nextMutate;
        }}
        onState={() => undefined}
      />,
      queryClient,
    );

    await waitFor(() => expect(mutate).toBeDefined());

    act(() => {
      mutate("first-user");
      mutate("latest-user");
    });

    await act(async () => {
      second.resolve({ connected: true });
      await second.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2));
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.integrations.discogs.status,
    });
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.me });

    await act(async () => {
      first.resolve({ connected: true });
      await first.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2));
  });
});
