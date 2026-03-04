import Link from "next/link";
import { Page, PageHeader } from "@/components/primitives";

export default function AccountRemovedPage() {
  return (
    <Page>
      <PageHeader
        title="Account removed"
        summary="Your account has been removed and you have been signed out from this device."
      />
      <p>
        Need access again? <Link href="/login">Go to login</Link>
      </p>
    </Page>
  );
}
