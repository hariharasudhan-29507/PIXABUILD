import cv2
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
