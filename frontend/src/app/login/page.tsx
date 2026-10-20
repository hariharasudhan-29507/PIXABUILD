"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { setCurrentUser, DEFAULT_ADMIN, recordActivity } from "@/lib/supabase";

const loginSchema = z.object({
  identifier: z.string().min(2, "Username or email must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fillAdmin = () => {
    setIdentifier("admin");
    setPassword("admin123");
    setErrors({});
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const validation = loginSchema.safeParse({ identifier, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    // Simulate auth verification with Admin or Regular Supabase User
    setTimeout(() => {
      setLoading(false);
      const isSuperAdmin = (identifier.trim().toLowerCase() === "admin" && password === "admin123");

      if (isSuperAdmin) {
        setCurrentUser(DEFAULT_ADMIN);
        router.push("/admin/dashboard");
      } else if (password.length >= 6) {
        // Successful regular login
        const regularUser = {
          user_id: "user-" + Math.random().toString(36).substring(2, 9),
          email: identifier.includes("@") ? identifier : `${identifier}@pixabuild.user`,
          first_name: identifier.split("@")[0] || "Pixa",
          last_name: "Customer",
          role: "user" as const,
          status: "active" as const,
        };
        setCurrentUser(regularUser);
        router.push("/catalog");
      } else {
        setServerError("Invalid credentials. Try default admin: admin / admin123");
      }
    }, 450);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Clerk-style Auth Card */}
          <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] shadow-sm">
            {/* Header */}
            <div className="text-center space-y-1 mb-6">
              <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
                Secure Authentication // Supabase
              </span>
              <h1 className="text-2xl font-heading text-[var(--color-forest-charcoal)]">
                SIGN IN TO PIXABUILD
              </h1>
              <p className="text-xs text-[var(--color-muted-taupe)]">
                Access your room scans, saved layouts, and purchase history.
              </p>
            </div>

            {/* Default Admin Quick-Fill Pill */}
            <div className="mb-6 p-3 rounded-lg bg-[var(--color-warm-ivory)] border border-[var(--color-terracotta)]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--color-terracotta)]" />
                <span className="text-xs text-[var(--color-forest-charcoal)]">
                  Admin Demo: <strong>admin / admin123</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={fillAdmin}
                className="text-[11px] font-semibold text-[var(--color-terracotta)] hover:underline"
              >
                Autofill
              </button>
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-forest-charcoal)] mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-[var(--color-muted-taupe)]" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin or user@domain.com"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-9 pr-3 py-2 text-xs text-[var(--color-forest-charcoal)] placeholder-[var(--color-muted-taupe)]/60 focus:border-[var(--color-sage-green)] focus:outline-none focus:ring-1 focus:ring-[var(--color-sage-green)]"
                  />
                </div>
                {errors.identifier && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.identifier}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-forest-charcoal)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-4 w-4 text-[var(--color-muted-taupe)]" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-9 pr-3 py-2 text-xs text-[var(--color-forest-charcoal)] placeholder-[var(--color-muted-taupe)]/60 focus:border-[var(--color-sage-green)] focus:outline-none focus:ring-1 focus:ring-[var(--color-sage-green)]"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs font-medium mt-2"
              >
                {loading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Continue to Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--color-muted-taupe)]">
              <span>Don&apos;t have an account? </span>
              <Link href="/register" className="font-semibold text-[var(--color-sage-green)] hover:underline">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
