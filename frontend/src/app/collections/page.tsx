import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, Compass } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Editorial Collections — Scandinavian Living",
  description: "Curated Scandinavian furniture edits: Natural Oak, Soft Neutrals, Small-Space Living, and Modern Essentials.",
};

const COLLECTIONS = [
  {
    id: "natural-oak",
    title: "The Natural Oak Edit",
    subtitle: "Organic Scandinavian Warmth",
    desc: "Unvarnished European oak treated with natural botanical oils. Celebrates authentic grain variations and honest mortise-and-tenon joinery.",
    img: "/rooms/dining_02.jpg",
    itemCount: "12 pieces",
    categoryFilter: "Coffee Table",
  },
  {
    id: "soft-neutrals",
    title: "Soft Neutrals & Textured Linen",
    subtitle: "Tactile Serenity",
    desc: "Ivory, taupe, and sand bouclé textiles calibrated to diffuse harsh sunlight into comforting domestic warmth.",
    img: "/rooms/living_01.jpg",
    itemCount: "14 pieces",
    categoryFilter: "Sofa",
  },
  {
    id: "small-space",
    title: "Small-Space Architectural Living",
    subtitle: "Proportionate Precision",
    desc: "Space-saving dual-purpose sleeper sectionals, nesting side surfaces, and elevated leg frames that maximize visual floor plane.",
    img: "/rooms/bedroom_01.jpg",
    itemCount: "8 pieces",
    categoryFilter: "Dining Chair",
  },
  {
    id: "work-from-home",
    title: "The Scandinavian Home Studio",
    subtitle: "Calm Productivity",
    desc: "Acoustically softened desk configurations, motorized sit/stand surfaces, and cable concealers engineered for creative concentration.",
    img: "/rooms/office_01.jpg",
    itemCount: "6 pieces",
    categoryFilter: "Office Desk",
  },
];

export default function CollectionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Editorial Collections" }]} />

        <div className="my-8 text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-accent uppercase tracking-[0.2em] text-[#8C7965] font-semibold">
            Seasonal Curation // 2026
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#30352D]">
            Curated Architectural Edits
          </h1>
          <p className="text-xs sm:text-sm text-[#74736B] leading-relaxed">
            Cohesive furniture ensembles crafted to bring balanced Scandinavian light, organic texture, and geometric stillness into your domestic spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          {COLLECTIONS.map((c) => (
            <div
              key={c.id}
              className="bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-xl overflow-hidden flex flex-col justify-between group hover:shadow-sm transition-all"
            >
              <div className="relative h-64 w-full overflow-hidden bg-[#E6DFD2]">
                <img
                  src={c.img}
                  alt={c.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] font-accent uppercase tracking-wider text-[#30352D]">
                  {c.subtitle}
                </span>
              </div>

              <div className="p-6 space-y-2">
                <div className="flex justify-between items-center text-xs text-[#8C7965]">
                  <span>Curated Edit</span>
                  <span>{c.itemCount}</span>
                </div>
                <h3 className="font-serif text-2xl text-[#30352D] group-hover:text-[#78816A] transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-[#74736B] leading-relaxed">
                  {c.desc}
                </p>
                <div className="pt-3">
                  <Link
                    href={`/catalog?category=${encodeURIComponent(c.categoryFilter)}`}
                    className="text-xs font-semibold text-[#30352D] hover:text-[#78816A] inline-flex items-center gap-1.5"
                  >
                    <span>Explore Curated Pieces</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
