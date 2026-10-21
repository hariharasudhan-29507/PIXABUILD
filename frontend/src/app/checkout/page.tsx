"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { STORAGE_KEYS, recordActivity, getCurrentUser, recordOrderToSupabase } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email address is required"),
  address: z.string().min(6, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(3, "Valid postal code is required"),
  phone: z.string().min(6, "Phone number is required for freight delivery"),
});

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<{ price: number; quantity: number; name: string }[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      if (raw) setCart(JSON.parse(raw));
      const cur = getCurrentUser();
      if (cur) {
        setForm((prev) => ({
          ...prev,
          firstName: cur.first_name,
          lastName: cur.last_name,
          email: cur.email,
        }));
      }
    } catch {}
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 15000 || subtotal === 0 ? 0 : 1499;
  const total = subtotal + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const res = checkoutSchema.safeParse(form);
    if (!res.success) {
      const errMap: Record<string, string> = {};
      for (const err of res.error.issues) {
        if (err.path[0]) errMap[err.path[0] as string] = err.message;
      }
      setErrors(errMap);
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      const newOrderId = "SE-" + Math.floor(100000 + Math.random() * 900000);
      setIsSubmitting(false);
      setOrderId(newOrderId);

      // Save order to Supabase orders table and history
      await recordOrderToSupabase({
        order_id: newOrderId,
        total,
        items_count: cart.length,
        shipping_address: form,
        payment_method: paymentMethod,
      });

      // Clear cart
      localStorage.removeItem(STORAGE_KEYS.CART);
      window.dispatchEvent(new Event("cart_updated"));
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
        <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />

        {orderId ? (
          <div className="pixa-card bg-[#FFFFFF] max-w-lg mx-auto my-12 p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#78816A] text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-2xl text-[#30352D]">
              ORDER {orderId} VERIFIED
            </h1>
            <p className="text-xs text-[#74736B] leading-relaxed">
              Your shipping confirmation has been dispatched to <strong>{form.email}</strong>. Our logistics team will coordinate freight delivery to <strong>{form.city}</strong>.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Link href="/orders" className="btn-primary text-xs py-2.5 px-4">
                View My Orders
              </Link>
              <Link href="/catalog" className="btn-secondary text-xs py-2.5 px-4">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 my-6">
            {/* Form Details (7 cols) */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="pixa-card bg-[#FFFFFF] p-6 space-y-5">
                <div className="border-b border-[var(--border-subtle)] pb-3">
                  <h2 className="font-serif text-xl text-[#30352D]">
                    1. Shipping & Contact Details
                  </h2>
                  <p className="text-xs text-[#74736B]">
                    Enter the delivery address for white-glove freight delivery.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                    />
                    {errors.firstName && <p className="text-[10px] text-red-600 mt-0.5">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                    />
                    {errors.lastName && <p className="text-[10px] text-red-600 mt-0.5">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                    />
                    {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+45 80 88 12 34"
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                    />
                    {errors.phone && <p className="text-[10px] text-red-600 mt-0.5">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Strøget 42, Apt 3B"
                    className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                  />
                  {errors.address && <p className="text-[10px] text-red-600 mt-0.5">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Copenhagen"
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                    />
                    {errors.city && <p className="text-[10px] text-red-600 mt-0.5">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      placeholder="1160"
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2 bg-[#F7F5F0]"
                    />
                    {errors.postalCode && <p className="text-[10px] text-red-600 mt-0.5">{errors.postalCode}</p>}
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2">
                  <h3 className="font-serif text-lg text-[#30352D]">
                    2. Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-3 rounded border text-left text-xs transition-all ${
                        paymentMethod === "cod"
                          ? "border-[#30352D] bg-[#F7F5F0] font-semibold"
                          : "border-[var(--border-subtle)] hover:bg-[#F7F5F0]"
                      }`}
                    >
                      <div className="font-medium text-[#30352D]">White-Glove Pay on Delivery</div>
                      <div className="text-[11px] text-[#74736B]">Inspect in your room before paying</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded border text-left text-xs transition-all ${
                        paymentMethod === "card"
                          ? "border-[#30352D] bg-[#F7F5F0] font-semibold"
                          : "border-[var(--border-subtle)] hover:bg-[#F7F5F0]"
                      }`}
                    >
                      <div className="font-medium text-[#30352D]">Encrypted Card / Demo</div>
                      <div className="text-[11px] text-[#74736B]">Secure checkout token</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="btn-primary w-full py-3 text-xs justify-center"
                >
                  {isSubmitting ? "Finalizing Order..." : `Place Order (${formatINR(total)})`}
                </button>
              </form>
            </div>

            {/* Order Summary (5 cols) */}
            <div className="lg:col-span-5">
              <div className="pixa-card bg-[#FFFFFF] p-6 space-y-4 sticky top-24">
                <h3 className="font-serif text-lg text-[#30352D] border-b border-[var(--border-subtle)] pb-2">
                  Order Summary ({cart.length} items)
                </h3>

                <div className="space-y-2 text-xs divide-y divide-[var(--border-subtle)]">
                  {cart.map((i, idx) => (
                    <div key={idx} className="flex justify-between pt-2">
                      <span className="text-[#30352D]">{i.name} × {i.quantity}</span>
                      <span className="font-mono">{formatINR(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-3 space-y-1.5 text-xs text-[#74736B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-[#30352D]">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Freight Delivery</span>
                    <span className="font-mono text-[#30352D]">{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#30352D] pt-2 border-t border-[var(--border-subtle)]">
                    <span>Total Due</span>
                    <span className="font-mono text-[#B96E4B]">{formatINR(total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#74736B] pt-2">
                  <ShieldCheck className="h-4 w-4 text-[#78816A]" />
                  <span>Backed by PixaBuild 30-Day Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
