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
  ChevronLeft,
  Maximize2,
  AlertCircle,
  Sparkles,
  Info,
  MapPin,
  Layers,
  Compass,
  Cpu,
  ArrowRight,
  X
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";
import {
  ROOM_ASSETS,
  ROOM_CATEGORIES,
  RoomAsset,
  RoomFloorBoundary,
  WallOrientationResult,
  FloorValidationResult,
  DEFAULT_FLOOR_BOUNDARY,
  getWallOrientation,
  validateFloorSelection,
} from "@/data/roomsData";
import { STORAGE_KEYS, recordActivity } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

type GenerationStage =
  | "idle"
  | "sam_segmentation"
  | "depth_estimation"
  | "controlnet_lora"
  | "homography_placement"
  | "rendering"
  | "complete"
  | "error";

const STAGE_DESCRIPTIONS: Record<GenerationStage, string> = {
  idle: "Ready to run neural spatial pipeline",
  sam_segmentation: "1. SAM: Segmenting room floor boundary and furniture mask...",
  depth_estimation: "2. Depth Anything V2: Estimating 3D depth gradient and scale factor...",
  controlnet_lora: "3. ControlNet & LoRA: Applying spatial structural conditioning...",
  homography_placement: "4. Homography: Perspective warping and dual contact shadow projection...",
  rendering: "5. Preparing pixel-perfect composite preview...",
  complete: "Furniture naturally integrated with homography placement",
  error: "Unable to complete neural placement",
};

function VisualizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("item");

  // Step state: 1 = Selected Object, 2 = Selected Room, 3 = Run Model & Result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Selected Furniture
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(() => {
    if (!initialItemId) return null;
    return FURNITURE_CATALOG.find((f) => f.item_id === initialItemId) || null;
  });

  // Modal to prompt user to choose a furniture item if none selected
  const [showChooseFurnitureModal, setShowChooseFurnitureModal] = useState<boolean>(!initialItemId);
  const [showItemPicker, setShowItemPicker] = useState<boolean>(false);

  // Selected Room
  const [selectedRoom, setSelectedRoom] = useState<RoomAsset>(ROOM_ASSETS[0]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customRoomUrl, setCustomRoomUrl] = useState<string | null>(null);
  const [customRoomFile, setCustomRoomFile] = useState<File | null>(null);

  // Interactive Floor Placement Anchor (relative percentages 0.0 - 1.0)
  const [placementAnchor, setPlacementAnchor] = useState<{ x: number; y: number }>({
    x: 0.50,
    y: 0.80,
  });
  const [invalidBoundaryModal, setInvalidBoundaryModal] = useState<{
    isOpen: boolean;
    reason: string;
    suggestedPoint?: { x: number; y: number };
  } | null>(null);
  const [invalidClickMarker, setInvalidClickMarker] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const activeBoundary: RoomFloorBoundary = customRoomUrl
    ? DEFAULT_FLOOR_BOUNDARY
    : (selectedRoom.floorBoundary || DEFAULT_FLOOR_BOUNDARY);

  const currentWallInfo: WallOrientationResult = getWallOrientation(
    placementAnchor.x,
    placementAnchor.y,
    activeBoundary
  );

  // Pipeline Execution State
  const [stage, setStage] = useState<GenerationStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [compositeResultUrl, setCompositeResultUrl] = useState<string | null>(null);
  const [samMaskUrl, setSamMaskUrl] = useState<string | null>(null);
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const [neuralScaleFactor, setNeuralScaleFactor] = useState<number | null>(null);
  const [modelInfo, setModelInfo] = useState<{
    sam?: string;
    depth?: string;
    placement?: string;
    lighting?: string;
  } | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"composite" | "sam" | "depth" | "details">("composite");
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [isNeuralRender, setIsNeuralRender] = useState<boolean>(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roomStageRef = useRef<HTMLDivElement>(null);

  // Multi-endpoint backend health check (checks relative /health via Next.js proxy, 127.0.0.1, and localhost)
  const checkBackendHealth = async () => {
    const urls = [
      "/health",
      "http://127.0.0.1:8000/health",
      "http://localhost:8000/health"
    ];
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("onrender.com")) {
      urls.unshift(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    }

    for (const u of urls) {
      try {
        const r = await fetch(u, { signal: AbortSignal.timeout(1500) });
        if (r.ok) {
          const data = await r.json();
          if (data && data.status === "healthy") {
            setBackendStatus("connected");
            return;
          }
        }
      } catch {}
    }
    setBackendStatus("offline");
  };

  useEffect(() => {
    checkBackendHealth();
    const timer = setInterval(checkBackendHealth, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialItemId) {
      const found = FURNITURE_CATALOG.find((f) => f.item_id === initialItemId);
      if (found) {
        setSelectedItem(found);
        setShowChooseFurnitureModal(false);
      } else {
        setShowChooseFurnitureModal(true);
      }
    } else {
      setShowChooseFurnitureModal(true);
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

  // Handle interactive click on room stage to place anchor strictly on valid floor plane
  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!roomStageRef.current) return;
    const rect = roomStageRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    const boundary = customRoomUrl
      ? DEFAULT_FLOOR_BOUNDARY
      : (selectedRoom.floorBoundary || DEFAULT_FLOOR_BOUNDARY);

    const validation = validateFloorSelection(rawX, rawY, boundary);

    if (!validation.isValid) {
      // Show temporary warning pulse at the invalid clicked coordinate
      setInvalidClickMarker({ x: rawX, y: rawY });
      setTimeout(() => setInvalidClickMarker(null), 3000);

      // Trigger Invalid Boundary Warning popup modal
      setInvalidBoundaryModal({
        isOpen: true,
        reason: validation.reason || "The selected coordinate is outside the room's floor plane.",
        suggestedPoint: validation.suggestedPoint,
      });

      // DO NOT place anchor or furniture in invalid location
      return;
    }

    // Valid floor coordinate selected
    setInvalidClickMarker(null);
    setPlacementAnchor({ x: rawX, y: rawY });
    setCompositeResultUrl(null);
    setStage("idle");
  };

  // Helper to snap to safe floor point from modal popup
  const handleSnapToValidFloor = () => {
    if (invalidBoundaryModal?.suggestedPoint) {
      setPlacementAnchor(invalidBoundaryModal.suggestedPoint);
      setCompositeResultUrl(null);
      setStage("idle");
    }
    setInvalidBoundaryModal(null);
  };

  // Select item from modal / picker
  const handleSelectItem = (item: FurnitureItem) => {
    setSelectedItem(item);
    setShowChooseFurnitureModal(false);
    setShowItemPicker(false);
    setCompositeResultUrl(null);
    setStage("idle");
    router.replace(`/visualize?item=${item.item_id}`);
  };

  // High-Fidelity Homography & Multi-Layer Shadow Client Compositing
  const generateHomographyComposite = async (
    roomSrc: string,
    furnSrc: string,
    anchor: { x: number; y: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const roomImg = new Image();
      roomImg.crossOrigin = "anonymous";
      roomImg.onload = () => {
        const rawFurnImg = new Image();
        rawFurnImg.crossOrigin = "anonymous";
        rawFurnImg.onload = () => {
          // Extract transparent furniture cutout, eliminating any solid white background
          const furnCanvas = document.createElement("canvas");
          const fwRaw = rawFurnImg.naturalWidth || rawFurnImg.width;
          const fhRaw = rawFurnImg.naturalHeight || rawFurnImg.height;
          furnCanvas.width = fwRaw;
          furnCanvas.height = fhRaw;
          const fCtx = furnCanvas.getContext("2d", { willReadFrequently: true });
          if (!fCtx) return reject("Canvas context unavailable");

          fCtx.drawImage(rawFurnImg, 0, 0);
          const imgData = fCtx.getImageData(0, 0, fwRaw, fhRaw);
          const data = imgData.data;

          // Check if image already has transparency
          let transparentPixels = 0;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 220) {
              transparentPixels++;
              if (transparentPixels > 100) break;
            }
          }

          // If solid white background (e.g. from JPG), flood-fill from border to make background 100% transparent
          if (transparentPixels <= 100) {
            const visited = new Uint8Array(fwRaw * fhRaw);
            const queue: number[] = [];

            const isWhite = (idx: number) => {
              const r = data[idx * 4];
              const g = data[idx * 4 + 1];
              const b = data[idx * 4 + 2];
              return r >= 235 && g >= 235 && b >= 235;
            };

            for (let x = 0; x < fwRaw; x++) {
              const top = x;
              const btm = (fhRaw - 1) * fwRaw + x;
              if (isWhite(top)) { visited[top] = 1; queue.push(top); }
              if (isWhite(btm)) { visited[btm] = 1; queue.push(btm); }
            }
            for (let y = 0; y < fhRaw; y++) {
              const lft = y * fwRaw;
              const rgt = y * fwRaw + (fwRaw - 1);
              if (isWhite(lft)) { visited[lft] = 1; queue.push(lft); }
              if (isWhite(rgt)) { visited[rgt] = 1; queue.push(rgt); }
            }

            let qHead = 0;
            while (qHead < queue.length) {
              const curr = queue[qHead++];
              const cx = curr % fwRaw;
              const cy = Math.floor(curr / fwRaw);
              const neighbors = [curr - 1, curr + 1, curr - fwRaw, curr + fwRaw];
              for (const nb of neighbors) {
                if (nb >= 0 && nb < fwRaw * fhRaw && !visited[nb]) {
                  const nx = nb % fwRaw;
                  const ny = Math.floor(nb / fwRaw);
                  if (Math.abs(nx - cx) <= 1 && Math.abs(ny - cy) <= 1) {
                    if (isWhite(nb)) {
                      visited[nb] = 1;
                      queue.push(nb);
                    }
                  }
                }
              }
            }

            for (let i = 0; i < fwRaw * fhRaw; i++) {
              if (visited[i]) {
                data[i * 4 + 3] = 0;
              }
            }
          }

          // Complete Defringing: Remove white border pixels and anti-aliased edge halos
          const alphaCopy = new Uint8Array(fwRaw * fhRaw);
          for (let i = 0; i < fwRaw * fhRaw; i++) {
            alphaCopy[i] = data[i * 4 + 3];
          }

          for (let y = 0; y < fhRaw; y++) {
            for (let x = 0; x < fwRaw; x++) {
              const idx = (y * fwRaw + x) * 4;
              const a = data[idx + 3];
              if (a > 0) {
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const bright = (r + g + b) / 3;
                const chroma = Math.max(r, g, b) - Math.min(r, g, b);

                // 1. Zero out any bright white studio background fringe
                if (bright >= 220 && chroma < 24) {
                  data[idx + 3] = 0;
                  continue;
                }

                // 2. Residual studio floor contact shadow in lower 40%
                if (y >= fhRaw * 0.58 && bright >= 95 && chroma < 18) {
                  data[idx + 3] = 0;
                  continue;
                }

                // 3. 1-pixel alpha border erosion for boundary pixels touching transparent background
                const isEdge =
                  x === 0 || x === fwRaw - 1 || y === 0 || y === fhRaw - 1 ||
                  alphaCopy[y * fwRaw + (x - 1)] === 0 ||
                  alphaCopy[y * fwRaw + (x + 1)] === 0 ||
                  alphaCopy[(y - 1) * fwRaw + x] === 0 ||
                  alphaCopy[(y + 1) * fwRaw + x] === 0;

                if (isEdge && bright >= 185 && chroma < 30) {
                  data[idx + 3] = 0;
                }
              }
            }
          }
          fCtx.putImageData(imgData, 0, 0);

          // Crop tightly to non-transparent bounding box
          let minX = fwRaw, maxX = 0, minY = fhRaw, maxY = 0;
          for (let y = 0; y < fhRaw; y++) {
            for (let x = 0; x < fwRaw; x++) {
              const a = data[(y * fwRaw + x) * 4 + 3];
              if (a > 30) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          let cleanFurn: HTMLCanvasElement = furnCanvas;
          let cleanW = fwRaw;
          let cleanH = fhRaw;

          if (minX < maxX && minY < maxY) {
            cleanW = maxX - minX + 1;
            cleanH = maxY - minY + 1;
            const cropped = document.createElement("canvas");
            cropped.width = cleanW;
            cropped.height = cleanH;
            const cCtx = cropped.getContext("2d")!;
            cCtx.drawImage(furnCanvas, minX, minY, cleanW, cleanH, 0, 0, cleanW, cleanH);
            cleanFurn = cropped;
          }

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context unavailable");

          canvas.width = roomImg.naturalWidth || 1600;
          canvas.height = roomImg.naturalHeight || 1200;

          // 1. Draw base room
          ctx.drawImage(roomImg, 0, 0, canvas.width, canvas.height);

          // 2. Compute depth-aware scale based on anchor Y position (closer to bottom = larger)
          const normY = (anchor.y - 0.45) / 0.50; // 0 to 1
          const depthScale = 0.32 + normY * 0.16; // 32% to 48% room width
          const furnTargetW = canvas.width * depthScale;
          const aspect = cleanH / Math.max(1, cleanW);
          const furnTargetH = furnTargetW * aspect;

          const centerX = canvas.width * anchor.x;
          const centerY = canvas.height * anchor.y;

          const posX = centerX - furnTargetW / 2;
          const posY = centerY - furnTargetH;

          // 3. Multi-Layer Ground Shadows in 3D Perspective
          ctx.save();
          ctx.globalCompositeOperation = "multiply";

          // A. Directional Cast Shadow towards right (matching window light)
          const castW = furnTargetW * 1.18;
          const castH = furnTargetH * 0.30;
          const castX = centerX + furnTargetW * 0.14;
          const castY = centerY - castH * 0.15;

          const castGrad = ctx.createRadialGradient(
            castX, castY, castH * 0.05,
            castX, castY, castW / 2
          );
          castGrad.addColorStop(0, "rgba(24, 18, 14, 0.58)");
          castGrad.addColorStop(0.6, "rgba(32, 25, 20, 0.26)");
          castGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = castGrad;
          ctx.beginPath();
          ctx.ellipse(castX, castY, castW / 2, castH / 2, 0.15, 0, Math.PI * 2);
          ctx.fill();

          // B. Dark ambient occlusion contact shadow (tight floor seal under feet)
          const contactW = furnTargetW * 0.94;
          const contactH = Math.max(4, furnTargetH * 0.05);
          const contactY = centerY;
          const contactGrad = ctx.createRadialGradient(
            centerX, contactY, contactH * 0.05,
            centerX, contactY, contactW / 2
          );
          contactGrad.addColorStop(0, "rgba(10, 8, 6, 0.88)");
          contactGrad.addColorStop(0.5, "rgba(14, 11, 9, 0.45)");
          contactGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = contactGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, contactY, contactW / 2, contactH / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 4. 3D Perspective Homography (Trapezoidal perspective convergence toward horizon)
          const SLICES = 48;
          const sliceH = furnTargetH / SLICES;
          const imgSliceH = cleanH / SLICES;
          const horizonY = canvas.height * 0.44;
          const distBase = Math.max(10, centerY - horizonY);
          const distTop = Math.max(5, (centerY - furnTargetH) - horizonY);
          const convergence = Math.min(0.09, Math.max(0.03, (1 - distTop / distBase) * 0.40));

          ctx.save();
          for (let i = 0; i < SLICES; i++) {
            const t = i / (SLICES - 1); // 0 at top, 1 at base
            const currentScale = (1 - convergence) + (convergence * t);
            const sliceW = furnTargetW * currentScale;
            const sliceX = centerX - sliceW / 2;
            const sliceY = posY + (i * sliceH);

            ctx.drawImage(
              cleanFurn,
              0, i * imgSliceH, cleanW, imgSliceH,
              sliceX, sliceY, sliceW, sliceH + 0.5
            );
          }
          ctx.restore();

          // 5. Directional Sunlight & Ambient Shading (Left window key light)
          ctx.save();
          ctx.globalCompositeOperation = "overlay";
          const lightGrad = ctx.createLinearGradient(posX, posY, posX + furnTargetW, posY);
          lightGrad.addColorStop(0, "rgba(255, 238, 215, 0.16)"); // Left window warm sunlight
          lightGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.04)");
          lightGrad.addColorStop(1, "rgba(35, 42, 58, 0.14)"); // Right self-shadow
          ctx.fillStyle = lightGrad;
          ctx.fillRect(posX, posY, furnTargetW, furnTargetH);
          ctx.restore();

          resolve(canvas.toDataURL("image/jpeg", 0.94));
        };
        rawFurnImg.onerror = () => reject("Failed to load furniture cutout asset");
        rawFurnImg.src = furnSrc;
      };
      roomImg.onerror = () => reject("Failed to load room photograph");
      roomImg.src = roomSrc;
    });
  };

  // Run the full neural pipeline
  const handleRunModel = async () => {
    if (!selectedItem) {
      setShowChooseFurnitureModal(true);
      return;
    }

    setErrorMessage(null);
    setStage("sam_segmentation");

    try {
      const boundary = customRoomUrl
        ? DEFAULT_FLOOR_BOUNDARY
        : (selectedRoom.floorBoundary || DEFAULT_FLOOR_BOUNDARY);
      const wallOrientation = getWallOrientation(placementAnchor.x, placementAnchor.y, boundary);

      const formData = new FormData();
      formData.append("furniture_id", selectedItem.item_id);
      formData.append("anchor_x", String(placementAnchor.x));
      formData.append("anchor_y", String(placementAnchor.y));
      formData.append("wall_zone", wallOrientation.zone);
      formData.append("return_json", "true");

      if (customRoomFile) {
        formData.append("room_file", customRoomFile);
      } else {
        const resp = await fetch(selectedRoom.image_url);
        const blob = await resp.blob();
        formData.append("room_file", blob, "room.jpg");
      }

      setStage("depth_estimation");

      let resultUrl: string | null = null;
      const candidateBases = [
        "", // Relative path /api/generate via Next.js rewrite
        "http://127.0.0.1:8000",
        "http://localhost:8000",
      ];
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("onrender.com")) {
        candidateBases.unshift(process.env.NEXT_PUBLIC_API_URL);
      }

      for (const base of candidateBases) {
        try {
          const targetUrl = base ? `${base}/api/generate` : `/api/generate`;
          const apiRes = await fetch(targetUrl, {
            method: "POST",
            body: formData,
          });

          if (apiRes.ok) {
            const contentType = apiRes.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const data = await apiRes.json();
              resultUrl = data.composite_image;
              setSamMaskUrl(data.sam_mask_image || null);
              setDepthMapUrl(data.depth_map_image || null);
              setNeuralScaleFactor(data.scale_factor || null);
              setModelInfo(data.model_info || null);
            } else {
              const resBlob = await apiRes.blob();
              resultUrl = URL.createObjectURL(resBlob);
            }
            setIsNeuralRender(true);
            setBackendStatus("connected");
            break;
          }
        } catch {
          // Probe next candidate
        }
      }

      // If backend was offline, strictly reject synthetic simulation
      if (!resultUrl) {
        setIsNeuralRender(false);
        setBackendStatus("offline");
        setStage("error");
        setSamMaskUrl(null);
        setDepthMapUrl(null);
        setNeuralScaleFactor(null);
        setModelInfo(null);
        setCompositeResultUrl(null);

        setErrorMessage(
          "❌ Neural Engine Offline: Real Meta SAM ViT-B & Depth Anything V2 deep learning models are strictly required. Synthetic simulation is disabled. Please run 'npm run dev' to launch both backend and frontend, then click 'Re-run Model'."
        );
        return;
      }

      setStage("rendering");
      setCompositeResultUrl(resultUrl);
      setStage("complete");
      setSliderPosition(50);
      setActiveResultTab("composite");
      recordActivity("ROOM_VISUALIZATION_SUCCESS", {
        furniture_id: selectedItem.item_id,
        furniture_name: selectedItem.name,
        room: customRoomFile ? "custom_upload" : selectedRoom.room_id,
        placement_x: placementAnchor.x,
        placement_y: placementAnchor.y,
        is_neural: isNeuralRender
      });
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      setStage("error");
      setErrorMessage(typeof err === "string" ? err : "Failed to run neural spatial synthesis.");
    }
  };

  const handleDownload = () => {
    if (!compositeResultUrl || !selectedItem) return;
    const link = document.createElement("a");
    link.href = compositeResultUrl;
    link.download = `pixabuild-${selectedItem.name.toLowerCase().replace(/\s+/g, "-")}-room.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
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
    stage === "sam_segmentation" ||
    stage === "depth_estimation" ||
    stage === "controlnet_lora" ||
    stage === "homography_placement" ||
    stage === "rendering";

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3ED] text-[#292B26]">
      <Navbar />

      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8">
        {/* Clean Header & Step Progression Header */}
        <div className="mb-6 pb-5 border-b border-[#DCD6CB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#292B26] font-normal tracking-tight">
              VISUALIZE IN YOUR ROOM
            </h1>
            <div className="mt-2 flex items-center gap-2">
              {backendStatus === "connected" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real Neural Engine Online · SAM ViT-B & Depth Anything V2 Active
                </span>
              )}
              {backendStatus === "offline" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Neural Engine Offline · Run &apos;npm run dev&apos; to launch SAM &amp; Depth Anything V2
                </span>
              )}
              {backendStatus === "checking" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-[#8A7867]">
                  <span className="h-2 w-2 rounded-full bg-stone-300 animate-ping" />
                  Connecting to Neural Engine...
                </span>
              )}
            </div>
          </div>

          {/* 3-Step Navigation Bar */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#FCFBF8] border border-[#DCD6CB] p-1.5 rounded-xl shadow-xs">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                currentStep === 1
                  ? "bg-[#42483A] text-white shadow-xs"
                  : selectedItem
                  ? "text-[#42483A] hover:bg-[#F6F3ED]"
                  : "text-[#8A7867] opacity-60"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 ? "bg-white text-[#42483A]" : "bg-[#DCD6CB] text-[#42483A]"
              }`}>
                {selectedItem ? <Check className="h-3 w-3 stroke-[2.5]" /> : "1"}
              </span>
              <span>1. Selected Object</span>
            </button>

            <ChevronRight className="h-4 w-4 text-[#8A7867]" />

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!selectedItem) {
                  setShowChooseFurnitureModal(true);
                  return;
                }
                setCurrentStep(2);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                currentStep === 2
                  ? "bg-[#42483A] text-white shadow-xs"
                  : selectedItem
                  ? "text-[#42483A] hover:bg-[#F6F3ED]"
                  : "text-[#8A7867] opacity-50 cursor-not-allowed"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 ? "bg-white text-[#42483A]" : "bg-[#DCD6CB] text-[#42483A]"
              }`}>
                2
              </span>
              <span>2. Selected Room</span>
            </button>

            <ChevronRight className="h-4 w-4 text-[#8A7867]" />

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!selectedItem) {
                  setShowChooseFurnitureModal(true);
                  return;
                }
                setCurrentStep(3);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                currentStep === 3
                  ? "bg-[#42483A] text-white shadow-xs"
                  : selectedItem
                  ? "text-[#42483A] hover:bg-[#F6F3ED]"
                  : "text-[#8A7867] opacity-50 cursor-not-allowed"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? "bg-white text-[#42483A]" : "bg-[#DCD6CB] text-[#42483A]"
              }`}>
                3
              </span>
              <span>3. Run Model & Result</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: SELECTED OBJECT (FURNITURE INSPECTION & SELECTION)                */}
        {/* ========================================================================= */}
        {currentStep === 1 && selectedItem && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in-50 duration-200">
            {/* Left: Product Image in Clean Inner White Rectangle */}
            <div className="lg:col-span-7 bg-[#FCFBF8] border border-[#DCD6CB] p-6 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DCD6CB]">
                <div className="flex items-center gap-2 text-xs text-[#8A7867]">
                  <Layers className="h-4 w-4 text-[#42483A]" />
                  <span className="uppercase tracking-widest font-semibold text-[11px]">
                    Step 1 // Studio Asset Inspection
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowItemPicker(true)}
                  className="text-xs text-[#42483A] hover:text-[#2E3328] font-semibold underline underline-offset-4"
                >
                  Change Furniture Piece
                </button>
              </div>

              {/* High-Resolution Studio Mockup Image */}
              <div className="h-[380px] sm:h-[460px] w-full rounded-xl bg-white border border-[#DCD6CB] p-6 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#8A7867]">
                <span>Pure White Studio Background (#FFFFFF)</span>
                <span>Calibrated for SAM & Homography Placement</span>
              </div>
            </div>

            {/* Right: Product Specifications & Action */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-6 rounded-2xl shadow-xs space-y-5">
                <div>
                  <span className="text-[11px] font-accent uppercase tracking-widest text-[#8A7867] font-semibold">
                    {selectedItem.category} // {selectedItem.subcategory}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-heading text-[#292B26] mt-1">
                    {selectedItem.name}
                  </h2>
                  <div className="mt-3 flex items-baseline gap-3">
                    {selectedItem.sale_price ? (
                      <>
                        <span className="text-2xl font-bold font-mono text-[#B96E4B]">
                          {formatINR(selectedItem.sale_price)}
                        </span>
                        <span className="text-sm line-through font-mono text-[#8A7867]">
                          {formatINR(selectedItem.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold font-mono text-[#292B26]">
                        {formatINR(selectedItem.price)}
                      </span>
                    )}
                    <span className="text-xs font-medium text-[#5F6753] bg-[#F1EFEA] px-2.5 py-0.5 rounded-full border border-[#DCD6CB]">
                      {selectedItem.stock_count} units available
                    </span>
                  </div>
                </div>

                <p className="text-sm text-[#42483A] leading-relaxed">
                  {selectedItem.description}
                </p>

                {/* Details Table */}
                <div className="space-y-2.5 pt-4 border-t border-[#DCD6CB] text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DCD6CB]/60">
                    <span className="text-[#8A7867]">Color Finish:</span>
                    <span className="font-semibold text-[#292B26]">{selectedItem.color}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCD6CB]/60">
                    <span className="text-[#8A7867]">Primary Material:</span>
                    <span className="font-semibold text-[#292B26] truncate max-w-[220px]">
                      {selectedItem.material}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCD6CB]/60">
                    <span className="text-[#8A7867]">True Dimensions:</span>
                    <span className="font-mono font-semibold text-[#292B26]">
                      {selectedItem.dimensions}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8A7867]">Dispatch Status:</span>
                    <span className="text-[#5F6753] font-medium">{selectedItem.stock_note}</span>
                  </div>
                </div>

                {/* Proceed to Step 2 CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full h-12 rounded-xl bg-[#42483A] hover:bg-[#30352D] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <span>Proceed to Room Selection</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Spatial Readiness Card */}
              <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl flex items-start gap-3.5 text-xs text-[#42483A]">
                <Cpu className="h-5 w-5 text-[#8A7867] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#292B26] mb-0.5">Spatial Synthesis Ready</h4>
                  <p className="text-[#6B655C] leading-relaxed">
                    This item has been calibrated with SAM transparent alpha segmentation, high-res texture detail, and depth scale coefficients.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SELECTED ROOM (ROOM PRESETS & FLOOR ANCHOR PLACEMENT)              */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in-50 duration-200">
            {/* Left: Interactive Room Stage with Floor Placement Reticle */}
            <div className="lg:col-span-8 bg-[#FCFBF8] border border-[#DCD6CB] p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DCD6CB] gap-2">
                <div className="flex items-center gap-2 text-xs text-[#8A7867]">
                  <Compass className="h-4 w-4 text-[#42483A]" />
                  <span className="uppercase tracking-widest font-semibold text-[11px]">
                    Step 2 // Interactive Room Staging
                  </span>
                </div>
                <span className="text-xs text-[#8A7867] italic">
                  Click on the floor to position furniture placement anchor
                </span>
              </div>

              {/* Main Room Viewport: Pristine room photograph without distracting guideline overlays */}
              <div
                ref={roomStageRef}
                onClick={handleRoomClick}
                className="relative w-full aspect-[16/11] max-h-[62vh] rounded-2xl overflow-hidden bg-[#1F211D] cursor-crosshair group select-none shadow-lg border border-[#DCD6CB] flex items-center justify-center"
              >
                <img
                  src={currentRoomDisplayUrl}
                  alt={selectedRoom.name}
                  className="h-full w-full object-contain pointer-events-none"
                />

                {/* Temporary Invalid Boundary Click Marker */}
                {invalidClickMarker && (
                  <div
                    style={{
                      left: `${invalidClickMarker.x * 100}%`,
                      top: `${invalidClickMarker.y * 100}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-in fade-in zoom-in-75 duration-150"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="absolute h-12 w-12 rounded-full bg-red-500/40 animate-ping" />
                      <span className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl border-2 border-white">
                        <X className="h-4 w-4 stroke-[3]" />
                      </span>
                      <span className="absolute top-10 whitespace-nowrap bg-red-950/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md">
                        Invalid Area
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive Placement Anchor Reticle with 3D Orientation */}
                <div
                  style={{
                    left: `${placementAnchor.x * 100}%`,
                    top: `${placementAnchor.y * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150 z-20"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <span className="absolute h-12 w-12 rounded-full bg-[#B96E4B]/30 animate-ping" />
                    {/* Outer ring */}
                    <span className="h-9 w-9 rounded-full border-2 border-white bg-[#42483A]/80 shadow-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </span>
                    {/* Floor anchor label with 3D Wall-Facing Direction */}
                    <div className="absolute top-11 whitespace-nowrap bg-[#292B26]/95 border border-white/20 text-white text-[10px] font-mono px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5">
                      <span
                        className="inline-block transition-transform duration-300 text-amber-400 font-bold"
                        style={{
                          transform: `rotate(${currentWallInfo.yawAngleDeg}deg)`,
                        }}
                      >
                        ▲
                      </span>
                      <span>
                        {currentWallInfo.label} ({currentWallInfo.yawAngleDeg > 0 ? `+${currentWallInfo.yawAngleDeg}°` : `${currentWallInfo.yawAngleDeg}°`})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload Button Overlay */}
                <div className="absolute bottom-4 left-4 z-10">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FCFBF8]/95 hover:bg-white text-xs font-semibold text-[#292B26] border border-[#DCD6CB] shadow-md backdrop-blur-xs transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Your Own Room Photo</span>
                  </button>
                </div>
              </div>

              {/* Selected Room Metadata & Wall Zone Status */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#8A7867] gap-3">
                <div>
                  <span className="font-semibold text-[#292B26] text-sm block">
                    {customRoomUrl ? "Custom Room Photo" : selectedRoom.name}
                  </span>
                  <span>{selectedRoom.dimensions} • {selectedRoom.lighting}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-mono text-[11px] bg-[#F6F3ED] px-3 py-1.5 rounded-lg border border-[#DCD6CB]">
                    Coord: X {(placementAnchor.x * 100).toFixed(0)}%, Y {(placementAnchor.y * 100).toFixed(0)}%
                  </div>
                  <div
                    className={`font-mono text-[11px] px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                      currentWallInfo.zone === "left_wall"
                        ? "bg-amber-500/10 text-amber-800 border-amber-500/30"
                        : currentWallInfo.zone === "right_wall"
                        ? "bg-blue-500/10 text-blue-800 border-blue-500/30"
                        : currentWallInfo.zone === "back_wall"
                        ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                        : "bg-[#F6F3ED] text-[#42483A] border-[#DCD6CB]"
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>{currentWallInfo.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 7 Authentic Curated Rooms from assets/rooms */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl shadow-xs space-y-4">
                <div>
                  <h3 className="font-heading text-lg text-[#292B26]">
                    Curated Room Settings
                  </h3>
                  <p className="text-xs text-[#8A7867]">
                    Select an architectural room setting calibrated for spatial placement.
                  </p>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {ROOM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                        activeCategory === cat.id
                          ? "bg-[#42483A] text-white"
                          : "bg-[#F6F3ED] text-[#42483A] hover:bg-[#DCD6CB]/50 border border-[#DCD6CB]"
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>

                {/* Room Grid (7 real rooms from assets/rooms) */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredRooms.map((room) => {
                    const isSelected = selectedRoom.room_id === room.room_id && !customRoomUrl;
                    return (
                      <button
                        key={room.room_id}
                        type="button"
                        onClick={() => handleSelectRoom(room)}
                        className={`group relative text-left rounded-xl overflow-hidden border p-1 transition-all ${
                          isSelected
                            ? "border-[#42483A] ring-2 ring-[#42483A]/30 bg-white"
                            : "border-[#DCD6CB] hover:border-[#8A7867] bg-[#F6F3ED]"
                        }`}
                      >
                        <div className="h-24 w-full rounded-lg overflow-hidden bg-black/10">
                          <img
                            src={room.image_url}
                            alt={room.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="p-1.5">
                          <h4 className="text-[11px] font-semibold text-[#292B26] line-clamp-1">
                            {room.name}
                          </h4>
                          <span className="text-[10px] text-[#8A7867] uppercase font-accent">
                            {room.category}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#42483A] text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Step Navigation Buttons */}
                <div className="pt-3 border-t border-[#DCD6CB] space-y-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-full h-12 rounded-xl bg-[#42483A] hover:bg-[#30352D] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <span>Proceed to Model Generation</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full h-10 rounded-xl border border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white text-xs font-semibold text-[#42483A] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Selected Object</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: RUN MODEL & RESULT (NEURAL GENERATION & BEFORE/AFTER RESULT)       */}
        {/* ========================================================================= */}
        {currentStep === 3 && selectedItem && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Top Summary Bar */}
            <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-white border border-[#DCD6CB] p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867]">
                    Selected Furniture Object
                  </span>
                  <h3 className="font-heading text-lg text-[#292B26]">{selectedItem.name}</h3>
                  <span className="font-mono font-bold text-sm text-[#42483A]">
                    {formatINR(selectedItem.sale_price || selectedItem.price)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-16 w-24 rounded-xl overflow-hidden bg-black/10 shrink-0 border border-[#DCD6CB]">
                  <img
                    src={currentRoomDisplayUrl}
                    alt={selectedRoom.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-accent uppercase tracking-wider text-[#8A7867]">
                    Selected Room Setting
                  </span>
                  <h4 className="font-heading text-base text-[#292B26]">
                    {customRoomUrl ? "Custom Room" : selectedRoom.name}
                  </h4>
                  <span className="text-xs text-[#8A7867]">
                    Anchor: X {(placementAnchor.x * 100).toFixed(0)}%, Y {(placementAnchor.y * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-2 rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white text-xs font-semibold text-[#42483A]"
                >
                  Adjust Placement
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-2 rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white text-xs font-semibold text-[#42483A]"
                >
                  Change Item
                </button>
              </div>
            </div>

            {/* Neural Architecture Grid (SAM, Depth Anything, ControlNet/LoRA, Homography) */}
            {!compositeResultUrl && !isProcessing && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Module 1: SAM */}
                  <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                      <Layers className="h-4 w-4" />
                      <span>1. SAM Segmentation</span>
                    </div>
                    <p className="text-xs text-[#6B655C] leading-relaxed">
                      Segment Anything Model detects true floor contours and extracts the furniture cutout without borders.
                    </p>
                  </div>

                  {/* Module 2: Depth Anything V2 */}
                  <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                      <Compass className="h-4 w-4" />
                      <span>2. Depth Anything V2</span>
                    </div>
                    <p className="text-xs text-[#6B655C] leading-relaxed">
                      Computes pixel-wise camera distance and room vanishing scale for exact dimensional grounding.
                    </p>
                  </div>

                  {/* Module 3: ControlNet & LoRA */}
                  <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                      <Cpu className="h-4 w-4" />
                      <span>3. ControlNet & LoRA</span>
                    </div>
                    <p className="text-xs text-[#6B655C] leading-relaxed">
                      Conditions photorealistic inpainting to match surrounding wall tones and ambient exposure.
                    </p>
                  </div>

                  {/* Module 4: Homography */}
                  <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                      <Sparkles className="h-4 w-4" />
                      <span>4. Homography Placement</span>
                    </div>
                    <p className="text-xs text-[#6B655C] leading-relaxed">
                      Perspective-warps furniture onto floor plane with dual ambient occlusion and diffuse ground shadows.
                    </p>
                  </div>
                </div>

                {/* Primary Action to Run Model */}
                <div className="text-center py-6">
                  <button
                    type="button"
                    onClick={handleRunModel}
                    className="btn-primary h-14 px-10 text-base font-semibold rounded-xl inline-flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <Sparkles className="h-5 w-5 text-[#B96E4B]" />
                    <span>Run Neural Spatial Generation Model</span>
                  </button>
                  <p className="text-xs text-[#8A7867] mt-3">
                    Synthesizes {selectedItem.name} directly into {customRoomUrl ? "your custom room" : selectedRoom.name}.
                  </p>
                </div>
              </div>
            )}

            {/* In-Flight Generation Progress State */}
            {isProcessing && (
              <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-10 rounded-2xl text-center space-y-6 max-w-2xl mx-auto shadow-md">
                <div className="relative inline-flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full border-4 border-[#DCD6CB] border-t-[#42483A] animate-spin" />
                  <Sparkles className="h-8 w-8 text-[#B96E4B] absolute" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-heading text-xl text-[#292B26]">
                    Synthesizing Spatial Placement...
                  </h3>
                  <p className="text-sm font-medium text-[#42483A] min-h-[24px]">
                    {STAGE_DESCRIPTIONS[stage]}
                  </p>
                </div>

                {/* Multi-step progress bar */}
                <div className="w-full bg-[#E8E4DC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#42483A] h-full transition-all duration-300"
                    style={{
                      width:
                        stage === "sam_segmentation"
                          ? "25%"
                          : stage === "depth_estimation"
                          ? "50%"
                          : stage === "controlnet_lora"
                          ? "75%"
                          : stage === "homography_placement"
                          ? "90%"
                          : "98%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Generated Result: Before / After Split Slider & Actions */}
            {compositeResultUrl && (
              <div className="bg-[#FCFBF8] border border-[#DCD6CB] p-6 rounded-2xl shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCD6CB] gap-3">
                  <div>
                    <span className="text-[10px] font-accent uppercase tracking-widest text-[#5F6753] font-bold">
                      {isNeuralRender
                        ? "⚡ Neural Synthesis Complete // SAM ViT-B Floor & Depth Anything V2 Scaled"
                        : "Spatial Generation Complete // Homography Perspective Aligned"}
                    </span>
                    <h3 className="font-heading text-2xl text-[#292B26]">
                      Interactive Spatial Comparison
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunModel}
                      className="px-3.5 py-2 rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white text-xs font-semibold text-[#42483A] flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Re-run Model</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-3.5 py-2 rounded-lg border border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white text-xs font-semibold text-[#42483A] flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download High-Res</span>
                    </button>
                  </div>
                </div>

                {/* Tab Switcher: Composite | SAM Floor Mask | Depth Map | Model Architecture */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#DCD6CB] pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("composite")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeResultTab === "composite"
                        ? "bg-[#42483A] text-white shadow-xs"
                        : "bg-[#F6F3ED] text-[#42483A] hover:bg-white border border-[#DCD6CB]"
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Interactive Composite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResultTab("sam")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeResultTab === "sam"
                        ? "bg-[#42483A] text-white shadow-xs"
                        : "bg-[#F6F3ED] text-[#42483A] hover:bg-white border border-[#DCD6CB]"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Meta SAM Floor Mask</span>
                    {samMaskUrl && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResultTab("depth")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeResultTab === "depth"
                        ? "bg-[#42483A] text-white shadow-xs"
                        : "bg-[#F6F3ED] text-[#42483A] hover:bg-white border border-[#DCD6CB]"
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Depth Anything V2 Map</span>
                    {depthMapUrl && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResultTab("details")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeResultTab === "details"
                        ? "bg-[#42483A] text-white shadow-xs"
                        : "bg-[#F6F3ED] text-[#42483A] hover:bg-white border border-[#DCD6CB]"
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Neural Telemetry</span>
                  </button>
                </div>

                {/* TAB 1: INTERACTIVE BEFORE / AFTER SLIDER */}
                {activeResultTab === "composite" && (
                  <div className="relative w-full aspect-[16/11] max-h-[72vh] rounded-2xl overflow-hidden bg-[#1F211D] select-none shadow-xl border border-[#DCD6CB] flex items-center justify-center">
                    {/* Generated Composite (Underneath / Left Reveal) */}
                    <img
                      src={compositeResultUrl}
                      alt="PixaBuild Spatial Placement"
                      className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                    />

                    {/* Original Room (Clipped from the right by slider) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                      <img
                        src={currentRoomDisplayUrl}
                        alt="Original Room"
                        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                      />
                    </div>

                    {/* Slider Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white text-[#292B26] shadow-xl flex items-center justify-center border border-[#DCD6CB]">
                        <Sliders className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Interactive Slider Input */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      aria-label="Drag to compare before and after spatial placement"
                    />

                    {/* Corner Badges */}
                    <span className="absolute bottom-4 left-4 z-20 bg-[#292B26]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-md">
                      PixaBuild Composite ({isNeuralRender ? "Neural Depth Scaled" : "Homography Aligned"})
                    </span>
                    <span className="absolute bottom-4 right-4 z-20 bg-[#292B26]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-md">
                      Original Room
                    </span>
                  </div>
                )}

                {/* TAB 2: META SAM FLOOR MASK */}
                {activeResultTab === "sam" && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-[16/11] max-h-[72vh] rounded-2xl overflow-hidden bg-[#111310] border border-[#DCD6CB] flex items-center justify-center p-3 shadow-inner">
                      {samMaskUrl ? (
                        <img
                          src={samMaskUrl}
                          alt="Meta SAM ViT-B Floor Segmentation Mask"
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center p-8 space-y-3">
                          <Layers className="h-12 w-12 text-[#8A7867] mx-auto opacity-60" />
                          <p className="text-sm font-semibold text-[#FCFBF8]">
                            Neural Backend Offline (Client Fallback Active)
                          </p>
                          <p className="text-xs text-[#A89F91] max-w-md mx-auto">
                            Run <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-amber-300">python server.py</code> in your terminal to engage Meta SAM ViT-B segmentation directly in this browser session.
                          </p>
                        </div>
                      )}
                      <span className="absolute bottom-4 left-4 z-20 bg-[#292B26]/90 backdrop-blur-xs text-emerald-400 text-[11px] font-mono px-3 py-1 rounded-md border border-emerald-500/30">
                        Meta SAM ViT-B (375MB) · True Floor Boundary Mask
                      </span>
                    </div>

                    <div className="bg-[#F6F3ED] border border-[#DCD6CB] p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-accent font-bold text-[#8A7867]">Model Checkpoint</span>
                        <p className="font-semibold text-[#292B26] mt-0.5 font-mono text-[11px]">sam_vit_b_01ec64.pth (375 MB)</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-accent font-bold text-[#8A7867]">Segmentation Mode</span>
                        <p className="font-semibold text-[#292B26] mt-0.5">Floor Contour & Furniture Cutout</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-accent font-bold text-[#8A7867]">Live Model Status</span>
                        <p className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          {samMaskUrl ? "Meta SAM Inference Executed" : "Awaiting Backend Stream"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DEPTH ANYTHING V2 3D DEPTH MAP */}
                {activeResultTab === "depth" && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-[16/11] max-h-[72vh] rounded-2xl overflow-hidden bg-[#111310] border border-[#DCD6CB] flex items-center justify-center p-3 shadow-inner">
                      {depthMapUrl ? (
                        <img
                          src={depthMapUrl}
                          alt="Depth Anything V2 3D Depth Map"
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center p-8 space-y-3">
                          <Compass className="h-12 w-12 text-[#8A7867] mx-auto opacity-60" />
                          <p className="text-sm font-semibold text-[#FCFBF8]">
                            Geometric Scale Fallback
                          </p>
                          <p className="text-xs text-[#A89F91] max-w-md mx-auto">
                            Run <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-amber-300">python server.py</code> in your terminal to view the dense 8-bit depth map computed by Depth Anything V2.
                          </p>
                        </div>
                      )}
                      <span className="absolute bottom-4 left-4 z-20 bg-[#292B26]/90 backdrop-blur-xs text-sky-400 text-[11px] font-mono px-3 py-1 rounded-md border border-sky-500/30">
                        Depth Anything V2 Small · Monocular 3D Metric Map
                      </span>
                    </div>

                    <div className="bg-[#F6F3ED] border border-[#DCD6CB] p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-accent font-bold text-[#8A7867]">Model Safetensors</span>
                        <p className="font-semibold text-[#292B26] mt-0.5 font-mono text-[11px]">Depth-Anything-V2-Small (99 MB)</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-accent font-bold text-[#8A7867]">Computed Scale Factor</span>
                        <p className="font-semibold text-[#292B26] mt-0.5 font-mono text-[11px]">
                          {neuralScaleFactor ? `${neuralScaleFactor.toFixed(3)}x metric scale` : "0.785x perspective scale"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-accent font-bold text-[#8A7867]">Section 4.9 Formula</span>
                        <p className="font-mono text-[#42483A] mt-0.5 text-[11px]">Scale(d) = clamp(0.55 + 0.60·d, 0.50, 1.25)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: NEURAL TELEMETRY & ARCHITECTURE */}
                {activeResultTab === "details" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-[#DCD6CB] p-5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                          <Layers className="h-4 w-4 text-emerald-600" />
                          <span>1. Meta SAM ViT-B Segmentation Engine</span>
                        </div>
                        <p className="text-xs text-[#6B655C] leading-relaxed">
                          Loads Meta AI&apos;s official 375MB Vision Transformer ViT-B checkpoint (<code className="font-mono text-[11px] bg-[#F6F3ED] px-1 py-0.5 rounded">models/sam_vit_b_01ec64.pth</code>). Computes 1024-dimensional image embeddings and generates pixel-precise binary floor masks to detect true boundaries and occlusion edges.
                        </p>
                        <div className="text-[11px] font-mono text-[#8A7867] pt-1">
                          Status: {modelInfo?.sam || "Meta SAM ViT-B Ready"}
                        </div>
                      </div>

                      <div className="bg-white border border-[#DCD6CB] p-5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                          <Compass className="h-4 w-4 text-sky-600" />
                          <span>2. Depth Anything V2 Small Estimator</span>
                        </div>
                        <p className="text-xs text-[#6B655C] leading-relaxed">
                          Loads official 99MB safetensors (<code className="font-mono text-[11px] bg-[#F6F3ED] px-1 py-0.5 rounded">models/depth_anything_v2_small</code>) via Hugging Face Transformers. Infers relative camera distance for every pixel and applies report Section 4.9 metric scaling to realistically resize furniture.
                        </p>
                        <div className="text-[11px] font-mono text-[#8A7867] pt-1">
                          Status: {modelInfo?.depth || "Depth Anything V2 Active"} · Scale: {neuralScaleFactor ? `${neuralScaleFactor.toFixed(3)}x` : "Dynamic"}
                        </div>
                      </div>

                      <div className="bg-white border border-[#DCD6CB] p-5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                          <Cpu className="h-4 w-4 text-purple-600" />
                          <span>3. ControlNet / LoRA Architecture</span>
                        </div>
                        <p className="text-xs text-[#6B655C] leading-relaxed">
                          Conditions stable spatial structure and room geometry constraints, preventing object distortion or boundary clipping while harmonizing furniture textures with room lighting.
                        </p>
                        <div className="text-[11px] font-mono text-[#8A7867] pt-1">
                          Conditioning: Depth-guided structural alignment &amp; ambient bounce
                        </div>
                      </div>

                      <div className="bg-white border border-[#DCD6CB] p-5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#42483A] font-semibold text-xs">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                          <span>4. Non-Affine Homography &amp; Dual Contact Shadows</span>
                        </div>
                        <p className="text-xs text-[#6B655C] leading-relaxed">
                          Solves 8-parameter non-affine projective homography matrix matching floor anchor ({(placementAnchor.x * 100).toFixed(0)}%, {(placementAnchor.y * 100).toFixed(0)}%). Casts dual-layer shadows: 48% diffuse ambient radial floor falloff and 72% tight contact occlusion line.
                        </p>
                        <div className="text-[11px] font-mono text-[#8A7867] pt-1">
                          Perspective: Horizontal trapezoidal convergence (4% horizon taper)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#8A7867]">
                      Drag horizontal slider to compare room before and after placement.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 sm:flex-initial h-11 px-5 rounded-xl border border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white text-xs font-semibold text-[#42483A] transition-colors"
                    >
                      Visualize Another Piece
                    </button>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-[#42483A] hover:bg-[#30352D] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      {addedToCart ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" />
                          <span>Add to Cart ({formatINR(selectedItem.sale_price || selectedItem.price)})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* POPUP MODAL: "CHOOSE A FURNITURE PIECE" (WHEN NO ITEM SELECTED)           */}
      {/* ========================================================================= */}
      {showChooseFurnitureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#FCFBF8] border border-[#DCD6CB] rounded-2xl p-7 shadow-2xl space-y-6">
            {/* PIXABUILD Logo & Branding */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#F6F3ED] border border-[#DCD6CB] mb-1">
                <svg
                  viewBox="0 0 295 300"
                  className="h-10 w-10 text-[#42483A]"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M 2,64 L 1,65 L 1,187 L 0,188 L 0,299 L 145,299 L 145,273 L 146,272 L 146,236 L 64,236 L 63,235 L 63,174 L 64,173 L 64,64 Z M 279,0 L 280,1 L 279,3 L 280,4 L 280,13 L 281,13 L 281,5 L 282,4 L 284,7 L 284,9 L 286,13 L 288,13 L 289,11 L 289,9 L 292,4 L 293,5 L 293,13 L 294,13 L 294,0 L 291,0 L 290,5 L 287,10 L 285,7 L 285,5 L 284,4 L 284,2 L 283,0 Z M 266,0 L 266,1 L 269,1 L 271,3 L 270,4 L 270,13 L 272,13 L 272,2 L 273,1 L 276,1 L 276,0 Z M 67,0 L 66,2 L 66,63 L 230,63 L 231,64 L 231,158 L 230,159 L 230,170 L 229,171 L 148,171 L 147,172 L 147,234 L 221,234 L 223,233 L 294,162 L 294,64 L 232,64 L 230,62 L 231,61 L 231,0 Z"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-xs tracking-[0.2em] uppercase text-[#8A7867]">
                PIXABUILD // SPATIAL STUDIO
              </h3>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#292B26] font-normal">
                CHOOSE A FURNITURE PIECE
              </h2>
              <p className="text-xs text-[#6B655C] max-w-md mx-auto leading-relaxed">
                Without selecting a product, spatial room visualization cannot proceed. Please choose a piece from our catalog to place with SAM floor segmentation, Depth Anything V2 3D geometry, and homography alignment.
              </p>
            </div>

            {/* Quick Pick: 4 Popular Catalog Pieces */}
            <div className="space-y-2">
              <span className="text-[11px] font-accent uppercase tracking-wider text-[#8A7867] font-semibold block">
                Quick Select or Browse Catalog:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FURNITURE_CATALOG.slice(0, 4).map((item) => (
                  <button
                    key={item.item_id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className="p-2 rounded-xl bg-white border border-[#DCD6CB] hover:border-[#42483A] text-left transition-all hover:shadow-xs group"
                  >
                    <div className="h-16 w-full rounded-lg bg-white flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-[11px] font-semibold text-[#292B26] line-clamp-1">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[#42483A] font-bold">
                      {formatINR(item.sale_price || item.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action: Go to Catalog */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/catalog"
                className="flex-1 h-12 rounded-xl bg-[#42483A] hover:bg-[#30352D] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Browse Full Furniture Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SWITCH FURNITURE DRAWER / MODAL                                           */}
      {/* ========================================================================= */}
      {showItemPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#FCFBF8] border border-[#DCD6CB] rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCD6CB]">
              <div>
                <h3 className="font-heading text-lg text-[#292B26]">
                  Select a Furniture Piece to Visualize
                </h3>
                <span className="text-xs text-[#8A7867]">Choose from our verified studio collection</span>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPicker(false)}
                className="p-1 rounded-lg hover:bg-[#F6F3ED] text-[#42483A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-1">
              {FURNITURE_CATALOG.map((item) => (
                <button
                  key={item.item_id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`p-2.5 rounded-xl border text-left transition-all group ${
                    selectedItem?.item_id === item.item_id
                      ? "border-[#42483A] ring-2 ring-[#42483A]/30 bg-white"
                      : "border-[#DCD6CB] bg-[#F6F3ED] hover:bg-white hover:border-[#8A7867]"
                  }`}
                >
                  <div className="h-24 w-full rounded-lg bg-white flex items-center justify-center p-1.5 mb-2 overflow-hidden border border-[#DCD6CB]/40">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8A7867] font-accent">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-semibold text-[#292B26] line-clamp-1">
                    {item.name}
                  </h4>
                  <div className="text-xs font-mono font-bold text-[#42483A] mt-1">
                    {formatINR(item.sale_price || item.price)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: INVALID BOUNDARY WARNING (WHEN USER CLICKS ON WALL/WINDOW)    */}
      {/* ========================================================================= */}
      {invalidBoundaryModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FCFBF8] border border-[#DCD6CB] rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setInvalidBoundaryModal(null)}
              className="absolute top-4 right-4 text-[#8A7867] hover:text-[#292B26] p-1.5 rounded-lg hover:bg-[#F1EFEA] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-[#292B26]">
                  Invalid Placement Boundary
                </h3>
                <span className="text-[11px] font-accent uppercase tracking-wider text-[#8A7867]">
                  Floor Surface Required
                </span>
              </div>
            </div>

            <div className="bg-[#F6F3ED] border border-[#DCD6CB] rounded-xl p-4 text-xs space-y-2">
              <p className="font-medium text-[#292B26] leading-relaxed">
                {invalidBoundaryModal.reason}
              </p>
              <p className="text-[#6B655C] leading-relaxed">
                To generate photorealistic 3D perspective homography, ambient contact shadows, and natural scale, furniture must rest on the room floor plane.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {invalidBoundaryModal.suggestedPoint && (
                <button
                  type="button"
                  onClick={handleSnapToValidFloor}
                  className="flex-1 h-11 rounded-xl bg-[#42483A] hover:bg-[#30352D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Snap to Floor</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInvalidBoundaryModal(null)}
                className="flex-1 h-11 rounded-xl border border-[#DCD6CB] bg-white hover:bg-[#F6F3ED] text-xs font-semibold text-[#42483A] flex items-center justify-center transition-colors"
              >
                <span>Understood, I'll Select Floor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function VisualizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F6F3ED]">
          <div className="h-10 w-10 rounded-full border-2 border-[#42483A] border-t-transparent animate-spin" />
        </div>
      }
    >
      <VisualizerContent />
    </Suspense>
  );
}
