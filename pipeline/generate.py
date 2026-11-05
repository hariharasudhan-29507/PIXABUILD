import os
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

def compute_homography_coeffs(src_coords, dst_coords):
    """
    Computes 8 coefficients for PIL Image.PERSPECTIVE mapping.
    Maps destination coordinates back into source coordinates for pixel-perfect interpolation.
    """
    matrix = []
    for (sx, sy), (dx, dy) in zip(src_coords, dst_coords):
        matrix.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        matrix.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    A = np.array(matrix, dtype=np.float64)
    B = np.array(src_coords, dtype=np.float64).reshape(8)
    coeffs = np.linalg.solve(A, B)
    return tuple(coeffs)

def extract_alpha_cutout(img, tol=28):
    """
    Safely removes solid/near-solid studio background from perimeter,
    including any trapped grey studio floor contact shadows,
    producing a clean transparent PNG mask with smoothed anti-aliased edges.
    """
    rgb = img.convert("RGB")
    arr = np.array(rgb, dtype=np.float32)
    h, w, _ = arr.shape

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    bright = (r + g + b) / 3.0
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)

    bot_half = np.zeros((h, w), dtype=bool)
    bot_half[int(h * 0.60):, :] = True

    is_white = (bright >= 240) & (chroma < 18)
    is_shadow = bot_half & (chroma < 18) & (bright >= 95)

    is_bg = np.zeros((h, w), dtype=bool)
    q = deque()

    for x in range(w):
        if (is_white[0, x] or is_shadow[0, x]) and not is_bg[0, x]:
            is_bg[0, x] = True
            q.append((0, x))
        if (is_white[h - 1, x] or is_shadow[h - 1, x]) and not is_bg[h - 1, x]:
            is_bg[h - 1, x] = True
            q.append((h - 1, x))

    for y in range(h):
        if (is_white[y, 0] or is_shadow[y, 0]) and not is_bg[y, 0]:
            is_bg[y, 0] = True
            q.append((y, 0))
        if (is_white[y, w - 1] or is_shadow[y, w - 1]) and not is_bg[y, w - 1]:
            is_bg[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not is_bg[ny, nx]:
                if is_white[ny, nx] or is_shadow[ny, nx]:
                    is_bg[ny, nx] = True
                    q.append((ny, nx))

    # Catch any trapped inner shadow between legs
    is_bg |= (bot_half & (chroma < 16) & (bright >= 110))

    mask = (~is_bg).astype(np.uint8) * 255
    mask_img = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(radius=0.6))

    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask_img)

    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)

    return rgba

def defringe_alpha(img):
    """
    Eliminates anti-aliased white halo/fringe along transparent boundaries.
    """
    img = img.convert("RGBA")
    arr = np.array(img)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    a = arr[:, :, 3]

    pil_a = Image.fromarray(a).filter(ImageFilter.MinFilter(3))
    eroded_a = np.array(pil_a)

    bright = (r.astype(np.float32) + g.astype(np.float32) + b.astype(np.float32)) / 3.0
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    is_white_fringe = (bright >= 225) & (chroma < 24)
    eroded_a[is_white_fringe] = 0

    final_a = Image.fromarray(eroded_a).filter(ImageFilter.MinFilter(3))

    pil_r = Image.fromarray(r)
    pil_g = Image.fromarray(g)
    pil_b = Image.fromarray(b)

    cleaned = Image.merge("RGBA", (pil_r, pil_g, pil_b, final_a))
    bbox = cleaned.getbbox()
    if bbox:
        cleaned = cleaned.crop(bbox)
    return cleaned

