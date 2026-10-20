import numpy as np
from PIL import Image, ImageEnhance

def harmonize_lighting(source_img, target_img, mask_img):
    """
    Harmonizes ambient color temperature and exposure between placed furniture
    and background room illumination.
    """
    src_rgb = np.array(source_img.convert("RGB"), dtype=np.float32)
    tgt_rgb = np.array(target_img.convert("RGB"), dtype=np.float32)
    mask = np.array(mask_img.convert("L"), dtype=np.float32) / 255.0

    # Expand mask dimension
    mask_3d = np.expand_dims(mask, axis=-1)

    # Ambient room mean color
    room_mean = np.mean(src_rgb, axis=(0, 1))
    target_mean = np.mean(tgt_rgb, axis=(0, 1))

    # Subtle color balance shift towards room warmth
    gain = (room_mean / (target_mean + 1e-5)) * 0.12 + 0.88
    balanced = np.clip(tgt_rgb * gain, 0, 255).astype(np.uint8)

    # Blend with original
    final_np = (src_rgb * (1 - mask_3d) + balanced * mask_3d).astype(np.uint8)
    return Image.fromarray(final_np)
