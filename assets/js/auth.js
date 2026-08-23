/* =========================================================
   SONATIVA — AUTHENTICATION SYSTEM
   File: assets/js/auth.js
   ========================================================= */
import { supabase } from "./supabase.js";
/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function getRedirectUrl() {
  return window.location.origin + window.location.pathname;
}
function getUserName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Sonativa User"
  );
}
/* ---------------------------------------------------------
   Get current user
--------------------------------------------------------- */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error) {
      console.warn("Sonativa auth:", error.message);
      return null;
    }
    return user || null;
  } catch (error) {
    console.error("Sonativa auth error:", error);
    return null;
  }
}
/* ---------------------------------------------------------
   Get current session
--------------------------------------------------------- */
export async function getSession() {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();
    if (error) {
      console.warn("Session error:", error.message);
      return null;
    }
    return session || null;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}
/* ---------------------------------------------------------
   Email / Password Login
--------------------------------------------------------- */
export async function signInWithEmail(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   Create Account
--------------------------------------------------------- */
export async function signUpWithEmail(
  email,
  password,
  fullName = ""
) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  const redirectTo =
    window.location.origin + "/login.html";
  const { data, error } =
    await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName.trim()
        }
      }
    });
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   Google Login
--------------------------------------------------------- */
export async function signInWithGoogle() {
  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl()
      }
    });
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   GitHub Login
--------------------------------------------------------- */
export async function signInWithGitHub() {
  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: getRedirectUrl()
      }
    });
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   Logout
--------------------------------------------------------- */
export async function signOut() {
  const { error } =
    await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  window.location.href = "login.html";
}
/* ---------------------------------------------------------
   Password Reset
--------------------------------------------------------- */
export async function resetPassword(email) {
  if (!email) {
    throw new Error("Email is required.");
  }
  const redirectTo =
    window.location.origin + "/login.html";
  const { data, error } =
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo
      }
    );
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   Update Password
--------------------------------------------------------- */
export async function updatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters."
    );
  }
  const { data, error } =
    await supabase.auth.updateUser({
      password
    });
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   Update Profile
--------------------------------------------------------- */
export async function updateProfile(profile = {}) {
  const allowed = {};
  if (typeof profile.full_name === "string") {
    allowed.full_name =
      profile.full_name.trim();
  }
  if (typeof profile.name === "string") {
    allowed.name =
      profile.name.trim();
  }
  if (typeof profile.avatar_url === "string") {
    allowed.avatar_url =
      profile.avatar_url.trim();
  }
  const { data, error } =
    await supabase.auth.updateUser({
      data: allowed
    });
  if (error) {
    throw error;
  }
  return data;
}
/* ---------------------------------------------------------
   Require Login
--------------------------------------------------------- */
export async function requireAuth() {
  const user =
    await getCurrentUser();
  if (!user) {
    const current =
      window.location.pathname +
      window.location.search;
    const encoded =
      encodeURIComponent(current);
    window.location.href =
      `login.html?redirect=${encoded}`;
    return null;
  }
  return user;
}
/* ---------------------------------------------------------
   Redirect Logged-In User
--------------------------------------------------------- */
export async function redirectIfAuthenticated(
  destination = "index.html"
) {
  const user =
    await getCurrentUser();
  if (user) {
    window.location.href =
      destination;
  }
  return user;
}
/* ---------------------------------------------------------
   Auth State Listener
--------------------------------------------------------- */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(
    (event, session) => {
      try {
        callback(event, session);
      } catch (error) {
        console.error(
          "Auth callback error:",
          error
        );
      }
    }
  );
}
/* ---------------------------------------------------------
   Update UI
--------------------------------------------------------- */
export async function updateAuthUI() {
  const user =
    await getCurrentUser();
  const accountName =
    document.getElementById("accountName");
  const avatar =
    document.getElementById("avatar");
  const walletStatus =
    document.getElementById("walletStatus");
  if (!user) {
    if (accountName) {
      accountName.textContent = "Guest";
    }
    if (avatar) {
      avatar.textContent = "G";
    }
    if (walletStatus) {
      walletStatus.textContent = "Guest";
    }
    return null;
  }
  const name =
    getUserName(user);
  if (accountName) {
    accountName.textContent =
      name;
  }
  if (avatar) {
    avatar.textContent =
      name.charAt(0).toUpperCase();
  }
  if (walletStatus) {
    walletStatus.textContent =
      "Ready";
  }
  return user;
}
/* ---------------------------------------------------------
   Global Auth Boot
--------------------------------------------------------- */
export async function initAuth(options = {}) {
  const {
    requireLogin = false,
    redirectIfLoggedIn = false,
    redirectDestination = "index.html"
  } = options;
  if (redirectIfLoggedIn) {
    return redirectIfAuthenticated(
      redirectDestination
    );
  }
  if (requireLogin) {
    return requireAuth();
  }
  return updateAuthUI();
}
/* ---------------------------------------------------------
   Export Supabase Client
--------------------------------------------------------- */
export { supabase };
