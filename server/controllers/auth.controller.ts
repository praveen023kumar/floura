import { Request, Response } from "express";
import CryptoJS from "crypto-js";
import path from "path";
import fs from "fs";
import { findUserByEmail, updateUserSignature, createUser, updateUserProfile, hasBakeryProfile } from "../models/user.model";
import { checkLoginLockout, recordFailedLoginAttempt, resetFailedLoginAttempts, writeAuditLog, validateEmail } from "../middleware/security.middleware";

// In-memory sessions map for secure Tauri system-browser external Google logins
export const activeSessions = new Map<string, {
  status: "pending" | "completed" | "error";
  user?: { name: string; email: string; avatar: string };
  token?: string;
  isNew?: boolean;
  error?: string;
}>();

export async function externalStart(req: Request, res: Response) {
  const { state } = req.query;
  if (!state || typeof state !== "string") {
    return res.status(400).send("State key is required to establish external authentication tunnel.");
  }

  activeSessions.set(state, { status: "pending" });

  setTimeout(() => {
    if (activeSessions.get(state)?.status === "pending") {
      activeSessions.delete(state);
    }
  }, 300000);

  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  let firebaseConfig = {
    apiKey: "dummy-api-key",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123:web:123"
  };
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    } catch (err) {
      console.error("Error loading firebase-applet-config.json:", err);
    }
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Floura Secure Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,900;1,900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #fafafa;
      --card-bg: #ffffff;
      --text-color: #27272a;
      --muted-color: #71717a;
      --border-color: #f4f4f5;
      --brand-color: #f97316;
      --brand-hover: #ea580c;
      --error-bg: #fef2f2;
      --error-text: #dc2626;
      --error-border: #fee2e2;
      --success-bg: #ecfdf5;
      --success-text: #059669;
      --success-border: #d1fae5;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #09090b;
        --card-bg: #18181b;
        --text-color: #f4f4f5;
        --muted-color: #a1a1aa;
        --border-color: #27272a;
        --error-bg: rgba(220, 38, 38, 0.1);
        --error-text: #ef4444;
        --error-border: rgba(220, 38, 38, 0.2);
        --success-bg: rgba(5, 150, 105, 0.1);
        --success-text: #34d399;
        --success-border: rgba(5, 150, 105, 0.2);
      }
    }
    body {
      margin: 0;
      padding: 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      box-sizing: border-box;
      transition: background-color 0.3s, color 0.3s;
    }
    .card {
      background-color: var(--card-bg);
      padding: 32px;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border-color);
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      margin-bottom: 16px;
      box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
      user-select: none;
      object-fit: cover;
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 900;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    p {
      font-size: 13px;
      color: var(--muted-color);
      margin: 0 0 24px 0;
      line-height: 1.5;
      max-width: 260px;
      font-weight: 500;
    }
    .btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background-color: var(--brand-color);
      color: #ffffff;
      border: none;
      border-radius: 16px;
      padding: 14px 20px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
      box-sizing: border-box;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn:hover {
      background-color: var(--brand-hover);
    }
    .btn:active {
      transform: scale(0.98);
    }
    .google-icon-wrapper {
      width: 24px;
      height: 24px;
      background-color: #ffffff;
      border-radius: 50%;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .google-icon-wrapper svg {
      width: 14px;
      height: 14px;
      display: block;
    }
    .status-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
      font-size: 12px;
      color: var(--muted-color);
      font-weight: 600;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2.5px solid rgba(249, 115, 22, 0.15);
      border-top-color: var(--brand-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      box-sizing: border-box;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-box {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 16px;
      background-color: var(--error-bg);
      color: var(--error-text);
      border: 1px solid var(--error-border);
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    }
    .success-box {
      padding: 16px;
      background-color: var(--success-bg);
      color: var(--success-text);
      border: 1px solid var(--success-border);
      border-radius: 16px;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    }
    .success-title {
      font-weight: 700;
      font-size: 15px;
      display: block;
      margin-bottom: 4px;
    }
    .success-desc {
      font-size: 12px;
      color: var(--text-color);
      opacity: 0.8;
      display: block;
      margin-bottom: 16px;
    }
    .btn-return {
      display: inline-block;
      background-color: #059669;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 12px;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    .btn-return:hover {
      background-color: #047857;
    }
    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="card">
    
    <!-- App Logo Circle -->
    <img src="/floura_logo.png" class="logo" alt="Floura Logo" />
    
    <h1>Floura Sign-In</h1>
    <p>Connect your premium kitchen workspace securely using your system's Google accounts list.</p>

    <!-- Interactive login container -->
    <div id="auth-actions" style="width: 100%;">
      <button id="btn-login" class="btn">
        <div class="google-icon-wrapper">
          <svg viewBox="0 0 48 48">
            <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"></path>
            <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"></path>
            <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"></path>
            <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"></path>
          </svg>
        </div>
        <span>Sign In with Google</span>
      </button>
    </div>

    <!-- Active Loading Feedback Message -->
    <div id="status-message" class="status-container hidden">
      <div class="spinner"></div>
      <span id="status-text">Loading workspace auth handler...</span>
    </div>

    <!-- Errors Output container -->
    <div id="error-container" class="error-box hidden"></div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAuth, signInWithRedirect, getRedirectResult, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    const state = "${state}";

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/userinfo.email");
    provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

    const btnLogin = document.getElementById("btn-login");
    const statusMessage = document.getElementById("status-message");
    const statusText = document.getElementById("status-text");
    const errorContainer = document.getElementById("error-container");

    function showStatus(text) {
      statusMessage.classList.remove("hidden");
      statusText.innerText = text;
    }

    function showError(text) {
      errorContainer.innerText = text;
      errorContainer.classList.remove("hidden");
      statusMessage.classList.add("hidden");
    }

    let isLogged = false;

    async function handleUserLogin(googleUser) {
      if (isLogged) return;
      isLogged = true;

      showStatus("Verifying kitchen credentials...");
      try {
        const response = await fetch("/api/auth/external-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: state,
            email: googleUser.email,
            name: googleUser.displayName || "",
            avatar: googleUser.photoURL || ""
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Workspace verification check failed.");
        }

        showStatus("Authorized! Opening Floura...");
        document.getElementById("auth-actions").innerHTML = \`
          <div class="success-box">
            <span class="success-title">Login Secured!</span>
            <span class="success-desc">You are now logged in as Chef \\\${googleUser.displayName || googleUser.email}.</span>
            <a href="floura://auth?state=\\\${state}" class="btn-return">
              Return to Floura
            </a>
          </div>
        \`;
        
        sessionStorage.removeItem("auth_redirect_triggered");

        // Auto deep link redirect
        window.location.href = "floura://auth?state=" + state;
        
        setTimeout(() => {
          window.location.href = "com.floura.app://auth?state=" + state;
        }, 1200);
      } catch (err) {
        isLogged = false;
        console.error("Login verification error:", err);
        showError(err.message || "Failed to process security request.");
      }
    }

    // Listen to Firebase auth state changes to capture success early
    auth.onAuthStateChanged((user) => {
      if (user) {
        handleUserLogin(user);
      }
    });

    async function checkRedirect() {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await handleUserLogin(result.user);
          return true;
        }
      } catch (err) {
        console.error("Redirect parsing error:", err);
        showError(err.message || "Failed to process security request.");
        return true;
      }
      return false;
    }

    async function startGoogleSignIn() {
      errorContainer.classList.add("hidden");
      showStatus("Connecting to Google Accounts chooser...");
      try {
        sessionStorage.setItem("auth_redirect_triggered", "true");
        // Attempt immediate redirect auth for direct Google authentication
        await signInWithRedirect(auth, provider);
      } catch (err) {
        sessionStorage.removeItem("auth_redirect_triggered");
        console.warn("Direct Redirect blocked or failed, attempting Popup fallback...", err);
        try {
          const result = await signInWithPopup(auth, provider);
          const googleUser = result?.user;
          if (googleUser) {
            await handleUserLogin(googleUser);
          }
        } catch (popupErr) {
          console.error("Authentication popup failed:", popupErr);
          showError(popupErr.message || "Failed to complete Google Sign-In.");
        }
      }
    }

    btnLogin.addEventListener("click", startGoogleSignIn);

    // Auto-initiate authentication on load with a brief delay to allow Firebase Auth state to resolve
    window.addEventListener("load", () => {
      setTimeout(async () => {
        if (isLogged) return; // Already completed login flow successfully

        const isRedirectResult = await checkRedirect();
        if (!isRedirectResult && !isLogged) {
          if (sessionStorage.getItem("auth_redirect_triggered") === "true") {
            // Returned from redirect but no user was resolved
            sessionStorage.removeItem("auth_redirect_triggered");
            statusMessage.classList.add("hidden");
            showError("Sign-in was not completed. Please tap the button above to continue with Google.");
          } else {
            // Initial visit: start direct Gmail auth automatically
            await startGoogleSignIn();
          }
        } else {
          sessionStorage.removeItem("auth_redirect_triggered");
        }
      }, 1500);
    });
  </script>
</body>
</html>
  `);
}

export async function externalComplete(req: Request, res: Response) {
  try {
    console.log("[Auth Debug] External login completed:", req.body);
    const { state, email, name, avatar } = req.body;
    if (!state || !email) {
      return res.status(400).json({ error: "Missing state session or identity parameter." });
    }

    const emailKey = email.toLowerCase().trim();
    if (!validateEmail(emailKey)) {
      return res.status(400).json({ error: "Invalid email address format." });
    }

    const signatureToken = CryptoJS.SHA256(emailKey + "FLOURA_GOOGLE_WORKSPACE_SALT_2026_" + Date.now() + "_" + Math.random().toString()).toString();
    const existingUser = await findUserByEmail(emailKey);

    let finalName = name || "Chef Paul";
    let finalAvatar = avatar || "chef";
    let isNew = false;

    if (existingUser) {
      const userHasProfile = await hasBakeryProfile(emailKey);
      if (!userHasProfile) {
        isNew = true;
      }
      if (existingUser.name && existingUser.name !== "Chef Paul" && existingUser.name !== "Chef undefined" && existingUser.name !== "Chef null") {
        finalName = existingUser.name;
      } else if (name) {
        finalName = name.startsWith("Chef ") ? name : "Chef " + name;
      }

      if (existingUser.avatar && existingUser.avatar !== "chef" && existingUser.avatar !== "undefined") {
        finalAvatar = existingUser.avatar;
      } else if (avatar) {
        finalAvatar = avatar;
      }

      await updateUserSignature(emailKey, signatureToken, finalName, finalAvatar);
    } else {
      isNew = true;
      const formattedName = name ? (name.startsWith("Chef ") ? name : "Chef " + name) : "Chef Paul";
      await createUser(emailKey, signatureToken, formattedName, finalAvatar);
      finalName = formattedName;
    }

    activeSessions.set(state, {
      status: "completed",
      user: {
        name: finalName,
        email: emailKey,
        avatar: finalAvatar
      },
      token: signatureToken,
      isNew: isNew
    });

    setTimeout(() => {
      activeSessions.delete(state);
    }, 180000);

    await writeAuditLog(emailKey, "EXTERNAL_AUTH_COMPLETE", { isNew }, req);
    res.json({ status: "success", isNew });
  } catch (err: any) {
    console.error("External complete error:", err);
    res.status(500).json({ error: err.message || "Failed to process external login verification." });
  }
}

export function externalPoll(req: Request, res: Response) {
  const { state } = req.query;
  if (!state || typeof state !== "string") {
    return res.status(400).json({ error: "Missing state query parameter." });
  }

  const session = activeSessions.get(state);
  if (!session) {
    return res.json({ status: "pending" });
  }

  return res.json(session);
}

export async function login(req: Request, res: Response) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  try {
    console.log("[Auth Debug] Received Google login payload:", req.body);
    const { email, name, avatar, isGoogle } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const emailKey = email.toLowerCase().trim();
    const lockout = await checkLoginLockout(emailKey, ip);
    if (lockout.locked) {
      await writeAuditLog(emailKey, "LOGIN_LOCKOUT_BLOCKED", { ip }, req);
      return res.status(423).json({
        error: `Too many failed attempts. This account or IP is temporarily locked out. Try again in ${lockout.timeLeftSec} seconds.`
      });
    }

    if (!isGoogle) {
      await recordFailedLoginAttempt(emailKey, ip);
      await writeAuditLog(emailKey, "LOGIN_FAILURE_NOT_GOOGLE", { ip }, req);
      return res.status(403).json({ error: "Direct access to Google-auth handler is forbidden. Please log in through Google secure authentication." });
    }

    if (!validateEmail(emailKey)) {
      await recordFailedLoginAttempt(emailKey, ip);
      return res.status(400).json({ error: "Invalid email format." });
    }

    const signatureToken = CryptoJS.SHA256(emailKey + "FLOURA_GOOGLE_WORKSPACE_SALT_2026_" + Date.now() + "_" + Math.random().toString()).toString();
    const existingUser = await findUserByEmail(emailKey);

    let loginResult: any = null;

    if (existingUser) {
      let finalName = existingUser.name;
      if (!finalName || finalName === "Chef Paul" || finalName === "Chef undefined" || finalName === "Chef null") {
        finalName = name || finalName || "Chef Paul";
      } else if (name && name !== "Chef Paul" && name !== "Chef undefined" && name !== "Chef null") {
        finalName = name;
      }

      let finalAvatar = existingUser.avatar;
      if (!finalAvatar || finalAvatar === "chef" || finalAvatar === "undefined") {
        finalAvatar = avatar || finalAvatar || "chef";
      } else if (avatar && avatar !== "chef" && avatar !== "undefined") {
        finalAvatar = avatar;
      }

      await updateUserSignature(emailKey, signatureToken, finalName, finalAvatar);

      const userHasProfile = await hasBakeryProfile(emailKey);
      loginResult = {
        status: "success",
        isNew: !userHasProfile ? true : undefined,
        user: {
          name: finalName,
          email: existingUser.email,
          avatar: finalAvatar
        },
        token: signatureToken
      };
    } else {
      const defaultName = name || "Chef Paul";
      const defaultAvatar = avatar || "chef";
      await createUser(emailKey, signatureToken, defaultName, defaultAvatar);

      loginResult = {
        status: "success",
        isNew: true,
        user: {
          name: defaultName,
          email: emailKey,
          avatar: defaultAvatar
        },
        token: signatureToken
      };
    }

    await resetFailedLoginAttempts(emailKey, ip);
    await writeAuditLog(emailKey, "USER_LOGIN_SUCCESS", { isNew: !!loginResult.isNew }, req);
    return res.json(loginResult);
  } catch (err: any) {
    console.error("Auth login/register error:", err);
    if (req.body.email) {
      await recordFailedLoginAttempt(req.body.email, ip);
    }
    res.status(500).json({ error: err.message || "Failed to process security request." });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userEmail = (req as any).userEmail;
    const { name, avatar } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    await updateUserProfile(userEmail, name, avatar);
    await writeAuditLog(userEmail, "PROFILE_UPDATED", { name, avatar }, req);
    return res.json({ status: "success" });
  } catch (err: any) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message || "Failed to update profile details." });
  }
}

export function verify(req: Request, res: Response) {
  res.json({ status: "success", valid: true });
}
