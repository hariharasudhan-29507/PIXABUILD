import os
import numpy as np
from PIL import Image

class RoomSegmenter:
    """
    Segment Anything Model (SAM) integration for room and floor segmentation.
    Includes adaptive floor-plane extraction and fallback mask generation.
    """
    def __init__(self, checkpoint_path=None):
        if checkpoint_path is None:
            # Check default model directory candidates
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            candidates = [
                os.path.join(base_dir, "models", "sam_vit_b_01ec64.pth"),
                os.path.join("models", "sam_vit_b_01ec64.pth"),
                os.path.join(base_dir, "models", "mobile_sam.pt"),
                os.path.join("models", "mobile_sam.pt"),
            ]
            for c in candidates:
                if os.path.exists(c):
                    size = os.path.getsize(c)
                    # Only bind if checkpoint file has fully completed downloading
                    if "vit_b" in c and size >= 350 * 1024 * 1024:
                        checkpoint_path = c
                        break
                    elif "mobile_sam" in c and size >= 38 * 1024 * 1024:
                        checkpoint_path = c
                        break

        self.checkpoint_path = checkpoint_path
        self.predictor = None
        self._load_model()

    def _load_model(self):
        if self.checkpoint_path and os.path.exists(self.checkpoint_path):
            try:
                import torch
                from segment_anything import sam_model_registry, SamPredictor
                device = "cuda" if torch.cuda.is_available() else "cpu"
                model_type = "vit_b" if "vit_b" in self.checkpoint_path else "vit_t"
                if model_type not in sam_model_registry:
                    model_type = "vit_b"
                sam = sam_model_registry[model_type](checkpoint=self.checkpoint_path)
                sam.to(device=device)
                self.predictor = SamPredictor(sam)
                print(f"[SAM] Segment Anything Model ({model_type}) loaded successfully on {device} from {self.checkpoint_path}.")
            except Exception as e:
                print(f"[SAM] Warning: Could not initialize torch SAM ({e}). Using adaptive mask engine.")
                self.predictor = None
        else:
            self.predictor = None

    def generate_mask(self, image_path_or_pil):
        """
        Generates a binary floor/furniture placement mask (0=background, 255=placement area).
        """
        if isinstance(image_path_or_pil, str):
            img = Image.open(image_path_or_pil).convert("RGB")
        else:
            img = image_path_or_pil.convert("RGB")

        w, h = img.size
        img_np = np.array(img)

        # If SAM predictor is available
        if self.predictor is not None:
            try:
                self.predictor.set_image(img_np)
                # Sample point in lower-middle section (floor candidate)
                input_point = np.array([[w // 2, int(h * 0.75)]])
                input_label = np.array([1])
                masks, scores, _ = self.predictor.predict(
                    point_coords=input_point,
                    point_labels=input_label,
                    multimask_output=True,
                )
                best_mask = (masks[np.argmax(scores)] * 255).astype(np.uint8)
                return best_mask
            except Exception as e:
                print(f"[SAM] Inference failed: {e}. Falling back to spatial heuristic mask.")

        # Adaptive spatial floor mask heuristic (lower 40% floor zone with center bias)
        mask = np.zeros((h, w), dtype=np.uint8)
        y_start = int(h * 0.52)
        y_end = int(h * 0.92)
        x_start = int(w * 0.18)
        x_end = int(w * 0.82)

        # Create smooth oval floor contact pad
        Y, X = np.ogrid[:h, :w]
        center_y = (y_start + y_end) / 2
        center_x = (x_start + x_end) / 2
        radius_y = (y_end - y_start) / 2
        radius_x = (x_end - x_start) / 2

        dist_from_center = ((X - center_x) / radius_x) ** 2 + ((Y - center_y) / radius_y) ** 2
        mask[dist_from_center <= 1.0] = 255

        return mask
