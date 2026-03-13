import { resolveAuthHandoffContext } from "@/lib/auth/handoff";

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
  const handoffReady = Boolean(
    handoff.handoffUrl && handoff.hasRequiredSecurityParams && !handoff.isExpired,
  );

  return (
    <section>
      <h1>Login</h1>
      <p>Supabase authentication UI will be mounted here.</p>

      <h2>Mobile handoff contract</h2>
      <ul>
        <li>
          <code>return_to</code>: optional web route for registration/account management flows.
          Allowed values include <code>/signup</code>, <code>/account</code>, and
          <code> /account/subscription</code>.
        </li>
        <li>
          <code>handoff</code>: optional deep link back to mobile (for example,
          <code> waxwatch://auth/callback</code>).
        </li>
        <li>
          <code>state</code>, <code>nonce</code>, and <code>expires_at</code> are required whenever
          <code> handoff</code> is provided.
        </li>
      </ul>

      <p>
        Handoff status: <strong>{handoffReady ? "ready" : "awaiting secure params"}</strong>
      </p>

      {handoff.returnTo ? (
        <p>
          Account management destination: <code>{handoff.returnTo}</code>
        </p>
      ) : null}

      {handoff.handoffUrl ? (
        <p>
          Mobile callback destination: <code>{handoff.handoffUrl}</code>
        </p>
      ) : null}

      {handoff.handoffUrl && !handoffReady ? (
        <p>
          Mobile handoff is blocked until <code>state</code>, <code>nonce</code>, and a non-expired
          <code> expires_at</code> value are present.
        </p>
      ) : null}

      <p>
        Registration and subscription/account management are completed on web-only routes before
        mobile handoff. Routine login stays in the React Native app.
      </p>
    </section>
  );
}
