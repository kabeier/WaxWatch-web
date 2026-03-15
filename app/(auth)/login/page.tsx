import { resolveAuthHandoffContext } from "@/lib/auth/handoff";

import { LoginPageClient } from "./LoginPageClient";

type LoginPageProps = {
  searchParams?: Promise<{
    return_to?: string;
    handoff?: string;
    state?: string;
    nonce?: string;
    expires_at?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const handoff = resolveAuthHandoffContext(resolvedSearchParams);

  return <LoginPageClient handoff={handoff} />;
}
