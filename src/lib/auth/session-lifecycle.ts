import { warn } from "@/lib/logger";
import type { AuthSessionAdapter, SignedOutReason } from "./session-adapter";

async function runAuthAdapterHook(hookName: string, path: string, run: () => void | Promise<void>) {
  try {
    await run();
  } catch (hookError) {
    warn({
      message: "auth_adapter_hook_failed",
      scope: "auth",
      hook: hookName,
      path,
      errorMessage: hookError instanceof Error ? hookError.message : String(hookError),
    });
  }
}

async function redirectSignedOut(
  authSessionAdapter: AuthSessionAdapter | undefined,
  path: string,
  reason: SignedOutReason,
) {
  if (!authSessionAdapter) return;
  await runAuthAdapterHook("redirectToSignedOut", path, () =>
    authSessionAdapter.redirectToSignedOut(reason),
  );
}

export async function handleAuthorizationFailureWithAdapter(
  authSessionAdapter: AuthSessionAdapter | undefined,
  context: { path: string; status: number },
) {
  warn({
    message: "auth_reauth_required",
    scope: "auth",
    path: context.path,
    status: context.status,
  });

  if (!authSessionAdapter) return;

  await runAuthAdapterHook("clearSession", context.path, () => authSessionAdapter.clearSession());
  await runAuthAdapterHook("emitAuthEvent", context.path, () =>
    authSessionAdapter.emitAuthEvent("reauth-required"),
  );
  await redirectSignedOut(authSessionAdapter, context.path, "reauth-required");
}

export async function completeAuthEventWithAdapter(
  authSessionAdapter: AuthSessionAdapter | undefined,
  event: "signed-out" | "account-removed",
  path: string,
) {
  if (!authSessionAdapter) return;

  await runAuthAdapterHook("clearSession", path, () => authSessionAdapter.clearSession());
  await runAuthAdapterHook("emitAuthEvent", path, () => authSessionAdapter.emitAuthEvent(event));

  if (event === "account-removed") {
    await runAuthAdapterHook("redirectToAccountRemoved", path, () =>
      authSessionAdapter.redirectToAccountRemoved?.(),
    );
    return;
  }

  await redirectSignedOut(authSessionAdapter, path, "signed-out");
}
