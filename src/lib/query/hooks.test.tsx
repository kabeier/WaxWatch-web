import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  DiscogsOAuthCallbackResponse,
  MeProfile,
  WatchRule,
} from "@/lib/api/domains/types";
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
  reject: (error: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function buildWatchRule(id: string): WatchRule {
  return {
    id,
    user_id: "user-1",
    name: `rule-${id}`,
    query: {},
    is_active: true,
    poll_interval_seconds: 60,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  };
}

function buildMeProfile(): MeProfile {
  return {
    id: "me-1",
    email: "user@example.com",
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  };
}

function buildDiscogsConnectResponse(externalUserId: string): DiscogsOAuthCallbackResponse {
  return {
    provider: "discogs",
    external_user_id: externalUserId,
    connected: true,
    connected_at: "2024-01-01T00:00:00.000Z",
  };
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
    const first = createDeferred<WatchRule>();
    const second = createDeferred<WatchRule>();
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
      second.resolve(buildWatchRule("latest"));
      await second.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: queryKeys.watchRules.list });

    await act(async () => {
      first.resolve(buildWatchRule("stale"));
      await first.promise;
    });
    await waitFor(() => expect(pendingStates[pendingStates.length - 1]).toBe(false));

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(pendingStates).toContain(true);
  });

  it("fires success side effects when an older success resolves after newer failure", async () => {
    const first = createDeferred<WatchRule>();
    const second = createDeferred<WatchRule>();
    vi.mocked(waxwatchApi.watchRules.create)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    let mutate!: (input: { name: string }) => void;

    renderWithClient(
      <MutationHarness
        useMutation={useCreateWatchRuleMutation}
        onMutate={(nextMutate) => {
          mutate = nextMutate;
        }}
        onState={() => undefined}
      />,
      queryClient,
    );

    await waitFor(() => expect(mutate).toBeDefined());

    act(() => {
      mutate({ name: "first" });
      mutate({ name: "second" });
    });

    await act(async () => {
      second.reject(new Error("latest failed"));
      await second.promise.catch(() => undefined);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(0);

    await act(async () => {
      first.resolve(buildWatchRule("late-success"));
      await first.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.watchRules.list });
  });

  it("limits profile-update success side effects to latest mutation", async () => {
    const first = createDeferred<MeProfile>();
    const second = createDeferred<MeProfile>();
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
      second.resolve(buildMeProfile());
      await second.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: queryKeys.me });

    await act(async () => {
      first.resolve(buildMeProfile());
      await first.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1));
  });

  it("limits integrations success side effects to latest mutation", async () => {
    const first = createDeferred<DiscogsOAuthCallbackResponse>();
    const second = createDeferred<DiscogsOAuthCallbackResponse>();
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
      second.resolve(buildDiscogsConnectResponse("latest-user"));
      await second.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2));
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.integrations.discogs.status,
    });
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.me });

    await act(async () => {
      first.resolve(buildDiscogsConnectResponse("first-user"));
      await first.promise;
    });
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2));
  });
});
