import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchMutation } from "./hooks";

const { searchRunMock } = vi.hoisted(() => ({
  searchRunMock: vi.fn(),
}));

vi.mock("@/lib/query/api", () => ({
  waxwatchApi: {
    search: {
      run: searchRunMock,
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
});
