const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Tauri Local Icon Generator & Repair Tool ---');

// Define potential source images in the project
const possibleSources = [
  path.join(__dirname, 'src', 'assets', 'images', 'floura_logo_1783155303019.jpg'),
  path.join(__dirname, 'src', 'assets', 'images', 'floura_logo.jpg'),
  path.join(__dirname, 'src', 'assets', 'images', 'floura_logo.png'),
  path.join(__dirname, 'public', 'favicon.png'),
  path.join(__dirname, 'favicon.png'),
];

let selectedSource = null;

// Find the first valid, uncorrupted source image
for (const src of possibleSources) {
  if (fs.existsSync(src)) {
    try {
      // Check if it's a valid PNG/JPG or if it has been corrupted by UTF-8 translation
      const buf = fs.readFileSync(src).slice(0, 4);
      const isCorrupted = buf[0] === 0xef && buf[1] === 0xbf && buf[2] === 0xbd;
      
      if (!isCorrupted) {
        selectedSource = src;
        console.log(`Found valid uncorrupted source image: ${path.basename(src)}`);
        break;
      } else {
        console.log(`Skipping corrupted source image (UTF-8 damaged): ${path.basename(src)}`);
      }
    } catch (e) {
      // Ignore read errors
    }
  }
}

if (!selectedSource) {
  console.error('\nError: Could not find any uncorrupted source image in the workspace.');
  console.error('Please place your original, uncorrupted "floura_logo.png" or "floura_logo.jpg" into your local project root and name it "app-icon.png".');
  selectedSource = path.join(__dirname, 'app-icon.png');
}

console.log(`\nGenerating Tauri icons using source: ${selectedSource}...`);

const commands = [
  `npm run tauri icon "${selectedSource}"`,
  `npx @tauri-apps/cli icon "${selectedSource}"`,
  `npx tauri icon "${selectedSource}"`
];

let success = false;

for (const cmd of commands) {
  try {
    console.log(`Trying command: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    success = true;
    break;
  } catch (err) {
    console.log(`Command failed, trying next fallback...\n`);
  }
}

if (success) {
  console.log('\n✅ Success! All Tauri icons have been regenerated locally and are completely uncorrupted.');
  console.log('You can now open "src-tauri/icons/32x32.png" and other files in macOS Preview successfully!');
} else {
  console.error('\n❌ Failed to run Tauri icon generator locally.');
  console.error('To fix this, please run:');
  console.error('    npm install');
  console.error('and then run this script again. Alternatively, you can run the standalone python script:');
  console.error('    python3 generate_icons.py');
}
