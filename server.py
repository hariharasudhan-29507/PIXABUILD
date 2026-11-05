from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from PIL import Image
import io
import json
import os
import base64
from typing import Optional, Union, List, Dict, Any

from pipeline.segment import RoomSegmenter
from pipeline.depth import DepthEstimator
from pipeline.generate import FurnitureGenerator
from pipeline.postprocess import harmonize_lighting

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="PixaBuild Multimodal Spatial API",
    version="2.0.0",
    description="Spatial furniture placement and room visualization service."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[PixaBuild Server] Initializing Neural & Spatial Modules...")
segmenter = RoomSegmenter()
depth_estimator = DepthEstimator()
generator = FurnitureGenerator(use_controlnet=True)

CATALOG_PATH = os.path.join(BASE_DIR, "catalog", "catalog.json")
if os.path.exists(CATALOG_PATH):
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        _raw_cat = json.load(f)
        if isinstance(_raw_cat, list):
            catalog_items = _raw_cat
            catalog_db = {item.get("item_id", f"item-{i}"): item for i, item in enumerate(_raw_cat)}
        elif isinstance(_raw_cat, dict):
            catalog_db = _raw_cat
            catalog_items = list(_raw_cat.values())
        else:
            catalog_items, catalog_db = [], {}
else:
    catalog_items, catalog_db = [], {}

ROOMS_DB = [
    {
        "room_id": "room-01",
        "category": "living-room",
        "name": "Room 1 - Scandinavian Living Space",
        "image_url": "/rooms/room1.webp",
        "dimensions": "5.8m x 4.4m",
        "lighting": "Warm ambient daylight with soft floor bounce",
        "flooring": "Natural Ash Hardwood Flooring",
    },
    {
        "room_id": "room-02",
        "category": "bedroom",
        "name": "Room 2 - Modern Master Suite",
        "image_url": "/rooms/room2.webp",
        "dimensions": "5.2m x 4.0m",
        "lighting": "Diffused morning architectural light",
        "flooring": "Warm Matte Douglas Fir Planks",
    },
    {
        "room_id": "room-03",
        "category": "living-room",
        "name": "Room 3 - Warm Oak Architectural Salon",
        "image_url": "/rooms/room3.webp",
        "dimensions": "6.0m x 4.6m",
        "lighting": "Balanced afternoon sunlight wash",
        "flooring": "Natural Oak Parquet with subtle grain",
    },
    {
        "room_id": "room-04",
        "category": "home-office",
        "name": "Room 4 - Bright Contemporary Studio",
        "image_url": "/rooms/room4.webp",
        "dimensions": "4.5m x 3.8m",
        "lighting": "Even studio illumination from corner glazing",
        "flooring": "Bleached Scandinavian Pine Planks",
    },
    {
        "room_id": "room-05",
        "category": "dining-room",
        "name": "Room 5 - Dining & Lounge Alcove",
        "image_url": "/rooms/room5.webp",
        "dimensions": "5.0m x 4.2m",
        "lighting": "Atmospheric natural daylight and perimeter wash",
        "flooring": "Smoked Oak Hardwood Flooring",
    },
    {
        "room_id": "room-06",
        "category": "living-room",
        "name": "Room 6 - Sunlit Gallery Interior",
        "image_url": "/rooms/room6.webp",
        "dimensions": "5.6m x 4.5m",
        "lighting": "Direct sunlit floor pool with clean shadow edges",
        "flooring": "Natural Ash Engineered Timber",
    },
    {
        "room_id": "room-07",
        "category": "entryway",
        "name": "Room 7 - Neutral Foyer & Vestibule",
        "image_url": "/rooms/room7.webp",
        "dimensions": "4.2m x 3.2m",
        "lighting": "Soft ambient sidelight",
        "flooring": "Honed Limestone & Hardwood Inset",
    },
]

@app.get("/")
def root_index():
    return {
        "service": "PixaBuild Multimodal Spatial API",
        "status": "online",
        "version": "2.0.0",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "catalog": "/api/catalog",
            "rooms": "/api/rooms",
            "generate": "POST /api/generate",
            "depth": "POST /api/depth",
            "segment": "POST /api/segment"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PixaBuild Multimodal Spatial Server",
        "pipeline": {
            "spatial_segmentation": "SAM Floor Boundaries",
            "depth_estimation": "Depth Anything V2 Spatial Gradient",
            "placement_engine": "Perspective-Scaled Contact Shadow Compositing",
        },
        "catalog_items_loaded": len(catalog_items),
        "rooms_loaded": len(ROOMS_DB)
    }

@app.get("/api/catalog")
def get_catalog():
    return catalog_items

@app.get("/api/rooms")
def get_rooms():
    return ROOMS_DB

@app.post("/api/segment")
async def segment_room(room_file: UploadFile = File(...)):
    filename = getattr(room_file, "filename", "") or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=415, detail=f"Unsupported file type '{ext}'. Supported formats: JPEG, PNG, WebP.")
    try:
        contents = await room_file.read()
        room_img = Image.open(io.BytesIO(contents)).convert("RGB")
        mask_np = segmenter.generate_mask(room_img)
        mask_img = Image.fromarray(mask_np)

        buf = io.BytesIO()
        mask_img.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=415 if "cannot identify image" in str(e).lower() else 500, detail=str(e))

@app.post("/api/depth")
async def estimate_room_depth(room_file: UploadFile = File(...)):
    filename = getattr(room_file, "filename", "") or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=415, detail=f"Unsupported file type '{ext}'. Supported formats: JPEG, PNG, WebP.")
    try:
        contents = await room_file.read()
        room_img = Image.open(io.BytesIO(contents)).convert("RGB")
        depth_np = depth_estimator.estimate_depth(room_img)
        depth_img = Image.fromarray(depth_np).convert("L")

        buf = io.BytesIO()
        depth_img.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=415 if "cannot identify image" in str(e).lower() else 500, detail=str(e))

