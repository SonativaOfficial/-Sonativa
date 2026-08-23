/* =========================================================
   SONATIVA — AUTHENTICATION SYSTEM
   Version: 2026
   GitHub = Developer / Founder
   Google = Regular User
   Email/Password = Regular User
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

  if (
    !redirect ||
    redirect.startsWith("http") ||
    redirect.startsWith("//") ||
    redirect.includes("://")
  ) {
    return AUTH_CONFIG.homePage;
  }

  return redirect.replace(/^\/+/, "");
}


function setLoading(
  button,
  loading,
  text = "Please wait..."
) {

  if (!button) return;

  if (loading) {

    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent;
    }

    button.disabled = true;
    button.textContent = text;

  } else {

    button.disabled = false;

    button.textContent =
      button.dataset.originalText ||
      "Continue";
  }
}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(
  message,
  type = "info"
) {

  let box = $("#authMessage");

  if (!box) {

    box =
      document.createElement("div");

    box.id = "authMessage";

    Object.assign(box.style, {
      marginTop: "14px",
      padding: "12px 14px",
      borderRadius: "9px",
      fontSize: "12px",
      lineHeight: "1.5",
      border: "1px solid rgba(255,255,255,.12)"
    });

    const form =
      $("form") || document.body;

    form.appendChild(box);
  }

  box.textContent = message;

  if (type === "error") {

    box.style.color = "#ffaaaa";
    box.style.background = "#190d0d";
    box.style.borderColor = "#4a252c";

  } else if (type === "success") {

    box.style.color = "#8ff0b7";
    box.style.background = "#0c1912";
    box.style.borderColor = "#28543d";

  } else {

    box.style.color = "#c7d1df";
    box.style.background = "#0d141e";
  }

  box.hidden = false;
}


function clearMessage() {

  const box = $("#authMessage");

  if (box) {

    box.hidden = true;
    box.textContent = "";
  }
}


/* =========================================================
   VALIDATION
========================================================= */

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      String(email)
        .trim()
        .toLowerCase()
    );
}


function validatePassword(password) {

  if (
    typeof password !== "string" ||
    !password
  ) {
    return {
      valid: false,
      message: "Password is required."
    };
  }

  if (password.length < 8) {

    return {
      valid: false,
      message:
        "Password must contain at least 8 characters."
    };
  }

  return {
    valid: true,
    message: ""
  };
}


/* =========================================================
   EMAIL / PASSWORD LOGIN
========================================================= */

async function login(
  email,
  password
) {

  clearMessage();

  email =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!isValidEmail(email)) {
    throw new Error(
      "Enter a valid email address."
    );
  }

  if (!password) {
    throw new Error(
      "Enter your password."
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

  if (error) throw error;

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
    String(email || "")
      .trim()
      .toLowerCase();

  if (!isValidEmail(email)) {

    throw new Error(
      "Enter a valid email address."
    );
  }

  const passwordCheck =
    validatePassword(password);

  if (!passwordCheck.valid) {

    throw new Error(
      passwordCheck.message
    );
  }

  const {
    data,
    error
  } =
    await supabase.auth.signUp({

      email,
      password,

      options: {
        data: {
          account_type: "user",
          ...metadata
        }
      }
    });

  if (error) throw error;

  return data;
}


/* =========================================================
   GOOGLE — REGULAR USER
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
          `${window.location.origin}/${redirect}`,

        queryParams: {
          access_type: "offline",
          prompt: "select_account"
        }
      }
    });

  if (error) throw error;

  return data;
}


/* =========================================================
   GITHUB — DEVELOPER / FOUNDER
========================================================= */

async function loginWithGitHub() {

  clearMessage();

  const redirect =
    safeRedirect();

  const {
    data,
    error
  } =
    await supabase.auth.signInWithOAuth({

      provider: "github",

      options: {

        redirectTo:
          `${window.location.origin}/${redirect}`,

        scopes:
          "read:user user:email"
      }
    });

  if (error) throw error;

  return data;
}


/* =========================================================
   PASSWORD RESET
========================================================= */

async function resetPassword(email) {

  clearMessage();

  email =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!isValidEmail(email)) {

    throw new Error(
      "Enter a valid email address."
    );
  }

  const redirect =
    `${window.location.origin}/login.html`;

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirect
      }
    );

  if (error) throw error;

  return true;
}


/* =========================================================
   UPDATE PASSWORD
========================================================= */

async function updatePassword(
  newPassword
) {

  const check =
    validatePassword(newPassword);

  if (!check.valid) {

    throw new Error(
      check.message
    );
  }

  const {
    data,
    error
  } =
    await supabase.auth.updateUser({
      password: newPassword
    });

  if (error) throw error;

  return data;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  const result =
    await signOut();

  if (!result.success) {

    throw (
      result.error ||
      new Error(
        "Unable to sign out."
      )
    );
  }

  window.location.href =
    AUTH_CONFIG.loginPage;
}


/* =========================================================
   LOGIN FORM
========================================================= */

