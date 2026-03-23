import Link from "next/link";

import { EditorShell, PageView, pageViewStyles } from "@/components/page-view/PageView";
import { CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/base";
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
    <PageView
      title="Account removed"
      description="Confirm that the account was deleted and access was revoked."
      eyebrow="Signed out"
      centered
      compactWave
      meta={
        <span>
          Keep irreversible account-state messaging concise and paired with one clear next step.
        </span>
      }
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Account removed</CardTitle>
          <CardDescription>
            Your account has been removed and you have been signed out from this device.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.copyStack}>
          <p className={pageViewStyles.mutedText}>
            If you need access again, start with a fresh secure login flow.
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
