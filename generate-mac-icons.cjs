const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== macOS Native Tauri v2 Icon Generator ===');

// List of potential source image locations in order of preference
const potentialSources = [
  path.join(__dirname, 'src', 'assets', 'images', 'floura_logo_1783155303019.jpg'),
  path.join(__dirname, 'src', 'assets', 'images', 'floura_logo.jpg'),
  path.join(__dirname, 'src', 'assets', 'images', 'floura_logo.png'),
  path.join(__dirname, 'favicon.png'),
  path.join(__dirname, 'public', 'favicon.png')
];

let selectedSource = null;

for (const src of potentialSources) {
  if (fs.existsSync(src)) {
    // Check if the file is uncorrupted (not containing git merge conflict markers or UTF-8 damages)
    try {
      const fd = fs.openSync(src, 'r');
      const buffer = Buffer.alloc(10);
      fs.readSync(fd, buffer, 0, 10, 0);
      fs.closeSync(fd);
      
      // Check for UTF-8 replacement char EF BF BD
      const isCorrupted = buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd;
      if (!isCorrupted) {
        selectedSource = src;
        break;
      }
    } catch (e) {
      // Keep checking fallbacks
    }
  }
}

if (!selectedSource) {
  console.error('\n❌ Error: Could not find any valid uncorrupted source image.');
  console.log('Please make sure you have "floura_logo.jpg" or similar in your "src/assets/images/" folder.');
  process.exit(1);
}

console.log(`Using uncorrupted source image: ${path.relative(__dirname, selectedSource)}`);

// Define target sizes and paths
const pngTargets = {
  // Main Tauri icons
  'src-tauri/icons/32x32.png': 32,
  'src-tauri/icons/64x64.png': 64,
  'src-tauri/icons/128x128.png': 128,
  'src-tauri/icons/128x128@2x.png': 256,
  'src-tauri/icons/icon.png': 512,

  // Windows Appx/Store Logo Assets
  'src-tauri/icons/StoreLogo.png': 50,
  'src-tauri/icons/Square30x30Logo.png': 30,
  'src-tauri/icons/Square44x44Logo.png': 44,
  'src-tauri/icons/Square71x71Logo.png': 71,
  'src-tauri/icons/Square89x89Logo.png': 89,
  'src-tauri/icons/Square107x107Logo.png': 107,
  'src-tauri/icons/Square142x142Logo.png': 142,
  'src-tauri/icons/Square150x150Logo.png': 150,
  'src-tauri/icons/Square284x284Logo.png': 284,
  'src-tauri/icons/Square310x310Logo.png': 310,

  // iOS App Icons
  'src-tauri/icons/ios/AppIcon-20x20@1x.png': 20,
  'src-tauri/icons/ios/AppIcon-20x20@2x.png': 40,
  'src-tauri/icons/ios/AppIcon-20x20@2x-1.png': 40,
  'src-tauri/icons/ios/AppIcon-20x20@3x.png': 60,
  'src-tauri/icons/ios/AppIcon-29x29@1x.png': 29,
  'src-tauri/icons/ios/AppIcon-29x29@2x.png': 58,
  'src-tauri/icons/ios/AppIcon-29x29@2x-1.png': 58,
  'src-tauri/icons/ios/AppIcon-29x29@3x.png': 87,
  'src-tauri/icons/ios/AppIcon-40x40@1x.png': 40,
  'src-tauri/icons/ios/AppIcon-40x40@2x.png': 80,
  'src-tauri/icons/ios/AppIcon-40x40@2x-1.png': 80,
  'src-tauri/icons/ios/AppIcon-40x40@3x.png': 120,
  'src-tauri/icons/ios/AppIcon-60x60@2x.png': 120,
  'src-tauri/icons/ios/AppIcon-60x60@3x.png': 180,
  'src-tauri/icons/ios/AppIcon-76x76@1x.png': 76,
  'src-tauri/icons/ios/AppIcon-76x76@2x.png': 152,
  'src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png': 167,
  'src-tauri/icons/ios/AppIcon-512@2x.png': 1024,

  // Android Launcher Icons (mipmap)
  'src-tauri/icons/android/mipmap-mdpi/ic_launcher.png': 48,
  'src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png': 48,
  'src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png': 108,
  
  'src-tauri/icons/android/mipmap-hdpi/ic_launcher.png': 72,
  'src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png': 72,
  'src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png': 162,
  
  'src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png': 96,
  'src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png': 96,
  'src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png': 216,
  
  'src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png': 144,
  'src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png': 144,
  'src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png': 324,
  
  'src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png': 192,
  'src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png': 192,
  'src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png': 432
};

try {
  console.log('\nStep 1: Generating PNG files using macOS sips...');
  
  for (const [targetPath, size] of Object.entries(pngTargets)) {
    const fullPath = path.join(__dirname, targetPath);
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    
    // Run sips to resize and convert to png format
    execSync(`sips -z ${size} ${size} -s format png "${selectedSource}" --out "${fullPath}"`, { stdio: 'ignore' });
    console.log(` -> Generated: ${targetPath} (${size}x{size})`);
  }
  
  console.log('\nStep 2: Generating Windows ICO bundle...');
  const icoPath = path.join(__dirname, 'src-tauri/icons/icon.ico');
  execSync(`sips -z 256 256 -s format ico "${selectedSource}" --out "${icoPath}"`, { stdio: 'ignore' });
  console.log(' -> Generated: src-tauri/icons/icon.ico (256x256)');

  console.log('\nStep 3: Generating macOS ICNS bundle using macOS iconutil...');
  const iconsetDir = path.join(__dirname, 'temp_icon.iconset');
  fs.mkdirSync(iconsetDir, { recursive: true });

  const icnsMapping = {
    'icon_16x16.png': 16,
    'icon_16x16@2x.png': 32,
    'icon_32x32.png': 32,
    'icon_32x32@2x.png': 64,
    'icon_128x128.png': 128,
    'icon_128x128@2x.png': 256,
    'icon_256x256.png': 256,
    'icon_256x256@2x.png': 512,
    'icon_512x512.png': 512,
    'icon_512x512@2x.png': 1024
  };

  for (const [filename, size] of Object.entries(icnsMapping)) {
    const outPng = path.join(iconsetDir, filename);
    execSync(`sips -z ${size} ${size} -s format png "${selectedSource}" --out "${outPng}"`, { stdio: 'ignore' });
  }

  const icnsPath = path.join(__dirname, 'src-tauri/icons/icon.icns');
  // Use macOS iconutil to compile the iconset to icns format
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'ignore' });
  
  // Clean up temporary iconset
  fs.rmSync(iconsetDir, { recursive: true, force: true });
  console.log(' -> Generated: src-tauri/icons/icon.icns (compiled iconset)');

  console.log('\n✨ SUCCESS! All Tauri icons generated successfully!');
  console.log('They are uncorrupted, 32-bit RGBA PNG/ICO/ICNS, and ready to be compiled by Cargo and Gradle!');

} catch (err) {
  console.error('\n❌ Error generating icons using native macOS commands:', err.message);
  process.exit(1);
}
