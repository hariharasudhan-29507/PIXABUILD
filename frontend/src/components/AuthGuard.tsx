"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck, User } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setAuthorized(false);
      const redirectTimer = setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }, 700);
      return () => clearTimeout(redirectTimer);
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (authorized === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F6F3ED]">
        <div className="h-10 w-10 rounded-full border-2 border-[#DCD6CB] border-t-[#292B26] animate-spin mb-3"></div>
        <span className="text-xs text-[#8A7867] tracking-widest uppercase font-medium">Loading</span>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F6F3ED]">
        <div className="max-w-md w-full text-center space-y-6 pixa-card bg-[#FCFBF8] p-8 border-[#DCD6CB] shadow-lg rounded-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E5DDD0] text-[#292B26]">
            <User className="h-6 w-6 fill-[#292B26] text-[#292B26]" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#292B26]">Sign in required</h2>
            <p className="text-xs text-[#6B655C]">
              Already have an account? Step right in. New here? Make yourself at home.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="btn-primary text-xs py-3 w-full justify-center flex items-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(pathname)}`}
              className="btn-secondary text-xs py-3 w-full justify-center bg-transparent border border-[#DCD6CB] hover:bg-[#F0ECE1]"
            >
              <span>Register</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
