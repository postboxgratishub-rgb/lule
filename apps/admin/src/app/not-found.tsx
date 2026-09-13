import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="panel max-w-lg p-8 text-center">
        <SearchX className="mx-auto size-10 text-ink-500" aria-hidden="true" />
        <h1 className="mt-5 text-xl font-bold text-ink-950">Page not found</h1>
        <p className="mt-2 text-sm text-ink-500">
          This record may have moved or no longer exists.
        </p>
        <Link href="/dashboard" className="button-primary mt-6">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
