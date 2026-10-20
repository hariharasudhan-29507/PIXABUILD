"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Eye,
  Check,
  Tag,
  Clock,
  Layers
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FURNITURE_CATALOG, CATEGORIES, FurnitureItem } from "@/data/furnitureData";
import { getRecommendations, RecommendationResult } from "@/lib/recommendation";
import { saveSearchQuery, getSearchHistory, STORAGE_KEYS, recordActivity } from "@/lib/supabase";

export default function CatalogPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Load search history and ML recommendations on mount
  useEffect(() => {
    const history = getSearchHistory();
    setSearchHistory(history);
    const recs = getRecommendations(history);
    setRecommendations(recs);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    saveSearchQuery(searchTerm, activeCategory);
    const updated = getSearchHistory();
    setSearchHistory(updated);
    setRecommendations(getRecommendations(updated));
  };

  const handleSelectHistoryPill = (query: string) => {
    setSearchTerm(query);
    saveSearchQuery(query, activeCategory);
    const updated = getSearchHistory();
    setSearchHistory(updated);
    setRecommendations(getRecommendations(updated));
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return FURNITURE_CATALOG.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category.toLowerCase() === activeCategory.toLowerCase();
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        item.material.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, activeCategory]);

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
      console.error("Cart error", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "IKEA Catalog" }]} />

        {/* Header Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
              Curated Inventory // IKEA Dataset v1.0
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading text-[var(--color-forest-charcoal)] mt-1">
              FURNITURE CATALOG
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-muted-taupe)] font-body">
              Browse 36+ Scandinavian designs. Select an item to check spatial fit in your room or buy directly.
            </p>
          </div>
          <div className="text-xs font-medium text-[var(--color-muted-taupe)] bg-[var(--color-sand-beige)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] self-start md:self-auto">
            Showing <strong className="text-[var(--color-forest-charcoal)]">{filteredItems.length}</strong> verified items
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-taupe)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, color (e.g. Terracotta, Charcoal), material (Oak, Linen)..."
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-9 pr-3 py-2.5 text-xs text-[var(--color-forest-charcoal)] placeholder-[var(--color-muted-taupe)]/60 focus:border-[var(--color-sage-green)] focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-primary text-xs px-4">
              Search
            </button>
          </form>

          {/* Search History Pills (Saved searches) */}
          {searchHistory.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-muted-taupe)]">
              <span className="flex items-center gap-1 font-medium text-[11px]">
                <Clock className="h-3 w-3" /> Recent Searches:
              </span>
              {searchHistory.slice(0, 6).map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectHistoryPill(q)}
                  className="px-2 py-0.5 rounded-md bg-[var(--color-sand-beige)] hover:bg-[var(--color-sand-beige)]/70 text-[var(--color-forest-charcoal)] border border-[var(--border-subtle)] text-[11px] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-[var(--color-forest-charcoal)] text-white"
                    : "bg-[var(--color-sand-beige)] text-[var(--color-forest-charcoal)] hover:bg-[var(--color-sand-beige)]/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Machine Learning Recommendations Row */}
        {recommendations.length > 0 && (
          <div className="mb-10 p-5 rounded-xl bg-[var(--color-sand-beige)] border border-[var(--color-terracotta)]/25">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-terracotta)] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-heading text-[var(--color-forest-charcoal)]">
                    MACHINE LEARNING RECOMMENDATIONS
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted-taupe)]">
                    Ranked via TF-IDF Vector Space Model & Cosine Similarity based on your recent searches
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-accent text-[var(--color-terracotta)] uppercase tracking-wider font-semibold">
                Algorithm: Cosine Vector Match
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.item.item_id}
                  className="bg-[var(--color-warm-ivory)] rounded-lg p-3 border border-[var(--border-subtle)] flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-32 w-full overflow-hidden rounded-md bg-white/40 mb-2.5 flex items-center justify-center">
                      <img
                        src={rec.item.image_url}
                        alt={rec.item.name}
                        className="max-h-28 max-w-full object-contain"
                      />
                      <span className="absolute top-1.5 right-1.5 bg-[var(--color-terracotta)] text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
                        {Math.round(rec.similarityScore * 100)}% match
                      </span>
                    </div>
                    <span className="text-[10px] font-accent text-[var(--color-muted-taupe)] block mb-0.5">
                      {rec.reason}
                    </span>
                    <h4 className="text-xs font-semibold text-[var(--color-forest-charcoal)] line-clamp-1">
                      {rec.item.name}
                    </h4>
                    <p className="text-xs font-bold text-[var(--color-forest-charcoal)] mt-1">
                      ${rec.item.sale_price ? rec.item.sale_price.toFixed(2) : rec.item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-[var(--border-subtle)]">
                    <Link
                      href={`/visualize?item=${rec.item.item_id}`}
                      className="btn-secondary text-[11px] py-1 px-1.5 text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>In Room</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(rec.item)}
                      className="btn-primary text-[11px] py-1 px-1.5 flex items-center justify-center gap-1"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>Buy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Furniture Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isAdded = addedItem === item.item_id;
            return (
              <div
                key={item.item_id}
                className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-56 w-full rounded-lg bg-[var(--color-warm-ivory)] overflow-hidden flex items-center justify-center p-4 border border-[var(--border-subtle)]">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-h-48 max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                    {item.is_sale && (
                      <span className="absolute top-2.5 left-2.5 bg-[var(--color-terracotta)] text-white text-[10px] font-accent uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                        Sale Highlight
                      </span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 bg-[var(--color-warm-ivory)]/90 text-[var(--color-muted-taupe)] text-[10px] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                      {item.dimensions}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--color-muted-taupe)]">
                      <span>{item.category}</span>
                      <span className="text-[11px] font-medium text-[var(--color-sage-green)]">
                        {item.stock_count} units left
                      </span>
                    </div>
                    <h3 className="text-base font-heading text-[var(--color-forest-charcoal)]">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted-taupe)] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--color-forest-charcoal)]">
                      <span className="px-2 py-0.5 rounded bg-[var(--color-warm-ivory)] border border-[var(--border-subtle)]">
                        {item.color}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[var(--color-warm-ivory)] border border-[var(--border-subtle)]">
                        {item.material}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div>
                    {item.sale_price ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-[var(--color-terracotta)] font-mono">
                          ${item.sale_price.toFixed(2)}
                        </span>
                        <span className="text-xs line-through text-[var(--color-muted-taupe)] font-mono">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-[var(--color-forest-charcoal)] font-mono">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/visualize?item=${item.item_id}`}
                      className="btn-secondary text-xs py-1.5 px-3"
                      title="Check fit in room"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Check in Room</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="btn-primary text-xs py-1.5 px-3"
                      title="Add to Cart"
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Buy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
