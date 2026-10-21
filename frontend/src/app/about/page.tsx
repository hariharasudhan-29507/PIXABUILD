import Link from "next/link";
import { Metadata } from "next";
import { Layers, Eye, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "About PixaBuild — Design & Spatial Living",
  description: "Learn how PixaBuild brings authentic furniture and harmonious spatial previews to modern homes.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
        <Breadcrumbs items={[{ label: "About PixaBuild" }]} />

        <div className="max-w-3xl mx-auto my-12 space-y-8">
          <div className="space-y-3 text-center">
            <span className="text-[10px] font-accent uppercase tracking-[0.2em] text-[#8C7965] font-semibold">
              The PixaBuild Philosophy
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#30352D]">
              Imagine it. Before it&apos;s yours.
            </h1>
            <p className="text-sm text-[#74736B] leading-relaxed max-w-xl mx-auto">
              We founded PixaBuild to eliminate the uncertainty of furniture shopping: bridging the gap between studio design photographs and your actual living room floor.
            </p>
          </div>

          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#E6DFD2] border border-[var(--border-subtle)] my-8">
            <img
              src="/sample_rooms/sample_room_1.jpg"
              alt="Scandinavian Living Room"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-neutral max-w-none space-y-4 text-xs sm:text-sm text-[#74736B] leading-relaxed">
            <h3 className="font-serif text-2xl text-[#30352D]">A New Living Standard</h3>
            <p>
              Traditional online furniture shopping forces customers to rely on flat pictures and tape measures. PixaBuild brings architectural proportion, natural daylight harmony, and room perspective together so you can see exactly how furniture fits your floor plan.
            </p>
            <p>
              When a piece is staged, its dimensions respect your room&apos;s architectural proportions, floor finishes, and directional natural lighting for complete purchasing peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[var(--border-subtle)]">
            <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[var(--border-subtle)] space-y-1">
              <span className="text-lg font-bold font-serif text-[#30352D]">True Scale</span>
              <p className="text-xs text-[#74736B]">Proportioned accurately to harmonize with your room layout and furniture dimensions.</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[var(--border-subtle)] space-y-1">
              <span className="text-lg font-bold font-serif text-[#30352D]">Crafted Quality</span>
              <p className="text-xs text-[#74736B]">Authentic handcrafted representations reflecting exact Scandinavian workshop standards.</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[var(--border-subtle)] space-y-1">
              <span className="text-lg font-bold font-serif text-[#30352D]">Nordic Timber</span>
              <p className="text-xs text-[#74736B]">Responsibly harvested oak, ash, and pine with sustainable forestry certificates.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
