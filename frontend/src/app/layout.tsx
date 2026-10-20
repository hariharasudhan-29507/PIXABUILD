import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pixabuild.vercel.app"),
  title: {
    default: "PixaBuild — Spatial AI Furniture & Architecture",
    template: "%s | PixaBuild"
  },
  description: "Imagine it. Before it's yours. Curated Scandinavian furniture with spatial room visualization and photorealistic architectural staging.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "PixaBuild — Minimalist Spatial Furniture",
    description: "Imagine it. Before it's yours. Discover curated Scandinavian designs and stage them inside your real room.",
    url: "https://pixabuild.local",
    siteName: "PixaBuild",
    images: [
      {
        url: "/hero_furniture.png",
        width: 1536,
        height: 1024,
        alt: "PixaBuild Scandinavian Armchair in Daylight Interior",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F5F0] text-[#30352D] font-body selection:bg-[#78816A]/20">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
