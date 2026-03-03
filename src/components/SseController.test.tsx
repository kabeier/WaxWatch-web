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

  it("connects with bearer auth and processes notification events", async () => {
    fetchMock.mockResolvedValueOnce(
      createSseResponse("event: notification\ndata: {\"ok\":true}\n\n"),
    );

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWithClient(queryClient);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.notifications.unreadCount,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list,
    });
  });

  it("reconnects after stream disconnect while auth remains valid", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(createSseResponse("event: heartbeat\n\n"))
      .mockResolvedValueOnce(createSseResponse("event: heartbeat\n\n"));

    const queryClient = new QueryClient();
    renderWithClient(queryClient);

    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.runAllTicks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, reconnectInit] = fetchMock.mock.calls[1];
    const reconnectHeaders = new Headers(reconnectInit?.headers);

    expect(reconnectHeaders.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("stops reconnecting and triggers auth failure flow on 401", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(
      createSseResponse("", {
        status: 401,
      }),
    );

    const queryClient = new QueryClient();
    renderWithClient(queryClient);

    await vi.runAllTicks();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(handleApiAuthorizationFailure).toHaveBeenCalledWith({
      path: "/api/stream/events",
      status: 401,
    });

    await vi.advanceTimersByTimeAsync(35_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
