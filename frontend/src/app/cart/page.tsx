"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  CreditCard
} from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { STORAGE_KEYS, recordActivity, getCurrentUser } from "@/lib/supabase";

interface CartItemData {
  cart_id: string;
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  color: string;
}

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(5, "Delivery address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(3, "Postal code is required"),
});

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      if (raw) setCart(JSON.parse(raw));
      const user = getCurrentUser();
      if (user) {
        setForm((prev) => ({
          ...prev,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.email,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateQuantity = (cartId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.cart_id === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItemData[];

    setCart(updated);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updated));
    window.dispatchEvent(new Event("cart_updated"));
  };

  const removeItem = (cartId: string) => {
    const updated = cart.filter((c) => c.cart_id !== cartId);
    setCart(updated);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updated));
    window.dispatchEvent(new Event("cart_updated"));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 300 || subtotal === 0 ? 0 : 35;
  const total = subtotal + shipping;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
      setIsSubmitting(false);
      setOrderComplete(orderId);
      // Clear cart
      localStorage.removeItem(STORAGE_KEYS.CART);
      window.dispatchEvent(new Event("cart_updated"));
      setCart([]);
      recordActivity("ORDER_PLACED", { orderId, total, itemsCount: cart.length });
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "Catalog", href: "/catalog" }, { label: "Shopping Cart" }]} />

        {/* Title */}
        <div className="mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
            Checkout & Fulfillment
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading text-[var(--color-forest-charcoal)] mt-1">
            SHOPPING CART
          </h1>
        </div>

        {orderComplete ? (
          <div className="pixa-card bg-[var(--color-sand-beige)] text-center py-12 px-6 max-w-xl mx-auto space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-sage-green)] text-white mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-heading text-[var(--color-forest-charcoal)]">
              ORDER CONFIRMED!
            </h2>
            <p className="text-xs text-[var(--color-muted-taupe)]">
              Your order <strong className="font-mono text-[var(--color-forest-charcoal)]">{orderComplete}</strong> has been logged to your account and forwarded to our regional IKEA warehouse for white-glove delivery.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Link href="/catalog" className="btn-primary text-xs py-2 px-4">
                Continue Shopping
              </Link>
              <Link href="/visualize" className="btn-secondary text-xs py-2 px-4">
                Stage Another Room
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="pixa-card bg-[var(--color-sand-beige)] text-center py-16 px-6 max-w-md mx-auto space-y-4">
            <ShoppingBag className="h-10 w-10 text-[var(--color-muted-taupe)] mx-auto opacity-40" />
            <h3 className="text-lg font-heading text-[var(--color-forest-charcoal)]">
              YOUR CART IS CURRENTLY EMPTY
            </h3>
            <p className="text-xs text-[var(--color-muted-taupe)]">
              Explore the curated IKEA catalog or stage a piece in your room using the AI visualizer.
            </p>
            <Link href="/catalog" className="btn-primary text-xs py-2.5 px-4 inline-flex">
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cart_id}
                  className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 object-contain rounded bg-[var(--color-warm-ivory)] p-1 border border-[var(--border-subtle)]"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--color-forest-charcoal)]">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[var(--color-muted-taupe)]">
                        Color: {item.color}
                      </p>
                      <p className="text-xs font-mono font-bold text-[var(--color-forest-charcoal)] mt-1">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)]">
                      <button
                        onClick={() => updateQuantity(item.cart_id, -1)}
                        className="p-1.5 text-[var(--color-forest-charcoal)] hover:bg-[var(--color-sand-beige)] rounded-l"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cart_id, 1)}
                        className="p-1.5 text-[var(--color-forest-charcoal)] hover:bg-[var(--color-sand-beige)] rounded-r"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.cart_id)}
                      className="p-2 text-[var(--color-muted-taupe)] hover:text-red-700 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Checkout (4 cols) */}
            <div className="lg:col-span-4">
              <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] space-y-4 sticky top-24">
                <h3 className="text-sm font-heading text-[var(--color-forest-charcoal)] border-b border-[var(--border-subtle)] pb-2">
                  ORDER SUMMARY
                </h3>

                <div className="space-y-2 text-xs text-[var(--color-forest-charcoal)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-taupe)]">Subtotal</span>
                    <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-taupe)]">Spatial Delivery</span>
                    <span className="font-mono font-medium">
                      {shipping === 0 ? "FREE (Orders > $300)" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2 text-sm font-bold">
                    <span>Total Amount</span>
                    <span className="font-mono text-[var(--color-terracotta)]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {!checkoutOpen ? (
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="btn-primary w-full py-2.5 text-xs font-medium"
                  >
                    <span>Proceed to Delivery & Payment</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)] block">
                      Delivery Address
                    </span>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                      />
                      {errors.fullName && <p className="text-[10px] text-red-600 mt-0.5">{errors.fullName}</p>}
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder="Email for tracking"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                      />
                      {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email}</p>}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                      />
                      {errors.address && <p className="text-[10px] text-red-600 mt-0.5">{errors.address}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="City"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                        />
                        {errors.city && <p className="text-[10px] text-red-600 mt-0.5">{errors.city}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={form.postalCode}
                          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-1.5 text-xs"
                        />
                        {errors.postalCode && <p className="text-[10px] text-red-600 mt-0.5">{errors.postalCode}</p>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-terracotta w-full py-2.5 text-xs font-medium"
                    >
                      {isSubmitting ? "Confirming Order..." : `Complete Purchase ($${total.toFixed(2)})`}
                    </button>
                  </form>
                )}

                <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted-taupe)] pt-2 border-t border-[var(--border-subtle)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-sage-green)]" />
                  <span>30-Day In-Home Return Guarantee</span>
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
