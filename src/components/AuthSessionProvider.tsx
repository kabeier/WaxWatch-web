"use client";

import { useEffect } from "react";
import { resetAuthSessionState } from "@/lib/auth-session";

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

export default function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  useEffect(() => {
    const onAuthEvent = () => {
      // Auth lifecycle hook for global events emitted by the API client.
    };

    window.addEventListener("waxwatch:auth", onAuthEvent as EventListener);

    return () => {
      window.removeEventListener("waxwatch:auth", onAuthEvent as EventListener);
      resetAuthSessionState();
    };
  }, []);

  return <>{children}</>;
}
