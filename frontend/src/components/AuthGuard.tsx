"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, ShieldAlert, User, AlertOctagon } from "lucide-react";
import { getCurrentUser, UserSession } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading" | "authorized" | "unauthenticated" | "locked" | "forbidden">("loading");

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      setAuthStatus("unauthenticated");
      const redirectTimer = setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }, 900);
      return () => clearTimeout(redirectTimer);
    }

    // Role & Status checks as specified in Chapters 3.2.1, 3.7.5 and 4.7
    if (user.status === "locked") {
      setAuthStatus("locked");
      return;
    }

    if (pathname.startsWith("/admin") && user.role !== "admin") {
      setAuthStatus("forbidden");
      return;
    }

    setAuthStatus("authorized");
  }, [pathname, router]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F6F3ED]">
        <div className="h-10 w-10 rounded-full border-2 border-[#DCD6CB] border-t-[#292B26] animate-spin mb-3"></div>
        <span className="text-xs text-[#8A7867] tracking-widest uppercase font-medium">Verifying Session</span>
      </div>
    );
  }

  // Case 1: Account is locked by admin
  if (authStatus === "locked") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F6F3ED]">
        <div className="max-w-md w-full text-center space-y-6 pixa-card bg-[#FCFBF8] p-8 border-red-200 shadow-lg rounded-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
            <Lock className="h-7 w-7 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#292B26]">Account Access Suspended</h2>
            <p className="text-xs text-[#6B655C]">
              Your account has been locked by a store administrator. Commercial transactions and spatial rendering are temporarily disabled.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/contact"
              className="btn-primary text-xs py-3 w-full justify-center flex items-center gap-2 bg-red-700 hover:bg-red-800"
            >
              <span>Contact Store Administration</span>
            </Link>
            <Link
              href="/login"
              className="btn-secondary text-xs py-3 w-full justify-center bg-transparent border border-[#DCD6CB] hover:bg-[#F0ECE1]"
            >
              <span>Switch Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Ordinary user trying to access admin view
  if (authStatus === "forbidden") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F6F3ED]">
        <div className="max-w-md w-full text-center space-y-6 pixa-card bg-[#FCFBF8] p-8 border-amber-200 shadow-lg rounded-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldAlert className="h-7 w-7 text-amber-700" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#292B26]">Administrative Privileges Required</h2>
            <p className="text-xs text-[#6B655C]">
              This telemetry console requires verified administrative credentials. You are signed in as an authenticated store customer.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/catalog"
              className="btn-primary text-xs py-3 w-full justify-center flex items-center gap-2"
            >
              <span>Return to Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Unauthenticated visitor
  if (authStatus === "unauthenticated") {
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
