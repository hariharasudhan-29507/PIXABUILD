import gradio as gr
import os
import json
import tempfile
from PIL import Image

from pipeline.segment import RoomSegmenter
from pipeline.depth import DepthEstimator
from pipeline.generate import FurnitureGenerator
from pipeline.postprocess import harmonize_lighting

print("Initializing PixaBuild...")
segmenter = RoomSegmenter("models/sam/sam_vit_b_01ec64.pth")
depth_est = DepthEstimator("models")
generator = FurnitureGenerator(use_controlnet=True, cache_dir="models")

CATALOG_PATH = "catalog/catalog.json"
if os.path.exists(CATALOG_PATH):
    with open(CATALOG_PATH, "r") as f:
        catalog = json.load(f)
else:
    catalog = {}

def get_catalog_choices():
    return {v["name"]: k for k, v in catalog.items()}

def process_room(room_img, furniture_name):
    if room_img is None:
        return None, "Please upload a room photo."
    if not catalog:
        return None, "Catalog not found."

    furniture_id = None
    for k, v in catalog.items():
        if v["name"] == furniture_name:
            furniture_id = k
            break

    if furniture_id is None:
        return None, "Please select a furniture item."

    temp_path = os.path.join(tempfile.gettempdir(), "pixabuild_room.jpg")
    room_img.save(temp_path)

    mask_np = segmenter.generate_mask(temp_path)
    mask_img = Image.fromarray(mask_np)

    depth_np = depth_est.estimate_depth(temp_path)
    depth_img = Image.fromarray(depth_np).convert("L")

    scale = depth_est.get_scale_factor(depth_np, mask_np)

    furn_info = catalog[furniture_id]
    furn_path = furn_info["image"]
    if not os.path.exists(furn_path):
        return None, f"Furniture image not found: {furn_path}"

    furniture_img = Image.open(furn_path).convert("RGB")
    fw, fh = furniture_img.size
    furniture_img = furniture_img.resize((int(fw * scale), int(fh * scale)), Image.LANCZOS)

    prompt = f"high quality {furn_info['category']} in room, photorealistic, matching lighting and perspective"
    result_img = generator.generate(
        room_img,
        mask_img,
        furniture_img,
        depth_img,
        prompt=prompt
    )

    mask_resized = mask_img.resize(result_img.size, Image.NEAREST)
    result_img = harmonize_lighting(result_img, result_img, mask_resized)

    return result_img, mask_img

choices = list(get_catalog_choices().keys()) if catalog else []

with gr.Blocks(title="PixaBuild") as demo:
    gr.Markdown("# PixaBuild - Offline Furniture Visualization")
    gr.Markdown("Upload a room photo and select furniture to see how it looks.")

    with gr.Row():
        with gr.Column():
            room_input = gr.Image(type="pil", label="Room Photo", height=400)
            furniture_dropdown = gr.Dropdown(choices=choices, label="Select Furniture", value=choices[0] if choices else None)
            generate_btn = gr.Button("Generate Visualization", variant="primary")

        with gr.Column():
            result_output = gr.Image(label="Generated Result", height=400)
            mask_output = gr.Image(label="Suggested Placement Mask", height=200)

    status_text = gr.Textbox(label="Status", interactive=False)

    def on_generate(room, furn):
        try:
            result, mask = process_room(room, furn)
            if result is None:
                return None, None, mask
            return result, mask, "Generation complete!"
        except Exception as e:
            return None, None, f"Error: {str(e)}"

    generate_btn.click(
        fn=on_generate,
        inputs=[room_input, furniture_dropdown],
        outputs=[result_output, mask_output, status_text]
    )

if __name__ == "__main__":
    demo.launch(server_name="127.0.0.1", server_port=7860)
