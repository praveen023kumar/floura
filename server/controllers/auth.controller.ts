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
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,900;1,900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .serif-title { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300">
  <div class="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-xl border border-zinc-100 dark:border-zinc-800 max-w-sm w-full text-center flex flex-col items-center">
    
    <!-- App Logo Circle -->
    <div class="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-black mb-4 select-none shadow-md">
      F
    </div>
    
    <h1 class="serif-title text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-2">
      Floura Sign-In
    </h1>
    <p class="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-8 max-w-[260px] leading-relaxed">
      Connect your premium kitchen workspace securely using your system's Google accounts list.
    </p>

    <!-- Interactive login container -->
    <div id="auth-actions" class="w-full space-y-4">
      <button id="btn-login" class="group w-full flex items-center justify-center gap-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition-all active:scale-[0.98]">
        <div class="w-6 h-6 bg-white rounded-full p-1 flex items-center justify-center shadow-sm">
          <svg class="w-full h-full" viewBox="0 0 48 48">
            <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"></path>
            <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"></path>
            <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"></path>
            <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"></path>
          </svg>
        </div>
        <span class="text-xs uppercase tracking-wider font-bold">Sign In with Google</span>
      </button>
    </div>

    <!-- Active Loading Feedback Message -->
    <div id="status-message" class="text-xs text-zinc-400 font-semibold mt-6 hidden flex items-center justify-center gap-2">
      <svg class="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span id="status-text">Loading workspace auth handler...</span>
    </div>

    <!-- Errors Output container -->
    <div id="error-container" class="hidden mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-semibold">
    </div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

    btnLogin.addEventListener("click", async () => {
      errorContainer.classList.add("hidden");
      showStatus("Connecting to Google Accounts chooser...");
      
      try {
        const result = await signInWithPopup(auth, provider);
        const googleUser = result.user;
        
        if (!googleUser.email) {
          throw new Error("No primary email found in Google profile.");
        }

        showStatus("Verifying kitchen credentials...");

        // Post validated credentials to workspace server
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
          <div class="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl text-center">
            <span class="text-emerald-700 dark:text-emerald-400 font-bold text-sm block mb-1">Login Secured!</span>
            <span class="text-zinc-600 dark:text-zinc-400 text-xs block mb-4">You are now logged in as Chef \${googleUser.displayName || googleUser.email}.</span>
            <a href="floura://auth?state=\${state}" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">
              Return to Floura
            </a>
          </div>
        \`;
        
        // Auto deep link redirect
        window.location.href = "floura://auth?state=" + state;
        
        setTimeout(() => {
          window.location.href = "com.floura.app://auth?state=" + state;
        }, 1200);

      } catch (err) {
        console.error("External login error:", err);
        showError(err.message || "Failed to complete Google Sign-In.");
      }
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
