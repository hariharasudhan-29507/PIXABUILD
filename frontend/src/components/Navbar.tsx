"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  LogOut,
  Shield,
  Menu,
  X
} from "lucide-react";
import { getCurrentUser, setCurrentUser, UserSession, STORAGE_KEYS } from "@/lib/supabase";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMegaOpen, setShopMegaOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());

    const updateCounts = () => {
      try {
        const rawCart = localStorage.getItem(STORAGE_KEYS.CART);
        const cart = rawCart ? JSON.parse(rawCart) : [];
        setCartCount(cart.reduce((sum: number, item: { quantity: number }) => sum + (item.quantity || 1), 0));

        const rawWish = localStorage.getItem("pixabuild_wishlist");
        const wish = rawWish ? JSON.parse(rawWish) : [];
        setWishlistCount(wish.length);
      } catch {
        setCartCount(0);
        setWishlistCount(0);
      }
    };

    updateCounts();
    window.addEventListener("storage", updateCounts);
    window.addEventListener("cart_updated", updateCounts);
    window.addEventListener("wishlist_updated", updateCounts);

    return () => {
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("cart_updated", updateCounts);
      window.removeEventListener("wishlist_updated", updateCounts);
    };
  }, [pathname]);

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    router.push("/login");
  };

  const navLinks = [
    { href: "/catalog", label: "Shop", hasMega: true },
    { href: "/rooms", label: "Rooms" },
    { href: "/collections", label: "Collections" },
    { href: "/inspiration", label: "Inspiration" },
    { href: "/visualize", label: "Visualize in My Room", highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[#F7F5F0]/95 backdrop-blur-md">
      {/* 1. Restrained Announcement Strip */}
      <div className="w-full bg-[#E6DFD2]/60 border-b border-[var(--border-subtle)] py-1.5 px-4 text-center">
        <p className="text-[11px] tracking-wide text-[#74736B] font-body flex items-center justify-center gap-2">
          <span>Complimentary spatial room staging with every Scandinavian order</span>
          <span className="hidden sm:inline text-[#8C7965]">•</span>
          <Link href="/visualize" className="hidden sm:inline text-[#30352D] font-medium underline underline-offset-2 hover:text-[#78816A]">
            Try Visualizer
          </Link>
        </p>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group text-decoration-none">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#30352D] text-white p-1.5 transition-transform duration-160 group-hover:scale-105">
            <img src="/logo.svg" alt="PixaBuild Logo" className="h-full w-full object-contain filter invert" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl tracking-wider text-[#30352D] leading-none">
              PIXABUILD
            </span>
            <span className="text-[9px] font-body tracking-[0.2em] text-[#8C7965] uppercase mt-0.5">
              Copenhagen // Studio
            </span>
          </div>
        </Link>

        {/* Desktop Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <div
                key={link.href}
                className="relative py-4"
                onMouseEnter={() => link.hasMega && setShopMegaOpen(true)}
                onMouseLeave={() => link.hasMega && setShopMegaOpen(false)}
              >
                <Link
                  href={link.href}
                  className={`text-[12px] font-medium tracking-wide uppercase transition-colors flex items-center gap-1 ${
                    link.highlight
                      ? "text-[#78816A] hover:text-[#5F6753] font-semibold"
                      : isActive
                      ? "text-[#30352D] font-semibold underline underline-offset-8 decoration-1 decoration-[#30352D]"
                      : "text-[#30352D]/80 hover:text-[#30352D]"
                  }`}
                >
                  {link.highlight && <Sparkles className="h-3 w-3" />}
                  <span>{link.label}</span>
                  {link.hasMega && <ChevronDown className="h-3 w-3 opacity-60" />}
                </Link>

                {/* Clean Category Mega-Menu */}
                {link.hasMega && shopMegaOpen && (
                  <div className="absolute left-0 top-full w-[480px] bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-lg p-5 shadow-xl grid grid-cols-2 gap-4 animate-in fade-in-50 duration-150">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8C7965] uppercase tracking-wider block mb-2">
                        Categories
                      </span>
                      <ul className="space-y-1.5 text-xs text-[#30352D]">
                        <li><Link href="/catalog?category=Sofa" className="hover:text-[#78816A] block py-0.5">Sofas & Loungers</Link></li>
                        <li><Link href="/catalog?category=Dining+Chair" className="hover:text-[#78816A] block py-0.5">Dining Chairs</Link></li>
                        <li><Link href="/catalog?category=Coffee+Table" className="hover:text-[#78816A] block py-0.5">Coffee & Accent Tables</Link></li>
                        <li><Link href="/catalog?category=Display+Cabinet" className="hover:text-[#78816A] block py-0.5">Cabinets & Storage</Link></li>
                        <li><Link href="/catalog?category=Bed+Frame" className="hover:text-[#78816A] block py-0.5">Bed Frames & Mattresses</Link></li>
                        <li><Link href="/catalog?category=Office+Desk" className="hover:text-[#78816A] block py-0.5">Ergonomic Workstations</Link></li>
                      </ul>
                    </div>
                    <div className="bg-[#F7F5F0] rounded p-3 flex flex-col justify-between border border-[var(--border-subtle)]">
                      <div>
                        <span className="text-[10px] font-semibold text-[#B96E4B] uppercase tracking-wider block mb-1">
                          Curated Edit
                        </span>
                        <h4 className="text-xs font-semibold text-[#30352D] leading-snug">
                          The Natural Oak Collection 2026
                        </h4>
                        <p className="text-[11px] text-[#74736B] mt-1">
                          Sustainably harvested Scandinavian timber finished in organic matte oil.
                        </p>
                      </div>
                      <Link href="/collections" className="text-[11px] font-medium text-[#78816A] hover:underline mt-2 inline-block">
                        View Editorial →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Icon Actions (Search, Account, Wishlist, Cart) */}
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            aria-label="Search furniture catalog"
            className="text-[#30352D] hover:text-[#78816A] transition-colors p-1"
          >
            <Search className="h-4 w-4 stroke-[1.5]" />
          </Link>

          <Link
            href="/wishlist"
            aria-label="Saved wishlist"
            className="relative text-[#30352D] hover:text-[#78816A] transition-colors p-1"
          >
            <Heart className="h-4 w-4 stroke-[1.5]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#B96E4B] px-0.5 text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative text-[#30352D] hover:text-[#78816A] transition-colors p-1"
          >
            <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#30352D] px-0.5 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile */}
          {user ? (
            <div className="flex items-center gap-2 border-s border-[var(--border-subtle)] ps-3">
              <Link
                href="/profile"
                className="text-xs font-medium text-[#30352D] hover:text-[#78816A] truncate max-w-[100px] hidden md:inline"
              >
                {user.first_name}
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  title="Admin Dashboard"
                  className="p-1 rounded bg-[#E6DFD2] text-[#B96E4B] hover:bg-[#E6DFD2]/80"
                >
                  <Shield className="h-3.5 w-3.5 stroke-[1.75]" />
                </Link>
              )}
              <button
                onClick={handleLogout}
                title="Sign out"
                className="text-[#74736B] hover:text-[#30352D] p-1"
              >
                <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="text-[#30352D] hover:text-[#78816A] transition-colors p-1"
            >
              <User className="h-4 w-4 stroke-[1.5]" />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#30352D] p-1"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F7F5F0] border-b border-[var(--border-subtle)] px-4 py-4 space-y-3">
          <Link href="/catalog" onClick={() => setMobileMenuOpen(false)} className="block text-xs uppercase font-medium py-1.5 text-[#30352D]">
            Shop All Catalog
          </Link>
          <Link href="/rooms" onClick={() => setMobileMenuOpen(false)} className="block text-xs uppercase font-medium py-1.5 text-[#30352D]">
            Shop by Rooms
          </Link>
          <Link href="/collections" onClick={() => setMobileMenuOpen(false)} className="block text-xs uppercase font-medium py-1.5 text-[#30352D]">
            Editorial Collections
          </Link>
          <Link href="/inspiration" onClick={() => setMobileMenuOpen(false)} className="block text-xs uppercase font-medium py-1.5 text-[#30352D]">
            Design Inspiration
          </Link>
          <Link href="/visualize" onClick={() => setMobileMenuOpen(false)} className="block text-xs uppercase font-semibold py-1.5 text-[#78816A] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Visualize in My Room</span>
          </Link>
        </div>
      )}
    </header>
  );
}
