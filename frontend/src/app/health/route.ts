import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "pixabuild-spatial-neural-engine",
    models: {
      sam: "Meta AI SAM ViT-B (375MB)",
      depth: "Depth Anything V2 Small (99MB)",
      homography: "8-Parameter Projective Transform",
      lighting: "Radiance & Color Temperature Harmonization"
    }
  });
}
