"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { setCurrentUser } from "@/lib/supabase";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setLoading(false);
      setCurrentUser({
        user_id: "user-" + Math.random().toString(36).substring(2, 9),
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        role: "user",
        status: "active",
      });
      router.push("/catalog");
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] shadow-sm">
            <div className="text-center space-y-1 mb-6">
              <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
                Create Account // Supabase Auth
              </span>
              <h1 className="text-2xl font-heading text-[var(--color-forest-charcoal)]">
                JOIN PIXABUILD STUDIO
              </h1>
              <p className="text-xs text-[var(--color-muted-taupe)]">
                Save room profiles and preview curated IKEA designs in spatial 3D.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-forest-charcoal)] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Elena"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-3 py-2 text-xs text-[var(--color-forest-charcoal)] focus:border-[var(--color-sage-green)] focus:outline-none"
                  />
                  {errors.firstName && <p className="mt-1 text-[11px] text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-forest-charcoal)] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Lindqvist"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-3 py-2 text-xs text-[var(--color-forest-charcoal)] focus:border-[var(--color-sage-green)] focus:outline-none"
                  />
                  {errors.lastName && <p className="mt-1 text-[11px] text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-forest-charcoal)] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-[var(--color-muted-taupe)]" />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="elena@example.com"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-9 pr-3 py-2 text-xs text-[var(--color-forest-charcoal)] focus:border-[var(--color-sage-green)] focus:outline-none"
                  />
                </div>
                {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-forest-charcoal)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-[var(--color-muted-taupe)]" />
                  </div>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-9 pr-3 py-2 text-xs text-[var(--color-forest-charcoal)] focus:border-[var(--color-sage-green)] focus:outline-none"
                  />
                </div>
                {errors.password && <p className="mt-1 text-[11px] text-red-600">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs font-medium mt-2"
              >
                {loading ? (
                  <span>Registering Account...</span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--color-muted-taupe)]">
              <span>Already registered? </span>
              <Link href="/login" className="font-semibold text-[var(--color-sage-green)] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
