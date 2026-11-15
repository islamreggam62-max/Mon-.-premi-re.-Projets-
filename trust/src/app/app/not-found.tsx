import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <h1 className="text-xl font-bold">Not found</h1>
      <p className="mt-2 text-sm text-ink-soft">This item does not exist, or it belongs to another organisation.</p>
      <Link href="/app" className="btn-primary mt-4">Back to the dashboard</Link>
    </div>
  );
}
