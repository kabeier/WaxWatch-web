# Mobile Auth Session Adapter Contract (React Native)

This document defines the expected adapter contract for mobile clients that use the shared API client.

## Shared interface

The web and mobile clients share `AuthSessionAdapter` from `src/lib/auth/session-adapter.ts`.

Required methods:

- `getAccessToken()`
- `clearSession()`
- `emitAuthEvent(event)`
- `redirectToSignedOut(reason)`

Optional method:

- `redirectToAccountRemoved()`

## React Native adapter shape

In the mobile repo, create an adapter file similar to:

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
const LEGACY_TOKEN_KEY = "waxwatch.auth.jwt";

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
      await AsyncStorage.multiRemove([AUTH_SESSION_KEY, LEGACY_TOKEN_KEY]);
      await SecureStore.deleteItemAsync("waxwatch.refresh.token");
    },
    emitAuthEvent(event) {
      // Optional: bridge this to analytics, event bus, or native emitter.
      console.log("auth_event", event);
    },
    redirectToSignedOut(reason) {
      nav.navigateSignedOut(reason);
      // Alternative for deep links:
      // Linking.openURL(`waxwatch://signed-out?reason=${reason}`);
    },
    redirectToAccountRemoved() {
      nav.navigateAccountRemoved();
    },
  };
}
```

## Behavior expectations

- API 401/403 should call `clearSession`, emit `reauth-required`, then route to signed-out flow.
- `/me/logout` should clear session, emit `signed-out`, then route to signed-out flow.
- `DELETE /me` or `DELETE /me/hard-delete` should clear session, emit `account-removed`, then route to account-removed flow.
