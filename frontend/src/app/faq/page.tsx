import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — PixaBuild",
  description: "Find answers regarding PixaBuild room staging AI, IKEA product delivery, returns, and material care.",
};

const FAQS = [
  {
    q: "How does the AI room visualization calculate realistic scale?",
    a: "Our pipeline uses Depth Anything V2 to compute a metric depth map of your photo, identifying floor depth gradients. It then scales the 3D bounding box of the furniture piece so it matches the physical proportions of the room, preventing awkward miniature or oversized placements."
  },
  {
    q: "Do I need special camera equipment to upload a room?",
    a: "No. Any standard smartphone camera taken at eye or chest level in daylight works perfectly. Ensure the floor area where you plan to stage the furniture is visible."
  },
  {
    q: "Are all furniture items real products I can purchase?",
    a: "Yes. Every piece in our catalog is derived from verified collections with authentic dimensions, materials, and availability notes."
  },
  {
    q: "What is your white-glove delivery policy?",
    a: "All orders over Rs. 3,000 qualify for free white-glove freight delivery, which includes room-of-choice placement, unboxing, and packaging recycling."
  },
  {
    q: "What if the furniture does not fit as imagined once delivered?",
    a: "We offer an unconditional 30-day in-home return policy. Our freight team will retrieve the piece from your room at zero return shipping cost."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Frequently Asked Questions" }]} />

        <div className="my-8 text-center space-y-2">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
            Help & Guidance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D]">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-[#74736B]">
            Everything you need to know about spatial staging, craftsmanship, and delivery.
          </p>
        </div>

        <div className="space-y-4 my-8">
          {FAQS.map((item, idx) => (
            <div key={idx} className="pixa-card bg-[#FFFFFF] p-5 space-y-2">
              <h3 className="font-serif text-base sm:text-lg text-[#30352D] font-medium">
                {item.q}
              </h3>
              <p className="text-xs text-[#74736B] leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
