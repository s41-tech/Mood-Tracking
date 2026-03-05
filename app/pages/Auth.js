// auth.js
import { ref, set, get } from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import { auth, db } from "./firebase";

/* =========================
   Helper: normalize user
   ========================= */
const normalizeUser = (user, userData = {}) => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  ...userData,
});

/* =========================
   Register
   ========================= */
export const register = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // update display name
    await updateProfile(user, {
      displayName: name,
    });

    // save extra data to Realtime Database
    await set(ref(db, `users/${user.uid}`), {
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem("authUser", JSON.stringify(normalizeUser(user, { name })));

    return normalizeUser(user, { name });

  } catch (error) {
    console.error("Register error:", error.code, error.message);
    throw error;
  }
};

/* =========================
   Login
   ========================= */
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    const userData = await getUserData(user.uid);

    localStorage.setItem("authUser", JSON.stringify(normalizeUser(user, userData)));

    return normalizeUser(user, userData);

  } catch (error) {
    console.error("Login error:", error.code, error.message);
    throw error;
  }
};

/* =========================
   Logout
   ========================= */
export const logout = async () => {
  try {
    await signOut(auth);

    if (typeof window !== "undefined") {
      localStorage.removeItem("authUser");
    }

  } catch (error) {
    console.error("Logout error:", error.code, error.message);
    throw error;
  }
};

/* =========================
   Auth State Listener
   ========================= */
export const checkAuthState = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();

        if (!user) {
          resolve(null);
          return;
        }

        const userData = await getUserData(user.uid);
        const fullUser = normalizeUser(user, userData);

        // save to localStorage (client only)
        if (typeof window !== "undefined") {
          localStorage.setItem("authUser", JSON.stringify(fullUser));
        }

        resolve(fullUser);
      },
      reject
    );
  });
};

/* =========================
   Load auth state (client)
   ========================= */
export const loadAuthState = () => {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("authUser");
  return user ? JSON.parse(user) : null;
};

/* =========================
   Get user data from DB
   ========================= */
const getUserData = async (uid) => {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : {};
};
