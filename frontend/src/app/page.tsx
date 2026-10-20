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
  const [teaserSlider, setTeaserSlider] = useState(50);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
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
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out", delay: 0.1 }
        );
      }
    }, heroRef);

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
    <div className="min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26] overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-full">
        {/* ============================================================ */}
        {/* 1. HERO SECTION: Furniture in the Foreground (90-100vh)      */}
        {/* ============================================================ */}
        <section
          ref={heroRef}
          className="relative min-h-[calc(100vh-4.5rem)] w-full flex items-center justify-between overflow-hidden px-4 sm:px-8 lg:px-14 py-8 lg:py-12 border-b border-[#DCD6CB] bg-[#F6F3ED]"
        >
          {/* Subtle architectural ambient background tone */}
          <div className="absolute inset-0 bg-radial from-[#FCFBF8]/80 via-[#F6F3ED] to-[#E5DDD0]/50 pointer-events-none" />

          <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left 7 Columns: Hero Furniture Product (Authentic Photograph, NO UI) */}
            <div className="lg:col-span-7 relative flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-[#DCD6CB] bg-[#E5DDD0]/30 group">
                {/* Genuine furniture photograph - 70-85% visual prominence */}
                <img
                  ref={heroImageRef}
                  src="/hero_furniture.png"
                  alt="Astrid Scandinavian Lounge Chair in Daylight Interior"
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-[1.02]"
                />
                
                {/* Natural Contact Shadow Grounding Overlay */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                {/* In-Room Spatial Badge */}
                <div className="absolute top-4 left-4 bg-[#FCFBF8]/95 backdrop-blur-xs px-3 py-1.5 rounded text-[11px] font-medium text-[#292B26] border border-[#DCD6CB] flex items-center gap-2 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#42483A]" />
                  <span>Real Daylight Interior // 1:1 Metric Scale</span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Clean Editorial Headline & Shopping Actions */}
            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2 pl-0 lg:pl-2">
              <div className="space-y-3">
                <span className="text-[11px] font-accent uppercase tracking-[0.2em] text-[#8A7867] font-semibold block">
                  Spatial Discovery // Nordic Living
                </span>

                {/* Main Headline (Exact requested copy) */}
                <h1
                  ref={headlineRef}
                  className="font-serif text-4xl sm:text-5xl lg:text-[3.6rem] text-[#292B26] leading-[1.08] font-medium tracking-tight"
                >
                  Imagine it. <br />
                  <span className="italic font-normal text-[#8A7867]">Before it’s yours.</span>
                </h1>

                {/* Supporting Text (Exact requested copy) */}
                <p
                  ref={copyRef}
                  className="text-sm sm:text-base text-[#6B655C] font-body max-w-md leading-relaxed pt-1"
                >
                  Find furniture you love. Picture it in your space. Make it yours.
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
                  <Eye className="h-3.5 w-3.5 text-[#42483A]" />
                  <span>Visualize in My Room</span>
                </Link>
              </div>

              {/* Restrained Product Information Card (Bottom-Right Area) */}
              <div
                ref={productInfoRef}
                className="pt-6 border-t border-[#DCD6CB] flex items-end justify-between text-xs"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8A7867] font-accent block">
                    Featured Piece
                  </span>
                  <h3 className="font-semibold text-sm text-[#292B26] mt-0.5">
                    Astrid Sculptural Lounge Chair
                  </h3>
                  <p className="text-[11px] text-[#8A7867]">
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
                            ? "bg-[#B8795C]"
                            : color === "Sand Beige"
                            ? "bg-[#E5DDD0]"
                            : color === "Forest Charcoal"
                            ? "bg-[#292B26]"
                            : "bg-[#F6F3ED]"
                        } ${activeHeroColor === color ? "ring-2 ring-[#292B26] ring-offset-1 scale-110" : "border-[#292B26]/20 opacity-80"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-[#292B26] block">
                    $549.00
                  </span>
                  <div className="flex items-center gap-1.5 mt-2 justify-end text-[11px] font-mono text-[#8A7867]">
                    <span className="font-bold text-[#292B26]">0{activeHeroIndex}</span>
                    <span>/</span>
                    <span>04</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. SHOP BY CATEGORY                                          */}
        {/* ============================================================ */}
        <section className="py-24 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-[#DCD6CB]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8A7867] font-accent font-semibold">
                PixaBuild Collection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#292B26] mt-1 font-normal">
                Curated Furniture by Category
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-medium text-[#292B26] hover:text-[#42483A] underline underline-offset-4 flex items-center gap-1"
            >
              <span>View All 36 Pieces</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Sofas & Daybeds", cat: "Sofa", img: "/catalog/sofa_1.jpg", count: "6 designs" },
              { label: "Coffee Tables", cat: "Coffee Table", img: "/catalog/coffee_table_1.jpg", count: "6 designs" },
              { label: "Display Cabinets", cat: "Display Cabinet", img: "/catalog/display_cabinet_1.jpg", count: "6 designs" },
              { label: "Dining Chairs", cat: "Dining Chair", img: "/catalog/dining_chair_1.jpg", count: "6 designs" },
              { label: "Bedsteads & Frames", cat: "Bed Frame", img: "/catalog/bed_frame_1.jpg", count: "6 designs" },
              { label: "Atelier Work Desks", cat: "Office Desk", img: "/catalog/office_desk_1.jpg", count: "6 designs" },
            ].map((c) => (
              <Link
                key={c.cat}
                href={`/catalog?category=${encodeURIComponent(c.cat)}`}
                className="group pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-4 flex flex-col justify-between hover:shadow-md transition-all text-decoration-none"
              >
                <div className="h-28 w-full bg-[#F6F3ED] rounded flex items-center justify-center p-2 mb-3 overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.label}
                    className="max-h-24 max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#292B26] group-hover:text-[#42483A] transition-colors">
                    {c.label}
                  </h3>
                  <span className="text-[11px] text-[#8A7867]">{c.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. SELECTED PIECES (Editorial Asymmetric Grid)               */}
        {/* ============================================================ */}
        <section className="py-16 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto border-t border-[#DCD6CB]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8A7867] font-accent font-semibold">
                Signature Portfolio
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#292B26] mt-1 font-normal">
                Selected Works for Modern Spaces
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-medium text-[#292B26] hover:text-[#42483A] flex items-center gap-1"
            >
              <span>Explore Complete Catalog</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => {
              const isWishlisted = wishlist.includes(item.item_id);
              const isAdded = addedItem === item.item_id;

              return (
                <div
                  key={item.item_id}
                  className="group pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-5 flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div>
                    {/* Image Area with Quick Actions */}
                    <div className="relative aspect-[4/3] w-full rounded-lg bg-[#F6F3ED] overflow-hidden flex items-center justify-center p-4">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.item_id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-[#FCFBF8]/90 text-[#292B26] hover:bg-[#FCFBF8] shadow-xs transition-colors"
                        title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            isWishlisted
                              ? "fill-[#B8795C] text-[#B8795C]"
                              : "text-[#8A7867]"
                          }`}
                        />
                      </button>

                      {/* Dimensions Tag */}
                      <span className="absolute bottom-2 left-2 bg-[#FCFBF8]/90 text-[10px] font-mono px-2 py-0.5 rounded border border-[#DCD6CB] text-[#8A7867]">
                        {item.dimensions}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#8A7867]">
                        <span>{item.category}</span>
                        <span className="text-[10px] text-[#42483A] font-medium">In Stock</span>
                      </div>
                      <Link href={`/catalog/${item.item_id}`} className="block text-decoration-none">
                        <h3 className="text-sm font-semibold text-[#292B26] group-hover:text-[#42483A] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#6B655C] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-5 pt-3 border-t border-[#DCD6CB] flex items-center justify-between">
                    <div>
                      {item.sale_price ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold font-mono text-[#B8795C]">
                            ${item.sale_price.toFixed(2)}
                          </span>
                          <span className="text-xs line-through text-[#8A7867] font-mono">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-bold font-mono text-[#292B26]">
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
        {/* 4. VISUALIZE IN YOUR ROOM (Real Split Slider Teaser)         */}
        {/* ============================================================ */}
        <section className="py-24 px-4 sm:px-8 lg:px-14 bg-[#E5DDD0]/40 border-y border-[#DCD6CB]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 5 Cols: Editorial Narrative */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8A7867] font-accent font-semibold block">
                Spatial Studio
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#292B26] font-normal leading-tight">
                No guessing dimensions. See it seated on your floor.
              </h2>
              <p className="text-xs sm:text-sm text-[#6B655C] leading-relaxed">
                Take a photograph of your living room or study. Our spatial engine isolates your room boundaries, maps perspective depth, and casts realistic directional contact shadows so you can purchase with absolute confidence.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#42483A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#292B26]">Upload your room image</h4>
                    <p className="text-[11px] text-[#6B655C]">Snap any angle with daylight. The studio maps floor boundaries and vanishing lines.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#292B26] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#292B26]">Select any PixaBuild design</h4>
                    <p className="text-[11px] text-[#6B655C]">Choose materials, fabrics, and orientations proportioned for your floor plan.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#B8795C] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#292B26]">Harmonized spatial synthesis</h4>
                    <p className="text-[11px] text-[#6B655C]">Contact shadows and ambient room reflection balance seamlessly before you order.</p>
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

            {/* Right 7 Cols: True Split Slider with Actual Generated Composite */}
            <div className="lg:col-span-7">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-2xl border border-[#DCD6CB] bg-black/10 select-none">
                {/* Background: Original Empty Room */}
                <img
                  src="/rooms/living_01.jpg"
                  alt="Stockholm Sunlit Salon — Original Empty Room"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Foreground: Real Generated Composite with Astrid Sofa & Contact Shadows */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - teaserSlider}% 0 0)` }}
                >
                  <img
                    src="/rooms/living_01_composite.jpg"
                    alt="Stockholm Sunlit Salon with Astrid Sofa"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* Slider Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none"
                  style={{ left: `${teaserSlider}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#292B26] border-2 border-white text-white flex items-center justify-center text-[10px] font-bold shadow-md">
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
                <div className="absolute top-3 left-3 bg-[#292B26]/85 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded">
                  PixaBuild Staged
                </div>
                <div className="absolute top-3 right-3 bg-white/90 text-[#292B26] text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-[#DCD6CB]">
                  Original Space
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. SHOP BY ROOM (Authentic Interior Photography)             */}
        {/* ============================================================ */}
        <section className="py-24 px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
          <div className="mb-12 text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#8A7867] font-accent font-semibold">
              Spatial Environments
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#292B26] font-normal">
              Designed for Living, Working, and Resting
            </h2>
            <p className="text-xs text-[#6B655C]">
              Discover curated ensembles proportioned for Scandinavian and contemporary floor plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "The Living Salon",
                desc: "Low-slung modular seating with tactile linen and solid oak coffee surfaces.",
                img: "/rooms/living_01.jpg",
                href: "/rooms?room=living",
              },
              {
                title: "The Bedroom Suite",
                desc: "Upholstered winged headboards with organic cotton and underbed concealment.",
                img: "/rooms/bedroom_01.jpg",
                href: "/rooms?room=bedroom",
              },
              {
                title: "The Dining Space",
                desc: "Curved composite chairs with circular tables that foster extended gathering.",
                img: "/rooms/dining_01.jpg",
                href: "/rooms?room=dining",
              },
              {
                title: "The Modern Studio",
                desc: "Motorized sit/stand workstations and acoustic partitions for focused calm.",
                img: "/rooms/office_01.jpg",
                href: "/rooms?room=office",
              },
            ].map((room, idx) => (
              <Link
                key={idx}
                href={room.href}
                className="group relative rounded-xl overflow-hidden border border-[#DCD6CB] bg-[#FCFBF8] flex flex-col justify-between text-decoration-none"
              >
                <div className="h-48 w-full overflow-hidden bg-[#E5DDD0]">
                  <img
                    src={room.img}
                    alt={room.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-[#292B26] group-hover:text-[#42483A] transition-colors">
                    {room.title}
                  </h3>
                  <p className="text-xs text-[#6B655C] leading-relaxed mt-1">
                    {room.desc}
                  </p>
                  <span className="text-[11px] font-semibold text-[#292B26] flex items-center gap-1 mt-4">
                    Explore Room →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. MATERIAL & CRAFTSMANSHIP                                  */}
        {/* ============================================================ */}
        <section className="py-20 px-4 sm:px-8 lg:px-14 bg-[#FCFBF8] border-t border-[#DCD6CB]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-widest text-[#42483A] font-semibold">
                01 // Sourcing
              </span>
              <h3 className="font-serif text-xl text-[#292B26]">
                Sustainably Harvested Nordic Timber
              </h3>
              <p className="text-xs text-[#6B655C] leading-relaxed">
                All oak, ash, and pine components are harvested from responsibly managed Scandinavian forests adhering to strict FSC sustainability standards.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-widest text-[#42483A] font-semibold">
                02 // Textiles
              </span>
              <h3 className="font-serif text-xl text-[#292B26]">
                Heavyweight Linen & Recycled Weaves
              </h3>
              <p className="text-xs text-[#6B655C] leading-relaxed">
                Upholstery covers feature Martindale rub counts exceeding 35,000 cycles for domestic durability with removable, washable slips.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-widest text-[#42483A] font-semibold">
                03 // Spatial Fit
              </span>
              <h3 className="font-serif text-xl text-[#292B26]">
                Guaranteed Dimensional Harmony
              </h3>
              <p className="text-xs text-[#6B655C] leading-relaxed">
                Our spatial studio prevents common measurement mistakes before white-glove delivery, backed by a 30-day in-home return trial.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
