/* =========================================================
   SONATIVA — AUTH.JS
   Authentication / Session / User UI
   ========================================================= */

import { supabase } from "./supabase.js";

/* =========================================================
   CONFIG
========================================================= */

const LOGIN_PAGE = "login.html";
const HOME_PAGE = "index.html";

/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getUserName(user) {
  if (!user) return "Guest";

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "Sonativa User"
  );
}

function getInitial(user) {
  return getUserName(user)
    .trim()
    .charAt(0)
    .toUpperCase() || "S";
}

/* =========================================================
   CURRENT USER
========================================================= */

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.warn("Sonativa auth:", error.message);
      return null;
    }

    return data?.user || null;
  } catch (error) {
    console.error("Sonativa getCurrentUser:", error);
    return null;
  }
}

/* =========================================================
   SESSION
========================================================= */

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.warn("Sonativa session:", error.message);
      return null;
    }

    return data?.session || null;
  } catch (error) {
    console.error("Sonativa getSession:", error);
    return null;
  }
}

/* =========================================================
   AUTH STATE LISTENER
========================================================= */

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(
    (event, session) => {
      try {
        if (typeof callback === "function") {
          callback(event, session);
        }
      } catch (error) {
        console.error("Sonativa auth callback:", error);
      }
    }
  );
}

/* =========================================================
   REQUIRE LOGIN
========================================================= */

export async function requireAuth(options = {}) {
  const {
    redirect = true,
    returnUrl = window.location.href
  } = options;

  const session = await getSession();

  if (session?.user) {
    return session.user;
  }

  if (redirect) {
    const encoded = encodeURIComponent(returnUrl);

    window.location.href =
      `${LOGIN_PAGE}?redirect=${encoded}`;
  }

  return null;
}

/* =========================================================
   REDIRECT IF ALREADY LOGGED IN
========================================================= */

export async function redirectIfAuthenticated() {
  const session = await getSession();

  if (!session?.user) {
    return false;
  }

  const params = new URLSearchParams(
    window.location.search
  );

  const redirect =
    params.get("redirect") || HOME_PAGE;

  window.location.href = redirect;

  return true;
}

/* =========================================================
   SIGN UP
========================================================= */

export async function signUp({
  email,
  password,
  name = ""
}) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const cleanEmail =
    String(email).trim().toLowerCase();

  const metadata = {};

  if (name.trim()) {
    metadata.full_name = name.trim();
  }

  const { data, error } =
    await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: metadata
      }
    });

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

export async function signIn({
  email,
  password
}) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const cleanEmail =
    String(email).trim().toLowerCase();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   MAGIC LINK
========================================================= */

export async function signInWithMagicLink(email) {
  if (!email) {
    throw new Error("Email is required.");
  }

  const cleanEmail =
    String(email).trim().toLowerCase();

  const { data, error } =
    await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo:
          window.location.origin +
          window.location.pathname
      }
    });

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   GOOGLE LOGIN
========================================================= */

export async function signInWithGoogle() {
  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          HOME_PAGE
      }
    });

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   GITHUB LOGIN
========================================================= */

export async function signInWithGitHub() {
  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo:
          window.location.origin +
          HOME_PAGE
      }
    });

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   LOGOUT
========================================================= */

export async function signOut({
  redirect = true
} = {}) {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  if (redirect) {
    window.location.href = LOGIN_PAGE;
  }
}

/* =========================================================
   PASSWORD RESET
========================================================= */

export async function resetPassword(email) {
  if (!email) {
    throw new Error("Email is required.");
  }

  const cleanEmail =
    String(email).trim().toLowerCase();

  const { data, error } =
    await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo:
          window.location.origin +
          "/login.html?reset=true"
      }
    );

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   UPDATE PASSWORD
========================================================= */

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

/* =========================================================
   UPDATE PROFILE
========================================================= */

export async function updateProfile({
  name,
  avatarUrl
} = {}) {
  const metadata = {};

  if (typeof name === "string") {
    metadata.full_name = name.trim();
  }

  if (typeof avatarUrl === "string") {
    metadata.avatar_url = avatarUrl.trim();
  }

  const { data, error } =
    await supabase.auth.updateUser({
      data: metadata
    });

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   USER UI
========================================================= */

export async function updateAuthUI() {
  const user = await getCurrentUser();

  const name =
    getUserName(user);

  const initial =
    getInitial(user);

  const elements =
    document.querySelectorAll(
      "[data-auth-name]"
    );

  elements.forEach((element) => {
    element.textContent = name;
  });

  const avatars =
    document.querySelectorAll(
      "[data-auth-avatar]"
    );

  avatars.forEach((element) => {
    element.textContent = initial;
  });

  const emails =
    document.querySelectorAll(
      "[data-auth-email]"
    );

  emails.forEach((element) => {
    element.textContent =
      user?.email || "";
  });

  const loggedIn =
    document.querySelectorAll(
      "[data-auth-logged-in]"
    );

  loggedIn.forEach((element) => {
    element.hidden = !user;
  });

  const loggedOut =
    document.querySelectorAll(
      "[data-auth-logged-out]"
    );

  loggedOut.forEach((element) => {
    element.hidden = !!user;
  });

  return user;
}

/* =========================================================
   LOGOUT BUTTONS
========================================================= */

export function bindLogoutButtons() {
  document
    .querySelectorAll(
      "[data-auth-logout]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();

          button.disabled = true;

          try {
            await signOut();
          } catch (error) {
            console.error(
              "Sonativa logout:",
              error
            );

            button.disabled = false;

            alert(
              error?.message ||
              "Unable to sign out."
            );
          }
        }
      );
    });
}

/* =========================================================
   AUTH STATUS
========================================================= */

export async function getAuthStatus() {
  const session =
    await getSession();

  return {
    authenticated:
      !!session?.user,

    user:
      session?.user || null,

    session:
      session || null
  };
}

/* =========================================================
   INITIALIZE
========================================================= */

export async function initAuth() {
  await updateAuthUI();

  bindLogoutButtons();

  onAuthStateChange(
    async () => {
      await updateAuthUI();
    }
  );
}

/* =========================================================
   AUTO INITIALIZE
========================================================= */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      initAuth();
    },
    { once: true }
  );
} else {
  initAuth();
}

/* =========================================================
   GLOBAL COMPATIBILITY
========================================================= */

window.SonativaAuth = {
  getCurrentUser,
  getSession,
  getAuthStatus,
  requireAuth,
  redirectIfAuthenticated,
  signUp,
  signIn,
  signInWithMagicLink,
  signInWithGoogle,
  signInWithGitHub,
  signOut,
  resetPassword,
  updatePassword,
  updateProfile,
  updateAuthUI,
  bindLogoutButtons,
  initAuth
};
