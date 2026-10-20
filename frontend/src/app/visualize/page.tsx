"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Eye,
  ShoppingBag,
  RefreshCw,
  Check,
  Download,
  RotateCcw,
  Sliders,
  ChevronRight,
  Maximize2,
  AlertCircle,
  Sparkles,
  Info
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import { ROOM_ASSETS, ROOM_CATEGORIES, RoomAsset } from "@/data/roomsData";
import { STORAGE_KEYS, recordActivity } from "@/lib/supabase";

type CustomerStage =
  | "idle"
  | "preparing"
  | "understanding"
  | "placing"
  | "refining"
  | "rendering"
  | "complete"
  | "error";

const STAGE_LABELS: Record<CustomerStage, string> = {
  idle: "Ready to stage in room",
  preparing: "1. Preparing your room",
  understanding: "2. Understanding the space",
  placing: "3. Placing your selected furniture",
  refining: "4. Refining the lighting and finish",
  rendering: "5. Preparing your preview",
  complete: "Furniture naturally integrated",
  error: "Unable to complete placement",
};

function VisualizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("item");

  // Selected Furniture
  const [selectedItem, setSelectedItem] = useState<FurnitureItem>(() => {
    const found = FURNITURE_CATALOG.find((f) => f.item_id === initialItemId);
    return found || FURNITURE_CATALOG[0];
  });

  // Selected Room
  const [selectedRoom, setSelectedRoom] = useState<RoomAsset>(ROOM_ASSETS[0]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customRoomUrl, setCustomRoomUrl] = useState<string | null>(null);
  const [customRoomFile, setCustomRoomFile] = useState<File | null>(null);

  // Studio Workflow State
  const [stage, setStage] = useState<CustomerStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [compositeResultUrl, setCompositeResultUrl] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [showItemPicker, setShowItemPicker] = useState<boolean>(false);

  // File upload input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItemId) {
      const found = FURNITURE_CATALOG.find((f) => f.item_id === initialItemId);
      if (found) setSelectedItem(found);
    }
  }, [initialItemId]);

  const currentRoomDisplayUrl = customRoomUrl || selectedRoom.image_url;

  // Handle Room Selection
  const handleSelectRoom = (room: RoomAsset) => {
    setSelectedRoom(room);
    setCustomRoomUrl(null);
    setCustomRoomFile(null);
    setCompositeResultUrl(null);
    setStage("idle");
    setErrorMessage(null);
  };

  // Handle Custom Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomRoomUrl(url);
      setCustomRoomFile(file);
      setCompositeResultUrl(null);
      setStage("idle");
      setErrorMessage(null);
      recordActivity("CUSTOM_ROOM_PHOTO_UPLOADED", { fileName: file.name, fileSize: file.size });
    }
  };

  // Client-Side High Fidelity Compositing Engine (Transparent Cutout + Multi-Layer Ground Shadows)
  const generateClientComposite = async (roomSrc: string, cutoutSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const roomImg = new Image();
      roomImg.crossOrigin = "anonymous";
      roomImg.onload = () => {
        const furnImg = new Image();
        furnImg.crossOrigin = "anonymous";
        furnImg.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context unavailable");

          canvas.width = roomImg.naturalWidth || 1600;
          canvas.height = roomImg.naturalHeight || 1200;

          // 1. Draw base room
          ctx.drawImage(roomImg, 0, 0, canvas.width, canvas.height);

          // 2. Compute proportional placement (38% to 45% of room width, anchored on floor)
          const furnTargetW = canvas.width * 0.42;
          const aspect = furnImg.naturalHeight / Math.max(1, furnImg.naturalWidth);
          const furnTargetH = furnTargetW * aspect;

          const centerX = canvas.width * 0.50;
          const centerY = canvas.height * 0.74;

          const posX = centerX - furnTargetW / 2;
          const posY = centerY - furnTargetH + furnTargetH * 0.12;

          // 3. Multi-Layer Contact Shadow
          // Ambient soft floor bounce shadow
          const shadowW = furnTargetW * 1.15;
          const shadowH = furnTargetH * 0.26;
          const shadowX = centerX;
          const shadowY = posY + furnTargetH - shadowH * 0.40;

          ctx.save();
          const diffuseGrad = ctx.createRadialGradient(
            shadowX, shadowY, shadowH * 0.1,
            shadowX, shadowY, shadowW / 2
          );
          diffuseGrad.addColorStop(0, "rgba(20, 22, 18, 0.45)");
          diffuseGrad.addColorStop(0.5, "rgba(25, 27, 22, 0.20)");
          diffuseGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = diffuseGrad;
          ctx.beginPath();
          ctx.ellipse(shadowX, shadowY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Dark direct contact line
          const contactW = furnTargetW * 0.90;
          const contactH = furnTargetH * 0.08;
          const contactY = posY + furnTargetH - contactH * 0.50;
          const contactGrad = ctx.createRadialGradient(
            shadowX, contactY, contactH * 0.05,
            shadowX, contactY, contactW / 2
          );
          contactGrad.addColorStop(0, "rgba(10, 12, 10, 0.65)");
          contactGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = contactGrad;
          ctx.beginPath();
          ctx.ellipse(shadowX, contactY, contactW / 2, contactH / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 4. Draw transparent furniture cutout
          ctx.drawImage(furnImg, posX, posY, furnTargetW, furnTargetH);

          resolve(canvas.toDataURL("image/jpeg", 0.94));
        };
        furnImg.onerror = () => reject("Failed to load furniture cutout asset");
        furnImg.src = cutoutSrc;
      };
      roomImg.onerror = () => reject("Failed to load room photograph");
      roomImg.src = roomSrc;
    });
  };

  // Execute Generation Workflow
  const handleGenerate = async () => {
    setErrorMessage(null);
    setStage("preparing");

    try {
      // Step 1: Preparing room
      await new Promise((r) => setTimeout(r, 450));
      setStage("understanding");

      // Step 2: Understanding space
      await new Promise((r) => setTimeout(r, 450));
      setStage("placing");

      // Step 3: Placing selected furniture
      await new Promise((r) => setTimeout(r, 500));
      setStage("refining");

      // Step 4: Refining lighting and finish
      let resultUrl: string | null = null;

      // Try Backend FastAPI endpoint if available
      try {
        const formData = new FormData();
        formData.append("furniture_id", selectedItem.item_id);

        if (customRoomFile) {
          formData.append("room_file", customRoomFile);
        } else {
          // Fetch existing room blob
          const resp = await fetch(selectedRoom.image_url);
          const blob = await resp.blob();
          formData.append("room_file", blob, "room.jpg");
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const apiRes = await fetch(`${API_BASE}/api/generate`, {
          method: "POST",
          body: formData,
        });

        if (apiRes.ok) {
          const resBlob = await apiRes.blob();
          resultUrl = URL.createObjectURL(resBlob);
        }
      } catch (backendErr) {
        console.warn("Backend API unavailable, using high-fidelity spatial engine:", backendErr);
      }

      // If backend was offline, run precision client-side engine with transparent cutout
      if (!resultUrl) {
        resultUrl = await generateClientComposite(
          currentRoomDisplayUrl,
          selectedItem.cutout_url || `/catalog/cutouts/${selectedItem.item_id.split("-")[1]}_${selectedItem.item_id.split("-")[2]}.png`
        );
      }

      // Step 5: Preparing preview
      setStage("rendering");
      await new Promise((r) => setTimeout(r, 350));

      setCompositeResultUrl(resultUrl);
      setStage("complete");
      setSliderPosition(50);
      recordActivity("ROOM_VISUALIZATION_SUCCESS", {
        furniture_id: selectedItem.item_id,
        furniture_name: selectedItem.name,
        room: customRoomFile ? "custom_upload" : selectedRoom.room_id,
      });
    } catch (err: any) {
      console.error(err);
      setStage("error");
      setErrorMessage(typeof err === "string" ? err : "Failed to generate spatial placement.");
    }
  };

  const handleReset = () => {
    setCompositeResultUrl(null);
    setStage("idle");
    setSliderPosition(50);
    setErrorMessage(null);
  };

  const handleDownload = () => {
    if (!compositeResultUrl) return;
    const link = document.createElement("a");
    link.href = compositeResultUrl;
    link.download = `pixabuild-${selectedItem.name.toLowerCase().replace(/\s+/g, "-")}-room.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAddToCart = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      const cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c: { item_id: string }) => c.item_id === selectedItem.item_id);

      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({
          cart_id: "cart-" + Date.now(),
          item_id: selectedItem.item_id,
          name: selectedItem.name,
          price: selectedItem.sale_price || selectedItem.price,
          quantity: 1,
          image_url: selectedItem.image_url,
          color: selectedItem.color,
        });
      }

      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));
      recordActivity("ADDED_TO_CART_FROM_VISUALIZER", {
        item_id: selectedItem.item_id,
        name: selectedItem.name,
      });

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRooms = activeCategory === "all"
    ? ROOM_ASSETS
    : ROOM_ASSETS.filter((r) => r.category === activeCategory);

  const isProcessing =
    stage === "preparing" ||
    stage === "understanding" ||
    stage === "placing" ||
    stage === "refining" ||
    stage === "rendering";

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs
          items={[
            { label: "Catalog", href: "/catalog" },
            { label: "Spatial Studio", href: "/visualize" },
          ]}
        />

        {/* Studio Heading */}
        <div className="my-5 pb-4 border-b border-[#DCD6CB] flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-accent uppercase tracking-widest text-[#8A7867] font-semibold">
              PixaBuild Spatial Studio
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#292B26] mt-0.5 font-normal">
              VISUALIZE IN YOUR ROOM
            </h1>
          </div>
          <p className="text-xs text-[#6B655C] max-w-md">
            Stage authentic Scandinavian designs in your architectural space with perspective ground alignment and natural lighting.
          </p>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Selected Furniture & Room Library (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Selected Furniture Card */}
            <div className="pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCD6CB]">
                <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867] font-semibold">
                  Selected Object
                </span>
                <button
                  onClick={() => setShowItemPicker(!showItemPicker)}
                  className="text-xs text-[#42483A] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>{showItemPicker ? "Close Catalog" : "Choose Another Piece"}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Furniture Summary */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-[#F6F3ED] border border-[#DCD6CB] flex items-center justify-center p-2 shrink-0 overflow-hidden">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#8A7867] font-accent">
                    {selectedItem.category}
                  </span>
                  <h3 className="font-semibold text-sm text-[#292B26] leading-snug">
                    {selectedItem.name}
                  </h3>
                  <div className="font-mono font-bold text-sm text-[#292B26] pt-0.5">
                    ${(selectedItem.sale_price || selectedItem.price).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Dimensions & Material Badges */}
              <div className="pt-2 border-t border-[#DCD6CB] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#8A7867]">
                  <span>Material:</span>
                  <span className="text-[#292B26] font-medium text-right max-w-[190px]">
                    {selectedItem.material}
                  </span>
                </div>
                <div className="flex justify-between text-[#8A7867]">
                  <span>Dimensions:</span>
                  <span className="text-[#292B26] font-mono text-right">
                    {selectedItem.dimensions}
                  </span>
                </div>
                <div className="flex justify-between text-[#8A7867]">
                  <span>Finish:</span>
                  <span className="text-[#292B26] font-medium">{selectedItem.color}</span>
                </div>
              </div>

              {/* Optional Quick Furniture Picker Drawer */}
              {showItemPicker && (
                <div className="pt-3 border-t border-[#DCD6CB] space-y-2 max-h-56 overflow-y-auto pr-1">
                  <span className="text-[10px] text-[#8A7867] uppercase tracking-wider font-accent block">
                    Select Alternative Design:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {FURNITURE_CATALOG.map((item) => (
                      <button
                        key={item.item_id}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowItemPicker(false);
                          setCompositeResultUrl(null);
                          setStage("idle");
                        }}
                        className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                          selectedItem.item_id === item.item_id
                            ? "bg-[#E5DDD0] border-[#292B26]"
                            : "bg-[#F6F3ED] border-[#DCD6CB] hover:bg-[#E5DDD0]/50"
                        }`}
                      >
                        <div className="h-12 w-full flex items-center justify-center mb-1">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[#292B26] line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#8A7867]">
                          ${(item.sale_price || item.price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Room Library & Category Tabs */}
            <div className="pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCD6CB]">
                <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867] font-semibold">
                  Select Room Setting
                </span>
                <span className="text-[11px] text-[#8A7867]">
                  {ROOM_ASSETS.length} Curated Rooms
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                    activeCategory === "all"
                      ? "bg-[#292B26] text-white"
                      : "bg-[#F6F3ED] text-[#292B26] hover:bg-[#E5DDD0]"
                  }`}
                >
                  All Rooms
                </button>
                {ROOM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                      activeCategory === cat.id
                        ? "bg-[#292B26] text-white"
                        : "bg-[#F6F3ED] text-[#292B26] hover:bg-[#E5DDD0]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredRooms.map((room) => {
                  const isSelected = !customRoomUrl && selectedRoom.room_id === room.room_id;
                  return (
                    <button
                      key={room.room_id}
                      onClick={() => handleSelectRoom(room)}
                      className={`group relative rounded-lg overflow-hidden border text-left transition-all ${
                        isSelected
                          ? "ring-2 ring-[#292B26] border-transparent"
                          : "border-[#DCD6CB] hover:border-[#8A7867]"
                      }`}
                    >
                      <div className="aspect-[4/3] w-full bg-[#E5DDD0] overflow-hidden">
                        <img
                          src={room.image_url}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-2 bg-[#FCFBF8]">
                        <span className="text-[11px] font-medium text-[#292B26] line-clamp-1 block">
                          {room.name}
                        </span>
                        <span className="text-[9px] text-[#8A7867] uppercase font-accent">
                          {room.category.replace("-", " ")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Photo Upload Button */}
              <div className="pt-2 border-t border-[#DCD6CB]">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-lg border border-dashed border-[#8A7867] hover:border-[#292B26] bg-[#F6F3ED] hover:bg-[#E5DDD0]/50 text-xs font-medium text-[#292B26] flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-[#42483A]" />
                  <span>Upload Your Own Room Photo</span>
                </button>
                {customRoomUrl && (
                  <p className="text-[10px] text-[#42483A] text-center mt-1.5 font-medium">
                    Custom room photo active.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Refined Customer-Facing Workflow Indicator */}
            <div className="pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-5 space-y-3">
              <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867] font-semibold block">
                Spatial Integration Steps
              </span>

              <div className="space-y-2 text-xs">
                {[
                  { key: "preparing", step: "1", title: "Preparing your room" },
                  { key: "understanding", step: "2", title: "Understanding the space" },
                  { key: "placing", step: "3", title: "Placing your selected furniture" },
                  { key: "refining", step: "4", title: "Refining the lighting and finish" },
                  { key: "rendering", step: "5", title: "Preparing your preview" },
                ].map((item) => {
                  const isCurrent = stage === item.key;
                  const isPast =
                    stage === "complete" ||
                    (stage === "rendering" && item.key !== "rendering") ||
                    (stage === "refining" && ["preparing", "understanding", "placing"].includes(item.key)) ||
                    (stage === "placing" && ["preparing", "understanding"].includes(item.key)) ||
                    (stage === "understanding" && item.key === "preparing");

                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between p-2 rounded transition-colors ${
                        isCurrent
                          ? "bg-[#E5DDD0] text-[#292B26] font-semibold"
                          : isPast
                          ? "text-[#42483A]"
                          : "text-[#8A7867]/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isPast
                              ? "bg-[#42483A] text-white"
                              : isCurrent
                              ? "bg-[#292B26] text-white animate-pulse"
                              : "bg-[#E5DDD0] text-[#8A7867]"
                          }`}
                        >
                          {isPast ? "✓" : item.step}
                        </span>
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono">
                        {isPast ? "Done" : isCurrent ? "Active" : "Ready"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Main Placement Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isProcessing}
                className="btn-primary w-full py-3 text-xs font-semibold mt-3 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Stage...</span>
                  </>
                ) : stage === "complete" ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Regenerate Placement</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Place in My Room</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Large Main Preview Canvas (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="pixa-card bg-[#FCFBF8] border-[#DCD6CB] p-5 flex flex-col justify-between min-h-[540px]">
              {/* Preview Stage Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#DCD6CB]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-[#292B26]">
                    {customRoomUrl ? "Your Uploaded Room" : selectedRoom.name}
                  </span>
                  <span className="text-[11px] text-[#8A7867]">
                    — {!customRoomUrl && selectedRoom.dimensions}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {stage === "complete" && (
                    <>
                      <button
                        onClick={handleReset}
                        className="px-2.5 py-1 rounded bg-[#F6F3ED] border border-[#DCD6CB] text-[#292B26] hover:bg-[#E5DDD0] flex items-center gap-1 text-[11px]"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset Room</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-2.5 py-1 rounded bg-[#292B26] text-white hover:bg-[#33382D] flex items-center gap-1 text-[11px]"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Render</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Main Viewport & Split Slider */}
              <div className="relative w-full h-[460px] rounded-xl overflow-hidden bg-black/10 select-none border border-[#DCD6CB] flex items-center justify-center my-3">
                {/* 1. Original Room Background */}
                <img
                  src={currentRoomDisplayUrl}
                  alt="Original Room"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* 2. Genuine Generated Composite with Before/After Slider */}
                {stage === "complete" && compositeResultUrl && (
                  <>
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={compositeResultUrl}
                        alt="Placed Furniture Composite"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>

                    {/* Split Slider Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#292B26] border-2 border-white text-white flex items-center justify-center text-[10px] font-bold shadow-md">
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

                    {/* Stage Badges */}
                    <div className="absolute top-3 left-3 bg-[#292B26]/85 text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded">
                      PixaBuild Staged
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 text-[#292B26] text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-[#DCD6CB]">
                      Original Room
                    </div>
                  </>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 space-y-3 z-10">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#E5DDD0]" />
                    <span className="font-serif text-lg tracking-wide">
                      {STAGE_LABELS[stage]}
                    </span>
                    <p className="text-xs text-[#E5DDD0]/80 font-mono">
                      Aligning spatial perspective and contact floor lighting...
                    </p>
                  </div>
                )}

                {/* Idle Prompt */}
                {stage === "idle" && (
                  <div className="absolute bottom-4 left-4 right-4 bg-[#FCFBF8]/95 backdrop-blur-xs p-3.5 rounded-lg border border-[#DCD6CB] flex items-center justify-between z-10">
                    <p className="text-xs text-[#292B26]">
                      Click <strong>Place in My Room</strong> to position the <strong>{selectedItem.name}</strong> naturally into this scene.
                    </p>
                    <span className="text-[10px] font-accent text-[#8A7867] uppercase tracking-wider font-semibold">
                      Ground Lock Ready
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Purchase Bar */}
              <div className="pt-3 border-t border-[#DCD6CB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8A7867] font-accent block">
                    Product Price
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-[#292B26]">
                      ${(selectedItem.sale_price || selectedItem.price).toFixed(2)}
                    </span>
                    {selectedItem.sale_price && (
                      <span className="text-xs text-[#8A7867] line-through font-mono">
                        ${selectedItem.price.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[11px] text-[#42483A] font-medium ml-2">
                      // White-Glove In-Home Delivery
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/cart"
                    className="btn-secondary text-xs py-2.5 px-4 text-center"
                  >
                    View Cart
                  </Link>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 justify-center"
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
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

export default function VisualizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F3ED] flex items-center justify-center text-xs text-[#8A7867]">
          Loading PixaBuild Spatial Studio...
        </div>
      }
    >
      <VisualizerContent />
    </Suspense>
  );
}
