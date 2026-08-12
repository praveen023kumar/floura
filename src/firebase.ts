// File Path: /src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

const hasFirebaseConfig = firebaseConfig && typeof firebaseConfig === "object" && (firebaseConfig as any).apiKey;

let app;
let auth: any;

if (hasFirebaseConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} else {
  console.warn("Firebase configuration is missing or empty. Firebase auth and db features will be disabled.");
  // Provide a dummy auth object so imports don't break the application
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      // Simulate offline or unauthenticated guest session
      cb(null);
      return () => {};
    }
  };
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email");
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");

export { auth, googleProvider, signInWithPopup, signOut };
