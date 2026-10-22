"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = contactSchema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      for (const err of res.error.issues) {
        if (err.path[0]) errs[err.path[0] as string] = err.message;
      }
      setErrors(errs);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#30352D]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Customer Concierge" }]} />

        <div className="max-w-4xl mx-auto my-8 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-5">
            <span className="text-[10px] font-accent uppercase tracking-widest text-[#8C7965] font-semibold block">
              Direct Inquiries
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#30352D]">
              We&apos;re Here to Assist Your Space
            </h1>
            <p className="text-xs text-[#74736B] leading-relaxed">
              Have questions regarding wood finishes, fabric swatches, or room visualization resolution? Our design advisory team responds within 1 business day.
            </p>

            <div className="space-y-3 pt-4 text-xs text-[#30352D]">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#78816A]" />
                <span>Bredgade 28, 1260 København K, Denmark</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#78816A]" />
                <span>concierge@pixabuild.studio</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#78816A]" />
                <span>+45 33 12 84 90 (Mon-Fri 09:00 - 18:00 CET)</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="pixa-card bg-[#FFFFFF] p-6">
              {submitted ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-[#78816A] mx-auto" />
                  <h3 className="font-serif text-xl text-[#30352D]">Message Received</h3>
                  <p className="text-xs text-[#74736B]">
                    Thank you, {form.name}. An interior consultant will follow up at {form.email}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Your Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2.5 bg-[#F7F5F0]"
                    />
                    {errors.name && <p className="text-[10px] text-red-600 mt-0.5">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2.5 bg-[#F7F5F0]"
                    />
                    {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Inquiry or Room Details</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full text-xs rounded border border-[var(--border-strong)] p-2.5 bg-[#F7F5F0]"
                      placeholder="Share your spatial dimensions or product question..."
                    />
                    {errors.message && <p className="text-[10px] text-red-600 mt-0.5">{errors.message}</p>}
                  </div>

                  <button type="submit" className="btn-primary text-xs w-full py-2.5 justify-center">
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
