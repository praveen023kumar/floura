# Floura | Premium Event & Baking Management

Floura is a premium baking command center designed to organize custom cake specifications, schedule automated reminders, track ingredient stocks, and analyze kitchen profit margins.

The platform is built using a unified hybrid architecture:
- **Frontend**: React (v19) + TypeScript + Tailwind CSS, bundled with **Vite**.
- **Backend**: Express + SQLite database (running with Node.js and TypeScript).
- **Mobile Apps**: **Apache Cordova** wraps the web build to generate native iOS and Android packages.

---

## 🛠️ Getting Started & Local Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [NPM](https://www.npmjs.com/) (usually bundled with Node.js)
- For Mobile Development:
  - **Android**: Android Studio, Java JDK (v17 recommended), and Gradle.
  - **iOS**: macOS, Xcode, and CocoaPods.

### 2. Install Dependencies
Run the following command in the root folder of the project to install all required libraries:
```bash
npm install
```

### 3. Configure Environments

#### Environment Variables (`.env`)
Create a `.env` file in the root directory by copying the example environment file:
```bash
cp .env.example .env
```
Open `.env` and configure the following:
- `GEMINI_API_KEY`: Enter your Google Gemini API key to enable smart kitchen suggestions and analytics.
- `APP_URL`: The base URL where your server is hosted (e.g., `http://localhost:3000` for local runs).

#### Firebase Configuration (`firebase-applet-config.json`)
The application relies on Google Authentication via Firebase. The configuration is already provided in [firebase-applet-config.json](file:///Users/praveen/antigravity/floura/firebase-applet-config.json). If you need to connect to a different Firebase project, update this file with your project credentials.

---

## 💻 Running the Web Platform (Frontend + Backend)

Floura is configured to run both the frontend and backend unified on a single port for ease of local development.

### Development Mode
Runs the Express backend server with Vite middleware hot-reloading the React frontend in real-time.
```bash
npm run dev
```
Once started, open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Mode
To test the optimized production build locally:
1. Build the production assets:
   ```bash
   npm run build
   ```
2. Start the production backend server:
   ```bash
   npm run start
   ```
This serves the statically compiled frontend from the `dist` folder alongside the compiled backend.

---

## 📱 Running the Native Mobile Apps (Cordova)

The mobile applications are built by packaging the static web app inside an Apache Cordova native container.

### 1. First-Time Mobile Configuration
Before compiling mobile wrappers, initialize the platforms. Navigate to the root directory and run:
```bash
# Add iOS and Android build environments
npm run cordova:platform-add
```

### 2. Building for Mobile
To compile your React source, copy the assets into the Cordova folder, and build the native app wrappers:
```bash
npm run cordova:build
```
*Note: This command requires Java JDK and Gradle to be configured in your environment for Android, and Xcode for iOS.*

### 3. Launching on Devices/Emulators

#### Android
Run the app on a connected Android device or running emulator:
```bash
npm run cordova:run-android
```

#### iOS
Run the app on an iOS simulator or connected developer iPhone:
```bash
npm run cordova:run-ios
```

---

## 🔗 OAuth & Deep Link Redirection Detail

To support Google Auth on mobile devices without running into embedded WebView limitations:
1. Clicking **"Sign In with Google"** inside the mobile app triggers the `cordova-plugin-inappbrowser` to open the system browser (`_system`).
2. Once the user authenticates, the backend redirects the system browser to the custom scheme `floura://auth?state=<state_token>`.
3. The native app catches this deep link via the `cordova-plugin-customurlscheme` plugin, bringing the app back to the foreground and processing the token to log the user in instantly.