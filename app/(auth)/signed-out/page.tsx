import Link from "next/link";

import { EditorShell, PageView, pageViewStyles } from "@/components/page-view/PageView";
import { CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/base";
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
    <PageView
      title="Signed out"
      description="Confirm that the current session has ended."
      eyebrow="Signed out"
      centered
      compactWave
      meta={
        <span>Account-state pages use a single centered card and direct follow-up actions.</span>
      }
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Session ended</CardTitle>
          <CardDescription>
            You have been securely signed out. Sign back in whenever you are ready.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.copyStack}>
          <p className={pageViewStyles.mutedText}>
            Continue with secure login using the preserved handoff context when available.
          </p>
          <p>
            <Link className={pageViewStyles.listLink} href={loginHref}>
              Go to login
            </Link>
          </p>
        </CardBody>
      </EditorShell>
    </PageView>
  );
}
