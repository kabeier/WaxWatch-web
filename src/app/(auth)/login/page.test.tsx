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
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(<LoginPageClient handoff={noHandoff} fetchImpl={fetchMock} onRedirect={onRedirect} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
  });

  it("covers missing-handoff empty state plus mutation-failure and rate-limited states", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({ handoff: "waxwatch://auth/callback" }),
    });
    const initialRender = render(page);
    expect(screen.getByRole("alert")).toHaveTextContent(/missing required security parameters/i);
    initialRender.unmount();

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
  });
});
