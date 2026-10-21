"use client";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS_COL_1: FaqItem[] = [
  {
    id: "f1",
    category: "CRAFT & TIMBER",
    question: "Where is the European oak and ash sourced?",
    answer: "100% of our timber is responsibly harvested from FSC-certified Nordic and European forests, kiln-dried and hand-finished with organic hardwax oils.",
  },
  {
    id: "f2",
    category: "TEXTILE & SAMPLES",
    question: "Can I receive fabric swatches before placing an order?",
    answer: "Yes. We offer complimentary sample kits with our wool bouclé, natural Belgian linen, and full-grain Scandinavian aniline leathers.",
  },
  {
    id: "f3",
    category: "WHITE-GLOVE DELIVERY",
    question: "What does white-glove delivery include?",
    answer: "Our two-person logistics team carries pieces to your room of choice, unboxes, completes assembly, and removes all protective packaging.",
  },
  {
    id: "f4",
    category: "HOME TRIAL",
    question: "What is your in-home trial policy?",
    answer: "Live with your furniture for 30 days. If the proportion or tone doesn't harmoniously suit your home, we arrange seamless pickup and full refund.",
  },
];

const FAQS_COL_2: FaqItem[] = [
  {
    id: "f5",
    category: "SCALE & PROPORTION",
    question: "Are catalog dimensions true to architectural scale?",
    answer: "Every piece is measured with 1:1 metric accuracy to ensure harmonious architectural alignment with standard ceiling heights and doorframes.",
  },
  {
    id: "f6",
    category: "ROOM VISUALIZER",
    question: "How does the room visualizer help before ordering?",
    answer: "Upload a room photo to preview curated furniture in your space under realistic daylight conditions, checking scale and aesthetic harmony.",
  },
  {
    id: "f7",
    category: "WOOD CARE & PATINA",
    question: "How should I maintain untreated and oiled wood?",
    answer: "Wipe with a damp lint-free cloth and apply natural beeswax balm annually. The wood matures gracefully into a rich, warm patina.",
  },
  {
    id: "f8",
    category: "CUSTOM FINISHES",
    question: "Can I request custom stain or upholstery colors?",
    answer: "Select pieces offer 8 bespoke Nordic earth tones. Custom upholstery takes 4 to 6 weeks from our Copenhagen workshop.",
  },
];

const FAQS_COL_3: FaqItem[] = [
  {
    id: "f9",
    category: "STRENGTH & DURABILITY",
    question: "Are dining chairs and loungers strength-tested?",
    answer: "All seating exceeds European residential safety standards (EN 16139) with solid mortise-and-tenon joinery rated for generations.",
  },
  {
    id: "f10",
    category: "SUSTAINABILITY",
    question: "How is the furniture packaged during transit?",
    answer: "We use 100% biodegradable corrugated cardboard and organic cotton dustcovers with zero non-recyclable plastics.",
  },
  {
    id: "f11",
    category: "ASSEMBLY",
    question: "Do accent chairs and credenzas require assembly?",
    answer: "Chairs, lounges, and side tables arrive fully assembled. Dining tables and bed frames require minor hardware fastening included in delivery.",
  },
  {
    id: "f12",
    category: "BOUCLÉ CARE",
    question: "How do I care for bouclé lounge seating?",
    answer: "Gently vacuum weekly with a soft brush nozzle. Bouclé naturally repels light moisture; blot any accidental spills promptly with a dry cloth.",
  },
];

const FAQS_COL_4: FaqItem[] = [
  {
    id: "f13",
    category: "SPATIAL ARCHITECTURE",
    question: "Can I save custom room layouts?",
    answer: "Yes, members can save high-resolution spatial compositions, compare wood tones, and export architectural layouts.",
  },
  {
    id: "f14",
    category: "ORGANIC LEATHERS",
    question: "How does natural Scandinavian leather age?",
    answer: "Our vegetable-tanned leathers are uncoated, allowing them to soften and develop a rich amber caramel character over decades.",
  },
  {
    id: "f15",
    category: "LOGISTICS DISPATCH",
    question: "How is delivery scheduled?",
    answer: "Once your pieces reach your local regional hub, our logistics concierge contacts you to select a 2-hour delivery window.",
  },
  {
    id: "f16",
    category: "DESIGN CONCIERGE",
    question: "Do you offer complimentary design advice?",
    answer: "Our Copenhagen design team is available via chat and video consultation to assist with spatial palettes and floorplan flow.",
  },
];

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <div className="w-80 sm:w-92 p-5 rounded-2xl bg-[#FCFBF8]/85 backdrop-blur-md border border-[#DCD6CB]/80 shadow-md transition-all duration-300 hover:border-[#42483A]/40 hover:bg-[#FCFBF8]/95 select-none">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7965] block mb-1.5">
        {item.category}
      </span>
      <h3 className="text-sm font-semibold text-[#42483A] leading-snug mb-2 font-serif">
        {item.question}
      </h3>
      <p className="text-xs text-[#6B655C] leading-relaxed">
        {item.answer}
      </p>
    </div>
  );
}

function MarqueeColumn({
  items,
  animationClass,
}: {
  items: FaqItem[];
  animationClass: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden select-none">
      {/* Container with gap-5 and pb-5 creates a mathematically exact 50% loop */}
      <div className={`flex flex-col gap-5 pb-5 ${animationClass}`}>
        {items.map((item, idx) => (
          <FaqCard key={`set1-${item.id}-${idx}`} item={item} />
        ))}
        {items.map((item, idx) => (
          <FaqCard key={`set2-${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function Faq3DMarquee() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 3D Perspective Plane - Zoomed in and shifted to fully cover left side and eliminate negative space */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          perspective: "1200px",
          perspectiveOrigin: "40% 50%",
        }}
      >
        <div
          className="flex gap-5 sm:gap-7 opacity-42 sm:opacity-50 transition-all duration-500 w-[140vw] sm:w-[130vw] min-w-[1300px] justify-center -translate-x-8 sm:-translate-x-16"
          style={{
            transform: "rotateX(10deg) rotateY(-8deg) rotateZ(2deg) scale(1.42)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Column 1 - Leftmost, covers left-edge negative space completely */}
          <MarqueeColumn items={FAQS_COL_4} animationClass="animate-marquee-infinite-down-slow" />

          {/* Column 2 - Scrolling Up */}
          <MarqueeColumn items={FAQS_COL_1} animationClass="animate-marquee-infinite-up" />

          {/* Column 3 - Scrolling Down */}
          <MarqueeColumn items={FAQS_COL_2} animationClass="animate-marquee-infinite-down" />

          {/* Column 4 - Scrolling Up Slow (Right side) */}
          <MarqueeColumn items={FAQS_COL_3} animationClass="animate-marquee-infinite-up-slow" />
        </div>
      </div>

      {/* Atmospheric Vignette & Soft Gradient Overlay to preserve form readability while keeping all sides vibrant */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#F6F3ED]/30 to-[#F6F3ED]/80 pointer-events-none" />
    </div>
  );
}
