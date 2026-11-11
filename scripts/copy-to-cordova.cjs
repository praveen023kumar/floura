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
    // Exclude backend server build files, downloads, APKs, and OS artifacts
    if (
      entry.name === 'server.cjs' ||
      entry.name === 'server.cjs.map' ||
      entry.name === 'downloads' ||
      entry.name === '.DS_Store' ||
      entry.name.endsWith('.apk') ||
      entry.name.endsWith('.zip')
    ) {
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

// Inject Cordova environment flags and cordova.js into cordova/www/index.html
const cordovaHtmlPath = path.join(destDir, 'index.html');
if (fs.existsSync(cordovaHtmlPath)) {
  let html = fs.readFileSync(cordovaHtmlPath, 'utf8');
  if (!html.includes('IS_CORDOVA_APP')) {
    html = html.replace(
      '<head>',
      '<head>\n    <script>window.IS_CORDOVA_APP = true; window.FLOURA_NATIVE_APP = true;</script>\n    <script src="cordova.js"></script>'
    );
  }
  if (!html.includes('cordova.js')) {
    html = html.replace('<div id="root"></div>', '<div id="root"></div>\n    <script src="cordova.js"></script>');
  }
  fs.writeFileSync(cordovaHtmlPath, html, 'utf8');
  console.log('Injected IS_CORDOVA_APP flag and cordova.js into cordova/www/index.html');
}

console.log('Successfully copied assets to cordova/www!');
