"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, KeyRound, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Faq3DMarquee } from "@/components/Faq3DMarquee";
import { signInWithSupabase } from "@/lib/supabase";

const loginSchema = z.object({
  identifier: z.string().min(2, "Username or email must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/catalog";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [userNotFoundModal, setUserNotFoundModal] = useState(false);

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
    const { user, error, notFound } = await signInWithSupabase({ identifier, password });
    setLoading(false);

    if (user) {
      if (user.role === "admin" && redirectUrl === "/catalog") {
        router.push("/admin/dashboard");
      } else {
        router.push(redirectUrl);
      }
    } else if (notFound) {
      setUserNotFoundModal(true);
    } else {
      setServerError(error || "Invalid credentials. Please verify your email and password.");
    }
  };

  return (
    <div className="bg-[#FCFBF8]/95 backdrop-blur-md border border-[#DCD6CB] rounded-2xl p-7 sm:p-8 shadow-xl">
      {/* Header with Dark Brand Logo & Title */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <svg
            viewBox="0 0 295 300"
            className="h-7 w-7 text-[#42483A] shrink-0"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 2,64 L 1,65 L 1,187 L 0,188 L 0,299 L 145,299 L 145,273 L 146,272 L 146,236 L 64,236 L 63,235 L 63,174 L 64,173 L 64,64 Z M 279,0 L 280,1 L 279,3 L 280,4 L 280,13 L 281,13 L 281,5 L 282,4 L 284,7 L 284,9 L 286,13 L 288,13 L 289,11 L 289,9 L 292,4 L 293,5 L 293,13 L 294,13 L 294,0 L 291,0 L 290,5 L 287,10 L 285,7 L 285,5 L 284,4 L 284,2 L 283,0 Z M 266,0 L 266,1 L 269,1 L 271,3 L 270,4 L 270,13 L 272,13 L 272,2 L 273,1 L 276,1 L 276,0 Z M 67,0 L 66,2 L 66,63 L 230,63 L 231,64 L 231,158 L 230,159 L 230,170 L 229,171 L 148,171 L 147,172 L 147,234 L 221,234 L 223,233 L 294,162 L 294,64 L 232,64 L 230,62 L 231,61 L 231,0 Z"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-brand text-2xl tracking-[0.16em] text-[#42483A] leading-none uppercase">
            PIXABUILD
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-serif text-[#292B26] font-medium">
          Sign In to Your Workspace
        </h1>
        <p className="text-xs text-[#6B655C]">
          Access your room scans, saved layouts, and purchase history.
        </p>
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
          <label className="block text-xs font-medium text-[#292B26] mb-1">
            Email or Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-[#8A7867]" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="enter your credentials"
              className="w-full rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] pl-9 pr-3 py-2.5 text-xs text-[#292B26] placeholder-[#8A7867]/70 focus:border-[#42483A] focus:outline-none focus:ring-1 focus:ring-[#42483A]"
            />
          </div>
          {errors.identifier && (
            <p className="mt-1 text-[11px] text-red-600">{errors.identifier}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#292B26] mb-1">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyRound className="h-4 w-4 text-[#8A7867]" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] pl-9 pr-3 py-2.5 text-xs text-[#292B26] placeholder-[#8A7867]/70 focus:border-[#42483A] focus:outline-none focus:ring-1 focus:ring-[#42483A]"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-xs font-medium mt-2 bg-[#42483A] hover:bg-[#2E3328]"
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

      <div className="mt-6 pt-4 border-t border-[#DCD6CB] text-center text-xs text-[#6B655C]">
        <span>Don&apos;t have an account? </span>
        <Link
          href={redirectUrl !== "/catalog" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
          className="font-semibold text-[#42483A] hover:underline"
        >
          Create one
        </Link>
      </div>

      {/* User Does Not Exist Modal - Clean rounded rectangle card with no black background */}
      {userNotFoundModal && (
        <div
          onClick={() => setUserNotFoundModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-transparent animate-in fade-in-50 duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#FCFBF8] border border-[#DCD6CB] rounded-2xl p-7 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* PixaBuild Logo in dark brand color */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5DDD0]/70 text-[#42483A]">
              <svg
                viewBox="0 0 295 300"
                className="h-9 w-9 text-[#42483A] fill-current"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M 2,64 L 1,65 L 1,187 L 0,188 L 0,299 L 145,299 L 145,273 L 146,272 L 146,236 L 64,236 L 63,235 L 63,174 L 64,173 L 64,64 Z M 279,0 L 280,1 L 279,3 L 280,4 L 280,13 L 281,13 L 281,5 L 282,4 L 284,7 L 284,9 L 286,13 L 288,13 L 289,11 L 289,9 L 292,4 L 293,5 L 293,13 L 294,13 L 294,0 L 291,0 L 290,5 L 287,10 L 285,7 L 285,5 L 284,4 L 284,2 L 283,0 Z M 266,0 L 266,1 L 269,1 L 271,3 L 270,4 L 270,13 L 272,13 L 272,2 L 273,1 L 276,1 L 276,0 Z M 67,0 L 66,2 L 66,63 L 230,63 L 231,64 L 231,158 L 230,159 L 230,170 L 229,171 L 148,171 L 147,172 L 147,234 L 221,234 L 223,233 L 294,162 L 294,64 L 232,64 L 230,62 L 231,61 L 231,0 Z"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="font-brand text-xl tracking-[0.18em] text-[#42483A] uppercase block">
                PIXABUILD
              </span>
              <h3 className="font-serif text-2xl text-[#292B26] font-medium">
                User Does Not Exist
              </h3>
              <p className="text-xs text-[#6B655C] leading-relaxed max-w-sm mx-auto">
                No registered account was found for <span className="font-semibold text-[#292B26] break-all">{identifier}</span>. Would you like to create a free account to explore our curated furniture catalog and room visualizer?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/register?email=${encodeURIComponent(identifier)}&redirect=${encodeURIComponent(redirectUrl)}`}
                className="btn-primary text-xs py-3 px-6 flex-1 flex items-center justify-center gap-2 bg-[#42483A] hover:bg-[#2E3328] text-white rounded-lg shadow-sm"
              >
                <span>Create Account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setUserNotFoundModal(false)}
                className="btn-secondary text-xs py-3 px-5 border border-[#DCD6CB] text-[#6B655C] hover:bg-[#F0ECE1] rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26] overflow-hidden">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden z-10">
        <Faq3DMarquee />
        <div className="relative w-full max-w-md space-y-6 z-10">
          <Suspense fallback={<div className="text-center py-12 text-xs text-[#8A7867]">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
