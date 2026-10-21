"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Faq3DMarquee } from "@/components/Faq3DMarquee";
import { signUpWithSupabase } from "@/lib/supabase";

const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name or initial is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. user@domain.com)"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/catalog";
  const initialEmail = searchParams.get("email") || "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: initialEmail,
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { user, error } = await signUpWithSupabase({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
    });
    setLoading(false);

    if (user) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user_updated"));
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl);
      }
    } else {
      setErrors({ form: error || "Registration failed. Please try again." });
    }
  };

  return (
    <div className="bg-[#FCFBF8]/95 backdrop-blur-md border border-[#DCD6CB] rounded-2xl p-7 sm:p-8 shadow-xl">
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
          Create Your Account
        </h1>
        <p className="text-xs text-[#6B655C]">
          Save room scans, curate wishlists, and explore curated furniture collections.
        </p>
      </div>

      {errors.form && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#292B26] mb-1">
              First Name
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="First name"
              className="w-full rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] px-3 py-2 text-xs text-[#292B26] placeholder-[#8A7867]/60 focus:border-[#42483A] focus:outline-none focus:ring-1 focus:ring-[#42483A]"
            />
            {errors.firstName && <p className="mt-1 text-[11px] text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[#292B26] mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Last name"
              className="w-full rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] px-3 py-2 text-xs text-[#292B26] placeholder-[#8A7867]/60 focus:border-[#42483A] focus:outline-none focus:ring-1 focus:ring-[#42483A]"
            />
            {errors.lastName && <p className="mt-1 text-[11px] text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#292B26] mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-[#8A7867]" />
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@email.com"
              className="w-full rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] pl-9 pr-3 py-2 text-xs text-[#292B26] placeholder-[#8A7867]/60 focus:border-[#42483A] focus:outline-none focus:ring-1 focus:ring-[#42483A]"
            />
          </div>
          {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[#292B26]">
              Password
            </label>
            <span className="text-[10px] text-[#8A7867]">At least 6 characters</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-[#8A7867]" />
            </div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] pl-9 pr-3 py-2 text-xs text-[#292B26] placeholder-[#8A7867]/60 focus:border-[#42483A] focus:outline-none focus:ring-1 focus:ring-[#42483A]"
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
            <span>Creating Member Profile...</span>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#DCD6CB] text-center text-xs text-[#6B655C]">
        <span>Already registered? </span>
        <Link
          href={redirectUrl !== "/catalog" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
          className="font-semibold text-[#42483A] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26] overflow-hidden">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden z-10">
        <Faq3DMarquee />
        <div className="relative w-full max-w-md space-y-6 z-10">
          <Suspense fallback={<div className="text-center py-12 text-xs text-[#8A7867]">Loading...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
