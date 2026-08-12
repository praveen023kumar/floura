#!/usr/bin/env python3
import os
import sys

print("--- Floura Standalone Tauri v2 Icon Generator ---")

try:
    from PIL import Image
except ImportError:
    print("\nError: The 'Pillow' library is required to run this script.")
    print("Please install it by running:")
    print("    pip3 install Pillow")
    print("or:")
    print("    python3 -m pip install Pillow")
    sys.exit(1)

def resize_and_save(img, size, dest_path):
    """Resize image to a square size and save to dest_path."""
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    # Ensure it is saved as RGBA PNG for Tauri requirements
    resized = resized.convert("RGBA")
    resized.save(dest_path, "PNG")
    print(f"Generated: {dest_path} ({size}x{size})")

def main():
    # Detect the source image
    possible_sources = [
        "src/assets/images/floura_logo.png",
        "src/assets/images/floura_logo.jpg",
        "favicon.png",
        "public/favicon.png"
    ]
    
    source_path = None
    for src in possible_sources:
        if os.path.exists(src):
            source_path = src
            break
            
    if len(sys.argv) > 1:
        source_path = sys.argv[1]

    if not source_path or not os.path.exists(source_path):
        print("\nError: Source image not found.")
        print("Please provide the path to your high-resolution PNG/JPG logo:")
        print("    python3 generate_icons.py path/to/your/logo.png")
        sys.exit(1)

    print(f"Using source image: {source_path}")

    try:
        img = Image.open(source_path)
    except Exception as e:
        print(f"Error opening source image: {e}")
        sys.exit(1)

    # Ensure image is square or pad it, and make sure it has alpha channel if PNG
    if img.width != img.height:
        print(f"Warning: Source image is not square ({img.width}x{img.height}). Padding to square...")
        size = max(img.width, img.height)
        new_img = Image.new("RGBA" if img.mode == "RGBA" else "RGB", (size, size), (255, 255, 255, 0) if img.mode == "RGBA" else (255, 255, 255))
        new_img.paste(img, ((size - img.width) // 2, (size - img.height) // 2))
        img = new_img

    # Define all standard Tauri v2 PNG sizes
    png_sizes = {
        "src-tauri/icons/32x32.png": 32,
        "src-tauri/icons/64x64.png": 64,
        "src-tauri/icons/128x128.png": 128,
        "src-tauri/icons/128x128@2x.png": 256,
        "src-tauri/icons/icon.png": 512,
        
        # Windows Appx Store sizes
        "src-tauri/icons/StoreLogo.png": 50,
        "src-tauri/icons/Square30x30Logo.png": 30,
        "src-tauri/icons/Square44x44Logo.png": 44,
        "src-tauri/icons/Square71x71Logo.png": 71,
        "src-tauri/icons/Square89x89Logo.png": 89,
        "src-tauri/icons/Square107x107Logo.png": 107,
        "src-tauri/icons/Square142x142Logo.png": 142,
        "src-tauri/icons/Square150x150Logo.png": 150,
        "src-tauri/icons/Square284x284Logo.png": 284,
        "src-tauri/icons/Square310x310Logo.png": 310,
    }

    # Define iOS sizes
    ios_sizes = {
        "src-tauri/icons/ios/AppIcon-20x20@1x.png": 20,
        "src-tauri/icons/ios/AppIcon-20x20@2x.png": 40,
        "src-tauri/icons/ios/AppIcon-20x20@2x-1.png": 40,
        "src-tauri/icons/ios/AppIcon-20x20@3x.png": 60,
        "src-tauri/icons/ios/AppIcon-29x29@1x.png": 29,
        "src-tauri/icons/ios/AppIcon-29x29@2x.png": 58,
        "src-tauri/icons/ios/AppIcon-29x29@2x-1.png": 58,
        "src-tauri/icons/ios/AppIcon-29x29@3x.png": 87,
        "src-tauri/icons/ios/AppIcon-40x40@1x.png": 40,
        "src-tauri/icons/ios/AppIcon-40x40@2x.png": 80,
        "src-tauri/icons/ios/AppIcon-40x40@2x-1.png": 80,
        "src-tauri/icons/ios/AppIcon-40x40@3x.png": 120,
        "src-tauri/icons/ios/AppIcon-60x60@2x.png": 120,
        "src-tauri/icons/ios/AppIcon-60x60@3x.png": 180,
        "src-tauri/icons/ios/AppIcon-76x76@1x.png": 76,
        "src-tauri/icons/ios/AppIcon-76x76@2x.png": 152,
        "src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png": 167,
        "src-tauri/icons/ios/AppIcon-512@2x.png": 1024,
    }

    # Define Android sizes
    android_sizes = {
        "src-tauri/icons/android/mipmap-mdpi/ic_launcher.png": 48,
        "src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png": 48,
        "src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png": 108,
        
        "src-tauri/icons/android/mipmap-hdpi/ic_launcher.png": 72,
        "src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png": 72,
        "src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png": 162,
        
        "src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png": 96,
        "src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png": 96,
        "src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png": 216,
        
        "src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png": 144,
        "src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png": 144,
        "src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png": 324,
        
        "src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png": 192,
        "src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png": 192,
        "src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png": 432,
    }

    print("\n1. Generating PNG files...")
    all_png_sizes = {**png_sizes, **ios_sizes, **android_sizes}
    for path, size in all_png_sizes.items():
        resize_and_save(img, size, path)

    # 2. Generate Windows ICO file
    print("\n2. Generating Windows ICO bundle...")
    ico_path = "src-tauri/icons/icon.ico"
    ico_sizes = [16, 24, 32, 48, 64, 256]
    ico_imgs = []
    # Convert image to RGBA for proper transparency support in ICO
    rgba_img = img.convert("RGBA")
    for size in ico_sizes:
        ico_imgs.append(rgba_img.resize((size, size), Image.Resampling.LANCZOS))
    
    # Save the multi-resolution ICO file
    os.makedirs(os.path.dirname(ico_path), exist_ok=True)
    ico_imgs[0].save(ico_path, format="ICO", sizes=[(s, s) for s in ico_sizes])
    print(f"Generated: {ico_path} with sizes {ico_sizes}")

    # 3. Generate macOS ICNS file
    print("\n3. Generating macOS ICNS bundle...")
    icns_path = "src-tauri/icons/icon.icns"
    icns_sizes = [16, 32, 64, 128, 256, 512, 1024]
    icns_imgs = []
    for size in icns_sizes:
        icns_imgs.append(rgba_img.resize((size, size), Image.Resampling.LANCZOS))
    
    # Save the multi-resolution ICNS file
    icns_imgs[0].save(icns_path, format="ICNS", sizes=[(s, s) for s in icns_sizes])
    print(f"Generated: {icns_path} with sizes {icns_sizes}")

    print("\n✅ Success! All Tauri v2 icons generated successfully without corruption.")

if __name__ == "__main__":
    main()
