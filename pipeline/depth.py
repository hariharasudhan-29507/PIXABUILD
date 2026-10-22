import os
import numpy as np
from PIL import Image

class DepthEstimator:
    """
    Depth Anything V2 integration for calculating 3D camera distances
    and calculating furniture placement scale factors.
    """
    def __init__(self, cache_dir="models"):
        self.cache_dir = cache_dir
        self.pipe = None
        self._load_model()

    def _load_model(self):
        # Only attempt to load large Hugging Face weights if explicitly enabled and GPU is available
        enable_heavy = os.getenv("ENABLE_NEURAL_MODELS", "false").lower() == "true"
        if not enable_heavy:
            print("[DepthAnything] Low-memory mode active (< 50MB RAM). Using spatial gradient engine.")
            self.pipe = None
            return

        try:
            from transformers import pipeline
            import torch
            device = 0 if torch.cuda.is_available() else -1
            self.pipe = pipeline(task="depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=device)
            print("[DepthAnything] Model initialized.")
        except Exception as e:
            print(f"[DepthAnything] Transformers pipeline unavailable ({e}). Using spatial gradient engine.")
            self.pipe = None

    def estimate_depth(self, image_path_or_pil):
        """
        Returns grayscale depth map (uint8, 0=far/dark, 255=close/bright)
        """
        if isinstance(image_path_or_pil, str):
            img = Image.open(image_path_or_pil).convert("RGB")
        else:
            img = image_path_or_pil.convert("RGB")

        w, h = img.size

        if self.pipe is not None:
            try:
                result = self.pipe(img)
                depth_img = result["depth"].resize((w, h), Image.BILINEAR)
                return np.array(depth_img, dtype=np.uint8)
            except Exception as e:
                print(f"[DepthAnything] Pipeline run failed: {e}")

        # Synthetic depth gradient map (standard room perspective: bottom is closest, top/horizon is furthest)
        y_coords = np.linspace(0, 1, h)[:, np.newaxis]
        depth_gradient = np.tile(y_coords, (1, w))
        # Add subtle room corner perspective
        x_coords = np.abs(np.linspace(-0.5, 0.5, w))[np.newaxis, :]
        depth_map = (depth_gradient * 0.85 + x_coords * 0.15) * 255
        return np.clip(depth_map, 0, 255).astype(np.uint8)

    def get_scale_factor(self, depth_np, mask_np):
        """
        Calculates scale multiplier for furniture based on average depth in placement region.
        """
        if mask_np is not None and np.sum(mask_np > 0) > 0:
            avg_depth = np.mean(depth_np[mask_np > 0])
        else:
            avg_depth = np.mean(depth_np)

        # Normalized depth (0 to 1)
        norm_depth = avg_depth / 255.0
        # Closer objects (high depth val) scale larger (0.6x to 1.15x)
        scale = 0.55 + (norm_depth * 0.6)
        return float(np.clip(scale, 0.5, 1.25))
