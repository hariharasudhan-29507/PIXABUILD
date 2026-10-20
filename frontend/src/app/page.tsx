"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Eye,
  ShoppingBag,
  Heart,
  Layers,
  Compass,
  Check,
  ShieldCheck,
  ChevronRight,
  Maximize2
} from "lucide-react";
import gsap from "gsap";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { getRecommendations, RecommendationResult } from "@/lib/recommendation";
import { getSearchHistory, STORAGE_KEYS, recordActivity } from "@/lib/supabase";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const productInfoRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);

  const [activeHeroColor, setActiveHeroColor] = useState("Terracotta");
  const [activeHeroIndex, setActiveHeroIndex] = useState(1);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Before/after teaser slider position
  const [teaserSlider, setTeaserSlider] = useState(52);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Subtle headline fade up
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", delay: 0.15 }
        );
      }
      if (copyRef.current) {
        gsap.fromTo(
          copyRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 1.0, ease: "power3.out", delay: 0.3 }
        );
      }
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.45 }
        );
      }
      if (productInfoRef.current) {
        gsap.fromTo(
          productInfoRef.current,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 1.0, ease: "power3.out", delay: 0.6 }
        );
      }
      if (heroImageRef.current) {
        gsap.fromTo(
          heroImageRef.current,
          { opacity: 0, scale: 0.97 },
          { opacity: 1, scale: 1, duration: 1.3, ease: "power2.out", delay: 0.1 }
        );
      }
    }, heroRef);

    // Load recommendations & wishlist
    const history = getSearchHistory();
    setRecommendations(getRecommendations(history, [], undefined, 4));

    try {
      const rawWish = localStorage.getItem("pixabuild_wishlist");
      if (rawWish) setWishlist(JSON.parse(rawWish));
    } catch {
      setWishlist([]);
    }

    return () => ctx.revert();
  }, []);

  const toggleWishlist = (itemId: string) => {
    let updated: string[];
    if (wishlist.includes(itemId)) {
      updated = wishlist.filter((id) => id !== itemId);
    } else {
      updated = [...wishlist, itemId];
    }
    setWishlist(updated);
    localStorage.setItem("pixabuild_wishlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("wishlist_updated"));
    recordActivity("WISHLIST_TOGGLED", { itemId });
  };

  const handleAddToCart = (item: FurnitureItem) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      const cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c: { item_id: string }) => c.item_id === item.item_id);

      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({
          cart_id: "cart-" + Date.now(),
          item_id: item.item_id,
          name: item.name,
          price: item.sale_price || item.price,
          quantity: 1,
          image_url: item.image_url,
          color: item.color,
        });
      }
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));
      recordActivity("ADDED_TO_CART", { item_id: item.item_id, name: item.name });

      setAddedItem(item.item_id);
      setTimeout(() => setAddedItem(null), 1800);
    } catch (err) {
      console.error(err);
    }
  };

  const featuredItems = FURNITURE_CATALOG.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D] overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-full">
        {/* ============================================================ */}
        {/* 1. HERO SECTION: Minimalist Scandinavian Luxury (90-100vh) */}
        {/* ============================================================ */}
        <section
          ref={heroRef}
          className="relative min-h-[calc(100vh-5rem)] w-full flex items-center justify-between overflow-hidden px-4 sm:px-8 lg:px-14 py-12 border-b border-[var(--border-subtle)] bg-[#F7F5F0]"
        >
          {/* Subtle architectural ambient background tone */}
          <div className="absolute inset-0 bg-radial from-[#FFFFFF]/70 via-[#F7F5F0] to-[#EAE5DC]/60 pointer-events-none" />

          <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left 7 Columns: Hero Furniture Product (60-70% visual focus) */}
            <div className="lg:col-span-7 relative flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)] bg-[#EAE5DC]/40">
                <img
                  ref={heroImageRef}
                  src="/hero_furniture.png"
                  alt="Scandinavian Armchair in Architectural Daylight Interior"
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-[1.02]"
                />
                {/* Natural Contact Shadow Grounding Overlay */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

                {/* Subtle In-Room Badge */}
                <div className="absolute top-4 left-4 bg-[#FFFFFF]/90 backdrop-blur-xs px-3 py-1 rounded text-[11px] font-medium text-[#30352D] border border-[var(--border-subtle)] flex items-center gap-1.5 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#78816A]" />
                  <span>Real Daylight Interior // 1:1 Metric Scale</span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Clean Editorial Headline & Shopping Actions */}
            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2 pl-0 lg:pl-4">
              <div className="space-y-3">
                <span className="text-[11px] font-accent uppercase tracking-[0.2em] text-[#8C7965] font-semibold block">
                  Spatial Discovery // Scandinavian Living
                </span>

                {/* Main Headline (Exact requested copy) */}
                <h1
                  ref={headlineRef}
                  className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] text-[#30352D] leading-[1.08] font-medium tracking-tight"
                >
                  Imagine it. <br />
                  <span className="italic font-normal text-[#8C7965]">Before it’s yours.</span>
                </h1>

                {/* Supporting Text (Exact requested copy) */}
                <p
                  ref={copyRef}
                  className="text-sm sm:text-base text-[#74736B] font-body max-w-md leading-relaxed pt-1"
                >
                  Explore furniture, picture it in your space, and make your choice with confidence — right from where you shop.
                </p>
              </div>

              {/* Two Direct CTAs (Exact requested buttons) */}
              <div ref={ctaRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="btn-primary text-xs py-3 px-6 text-center justify-center"
                >
                  <span>Explore Furniture</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/visualize"
                  className="btn-secondary text-xs py-3 px-6 text-center justify-center flex items-center gap-2"
                >
                  <Eye className="h-3.5 w-3.5 text-[#78816A]" />
                  <span>Visualize in My Room</span>
                </Link>
              </div>

              {/* Restrained Product Information Card (Bottom-Right Area) */}
              <div
                ref={productInfoRef}
                className="pt-6 border-t border-[var(--border-subtle)] flex items-end justify-between text-xs"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7965] font-accent block">
                    Featured Piece
                  </span>
                  <h3 className="font-semibold text-sm text-[#30352D] mt-0.5">
                    HEDMAN Lounge Chair
                  </h3>
                  <p className="text-[11px] text-[#74736B]">
                    Natural European Oak & Wool Bouclé
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {["Terracotta", "Sand Beige", "Forest Charcoal", "Warm Ivory"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setActiveHeroColor(color)}
                        title={color}
                        className={`h-4 w-4 rounded-full border transition-all ${
                          color === "Terracotta"
                            ? "bg-[#B96E4B]"
                            : color === "Sand Beige"
                            ? "bg-[#E6DFD2]"
                            : color === "Forest Charcoal"
                            ? "bg-[#30352D]"
                            : "bg-[#F7F5F0]"
                        } ${activeHeroColor === color ? "ring-2 ring-[#30352D] ring-offset-1 scale-110" : "border-[#30352D]/20 opacity-80"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-[#30352D] block">
                    $549.00
                  </span>
                  {/* Product Indicator: 01 / 04 */}
                  <div className="flex items-center gap-1.5 mt-2 justify-end text-[11px] font-mono text-[#8C7965]">
                    <span className="font-bold text-[#30352D]">0{activeHeroIndex}</span>
                    <span>/</span>
                    <span>04</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. SHOP BY CATEGORY (Generous Spacing, Clean Alignment)     */}
        {/* ============================================================ */}
        <section className="py-24 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7965] font-accent font-semibold">
                Architectural Catalog
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#30352D] mt-1 font-normal">
                Shop by Furniture Category
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-medium text-[#30352D] hover:text-[#78816A] underline underline-offset-4 flex items-center gap-1"
            >
              <span>View All 36 Pieces</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Sofas & Loungers", cat: "Sofa", img: "/ikea_catalog/sofa_1.jpg", count: "6 designs" },
              { label: "Coffee Tables", cat: "Coffee Table", img: "/ikea_catalog/coffee_table_1.jpg", count: "6 designs" },
              { label: "Display Cabinets", cat: "Display Cabinet", img: "/ikea_catalog/display_cabinet_1.jpg", count: "4 designs" },
              { label: "Dining Chairs", cat: "Dining Chair", img: "/ikea_catalog/dining_chair_1.jpg", count: "6 designs" },
              { label: "Bed Frames", cat: "Bed Frame", img: "/ikea_catalog/bed_frame_1.jpg", count: "6 designs" },
              { label: "Work Desks", cat: "Office Desk", img: "/ikea_catalog/office_desk_1.jpg", count: "4 designs" },
            ].map((c) => (
              <Link
                key={c.cat}
                href={`/catalog?category=${encodeURIComponent(c.cat)}`}
                className="group pixa-card bg-[#FFFFFF] border-[var(--border-subtle)] p-4 flex flex-col justify-between hover:shadow-md transition-all text-decoration-none"
              >
                <div className="h-28 w-full bg-[#F7F5F0] rounded flex items-center justify-center p-2 mb-3 overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.label}
                    className="max-h-24 max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#30352D] group-hover:text-[#78816A] transition-colors">
                    {c.label}
                  </h3>
                  <span className="text-[10px] text-[#8C7965] font-body block mt-0.5">
                    {c.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. SELECTED FURNITURE (Editorial Product Grid)               */}
        {/* ============================================================ */}
        <section className="py-16 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7965] font-accent font-semibold">
                Curated Selection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#30352D] mt-1 font-normal">
                Featured Scandinavian Pieces
              </h2>
            </div>
            <p className="text-xs text-[#74736B] max-w-sm">
              Each piece has verified 3D depth parameters ready for real-time room staging.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => {
              const isWish = wishlist.includes(item.item_id);
              const isAdded = addedItem === item.item_id;

              return (
                <div
                  key={item.item_id}
                  className="bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-lg p-5 flex flex-col justify-between group transition-all duration-200 hover:border-[#30352D]/30 hover:shadow-sm"
                >
                  <div>
                    {/* Image Area with Actions */}
                    <div className="relative h-60 w-full rounded bg-[#F7F5F0] overflow-hidden flex items-center justify-center p-4">
                      <Link href={`/catalog/${item.item_id}`} className="w-full h-full flex items-center justify-center">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="max-h-52 max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.item_id)}
                        aria-label="Save to wishlist"
                        className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${
                          isWish
                            ? "bg-[#B96E4B] text-white border-[#B96E4B]"
                            : "bg-[#FFFFFF]/90 text-[#30352D] border-[var(--border-subtle)] hover:text-[#B96E4B]"
                        }`}
                      >
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </button>

                      {item.is_sale && (
                        <span className="absolute top-3 left-3 bg-[#B96E4B] text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
                          Sale
                        </span>
                      )}

                      <span className="absolute bottom-2.5 right-2.5 bg-[#FFFFFF]/85 text-[#74736B] text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                        {item.dimensions}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#8C7965]">
                        <span>{item.category}</span>
                        <span className="text-[10px] text-[#78816A] font-medium">In Stock</span>
                      </div>
                      <Link href={`/catalog/${item.item_id}`} className="block text-decoration-none">
                        <h3 className="text-sm font-semibold text-[#30352D] group-hover:text-[#78816A] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#74736B] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      {item.sale_price ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold font-mono text-[#B96E4B]">
                            ${item.sale_price.toFixed(2)}
                          </span>
                          <span className="text-xs line-through text-[#8C7965] font-mono">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-bold font-mono text-[#30352D]">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/visualize?item=${item.item_id}`}
                        className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Visualize</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="btn-primary text-[11px] py-1.5 px-2.5 flex items-center gap-1"
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3 w-3 text-white" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-3 w-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. VISUALIZE IN YOUR ROOM (Signature Teaser with Slider)     */}
        {/* ============================================================ */}
        <section className="py-24 px-4 sm:px-8 lg:px-14 bg-[#EAE5DC]/50 border-y border-[var(--border-subtle)]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 5 Cols: Editorial Narrative */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7965] font-accent font-semibold block">
                Signature Innovation
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#30352D] font-normal leading-tight">
                No guessing dimensions. See it seated on your floor.
              </h2>
              <p className="text-xs sm:text-sm text-[#74736B] leading-relaxed">
                Take a photograph of your living room or study. Our neural pipeline uses Meta&apos;s Segment Anything Model (SAM) to isolate your floor boundaries and Depth Anything V2 to ensure furniture is scaled with metric perspective.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#78816A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#30352D]">Upload your room image</h4>
                    <p className="text-[11px] text-[#74736B]">Snap any angle with daylight. Our pipeline maps the room&apos;s spatial vanishing points.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#30352D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#30352D]">Select any IKEA catalog piece</h4>
                    <p className="text-[11px] text-[#74736B]">Choose materials, fabrics, and orientations that harmonize with your existing decor.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#B96E4B] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#30352D]">Photorealistic synthesis & purchase</h4>
                    <p className="text-[11px] text-[#74736B]">Contact shadows and directional lighting are balanced before you order.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Link href="/visualize" className="btn-primary text-xs py-3 px-6 inline-flex">
                  <span>Open Room Visualizer Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 7 Cols: Interactive Before / After Split Slider Teaser */}
            <div className="lg:col-span-7">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-xl border border-[var(--border-subtle)] bg-black/10 select-none">
                {/* Background: Original Room */}
                <img
                  src="/sample_rooms/sample_room_1.jpg"
                  alt="Original Empty Room"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Foreground: Placed Furniture with Clip Path */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - teaserSlider}% 0 0)` }}
                >
                  <img
                    src="/sample_rooms/sample_room_1.jpg"
                    alt="Room with Furniture"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Furniture Placed with Natural Ambient Shadow */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 pointer-events-none flex flex-col items-center">
                    <img
                      src="/ikea_catalog/sofa_1.jpg"
                      alt="Placed KIVIK Sofa"
                      className="max-h-40 drop-shadow-2xl object-contain"
                    />
                    <div className="w-56 h-4 bg-black/45 blur-md rounded-full -mt-2" />
                  </div>
                </div>

                {/* Slider Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none"
                  style={{ left: `${teaserSlider}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#30352D] border-2 border-white text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                    ⇄
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={teaserSlider}
                  onChange={(e) => setTeaserSlider(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                />

                {/* Floating Labels */}
                <div className="absolute top-3 left-3 bg-[#30352D]/80 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded">
                  PixaBuild Staged
                </div>
                <div className="absolute top-3 right-3 bg-white/85 text-[#30352D] text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-[var(--border-subtle)]">
                  Original Space
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. SHOP BY ROOM (Editorial Inspiration)                      */}
        {/* ============================================================ */}
        <section className="py-24 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
          <div className="mb-12 text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7965] font-accent font-semibold">
              Spatial Environments
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#30352D] font-normal">
              Designed for Living, Working, and Resting
            </h2>
            <p className="text-xs text-[#74736B]">
              Discover curated ensembles proportioned for European and contemporary floor plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "The Living Room",
                desc: "Low-slung modular seating with tactile linen and solid oak coffee surfaces.",
                img: "/sample_rooms/sample_room_1.jpg",
                href: "/rooms?room=living",
              },
              {
                title: "The Bedroom Retreat",
                desc: "Upholstered winged headboards with organic cotton and underbed concealment.",
                img: "/sample_rooms/sample_room_2.jpg",
                href: "/rooms?room=bedroom",
              },
              {
                title: "The Dining Space",
                desc: "Curved composite chairs with circular tables that foster extended gathering.",
                img: "/sample_rooms/sample_room_3.jpg",
                href: "/rooms?room=dining",
              },
              {
                title: "The Modern Studio",
                desc: "Motorized sit/stand workstations and acoustic partitions for focused calm.",
                img: "/hero_furniture.png",
                href: "/rooms?room=office",
              },
            ].map((room, idx) => (
              <Link
                key={idx}
                href={room.href}
                className="group relative rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[#FFFFFF] flex flex-col justify-between text-decoration-none"
              >
                <div className="h-48 w-full overflow-hidden bg-[#EAE5DC]">
                  <img
                    src={room.img}
                    alt={room.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-[#30352D] group-hover:text-[#78816A] transition-colors">
                    {room.title}
                  </h3>
                  <p className="text-xs text-[#74736B] leading-relaxed mt-1">
                    {room.desc}
                  </p>
                  <span className="text-[11px] font-semibold text-[#30352D] flex items-center gap-1 mt-4">
                    Explore Room →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. MATERIAL & CRAFTSMANSHIP (Editorial Details)             */}
        {/* ============================================================ */}
        <section className="py-20 px-4 sm:px-8 lg:px-14 bg-[#FFFFFF] border-t border-[var(--border-subtle)]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-widest text-[#78816A] font-semibold">
                01 // Sourcing
              </span>
              <h3 className="font-serif text-xl text-[#30352D]">
                Sustainably Harvested Nordic Timber
              </h3>
              <p className="text-xs text-[#74736B] leading-relaxed">
                All oak, ash, and beech components are sourced from responsibly managed forests adhering to FSC guidelines, air-dried for structural stability.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-widest text-[#78816A] font-semibold">
                02 // Textiles
              </span>
              <h3 className="font-serif text-xl text-[#30352D]">
                Heavyweight Linen & Recycled Weaves
              </h3>
              <p className="text-xs text-[#74736B] leading-relaxed">
                Upholstery covers feature Martindale rub counts exceeding 35,000 cycles for domestic durability with removable, washable slips.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-widest text-[#78816A] font-semibold">
                03 // Spatial Fit
              </span>
              <h3 className="font-serif text-xl text-[#30352D]">
                Guaranteed Dimensional Harmony
              </h3>
              <p className="text-xs text-[#74736B] leading-relaxed">
                Our AI visualizer prevents common measurement mistakes before the freight truck departs, with free in-home returns if the fit is imperfect.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
