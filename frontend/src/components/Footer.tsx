import Link from "next/link";
import { Compass, Sparkles, Shield, Cpu, Eye, BookOpen, Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--color-sand-beige)] text-[var(--color-forest-charcoal)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-sage-green)] text-white">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg tracking-wider">PIXABUILD</span>
            </div>
            <p className="text-xs text-[var(--color-muted-taupe)] leading-relaxed">
              Curated Scandinavian furniture and spatial room visualization for light-filled, architecturally proportioned homes.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted-taupe)]">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600"></span>
              <span>PixaBuild Atelier Collection Connected</span>
            </div>
          </div>

          {/* Spatial Standards */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-forest-charcoal)]">
              Spatial Standards
            </h4>
            <ul className="space-y-2 text-xs text-[var(--color-muted-taupe)]">
              <li className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-[var(--color-sage-green)]" />
                <span>1:1 Metric Scale Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-[var(--color-sage-green)]" />
                <span>Perspective Ground Lock</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-[var(--color-sage-green)]" />
                <span>Directional Contact Shadows</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
                <span>Ambient Daylight Harmonization</span>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-forest-charcoal)]">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog" className="text-[var(--color-muted-taupe)] hover:text-[var(--color-forest-charcoal)] transition-colors">
                  Curated Catalog (36 Works)
                </Link>
              </li>
              <li>
                <Link href="/visualize" className="text-[var(--color-muted-taupe)] hover:text-[var(--color-forest-charcoal)] transition-colors">
                  Room Visualizer Studio
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-[var(--color-muted-taupe)] hover:text-[var(--color-forest-charcoal)] transition-colors">
                  Shopping Cart & Orders
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="text-[var(--color-muted-taupe)] hover:text-[var(--color-terracotta)] transition-colors">
                  Admin Analytics & Monitoring
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Status */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--color-forest-charcoal)]">
              Compliance & Index
            </h4>
            <ul className="space-y-2 text-xs text-[var(--color-muted-taupe)]">
              <li>
                <Link href="/sitemap.xml" className="hover:text-[var(--color-forest-charcoal)] transition-colors">
                  sitemap.xml
                </Link>
              </li>
              <li>
                <Link href="/robots.txt" className="hover:text-[var(--color-forest-charcoal)] transition-colors">
                  robots.txt
                </Link>
              </li>
              <li>Default Admin: <code className="bg-[var(--color-warm-ivory)] px-1.5 py-0.5 rounded text-[10px]">admin / admin123</code></li>
              <li className="pt-2 text-[10px]">© 2026 PixaBuild Systems. All rights reserved.</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
