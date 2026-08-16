// app/not-found.tsx
import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <div className="w-14 h-14 rounded-[14px] grid place-items-center mx-auto mb-5 bg-[var(--brand-soft)] text-[var(--brand)]">
          <Compass className="w-7 h-7" />
        </div>
        <h1 className="font-heading text-[26px] text-[var(--ink)]">
          Page not found
        </h1>
        <p className="mt-2 text-[13.5px] text-[var(--ink-3)] max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="h-10 px-4 inline-flex items-center rounded-[9px] text-[12.5px] font-bold bg-[var(--brand)] text-white"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}