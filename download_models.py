import os
import urllib.request
import ssl
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
    
    # Fix SSL certificate verification error on Windows
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    with urllib.request.urlopen(url, context=ssl_context) as response:
        with open(sam_path, 'wb') as out_file:
            out_file.write(response.read())
    
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
