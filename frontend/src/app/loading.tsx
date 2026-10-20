import { Layers } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)] px-4">
      <div className="relative flex items-center justify-center mb-4">
        {/* Pulsing ring */}
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-sand-beige)] animate-ping opacity-30 absolute"></div>
        <div className="h-14 w-14 rounded-2xl bg-[var(--color-sage-green)] text-white flex items-center justify-center shadow-md relative z-10 animate-bounce">
          <Layers className="h-7 w-7" />
        </div>
      </div>
      <span className="font-heading text-lg text-[var(--color-forest-charcoal)] tracking-wider">
        PIXABUILD SPATIAL ENGINE
      </span>
      <p className="text-xs text-[var(--color-muted-taupe)] font-mono mt-1 animate-pulse">
        Loading neural weights & catalog tensors...
      </p>
    </div>
  );
}
