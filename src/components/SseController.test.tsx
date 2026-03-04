import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SseController from "./SseController";
import { queryKeys } from "@/lib/query/keys";
import { getSupabaseAccessToken, handleApiAuthorizationFailure } from "@/lib/auth-session";

vi.mock("@/lib/auth-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-session")>("@/lib/auth-session");
  return {
    ...actual,
    getSupabaseAccessToken: vi.fn(),
    handleApiAuthorizationFailure: vi.fn(),
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

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.mocked(getSupabaseAccessToken).mockReturnValue("jwt-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
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

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.notifications.unreadCount,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it("reconnects with exponential backoff after disconnect", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockRejectedValueOnce(new Error("disconnect-1"))
      .mockRejectedValueOnce(new Error("disconnect-2"))
      .mockRejectedValueOnce(new Error("disconnect-3"));

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();

    renderWithClient(queryClient);

    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2_000);
    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const reconnectDelays = setTimeoutSpy.mock.calls.map(([, delay]) => delay);
    expect(reconnectDelays.slice(0, 3)).toEqual([1_000, 2_000, 4_000]);
  });

  it("stops immediately when token is missing", async () => {
    vi.useFakeTimers();
    vi.mocked(getSupabaseAccessToken).mockReturnValue(null);

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const queryClient = new QueryClient();

    renderWithClient(queryClient);

    await vi.runAllTicks();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(handleApiAuthorizationFailure).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    "handles auth failure status %s by invoking authorization failure and halting reconnect",
    async (status) => {
      vi.useFakeTimers();
      fetchMock.mockResolvedValueOnce(createSseResponse("", { status }));

      const setTimeoutSpy = vi.spyOn(window, "setTimeout");
      const queryClient = new QueryClient();

      renderWithClient(queryClient);

      await vi.runAllTicks();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(handleApiAuthorizationFailure).toHaveBeenCalledWith({
        path: "/api/stream/events",
        status,
      });
      expect(setTimeoutSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(35_000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
});
