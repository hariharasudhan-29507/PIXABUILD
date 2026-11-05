import { Client } from "@gradio/client";
import { NextRequest, NextResponse } from "next/server";
import catalogItems from "@/data/catalog.json";

/**
 * Determines whether to dispatch to local FastAPI server (for testing)
 * or Hugging Face ZeroGPU Space (for deployment).
 */
function resolveBackendTarget(req: NextRequest): "local" | "huggingface" {
  // 1. Explicit request header override (e.g. for testing specific backend)
  const headerTarget = req.headers.get("x-backend-target")?.toLowerCase();
  if (headerTarget === "local" || headerTarget === "huggingface") {
    return headerTarget;
  }

  // 2. Explicit environment variable override
  const envTarget = process.env.PIXABUILD_BACKEND?.toLowerCase();
  if (envTarget === "local" || envTarget === "huggingface") {
    return envTarget;
  }

  // 3. Deployment detection:
  // If running on Vercel, Netlify, Render, or in production without a local API URL specified, use Hugging Face
  const isDeployed = Boolean(
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.RENDER ||
    (process.env.NODE_ENV === "production" && !process.env.LOCAL_API_URL)
  );

  return isDeployed ? "huggingface" : "local";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const roomFile = formData.get("room_file") as Blob | null;
    const furnitureId = (formData.get("furniture_id") as string) || "pixa-sofa-1";
    const anchorX = parseFloat((formData.get("anchor_x") as string) || "0.50");
    const anchorY = parseFloat((formData.get("anchor_y") as string) || "0.74");
    const lightDirection = (formData.get("light_direction") as string) || "auto";
    const wallZone = (formData.get("wall_zone") as string) || "auto";

    if (!roomFile) {
      return NextResponse.json(
        { success: false, error: "No room image provided" },
        { status: 400 }
      );
    }

    const backendTarget = resolveBackendTarget(req);
    console.log(`[Generate API] Mode: ${backendTarget.toUpperCase()} | Item: ${furnitureId} at (${anchorX}, ${anchorY}) | Zone: ${wallZone}`);

    // -------------------------------------------------------------
    // MODE 1: LOCAL TESTING (http://127.0.0.1:8000)
    // -------------------------------------------------------------
    if (backendTarget === "local") {
      const localBase = process.env.LOCAL_API_URL || "http://127.0.0.1:8000";
      try {
        const localForm = new FormData();
        localForm.append("room_file", roomFile, "room.jpg");
        localForm.append("furniture_id", furnitureId);
        localForm.append("anchor_x", anchorX.toString());
        localForm.append("anchor_y", anchorY.toString());
        localForm.append("light_direction", lightDirection);
        localForm.append("wall_zone", wallZone);
        localForm.append("return_json", "true");

        console.log(`[Local Test Backend] Connecting to ${localBase}/api/generate...`);
        const localRes = await fetch(`${localBase}/api/generate`, {
          method: "POST",
          body: localForm,
          signal: AbortSignal.timeout(60000), // 60s timeout for local neural model
        });

        if (localRes.ok) {
          const localData = await localRes.json();
          return NextResponse.json({
            ...localData,
            backend_used: "local_fastapi",
            model_info: localData.model_info || "Local SAM ViT-B + Depth Anything V2 + 3D Spatial Engine"
          });
        } else {
          const errText = await localRes.text();
          console.error(`[Local Backend Error ${localRes.status}]:`, errText);
          return NextResponse.json(
            { success: false, error: `Local backend error: ${errText}` },
            { status: localRes.status }
          );
        }
      } catch (localErr: any) {
        console.warn(`[Local Backend Unavailable]: ${localErr?.message}`);
        return NextResponse.json(
          {
            success: false,
            error: `Local testing backend is not responding at ${localBase}. Please launch it in a terminal using 'python server.py'. (To use Hugging Face Space instead, set PIXABUILD_BACKEND=huggingface in .env).`
          },
          { status: 503 }
        );
      }
    }

    // -------------------------------------------------------------
    // MODE 2: PRODUCTION DEPLOYMENT (Hugging Face ZeroGPU Space)
    // -------------------------------------------------------------
    const item = Array.isArray(catalogItems)
      ? catalogItems.find((it: any) => it.item_id === furnitureId)
      : null;

    let orientationDesc = "positioned in the center of the room, center-oriented, facing directly forward toward the camera, straight and parallel to back wall, resting firmly on the floor plane";
    if (wallZone === "left_wall") {
      orientationDesc = "positioned along the left wall, 3D angled and facing inward toward the center of the room (angled 35 degrees to the right), back against the left wall, resting firmly on the floor plane";
    } else if (wallZone === "right_wall") {
      orientationDesc = "positioned along the right wall, 3D angled and facing inward toward the center of the room (angled 35 degrees to the left), back against the right wall, resting firmly on the floor plane";
    } else if (wallZone === "back_wall") {
      orientationDesc = "positioned along the back wall, straight parallel to wall, center-oriented, resting firmly on the floor plane";
    }

    const promptText = item
      ? `${item.name} in ${item.color || ""} finish, ${item.material || ""}, architectural ${item.category || "furniture"}, ${orientationDesc}, matching room sunlight with realistic contact shadow cast on floor`
      : `${furnitureId.replace("pixa-", "").replace(/-/g, " ")}, ${orientationDesc}, matching room sunlight with realistic contact shadow cast on floor`;

    const hfSpace = process.env.HUGGINGFACE_SPACE_NAME || "hariwes/pixabuild-backend";
    console.log(`[Deployment Backend] Dispatching to Hugging Face Space '${hfSpace}' with prompt: '${promptText}'`);

    try {
      const hfClient = await Client.connect(hfSpace);

      const result = await hfClient.predict("/generate_placement", [
        roomFile,
        null, // tells backend to auto-generate the placement mask from anchor
        promptText,
        anchorX,
        anchorY
      ]);

      const outputData = result.data as any[];
      const resultImageObj = outputData[0];
      const compositeUrl = typeof resultImageObj === "string" ? resultImageObj : resultImageObj?.url;

      return NextResponse.json({
        success: true,
        status: "success",
        composite_image: compositeUrl,
        sam_mask_image: null,
        depth_map_image: null,
        scale_factor: 1.0,
        backend_used: "huggingface_zerogpu",
        model_info: "SDXL Inpainting on Hugging Face ZeroGPU (NVIDIA A100)"
      });
    } catch (hfError: any) {
      const msg = hfError?.message || String(hfError);
      console.error(`[Hugging Face Space Error]: ${msg}`);

      if (msg.includes("ZeroGPU quota exceeded") || msg.includes("quota")) {
        return NextResponse.json(
          {
            success: false,
            error: "Hugging Face ZeroGPU free daily quota is currently exhausted. Please try again later or run local testing via 'python server.py'."
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Hugging Face Space deployment error: ${msg}`
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("[Generate Route Handler Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process room visualization request"
      },
      { status: 500 }
    );
  }
}
