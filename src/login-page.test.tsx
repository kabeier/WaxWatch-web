import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginPage from "../app/(auth)/login/page";
import { LoginPageClient } from "../app/(auth)/login/LoginPageClient";

const noHandoffContext = {
  returnTo: null,
  handoffUrl: null,
  state: null,
  nonce: null,
  expiresAt: null,
  expiresAtEpochMs: null,
  isExpired: false,
  hasRequiredSecurityParams: false,
} as const;

afterEach(() => {
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  vi.restoreAllMocks();
});

describe("Login page", () => {
  it("submits valid credentials through configured API base URL and redirects to default destination", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "/api";

    const fetchMock = vi.fn(async () => new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(
      <LoginPageClient handoff={noHandoffContext} fetchImpl={fetchMock} onRedirect={onRedirect} />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
    });

    expect(onRedirect).toHaveBeenCalledWith("/");
  });

  it("shows invalid credentials state when login fails with 401", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "invalid credentials" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    ) as typeof fetch;

    render(<LoginPageClient handoff={noHandoffContext} fetchImpl={fetchMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i);
    });
  });



  it("shows invalid credentials state when login fails with validation_error envelope", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: { message: "validation error", code: "validation_error", status: 422 },
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          },
        ),
    ) as typeof fetch;

    render(<LoginPageClient handoff={noHandoffContext} fetchImpl={fetchMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i);
    });
  });

  it("shows rate-limited state when login fails with rate_limited envelope", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "rate limit exceeded",
              code: "rate_limited",
              status: 429,
              details: { scope: "auth_login", retry_after_seconds: 60 },
            },
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", "Retry-After": "60" },
          },
        ),
    ) as typeof fetch;

    render(<LoginPageClient handoff={noHandoffContext} fetchImpl={fetchMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/rate limit exceeded/i);
    });
  });

  it("prevents submit when a once-valid handoff expires before sign in", async () => {
    let nowMs = Date.parse("2026-01-02T00:00:00.000Z");
    vi.spyOn(Date, "now").mockImplementation(() => nowMs);

    const fetchMock = vi.fn(async () => new Response(null, { status: 200 })) as typeof fetch;

    render(
      <LoginPageClient
        handoff={{
          returnTo: null,
          handoffUrl: "waxwatch://auth/callback",
          state: "state-123",
          nonce: "nonce-123",
          expiresAt: "1767312001",
          expiresAtEpochMs: 1767312001000,
          isExpired: false,
          hasRequiredSecurityParams: true,
        }}
        fetchImpl={fetchMock}
      />,
    );

    nowMs = Date.parse("2026-01-02T00:00:02.000Z");

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/handoff link expired/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows missing-params handoff-required state when handoff params are incomplete", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({
        handoff: "waxwatch://auth/callback",
      }),
    });

    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(/missing required security parameters/i);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("shows expired handoff state when security params are present but expiry has passed", async () => {
    vi.spyOn(Date, "now").mockImplementation(() => Date.parse("2026-01-02T00:00:02.000Z"));

    const page = await LoginPage({
      searchParams: Promise.resolve({
        handoff: "waxwatch://auth/callback",
        state: "state-123",
        nonce: "nonce-123",
        expires_at: "2026-01-02T00:00:01.000Z",
      }),
    });

    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(/handoff link has expired/i);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
