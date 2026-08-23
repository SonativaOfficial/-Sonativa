/* =========================================================
   SONATIVA — AUTHENTICATION SYSTEM
   Version: 2026
   File: assets/js/auth.js

   AUTH ARCHITECTURE
   -----------------
   • Email / Password
   • Google Login
   • GitHub = Developer connection
   • Password reset
   • Password update
   • Session management
   • Central auth events
   • No duplicated login logic
========================================================= */

import {
  supabase,
  getUser,
  getSession,
  signOut,
  onAuthStateChange
} from "./supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const AUTH_CONFIG = {
  loginPage: "login.html",
  homePage: "index.html",
  signupPage: "signup.html",
  resetPage: "forgot-password.html",
  redirectParameter: "redirect"
};


/* =========================================================
   HELPERS
========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];


function safeRedirect() {

  const params =
    new URLSearchParams(window.location.search);

  const redirect =
    params.get(AUTH_CONFIG.redirectParameter);

  if (!redirect) {
    return AUTH_CONFIG.homePage;
  }

  if (
    redirect.startsWith("http://") ||
    redirect.startsWith("https://") ||
    redirect.startsWith("//") ||
    redirect.includes("://")
  ) {
    return AUTH_CONFIG.homePage;
  }

  return redirect.replace(/^\/+/, "");
}


function setLoading(button, loading, text = "Please wait...") {

  if (!button) return;

  if (loading) {

    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent.trim();
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = text;

  } else {

    button.disabled = false;
    button.removeAttribute("aria-busy");

    button.textContent =
      button.dataset.originalText ||
      "Continue";
  }
}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(message, type = "info") {

  let box = $("#authMessage");

  if (!box) {

    box = document.createElement("div");

    box.id = "authMessage";

    box.setAttribute("role", "alert");

    const target =
      $("form") ||
      $(".login-card") ||
      document.body;

    target.appendChild(box);
  }

  box.hidden = false;
  box.textContent = message;

  box.dataset.type = type;
}


function clearMessage() {

  const box = $("#authMessage");

  if (!box) return;

  box.hidden = true;
  box.textContent = "";
}


/* =========================================================
   VALIDATION
========================================================= */

function normalizeEmail(email) {

  return String(email || "")
    .trim()
    .toLowerCase();
}


function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function validateEmail(email) {

  const normalized =
    normalizeEmail(email);

  if (!normalized) {
    throw new Error(
      "Please enter your email address."
    );
  }

  if (!isValidEmail(normalized)) {
    throw new Error(
      "Please enter a valid email address."
    );
  }

  return normalized;
}


function validatePassword(password) {

  if (
    typeof password !== "string" ||
    !password
  ) {
    throw new Error(
      "Please enter your password."
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters."
    );
  }

  return password;
}


/* =========================================================
   EMAIL LOGIN
========================================================= */

