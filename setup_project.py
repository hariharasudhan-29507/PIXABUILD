import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FILES = {
    "pipeline/__init__.py": "",
    
    "pipeline/segment.py": '''import torch
import cv2
import numpy as np
import os

try:
    from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
except ImportError:
    from segment_anything_hq import sam_model_registry, SamAutomaticMaskGenerator

class RoomSegmenter:
    def __init__(self, model_path="models/sam/sam_vit_b_01ec64.pth"):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"SAM checkpoint not found at {model_path}. Run download_models.py first.")

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.sam = sam_model_registry["vit_b"](checkpoint=model_path)
        self.sam.to(device=self.device)
        self.mask_generator = SamAutomaticMaskGenerator(
            model=self.sam,
            points_per_side=16,
            pred_iou_thresh=0.9,
            stability_score_thresh=0.95,
            crop_n_layers=0,
            min_mask_region_area=100,
        )

    def generate_mask(self, image_path):
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        h, w = image_rgb.shape[:2]

        masks = self.mask_generator.generate(image_rgb)

        if not masks:
            mask = np.zeros((h, w), dtype=np.uint8)
            y1, y2 = int(h * 0.4), int(h * 0.8)
            x1, x2 = int(w * 0.2), int(w * 0.8)
            mask[y1:y2, x1:x2] = 255
            return mask

        masks = sorted(masks, key=lambda x: x["area"], reverse=True)

        best_mask = None
        best_score = -1

        for m in masks:
            seg = m["segmentation"]
            ys, xs = np.where(seg)
            if len(ys) == 0:
                continue

            center_y = np.mean(ys)
            center_x = np.mean(xs)
            area_ratio = m["area"] / (h * w)

            score = area_ratio + (center_y / h) * 0.5 - abs((center_x / w) - 0.5) * 0.3

            if score > best_score:
                best_score = score
                best_mask = seg

        mask = best_mask.astype(np.uint8) * 255
        return mask
''',

    "pipeline/depth.py": '''from transformers import pipeline
from PIL import Image
import numpy as np
import cv2
import torch

class DepthEstimator:
    def __init__(self, cache_dir="./models"):
        use_cuda = torch.cuda.is_available()
        self.pipe = pipeline(
            task="depth-estimation",
            model="depth-anything/Depth-Anything-V2-Small-hf",
            cache_dir=cache_dir,
            device=0 if use_cuda else -1
        )

    def estimate_depth(self, image_path):
        image = Image.open(image_path).convert("RGB")
        result = self.pipe(image)
        depth = np.array(result["depth"])
        depth_norm = cv2.normalize(depth, None, 0, 255, cv2.NORM_MINMAX)
        return depth_norm.astype(np.uint8)

    def get_scale_factor(self, depth_map, mask):
        mask_bool = mask > 0
        if not np.any(mask_bool):
            return 1.0

        mean_depth = np.mean(depth_map[mask_bool])
        scale = 1.5 - (mean_depth / 255.0) * 1.2
        return float(max(0.4, min(1.8, scale)))
''',

    "pipeline/generate.py": '''import torch
from diffusers import StableDiffusionInpaintPipeline, ControlNetModel
from PIL import Image
import numpy as np
import os

class FurnitureGenerator:
    def __init__(self, use_controlnet=True, cache_dir="./models"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.cache_dir = cache_dir

        controlnet = None
        if use_controlnet:
            print("Loading ControlNet Depth...")
            controlnet = ControlNetModel.from_pretrained(
                "lllyasviel/sd-controlnet-depth",
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                cache_dir=cache_dir,
            )

        print("Loading Stable Diffusion 1.5 Inpainting...")
        self.pipe = StableDiffusionInpaintPipeline.from_pretrained(
            "stable-diffusion-v1-5/stable-diffusion-inpainting",
            controlnet=controlnet,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=cache_dir,
            safety_checker=None,
        )

        print("Loading IP-Adapter...")
        self.pipe.load_ip_adapter(
            "h94/IP-Adapter",
            subfolder="models",
            weight_name="ip-adapter_sd15.bin"
        )
        self.pipe.set_ip_adapter_scale(0.7)

        if self.device == "cuda":
            total_vram = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            print(f"Detected VRAM: {total_vram:.1f} GB")
            if total_vram < 8:
                print("Enabling CPU offload for low VRAM...")
                self.pipe.enable_model_cpu_offload()
            else:
                self.pipe = self.pipe.to("cuda")
                self.pipe.enable_attention_slicing()
        else:
            print("Running on CPU. Generation will be slow.")
            self.pipe = self.pipe.to("cpu")

    def generate(self, room_image, mask_image, furniture_image, depth_image=None, prompt=None):
        target_size = (512, 512)
        room = room_image.convert("RGB").resize(target_size, Image.LANCZOS)
        mask = mask_image.convert("L").resize(target_size, Image.NEAREST)
        furniture = furniture_image.convert("RGB").resize(target_size, Image.LANCZOS)

        if prompt is None:
            prompt = "photorealistic furniture placed naturally in room, high quality, detailed, matching lighting"
        negative_prompt = "blurry, low quality, distorted, ugly, duplicate, watermark, signature, text"

        control_image = None
        if depth_image is not None and self.pipe.controlnet is not None:
            control_image = depth_image.convert("L").resize(target_size, Image.LANCZOS)

        generator = torch.Generator(device=self.device).manual_seed(42)

        kwargs = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "image": room,
            "mask_image": mask,
            "ip_adapter_image": furniture,
            "num_inference_steps": 25,
            "guidance_scale": 7.5,
            "generator": generator,
        }
        if control_image is not None:
            kwargs["control_image"] = control_image

        result = self.pipe(**kwargs)
        return result.images[0]
''',

    "pipeline/postprocess.py": '''import cv2
import numpy as np
from PIL import Image

def harmonize_lighting(room_image, generated_image, mask):
    room = np.array(room_image).astype(np.float32)
    gen = np.array(generated_image).astype(np.float32)

    if isinstance(mask, Image.Image):
        mask = np.array(mask)

    mask_bool = mask > 128
    if not np.any(mask_bool):
        return generated_image

    room_lab = cv2.cvtColor(room.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    gen_lab = cv2.cvtColor(gen.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)

    for c in range(3):
        room_vals = room_lab[:,:,c][~mask_bool]
        gen_vals = gen_lab[:,:,c][mask_bool]

        if len(room_vals) == 0 or len(gen_vals) == 0:
            continue

        r_mean, r_std = np.mean(room_vals), np.std(room_vals)
        g_mean, g_std = np.mean(gen_vals), np.std(gen_vals)

        if g_std > 0 and r_std > 0:
            gen_lab[:,:,c][mask_bool] = (gen_lab[:,:,c][mask_bool] - g_mean) * (r_std / g_std) + r_mean

    result = cv2.cvtColor(np.clip(gen_lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    return Image.fromarray(result)
''',

    "download_models.py": '''import os
import urllib.request
from diffusers import StableDiffusionInpaintPipeline, ControlNetModel
from transformers import pipeline
import torch

CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")

def download_sam():
    sam_dir = os.path.join(CACHE_DIR, "sam")
    os.makedirs(sam_dir, exist_ok=True)
    sam_path = os.path.join(sam_dir, "sam_vit_b_01ec64.pth")
    if os.path.exists(sam_path):
        print("SAM checkpoint already exists.")
        return sam_path
    url = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
    print(f"Downloading SAM checkpoint to {sam_path} ...")
    urllib.request.urlretrieve(url, sam_path)
    print("SAM download complete.")
    return sam_path

def download_diffusers_models():
    print("Caching Stable Diffusion 1.5 Inpainting...")
    StableDiffusionInpaintPipeline.from_pretrained(
        "stable-diffusion-v1-5/stable-diffusion-inpainting",
        torch_dtype=torch.float16,
        cache_dir=CACHE_DIR,
    )
    print("Caching ControlNet Depth (SD1.5)...")
    ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-depth",
        torch_dtype=torch.float16,
        cache_dir=CACHE_DIR,
    )
    print("Caching Depth-Anything-V2...")
    pipeline(
        task="depth-estimation",
        model="depth-anything/Depth-Anything-V2-Small-hf",
        cache_dir=CACHE_DIR,
        device=-1
    )
    print("All models cached successfully!")

if __name__ == "__main__":
    download_sam()
    download_diffusers_models()
''',

    "app.py": '''import gradio as gr
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
''',

    "catalog/catalog.json": '''{
    "sofa_01": {
        "name": "Modern Gray Sofa",
        "category": "sofa",
        "price": 499.99,
        "image": "catalog/images/sofa_01.jpg"
    },
    "chair_01": {
        "name": "Wooden Dining Chair",
        "category": "chair",
        "price": 89.99,
        "image": "catalog/images/chair_01.jpg"
    }
}''',

    "requirements.txt": '''torch>=2.0.0
torchvision
diffusers>=0.27.0
transformers>=4.35.0
accelerate
safetensors
opencv-python
pillow
numpy
scipy
gradio
fastapi
uvicorn
lpips
controlnet-aux
''',
}

def main():
    dirs = ["pipeline", "models", "models/sam", "catalog", "catalog/images", "outputs", "lora_train"]
    for d in dirs:
        os.makedirs(os.path.join(BASE_DIR, d), exist_ok=True)

    for filepath, content in FILES.items():
        full_path = os.path.join(BASE_DIR, filepath)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created: {filepath}")

    print("\nAll files created successfully!")
    print("Next steps:")
    print("1. Add furniture images to catalog/images/ (sofa_01.jpg, chair_01.jpg)")
    print("2. Run: python download_models.py")
    print("3. Run: python app.py")

if __name__ == "__main__":
    main()