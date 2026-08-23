/* =========================================================
   SONATIVA — APP CORE
   File: assets/js/app.js
   ========================================================= */

import {
  supabase,
  getUser,
  getSession,
  onAuthStateChange,
  signOut
} from "./supabase.js";

import {
  SonativaWallet
} from "./wallet.js";


/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {
  appName: "Sonativa",
  version: "2026",
  loginPage: "login.html",
  homePage: "index.html",
  defaultLanguage: "en"
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (
  selector,
  parent = document
) => parent.querySelector(selector);


const $$ = (
  selector,
  parent = document
) => [
  ...parent.querySelectorAll(selector)
];


const escapeHTML = (value) => {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

};


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function initSidebar() {

  const sidebar =
    $("#sidebar");

  const menuButton =
    $("#menuButton");

  if (!sidebar || !menuButton) {
    return;
  }

  menuButton.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle(
        "open"
      );

    }
  );


  $$(".nav-item")
    .forEach((item) => {

      item.addEventListener(
        "click",
        () => {

          if (
            window.innerWidth <= 760
          ) {

            sidebar.classList.remove(
              "open"
            );

          }

        }
      );

    });


  document.addEventListener(
    "click",
    (event) => {

      if (
        window.innerWidth > 760
      ) {
        return;
      }

      if (
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {

        sidebar.classList.remove(
          "open"
        );

      }

    }
  );

}


/* =========================================================
   LANGUAGE
========================================================= */

function getLanguage() {

  return (
    localStorage.getItem(
      "sonativa_language"
    ) ||
    CONFIG.defaultLanguage
  );

}


function applyLanguage(
  language = getLanguage()
) {

  const supported = [
    "en",
    "ar",
    "fr"
  ];

  if (
    !supported.includes(language)
  ) {

    language =
      CONFIG.defaultLanguage;

  }

  localStorage.setItem(
    "sonativa_language",
    language
  );

  document.documentElement.lang =
    language;

  document.documentElement.dir =
    language === "ar"
      ? "rtl"
      : "ltr";


  const select =
    $("#languageSelect");

  if (select) {
    select.value =
      language;
  }

}


function initLanguage() {

  applyLanguage();

  const select =
    $("#languageSelect");

  if (!select) {
    return;
  }

  select.addEventListener(
    "change",
    () => {

      applyLanguage(
        select.value
      );

      window.dispatchEvent(
        new CustomEvent(
          "sonativa:language",
          {
            detail: {
              language:
                select.value
            }
          }
        )
      );

    }
  );

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function getUserName(
  user
) {

  if (!user) {
    return "Guest";
  }

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Sonativa User"
  );

}


function getInitial(
  name
) {

  return String(
    name || "S"
  )
    .charAt(0)
    .toUpperCase();

}


function updateUserUI(
  user
) {

  const name =
    getUserName(user);

  const avatar =
    $("#avatar");

  const accountName =
    $("#accountName");

  const walletStatus =
    $("#walletStatus");


  if (accountName) {

    accountName.textContent =
      name;

  }


  if (avatar) {

    avatar.textContent =
      getInitial(name);

  }


  if (walletStatus) {

    walletStatus.textContent =
      user
        ? "Ready"
        : "Guest";

  }


  $$("[data-user-name]")
    .forEach((element) => {

      element.textContent =
        name;

    });


  $$("[data-user-email]")
    .forEach((element) => {

      element.textContent =
        user?.email ||
        "";

    });

}


/* =========================================================
   LOGOUT
========================================================= */

function initLogout() {

  $$("[data-sonativa-logout]")
    .forEach((button) => {

      button.addEventListener(
        "click",
        async (event) => {

          event.preventDefault();

          const original =
            button.textContent;

          button.disabled =
            true;

          button.textContent =
            "Signing out...";


          try {

            await signOut();

            window.location.href =
              CONFIG.loginPage;

          } catch (error) {

            console.error(
              "[Sonativa] Logout error:",
              error
            );

            button.disabled =
              false;

            button.textContent =
              original;

            notify(
              error.message ||
              "Unable to sign out.",
              "error"
            );

          }

        }
      );

    });

}


/* =========================================================
   WALLET UI
========================================================= */

function updateWalletUI() {

  if (
    !window.SonativaWallet
  ) {
    return;
  }

  const connected =
    window.SonativaWallet
      .isConnected();

  const address =
    window.SonativaWallet
      .getAddress();


  $$("[data-wallet-status]")
    .forEach((element) => {

      element.textContent =
        connected
          ? "Connected"
          : "Not connected";

      element.dataset.connected =
        connected
          ? "true"
          : "false";

    });


  $$("[data-wallet-address]")
    .forEach((element) => {

      element.textContent =
        connected && address
          ? `${address.slice(0, 4)}...${address.slice(-4)}`
          : "Not connected";

    });


  $$("[data-wallet-full-address]")
    .forEach((element) => {

      element.textContent =
        address ||
        "Not connected";

    });

}


