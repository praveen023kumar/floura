const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Generating Floura PWA Icons ===');

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const iconsDir = path.join(publicDir, 'icons');
const sourceImage = path.join(rootDir, 'src/assets/images/floura_logo_original.png');

if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Source image not found at ${sourceImage}`);
  process.exit(1);
}

fs.mkdirSync(iconsDir, { recursive: true });

const standardSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

standardSizes.forEach((size) => {
  const targetPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  execSync(`sips -z ${size} ${size} "${sourceImage}" --out "${targetPath}"`, { stdio: 'pipe' });
  console.log(`Generated: icons/icon-${size}x${size}.png`);
});

// Apple touch icon in root public/
const appleTouchIcon = path.join(publicDir, 'apple-touch-icon.png');
execSync(`sips -z 180 180 "${sourceImage}" --out "${appleTouchIcon}"`, { stdio: 'pipe' });
console.log('Generated: apple-touch-icon.png');

// Maskable icons (use slightly padded or standard)
[192, 512].forEach((size) => {
  const maskablePath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
  execSync(`sips -z ${size} ${size} "${sourceImage}" --out "${maskablePath}"`, { stdio: 'pipe' });
  console.log(`Generated: icons/icon-maskable-${size}x${size}.png`);
});

console.log('✅ All PWA icons generated successfully!');