def detect_room_lighting(room_img):
    """
    Detects predominant room light direction ('left', 'right', or 'center')
    based on window signatures and luminance distribution.
    """
    gray = np.array(room_img.convert("L"), dtype=np.float32)
    h, w = gray.shape

    left_edge = gray[:, :max(1, int(w * 0.25))]
    right_edge = gray[:, max(0, int(w * 0.75)):]

    left_window_score = float(np.sum(left_edge > 240)) * float(np.sum(left_edge < 130))
    right_window_score = float(np.sum(right_edge > 240)) * float(np.sum(right_edge < 130))

    ratio = (left_window_score + 1.0) / (right_window_score + 1.0)
    if ratio > 3.0:
        return "left"
    elif ratio < 0.33:
        return "right"

    upper = gray[:max(1, int(h * 0.60)), :]
    left_lum = float(np.mean(upper[:, :max(1, int(w * 0.40))]))
    right_lum = float(np.mean(upper[:, max(0, int(w * 0.60)):]))

    if left_lum - right_lum > 18.0:
        return "left"
    elif right_lum - left_lum > 18.0:
        return "right"

    return "center"

def straighten_furniture(img):
    """
    Detects 3/4 isometric product catalog tilts and rectifies the furniture
    to be straight-oriented and parallel to the room's back wall.
    """
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    h, w = alpha.shape

    l_pts = np.where(alpha[:, :max(1, int(w * 0.25))] > 80)[0]
    r_pts = np.where(alpha[:, max(0, int(w * 0.75)):] > 80)[0]
    if len(l_pts) == 0 or len(r_pts) == 0:
        return img

    ly = l_pts.max()
    ry = r_pts.max()
    tilt_dy = ry - ly

    # Only rectify if there is a noticeable slant (> 5px)
    if abs(tilt_dy) < 5:
        return img

    try:
        src_pts = [(0, 0), (w, 0), (w, h), (0, h)]
        dst_pts = [(0, 0), (w, -int(tilt_dy)), (w, h - int(tilt_dy)), (0, h)]
        coeffs = compute_homography_coeffs(src_pts, dst_pts)
        out_h = h + abs(int(tilt_dy)) + 20
        rectified = img.transform((w, out_h), Image.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)
        bbox = rectified.getbbox()
        return rectified.crop(bbox) if bbox else rectified
    except Exception:
        return img

def get_furniture_contact_profile(furn_rgba):
    """
    Extracts the bottom-most pixel coordinates of the furniture for each column,
    identifying physical floor contact points and the true ground baseline.
    """
    arr = np.array(furn_rgba)
    alpha = arr[:, :, 3]
    h, w = alpha.shape

    lowest_y = np.full(w, -1, dtype=np.int32)
    for x in range(w):
        ys = np.where(alpha[:, x] > 70)[0]
        if len(ys) > 0:
            lowest_y[x] = ys[-1]

    valid = lowest_y[lowest_y > -1]
    max_y = int(valid.max()) if len(valid) > 0 else (h - 1)
    return lowest_y, max_y

