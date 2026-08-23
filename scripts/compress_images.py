import os
from PIL import Image

IMAGES_DIR = "src/assets/images"

def compress_image(filename, max_width, quality=80):
    filepath = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} (not found)")
        return
        
    original_size = os.path.getsize(filepath)
    img = Image.open(filepath)
    width, height = img.size
    
    # Calculate new dimensions
    if width > max_width:
        ratio = max_width / float(width)
        new_height = int(float(height) * float(ratio))
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        print(f"Resized {filename} from {width}x{height} to {max_width}x{new_height}")
    else:
        print(f"No resize needed for {filename} ({width}x{height})")
        
    # Save as webp
    name_without_ext = os.path.splitext(filename)[0]
    out_filename = f"{name_without_ext}.webp"
    out_path = os.path.join(IMAGES_DIR, out_filename)
    
    img.save(out_path, "WEBP", quality=quality)
    new_size = os.path.getsize(out_path)
    
    print(f"Compressed {filename}: {original_size/1024:.1f} KB -> {out_filename}: {new_size/1024:.1f} KB ({((original_size - new_size)/original_size)*100:.1f}% reduction)\n")

def main():
    print("--- Floura Image Optimization Script ---")
    # Compress Chef photo (max width 800px)
    compress_image("chef_hero_photo.jpg", max_width=800, quality=80)
    # Compress Logo (max width 120px)
    compress_image("floura_logo.jpg", max_width=120, quality=90)
    compress_image("floura_logo.png", max_width=120, quality=90)
    # Compress Login Banner (max width 1200px)
    compress_image("bakery_login_banner_1783080828078.jpg", max_width=1200, quality=80)

if __name__ == "__main__":
    main()
