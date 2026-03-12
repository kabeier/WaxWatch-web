import Link from "next/link";

import { resolveAuthHandoffContext, toLoginHrefFromContext } from "@/lib/auth/handoff";

type SignedOutPageProps = {
  searchParams?: Promise<{
    reason?: string;
    return_to?: string;
    handoff?: string;
    state?: string;
    nonce?: string;
    expires_at?: string;
  }>;
};

export default async function SignedOutPage({ searchParams }: SignedOutPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const loginHref = toLoginHrefFromContext(resolveAuthHandoffContext(resolvedSearchParams));

  return (
    <section>
      <h1>Signed out</h1>
      <p>You have been securely signed out. Please sign in again when ready.</p>
      <p>
        Continue with secure login: <Link href={loginHref}>Go to login</Link>
      </p>
    </section>
  );
}
