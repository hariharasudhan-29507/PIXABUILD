from transformers import pipeline
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
