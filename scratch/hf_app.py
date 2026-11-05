import io
import os
import json
import base64
import numpy as np
from PIL import Image, ImageDraw
import torch
import spaces
from diffusers import AutoPipelineForInpainting
import gradio as gr

# 1. Load Catalog Metadata
CATALOG_PATH = os.path.join(os.path.dirname(__file__), "catalog.json")
CATALOG_DICT = {}
if os.path.exists(CATALOG_PATH):
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            items = json.load(f)
            if isinstance(items, list):
                CATALOG_DICT = {it.get("item_id"): it for it in items if "item_id" in it}
            elif isinstance(items, dict):
                CATALOG_DICT = items
    except Exception as e:
        print(f"[Catalog] Load error: {e}")

def get_furniture_prompt(furniture_id: str) -> str:
    if furniture_id in CATALOG_DICT:
        it = CATALOG_DICT[furniture_id]
        name = it.get("name", "designer furniture")
        color = it.get("color", "")
        material = it.get("material", "")
        category = it.get("category", "furniture")
        return f"{name}, {color} finish, made of {material}, architectural {category}"
    return furniture_id.replace("pixa-", "").replace("-", " ")

print("[PixaBuild] Loading SDXL Inpainting pipeline...")
pipe = AutoPipelineForInpainting.from_pretrained(
    "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
    torch_dtype=torch.float16,
    variant="fp16"
)

# 2. Inpainting Core with ZeroGPU
@spaces.GPU(duration=60)
def generate_placement(
    room_img: Image.Image,
    mask_img: Image.Image = None,
    prompt_text: str = "Astrid Terracotta 3-seat linen sofa",
    anchor_x: float = 0.50,
    anchor_y: float = 0.74
) -> Image.Image:
    if room_img is None:
        raise gr.Error("Room image is required.")

    rw, rh = room_img.size

    # If mask is not supplied, create a perspective-aware floor placement mask from anchor
    if mask_img is None:
        mask_img = Image.new("L", (rw, rh), 0)
        draw = ImageDraw.Draw(mask_img)

        box_w = int(rw * 0.46)
        box_h = int(rh * 0.28)
        cx = int(rw * float(anchor_x))
        cy = int(rh * float(anchor_y))

        x0 = max(10, cx - box_w // 2)
        y0 = max(10, cy - int(box_h * 0.85))
        x1 = min(rw - 10, cx + box_w // 2)
        y1 = min(rh - 10, cy + int(box_h * 0.15))

        draw.rounded_rectangle([x0, y0, x1, y1], radius=24, fill=255)

    room_resized = room_img.resize((1024, 1024), Image.LANCZOS)
    mask_resized = mask_img.resize((1024, 1024), Image.NEAREST)

    if anchor_x <= 0.36:
        orient_guide = "positioned along the left wall, 3D angled and facing inward toward the center of the room (angled 35 degrees to the right)"
    elif anchor_x >= 0.64:
        orient_guide = "positioned along the right wall, 3D angled and facing inward toward the center of the room (angled 35 degrees to the left)"
    else:
        orient_guide = "positioned in the center of the room, center-oriented, facing directly forward toward the camera, straight and level"

    full_prompt = (
        f"A photorealistic {prompt_text}, {orient_guide}, standing naturally grounded on the floor plane, "
        "matching room lighting, authentic sunlit bounce and sharp directional contact shadows cast on the wooden floor, "
        "interior design photography, 8k, ultra-realistic architectural rendering, fully integrated into the room architecture"
    )
    neg_prompt = "floating, levitating, slanted, crooked, distorted, blurry, cartoon, low quality, bad perspective, cut and paste, sticker, outline, facing away from center"

    result = pipe(
        prompt=full_prompt,
        negative_prompt=neg_prompt,
        image=room_resized,
        mask_image=mask_resized,
        num_inference_steps=25,
        guidance_scale=7.5
    ).images[0]

    return result.resize((rw, rh), Image.LANCZOS)

demo = gr.Interface(
    fn=generate_placement,
    inputs=[
        gr.Image(type="pil", label="Room Image"),
        gr.Image(type="pil", label="Placement Mask (Optional)"),
        gr.Textbox(label="Furniture Prompt", value="Astrid Terracotta 3-seat linen sofa"),
        gr.Slider(minimum=0.1, maximum=0.9, value=0.50, label="Anchor X"),
        gr.Slider(minimum=0.1, maximum=0.9, value=0.74, label="Anchor Y")
    ],
    outputs=gr.Image(type="pil", label="Generated 3D Output"),
    title="PixaBuild 3D Spatial Engine",
    description="SDXL Inpainting on ZeroGPU with realistic 3D perspective, floor grounding, and sunlight shadows.",
    api_name="generate_placement"
)

if __name__ == "__main__":
    demo.launch()
