"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Eye,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Ruler,
  ChevronRight,
  ArrowLeft,
  Box,
  Compass,
  Layers
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { STORAGE_KEYS, recordActivity } from "@/lib/supabase";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [item, setItem] = useState<FurnitureItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isWish, setIsWish] = useState(false);
  const [added, setAdded] = useState(false);

  // View mode: Studio Photo or Interactive 3D Orbit
  const [viewMode, setViewMode] = useState<"photo" | "3d">("photo");
  const [orbitRotX, setOrbitRotX] = useState(-5);
  const [orbitRotY, setOrbitRotY] = useState(10);
  const [isDragging3D, setIsDragging3D] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const found = FURNITURE_CATALOG.find((f) => f.item_id === unwrappedParams.id) || FURNITURE_CATALOG[0];
    setItem(found);
    setSelectedColor(found.color);

    try {
      const rawWish = localStorage.getItem("pixabuild_wishlist");
      if (rawWish) {
        const wishList = JSON.parse(rawWish);
        setIsWish(wishList.includes(found.item_id));
      }
    } catch {}

    recordActivity("VIEWED_PRODUCT_DETAIL", { item_id: found.item_id, name: found.name });
  }, [unwrappedParams.id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#F6F3ED] flex items-center justify-center text-xs text-[#8A7867]">
        Loading Product Specifications...
      </div>
    );
  }

  const toggleWish = () => {
    try {
      const rawWish = localStorage.getItem("pixabuild_wishlist");
      let list = rawWish ? JSON.parse(rawWish) : [];
      if (isWish) {
        list = list.filter((id: string) => id !== item.item_id);
        setIsWish(false);
      } else {
        list.push(item.item_id);
        setIsWish(true);
      }
      localStorage.setItem("pixabuild_wishlist", JSON.stringify(list));
      window.dispatchEvent(new Event("wishlist_updated"));
    } catch {}
  };

  const handleAddToCart = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      const cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c: { item_id: string }) => c.item_id === item.item_id);

      if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
      } else {
        cart.push({
          cart_id: "cart-" + Date.now(),
          item_id: item.item_id,
          name: item.name,
          price: item.sale_price || item.price,
          quantity,
          image_url: item.image_url,
          color: selectedColor || item.color,
        });
      }

      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));
      recordActivity("ADDED_TO_CART", { item_id: item.item_id, name: item.name, quantity });

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // 3D Pointer Orbit Handling
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging3D(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging3D) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOrbitRotY((prev) => Math.min(45, Math.max(-45, prev + dx * 0.4)));
    setOrbitRotX((prev) => Math.min(25, Math.max(-25, prev - dy * 0.3)));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging3D(false);
  };

  const relatedItems = FURNITURE_CATALOG.filter(
    (f) => f.category === item.category && f.item_id !== item.item_id
  ).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: "Catalog", href: "/catalog" },
            { label: item.category, href: `/catalog?category=${encodeURIComponent(item.category)}` },
            { label: item.name },
          ]}
        />

        {/* Back Link */}
        <div className="mt-4">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-xs text-[#8A7867] hover:text-[#292B26] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Curated Collection</span>
          </Link>
        </div>

        {/* Product Layout Grid: Left Gallery (7 cols), Right Purchase Info (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
          {/* Left Gallery & Interactive 3D Mode */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FCFBF8] border border-[#DCD6CB] p-6 flex items-center justify-center select-none shadow-sm">
              {/* Studio / 3D Mode Tabs */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-[#F6F3ED]/90 backdrop-blur-xs p-1 rounded-lg border border-[#DCD6CB] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("photo")}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    viewMode === "photo"
                      ? "bg-[#292B26] text-white"
                      : "text-[#292B26] hover:bg-[#E5DDD0]"
                  }`}
                >
                  Studio Photo
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === "3d"
                      ? "bg-[#292B26] text-white"
                      : "text-[#292B26] hover:bg-[#E5DDD0]"
                  }`}
                >
                  <Box className="h-3 w-3 text-[#42483A]" />
                  <span>3D Spatial Orbit</span>
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={toggleWish}
                className={`absolute top-4 right-4 z-10 p-2.5 rounded-full border transition-colors ${
                  isWish
                    ? "bg-[#B8795C] text-white border-[#B8795C]"
                    : "bg-[#FCFBF8] text-[#292B26] border-[#DCD6CB] hover:text-[#B8795C]"
                }`}
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>

              {/* Viewport Content */}
              {viewMode === "photo" ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="max-h-[380px] max-w-full object-contain"
                />
              ) : (
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing perspective-[1000px]"
                >
                  <div
                    style={{
                      transform: `rotateX(${orbitRotX}deg) rotateY(${orbitRotY}deg)`,
                      transition: isDragging3D ? "none" : "transform 0.4s ease-out",
                    }}
                    className="relative flex flex-col items-center"
                  >
                    <img
                      src={item.cutout_url || item.image_url}
                      alt={`${item.name} 3D View`}
                      className="max-h-[340px] max-w-full object-contain pointer-events-none drop-shadow-2xl"
                    />
                    {/* Dynamic 3D Contact Shadow */}
                    <div
                      style={{
                        transform: `scale(${1 - Math.abs(orbitRotX) * 0.01})`,
                      }}
                      className="w-64 h-5 bg-black/35 blur-md rounded-full -mt-3 pointer-events-none"
                    />
                  </div>
                  <span className="absolute bottom-4 text-[10px] text-[#8A7867] font-mono bg-[#FCFBF8]/80 px-2 py-0.5 rounded">
                    Drag to orbit 3D perspective
                  </span>
                </div>
              )}
            </div>

            {/* In-Room Spatial Banner */}
            <div className="p-4 rounded-xl bg-[#E5DDD0]/50 border border-[#DCD6CB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#42483A] text-white flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#292B26]">
                    Curious how this looks in your room?
                  </h4>
                  <p className="text-[11px] text-[#6B655C]">
                    Stage this exact {item.name} with true scale and directional floor shadows.
                  </p>
                </div>
              </div>
              <Link
                href={`/visualize?item=${item.item_id}`}
                className="btn-primary text-xs py-2 px-3.5"
              >
                <span>Launch Visualizer</span>
              </Link>
            </div>
          </div>

          {/* Right Product & Purchase Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[10px] font-accent uppercase tracking-widest text-[#8A7867] font-semibold">
                {item.subcategory}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#292B26] mt-1 font-normal">
                {item.name}
              </h1>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-2">
                {item.sale_price ? (
                  <>
                    <span className="text-2xl font-bold font-mono text-[#B8795C]">
                      ${item.sale_price.toFixed(2)}
                    </span>
                    <span className="text-sm line-through font-mono text-[#8A7867]">
                      ${item.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold font-mono text-[#292B26]">
                    ${item.price.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-[#42483A] font-medium ms-2">
                  Tax included // White-Glove Assembled
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B655C] leading-relaxed">
              {item.description}
            </p>

            {/* Specifications Card */}
            <div className="p-4 rounded-xl bg-[#FCFBF8] border border-[#DCD6CB] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-[#DCD6CB]/50">
                <span className="text-[#8A7867] flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" /> Dimensions:
                </span>
                <span className="font-mono font-medium text-[#292B26]">{item.dimensions}</span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-[#DCD6CB]/50">
                <span className="text-[#8A7867]">Primary Material:</span>
                <span className="font-medium text-[#292B26] text-right">{item.material}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A7867]">Stock Availability:</span>
                <span className="text-[#42483A] font-semibold">{item.stock_count} units available</span>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <label className="text-[11px] font-accent uppercase tracking-wider text-[#8A7867] block">
                Selected Finish: <strong className="text-[#292B26]">{selectedColor}</strong>
              </label>
              <div className="flex items-center gap-2">
                {[
                  { name: "Terracotta", bg: "#B8795C" },
                  { name: "Sand Beige", bg: "#E5DDD0" },
                  { name: "Forest Charcoal", bg: "#292B26" },
                  { name: "Warm Ivory", bg: "#F6F3ED" },
                ].map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedColor(swatch.name)}
                    className={`h-6 w-6 rounded-full border transition-all ${
                      selectedColor === swatch.name
                        ? "ring-2 ring-[#292B26] ring-offset-2 scale-110"
                        : "border-[#292B26]/20 opacity-80"
                    }`}
                    style={{ backgroundColor: swatch.bg }}
                    title={swatch.name}
                  />
                ))}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-[#DCD6CB] rounded-md bg-[#FCFBF8]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-sm text-[#292B26] hover:bg-[#F6F3ED]"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-mono font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-sm text-[#292B26] hover:bg-[#F6F3ED]"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="btn-primary flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart (${((item.sale_price || item.price) * quantity).toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>

            {/* Reassurance Guarantees */}
            <div className="pt-4 border-t border-[#DCD6CB] space-y-2 text-xs text-[#8A7867]">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#42483A]" />
                <span>White-Glove freight delivery in 3–5 business days</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#42483A]" />
                <span>30-Day in-home trial with complimentary return pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#42483A]" />
                <span>10-Year structural hardwood frame warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Pieces */}
        {relatedItems.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#DCD6CB]">
            <h2 className="font-serif text-2xl text-[#292B26] mb-6">
              Complementary {item.category} Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedItems.map((rel) => (
                <Link
                  key={rel.item_id}
                  href={`/catalog/${rel.item_id}`}
                  className="pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="aspect-[4/3] bg-[#F6F3ED] rounded flex items-center justify-center p-3 mb-3">
                    <img
                      src={rel.image_url}
                      alt={rel.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#292B26] group-hover:text-[#42483A]">
                      {rel.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#292B26] mt-1 block">
                      ${(rel.sale_price || rel.price).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
