"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="card mx-auto max-w-md p-6 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-soft">The page could not be loaded. Nothing was changed.</p>
      <button type="button" onClick={reset} className="btn-primary mt-4">Try again</button>
    </div>
  );
}
