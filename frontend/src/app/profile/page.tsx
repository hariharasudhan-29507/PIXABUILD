"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Package, Heart, LogOut, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getCurrentUser, setCurrentUser, UserSession, STORAGE_KEYS } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.push("/login");
    } else {
      setUser(cur);
    }

    try {
      const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (rawOrders) setOrdersCount(JSON.parse(rawOrders).length);
      const rawWish = localStorage.getItem("pixabuild_wishlist");
      if (rawWish) setWishlistCount(JSON.parse(rawWish).length);
    } catch {}
  }, [router]);

  if (!user) return null;

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Account Profile" }]} />

        <div className="my-6 pb-4 border-b border-[var(--border-subtle)] flex items-end justify-between">
          <div>
            <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
              Customer Account
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D] mt-1">
              WELCOME, {user.first_name.toUpperCase()}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-red-700 border-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="pixa-card bg-[#FFFFFF] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#E6DFD2] text-[#30352D] flex items-center justify-center font-bold font-serif text-lg">
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#30352D]">{user.first_name} {user.last_name}</h3>
                <p className="text-xs text-[#74736B]">{user.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8C7965]">Account Type</span>
                <span className="font-semibold uppercase">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7965]">Security Status</span>
                <span className="text-[#78816A] font-semibold">Verified // Active</span>
              </div>
            </div>

            {user.role === "admin" && (
              <div className="pt-2">
                <Link href="/admin/dashboard" className="btn-primary text-xs w-full py-2 justify-center">
                  <span>Open Admin Console</span>
                </Link>
              </div>
            )}
          </div>

          {/* Orders summary */}
          <div className="pixa-card bg-[#FFFFFF] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8C7965] uppercase">
                <Package className="h-4 w-4" />
                <span>Orders Placed</span>
              </div>
              <div className="text-3xl font-bold font-serif text-[#30352D] mt-3">
                {ordersCount}
              </div>
              <p className="text-xs text-[#74736B] mt-1">
                Active freight deliveries and completed white-glove orders.
              </p>
            </div>
            <Link href="/orders" className="text-xs font-semibold text-[#78816A] hover:underline mt-4 inline-block">
              View Order History →
            </Link>
          </div>

          {/* Wishlist summary */}
          <div className="pixa-card bg-[#FFFFFF] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8C7965] uppercase">
                <Heart className="h-4 w-4" />
                <span>Saved Moodboard</span>
              </div>
              <div className="text-3xl font-bold font-serif text-[#30352D] mt-3">
                {wishlistCount}
              </div>
              <p className="text-xs text-[#74736B] mt-1">
                Scandinavian furniture pieces saved for spatial staging.
              </p>
            </div>
            <Link href="/wishlist" className="text-xs font-semibold text-[#78816A] hover:underline mt-4 inline-block">
              Open Wishlist →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