/* =========================================================
   WALLET EVENTS
========================================================= */

function initWallet() {

  if (
    window.SonativaWallet
  ) {

    window.SonativaWallet
      .onChange(
        updateWalletUI
      );

    updateWalletUI();

  }

}


/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

function initNavigation() {

  const current =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase() ||
    "index.html";


  $$(".nav-item")
    .forEach((item) => {

      const href =
        item.getAttribute("href");

      if (!href) {
        return;
      }

      const target =
        href
          .split("/")
          .pop()
          .split("?")[0]
          .toLowerCase();


      if (
        target === current
      ) {

        item.classList.add(
          "active"
        );

      }

    });

}


/* =========================================================
   PAGE TITLE
========================================================= */

function initPageTitle() {

  const title =
    document.title;

  $$("[data-page-title]")
    .forEach((element) => {

      element.textContent =
        title
          .replace(
            "Sonativa —",
            ""
          )
          .trim();

    });

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function notify(
  message,
  type = "info"
) {

  let container =
    $("#sonativaNotifications");


  if (!container) {

    container =
      document.createElement(
        "div"
      );

    container.id =
      "sonativaNotifications";


    Object.assign(
      container.style,
      {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: "999999",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "min(360px, calc(100vw - 40px))"
      }
    );


    document.body.appendChild(
      container
    );

  }


  const item =
    document.createElement(
      "div"
    );


  item.textContent =
    message;


  Object.assign(
    item.style,
    {
      padding: "13px 15px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,.12)",
      background:
        type === "error"
          ? "#180d0d"
          : "#0d151f",
      color:
        type === "error"
          ? "#ffaaaa"
          : "#dbe4ef",
      fontFamily:
        "system-ui, sans-serif",
      fontSize: "12px",
      boxShadow:
        "0 15px 40px rgba(0,0,0,.35)"
    }
  );


  container.appendChild(
    item
  );


  setTimeout(
    () => {

      item.remove();

    },
    4500
  );

}


/* =========================================================
   GLOBAL NOTIFICATION API
========================================================= */

window.SonativaNotify =
  notify;


/* =========================================================
   SUPABASE AUTH
========================================================= */

async function initAuth() {

  try {

    const session =
      await getSession();

    const user =
      session?.user ||
      await getUser();


    updateUserUI(
      user
    );


    document.documentElement
      .dataset.authenticated =
        user
          ? "true"
          : "false";


    onAuthStateChange(
      (
        event,
        newSession
      ) => {

        const newUser =
          newSession?.user ||
          null;


        updateUserUI(
          newUser
        );


        document.documentElement
          .dataset.authenticated =
            newUser
              ? "true"
              : "false";


        window.dispatchEvent(
          new CustomEvent(
            "sonativa:auth",
            {
              detail: {
                event,
                session:
                  newSession
              }
            }
          )
        );

      }
    );

  } catch (error) {

    console.error(
      "[Sonativa] Auth initialization error:",
      error
    );

  }

}


/* =========================================================
   FOUNDER ACCESS
========================================================= */

async function checkFounderAccess() {

  if (
    !supabase
  ) {
    return false;
  }

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "is_sonativa_founder"
      );


    if (error) {

      console.warn(
        "[Sonativa] Founder check:",
        error.message
      );

      return false;
    }


    return data === true;

  } catch (error) {

    console.warn(
      "[Sonativa] Founder check failed:",
      error
    );

    return false;
  }

}


/* =========================================================
   FOUNDER UI
========================================================= */

function addFounderUI() {

  if (
    $("#founderControlLink")
  ) {
    return;
  }


  const nav =
    $(".nav");


  if (nav) {

    const section =
      document.createElement(
        "div"
      );

    section.className =
      "nav-section";

    section.textContent =
      "Founder";


    const link =
      document.createElement(
        "a"
      );

    link.id =
      "founderControlLink";

    link.className =
      "nav-item";

    link.href =
      "founder.html";


    link.innerHTML = `
      <span class="nav-icon">◆</span>
      <span>Founder Control Center</span>
      <span class="nav-badge">FOUNDER</span>
    `;


    nav.appendChild(
      section
    );

    nav.appendChild(
      link
    );

  }


  const topActions =
    $("#topActions");


  if (
    topActions &&
    !$("#founderTopButton")
  ) {

    const button =
      document.createElement(
        "a"
      );

    button.id =
      "founderTopButton";

    button.href =
      "founder.html";

    button.className =
      "founder-button";

    button.textContent =
      "Founder";


    topActions.prepend(
      button
    );

  }

}


