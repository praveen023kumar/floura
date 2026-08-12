const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Floura Cordova Mobile Icon Generator ===');

const rootDir = path.join(__dirname, '..');
const cordovaDir = path.join(rootDir, 'cordova');
const sourceImage = path.join(rootDir, 'src/assets/images/floura_logo.jpg');

if (!fs.existsSync(sourceImage)) {
  console.error(`\n❌ Error: Source image not found at ${sourceImage}`);
  process.exit(1);
}

console.log(`Using source image: ${path.relative(rootDir, sourceImage)}`);

// Define target directories
const iosResDir = path.join(cordovaDir, 'res/icon/ios');
const androidResDir = path.join(cordovaDir, 'res/icon/android');

fs.mkdirSync(iosResDir, { recursive: true });
fs.mkdirSync(androidResDir, { recursive: true });

// Helper to write a 1x1 white pixel PNG hex buffer
const white1x1Png = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789cc7c0c0c00000030001000185b85f240000000049454e44ae426082',
  'hex'
);
const tempWhitePng = path.join(rootDir, 'temp_white.png');
fs.writeFileSync(tempWhitePng, white1x1Png);

// Target definitions for cordova/res/icon/
const iosIcons = {
  'icon-20x20@1x.png': 20,
  'icon-20x20@2x.png': 40,
  'icon-20x20@3x.png': 60,
  'icon-29x29@1x.png': 29,
  'icon-29x29@2x.png': 58,
  'icon-29x29@3x.png': 87,
  'icon-40x40@1x.png': 40,
  'icon-40x40@2x.png': 80,
  'icon-40x40@3x.png': 120,
  'icon-60x60@2x.png': 120,
  'icon-60x60@3x.png': 180,
  'icon-76x76@1x.png': 76,
  'icon-76x76@2x.png': 152,
  'icon-83.5x83.5@2x.png': 167,
  'icon-1024.png': 1024
};

const androidIcons = {
  // Legacy
  'icon-mdpi.png': 48,
  'icon-hdpi.png': 72,
  'icon-xhdpi.png': 96,
  'icon-xxhdpi.png': 144,
  'icon-xxxhdpi.png': 192,

  // Foreground
  'icon-mdpi-foreground.png': 108,
  'icon-hdpi-foreground.png': 162,
  'icon-xhdpi-foreground.png': 216,
  'icon-xxhdpi-foreground.png': 324,
  'icon-xxxhdpi-foreground.png': 432,

  // Background
  'icon-mdpi-background.png': 108,
  'icon-hdpi-background.png': 162,
  'icon-xhdpi-background.png': 216,
  'icon-xxhdpi-background.png': 324,
  'icon-xxxhdpi-background.png': 432
};

try {
  console.log('\nGenerating iOS icons...');
  for (const [filename, size] of Object.entries(iosIcons)) {
    const dest = path.join(iosResDir, filename);
    execSync(`sips -z ${size} ${size} -s format png "${sourceImage}" --out "${dest}"`, { stdio: 'ignore' });
    console.log(` -> Generated iOS: ${filename} (${size}x${size})`);
  }

  console.log('\nGenerating Android icons...');
  for (const [filename, size] of Object.entries(androidIcons)) {
    const dest = path.join(androidResDir, filename);
    if (filename.includes('background')) {
      // Background is solid white
      execSync(`sips -z ${size} ${size} -s format png "${tempWhitePng}" --out "${dest}"`, { stdio: 'ignore' });
    } else {
      // Foreground and Legacy are resized logo
      execSync(`sips -z ${size} ${size} -s format png "${sourceImage}" --out "${dest}"`, { stdio: 'ignore' });
    }
    console.log(` -> Generated Android: ${filename} (${size}x${size})`);
  }

  // Overwriting active platform directories directly to guarantee success
  console.log('\nOverwriting iOS Platform Icons directly...');
  const iosPlatformIconDir = path.join(cordovaDir, 'platforms/ios/App/Assets.xcassets/AppIcon.appiconset');
  if (fs.existsSync(iosPlatformIconDir)) {
    const targetPng = path.join(iosPlatformIconDir, 'icon.png');
    execSync(`sips -z 1024 1024 -s format png "${sourceImage}" --out "${targetPng}"`, { stdio: 'ignore' });
    console.log(` -> Overwrote platform iOS AppIcon: ${targetPng}`);
  } else {
    console.log(' ⚠️ iOS platform icon asset directory not found. Will rely on config.xml build.');
  }

  console.log('\nOverwriting Android Platform Icons directly...');
  const androidResPlatformDir = path.join(cordovaDir, 'platforms/android/app/src/main/res');
  if (fs.existsSync(androidResPlatformDir)) {
    const densities = {
      'mdpi': { size: 48, adaptive: 108 },
      'hdpi': { size: 72, adaptive: 162 },
      'xhdpi': { size: 96, adaptive: 216 },
      'xxhdpi': { size: 144, adaptive: 324 },
      'xxxhdpi': { size: 192, adaptive: 432 }
    };

    for (const [density, config] of Object.entries(densities)) {
      const mipmapFolder = path.join(androidResPlatformDir, `mipmap-${density}`);
      const mipmapFolderV26 = path.join(androidResPlatformDir, `mipmap-${density}-v26`);

      if (fs.existsSync(mipmapFolder)) {
        // Overwrite legacy icon
        const legacyPath = path.join(mipmapFolder, 'ic_launcher.png');
        execSync(`sips -z ${config.size} ${config.size} -s format png "${sourceImage}" --out "${legacyPath}"`, { stdio: 'ignore' });
        
        // Overwrite legacy round icon if it exists
        const roundPath = path.join(mipmapFolder, 'ic_launcher_round.png');
        execSync(`sips -z ${config.size} ${config.size} -s format png "${sourceImage}" --out "${roundPath}"`, { stdio: 'ignore' });
        console.log(` -> Overwrote Android legacy icons in mipmap-${density}`);
      }

      if (fs.existsSync(mipmapFolderV26)) {
        // Overwrite adaptive foreground
        const forePath = path.join(mipmapFolderV26, 'ic_launcher_foreground.png');
        execSync(`sips -z ${config.adaptive} ${config.adaptive} -s format png "${sourceImage}" --out "${forePath}"`, { stdio: 'ignore' });

        // Overwrite adaptive background
        const backPath = path.join(mipmapFolderV26, 'ic_launcher_background.png');
        execSync(`sips -z ${config.adaptive} ${config.adaptive} -s format png "${tempWhitePng}" --out "${backPath}"`, { stdio: 'ignore' });
        console.log(` -> Overwrote Android adaptive icons in mipmap-${density}-v26`);
      }
    }
  } else {
    console.log(' ⚠️ Android platform res directory not found. Will rely on config.xml build.');
  }

  // Cleanup temp files
  if (fs.existsSync(tempWhitePng)) {
    fs.unlinkSync(tempWhitePng);
  }

  console.log('\n✨ SUCCESS! All Cordova icons generated and synced successfully.');
} catch (err) {
  console.error('\n❌ Error generating icons:', err.message);
  // Cleanup temp files on error
  if (fs.existsSync(tempWhitePng)) {
    fs.unlinkSync(tempWhitePng);
  }
  process.exit(1);
}
