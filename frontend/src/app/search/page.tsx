"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Compass, ShoppingBag, Eye, Heart, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { saveSearchQuery, getSearchHistory, STORAGE_KEYS, recordActivity } from "@/lib/supabase";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    setRecentSearches(getSearchHistory());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchQuery(query, selectedCategory);
      setRecentSearches(getSearchHistory());
    }
  };

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return FURNITURE_CATALOG.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchText =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchText;
    });
  }, [query, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Catalog", href: "/catalog" }, { label: "Search" }]} />

        {/* Large Accessible Search Header */}
        <div className="max-w-2xl mx-auto my-8 text-center space-y-4">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
            Catalog Vector Index
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D]">
            Search Scandinavian Furniture
          </h1>

          <form onSubmit={handleSearch} className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8C7965]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'Oak dining table', 'Terracotta sofa', 'Linen armchair'..."
              className="w-full rounded-full border border-[var(--border-strong)] bg-[#FFFFFF] pl-12 pr-28 py-3.5 text-sm text-[#30352D] placeholder-[#74736B]/60 shadow-xs focus:border-[#78816A] focus:outline-none"
            />
            <button
              type="submit"
              className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 rounded-full py-2 px-5 text-xs"
            >
              Search
            </button>
          </form>

          {/* Recent & Suggested Queries */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-[#8C7965] pt-2">
            <span className="text-[11px] font-medium">Suggestions:</span>
            {["Oak", "Terracotta Sofa", "Bouclé", "Bed Frame", "Work Desk"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  saveSearchQuery(s);
                  setRecentSearches(getSearchHistory());
                }}
                className="px-2.5 py-1 rounded-full bg-[#E6DFD2] hover:bg-[#E6DFD2]/70 text-[#30352D] text-[11px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-6 text-xs text-[#74736B]">
          <span>
            Found <strong className="text-[#30352D]">{results.length}</strong> pieces for &ldquo;{query || "All Inventory"}&rdquo;
          </span>
          <div className="flex gap-2">
            {["All", "Sofa", "Coffee Table", "Dining Chair", "Bed Frame"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded text-[11px] ${
                  selectedCategory === c ? "bg-[#30352D] text-white" : "hover:text-[#30352D]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Results */}
        {results.length === 0 ? (
          <div className="text-center py-20 pixa-card bg-[#FFFFFF] max-w-md mx-auto space-y-3">
            <Compass className="h-8 w-8 text-[#8C7965] mx-auto opacity-50" />
            <h3 className="font-serif text-lg text-[#30352D]">No Matching Scandinavian Designs</h3>
            <p className="text-xs text-[#74736B]">
              We couldn&apos;t find an exact match. Try adjusting your search query or exploring our primary collections.
            </p>
            <button
              onClick={() => { setQuery(""); setSelectedCategory("All"); }}
              className="btn-secondary text-xs py-2 px-4"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((item) => (
              <Link
                key={item.item_id}
                href={`/catalog/${item.item_id}`}
                className="bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-lg p-4 group text-decoration-none block hover:shadow-xs transition-all"
              >
                <div className="h-48 w-full bg-[#F7F5F0] rounded flex items-center justify-center p-3 mb-3">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="max-h-40 max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-[#8C7965] font-accent uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-semibold text-[#30352D] group-hover:text-[#78816A]">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-bold text-[#30352D]">
                      ${item.sale_price || item.price}
                    </span>
                    <span className="text-[10px] text-[#78816A] underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
