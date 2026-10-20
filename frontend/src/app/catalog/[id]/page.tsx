"use client";

import { use, useState, useEffect } from "react";
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
  ArrowLeft
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
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-xs text-[#8C7965]">
        Loading Product Coordinates...
      </div>
    );
  }

  const toggleWish = () => {
    try {
      const rawWish = localStorage.getItem("pixabuild_wishlist");
      let list: string[] = rawWish ? JSON.parse(rawWish) : [];
      if (list.includes(item.item_id)) {
        list = list.filter((id) => id !== item.item_id);
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
      setAdded(true);
      recordActivity("ADDED_TO_CART", { item_id: item.item_id, quantity });
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const relatedItems = FURNITURE_CATALOG.filter(
    (f) => f.category === item.category && f.item_id !== item.item_id
  ).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: "Catalog", href: "/catalog" },
            { label: item.category, href: `/catalog?category=${encodeURIComponent(item.category)}` },
            { label: item.name },
          ]}
        />

        {/* Product Layout Grid: Left Gallery (7 cols), Right Purchase Info (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
          {/* Left Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#FFFFFF] border border-[var(--border-subtle)] p-8 flex items-center justify-center">
              <img
                src={item.image_url}
                alt={item.name}
                className="max-h-[420px] max-w-full object-contain"
              />
              <button
                type="button"
                onClick={toggleWish}
                className={`absolute top-4 right-4 p-2.5 rounded-full border transition-colors ${
                  isWish
                    ? "bg-[#B96E4B] text-white border-[#B96E4B]"
                    : "bg-[#FFFFFF] text-[#30352D] border-[var(--border-subtle)] hover:text-[#B96E4B]"
                }`}
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>

            {/* In-Room Spatial Banner */}
            <div className="p-4 rounded-xl bg-[#E6DFD2]/60 border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#78816A] text-white flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#30352D]">
                    Curious how this looks in your room?
                  </h4>
                  <p className="text-[11px] text-[#74736B]">
                    Stage this exact {item.name} with metric perspective.
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
              <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
                {item.subcategory}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#30352D] mt-1 font-normal">
                {item.name}
              </h1>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-2">
                {item.sale_price ? (
                  <>
                    <span className="text-2xl font-bold font-mono text-[#B96E4B]">
                      ${item.sale_price.toFixed(2)}
                    </span>
                    <span className="text-sm line-through font-mono text-[#8C7965]">
                      ${item.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold font-mono text-[#30352D]">
                    ${item.price.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-[#78816A] font-medium ms-2">
                  Tax included
                </span>
              </div>
            </div>

            <p className="text-xs text-[#74736B] leading-relaxed">
              {item.description}
            </p>

            {/* Dimensions Pill */}
            <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[var(--border-subtle)] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8C7965] flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" /> Dimensions:
                </span>
                <span className="font-mono font-medium text-[#30352D]">{item.dimensions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C7965]">Primary Material:</span>
                <span className="font-medium text-[#30352D]">{item.material}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C7965]">Stock Availability:</span>
                <span className="text-[#78816A] font-semibold">{item.stock_count} units available</span>
              </div>
            </div>

            {/* Color Swatch Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#30352D] mb-2">
                Finish & Textile Option: <span className="font-normal text-[#8C7965]">{selectedColor}</span>
              </label>
              <div className="flex items-center gap-2">
                {[item.color, "Sand Beige", "Natural Oak", "Warm Ivory"].slice(0, 3).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`px-3 py-1.5 rounded text-xs border transition-all ${
                      selectedColor === col
                        ? "bg-[#30352D] text-white border-[#30352D]"
                        : "bg-[#FFFFFF] text-[#30352D] border-[var(--border-subtle)] hover:bg-[#E6DFD2]"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-[var(--border-strong)] bg-[#FFFFFF]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-xs font-bold hover:bg-[#E6DFD2]"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-mono font-bold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-xs font-bold hover:bg-[#E6DFD2]"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn-primary flex-1 py-3 text-xs justify-center"
                >
                  {added ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>Added to Your Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      <span>Add to Shopping Cart</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Visualize Button */}
              <Link
                href={`/visualize?item=${item.item_id}`}
                className="btn-secondary w-full py-3 text-xs justify-center flex items-center gap-2"
              >
                <Eye className="h-3.5 w-3.5 text-[#78816A]" />
                <span>Test in My Room Before Buying</span>
              </Link>
            </div>

            {/* Guarantees */}
            <div className="pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-3 text-[11px] text-[#74736B]">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#78816A]" />
                <span>Free White-Glove Delivery over $300</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#78816A]" />
                <span>30-Day In-Home Return Policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Pieces */}
        {relatedItems.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[var(--border-subtle)]">
            <h3 className="font-serif text-2xl text-[#30352D] mb-6">
              Complementary {item.category} Designs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedItems.map((rel) => (
                <Link
                  key={rel.item_id}
                  href={`/catalog/${rel.item_id}`}
                  className="bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-lg p-4 group text-decoration-none block hover:shadow-sm transition-all"
                >
                  <div className="h-44 w-full bg-[#F7F5F0] rounded flex items-center justify-center p-3 mb-3">
                    <img
                      src={rel.image_url}
                      alt={rel.name}
                      className="max-h-36 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-[#30352D] group-hover:text-[#78816A]">
                    {rel.name}
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#30352D] block mt-1">
                    ${rel.sale_price || rel.price}
                  </span>
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
