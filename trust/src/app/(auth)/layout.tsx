import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-2xl font-extrabold tracking-tight text-brand-dark">TRUST</Link>
      {children}
    </main>
  );
}
