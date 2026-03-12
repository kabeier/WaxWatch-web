# Mobile Auth Session Adapter Contract (React Native)

This document defines the shared adapter contract for clients using the API client.

## Shared interface

Web and mobile share `AuthSessionAdapter` from `src/lib/auth/session-adapter.ts`.

Required methods:

- `getAccessToken()`
- `clearSession()`
- `emitAuthEvent(event)`
- `redirectToSignedOut(reason)`

Optional method:

- `redirectToAccountRemoved()`

## Canonical lifecycle from API client hooks

The adapter is invoked by API client hooks and should not be re-implemented ad hoc in features.

1. API client asks adapter for token via `getAccessToken`.
2. API client sends `Authorization: Bearer <jwt>`.
3. API client invokes adapter hooks for auth outcomes in fixed order:
   - `401/403` response: `clearSession` → `emitAuthEvent("reauth-required")` → `redirectToSignedOut("reauth-required")`
   - `POST /me/logout` success: `clearSession` → `emitAuthEvent("signed-out")` → `redirectToSignedOut("signed-out")`
   - `DELETE /me` or `DELETE /me/hard-delete` success: `clearSession` → `emitAuthEvent("account-removed")` → `redirectToAccountRemoved()`

### Semantics requirements

- Methods may be sync or async; API client awaits each step.
- Hook failures should be isolated to the hook (do not crash request handling).
- Event names and redirect reasons must match exactly so web/mobile analytics + UX stay aligned.

## React Native adapter shape

In mobile repo, create e.g.:

- `src/lib/auth/native-session-adapter.ts`

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type { AuthSessionAdapter } from "@waxwatch/shared/auth/session-adapter";

type NavigationTarget = {
  navigateSignedOut: (reason: "signed-out" | "reauth-required") => void;
  navigateAccountRemoved: () => void;
};

const AUTH_SESSION_KEY = "waxwatch.auth.session";

export function createNativeAuthSessionAdapter(nav: NavigationTarget): AuthSessionAdapter {
  return {
    async getAccessToken() {
      const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as {
          access_token?: string;
          session?: { access_token?: string };
          currentSession?: { access_token?: string };
        };
        return (
          parsed.access_token ??
          parsed.session?.access_token ??
          parsed.currentSession?.access_token ??
          null
        );
      } catch {
        return null;
      }
    },
    async clearSession() {
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      await SecureStore.deleteItemAsync("waxwatch.refresh.token");
    },
    emitAuthEvent(event) {
      // Optional: bridge this to analytics/event bus/native emitter.
      console.log("auth_event", event);
    },
    redirectToSignedOut(reason) {
      nav.navigateSignedOut(reason);
      // Alternative: Linking.openURL(`waxwatch://signed-out?reason=${reason}`)
    },
    redirectToAccountRemoved() {
      nav.navigateAccountRemoved();
    },
  };
}
```

## Migration guidance

- Prefer passing the adapter once to shared API client creation.
- Avoid direct calls to legacy web helper functions (`getSupabaseAccessToken`, `clearAuthSession`, `completeAuthEvent`, `handleApiAuthorizationFailure`) in mobile code.
- For non-API network paths (for example SSE), reuse shared auth lifecycle helpers that accept an `AuthSessionAdapter` so behavior stays identical to API requests.
