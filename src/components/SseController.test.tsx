import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SseController from "./SseController";
import { queryKeys } from "@/lib/query/keys";
import { webAuthSessionAdapter } from "@/lib/auth-session";
import { handleAuthorizationFailureWithAdapter } from "@/lib/auth/session-lifecycle";

vi.mock("@/lib/auth-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-session")>("@/lib/auth-session");
  return {
    ...actual,
    webAuthSessionAdapter: {
      ...actual.webAuthSessionAdapter,
      getAccessToken: vi.fn(),
    },
  };
});

vi.mock("@/lib/auth/session-lifecycle", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/session-lifecycle")>(
    "@/lib/auth/session-lifecycle",
  );
  return {
    ...actual,
    handleAuthorizationFailureWithAdapter: vi.fn(),
  };
});

function renderWithClient(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SseController />
    </QueryClientProvider>,
  );
}

function createSseResponse(payload: string, init?: ResponseInit) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(payload));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

describe("SseController", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(webAuthSessionAdapter.getAccessToken).mockResolvedValue("jwt-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    warnSpy.mockClear();
  });

  it("connects successfully with authenticated bearer header", async () => {
    fetchMock.mockResolvedValueOnce(
      createSseResponse('event: notification\ndata: {"ok":true}\n\n'),
    );

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWithClient(queryClient);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(url).toBe("/api/stream/events");
    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(headers.get("Accept")).toBe("text/event-stream");
    expect(init?.signal).toBeInstanceOf(AbortSignal);

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.notifications.unreadCount,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it("reconnects with exponential backoff + jitter after transient disconnects", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.5).mockReturnValue(0);
    fetchMock
      .mockRejectedValueOnce(new Error("disconnect-1"))
      .mockRejectedValueOnce(new Error("disconnect-2"))
      .mockResolvedValueOnce(createSseResponse("event: message\ndata: recovered\n\n"));

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();

    renderWithClient(queryClient);

    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_029);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2_149);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const reconnectDelays = setTimeoutSpy.mock.calls.map(([, delay]) => delay);
    expect(reconnectDelays.slice(0, 2)).toEqual([1_030, 2_150]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[SSE] stream connection failed; scheduling reconnect",
      expect.objectContaining({
        endpoint: "/api/stream/events",
      }),
    );
  });

  it("stops immediately when token is missing", async () => {
    vi.useFakeTimers();
    vi.mocked(webAuthSessionAdapter.getAccessToken).mockResolvedValue(null);

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();

    renderWithClient(queryClient);

    await vi.runAllTicks();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(handleAuthorizationFailureWithAdapter).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    "handles auth failure status %s by invoking authorization failure and halting reconnect",
    async (status) => {
      fetchMock.mockResolvedValueOnce(createSseResponse("", { status }));

      const queryClient = new QueryClient();

      renderWithClient(queryClient);

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(handleAuthorizationFailureWithAdapter).toHaveBeenCalledWith(webAuthSessionAdapter, {
        path: "/api/stream/events",
        status,
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    },
  );
});