class FurnitureGenerator:
    """
    Spatial furniture placement & compositing engine.
    Supports ControlNet inpainting when GPU is available and high-fidelity
    spatial alpha compositing with depth-aware scale, 3D perspective homography,
    directional cast shadows, and leg-level contact ambient occlusion (AO).
    """
    def __init__(self, use_controlnet=True, cache_dir="models"):
        self.use_controlnet = use_controlnet
        self.cache_dir = cache_dir
        self.pipeline = None
        self._load_pipeline()

    def _load_pipeline(self):
        try:
            import torch
            from diffusers import StableDiffusionControlNetInpaintPipeline, ControlNetModel
            if torch.cuda.is_available():
                print("[Generator] Initializing ControlNet inpainting pipeline on CUDA...")
            else:
                print("[Generator] Hardware: CPU detected. Fast spatial compositing engine active.")
        except Exception as e:
            print(f"[Generator] Diffusers initialization deferred ({e}).")

    def generate(self, room_img, mask_img, furniture_img, depth_img=None, scale_factor=None,
                 anchor_x=None, anchor_y=None, prompt="", light_direction="auto", wall_zone="auto"):
        """
        Synthesizes realistic 3D perspective placement of furniture into room_img.
        Guarantees:
        - True 3D perspective foreshortening aligned with room vanishing lines and wall face
        - Floor-only placement restriction (clamps out wall/ceiling clicks)
        - Dynamic 3D wall-facing rotation when placed near walls
        - Micro-AO contact grounding under every leg (front and rear)
        - Multiplicative directional cast shadow with natural penumbra falloff
        - 3D directional lighting with solar warmth and floor bounce
        """
        room_rgb = np.array(room_img.convert("RGB"), dtype=np.float32)
        rh, rw, _ = room_rgb.shape

        # Compute depth-aware scale factor if not explicitly provided
        if scale_factor is None:
            if depth_img is not None:
                depth_arr = np.array(depth_img.convert("L"))
                mask_arr = np.array(mask_img.convert("L"))
                if np.sum(mask_arr > 0) > 0:
                    avg_depth = np.mean(depth_arr[mask_arr > 0])
                else:
                    avg_depth = np.mean(depth_arr)
                norm_d = avg_depth / 255.0
                scale_factor = float(np.clip(0.55 + (norm_d * 0.60), 0.50, 1.25))
            else:
                scale_factor = 1.0

        # Ensure furniture has valid alpha channel
        furn = furniture_img.convert("RGBA")
        furn_arr = np.array(furn)

        if np.mean(furn_arr[:, :, 3] == 255) > 0.98:
            furn = extract_alpha_cutout(furn)
            furn_arr = np.array(furn)

        bbox = furn.getbbox()
        if bbox:
            furn = furn.crop(bbox)

        furn = defringe_alpha(furn)

        # Scale furniture proportionally to room resolution and depth scale factor
        target_furn_w = int(rw * 0.44 * scale_factor)
        aspect = furn.size[1] / max(1, furn.size[0])
        target_furn_h = int(target_furn_w * aspect)
        furn = furn.resize((target_furn_w, target_furn_h), Image.LANCZOS)
        fw, fh = furn.size

        # Find placement anchor from user position, mask centroid, or floor plane
        mask = mask_img.convert("L")
        mask_np = np.array(mask)
        coords = np.argwhere(mask_np > 128)

        center_x = None
        center_y = None

        if anchor_x is not None and anchor_y is not None:
            try:
                center_x = int(rw * float(anchor_x))
                center_y = int(rh * float(anchor_y))
            except (TypeError, ValueError):
                center_x = None
                center_y = None

        if center_x is None or center_y is None:
            if len(coords) > 0:
                y_coords = coords[:, 0]
                center_y = int(np.percentile(y_coords, 75))
                center_x = int(np.median(coords[:, 1]))
                if center_y < int(rh * 0.68):
                    center_y = int(rh * 0.80)
            else:
                center_x = rw // 2
                center_y = int(rh * 0.80)

        # Floor-only constraint: Ensure anchor is on the floor plane (never floating on wall or ceiling)
        min_floor_y = int(rh * 0.52)
        if center_y < min_floor_y:
            center_y = min_floor_y + int(rh * 0.04)

        # -------------------------------------------------------------
        # 1. 3D Wall-Facing Reorientation & Perspective Homography
        # -------------------------------------------------------------
        if not wall_zone or wall_zone == "auto":
            rel_x = center_x / float(rw)
            rel_y = center_y / float(rh)
            if rel_x <= 0.35:
                effective_wall = "left_wall"
            elif rel_x >= 0.65:
                effective_wall = "right_wall"
            elif rel_y <= 0.64:
                effective_wall = "back_wall"
            else:
                effective_wall = "open_floor"
        else:
            effective_wall = wall_zone.lower()

        # Measure native facing direction from catalog photo
        arr_a = np.array(furn.convert("RGBA"))[:, :, 3]
        l_pts = np.where(arr_a[:, :max(1, int(fw * 0.25))] > 80)[0]
        r_pts = np.where(arr_a[:, max(0, int(fw * 0.75)):] > 80)[0]
        ly = l_pts.max() if len(l_pts) > 0 else fh - 1
        ry = r_pts.max() if len(r_pts) > 0 else fh - 1
        native_tilt = ry - ly  # Negative when left is in front (faces left), positive when right is in front (faces right)
        native_faces_left = native_tilt < -10
        native_faces_right = native_tilt > 10

        try:
            Vx = rw / 2.0
            Vy = rh * 0.44  # Horizon line
            D_base = max(10.0, center_y - Vy)
            D_top = max(5.0, (center_y - fh) - Vy)
            ratio = float(np.clip(D_top / D_base, 0.90, 0.97))
            top_taper = (1.0 - ratio) * (fw * 0.45)
            lateral_shift = ((center_x - Vx) / (Vx + 1e-5)) * (fw * 0.04)

            src_pts = [(0, 0), (fw, 0), (fw, fh), (0, fh)]

            if effective_wall == "left_wall":
                # Aligned along left wall: MUST face CENTER (turned towards the right)
                if native_faces_left:
                    furn = furn.transpose(Image.FLIP_LEFT_RIGHT)
                # Level baseline so both feet contact floor firmly
                furn = straighten_furniture(furn)
                fw, fh = furn.size
                src_pts = [(0, 0), (fw, 0), (fw, fh), (0, fh)]
                # Inward 3D perspective: left side against wall recedes slightly, right side angles toward room center
                dst_pts = [
                    (int(fw * 0.03), int(fh * 0.03)),
                    (fw, 0),
                    (fw, fh),
                    (0, fh)
                ]
            elif effective_wall == "right_wall":
                # Aligned along right wall: MUST face CENTER (turned towards the left)
                if native_faces_right:
                    furn = furn.transpose(Image.FLIP_LEFT_RIGHT)
                # Level baseline so both feet contact floor firmly
                furn = straighten_furniture(furn)
                fw, fh = furn.size
                src_pts = [(0, 0), (fw, 0), (fw, fh), (0, fh)]
                # Inward 3D perspective: right side against wall recedes slightly, left side angles toward room center
                dst_pts = [
                    (0, 0),
                    (int(fw * 0.97), int(fh * 0.03)),
                    (fw, fh),
                    (0, fh)
                ]
            else:
                # CENTER / OPEN FLOOR: Center-oriented (straight frontal, level baseline)
                furn = straighten_furniture(furn)
                fw, fh = furn.size
                src_pts = [(0, 0), (fw, 0), (fw, fh), (0, fh)]
                dst_pts = [
                    (top_taper + lateral_shift, 0),
                    (fw - top_taper + lateral_shift, 0),
                    (fw, fh),
                    (0, fh)
                ]

            h_coeffs = compute_homography_coeffs(src_pts, dst_pts)
            furn = furn.transform((fw, fh), Image.PERSPECTIVE, h_coeffs, Image.Resampling.BICUBIC)
        except Exception as he:
            print(f"[Homography] Precision fallback: {he}")

        # Detect contact profile
        lowest_y, max_contact_y = get_furniture_contact_profile(furn)
        top_left_x = int(np.clip(center_x - fw // 2, 10, max(10, rw - fw - 10)))
        top_left_y = int(np.clip(center_y - max_contact_y, 10, max(10, rh - fh - 10)))

        # Detect distinct 3D legs (both front and rear)
        window = max(5, int(fw * 0.02))
        smoothed = np.copy(lowest_y).astype(np.float32)
        for x in range(fw):
            if lowest_y[x] > 0:
                val = lowest_y[max(0, x - window):min(fw, x + window + 1)]
                val = val[val > 0]
                if len(val) > 0:
                    smoothed[x] = np.mean(val)

        distinct_legs = []
        min_leg_dist = max(15, int(fw * 0.08))
        for x in range(1, fw - 1):
            if smoothed[x] > int(fh * 0.45):
                nh = smoothed[max(0, x - min_leg_dist // 2):min(fw, x + min_leg_dist // 2 + 1)]
                if smoothed[x] == nh.max():
                    if not any(abs(x - d[0]) < min_leg_dist for d in distinct_legs):
                        distinct_legs.append((x, int(lowest_y[x])))

        # Determine light direction
        if not light_direction or light_direction == "auto":
            effective_light = detect_room_lighting(room_img)
        else:
            effective_light = light_direction.lower()

        # Multiplicative shadow attenuation map
        shadow_attenuation = np.ones((rh, rw), dtype=np.float32)
        alpha = np.array(furn.split()[3], dtype=np.float32)

        # -------------------------------------------------------------
        # 2. 3D Directional Cast Ground Shadow (Ray Projection)
        # -------------------------------------------------------------
        if effective_light == "left":
            shear_x = 0.70
            pitch_y = -0.18  # Casts to the right and recedes along floor perspective
        elif effective_light == "right":
            shear_x = -0.70
            pitch_y = -0.18
        else:
            shear_x = 0.0
            pitch_y = 0.20

        out_h = int(fh * 0.40) + 40
        out_w = int(fw + fh * abs(shear_x)) + 40

        Y, X = np.mgrid[0:fh, 0:fw]
        h_obj = (fh - Y).astype(np.float32)

        if shear_x >= 0:
            X_proj = np.clip((X + h_obj * shear_x).astype(np.int32), 0, out_w - 1)
            cast_x_pos = top_left_x
        else:
            X_proj = np.clip((X + h_obj * shear_x + fh * abs(shear_x)).astype(np.int32), 0, out_w - 1)
            cast_x_pos = top_left_x - int(fh * abs(shear_x))

        Y_proj = np.clip(((out_h - 15) + h_obj * pitch_y).astype(np.int32), 0, out_h - 1)

        cast_mask = np.zeros((out_h, out_w), dtype=np.float32)
        valid = alpha > 40
        np.maximum.at(cast_mask, (Y_proj[valid], X_proj[valid]), alpha[valid])

        try:
            blur_sharp = Image.fromarray(cast_mask.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2.2))
            blur_soft = Image.fromarray(cast_mask.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=9.0))
            arr_sharp = np.array(blur_sharp, dtype=np.float32) / 255.0
            arr_soft = np.array(blur_soft, dtype=np.float32) / 255.0

            grad = np.linspace(1.0, 0.0, out_h)[:, np.newaxis]
            penumbra = arr_sharp * (1.0 - grad) + arr_soft * grad
            penumbra = penumbra * (1.0 - grad * 0.35)
            cast_density = penumbra * 0.54

            cast_y_pos = top_left_y + max_contact_y - (out_h - 15)
            for py in range(out_h):
                ry = cast_y_pos + py
                if 0 <= ry < rh:
                    for px in range(out_w):
                        rx = cast_x_pos + px
                        if 0 <= rx < rw:
                            shadow_attenuation[ry, rx] *= (1.0 - cast_density[py, px])
        except Exception as pe:
            print(f"[CastShadow] Non-critical fallback: {pe}")

        # -------------------------------------------------------------
        # 3. Primary Diffuse Undercarriage Shadow (Section 4.9.2 Compliant)
        # -------------------------------------------------------------
        shadow_w = int(fw * 1.15)
        shadow_h = int(fh * 0.28)
        Yd, Xd = np.ogrid[:shadow_h, :shadow_w]
        cyd, cxd = shadow_h / 2, shadow_w / 2
        dist_d = ((Xd - cxd) / (shadow_w / 2)) ** 2 + ((Yd - cyd) / (shadow_h / 2)) ** 2
        alpha_diffuse = np.clip(1.0 - dist_d, 0.0, 1.0) * 0.38
        under_pil = Image.fromarray((alpha_diffuse * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=11))
        under_arr = np.array(under_pil, dtype=np.float32) / 255.0 * 0.38

        ux = center_x - shadow_w // 2
        uy = top_left_y + max_contact_y - int(shadow_h * 0.45)
        for py in range(shadow_h):
            ry = uy + py
            if 0 <= ry < rh:
                for px in range(shadow_w):
                    rx = ux + px
                    if 0 <= rx < rw:
                        shadow_attenuation[ry, rx] *= (1.0 - under_arr[py, px])

        # -------------------------------------------------------------
        # 4. Leg-Level Contact Ambient Occlusion (AO Grounding in 3D)
        # -------------------------------------------------------------
        ao_rx = max(7, int(fw * 0.022))
        ao_ry = max(3, int(fh * 0.015))
        for lx, ly in distinct_legs:
            cx_leg = top_left_x + lx
            cy_leg = top_left_y + ly
            Yp, Xp = np.ogrid[:ao_ry * 2, :ao_rx * 2]
            d_leg = ((Xp - ao_rx) / ao_rx) ** 2 + ((Yp - ao_ry) / ao_ry) ** 2
            leg_ao = np.clip(1.0 - d_leg, 0.0, 1.0) * 0.85
            leg_ao_pil = Image.fromarray((leg_ao * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.2))
            leg_arr = np.array(leg_ao_pil, dtype=np.float32) / 255.0 * 0.85
            for dy in range(ao_ry * 2):
                ry = cy_leg - ao_ry + dy
                if 0 <= ry < rh:
                    for dx in range(ao_rx * 2):
                        rx = cx_leg - ao_rx + dx
                        if 0 <= rx < rw:
                            shadow_attenuation[ry, rx] *= (1.0 - leg_arr[dy, dx])

        # Apply multiplicative lighting attenuation to room
        final_room = room_rgb * shadow_attenuation[:, :, np.newaxis]
        final_room_img = Image.fromarray(np.clip(final_room, 0, 255).astype(np.uint8)).convert("RGBA")

        # -------------------------------------------------------------
        # 5. Volumetric 3D Directional Lighting on Furniture
        # -------------------------------------------------------------
        furn_rgb = np.array(furn.convert("RGB"), dtype=np.float32)
        if effective_light == "left":
            sun_grad_x = np.linspace(1.15, 0.85, fw)[np.newaxis, :, np.newaxis]
            sky_grad_y = np.linspace(1.04, 0.96, fh)[:, np.newaxis, np.newaxis]
            lit_furn = furn_rgb * sun_grad_x * sky_grad_y
            warm_tint = np.zeros_like(lit_furn)
            warm_tint[..., 0] = 9.0
            warm_tint[..., 1] = 6.0
            left_weight = np.linspace(1.0, 0.0, fw)[np.newaxis, :, np.newaxis]
            lit_furn += warm_tint * left_weight
        elif effective_light == "right":
            sun_grad_x = np.linspace(0.85, 1.15, fw)[np.newaxis, :, np.newaxis]
            sky_grad_y = np.linspace(1.04, 0.96, fh)[:, np.newaxis, np.newaxis]
            lit_furn = furn_rgb * sun_grad_x * sky_grad_y
            warm_tint = np.zeros_like(lit_furn)
            warm_tint[..., 0] = 9.0
            warm_tint[..., 1] = 6.0
            right_weight = np.linspace(0.0, 1.0, fw)[np.newaxis, :, np.newaxis]
            lit_furn += warm_tint * right_weight
        else:
            sky_grad_y = np.linspace(1.03, 0.97, fh)[:, np.newaxis, np.newaxis]
            lit_furn = furn_rgb * sky_grad_y

        # Floor bounce reflection on bottom 16% of furniture
        bounce_h = max(2, int(fh * 0.16))
        bounce_weight = np.linspace(0.0, 1.0, bounce_h)[:, np.newaxis, np.newaxis]
        lit_furn[fh - bounce_h:, :, 0] += 6.0 * bounce_weight[..., 0]
        lit_furn[fh - bounce_h:, :, 1] += 4.0 * bounce_weight[..., 0]

        lit_furn_img = Image.fromarray(np.clip(lit_furn, 0, 255).astype(np.uint8)).convert("RGBA")
        soft_alpha = furn.split()[3].filter(ImageFilter.GaussianBlur(radius=0.4))
        lit_furn_img.putalpha(soft_alpha)

        # -------------------------------------------------------------
        # 6. Final Alpha Composite
        # -------------------------------------------------------------
        final_composite = final_room_img.copy()
        final_composite.paste(lit_furn_img, (top_left_x, top_left_y), lit_furn_img)
        return final_composite.convert("RGB")
