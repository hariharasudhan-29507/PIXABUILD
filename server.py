from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from PIL import Image
import io
import json
import os

from pipeline.segment import RoomSegmenter
from pipeline.depth import DepthEstimator
from pipeline.generate import FurnitureGenerator
from pipeline.postprocess import harmonize_lighting

app = FastAPI(
    title="PixaBuild Multimodal Spatial API",
    version="1.0.0",
    description="Offline and hybrid AI service utilizing SAM, Depth Anything V2, and ControlNet inpainting."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[PixaBuild Server] Initializing Neural Modules...")
segmenter = RoomSegmenter()
depth_estimator = DepthEstimator()
generator = FurnitureGenerator(use_controlnet=True)

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "catalog", "catalog.json")
if os.path.exists(CATALOG_PATH):
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog_db = json.load(f)
else:
    catalog_db = {}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PixaBuild Multimodal Spatial Server",
        "models": {
            "sam": "Segment Anything Model V1",
            "depth": "Depth Anything V2 Small",
            "controlnet": "SD1.5-ControlNet Inpainting",
            "recommendation": "Cosine TF-IDF Vector Space Model"
        },
        "catalog_items_loaded": len(catalog_db)
    }

@app.get("/api/catalog")
def get_catalog():
    return catalog_db

@app.post("/api/segment")
async def segment_room(room_file: UploadFile = File(...)):
    try:
        contents = await room_file.read()
        room_img = Image.open(io.BytesIO(contents)).convert("RGB")
        mask_np = segmenter.generate_mask(room_img)
        mask_img = Image.fromarray(mask_np)

        buf = io.BytesIO()
        mask_img.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/depth")
async def estimate_room_depth(room_file: UploadFile = File(...)):
    try:
        contents = await room_file.read()
        room_img = Image.open(io.BytesIO(contents)).convert("RGB")
        depth_np = depth_estimator.estimate_depth(room_img)
        depth_img = Image.fromarray(depth_np).convert("L")

        buf = io.BytesIO()
        depth_img.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
async def generate_composite(
    room_file: UploadFile = File(...),
    furniture_id: str = Form(...),
    prompt: str = Form(None)
):
    try:
        room_bytes = await room_file.read()
        room_img = Image.open(io.BytesIO(room_bytes)).convert("RGB")

        if furniture_id not in catalog_db:
            raise HTTPException(status_code=404, detail=f"Furniture {furniture_id} not found in catalog")

        furn_info = catalog_db[furniture_id]
        furn_path = furn_info["image"]
        if not os.path.exists(furn_path):
            raise HTTPException(status_code=404, detail=f"Furniture asset missing: {furn_path}")

        furn_img = Image.open(furn_path).convert("RGBA")

        # 1. Segment floor
        mask_np = segmenter.generate_mask(room_img)
        mask_img = Image.fromarray(mask_np)

        # 2. Depth estimate and scale
        depth_np = depth_estimator.estimate_depth(room_img)
        scale = depth_estimator.get_scale_factor(depth_np, mask_np)

        # Scale furniture
        fw, fh = furn_img.size
        new_w = max(10, int(fw * scale))
        new_h = max(10, int(fh * scale))
        furn_scaled = furn_img.resize((new_w, new_h), Image.LANCZOS)

        # 3. ControlNet / Inpaint placement
        default_prompt = prompt or f"photorealistic {furn_info['category']} placed on floor, interior ambient lighting"
        result_img = generator.generate(room_img, mask_img, furn_scaled, prompt=default_prompt)

        # 4. Postprocess color harmony
        result_harmonized = harmonize_lighting(room_img, result_img, mask_img)

        buf = io.BytesIO()
        result_harmonized.save(buf, format="JPEG", quality=92)
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
