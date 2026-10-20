import { Metadata } from "next";
import { Truck, RotateCcw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Shipping & Return Policies — PixaBuild",
  description: "Transparent white-glove freight delivery, packaging removal, and 30-day in-home returns policy.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Shipping & Returns" }]} />

        <div className="my-8 text-center space-y-2">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
            Logistics & Assurance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D]">
            Shipping & Return Policies
          </h1>
          <p className="text-xs text-[#74736B]">
            Transparent freight care designed to guarantee peace of mind.
          </p>
        </div>

        <div className="space-y-6 my-8">
          <div className="pixa-card bg-[#FFFFFF] p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-[#78816A]">
              <Truck className="h-5 w-5" />
              <h2 className="font-serif text-xl text-[#30352D]">
                White-Glove Freight Delivery
              </h2>
            </div>
            <p className="text-xs text-[#74736B] leading-relaxed">
              Standard parcel shipping is unsuitable for high-end upholstered sofas and solid oak tables. Every PixaBuild order is routed through our specialized furniture freight network with scheduled delivery appointment windows.
            </p>
            <ul className="text-xs text-[#74736B] space-y-1.5 list-disc pl-5 pt-1">
              <li>Free white-glove delivery on all orders exceeding $300.</li>
              <li>Room-of-choice placement and packaging disposal included at no added cost.</li>
              <li>Estimated transit window: 3–7 business days depending on postal zone.</li>
            </ul>
          </div>

          <div className="pixa-card bg-[#FFFFFF] p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-[#B96E4B]">
              <RotateCcw className="h-5 w-5" />
              <h2 className="font-serif text-xl text-[#30352D]">
                30-Day In-Home Return Trial
              </h2>
            </div>
            <p className="text-xs text-[#74736B] leading-relaxed">
              Even with spatial room AI preview, lighting conditions in your home change throughout the seasons. If any piece does not feel completely right in your living space, initiate a return within 30 days.
            </p>
            <ul className="text-xs text-[#74736B] space-y-1.5 list-disc pl-5 pt-1">
              <li>Zero return freight deductions; full purchase price refunded to original payment method.</li>
              <li>Pieces must be in original condition free from pet scratches or structural alteration.</li>
              <li>Our freight logistics team will arrive at your address to pack and retrieve the furniture.</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
