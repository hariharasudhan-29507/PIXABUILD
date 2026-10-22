"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Eye,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGuard } from "@/components/AuthGuard";
import { FURNITURE_CATALOG, CATEGORIES, FurnitureItem } from "@/data/furnitureData";
import { getRecommendations, RecommendationResult } from "@/lib/recommendation";
import { saveSearchQuery, getSearchHistory, STORAGE_KEYS, recordActivity } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

const ITEMS_PER_PAGE = 8; // 4 columns x 2 rows = 8 items per page

export default function CatalogPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Read URL query params on mount & handle focus
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || params.get("search");
      const cat = params.get("category");
      const shouldFocus = params.get("focusSearch") === "true";

      if (q) setSearchTerm(q);
      if (cat) setActiveCategory(cat);

      if (shouldFocus) {
        setTimeout(() => {
          const input = document.getElementById("catalog-search-input") as HTMLInputElement | null;
          if (input) {
            input.focus();
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    }
  }, []);

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
    setCurrentPage(1);
  };

  const handleSelectHistoryPill = (query: string) => {
    setSearchTerm(query);
    saveSearchQuery(query, activeCategory);
    const updated = getSearchHistory();
    setSearchHistory(updated);
    setRecommendations(getRecommendations(updated));
    setCurrentPage(1);
  };

  // Determine if this is a new user (no search history)
  const isNewUser = searchHistory.length === 0;

  // Single unified product list: Recommended items first, others below, NO repetition
  const { filteredItems, recommendedIds } = useMemo(() => {
    const base = FURNITURE_CATALOG.filter((item) => {
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

    const recIds = new Set<string>();

    // For new users or when no recommendations exist: return standard list
    if (isNewUser || recommendations.length === 0) {
      return { filteredItems: base, recommendedIds: recIds };
    }

    // Returning user: Recommended pieces on TOP, other items on bottom, zero repetition
    recommendations.forEach((r) => recIds.add(r.item.item_id));

    const recommendedList = base.filter((item) => recIds.has(item.item_id));
    const remainingList = base.filter((item) => !recIds.has(item.item_id));

    return {
      filteredItems: [...recommendedList, ...remainingList],
      recommendedIds: recIds,
    };
  }, [searchTerm, activeCategory, isNewUser, recommendations]);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

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

  // Render individual product card with exact matching dimensions, matching buttons, and clean spacing
  const renderProductCard = (item: FurnitureItem) => {
    const isAdded = addedItem === item.item_id;
    const isRecommended = recommendedIds.has(item.item_id) && !isNewUser;

    return (
      <div
        key={item.item_id}
        className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] flex flex-col justify-between h-full p-5 rounded-2xl group transition-shadow hover:shadow-md"
      >
        <div>
          {/* Image Container: Pure white studio mockup background, fills inner rounded rectangle */}
          <div className="relative h-60 w-full rounded-xl bg-white overflow-hidden flex items-center justify-center border border-[var(--border-subtle)] p-2">
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            {item.is_sale && (
              <span className="absolute top-2.5 left-2.5 bg-[var(--color-terracotta)] text-white text-[10px] font-accent uppercase tracking-wider font-bold px-2 py-0.5 rounded shadow-xs">
                Sale Highlight
              </span>
            )}
            {isRecommended && (
              <span className="absolute top-2.5 right-2.5 bg-[#42483A] text-white text-[10px] font-accent uppercase tracking-wider font-semibold px-2 py-0.5 rounded shadow-xs">
                Recommended
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--color-muted-taupe)]">
              <span className="uppercase tracking-wider font-semibold text-[10px]">{item.category}</span>
              <span className="text-[11px] font-medium text-[var(--color-sage-green)]">
                {item.stock_count} units left
              </span>
            </div>

            <h3 className="text-base font-heading text-[var(--color-forest-charcoal)] line-clamp-1">
              {item.name}
            </h3>

            <p className="text-xs text-[var(--color-muted-taupe)] line-clamp-2 leading-relaxed min-h-[36px]">
              {item.description}
            </p>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[var(--color-forest-charcoal)] flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[var(--color-warm-ivory)] border border-[var(--border-subtle)]">
                {item.color}
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--color-warm-ivory)] border border-[var(--border-subtle)] truncate max-w-[150px]">
                {item.material}
              </span>
            </div>
          </div>
        </div>

        {/* Price & Actions: Stacked cleanly, zero overlap */}
        <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
          {/* Dedicated Price Row */}
          <div className="flex items-baseline justify-between gap-2 min-h-[28px]">
            <div className="flex items-baseline gap-2">
              {item.sale_price ? (
                <>
                  <span className="text-lg font-bold text-[var(--color-terracotta)] font-mono whitespace-nowrap">
                    {formatINR(item.sale_price)}
                  </span>
                  <span className="text-xs line-through text-[var(--color-muted-taupe)] font-mono whitespace-nowrap">
                    {formatINR(item.price)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-[var(--color-forest-charcoal)] font-mono whitespace-nowrap">
                  {formatINR(item.price)}
                </span>
              )}
            </div>
          </div>

          {/* Equal Sized Action Buttons Grid (Identical height h-10 and equal width) */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link
              href={`/visualize?item=${item.item_id}`}
              className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--color-warm-ivory)] hover:bg-white text-[var(--color-forest-charcoal)] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              title="Check fit in room"
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span className="truncate">In Room</span>
            </Link>
            <button
              type="button"
              onClick={() => handleAddToCart(item)}
              className="h-10 w-full rounded-lg bg-[var(--color-forest-charcoal)] hover:bg-[#1A1D18] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              title="Add to Cart"
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span className="truncate">Buy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
        <Navbar />

        <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
          {/* Header Title */}
          <div className="mb-6 pb-4 border-b border-[var(--border-subtle)]">
            <h1 className="text-3xl sm:text-4xl font-heading text-[var(--color-forest-charcoal)]">
              FURNITURE CATALOG
            </h1>
          </div>

          {/* Clean Search Bar */}
          <div className="mb-8 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 w-full max-w-sm sm:max-w-md">
              <div className="relative flex-1 flex items-center">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-taupe)]" />
                <input
                  id="catalog-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="start searching"
                  className="w-full h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] pl-10 pr-9 text-xs text-[var(--color-forest-charcoal)] placeholder-[var(--color-muted-taupe)]/60 focus:border-[var(--color-sage-green)] focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-taupe)] hover:text-[var(--color-forest-charcoal)]"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary h-10 text-xs px-5 flex items-center justify-center shrink-0">
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
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-8">
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

          {/* Main Furniture Catalog Grid: Exactly 4 products per row (4 columns), Recommended on top, No duplicates */}
          <div id="catalog-section" className="scroll-mt-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-[var(--color-sand-beige)] rounded-2xl border border-[var(--border-subtle)] my-4">
                <h3 className="font-heading text-lg text-[var(--color-forest-charcoal)]">
                  No Matching Furniture Found
                </h3>
                <p className="text-xs text-[var(--color-muted-taupe)] mt-1">
                  Try adjusting your search query or selecting a different category.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("All");
                  }}
                  className="btn-primary text-xs px-4 py-2 mt-4"
                >
                  Clear Filters
                </button>
              </div>
            ) : paginatedItems.length === 1 ? (
              /* If a single product, center the product */
              <div className="flex justify-center w-full py-4">
                <div className="w-full max-w-sm">
                  {renderProductCard(paginatedItems[0])}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedItems.map((item) => renderProductCard(item))}
              </div>
            )}
          </div>

          {/* Numbered Pagination with Previous/Next Navigation */}
          {totalPages > 1 && (
            <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[var(--color-muted-taupe)] font-medium">
                Showing <strong className="text-[var(--color-forest-charcoal)]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong> of <strong className="text-[var(--color-forest-charcoal)]">{filteredItems.length}</strong> items
              </div>

              <div className="flex items-center gap-2">
                {/* Backward Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    const el = document.getElementById("catalog-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-warm-ivory)] hover:bg-white text-xs font-medium text-[var(--color-forest-charcoal)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        const el = document.getElementById("catalog-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`h-9 w-9 rounded-lg text-xs font-mono font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-[var(--color-forest-charcoal)] text-white shadow-xs"
                          : "bg-[var(--color-sand-beige)] hover:bg-white text-[var(--color-forest-charcoal)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    const el = document.getElementById("catalog-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-warm-ivory)] hover:bg-white text-xs font-medium text-[var(--color-forest-charcoal)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
