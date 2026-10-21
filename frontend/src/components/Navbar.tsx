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
  LogOut,
  Shield,
  Menu,
  X
} from "lucide-react";
import { getCurrentUser, signOutFromSupabase, UserSession, STORAGE_KEYS } from "@/lib/supabase";

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

  const handleLogout = async () => {
    await signOutFromSupabase();
    setUser(null);
    router.push("/login");
  };

  const getProtectedHref = (href: string) => {
    if (!user && href !== "/") {
      return `/login?redirect=${encodeURIComponent(href)}`;
    }
    return href;
  };

  const navLinks = [
    { href: "/catalog", label: "Shop", hasMega: true },
    { href: "/collections", label: "Collections" },
    { href: "/visualize", label: "Visualize" },
  ];

  const isHero = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent border-none">
      {/* Main Navigation Bar - Spreading end-to-end with 0% opacity background all time */}
      <div className="w-full flex h-18 items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* Brand Logo with Bodoni Moda font for PIXABUILD - Ivory on hero, dark brand color on all other pages */}
        <Link href="/" className="flex items-center gap-3 group text-decoration-none py-1">
          <svg
            viewBox="0 0 295 300"
            className={`h-9 w-9 transition-colors duration-200 group-hover:scale-105 shrink-0 ${
              isHero ? "text-[#F6F3ED]" : "text-[#42483A]"
            }`}
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
          <span
            className={`font-brand text-2xl sm:text-3xl tracking-[0.16em] leading-none uppercase transition-colors duration-200 ${
              isHero ? "text-[#F6F3ED]" : "text-[#42483A]"
            }`}
          >
            PIXABUILD
          </span>
        </Link>

        {/* Desktop Primary Navigation & Actions - Hidden on Sign In / Register pages */}
        {!isAuthPage && (
          <>
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const targetHref = getProtectedHref(link.href);

            return (
              <div
                key={link.href}
                className="relative py-4"
                onMouseEnter={() => link.hasMega && user && setShopMegaOpen(true)}
                onMouseLeave={() => link.hasMega && setShopMegaOpen(false)}
              >
                <Link
                  href={targetHref}
                  className={`text-[14px] sm:text-[15px] font-semibold tracking-[0.12em] uppercase transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "text-[#42483A] underline underline-offset-8 decoration-2 decoration-[#42483A]"
                      : "text-[#42483A] hover:text-[#2E3328]"
                  }`}
                >
                  <span>{link.label}</span>
                </Link>

                {/* Category Menu (Spanned across with increased size, curated edit removed) */}
                {link.hasMega && shopMegaOpen && user && (
                  <div className="absolute left-0 top-full w-[380px] sm:w-[440px] bg-[#FFFFFF] border border-[#DCD6CB] rounded-2xl p-6 shadow-2xl animate-in fade-in-50 duration-150">
                    <span className="text-[11px] font-semibold text-[#8C7965] uppercase tracking-[0.16em] block mb-3.5">
                      Categories
                    </span>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm text-[#30352D]">
                      <li><Link href="/catalog?category=Sofa" className="hover:text-[#42483A] font-medium block py-0.5 transition-colors">Sofas & Loungers</Link></li>
                      <li><Link href="/catalog?category=Dining+Chair" className="hover:text-[#42483A] font-medium block py-0.5 transition-colors">Dining Chairs</Link></li>
                      <li><Link href="/catalog?category=Coffee+Table" className="hover:text-[#42483A] font-medium block py-0.5 transition-colors">Coffee & Accent Tables</Link></li>
                      <li><Link href="/catalog?category=Display+Cabinet" className="hover:text-[#42483A] font-medium block py-0.5 transition-colors">Cabinets & Storage</Link></li>
                      <li><Link href="/catalog?category=Bed+Frame" className="hover:text-[#42483A] font-medium block py-0.5 transition-colors">Bed Frames & Mattresses</Link></li>
                      <li><Link href="/catalog?category=Office+Desk" className="hover:text-[#42483A] font-medium block py-0.5 transition-colors">Ergonomic Workstations</Link></li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Icon Actions (Dark brand color icons & pseudo glassmorphic Ivory Sign In) */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              if (pathname === "/catalog") {
                const input = document.getElementById("catalog-search-input") as HTMLInputElement | null;
                if (input) {
                  input.focus();
                  input.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              } else {
                router.push("/catalog?focusSearch=true");
              }
            }}
            aria-label="Search furniture catalog"
            className="flex items-center justify-center h-8 w-8 text-[#42483A] hover:text-[#5F6753] transition-colors"
          >
            <Search className="h-5 w-5 stroke-[1.75]" />
          </button>

          <Link
            href={getProtectedHref("/wishlist")}
            aria-label="Saved wishlist"
            className="relative flex items-center justify-center h-8 w-8 text-[#42483A] hover:text-[#5F6753] transition-colors"
          >
            <Heart className="h-5 w-5 stroke-[1.75]" />
            {wishlistCount > 0 && user && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B96E4B] px-0.5 text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href={getProtectedHref("/cart")}
            aria-label="Cart"
            className="relative flex items-center justify-center h-8 w-8 text-[#42483A] hover:text-[#5F6753] transition-colors"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.75]" />
            {cartCount > 0 && user && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#30352D] px-0.5 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile */}
          {user ? (
            <div className="flex items-center gap-2 border-s border-[#42483A]/20 ps-3">
              <Link
                href="/profile"
                className="text-xs font-medium text-[#42483A] hover:text-[#5F6753] truncate max-w-[100px] hidden md:inline"
              >
                {user.first_name}
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  title="Admin Dashboard"
                  className="p-1 rounded bg-[#E6DFD2] text-[#B96E4B] hover:bg-[#E6DFD2]/80"
                >
                  <Shield className="h-4 w-4 stroke-[1.75]" />
                </Link>
              )}
              <button
                onClick={handleLogout}
                title="Sign out"
                className="text-[#42483A] hover:text-[#5F6753] p-1"
              >
                <LogOut className="h-4.5 w-4.5 stroke-[1.75]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                aria-label="Sign in"
                className="text-[#42483A] hover:text-[#5F6753] transition-colors p-1"
              >
                <User className="h-5 w-5 stroke-[1.75]" />
              </Link>
              <Link
                href="/login"
                className="text-xs font-semibold px-4 py-2 rounded-full bg-[#42483A]/15 hover:bg-[#42483A]/25 active:bg-[#42483A]/30 backdrop-blur-md border border-[#42483A]/30 hover:border-[#42483A]/50 text-[#42483A] transition-all duration-200 hidden sm:inline-block"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#42483A] p-1"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 stroke-[1.75]" /> : <Menu className="h-6 w-6 stroke-[1.75]" />}
          </button>
        </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Menu - Only Shop, Collections, Visualize (Hidden on auth pages) */}
      {!isAuthPage && mobileMenuOpen && (
        <div className="lg:hidden bg-[#1D1F1C]/95 backdrop-blur-md border-b border-white/10 px-6 py-5 space-y-3">
          <Link href={getProtectedHref("/catalog")} onClick={() => setMobileMenuOpen(false)} className="block text-sm uppercase tracking-widest font-semibold py-1.5 text-[#F6F3ED]">
            Shop
          </Link>
          <Link href={getProtectedHref("/collections")} onClick={() => setMobileMenuOpen(false)} className="block text-sm uppercase tracking-widest font-semibold py-1.5 text-[#F6F3ED]">
            Collections
          </Link>
          <Link href={getProtectedHref("/visualize")} onClick={() => setMobileMenuOpen(false)} className="block text-sm uppercase tracking-widest font-semibold py-1.5 text-[#F6F3ED]">
            Visualize
          </Link>
          {!user && (
            <div className="pt-3 border-t border-white/15 flex gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn-primary text-xs py-2 px-4 flex-1 text-center bg-[#42483A] text-white">
                Sign In
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-secondary text-xs py-2 px-4 flex-1 text-center border-white/30 text-[#F6F3ED]">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
