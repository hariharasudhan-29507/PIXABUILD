"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Truck, CheckCircle2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { STORAGE_KEYS } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

interface OrderData {
  order_id: string;
  date: string;
  total: number;
  itemsCount: number;
  status: string;
  shipping_city: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (raw) {
        setOrders(JSON.parse(raw));
      } else {
        // Seed initial sample order
        const seed: OrderData[] = [
          {
            order_id: "SE-498210",
            date: "Oct 18, 2026",
            total: 1048.00,
            itemsCount: 2,
            status: "In Transit",
            shipping_city: "Copenhagen",
          },
        ];
        setOrders(seed);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(seed));
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
        <Breadcrumbs items={[{ label: "Account", href: "/profile" }, { label: "My Orders" }]} />

        <div className="my-6 pb-4 border-b border-[var(--border-subtle)]">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
            Fulfillment & Delivery
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D] mt-1">
            PURCHASE HISTORY ({orders.length})
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="pixa-card bg-[#FFFFFF] text-center py-16 max-w-md mx-auto space-y-3">
            <Package className="h-8 w-8 text-[#8C7965] mx-auto opacity-50" />
            <h3 className="font-serif text-lg text-[#30352D]">No Orders Recorded Yet</h3>
            <p className="text-xs text-[#74736B]">
              Browse the curated catalog and stage furniture inside your space to make an order.
            </p>
            <Link href="/catalog" className="btn-primary text-xs py-2 px-4 inline-flex">
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="pixa-card bg-[#FFFFFF] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[var(--border-subtle)]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#30352D]">
                      #{order.order_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6DFD2] text-[#30352D]">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#74736B]">
                    Placed on {order.date} · Destination: {order.shipping_city}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-[#8C7965] block">{order.itemsCount} furniture piece(s)</span>
                    <span className="text-base font-bold font-mono text-[#30352D]">
                      {formatINR(order.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#78816A] font-medium">
                    <Truck className="h-4 w-4" />
                    <span>White-Glove Tracking Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
