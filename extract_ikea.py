import zipfile
import os
import json
import shutil

out_dir = r"e:\pixabuild\frontend\public\ikea_catalog"
os.makedirs(out_dir, exist_ok=True)
repo_dir = r"e:\pixabuild\ikea_dataset_repo"

items = []
catalog_config = [
    ('Living Room2.zip', 'sofa', 'Sofa', 499.00, 'Terracotta', 'Textured Linen & Oak', '218 x 92 x 84 cm'),
    ('Living Room 1.zip', 'coffee', 'Coffee Table', 149.00, 'Natural Oak', 'Solid Oak & Steel', '110 x 60 x 45 cm'),
    ('Living Room 1.zip', 'cabinet', 'Display Cabinet', 329.00, 'Forest Charcoal', 'Pine & Tempered Glass', '90 x 37 x 197 cm'),
    ('Dining Room.zip', 'chair', 'Dining Chair', 89.00, 'Sand Beige', 'Molded Beech & Wool', '52 x 55 x 82 cm'),
    ('Bedroom.zip', 'bed', 'Bed Frame', 599.00, 'Muted Taupe', 'Linen Upholstery & Birch', '180 x 200 x 110 cm'),
    ('HomeOffice.zip', 'desk', 'Office Desk', 279.00, 'Warm Ivory', 'Bamboo & Matte Aluminum', '140 x 70 x 74 cm')
]

for zip_name, filter_kw, cat_name, base_price, color_val, mat_val, dim_val in catalog_config:
    zip_path = os.path.join(repo_dir, zip_name)
    if not os.path.exists(zip_path):
        continue
    with zipfile.ZipFile(zip_path, 'r') as z:
        img_files = [f for f in z.namelist() if f.lower().endswith(('.jpg', '.jpeg', '.png')) and not f.startswith('__')]
        filtered = [f for f in img_files if filter_kw in f.lower()] if filter_kw else img_files
        if not filtered:
            filtered = img_files
            
        selected = filtered[:6]
        for idx, img_path in enumerate(selected):
            clean_tag = cat_name.lower().replace(" ", "_")
            target_fname = f"{clean_tag}_{idx+1}.jpg"
            target_path = os.path.join(out_dir, target_fname)
            
            with z.open(img_path) as src, open(target_path, 'wb') as dst:
                shutil.copyfileobj(src, dst)
            
            item_id = f"ikea-{clean_tag}-{idx+1}"
            price = round(base_price + (idx * 28.0), 2)
            is_sale = (idx % 2 == 1)
            sale_price = round(price * 0.85, 2) if is_sale else None
            
            items.append({
                "item_id": item_id,
                "name": f"IKEA {cat_name} {idx+1}00",
                "category": cat_name,
                "subcategory": f"IKEA {cat_name} Series",
                "price": price,
                "sale_price": sale_price,
                "is_sale": is_sale,
                "color": color_val,
                "material": mat_val,
                "dimensions": dim_val,
                "stock_note": "In Stock (IKEA Curated Collection)",
                "stock_count": 8 + idx * 4,
                "image_url": f"/ikea_catalog/{target_fname}",
                "thumbnail_url": f"/ikea_catalog/{target_fname}",
                "description": f"Scandinavian modern {cat_name.lower()} engineered with sustainable materials, proportioned for architectural harmony and warmth.",
                "tags": [cat_name.lower(), "ikea", "scandinavian", color_val.lower()]
            })

print(f"Extracted {len(items)} items to {out_dir}")
catalog_json_path = os.path.join(out_dir, "catalog.json")
with open(catalog_json_path, "w", encoding="utf-8") as f:
    json.dump(items, f, indent=2)

print("Catalog JSON created successfully!")
