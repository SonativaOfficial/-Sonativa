/* =========================================================
   SONATIVA — AUTH SYSTEM
   File: assets/js/auth.js
   ========================================================= */

import {
  supabase
} from "./supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const LOGIN_PAGE =
  "login.html";

const HOME_PAGE =
  "index.html";


/* =========================================================
   USER
========================================================= */

export async function getUser() {

  const {
    data,
    error
  } =
    await supabase.auth.getUser();

  if (error) {

    console.warn(
      "Sonativa auth:",
      error.message
    );

    return null;
  }

  return data?.user || null;

}


/* =========================================================
   SESSION
========================================================= */

export async function getSession() {

  const {
    data,
    error
  } =
    await supabase.auth.getSession();

  if (error) {

    console.warn(
      "Sonativa session:",
      error.message
    );

    return null;
  }

  return data?.session || null;

}


/* =========================================================
   LOGIN — EMAIL
========================================================= */

export async function loginWithEmail(
  email,
  password
) {

  if (!email || !password) {

    throw new Error(
      "Email and password are required."
    );

  }

  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword({

      email:
        email.trim(),

      password

    });


  if (error) {

    throw error;

  }


  return data;

}


/* =========================================================
   SIGN UP
========================================================= */

export async function signUp(
  email,
  password,
  metadata = {}
) {

  if (!email || !password) {

    throw new Error(
      "Email and password are required."
    );

  }


  if (password.length < 8) {

    throw new Error(
      "Password must contain at least 8 characters."
    );

  }


  const {
    data,
    error
  } =
    await supabase.auth.signUp({

      email:
        email.trim(),

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
   MAGIC LINK
========================================================= */

export async function sendMagicLink(
  email
) {

  if (!email) {

    throw new Error(
      "Email is required."
    );

  }


  const {
    data,
    error
  } =
    await supabase.auth.signInWithOtp({

      email:
        email.trim(),

      options: {

        emailRedirectTo:
          window.location.origin +
          "/index.html"

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

export async function loginWithGoogle() {

  const {
    data,
    error
  } =
  await supabase.auth.signInWithOAuth({

    provider:
      "google",

    options: {

      redirectTo:
        window.location.origin +
        "/index.html"

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

export async function logout() {

  const {
    error
  } =
    await supabase.auth.signOut();

  if (error) {

    throw error;

  }


  window.location.href =
    LOGIN_PAGE;

}


/* =========================================================
   AUTH STATE
========================================================= */

export function onAuthChange(
  callback
) {

  return supabase.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

      if (
        typeof callback ===
        "function"
      ) {

        callback(
          event,
          session
        );

      }

    }
  );

}


/* =========================================================
   REQUIRE LOGIN
========================================================= */

export async function requireAuth(
  redirect = LOGIN_PAGE
) {

  const session =
    await getSession();


  if (!session) {

    const current =
      window.location.href;

    const separator =
      redirect.includes("?")
        ? "&"
        : "?";


    window.location.href =
      redirect +
      separator +
      "redirect=" +
      encodeURIComponent(
        current
      );


    return null;

  }


  return session;

}


/* =========================================================
   REQUIRE GUEST
========================================================= */

export async function requireGuest(
  redirect = HOME_PAGE
) {

  const session =
    await getSession();


  if (session) {

    window.location.href =
      redirect;

    return false;

  }


  return true;

}


/* =========================================================
   USER PROFILE
========================================================= */

export async function updateProfile(
  updates = {}
) {

  const {
    data,
    error
  } =
    await supabase.auth.updateUser({

      data: {
        ...updates
      }

    });


  if (error) {

    throw error;

  }


  return data?.user || null;

}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

export async function changePassword(
  newPassword
) {

  if (!newPassword) {

    throw new Error(
      "New password is required."
    );

  }


  if (newPassword.length < 8) {

    throw new Error(
      "Password must contain at least 8 characters."
    );

  }


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


  return data?.user || null;

}


/* =========================================================
   PASSWORD RESET
========================================================= */

export async function resetPassword(
  email
) {

  if (!email) {

    throw new Error(
      "Email is required."
    );

  }


  const {
    data,
    error
  } =
    await supabase.auth.resetPasswordForEmail(

      email.trim(),

      {
        redirectTo:
          window.location.origin +
          "/login.html"
      }

    );


  if (error) {

    throw error;

  }


  return data;

}


/* =========================================================
   AUTH ERROR MESSAGE
========================================================= */

export function getAuthErrorMessage(
  error
) {

  const message =
    String(
      error?.message ||
      error ||
      ""
    ).toLowerCase();


  if (
    message.includes(
      "invalid login credentials"
    )
  ) {

    return "Email or password is incorrect.";

  }


  if (
    message.includes(
      "email not confirmed"
    )
  ) {

    return "Please confirm your email first.";

  }


  if (
    message.includes(
      "user already registered"
    )
  ) {

    return "This email is already registered.";

  }


  if (
    message.includes(
      "password"
    ) &&
    message.includes(
      "characters"
    )
  ) {

    return "Password is too short.";

  }


  if (
    message.includes(
      "rate limit"
    )
  ) {

    return "Too many attempts. Please try again later.";

  }


  if (
    message.includes(
      "network"
    )
  ) {

    return "Network error. Check your internet connection.";

  }


  return (
    error?.message ||
    "Authentication failed. Please try again."
  );

}


/* =========================================================
   REDIRECT AFTER LOGIN
========================================================= */

export function getRedirectTarget() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const redirect =
    params.get(
      "redirect"
    );


  if (!redirect) {

    return HOME_PAGE;

  }


  try {

    const url =
      new URL(
        redirect,
        window.location.origin
      );


    if (
      url.origin !==
      window.location.origin
    ) {

      return HOME_PAGE;

    }


    return (
      url.pathname +
      url.search +
      url.hash
    );

  } catch {

    return HOME_PAGE;

  }

}


/* =========================================================
   LOGIN FORM
========================================================= */

function setupLoginForm() {

  const form =
    document.querySelector(
      "[data-sonativa-login]"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        form.querySelector(
          "[name='email']"
        )?.value;


      const password =
        form.querySelector(
          "[name='password']"
        )?.value;


      const button =
        form.querySelector(
          "button[type='submit']"
        );


      try {

        if (button) {

          button.disabled =
            true;

          button.dataset.originalText =
            button.textContent;

          button.textContent =
            "Signing in...";

        }


        await loginWithEmail(
          email,
          password
        );


        window.location.href =
          getRedirectTarget();


      } catch (error) {

        showAuthMessage(
          form,
          getAuthErrorMessage(
            error
          )
        );


      } finally {

        if (button) {

          button.disabled =
            false;

          button.textContent =
            button.dataset.originalText ||
            "Sign in";

        }

      }

    }
  );

}


/* =========================================================
   SIGNUP FORM
========================================================= */

function setupSignupForm() {

  const form =
    document.querySelector(
      "[data-sonativa-signup]"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        form.querySelector(
          "[name='email']"
        )?.value;


      const password =
        form.querySelector(
          "[name='password']"
        )?.value;


      try {

        await signUp(
          email,
          password
        );


        showAuthMessage(
          form,
          "Account created. Check your email to confirm your account."
        );


      } catch (error) {

        showAuthMessage(
          form,
          getAuthErrorMessage(
            error
          )
        );

      }

    }
  );

}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

  document
    .querySelectorAll(
      "[data-sonativa-logout]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.preventDefault();

            try {

              button.disabled =
                true;

              await logout();

            } catch (error) {

              button.disabled =
                false;

              showAuthMessage(
                document,
                getAuthErrorMessage(
                  error
                )
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthMessage(
  container,
  message
) {

  let element =
    container.querySelector(
      "[data-auth-message]"
    );


  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.dataset.authMessage =
      "true";

    element.setAttribute(
      "role",
      "alert"
    );

    container.prepend(
      element
    );

  }


  element.textContent =
    message;

}


/* =========================================================
   GLOBAL API
========================================================= */

window.SonativaAuth = {

  getUser,

  getSession,

  loginWithEmail,

  signUp,

  sendMagicLink,

  loginWithGoogle,

  logout,

  onAuthChange,

  requireAuth,

  requireGuest,

  updateProfile,

  changePassword,

  resetPassword,

  getAuthErrorMessage,

  getRedirectTarget

};


/* =========================================================
   AUTO SETUP
========================================================= */

function initAuth() {

  setupLoginForm();

  setupSignupForm();

  setupLogoutButtons();


  onAuthChange(
    (
      event,
      session
    ) => {

      document
        .documentElement
        .dataset.authenticated =
        session
          ? "true"
          : "false";


      window.dispatchEvent(
        new CustomEvent(
          "sonativa:auth",
          {
            detail: {
              event,
              session
            }
          }
        )
      );

    }
  );

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initAuth
  );

} else {

  initAuth();

}
