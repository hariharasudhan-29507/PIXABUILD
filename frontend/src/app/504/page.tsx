import Link from "next/link";
import { ServerCrash, RefreshCw, Home, Compass } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function GatewayTimeoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="pixa-card bg-[var(--color-sand-beige)] text-center max-w-lg w-full p-8 space-y-5 border-[var(--border-subtle)] shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-terracotta)] text-white mx-auto shadow-sm">
            <ServerCrash className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
              HTTP 504 // Neural Node Gateway Timeout
            </span>
            <h1 className="text-3xl font-heading text-[var(--color-forest-charcoal)]">
              GATEWAY TIMEOUT
            </h1>
            <p className="text-xs text-[var(--color-muted-taupe)] max-w-sm mx-auto leading-relaxed">
              The local AI inference worker (SAM / Depth Anything / ControlNet) took too long to complete the tensor pass. The GPU queue is reallocating VRAM.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/visualize" className="btn-primary text-xs py-2 px-4 w-full sm:w-auto">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Visualization</span>
            </Link>
            <Link href="/" className="btn-secondary text-xs py-2 px-4 w-full sm:w-auto">
              <Home className="h-3.5 w-3.5" />
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
