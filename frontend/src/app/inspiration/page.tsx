import Link from "next/link";
import { Metadata } from "next";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Interior Design Inspiration & Journal — PixaBuild",
  description: "Architectural guidance, Scandinavian spatial theory, furniture proportion essays, and material curation.",
};

const ARTICLES = [
  {
    id: "proportions-lighting",
    title: "Mastering Negative Space in Contemporary Living Rooms",
    category: "Spatial Theory",
    readTime: "4 min read",
    snippet: "Why pushing all furniture against the wall makes rooms feel smaller, and how floating conversational clusters create calm architectural flow.",
    img: "/rooms/living_01.jpg",
  },
  {
    id: "natural-oak-care",
    title: "The Organic Timber Guide: Solid Oak vs. Ash Veneer",
    category: "Materials & Craft",
    readTime: "6 min read",
    snippet: "Understanding how Scandinavian hardwoods respond to indoor humidity, seasonal expansion, and botanical oil treatments over decades.",
    img: "/hero_furniture.png",
  },
  {
    id: "small-apartments",
    title: "Proportionate Design: How to Stage Under 60 Square Metres",
    category: "Compact Living",
    readTime: "5 min read",
    snippet: "Using unified color temperatures and elevated leg heights to preserve sightlines and create visual breathability in urban spaces.",
    img: "/rooms/living_02.jpg",
  },
];

export default function InspirationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Design Inspiration" }]} />

        <div className="my-8 text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-accent uppercase tracking-[0.2em] text-[#8C7965] font-semibold">
            The PixaBuild Journal
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#30352D]">
            Interior Perspectives & Guidance
          </h1>
          <p className="text-xs sm:text-sm text-[#74736B] leading-relaxed">
            Thoughtful essays on Scandinavian domestic culture, furniture craftsmanship, and spatial arrangement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-10">
          {ARTICLES.map((article) => (
            <article
              key={article.id}
              className="bg-[#FFFFFF] border border-[var(--border-subtle)] rounded-xl overflow-hidden flex flex-col justify-between group hover:shadow-xs transition-all"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#E6DFD2]">
                  <img
                    src={article.img}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 text-[10px] font-accent uppercase tracking-wider text-[#30352D] px-2.5 py-1 rounded">
                    {article.category}
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[11px] font-mono text-[#8C7965]">{article.readTime}</span>
                  <h3 className="font-serif text-xl text-[#30352D] group-hover:text-[#78816A] transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[#74736B] leading-relaxed">
                    {article.snippet}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-[var(--border-subtle)] mt-4">
                <Link
                  href="/catalog"
                  className="text-xs font-semibold text-[#30352D] hover:text-[#78816A] inline-flex items-center gap-1.5 pt-3"
                >
                  <span>Explore Featured Pieces</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
