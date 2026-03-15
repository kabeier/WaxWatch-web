import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "../app/(auth)/login/page";
import { LoginPageClient } from "../app/(auth)/login/LoginPageClient";

describe("Login page", () => {
  it("submits valid credentials and redirects to the default destination", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(
      <LoginPageClient
        handoff={{
          returnTo: null,
          handoffUrl: null,
          state: null,
          nonce: null,
          expiresAt: null,
          expiresAtEpochMs: null,
          isExpired: false,
          hasRequiredSecurityParams: false,
        }}
        fetchImpl={fetchMock}
        onRedirect={onRedirect}
      />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "listener@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/auth/login",
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

    render(
      <LoginPageClient
        handoff={{
          returnTo: null,
          handoffUrl: null,
          state: null,
          nonce: null,
          expiresAt: null,
          expiresAtEpochMs: null,
          isExpired: false,
          hasRequiredSecurityParams: false,
        }}
        fetchImpl={fetchMock}
      />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "listener@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i);
    });
  });

  it("shows secure handoff-required state when handoff params are incomplete", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({
        handoff: "waxwatch://auth/callback",
      }),
    });

    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(/secure handoff required/i);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
