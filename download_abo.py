import os
import json
import shutil
from pathlib import Path
from huggingface_hub import hf_hub_download
import tarfile
from PIL import Image

# 1. Download and extract the dataset
print("Downloading ABO Furniture dataset...")
archive = hf_hub_download(
    repo_id="marco-willi/abo_furniture",
    filename="abo_furniture.tar.gz",
    repo_type="dataset",
)

print("Extracting...")
DATA_PATH = Path("data")
with tarfile.open(archive, "r:gz") as tar:
    tar.extractall(DATA_PATH)

# 2. Build PixaBuild catalog from the extracted images
abo_dir = DATA_PATH / "abo" / "train"
catalog_dir = Path("catalog/images")
catalog_dir.mkdir(parents=True, exist_ok=True)

catalog = {}
item_count = 0
max_items_per_category = 5  # Keep catalog small for the mini project

# Categories we want
categories = ["bed", "chair", "lamp", "sofa", "storage", "table"]

for category in categories:
    cat_dir = abo_dir / category
    if not cat_dir.exists():
        print(f"Category {category} not found, skipping.")
        continue

    # Group images by item_id (extracted from filename)
    # Filename format: <image_id>.jpg — we need to read metadata.csv for item mapping
    # Instead, we'll just sample images directly and treat each as a unique item for simplicity

    images = sorted(cat_dir.glob("*.jpg"))
    selected = images[:max_items_per_category]

    for img_path in selected:
        # Copy to catalog/images
        new_filename = f"{category}_{item_count:03d}.jpg"
        dest_path = catalog_dir / new_filename
        shutil.copy(img_path, dest_path)

        catalog[f"{category}_{item_count:03d}"] = {
            "name": f"{category.replace('_', ' ').title()} {item_count + 1}",
            "category": category,
            "price": round(50 + (item_count * 15.5), 2),
            "image": str(dest_path).replace("\\", "/")
        }

        item_count += 1

# 3. Save catalog.json
with open("catalog/catalog.json", "w") as f:
    json.dump(catalog, f, indent=4)

print(f"\nCatalog created with {item_count} items.")
print("Files saved to catalog/images/")
print("Metadata saved to catalog/catalog.json")
