export type AuthEvent = "signed-out" | "account-removed" | "reauth-required";

export type SignedOutReason = Extract<AuthEvent, "signed-out" | "reauth-required">;

export interface AuthSessionAdapter {
  getAccessToken(): string | null | Promise<string | null>;
  clearSession(): void | Promise<void>;
  emitAuthEvent(event: AuthEvent): void | Promise<void>;
  redirectToSignedOut(reason: SignedOutReason): void | Promise<void>;
  redirectToAccountRemoved?(): void | Promise<void>;
}