async function login(email, password) {

  clearMessage();

  email =
    validateEmail(email);

  if (!password) {
    throw new Error(
      "Please enter your password."
    );
  }

  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   REGISTER
========================================================= */

async function register(
  email,
  password,
  metadata = {}
) {

  clearMessage();

  email =
    validateEmail(email);

  password =
    validatePassword(password);

  const {
    data,
    error
  } =
    await supabase.auth.signUp({

      email,

      password,

      options: {
        data: {
          ...metadata
        }
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

async function loginWithGoogle() {

  clearMessage();

  const redirect =
    safeRedirect();

  const {
    data,
    error
  } =
    await supabase.auth.signInWithOAuth({

      provider: "google",

      options: {

        redirectTo:
          `${window.location.origin}/${redirect}`

      }

    });

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   GITHUB — DEVELOPER CONNECTION
=========================================================

   IMPORTANT:

   GitHub is NOT used as the normal Sonativa login.

   It is reserved for connecting the developer's GitHub
   identity to an authenticated Sonativa account.

========================================================= */

async function connectGitHub() {

  clearMessage();

  const user =
    await getUser();

  if (!user) {

    throw new Error(
      "Please sign in to Sonativa before connecting GitHub."
    );

  }

  const {
    data,
    error
  } =
    await supabase.auth.linkIdentity({

      provider: "github",

      options: {

        redirectTo:
          `${window.location.origin}/settings.html`

      }

    });

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   PASSWORD RESET
========================================================= */

async function resetPassword(email) {

  clearMessage();

  email =
    validateEmail(email);

  const redirect =
    `${window.location.origin}/reset-password.html`;

  const {
    error
  } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirect
      }
    );

  if (error) {
    throw error;
  }

  return true;
}


/* =========================================================
   UPDATE PASSWORD
========================================================= */

async function updatePassword(newPassword) {

  newPassword =
    validatePassword(newPassword);

  const {
    data,
    error
  } =
    await supabase.auth.updateUser({

      password:
        newPassword

    });

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  const result =
    await signOut();

  if (
    result &&
    result.success === false
  ) {
    throw (
      result.error ||
      new Error("Unable to sign out.")
    );
  }

  window.location.replace(
    AUTH_CONFIG.loginPage
  );
}


/* =========================================================
   AUTH ERROR NORMALIZATION
========================================================= */

function getAuthError(error) {

  const text =
    String(error?.message || error || "")
      .toLowerCase();

  if (
    text.includes("invalid login credentials")
  ) {
    return "Incorrect email or password.";
  }

  if (
    text.includes("email not confirmed")
  ) {
    return "Please confirm your email before signing in.";
  }

  if (
    text.includes("user already registered")
  ) {
    return "This email is already registered. Try signing in.";
  }

  if (
    text.includes("password") &&
    (
      text.includes("8") ||
      text.includes("characters")
    )
  ) {
    return "Password must contain at least 8 characters.";
  }

  if (
    text.includes("provider") &&
    text.includes("already")
  ) {
    return "This GitHub account is already connected.";
  }

  return (
    error?.message ||
    String(error) ||
    "Something went wrong. Please try again."
  );
}


/* =========================================================
   LOGIN FORM
========================================================= */

function initLoginForm() {

  const form =
    $("#loginForm");

  if (!form) return;

  const email =
    form.querySelector(
      'input[type="email"], #email'
    );

  const password =
    form.querySelector(
      'input[type="password"], #password'
    );

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage();

      try {

        setLoading(
          button,
          true,
          "Signing in..."
        );

        await login(
          email?.value,
          password?.value
        );

        showMessage(
          "Welcome back. Opening your workspace...",
          "success"
        );

        window.setTimeout(() => {

          window.location.replace(
            safeRedirect()
          );

        }, 400);

      } catch (error) {

        console.error(
          "[Sonativa Auth]",
          error
        );

        showMessage(
          getAuthError(error),
          "error"
        );

        setLoading(
          button,
          false
        );
      }
    }
  );
}


/* =========================================================
   REGISTER FORM
========================================================= */

function initRegisterForm() {

  const form =
    $("#registerForm") ||
    $("#signupForm");

  if (!form) return;

  const email =
    form.querySelector(
      'input[type="email"], #email'
    );

  const password =
    form.querySelector(
      'input[type="password"], #password'
    );

  const confirm =
    form.querySelector(
      "#confirmPassword, #passwordConfirm"
    );

  const name =
    form.querySelector(
      "#name, #fullName, input[name='name']"
    );

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage();

      try {

        if (
          confirm &&
          password.value !== confirm.value
        ) {
          throw new Error(
            "Passwords do not match."
          );
        }

        setLoading(
          button,
          true,
          "Creating account..."
        );

        const metadata = {};

        if (
          name?.value.trim()
        ) {

          metadata.full_name =
            name.value.trim();

        }

        const data =
          await register(
            email?.value,
            password?.value,
            metadata
          );

        if (
          data?.user &&
          !data?.session
        ) {

          showMessage(
            "Account created. Please check your email to confirm your account.",
            "success"
          );

          setLoading(
            button,
            false
          );

          return;
        }

        showMessage(
          "Account created successfully.",
          "success"
        );

        window.setTimeout(() => {

          window.location.replace(
            safeRedirect()
          );

        }, 500);

      } catch (error) {

        console.error(
          "[Sonativa Auth]",
          error
        );

        showMessage(
          getAuthError(error),
          "error"
        );

        setLoading(
          button,
          false
        );
      }
    }
  );
}


/* =========================================================
   SOCIAL BUTTONS
========================================================= */

function initSocialButtons() {

  $$("[data-auth-provider]")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const provider =
            button.dataset.authProvider;

          try {

            setLoading(
              button,
              true,
              "Connecting..."
            );

            if (
              provider === "google"
            ) {

              await loginWithGoogle();

              return;
            }

            if (
              provider === "github"
            ) {

              await connectGitHub();

              return;
            }

            throw new Error(
              "Unsupported authentication provider."
            );

          } catch (error) {

            console.error(
              "[Sonativa Auth]",
              error
            );

            showMessage(
              getAuthError(error),
              "error"
            );

            setLoading(
              button,
              false
            );
          }
        }
      );
    });
}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function initLogoutButtons() {

  $$(
    "[data-auth-logout], [data-sonativa-logout]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        try {

          setLoading(
            button,
            true,
            "Signing out..."
          );

          await logout();

        } catch (error) {

          console.error(
            "[Sonativa Auth]",
            error
          );

          showMessage(
            getAuthError(error),
            "error"
          );

          setLoading(
            button,
            false
          );
        }
      }
    );
  });
}


/* =========================================================
   AUTH STATE
========================================================= */

function initAuthState() {

  onAuthStateChange(
    (
      event,
      session
    ) => {

      window.dispatchEvent(
        new CustomEvent(
          "sonativa:auth-change",
          {
            detail: {
              event,
              session,
              user:
                session?.user || null
            }
          }
        )
      );

    }
  );
}


/* =========================================================
   PUBLIC API
========================================================= */

export const SonativaAuth = {

  login,

  register,

  logout,

  resetPassword,

  updatePassword,

  loginWithGoogle,

  connectGitHub,

  getUser,

  getSession,

  isAuthenticated: async () =>
    Boolean(await getSession())

};


window.SonativaAuth =
  SonativaAuth;


/* =========================================================
   INITIALIZE
========================================================= */

function initAuth() {

  initLoginForm();

  initRegisterForm();

  initSocialButtons();

  initLogoutButtons();

  initAuthState();

}


if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initAuth,
    { once: true }
  );

} else {

  initAuth();

}
