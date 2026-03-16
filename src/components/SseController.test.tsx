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

function createChunkedSseResponse(chunks: string[], init?: ResponseInit) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

function createNonSseResponse(body = "ok", init?: ResponseInit) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/json" },
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

  it("connects successfully with cookie-backed session when bearer token is missing", async () => {
    vi.mocked(webAuthSessionAdapter.getAccessToken).mockResolvedValue(null);
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
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("Accept")).toBe("text/event-stream");
    expect(init?.credentials).toBe("include");
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

  it("includes bearer header when adapter provides a token", async () => {
    vi.mocked(webAuthSessionAdapter.getAccessToken).mockResolvedValue("jwt-token");
    fetchMock.mockResolvedValueOnce(createSseResponse("event: message\ndata: ok\n\n"));

    const queryClient = new QueryClient();
    renderWithClient(queryClient);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(headers.get("Accept")).toBe("text/event-stream");
    expect(init?.credentials).toBe("include");
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

  it("reconnects when token is missing and stream disconnects", async () => {
    vi.useFakeTimers();
    vi.mocked(webAuthSessionAdapter.getAccessToken).mockResolvedValue(null);
    vi.spyOn(Math, "random").mockReturnValue(0);
    fetchMock
      .mockRejectedValueOnce(new Error("disconnect"))
      .mockResolvedValueOnce(createSseResponse("event: message\ndata: recovered\n\n"));

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();

    renderWithClient(queryClient);

    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.runAllTicks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstCallHeaders = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(firstCallHeaders.get("Authorization")).toBeNull();
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1_000);
    expect(handleAuthorizationFailureWithAdapter).not.toHaveBeenCalled();
  });

  it("treats 200 non-SSE responses as connection failures and reconnects", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    fetchMock
      .mockResolvedValueOnce(createNonSseResponse('{"ok":true}'))
      .mockResolvedValueOnce(createSseResponse("event: message\ndata: recovered\n\n"));

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();

    renderWithClient(queryClient);

    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.runAllTicks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      "[SSE] stream connection failed; scheduling reconnect",
      expect.objectContaining({
        endpoint: "/api/stream/events",
      }),
    );
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1_000);
  });



  it("halts reconnect attempts when account-removed auth event is dispatched", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    fetchMock.mockRejectedValue(new Error("disconnect"));

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();
    renderWithClient(queryClient);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(setTimeoutSpy).toHaveBeenCalled());

    window.dispatchEvent(new CustomEvent("waxwatch:auth", { detail: "account-removed" }));

    await new Promise((resolve) => setTimeout(resolve, 1_100));

    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it("processes notification event when stream ends without trailing blank line", async () => {
    fetchMock.mockResolvedValueOnce(
      createChunkedSseResponse(["event: notification\n", 'data: {"ok":true}']),
    );

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWithClient(queryClient);

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.notifications.unreadCount,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it("keeps behavior for fully-delimited notification events", async () => {
    fetchMock.mockResolvedValueOnce(
      createChunkedSseResponse(["event: notification\n", 'data: {"ok":true}\n\n']),
    );

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWithClient(queryClient);

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.notifications.unreadCount,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});
