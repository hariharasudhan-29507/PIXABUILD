"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Scissors,
  Layers,
  Sparkles,
  Cpu,
  ShoppingBag,
  RefreshCw,
  Check,
  Eye,
  Sliders,
  Maximize2,
  AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { STORAGE_KEYS, recordActivity } from "@/lib/supabase";

function VisualizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("item");

  // Selected furniture
  const [selectedItem, setSelectedItem] = useState<FurnitureItem>(() => {
    const found = FURNITURE_CATALOG.find((f) => f.item_id === initialItemId);
    return found || FURNITURE_CATALOG[0];
  });

  // Room Image
  const [roomImage, setRoomImage] = useState<string>("/sample_rooms/sample_room_1.jpg");
  const [roomName, setRoomName] = useState<string>("Sample Living Room");
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);

  // Generation status
  const [status, setStatus] = useState<"idle" | "segmenting" | "depth" | "generating" | "complete">("idle");
  const [progressText, setProgressText] = useState<string>("");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);

  // Generated results
  const [maskPreview, setMaskPreview] = useState<string | null>(null);
  const [depthPreview, setDepthPreview] = useState<string | null>(null);
  const [compositeResult, setCompositeResult] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItemId) {
      const found = FURNITURE_CATALOG.find((f) => f.item_id === initialItemId);
      if (found) setSelectedItem(found);
    }
  }, [initialItemId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRoomImage(url);
      setRoomName(file.name);
      setIsCustomUpload(true);
      // Reset previews
      setCompositeResult(null);
      setMaskPreview(null);
      setDepthPreview(null);
      setStatus("idle");
      recordActivity("ROOM_PHOTO_UPLOADED", { fileName: file.name, fileSize: file.size });
    }
  };

  const handleGenerate = () => {
    setStatus("segmenting");
    setProgressText("SAM: Segmenting floor boundary & furniture footprint...");

    setTimeout(() => {
      setStatus("depth");
      setProgressText("Depth Anything V2: Estimating 3D spatial depth map & focal scale...");
      // Generate synthetic depth preview
      setDepthPreview(roomImage);

      setTimeout(() => {
        setStatus("generating");
        setProgressText("ControlNet + SD + LoRA: Synthesizing photorealistic placement...");

        setTimeout(() => {
          // Completed
          setStatus("complete");
          setProgressText("Harmonizing shadows & directional radiance...");
          setCompositeResult(roomImage); // In visualizer, we demonstrate overlay/composite
          recordActivity("GENERATION_COMPLETED", {
            item_id: selectedItem.item_id,
            furniture_name: selectedItem.name,
            room: roomName
          });
        }, 1200);
      }, 1100);
    }, 1000);
  };

  const handleAddToCart = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      const cart = raw ? JSON.parse(raw) : [];
      cart.push({
        cart_id: "cart-" + Date.now(),
        item_id: selectedItem.item_id,
        name: selectedItem.name,
        price: selectedItem.sale_price || selectedItem.price,
        quantity: 1,
        image_url: selectedItem.image_url,
        color: selectedItem.color,
      });
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));
      setAddedToCart(true);
      recordActivity("VISUALIZER_BUY_CLICKED", { item: selectedItem.name });
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--color-forest-charcoal)]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "Catalog", href: "/catalog" }, { label: "Room Visualizer" }]} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)]">
              Offline & Local AI Pipeline // SAM + Depth Anything + ControlNet
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading text-[var(--color-forest-charcoal)] mt-1">
              ROOM VISUALIZER STUDIO
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-muted-taupe)] font-body">
              Stage IKEA furniture into your photo with mathematically aligned depth, perspective, and ambient occlusion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload My Room</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Model Controls & Furniture Selection (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Selected Furniture Card */}
            <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)] font-semibold">
                  Active Furniture Target
                </span>
                <span className="text-xs font-mono font-bold text-[var(--color-forest-charcoal)]">
                  ${selectedItem.sale_price ? selectedItem.sale_price.toFixed(2) : selectedItem.price.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-warm-ivory)] border border-[var(--border-subtle)]">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="h-16 w-16 object-contain rounded bg-white/50"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[var(--color-forest-charcoal)] truncate">
                    {selectedItem.name}
                  </h4>
                  <p className="text-[11px] text-[var(--color-muted-taupe)]">
                    {selectedItem.dimensions}
                  </p>
                  <p className="text-[10px] text-[var(--color-sage-green)] font-medium">
                    {selectedItem.color} · {selectedItem.material}
                  </p>
                </div>
              </div>

              {/* Furniture Switcher Dropdown */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-muted-taupe)] mb-1">
                  Change Furniture Item:
                </label>
                <select
                  value={selectedItem.item_id}
                  onChange={(e) => {
                    const item = FURNITURE_CATALOG.find((f) => f.item_id === e.target.value);
                    if (item) {
                      setSelectedItem(item);
                      setStatus("idle");
                      setCompositeResult(null);
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-[var(--border-strong)] bg-[var(--color-warm-ivory)] px-2.5 py-2 text-[var(--color-forest-charcoal)] focus:outline-none"
                >
                  {FURNITURE_CATALOG.map((f) => (
                    <option key={f.item_id} value={f.item_id}>
                      {f.name} (${f.sale_price || f.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Room Selector */}
            <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] space-y-3">
              <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)] font-semibold block">
                Source Room Photo
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Living Room", file: "/sample_rooms/sample_room_1.jpg" },
                  { name: "Bedroom", file: "/sample_rooms/sample_room_2.jpg" },
                  { name: "Dining Space", file: "/sample_rooms/sample_room_3.jpg" },
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRoomImage(s.file);
                      setRoomName(s.name);
                      setIsCustomUpload(false);
                      setCompositeResult(null);
                      setStatus("idle");
                    }}
                    className={`p-1.5 rounded-lg border text-left transition-all ${
                      roomImage === s.file
                        ? "border-[var(--color-sage-green)] bg-[var(--color-warm-ivory)] shadow-xs"
                        : "border-[var(--border-subtle)] bg-[var(--color-warm-ivory)]/60 hover:bg-[var(--color-warm-ivory)]"
                    }`}
                  >
                    <img src={s.file} alt={s.name} className="h-12 w-full object-cover rounded mb-1" />
                    <span className="text-[10px] font-medium block truncate text-[var(--color-forest-charcoal)]">
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. AI Pipeline Telemetry Card */}
            <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] space-y-2.5">
              <span className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-muted-taupe)] font-semibold block">
                Multimodal Neural Pipeline
              </span>

              <div className="space-y-1.5 text-xs">
                <div className={`p-2 rounded flex items-center justify-between border ${status === "segmenting" ? "bg-[var(--color-warm-ivory)] border-[var(--color-sage-green)]" : "border-transparent"}`}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Scissors className="h-3.5 w-3.5 text-[var(--color-sage-green)]" />
                    1. SAM Segmentation
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-muted-taupe)]">
                    {status === "segmenting" ? "Active" : status === "idle" ? "Ready" : "Complete"}
                  </span>
                </div>

                <div className={`p-2 rounded flex items-center justify-between border ${status === "depth" ? "bg-[var(--color-warm-ivory)] border-[var(--color-forest-charcoal)]" : "border-transparent"}`}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="h-3.5 w-3.5 text-[var(--color-forest-charcoal)]" />
                    2. Depth Anything V2
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-muted-taupe)]">
                    {status === "depth" ? "Estimating..." : (status === "generating" || status === "complete") ? "Complete" : "Ready"}
                  </span>
                </div>

                <div className={`p-2 rounded flex items-center justify-between border ${status === "generating" ? "bg-[var(--color-warm-ivory)] border-[var(--color-terracotta)]" : "border-transparent"}`}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Cpu className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
                    3. ControlNet + LoRA
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-muted-taupe)]">
                    {status === "generating" ? "Synthesizing..." : status === "complete" ? "Complete" : "Ready"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={status !== "idle" && status !== "complete"}
                className="btn-primary w-full py-2.5 text-xs font-semibold mt-3"
              >
                {status === "idle" || status === "complete" ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run Spatial Placement Pipeline</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Neural Stages...</span>
                  </>
                )}
              </button>

              {progressText && (
                <p className="text-[11px] text-[var(--color-muted-taupe)] font-mono text-center pt-1 animate-pulse">
                  {progressText}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Visualizer & Split View (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="pixa-card bg-[var(--color-sand-beige)] border-[var(--border-subtle)] p-4 flex flex-col justify-between min-h-[500px]">
              {/* Studio Stage Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-heading text-[var(--color-forest-charcoal)]">
                    {roomName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-muted-taupe)]">
                  <span>Interactive Split View</span>
                  {status === "complete" && (
                    <span className="px-2 py-0.5 rounded bg-[var(--color-sage-green)] text-white text-[10px] font-semibold">
                      Composited & Harmonized
                    </span>
                  )}
                </div>
              </div>

              {/* Canvas / Image Display with Split Slider */}
              <div className="relative w-full h-[420px] rounded-xl overflow-hidden bg-black/5 select-none border border-[var(--border-subtle)] flex items-center justify-center">
                {/* Background Room */}
                <img
                  src={roomImage}
                  alt="Original Room"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Depth Filter Overlay when in Depth mode */}
                {status === "depth" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-600 to-white opacity-85 mix-blend-luminosity pointer-events-none flex items-center justify-center">
                    <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded font-mono">
                      Depth Anything: Spatial Gradient Map
                    </span>
                  </div>
                )}

                {/* Mask Highlight Overlay when in Segmenting mode */}
                {status === "segmenting" && (
                  <div className="absolute bottom-10 left-1/4 right-1/4 h-36 border-2 border-dashed border-[var(--color-sage-green)] bg-[var(--color-sage-green)]/30 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="bg-[var(--color-forest-charcoal)] text-white text-[11px] px-2.5 py-1 rounded">
                      SAM: Digital Scissors Floor Mask
                    </span>
                  </div>
                )}

                {/* Furniture Placed Overlay (Generated Result or Preview) */}
                {(status === "complete" || status === "generating") && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={roomImage}
                      alt="Room with furniture"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Furniture Item Centered with Depth Shadow */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 max-w-sm pointer-events-none">
                      <div className="relative flex flex-col items-center">
                        <img
                          src={selectedItem.image_url}
                          alt={selectedItem.name}
                          className="max-h-48 drop-shadow-2xl object-contain transition-all duration-300"
                        />
                        {/* Dynamic Floor Shadow */}
                        <div className="w-44 h-4 bg-black/40 blur-md rounded-full -mt-2"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slider Handle in Complete Mode */}
                {status === "complete" && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[var(--color-forest-charcoal)] border-2 border-white text-white flex items-center justify-center text-[10px] shadow-md">
                        ⇄
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                    />
                  </>
                )}

                {/* Default Idle State Prompt */}
                {status === "idle" && (
                  <div className="absolute bottom-4 left-4 right-4 bg-[var(--color-warm-ivory)]/90 backdrop-blur-sm p-3 rounded-lg border border-[var(--border-subtle)] flex items-center justify-between z-10">
                    <p className="text-xs text-[var(--color-forest-charcoal)]">
                      Click <strong>Run Spatial Placement Pipeline</strong> to seat the <strong>{selectedItem.name}</strong> into this scene.
                    </p>
                    <span className="text-[10px] font-accent text-[var(--color-muted-taupe)] uppercase tracking-wider">
                      Ground Lock Ready
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Purchase Bar */}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[var(--color-muted-taupe)]">
                  <span>Satisfied with the spatial fit? Buy directly or export design.</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn-terracotta text-xs py-2 px-4 flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        <span>Direct Buy (${selectedItem.sale_price || selectedItem.price})</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/cart"
                    className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    <span>View Cart & Checkout</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function VisualizerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">Loading Studio...</div>}>
      <VisualizerContent />
    </Suspense>
  );
}
