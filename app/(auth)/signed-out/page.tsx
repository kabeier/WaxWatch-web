import { Page, PageHeader } from "@/components/primitives";

export default function SignedOutPage() {
  return (
    <Page>
      <PageHeader
        title="Signed out"
        summary="You have been securely signed out. Please sign in again when ready."
      />
    </Page>
  );
}