@app.post("/api/generate")
async def generate_composite(
    room_file: UploadFile = File(...),
    furniture_id: str = Form(...),
    prompt: Optional[str] = Form(None),
    anchor_x: Optional[float] = Form(None),
    anchor_y: Optional[float] = Form(None),
    light_direction: Optional[str] = Form(None),
    wall_zone: Optional[str] = Form(None),
    return_json: Optional[bool] = Form(False)
):
    # Safe unwrapping if invoked directly as a Python coroutine during tests
    def _unwrap(val, default=None):
        if val is None:
            return default
        if hasattr(val, "default"):
            return val.default if val.default is not None else default
        return val

    unwrapped_x = _unwrap(anchor_x)
    unwrapped_y = _unwrap(anchor_y)
    unwrapped_ld = _unwrap(light_direction, "auto")
    unwrapped_wz = _unwrap(wall_zone, "auto")
    unwrapped_rj = _unwrap(return_json, False)
    unwrapped_prompt = _unwrap(prompt, "")

    try:
        clean_anchor_x = float(unwrapped_x) if unwrapped_x is not None else None
    except (ValueError, TypeError):
        clean_anchor_x = None

    try:
        clean_anchor_y = float(unwrapped_y) if unwrapped_y is not None else None
    except (ValueError, TypeError):
        clean_anchor_y = None

    clean_light_dir = str(unwrapped_ld) if unwrapped_ld else "auto"
    clean_wall_zone = str(unwrapped_wz) if unwrapped_wz else "auto"

    try:
        clean_return_json = bool(unwrapped_rj)
    except (ValueError, TypeError):
        clean_return_json = False
    filename = getattr(room_file, "filename", "") or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=415, detail=f"Unsupported file type '{ext}'. Supported formats: JPEG, PNG, WebP.")

    try:
        room_bytes = await room_file.read()
        try:
            room_img = Image.open(io.BytesIO(room_bytes)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=415, detail="Invalid file format. Supported formats: JPEG, PNG, WebP.")

        # Locate furniture asset
        furn_img = None
        
        # 1. Check direct cutout in frontend/public/catalog/cutouts/
        cat_file = None
        if "-" in furniture_id:
            parts = furniture_id.split("-")
            cat_file = f"{parts[-2]}_{parts[-1]}"
        
        candidate_paths = []
        if cat_file:
            candidate_paths.append(os.path.join(BASE_DIR, "frontend", "public", "catalog", "cutouts", f"{cat_file}.png"))
            candidate_paths.append(os.path.join(BASE_DIR, "frontend", "public", "catalog", f"{cat_file}.jpg"))

        if furniture_id in catalog_db:
            info = catalog_db[furniture_id]
            if "image" in info:
                candidate_paths.append(info["image"])
                cutout_candidate = info["image"].replace("/catalog/", "/catalog/cutouts/").replace(".jpg", ".png")
                candidate_paths.insert(0, cutout_candidate)

        for p in candidate_paths:
            if os.path.exists(p):
                furn_img = Image.open(p).convert("RGBA")
                break

        if furn_img is None:
            # Fallback to first available cutout
            default_cutout = os.path.join(BASE_DIR, "frontend", "public", "catalog", "cutouts", "sofa_1.png")
            if os.path.exists(default_cutout):
                furn_img = Image.open(default_cutout).convert("RGBA")
            else:
                raise HTTPException(status_code=404, detail=f"No image asset found for furniture: {furniture_id}")

        # 1. Floor boundary detection
        mask_np = segmenter.generate_mask(room_img)
        mask_img = Image.fromarray(mask_np)

        # 2. Depth gradient & scale calculation
        depth_np = depth_estimator.estimate_depth(room_img)
        depth_img = Image.fromarray(depth_np).convert("L")
        scale = depth_estimator.get_scale_factor(depth_np, mask_np)

        # 3. Generate perspective-accurate placement with contact shadow
        result_img = generator.generate(
            room_img, mask_img, furn_img,
            depth_img=depth_img, scale_factor=scale,
            anchor_x=clean_anchor_x, anchor_y=clean_anchor_y,
            light_direction=clean_light_dir,
            wall_zone=clean_wall_zone,
            prompt=unwrapped_prompt
        )

        # 4. Color temperature and radiance harmonization
        result_harmonized = harmonize_lighting(room_img, result_img, mask_img)

        if clean_return_json:
            import base64
            def to_b64(pil_im, fmt="PNG"):
                b = io.BytesIO()
                pil_im.save(b, format=fmt)
                return f"data:image/{fmt.lower()};base64," + base64.b64encode(b.getvalue()).decode("ascii")

            return {
                "success": True,
                "composite_image": to_b64(result_harmonized, fmt="JPEG"),
                "sam_mask_image": to_b64(mask_img, fmt="PNG"),
                "depth_map_image": to_b64(depth_img, fmt="PNG"),
                "scale_factor": round(float(scale), 3),
                "sam_active": segmenter.predictor is not None,
                "depth_active": depth_estimator.pipe is not None,
                "model_info": {
                    "sam": "Meta AI Segment Anything (SAM ViT-B, 375MB)" if segmenter.predictor is not None else "Adaptive Spatial Heuristic",
                    "depth": "Depth Anything V2 Small (Yang et al., 99MB)" if depth_estimator.pipe is not None else "Spatial Perspective Gradient",
                    "placement": "8-Parameter Non-Affine Projective Homography Matrix",
                    "lighting": "Ambient Color Temperature & Radiance Matching"
                }
            }

        buf = io.BytesIO()
        result_harmonized.save(buf, format="JPEG", quality=92)
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
