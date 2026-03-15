import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureServerErrorMock } = vi.hoisted(() => ({
  captureServerErrorMock: vi.fn(),
}));

vi.mock("@/lib/error-tracking", () => ({
  captureServerError: captureServerErrorMock,
}));

import { logServerError } from "./server-error";

describe("logServerError request id normalization", () => {
  beforeEach(() => {
    captureServerErrorMock.mockClear();
  });

  it("returns undefined and does not propagate blank x-request-id", () => {
    const req = {
      method: "GET",
      url: "/api/ping?x=1",
      headers: {
        "x-request-id": "   ",
      },
    };

    const requestId = logServerError(new Error("boom"), req as never, "api_handler_exception");

    expect(requestId).toBeUndefined();
    expect(captureServerErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      undefined,
      expect.objectContaining({
        method: "GET",
        path: "/api/ping",
      }),
    );
  });

  it("uses first non-empty trimmed x-request-id from arrays", () => {
    const req = {
      method: "POST",
      url: "/api/ping",
      headers: {
        "x-request-id": ["   ", " req-123 ", "ignored"],
      },
    };

    const requestId = logServerError(new Error("boom"), req as never, "api_handler_exception");

    expect(requestId).toBe("req-123");
    expect(captureServerErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      "req-123",
      expect.any(Object),
    );
  });

  it("returns undefined when x-request-id array contains only blank entries", () => {
    const req = {
      method: "POST",
      url: "/api/ping",
      headers: {
        "x-request-id": ["\t", "   "],
      },
    };

    const requestId = logServerError(new Error("boom"), req as never, "api_handler_exception");

    expect(requestId).toBeUndefined();
    expect(captureServerErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      undefined,
      expect.any(Object),
    );
  });
});
