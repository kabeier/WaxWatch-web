"use client";

import { FormEvent, useMemo, useState } from "react";

import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import type { AuthHandoffContext } from "@/lib/auth/handoff";
import { toApiError, tryParseErrorEnvelope } from "@/lib/api/errors";

type LoginPageClientProps = {
  handoff: AuthHandoffContext;
  fetchImpl?: typeof fetch;
  onRedirect?: (to: string) => void;
};

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "rate_limited"; message: string; retryAfterSeconds?: number };

function resolveSuccessDestination(handoff: AuthHandoffContext): string {
  const handoffReady = Boolean(
    handoff.handoffUrl && handoff.hasRequiredSecurityParams && !handoff.isExpired,
  );

  if (handoffReady && handoff.handoffUrl && handoff.state && handoff.nonce && handoff.expiresAt) {
    const destination = new URL(handoff.handoffUrl);
    destination.searchParams.set("state", handoff.state);
    destination.searchParams.set("nonce", handoff.nonce);
    destination.searchParams.set("expires_at", handoff.expiresAt);
    if (handoff.returnTo) {
      destination.searchParams.set("return_to", handoff.returnTo);
    }
    destination.searchParams.set("status", "success");
    return destination.toString();
  }

  return handoff.returnTo ?? "/";
}

export function LoginPageClient({ handoff, fetchImpl = fetch, onRedirect }: LoginPageClientProps) {
  const [uiState, setUiState] = useState<UiState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handoffBlocked = useMemo(
    () => Boolean(handoff.handoffUrl && (!handoff.hasRequiredSecurityParams || handoff.isExpired)),
    [handoff],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUiState({ kind: "loading" });

    try {
      const response = await fetchImpl("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          return_to: handoff.returnTo,
          handoff: handoff.handoffUrl,
          state: handoff.state,
          nonce: handoff.nonce,
          expires_at: handoff.expiresAt,
        }),
      });

      if (!response.ok) {
        const envelope = await tryParseErrorEnvelope(response);
        const apiError = toApiError(response, envelope);

        if (apiError.kind === "rate_limited") {
          setUiState({
            kind: "rate_limited",
            message: apiError.message,
            retryAfterSeconds: apiError.retryAfterSeconds,
          });
          return;
        }

        if (response.status === 401 || apiError.kind === "validation_error") {
          setUiState({
            kind: "error",
            message: "Invalid email or password.",
          });
          return;
        }

        setUiState({
          kind: "error",
          message: apiError.message,
        });
        return;
      }

      const destination = resolveSuccessDestination(handoff);
      if (onRedirect) {
        onRedirect(destination);
      } else {
        window.location.assign(destination);
      }
    } catch {
      setUiState({ kind: "error", message: "Unable to sign in right now. Please try again." });
    }
  }

  return (
    <section>
      <h1>Login</h1>
      {handoffBlocked ? (
        <StateError
          title="Secure handoff required"
          message="This handoff link is missing required security parameters."
          detail="Request a new sign-in handoff from the mobile app and try again."
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={uiState.kind === "loading"}>
            Sign in
          </button>
        </form>
      )}

      {uiState.kind === "loading" ? <StateLoading message="Signing you in…" /> : null}
      {uiState.kind === "error" ? <StateError message={uiState.message} /> : null}
      {uiState.kind === "rate_limited" ? (
        <StateRateLimited message={uiState.message} retryAfterSeconds={uiState.retryAfterSeconds} />
      ) : null}
    </section>
  );
}
