"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { STORAGE_KEYS, recordActivity } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

interface AdminOrder {
  order_id: string;
  date: string;
  total: number;
  itemsCount: number;
  status: "Confirmed" | "In Transit" | "Delivered" | "Cancelled";
  shipping_city: string;
  customer_name?: string;
  customer_email?: string;
  payment_method?: string;
}

const INITIAL_ORDERS: AdminOrder[] = [
  {
    order_id: "SE-498210",
    date: "Oct 18, 2026",
    total: 1048.0,
    itemsCount: 2,
    status: "In Transit",
    shipping_city: "Copenhagen",
    customer_name: "Elena Lindqvist",
    customer_email: "elena.lindqvist@ikea.design",
    payment_method: "White-Glove COD",
  },
  {
    order_id: "SE-883192",
    date: "Oct 19, 2026",
    total: 789.0,
    itemsCount: 1,
    status: "Confirmed",
    shipping_city: "Stockholm",
    customer_name: "Marcus Karlsson",
    customer_email: "marcus.karlsson@interior.se",
    payment_method: "Credit Card (Stripe)",
  },
  {
    order_id: "SE-310459",
    date: "Oct 16, 2026",
    total: 2140.0,
    itemsCount: 4,
    status: "Delivered",
    shipping_city: "Gothenburg",
    customer_name: "Astrid Lindgren",
    customer_email: "astrid@arch.se",
    payment_method: "White-Glove COD",
  },
  {
    order_id: "SE-192847",
    date: "Oct 15, 2026",
    total: 420.0,
    itemsCount: 1,
    status: "Delivered",
    shipping_city: "Malmö",
    customer_name: "Lars Nygård",
    customer_email: "lars@studio.dk",
    payment_method: "Credit Card (Stripe)",
  },
  {
    order_id: "SE-902143",
    date: "Oct 14, 2026",
    total: 540.0,
    itemsCount: 2,
    status: "Cancelled",
    shipping_city: "Aarhus",
    customer_name: "Sofia Holm",
    customer_email: "sofia@nordic.no",
    payment_method: "Credit Card (Stripe)",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.length > 0) {
          // Merge with initial rich fields if missing
          const enriched = stored.map((o: any, idx: number) => ({
            ...o,
            customer_name: o.customer_name || INITIAL_ORDERS[idx % INITIAL_ORDERS.length].customer_name,
            customer_email: o.customer_email || INITIAL_ORDERS[idx % INITIAL_ORDERS.length].customer_email,
            payment_method: o.payment_method || "White-Glove COD",
          }));
          setOrders(enriched);
          return;
        }
      }
      setOrders(INITIAL_ORDERS);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    } catch {
      setOrders(INITIAL_ORDERS);
    }
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: AdminOrder["status"]) => {
    const updated = orders.map((o) => (o.order_id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    } catch {}
    recordActivity("ADMIN_ORDER_STATUS_UPDATED", { orderId, newStatus });
    if (selectedOrder && selectedOrder.order_id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_city.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : o.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const inTransitCount = orders.filter((o) => o.status === "In Transit").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const getStatusBadge = (status: AdminOrder["status"]) => {
    switch (status) {
      case "Confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Confirmed
          </span>
        );
      case "In Transit":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3" /> In Transit
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold">
            Fulfillment Logistics
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#30352D] mt-0.5">
            ORDER FULFILLMENT & LOGISTICS
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            Total Volume
          </span>
          <div className="font-serif text-2xl text-[#30352D] mt-1">{orders.length}</div>
          <span className="text-[11px] text-[#78816A]">All recorded customer orders</span>
        </div>
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            Net Revenue
          </span>
          <div className="font-serif text-2xl text-[#30352D] mt-1">
            {formatINR(totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-700">Excludes cancelled dispatches</span>
        </div>
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            In Transit
          </span>
          <div className="font-serif text-2xl text-blue-700 mt-1">{inTransitCount}</div>
          <span className="text-[11px] text-[#8C7965]">White-glove couriers active</span>
        </div>
        <div className="pixa-card bg-[#FFFFFF] p-4">
          <span className="text-[10px] font-accent uppercase tracking-wider text-[#8C7965]">
            Delivered
          </span>
          <div className="font-serif text-2xl text-emerald-700 mt-1">{deliveredCount}</div>
          <span className="text-[11px] text-[#78816A]">100% room placement success</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="pixa-card bg-[#FFFFFF] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7965]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name, email, or destination city..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F5F0] border border-[#E6DFD2] rounded-md focus:outline-none focus:border-[#30352D]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["all", "Confirmed", "In Transit", "Delivered", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-[#30352D] text-white"
                  : "bg-[#F7F5F0] text-[#30352D] hover:bg-[#E6DFD2]"
              }`}
            >
              {status === "all" ? "All Statuses" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="pixa-card bg-[#FFFFFF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5F0] border-b border-[#E6DFD2] text-[#8C7965] font-accent uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD2]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#8C7965]">
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-[#F7F5F0]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#30352D]">{o.order_id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#30352D]">{o.customer_name || "Guest Customer"}</div>
                      <div className="text-[10px] text-[#8C7965]">{o.customer_email || "no-email@pixabuild.se"}</div>
                    </td>
                    <td className="py-3 px-4 text-[#8C7965]">{o.date}</td>
                    <td className="py-3 px-4 text-[#30352D]">{o.itemsCount} pcs</td>
                    <td className="py-3 px-4 font-semibold text-[#30352D]">
                      {formatINR(Number(o.total))}
                    </td>
                    <td className="py-3 px-4 text-[#30352D]">{o.shipping_city}</td>
                    <td className="py-3 px-4">{getStatusBadge(o.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2 py-1 rounded bg-[#F7F5F0] hover:bg-[#E6DFD2] text-[11px] font-medium text-[#30352D] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            updateOrderStatus(o.order_id, e.target.value as AdminOrder["status"])
                          }
                          className="px-2 py-1 bg-[#F7F5F0] border border-[#E6DFD2] rounded text-[11px] font-medium text-[#30352D] focus:outline-none"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="pixa-card bg-[#FFFFFF] max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E6DFD2] pb-3">
              <div>
                <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965]">
                  Order Manifest
                </span>
                <h3 className="font-serif text-xl text-[#30352D]">{selectedOrder.order_id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#8C7965] hover:text-[#30352D] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E6DFD2]/50">
                <span className="text-[#8C7965]">Date Placed:</span>
                <span className="font-medium text-[#30352D]">{selectedOrder.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6DFD2]/50">
                <span className="text-[#8C7965]">Customer:</span>
                <span className="font-medium text-[#30352D]">
                  {selectedOrder.customer_name} ({selectedOrder.customer_email})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6DFD2]/50">
                <span className="text-[#8C7965]">Delivery Destination:</span>
                <span className="font-medium text-[#30352D]">{selectedOrder.shipping_city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6DFD2]/50">
                <span className="text-[#8C7965]">Items Count:</span>
                <span className="font-medium text-[#30352D]">{selectedOrder.itemsCount} curated items</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6DFD2]/50">
                <span className="text-[#8C7965]">Payment Method:</span>
                <span className="font-medium text-[#30352D]">{selectedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6DFD2]/50">
                <span className="text-[#8C7965]">Total Amount:</span>
                <span className="font-serif text-base font-bold text-[#30352D]">
                  {formatINR(Number(selectedOrder.total))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#8C7965]">Current Fulfillment Status:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6DFD2]">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded bg-[#30352D] text-white text-xs font-medium hover:bg-[#30352D]/90"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