function initLoginForm() {

  const form =
    $("#loginForm");

  if (!form) return;

  const emailInput =
    form.querySelector(
      'input[type="email"], #email'
    );

  const passwordInput =
    form.querySelector(
      'input[type="password"], #password'
    );

  const submitButton =
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
          submitButton,
          true,
          "Signing in..."
        );

        await login(
          emailInput?.value,
          passwordInput?.value
        );

        showMessage(
          "Login successful. Redirecting...",
          "success"
        );

        window.location.href =
          safeRedirect();

      } catch (error) {

        console.error(
          "[Sonativa Auth] Login:",
          error
        );

        showMessage(
          error.message ||
          "Unable to sign in.",
          "error"
        );

        setLoading(
          submitButton,
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

  const emailInput =
    form.querySelector(
      'input[type="email"], #email'
    );

  const passwordInput =
    form.querySelector(
      'input[type="password"], #password'
    );

  const confirmInput =
    form.querySelector(
      "#confirmPassword, #passwordConfirm"
    );

  const nameInput =
    form.querySelector(
      "#name, #fullName, input[name='name']"
    );

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage();

      if (
        confirmInput &&
        passwordInput.value !==
        confirmInput.value
      ) {

        showMessage(
          "Passwords do not match.",
          "error"
        );

        return;
      }

      try {

        setLoading(
          submitButton,
          true,
          "Creating account..."
        );

        const metadata = {
          account_type: "user"
        };

        if (nameInput?.value.trim()) {

          metadata.full_name =
            nameInput.value.trim();
        }

        const data =
          await register(
            emailInput?.value,
            passwordInput?.value,
            metadata
          );

        if (
          data?.user &&
          !data?.session
        ) {

          showMessage(
            "Account created. Check your email to confirm your account.",
            "success"
          );

        } else {

          showMessage(
            "Account created successfully.",
            "success"
          );

          setTimeout(() => {

            window.location.href =
              safeRedirect();

          }, 700);
        }

      } catch (error) {

        console.error(
          "[Sonativa Auth] Register:",
          error
        );

        showMessage(
          error.message ||
          "Unable to create account.",
          "error"
        );

        setLoading(
          submitButton,
          false
        );
      }
    }
  );
}


/* =========================================================
   RESET FORM
========================================================= */

function initResetForm() {

  const form =
    $("#resetPasswordForm") ||
    $("#forgotPasswordForm");

  if (!form) return;

  const emailInput =
    form.querySelector(
      'input[type="email"], #email'
    );

  const submitButton =
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
          submitButton,
          true,
          "Sending..."
        );

        await resetPassword(
          emailInput?.value
        );

        showMessage(
          "Password reset instructions have been sent to your email.",
          "success"
        );

        setLoading(
          submitButton,
          false
        );

      } catch (error) {

        console.error(
          "[Sonativa Auth] Reset:",
          error
        );

        showMessage(
          error.message ||
          "Unable to send reset email.",
          "error"
        );

        setLoading(
          submitButton,
          false
        );
      }
    }
  );
}


/* =========================================================
   NEW PASSWORD
========================================================= */

function initNewPasswordForm() {

  const form =
    $("#newPasswordForm");

  if (!form) return;

  const passwordInput =
    form.querySelector(
      "#password, input[type='password']"
    );

  const confirmInput =
    form.querySelector(
      "#confirmPassword, #passwordConfirm"
    );

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage();

      if (
        confirmInput &&
        passwordInput.value !==
        confirmInput.value
      ) {

        showMessage(
          "Passwords do not match.",
          "error"
        );

        return;
      }

      try {

        setLoading(
          submitButton,
          true,
          "Updating..."
        );

        await updatePassword(
          passwordInput.value
        );

        showMessage(
          "Password updated successfully.",
          "success"
        );

        setTimeout(() => {

          window.location.href =
            AUTH_CONFIG.homePage;

        }, 800);

      } catch (error) {

        console.error(
          "[Sonativa Auth] Password update:",
          error
        );

        showMessage(
          error.message ||
          "Unable to update password.",
          "error"
        );

        setLoading(
          submitButton,
          false
        );
      }
    }
  );
}


/* =========================================================
   SOCIAL LOGIN
========================================================= */

function initSocialLogin() {

  $$("[data-auth-provider]")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const provider =
            button.dataset.authProvider;

          try {

            if (provider === "github") {

              setLoading(
                button,
                true,
                "Opening GitHub..."
              );

              await loginWithGitHub();

              return;
            }

            if (provider === "google") {

              setLoading(
                button,
                true,
                "Opening Google..."
              );

              await loginWithGoogle();

              return;
            }

            throw new Error(
              "Unsupported authentication provider."
            );

          } catch (error) {

            console.error(
              "[Sonativa Auth] Social login:",
              error
            );

            showMessage(
              error.message ||
              "Unable to continue.",
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
   LOGOUT
========================================================= */

function initLogoutButtons() {

  $$(
    "[data-auth-logout], [data-sonativa-logout]"
  )
    .forEach(button => {

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
              "[Sonativa Auth] Logout:",
              error
            );

            showMessage(
              error.message ||
              "Unable to sign out.",
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
    (event, session) => {

      window.dispatchEvent(
        new CustomEvent(
          "sonativa:auth-change",
          {
            detail: {
              event,
              session,
              user:
                session?.user ||
                null
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
  loginWithGitHub,

  getUser,
  getSession,

  isAuthenticated:
    async () =>
      Boolean(
        await getSession()
      )
};


window.SonativaAuth =
  SonativaAuth;


/* =========================================================
   INITIALIZATION
========================================================= */

function initAuth() {

  initLoginForm();
  initRegisterForm();
  initResetForm();
  initNewPasswordForm();
  initSocialLogin();
  initLogoutButtons();
  initAuthState();
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initAuth,
    { once: true }
  );

} else {

  initAuth();
}
