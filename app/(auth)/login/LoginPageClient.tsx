"use client";

import { FormEvent, useMemo, useState } from "react";

import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import { EditorShell, PageView, pageViewStyles } from "@/components/page-view/PageView";
import {
  Button,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  TextInput,
} from "@/components/ui/primitives/base";
import type { AuthHandoffContext } from "@/lib/auth/handoff";
import { toApiError, tryParseErrorEnvelope } from "@/lib/api/errors";
import { resolveApiBaseUrl } from "@/lib/query/api";

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

type HandoffState = "valid" | "missing_or_invalid_security_params" | "expired";

function resolveHandoffState(handoff: AuthHandoffContext, nowMs = Date.now()): HandoffState {
  if (!handoff.handoffUrl) {
    return "valid";
  }

  if (!handoff.hasRequiredSecurityParams || handoff.expiresAtEpochMs === null) {
    return "missing_or_invalid_security_params";
  }

  return nowMs < handoff.expiresAtEpochMs ? "valid" : "expired";
}

function resolveLoginEndpoint() {
  const baseUrl = resolveApiBaseUrl();
  return `${baseUrl.replace(/\/$/, "")}/auth/login`;
}

function resolveSuccessDestination(handoff: AuthHandoffContext): string {
  const handoffReady = resolveHandoffState(handoff) === "valid";

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

  const handoffState = useMemo(() => resolveHandoffState(handoff), [handoff]);
  const handoffBlocked = Boolean(handoff.handoffUrl && handoffState !== "valid");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitHandoffState = resolveHandoffState(handoff);

    if (handoff.handoffUrl && submitHandoffState === "missing_or_invalid_security_params") {
      setUiState({
        kind: "error",
        message: "This handoff link is missing required security parameters.",
      });
      return;
    }

    if (handoff.handoffUrl && submitHandoffState === "expired") {
      setUiState({
        kind: "error",
        message: "This handoff link expired. Request a new secure sign-in handoff.",
      });
      return;
    }

    setUiState({ kind: "loading" });

    try {
      const response = await fetchImpl(resolveLoginEndpoint(), {
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

        const errorDiscriminator = envelope?.error?.code ?? envelope?.error?.type;
        const isInvalidCredentialsFailure =
          response.status === 401 ||
          response.status === 403 ||
          errorDiscriminator === "invalid_credentials";

        if (isInvalidCredentialsFailure) {
          setUiState({
            kind: "error",
            message: "Invalid email or password.",
          });
          return;
        }

        if (apiError.kind === "validation_error") {
          const validationMessage =
            envelope?.error?.message ?? envelope?.message ?? "Please check the form and try again.";

          setUiState({
            kind: "error",
            message: validationMessage,
          });
          return;
        }

        setUiState({
          kind: "error",
          message: apiError.message,
        });
        return;
      }

      const postSubmitHandoffState = resolveHandoffState(handoff);

      if (handoff.handoffUrl && postSubmitHandoffState === "missing_or_invalid_security_params") {
        setUiState({
          kind: "error",
          message: "This handoff link is missing required security parameters.",
        });
        return;
      }

      if (handoff.handoffUrl && postSubmitHandoffState === "expired") {
        setUiState({
          kind: "error",
          message: "This handoff link expired. Request a new secure sign-in handoff.",
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
    <PageView
      title="Login"
      description="Sign in with your WaxWatch credentials or complete a secure mobile handoff."
      eyebrow="Signed out"
      centered
      compactWave
      meta={
        <span>
          Authentication stays centered and uncluttered; the form is the canonical web entrypoint,
          with secure handoff support for mobile.
        </span>
      }
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Sign in to WaxWatch</CardTitle>
          <CardDescription>
            Use your WaxWatch email and password, or finish a secure sign-in handoff from the mobile
            app.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.cardStack}>
          {handoffBlocked ? (
            <StateError
              title="Secure handoff required"
              message={
                handoffState === "expired"
                  ? "This handoff link has expired. Request a new secure sign-in handoff."
                  : "This handoff link is missing required security parameters."
              }
              detail={
                handoffState === "expired"
                  ? "Handoff links are time-limited for security. Request a new sign-in handoff from the mobile app and try again."
                  : "Request a new sign-in handoff from the mobile app and try again."
              }
            />
          ) : (
            <form className={pageViewStyles.formStack} onSubmit={handleSubmit}>
              <label className={pageViewStyles.labelStack} htmlFor="email">
                <span className={pageViewStyles.labelText}>Email</span>
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className={pageViewStyles.labelStack} htmlFor="password">
                <span className={pageViewStyles.labelText}>Password</span>
                <TextInput
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <CardFooter>
                <Button type="submit" disabled={uiState.kind === "loading"}>
                  Sign in
                </Button>
              </CardFooter>
            </form>
          )}

          {uiState.kind === "loading" ? <StateLoading message="Signing you in…" /> : null}
          {uiState.kind === "error" ? <StateError message={uiState.message} /> : null}
          {uiState.kind === "rate_limited" ? (
            <StateRateLimited
              message={uiState.message}
              retryAfterSeconds={uiState.retryAfterSeconds}
            />
          ) : null}
        </CardBody>
      </EditorShell>
    </PageView>
  );
}
