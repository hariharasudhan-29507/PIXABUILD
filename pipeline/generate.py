import torch
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
