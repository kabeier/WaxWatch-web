import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { nextMock, jsonMock } = vi.hoisted(() => ({
  nextMock: vi.fn(),
  jsonMock: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: nextMock,
    json: jsonMock,
  },
}));

let middleware: typeof import("../middleware").middleware;
const originalLogLevel = process.env.LOG_LEVEL;
const originalTrustedProxyCidrs = process.env.TRUSTED_PROXY_CIDRS;

type RequestLike = {
  method: string;
  ip?: string;
  headers: Headers;
  nextUrl: { pathname: string };
};

function createRequest(headers: Record<string, string> = {}, ip?: string): RequestLike {
  return {
    method: "GET",
    ip,
    headers: new Headers(headers),
    nextUrl: { pathname: "/markets" },
  };
}

describe("middleware", () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.LOG_LEVEL = "info";
    process.env.TRUSTED_PROXY_CIDRS = "10.0.0.0/8";
    ({ middleware } = await import("../middleware"));

    nextMock.mockReset();
    jsonMock.mockReset();

    nextMock.mockImplementation(() => ({
      headers: new Headers(),
      status: 200,
    }));

    jsonMock.mockImplementation((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      headers: new Headers(),
    }));
  });

  afterEach(() => {
    process.env.LOG_LEVEL = originalLogLevel;
    process.env.TRUSTED_PROXY_CIDRS = originalTrustedProxyCidrs;
    vi.restoreAllMocks();
  });

  it("propagates request id through downstream headers and response headers", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const request = createRequest({ "x-request-id": "req-mid-1" });

    const response = middleware(request as never);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const nextArgs = nextMock.mock.calls[0][0] as { request: { headers: Headers } };

    expect(nextArgs.request.headers.get("x-request-id")).toBe("req-mid-1");
    expect(response.headers.get("x-request-id")).toBe("req-mid-1");

    const infoEvents = consoleLogSpy.mock.calls.map(
      ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
    );
    const requestStart = infoEvents.find((entry) => entry.message === "request_start");

    expect(requestStart).toEqual(
      expect.objectContaining({
        requestId: "req-mid-1",
        method: "GET",
        path: "/markets",
      }),
    );
  });

  it("accepts forwarded headers from trusted proxy source", () => {
    const request = createRequest(
      {
        "x-forwarded-for": "198.51.100.20, 10.1.1.1",
        "x-forwarded-proto": "https",
      },
      "10.1.1.1",
    );

    middleware(request as never);

    const nextArgs = nextMock.mock.calls[0][0] as { request: { headers: Headers } };
    expect(nextArgs.request.headers.get("x-forwarded-for")).toBe("198.51.100.20, 10.1.1.1");
    expect(nextArgs.request.headers.get("x-forwarded-proto")).toBe("https");
  });

  it("ignores forwarded headers from untrusted source and logs warning", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = createRequest(
      {
        "x-forwarded-for": "198.51.100.20, 203.0.113.10",
        "x-forwarded-host": "evil.example",
      },
      "203.0.113.10",
    );

    middleware(request as never);

    const nextArgs = nextMock.mock.calls[0][0] as { request: { headers: Headers } };
    expect(nextArgs.request.headers.get("x-forwarded-for")).toBeNull();
    expect(nextArgs.request.headers.get("x-forwarded-host")).toBeNull();

    const warningEvents = consoleWarnSpy.mock.calls.map(
      ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
    );
    expect(warningEvents).toContainEqual(
      expect.objectContaining({
        message: "untrusted_forwarded_headers",
        sourceIp: "203.0.113.10",
        scope: "ingress",
      }),
    );
  });

  it("logs malformed cidr configuration and fails closed", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    process.env.TRUSTED_PROXY_CIDRS = "not-a-cidr";
    vi.resetModules();
    ({ middleware } = await import("../middleware"));

    const request = createRequest(
      { "x-forwarded-proto": "https", "x-request-id": "req-malformed" },
      "10.1.1.1",
    );

    middleware(request as never);

    const nextArgs = nextMock.mock.calls[0][0] as { request: { headers: Headers } };
    expect(nextArgs.request.headers.get("x-forwarded-proto")).toBeNull();

    const warningEvents = consoleWarnSpy.mock.calls.map(
      ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
    );
    expect(warningEvents).toContainEqual(
      expect.objectContaining({
        message: "invalid_trusted_proxy_cidrs",
        requestId: "req-malformed",
        invalidCidrs: ["not-a-cidr"],
      }),
    );
  });

  it("logs middleware_failure and returns 500 with requestId when NextResponse.next throws", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    nextMock.mockImplementationOnce(() => {
      throw new Error("next failure");
    });

    const request = createRequest({ "x-request-id": "req-mid-failure" });

    const response = middleware(request as never);

    expect(jsonMock).toHaveBeenCalledWith(
      {
        error: "Internal Server Error",
        requestId: "req-mid-failure",
      },
      { status: 500 },
    );

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe("req-mid-failure");

    const errorEvents = consoleErrorSpy.mock.calls.map(
      ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
    );
    const middlewareFailureEvents = errorEvents.filter(
      (entry) => entry.message === "middleware_failure",
    );

    expect(middlewareFailureEvents).toHaveLength(1);
    expect(middlewareFailureEvents[0]).toEqual(
      expect.objectContaining({
        requestId: "req-mid-failure",
        method: "GET",
        path: "/markets",
        scope: "server",
      }),
    );
  });
});
