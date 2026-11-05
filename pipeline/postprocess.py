import numpy as np
from PIL import Image, ImageFilter

def harmonize_lighting(source_img, target_img, mask_img=None):
    """
    Harmonizes ambient color temperature and exposure between placed furniture
    and background room illumination according to Section 4.9.3 formulas.
    Features sub-pixel edge feathering to ensure seamless boundary blending.
    """
    src_rgb = np.array(source_img.convert("RGB"), dtype=np.float32)
    tgt_rgb = np.array(target_img.convert("RGB"), dtype=np.float32)

    # Ambient room mean color
    room_mean = np.mean(src_rgb, axis=(0, 1))
    target_mean = np.mean(tgt_rgb, axis=(0, 1))

    # Subtle color balance shift towards room warmth: gain = 0.88 + 0.12 * (room_mean / target_mean)
    gain = (room_mean / (target_mean + 1e-5)) * 0.12 + 0.88
    balanced = np.clip(tgt_rgb * gain, 0, 255).astype(np.float32)

    # Identify placed furniture & shadow pixels by difference against empty room
    diff = np.max(np.abs(tgt_rgb - src_rgb), axis=-1)
    placed_mask = (diff > 2.0).astype(np.float32)

    # Feather boundary slightly to prevent harsh edge clipping against background
    pil_mask = Image.fromarray((placed_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.8))
    smooth_mask = (np.array(pil_mask, dtype=np.float32) / 255.0)[..., np.newaxis]

    final_np = np.clip(src_rgb * (1.0 - smooth_mask) + balanced * smooth_mask, 0, 255).astype(np.uint8)
    return Image.fromarray(final_np)
