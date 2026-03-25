import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateWatchRuleMutation,
  useDiscogsConnectMutation,
  useSearchMutation,
  useUpdateProfileMutation,
} from "./hooks";
import { queryKeys } from "./keys";

const { createWatchRuleMock, discogsConnectMock, searchRunMock, updateProfileMock } = vi.hoisted(
  () => ({
    searchRunMock: vi.fn(),
    createWatchRuleMock: vi.fn(),
    updateProfileMock: vi.fn(),
    discogsConnectMock: vi.fn(),
  }),
);

vi.mock("@/lib/query/api", () => ({
  waxwatchApi: {
    search: {
      run: searchRunMock,
    },
    watchRules: {
      create: createWatchRuleMock,
    },
    me: {
      updateProfile: updateProfileMock,
    },
    integrations: {
      discogs: {
        connect: discogsConnectMock,
      },
    },
  },
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderWithClient(ui: JSX.Element) {
  const queryClient = new QueryClient();
  const invalidateSpy = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockImplementation(async () => Promise.resolve());

  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  return { invalidateSpy };
}

function SearchMutationProbe() {
  const mutation = useSearchMutation();

  return (
    <section>
      <button type="button" onClick={() => mutation.mutate({ query: "first" } as never)}>
        mutate
      </button>
      <output data-testid="pending">{String(mutation.isPending)}</output>
      <output data-testid="error">{String(mutation.isError)}</output>
      <output data-testid="data">{mutation.data ? "has-data" : "no-data"}</output>
    </section>
  );
}

function CreateWatchRuleMutationProbe() {
  const mutation = useCreateWatchRuleMutation();

  return (
    <button type="button" onClick={() => mutation.mutate({ name: "rule" } as never)}>
      mutate-watch-rule
    </button>
  );
}

function UpdateProfileMutationProbe() {
  const mutation = useUpdateProfileMutation();

  return (
    <button type="button" onClick={() => mutation.mutate({ display_name: "name" } as never)}>
      mutate-profile
    </button>
  );
}

function DiscogsConnectMutationProbe() {
  const mutation = useDiscogsConnectMutation();

  return (
    <button type="button" onClick={() => mutation.mutate("discogs-user")}>
      mutate-discogs
    </button>
  );
}

describe("useApiMutation sequential state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears prior success data immediately when a new mutation starts", async () => {
    const first = createDeferred<{ id: string }>();
    const second = createDeferred<{ id: string }>();

    searchRunMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<SearchMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate" }));
    first.resolve({ id: "success" });

    await waitFor(() => {
      expect(screen.getByTestId("data").textContent).toBe("has-data");
      expect(screen.getByTestId("pending").textContent).toBe("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "mutate" }));

    await waitFor(() => {
      expect(screen.getByTestId("pending").textContent).toBe("true");
      expect(screen.getByTestId("data").textContent).toBe("no-data");
      expect(screen.getByTestId("error").textContent).toBe("false");
    });

    second.resolve({ id: "done" });

    await waitFor(() => {
      expect(screen.getByTestId("pending").textContent).toBe("false");
      expect(screen.getByTestId("data").textContent).toBe("has-data");
      expect(screen.getByTestId("error").textContent).toBe("false");
    });
  });

  it("keeps stale success hidden when next mutation fails", async () => {
    const first = createDeferred<{ id: string }>();
    const second = createDeferred<{ id: string }>();

    searchRunMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<SearchMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate" }));
    first.resolve({ id: "success" });

    await waitFor(() => {
      expect(screen.getByTestId("data").textContent).toBe("has-data");
      expect(screen.getByTestId("error").textContent).toBe("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "mutate" }));

    await waitFor(() => {
      expect(screen.getByTestId("pending").textContent).toBe("true");
      expect(screen.getByTestId("data").textContent).toBe("no-data");
    });

    second.reject(new Error("second failed"));

    await waitFor(() => {
      expect(screen.getByTestId("pending").textContent).toBe("false");
      expect(screen.getByTestId("error").textContent).toBe("true");
      expect(screen.getByTestId("data").textContent).toBe("no-data");
    });
  });

  it("treats resolved error envelopes as mutation failures", async () => {
    searchRunMock.mockResolvedValueOnce({
      error: { message: "Search failed from envelope" },
    });

    render(<SearchMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate" }));

    await waitFor(() => {
      expect(screen.getByTestId("pending").textContent).toBe("false");
      expect(screen.getByTestId("error").textContent).toBe("true");
      expect(screen.getByTestId("data").textContent).toBe("no-data");
    });
  });

  it("treats resolved error envelopes with blank messages as failures", async () => {
    searchRunMock.mockResolvedValueOnce({
      error: { message: "   " },
    });

    render(<SearchMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate" }));

    await waitFor(() => {
      expect(screen.getByTestId("pending").textContent).toBe("false");
      expect(screen.getByTestId("error").textContent).toBe("true");
      expect(screen.getByTestId("data").textContent).toBe("no-data");
    });
  });

  it("runs create watch-rule side effects only once when A resolves after B", async () => {
    const mutationA = createDeferred<{ id: string }>();
    const mutationB = createDeferred<{ id: string }>();

    createWatchRuleMock
      .mockReturnValueOnce(mutationA.promise)
      .mockReturnValueOnce(mutationB.promise);

    const { invalidateSpy } = renderWithClient(<CreateWatchRuleMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate-watch-rule" }));
    fireEvent.click(screen.getByRole("button", { name: "mutate-watch-rule" }));

    mutationB.resolve({ id: "B" });
    mutationA.resolve({ id: "A" });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.watchRules.list });
  });

  it("does not run watch-rule success side effects when latest mutation fails and older succeeds", async () => {
    const first = createDeferred<{ id: string }>();
    const second = createDeferred<{ id: string }>();

    createWatchRuleMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { invalidateSpy } = renderWithClient(<CreateWatchRuleMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate-watch-rule" }));
    fireEvent.click(screen.getByRole("button", { name: "mutate-watch-rule" }));

    second.reject(new Error("latest failed"));
    first.resolve({ id: "older-success" });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(0);
    });
  });

  it("runs profile success side effects only for the latest completed mutation", async () => {
    const first = createDeferred<{ id: string }>();
    const second = createDeferred<{ id: string }>();

    updateProfileMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { invalidateSpy } = renderWithClient(<UpdateProfileMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate-profile" }));
    fireEvent.click(screen.getByRole("button", { name: "mutate-profile" }));

    second.resolve({ id: "latest" });
    first.resolve({ id: "stale" });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.me });
  });

  it("runs integration success side effects only for the latest completed mutation", async () => {
    const first = createDeferred<{ ok: true }>();
    const second = createDeferred<{ ok: true }>();

    discogsConnectMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { invalidateSpy } = renderWithClient(<DiscogsConnectMutationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "mutate-discogs" }));
    fireEvent.click(screen.getByRole("button", { name: "mutate-discogs" }));

    second.resolve({ ok: true });
    first.resolve({ ok: true });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
    });

    expect(invalidateSpy).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.integrations.discogs.status,
    });
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: queryKeys.me });
  });
});
