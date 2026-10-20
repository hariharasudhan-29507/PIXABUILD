import Link from "next/link";
import { Metadata } from "next";
import { Sparkles, Eye, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Shop by Rooms — PixaBuild",
  description: "Explore Scandinavian furniture tailored specifically for Living Rooms, Bedrooms, Dining Spaces, and Home Workspaces.",
};

const ROOMS = [
  {
    id: "living",
    title: "The Living Room",
    subtitle: "Communal Calm",
    desc: "Plush linen sectionals, sculptural oak coffee tables, and low-profile media units designed for unhurried evenings.",
    img: "/sample_rooms/sample_room_1.jpg",
    primaryCategory: "Sofa",
    featuredPieces: ["KIVIK 3-Seat Sofa", "LISTERBY Round Table", "MILSBO Cabinet"],
  },
  {
    id: "bedroom",
    title: "The Bedroom Sanctuary",
    subtitle: "Rest & Slumber",
    desc: "Upholstered winged beds, breathable birch slats, and minimalist night tables crafted to support restorative sleep.",
    img: "/sample_rooms/sample_room_2.jpg",
    primaryCategory: "Bed Frame",
    featuredPieces: ["MALM High Bed Frame", "IDANÄS Upholstered Bed", "LACK Side Table"],
  },
  {
    id: "dining",
    title: "The Dining Room",
    subtitle: "Gathering & Hospitality",
    desc: "Molded composite chairs, expandable solid wood tables, and understated lighting that turn every meal into an event.",
    img: "/sample_rooms/sample_room_3.jpg",
    primaryCategory: "Dining Chair",
    featuredPieces: ["ODGER Molded Chair", "BERGMUND Upholstered Chair"],
  },
  {
    id: "office",
    title: "The Home Workspace",
    subtitle: "Focused Ergonomics",
    desc: "Height-adjustable electric workstations, posture-aligned task chairs, and minimal storage designed for clarity.",
    img: "/hero_furniture.png",
    primaryCategory: "Office Desk",
    featuredPieces: ["BEKANT Ergonomic Desk", "IDÅSEN Sit/Stand Desk"],
  },
];

export default function RoomsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Shop by Rooms" }]} />

        <div className="my-8 text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-accent uppercase tracking-[0.2em] text-[#8C7965] font-semibold">
            Spatial Planning
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#30352D]">
            Shop by Interior Space
          </h1>
          <p className="text-xs sm:text-sm text-[#74736B] leading-relaxed">
            Every room has distinct spatial rhythms and lighting demands. Discover pieces proportioned specifically for each zone of your home.
          </p>
        </div>

        <div className="space-y-12 my-10">
          {ROOMS.map((room, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={room.id}
                className="pixa-card bg-[#FFFFFF] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className={`lg:col-span-6 relative aspect-[16/10] rounded-xl overflow-hidden bg-[#E6DFD2] ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
                  <img
                    src={room.img}
                    alt={room.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded text-[10px] font-accent uppercase text-[#30352D]">
                    {room.subtitle}
                  </div>
                </div>

                <div className={`lg:col-span-6 space-y-4 ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7965] font-semibold">
                    Room Zone 0{idx + 1}
                  </span>
                  <h3 className="font-serif text-3xl text-[#30352D]">
                    {room.title}
                  </h3>
                  <p className="text-xs text-[#74736B] leading-relaxed">
                    {room.desc}
                  </p>

                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-[#8C7965] block mb-2">
                      Featured In This Environment:
                    </span>
                    <ul className="flex flex-wrap gap-2 text-xs">
                      {room.featuredPieces.map((p, i) => (
                        <li key={i} className="px-2.5 py-1 rounded bg-[#F7F5F0] border border-[var(--border-subtle)] text-[#30352D]">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Link
                      href={`/catalog?category=${encodeURIComponent(room.primaryCategory)}`}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      <span>Explore {room.title} Pieces</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/visualize"
                      className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#78816A]" />
                      <span>Stage Your Room</span>
                    </Link>
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
