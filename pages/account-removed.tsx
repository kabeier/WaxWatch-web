import Link from "next/link";

export default function AccountRemovedPage() {
  return (
    <section>
      <h1>Account removed</h1>
      <p>Your account has been removed and you have been signed out from this device.</p>
      <p>
        Need access again? <Link href="/">Return home</Link>
      </p>
    </section>
  );
}
