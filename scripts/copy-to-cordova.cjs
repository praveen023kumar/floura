const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../dist');
const destDir = path.join(__dirname, '../cordova/www');

if (!fs.existsSync(srcDir)) {
  console.error('Source directory dist/ does not exist. Did you run npm run build?');
  process.exit(1);
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    // Exclude backend server build files
    if (entry.name === 'server.cjs' || entry.name === 'server.cjs.map') {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Cleaning cordova/www...');
cleanDir(destDir);
console.log('Copying build assets from dist/ to cordova/www...');
copyDir(srcDir, destDir);
console.log('Successfully copied assets to cordova/www!');
