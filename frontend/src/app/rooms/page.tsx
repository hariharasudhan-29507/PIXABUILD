import Link from "next/link";
import { Metadata } from "next";
import { Eye, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Shop by Rooms — PixaBuild",
  description: "Explore Scandinavian furniture tailored specifically for Living Rooms, Bedrooms, Dining Spaces, Home Workspaces, and Entryways.",
};

const ROOMS = [
  {
    id: "living",
    title: "The Living Salon",
    subtitle: "Communal Calm",
    desc: "Plush linen sectionals, sculptural oak coffee tables, and low-profile media units designed for unhurried evenings.",
    img: "/rooms/living_01.jpg",
    primaryCategory: "Sofa",
    featuredPieces: ["Astrid Textured Linen Sofa", "Lisabo Ash Coffee Table", "Billy Architectural Vitrine"],
  },
  {
    id: "bedroom",
    title: "The Bedroom Sanctuary",
    subtitle: "Rest & Slumber",
    desc: "Upholstered winged beds, breathable birch slats, and minimalist night tables crafted to support restorative sleep.",
    img: "/rooms/bedroom_01.jpg",
    primaryCategory: "Bed Frame",
    featuredPieces: ["Malm Low Platform Bedstead", "Songesand Ash Frame", "Hemnes Solid Pine Bed"],
  },
  {
    id: "dining",
    title: "The Dining Space",
    subtitle: "Gathering & Hospitality",
    desc: "Molded composite chairs, expandable solid wood tables, and understated lighting that turn every meal into an event.",
    img: "/rooms/dining_01.jpg",
    primaryCategory: "Dining Chair",
    featuredPieces: ["Ingolf Solid Timber Chair", "Tobias Translucent Sculptural Chair", "Bergmund Linen Chair"],
  },
  {
    id: "office",
    title: "The Home Atelier",
    subtitle: "Focused Ergonomics",
    desc: "Height-adjustable electric workstations, posture-aligned task chairs, and minimal storage designed for creative clarity.",
    img: "/rooms/office_01.jpg",
    primaryCategory: "Office Desk",
    featuredPieces: ["Trotten Precision Standing Desk", "Alex Minimal Double Drawer Desk", "Bekant Corner Desk"],
  },
  {
    id: "entryway",
    title: "The Entryway & Foyer",
    subtitle: "Architectural Welcome",
    desc: "Sculptural benches, fluted glass showcases, and minimal consoles proportioned to organize transitional spaces.",
    img: "/rooms/entryway_01.jpg",
    primaryCategory: "Display Cabinet",
    featuredPieces: ["Rudsta Fluted Metal Wall Cabinet", "Milsbo Tall Gallery Showcase", "Fabrikör Curved Vitrine"],
  },
];

export default function RoomsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26]">
        <Navbar />

        <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
        <Breadcrumbs items={[{ label: "Shop by Rooms" }]} />

        <div className="my-8 text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8A7867] font-semibold">
            Architectural Floor Plans
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#292B26] font-normal">
            SHOP BY ROOM ENVIRONMENT
          </h1>
          <p className="text-xs sm:text-sm text-[#6B655C] leading-relaxed">
            Every environment presents distinct acoustic, proportional, and light qualities. Select a room to view curated pieces or test them in your actual space.
          </p>
        </div>

        <div className="space-y-12 my-10">
          {ROOMS.map((room, idx) => {
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={room.id}
                className="pixa-card bg-[#FCFBF8] border-[#DCD6CB] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 items-center hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div
                  className={`lg:col-span-7 h-72 sm:h-96 w-full overflow-hidden bg-[#E5DDD0] relative ${
                    isReversed ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <img
                    src={room.img}
                    alt={room.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-[#FCFBF8]/95 backdrop-blur-xs px-3 py-1 rounded text-[11px] font-medium text-[#292B26] border border-[#DCD6CB]">
                    {room.subtitle}
                  </div>
                </div>

                {/* Content */}
                <div
                  className={`lg:col-span-5 p-8 sm:p-10 space-y-5 ${
                    isReversed ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867]">
                      Room Concept 0{idx + 1}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#292B26] mt-1 font-normal">
                      {room.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B655C] leading-relaxed mt-2">
                      {room.desc}
                    </p>
                  </div>

                  {/* Featured pieces pills */}
                  <div>
                    <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867] block mb-2">
                      Curated Works:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {room.featuredPieces.map((piece) => (
                        <span
                          key={piece}
                          className="px-2.5 py-1 rounded bg-[#F6F3ED] border border-[#DCD6CB] text-[11px] text-[#292B26]"
                        >
                          {piece}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href={`/catalog?category=${encodeURIComponent(room.primaryCategory)}`}
                      className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <Link
                      href="/visualize"
                      className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#42483A]" />
                      <span>Stage in Room</span>
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
    </AuthGuard>
  );
}
