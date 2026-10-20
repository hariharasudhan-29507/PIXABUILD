import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="my-3 flex items-center gap-1.5 text-xs text-[var(--color-muted-taupe)]">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-[var(--color-forest-charcoal)] transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-[var(--color-muted-taupe)]/60" />
            {isLast || !item.href ? (
              <span className="font-medium text-[var(--color-forest-charcoal)]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-[var(--color-forest-charcoal)] transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
