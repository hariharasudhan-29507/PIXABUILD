"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Layers,
  ArrowLeft,
  ShieldAlert,
  Sliders
} from "lucide-react";
import { getCurrentUser, UserSession } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    if (!cur || cur.role !== "admin") {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-xs text-[var(--color-muted-taupe)]">
        Verifying Administrative Access...
      </div>
    );
  }

  const adminTabs = [
    { href: "/admin/dashboard", label: "Analytics", icon: LayoutDashboard },
    { href: "/admin/catalog", label: "Catalog", icon: Layers },
    { href: "/admin/orders", label: "Orders", icon: Sliders },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/activity", label: "Activity Stream", icon: Activity },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <div className="border-b border-[var(--border-subtle)] bg-[var(--color-sand-beige)]">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-terracotta)] text-white text-xs font-bold">
              A
            </span>
            <span className="font-heading text-sm text-[var(--color-forest-charcoal)] tracking-wide">
              PIXABUILD OBSERVABILITY CONSOLE
            </span>
            <span className="text-[10px] bg-[var(--color-warm-ivory)] px-2 py-0.5 rounded text-[var(--color-muted-taupe)] font-mono border border-[var(--border-subtle)]">
              db: public
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-forest-charcoal)] text-white"
                      : "text-[var(--color-forest-charcoal)]/80 hover:bg-[var(--color-warm-ivory)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
