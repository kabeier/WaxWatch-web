import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "../../../../app/(auth)/login/page";
import { LoginPageClient } from "../../../../app/(auth)/login/LoginPageClient";

const noHandoff = {
  returnTo: null,
  handoffUrl: null,
  state: null,
  nonce: null,
  expiresAt: null,
  expiresAtEpochMs: null,
  isExpired: false,
  hasRequiredSecurityParams: false,
} as const;

describe("/login route", () => {
  it("renders default sign-in success path and redirects after submit", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();

    resolveFetch?.(new Response(null, { status: 200 }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
  });

  it("shows empty-state style blocking copy for missing handoff security parameters", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({ handoff: "waxwatch://auth/callback" }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: /secure handoff required/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/missing required security parameters/i);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("shows expired handoff failure copy before allowing a fresh login success path", async () => {
    const expiredPage = await LoginPage({
      searchParams: Promise.resolve({
        handoff: "waxwatch://auth/callback",
        state: "state-1",
        nonce: "nonce-1",
        expires_at: "2026-01-01T00:00:00.000Z",
      }),
    });
    const { unmount } = render(expiredPage);
    expect(screen.getByRole("heading", { name: /secure handoff required/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/handoff link has expired/i);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
    unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();
    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
  });

  it("covers API errors and cooldown state messaging", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Auth service unavailable." } }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Too many attempts." } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "20" },
        }),
      ) as typeof fetch;

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/auth service unavailable/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts\./i);
    expect(screen.getByRole("alert")).toHaveTextContent(/retry-after:\s*20s/i);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows cooldown copy, then clears it while submit is pending and redirects after retry", async () => {
    let resolveSecondFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Too many attempts." } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "5" },
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveSecondFetch = resolve;
          }),
      ) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/retry-after:\s*5s/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
    expect(screen.queryByText(/too many attempts\./i)).not.toBeInTheDocument();

    resolveSecondFetch?.(new Response(null, { status: 200 }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
  });

  it("clears cooldown error copy after a successful retry redirect", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Too many attempts." } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "8" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/retry-after:\s*8s/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
    expect(screen.queryByText(/too many attempts\./i)).not.toBeInTheDocument();
  });

  it("allows retry after a submit failure and then redirects on successful retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unable to sign in right now/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows invalid-credentials failure, then redirects after a corrected retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "invalid_credentials" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "bad-password" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password\./i);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("captures blocked handoff failure evidence before showing rate-limited retry and eventual redirect success", async () => {
    const blockedPage = await LoginPage({
      searchParams: Promise.resolve({ handoff: "waxwatch://auth/callback", state: "state-only" }),
    });
    const { unmount } = render(blockedPage);
    expect(screen.getByRole("heading", { name: /secure handoff required/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/missing required security parameters/i);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
    unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Too many attempts." } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "10" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts\./i);
    expect(screen.getByRole("alert")).toHaveTextContent(/retry-after:\s*10s/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("renders API validation errors and then redirects to secure handoff destination after retry", async () => {
    const handoff = {
      returnTo: "/watchlist/release-1",
      handoffUrl: "waxwatch://auth/callback",
      state: "state-1",
      nonce: "nonce-1",
      expiresAt: "2035-01-01T00:00:00.000Z",
      expiresAtEpochMs: Date.parse("2035-01-01T00:00:00.000Z"),
      isExpired: false,
      hasRequiredSecurityParams: true,
    } as const;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Email is required." } }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={handoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/email is required\./i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(onRedirect).toHaveBeenCalledWith(
        "waxwatch://auth/callback?state=state-1&nonce=nonce-1&expires_at=2035-01-01T00%3A00%3A00.000Z&return_to=%2Fwatchlist%2Frelease-1&status=success",
      ),
    );
  });
});
