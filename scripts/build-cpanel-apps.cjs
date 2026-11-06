// File Path: /scripts/build-cpanel-apps.cjs
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n==================================================');
console.log('🚀 Floura APK & cPanel Build Pipeline');
console.log('   (Android Standalone APK + Web PWA)');
console.log('==================================================\n');

const rootDir = path.resolve(__dirname, '..');
const downloadsDir = path.join(rootDir, 'public', 'downloads');
const distDownloadsDir = path.join(rootDir, 'dist', 'downloads');

// Ensure downloads directory exists
fs.mkdirSync(downloadsDir, { recursive: true });

// Clean up any old desktop installers (dmg, exe, AppImage)
for (const file of fs.readdirSync(downloadsDir)) {
  if (file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.AppImage')) {
    fs.unlinkSync(path.join(downloadsDir, file));
    console.log(`   🧹 Removed non-APK file: ${file}`);
  }
}

function calculateSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function getFileSize(filePath) {
  const bytes = fs.statSync(filePath).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ----------------------------------------------------------------------
// 1. ANDROID APK SETUP & COPY
// ----------------------------------------------------------------------
console.log('📱 [1/3] Setting up Android Standalone APK...');
const androidApkSource = path.join(rootDir, 'cordova', 'platforms', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const androidTarget = path.join(downloadsDir, 'floura-v1.0.0.apk');
const androidLatestTarget = path.join(downloadsDir, 'floura-latest.apk');

if (fs.existsSync(androidApkSource)) {
  fs.copyFileSync(androidApkSource, androidTarget);
  fs.copyFileSync(androidApkSource, androidLatestTarget);
  const size = getFileSize(androidTarget);
  const hash = calculateSha256(androidTarget);
  console.log(`   ✅ Android APK ready: ${androidTarget} (${size})`);
  console.log(`   🔑 SHA-256 Checksum: ${hash}`);
} else if (fs.existsSync(androidTarget)) {
  const size = getFileSize(androidTarget);
  const hash = calculateSha256(androidTarget);
  console.log(`   ✅ Using existing Android APK: ${androidTarget} (${size})`);
  console.log(`   🔑 SHA-256 Checksum: ${hash}`);
} else {
  console.error('   ❌ Error: Android APK not found. Run cordova build first.');
  process.exit(1);
}

// ----------------------------------------------------------------------
// 2. PRODUCTION WEB BUILD
// ----------------------------------------------------------------------
console.log('\n🌐 [2/3] Building production web bundles (npm run build)...');
execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

// Ensure downloads are copied into dist/downloads/
fs.mkdirSync(distDownloadsDir, { recursive: true });
for (const file of fs.readdirSync(downloadsDir)) {
  if (file.endsWith('.apk')) {
    fs.copyFileSync(path.join(downloadsDir, file), path.join(distDownloadsDir, file));
  }
}
console.log('   ✅ Android APK synced to dist/downloads/.');

// ----------------------------------------------------------------------
// 3. CREATE cPANEL DEPLOYMENT ZIP
// ----------------------------------------------------------------------
console.log('\n📦 [3/3] Packaging cpanel-deploy.zip with web app and APK...');
const zipFile = path.join(rootDir, 'cpanel-deploy.zip');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

execSync('zip -r cpanel-deploy.zip dist package.json package-lock.json app.cjs -x "*.DS_Store"', {
  cwd: rootDir,
  stdio: 'inherit'
});

const zipSize = getFileSize(zipFile);
const apkSize = getFileSize(androidTarget);

console.log('\n==================================================');
console.log('✨ Build & Packaging Complete!');
console.log(`   📱 Android APK: floura-v1.0.0.apk (${apkSize})`);
console.log('   🌐 Other OS:    Progressive Web App (PWA) via browser');
console.log(`   📦 cPanel Zip:  cpanel-deploy.zip (${zipSize})`);
console.log('==================================================\n');