/* =========================================================
   PROJECT COUNT
========================================================= */

async function loadProjectStats() {

  const user =
    await getUser();


  const projectsCount =
    $("#projectsCount");

  const tokensCount =
    $("#tokensCount");


  if (!user) {

    if (projectsCount) {
      projectsCount.textContent =
        "0";
    }

    if (tokensCount) {
      tokensCount.textContent =
        "0";
    }

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabase
        .from("projects")
        .select(
          "id,token_status,mint_address",
          {
            count: "exact"
          }
        )
        .eq(
          "user_id",
          user.id
        );


    if (error) {
      throw error;
    }


    const projects =
      data || [];


    if (projectsCount) {

      projectsCount.textContent =
        String(
          projects.length
        );

    }


    const tokens =
      projects.filter(
        (project) =>
          Boolean(
            project.mint_address
          ) ||
          project.token_status ===
            "created" ||
          project.token_status ===
            "minted"
      );


    if (tokensCount) {

      tokensCount.textContent =
        String(
          tokens.length
        );

    }

  } catch (error) {

    console.warn(
      "[Sonativa] Project statistics unavailable:",
      error
    );

  }

}


/* =========================================================
   PROTECTED PAGE
========================================================= */

async function protectPage() {

  const required =
    document.body.dataset.authRequired ===
    "true";


  if (!required) {
    return;
  }


  const session =
    await getSession();


  if (!session) {

    const current =
      window.location.pathname +
      window.location.search +
      window.location.hash;


    window.location.href =
      `${CONFIG.loginPage}?redirect=${encodeURIComponent(current)}`;

  }

}


/* =========================================================
   PREMIUM UI
========================================================= */

function initPremiumFeatures() {

  $$("[data-premium]")
    .forEach((element) => {

      element.addEventListener(
        "click",
        (event) => {

          const locked =
            element.dataset.premium ===
            "locked";


          if (!locked) {
            return;
          }


          event.preventDefault();


          window.dispatchEvent(
            new CustomEvent(
              "sonativa:premium",
              {
                detail: {
                  element
                }
              }
            )
          );


          notify(
            "This feature will be available with Sonativa Premium.",
            "info"
          );

        }
      );

    });

}


/* =========================================================
   PREVENT DOUBLE SUBMISSION
========================================================= */

function initForms() {

  $$("form")
    .forEach((form) => {

      form.addEventListener(
        "submit",
        () => {

          const button =
            form.querySelector(
              "button[type='submit']"
            );


          if (!button) {
            return;
          }


          if (
            button.dataset.locked ===
            "true"
          ) {
            return;
          }


          button.dataset.locked =
            "true";


          setTimeout(
            () => {

              button.dataset.locked =
                "false";

            },
            1500
          );

        }
      );

    });

}


/* =========================================================
   SAFE EXTERNAL LINKS
========================================================= */

function initExternalLinks() {

  $$(
    'a[target="_blank"]'
  )
    .forEach((link) => {

      const rel =
        link.getAttribute(
          "rel"
        ) || "";


      if (
        !rel.includes("noopener")
      ) {

        link.setAttribute(
          "rel",
          `${rel} noopener noreferrer`.trim()
        );

      }

    });

}


/* =========================================================
   GLOBAL APP
========================================================= */

window.Sonativa = {

  version:
    CONFIG.version,

  config:
    CONFIG,

  supabase,

  getUser,

  getSession,

  wallet:
    window.SonativaWallet || null,

  notify,

  escapeHTML,

  getLanguage,

  setLanguage:
    applyLanguage

};


/* =========================================================
   INITIALIZATION
========================================================= */

async function initSonativa() {

  try {

    initSidebar();

    initLanguage();

    initNavigation();

    initPageTitle();

    initLogout();

    initWallet();

    initPremiumFeatures();

    initForms();

    initExternalLinks();

    await initAuth();

    await protectPage();

    await loadProjectStats();


    const isFounder =
      await checkFounderAccess();


    if (isFounder) {

      addFounderUI();

    }


    window.dispatchEvent(
      new CustomEvent(
        "sonativa:ready",
        {
          detail: {
            version:
              CONFIG.version
          }
        }
      )
    );


    console.info(
      "Sonativa application initialized."
    );

  } catch (error) {

    console.error(
      "[Sonativa] Initialization failed:",
      error
    );

  }

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initSonativa,
    {
      once: true
    }
  );

} else {

  initSonativa();

}
