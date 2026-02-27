import { useEffect } from "react";
import { installAuthSessionController } from "@/lib/auth-session";

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

export default function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  useEffect(() => {
    const controller = installAuthSessionController();

    return () => {
      controller.teardown();
    };
  }, []);

  return <>{children}</>;
}
