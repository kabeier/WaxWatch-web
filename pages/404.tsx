import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>That page doesn’t exist.</p>
      <Link href="/">Go home</Link>
    </section>
  );
}
