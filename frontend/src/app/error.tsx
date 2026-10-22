"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] px-4 py-16 text-[var(--color-forest-charcoal)]">
      <div className="pixa-card bg-[var(--color-sand-beige)] text-center max-w-md w-full p-8 space-y-5 border-[var(--border-subtle)] shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
            Execution Exception Caught
          </span>
          <h1 className="text-2xl font-heading text-[var(--color-forest-charcoal)]">
            SOMETHING WENT WRONG
          </h1>
          <p className="text-xs text-[var(--color-muted-taupe)] font-mono bg-[var(--color-warm-ivory)] p-2 rounded border border-[var(--border-subtle)] truncate">
            {error.message || "An unexpected rendering fault occurred."}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="btn-primary text-xs py-2 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
          <Link href="/" className="btn-secondary text-xs py-2 px-4">
            <Home className="h-3.5 w-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
