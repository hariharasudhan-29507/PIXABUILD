import gradio as gr
import os
import json
import tempfile
from PIL import Image

from pipeline.segment import RoomSegmenter
from pipeline.depth import DepthEstimator
from pipeline.generate import FurnitureGenerator
from pipeline.postprocess import harmonize_lighting

print("Initializing PixaBuild Gradio Engine...")
segmenter = RoomSegmenter()
depth_est = DepthEstimator()
generator = FurnitureGenerator(use_controlnet=True, cache_dir="models")

CATALOG_PATH = "catalog/catalog.json"
catalog_db = {}
if os.path.exists(CATALOG_PATH):
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        raw_cat = json.load(f)
        if isinstance(raw_cat, list):
            catalog_db = {item.get("id", item.get("item_id")): item for item in raw_cat}
        else:
            catalog_db = raw_cat

def get_catalog_choices():
    return {v["name"]: k for k, v in catalog_db.items()}

def process_room(room_img, furniture_name, light_choice="Auto (Detect Windows/Light)"):
    if room_img is None:
        return None, None, "Please upload a room photo."
    if not catalog_db:
        return None, None, "Catalog not found."

    light_map = {
        "Auto (Detect Windows/Light)": "auto",
        "Left Window": "left",
        "Right Window": "right",
        "Center / Ambient": "center",
    }
    light_dir = light_map.get(light_choice, "auto")

    furniture_id = None
    for k, v in catalog_db.items():
        if v["name"] == furniture_name:
            furniture_id = k
            break

    if furniture_id is None:
        return None, None, "Please select a furniture item."

    temp_path = os.path.join(tempfile.gettempdir(), "pixabuild_room.jpg")
    room_img.save(temp_path)

    mask_np = segmenter.generate_mask(temp_path)
    mask_img = Image.fromarray(mask_np)

    depth_np = depth_est.estimate_depth(temp_path)
    depth_img = Image.fromarray(depth_np).convert("L")

    scale = depth_est.get_scale_factor(depth_np, mask_np)

    furn_info = catalog_db[furniture_id]
    furn_path = furn_info.get("image", "")

    candidate_paths = [
        furn_path,
        os.path.join("frontend", "public", furn_path.lstrip("/")),
        os.path.join("frontend", "public", "catalog", "cutouts", f"{furn_info.get('category', 'sofa')}_1.png"),
        os.path.join("frontend", "public", "catalog", "cutouts", "sofa_1.png"),
    ]
    actual_furn_path = None
    for p in candidate_paths:
        if os.path.exists(p):
            actual_furn_path = p
            break

    if not actual_furn_path:
        return None, None, f"Furniture image not found for {furniture_name}"

    furniture_img = Image.open(actual_furn_path).convert("RGBA")

    prompt = f"high quality {furn_info.get('category', 'furniture')} in room, photorealistic, matching lighting and perspective"
    result_img = generator.generate(
        room_img,
        mask_img,
        furniture_img,
        depth_img=depth_img,
        scale_factor=scale,
        light_direction=light_dir,
        prompt=prompt
    )

    result_harmonized = harmonize_lighting(room_img, result_img, mask_img)

    return result_harmonized, mask_img, "Neural spatial synthesis complete!"

choices = list(get_catalog_choices().keys()) if catalog_db else []

with gr.Blocks(title="PixaBuild - Neural Visualizer") as demo:
    gr.Markdown("# PixaBuild - Multimodal Spatial Placement Studio")
    gr.Markdown("Real **Meta SAM ViT-B** + **Depth Anything V2** monocular depth estimation pipeline.")

    with gr.Row():
        with gr.Column():
            room_input = gr.Image(type="pil", label="Room Photo", height=400)
            furniture_dropdown = gr.Dropdown(choices=choices, label="Select Furniture", value=choices[0] if choices else None)
            light_dropdown = gr.Dropdown(
                choices=["Auto (Detect Windows/Light)", "Left Window", "Right Window", "Center / Ambient"],
                label="Lighting & Shadow Direction",
                value="Auto (Detect Windows/Light)"
            )
            generate_btn = gr.Button("Generate Visualization", variant="primary")

        with gr.Column():
            result_output = gr.Image(label="Generated Result", height=400)
            mask_output = gr.Image(label="SAM Segmented Floor Mask", height=200)

    status_text = gr.Textbox(label="Status", interactive=False)

    def on_generate(room, furn, light_choice):
        try:
            res, mask, msg = process_room(room, furn, light_choice)
            return res, mask, msg
        except Exception as e:
            return None, None, f"Error: {e}"

    generate_btn.click(
        fn=on_generate,
        inputs=[room_input, furniture_dropdown, light_dropdown],
        outputs=[result_output, mask_output, status_text]
    )

if __name__ == "__main__":
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False)
