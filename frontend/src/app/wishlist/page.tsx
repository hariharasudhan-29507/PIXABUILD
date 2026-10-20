"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, Eye, ArrowRight, Compass } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { STORAGE_KEYS, recordActivity } from "@/lib/supabase";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<FurnitureItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pixabuild_wishlist");
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const matched = FURNITURE_CATALOG.filter((f) => ids.includes(f.item_id));
        setWishlistItems(matched);
      }
    } catch {}
  }, []);

  const removeFromWishlist = (itemId: string) => {
    const updated = wishlistItems.filter((i) => i.item_id !== itemId);
    setWishlistItems(updated);
    localStorage.setItem("pixabuild_wishlist", JSON.stringify(updated.map((i) => i.item_id)));
    window.dispatchEvent(new Event("wishlist_updated"));
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
      recordActivity("ADDED_TO_CART_FROM_WISHLIST", { item_id: item.item_id });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Wishlist" }]} />

        <div className="flex items-end justify-between pb-4 border-b border-[var(--border-subtle)] my-6">
          <div>
            <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
              Curated Moodboard
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D] mt-1">
              SAVED PIECES ({wishlistItems.length})
            </h1>
          </div>
          <Link href="/catalog" className="text-xs text-[#78816A] hover:underline flex items-center gap-1">
            <span>Continue Browsing</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 pixa-card bg-[#FFFFFF] max-w-md mx-auto space-y-4">
            <Heart className="h-10 w-10 text-[#8C7965] mx-auto opacity-35" />
            <h3 className="font-serif text-xl text-[#30352D]">Your Wishlist is Empty</h3>
            <p className="text-xs text-[#74736B]">
              Save Scandinavian sofas, tables, and lounge chairs as you explore the catalog to stage them together.
            </p>
            <Link href="/catalog" className="btn-primary text-xs py-2.5 px-5 inline-flex">
              Explore Furniture Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.item_id}
                className="bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-lg p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 w-full bg-[#F7F5F0] rounded p-4 flex items-center justify-center mb-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-h-48 max-w-full object-contain"
                    />
                    <button
                      onClick={() => removeFromWishlist(item.item_id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-[#8C7965] hover:text-red-700 border border-[var(--border-subtle)]"
                      title="Remove from saved"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-[#8C7965] uppercase tracking-wider font-accent">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[#30352D] mt-0.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#74736B] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-base font-bold font-mono text-[#30352D]">
                    ${item.sale_price || item.price}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/visualize?item=${item.item_id}`}
                      className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Stage</span>
                    </Link>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>Buy</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
