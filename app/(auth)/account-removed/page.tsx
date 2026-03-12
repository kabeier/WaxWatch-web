import Link from "next/link";

import { resolveAuthHandoffContext, toLoginHrefFromContext } from "@/lib/auth/handoff";

type AccountRemovedPageProps = {
  searchParams?: Promise<{
    return_to?: string;
    handoff?: string;
    state?: string;
    nonce?: string;
    expires_at?: string;
  }>;
};

export default async function AccountRemovedPage({ searchParams }: AccountRemovedPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const loginHref = toLoginHrefFromContext(resolveAuthHandoffContext(resolvedSearchParams));

  return (
    <section>
      <h1>Account removed</h1>
      <p>Your account has been removed and you have been signed out from this device.</p>
      <p>
        Need access again? <Link href={loginHref}>Go to login</Link>
      </p>
    </section>
  );
}
