import Link from "next/link";
import { Metadata } from "next";
import { Layers, Eye, Cpu, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "About PixaBuild — Spatial Furniture Architecture",
  description: "Learn how PixaBuild bridges Scandinavian furniture design with computer vision and metric spatial AI.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "About PixaBuild" }]} />

        <div className="max-w-3xl mx-auto my-12 space-y-8">
          <div className="space-y-3 text-center">
            <span className="text-[10px] font-accent uppercase tracking-[0.2em] text-[#8C7965] font-semibold">
              The PixaBuild Manifesto
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#30352D]">
              Imagine it. Before it&apos;s yours.
            </h1>
            <p className="text-sm text-[#74736B] leading-relaxed max-w-xl mx-auto">
              We founded PixaBuild to eliminate the anxiety of furniture shopping: the painful disconnect between catalog studio photos and your actual living room floor.
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
            <h3 className="font-serif text-2xl text-[#30352D]">A New Spatial Standard</h3>
            <p>
              Traditional online furniture shopping forces customers to rely on flat 2D measurements and tape measures. PixaBuild integrates Meta&apos;s Segment Anything Model (SAM) with Depth Anything V2 to compute true camera distances, vanishing lines, and ground-plane constraints.
            </p>
            <p>
              When an item is staged, its proportions are locked to the room&apos;s real metric dimensions. The resulting composite respects original wall moldings, floor textures, and directional window daylight.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[var(--border-subtle)]">
            <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[var(--border-subtle)] space-y-1">
              <span className="text-lg font-bold font-serif text-[#30352D]">1:1 Scale</span>
              <p className="text-xs text-[#74736B]">Guaranteed metric alignment based on floor depth gradient calculation.</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[var(--border-subtle)] space-y-1">
              <span className="text-lg font-bold font-serif text-[#30352D]">Zero Slop</span>
              <p className="text-xs text-[#74736B]">No generic hallucinations or distorted furniture shapes; authentic catalog representations.</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] rounded-lg border border-[var(--border-subtle)] space-y-1">
              <span className="text-lg font-bold font-serif text-[#30352D]">Nordic Timber</span>
              <p className="text-xs text-[#74736B]">Responsibly harvested oak, ash, and beech with traceable forestry certificates.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
