import torch
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
