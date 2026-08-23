/* =========================================================
   SONATIVA — GLOBAL APPLICATION CORE
   assets/js/app.js
   Version: 2026.08
   ========================================================= */

"use strict";

/* =========================================================
   SONATIVA GLOBAL CONFIG
   ========================================================= */

window.Sonativa = window.Sonativa || {};

Sonativa.config = {
  appName: "Sonativa",
  version: "2026.08",
  storagePrefix: "sonativa_",

  routes: {
    home: "index.html",
    login: "login.html",
    projects: "projects.html",
    project: "project.html",
    tokenStudio: "token-studio.html",
    tokenomics: "tokenomics.html",
    wallet: "wallet.html",
    analysis: "analysis.html",
    security: "security.html",
    ai: "ai.html",
    news: "news.html",
    live: "live.html",
    reels: "reels.html",
    books: "books.html",
    pricing: "pricing.html",
    settings: "settings.html",
    founder: "founder.html"
  },

  features: {
    free: {
      dashboard: true,
      projects: true,
      basicTokenStudio: true,
      basicTokenomics: true,
      basicNews: true,
      basicReels: true,
      basicBooks: true,
      basicAnalysis: true
    },

    premium: {
      advancedAnalysis: true,
      advancedAI: true,
      advancedSecurity: true,
      advancedTokenTools: true,
      premiumNews: true,
      premiumReels: true,
      premiumBooks: true,
      advancedWalletTools: true
    }
  }
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

Sonativa.$ = function(selector, parent) {
  return (parent || document).querySelector(selector);
};

Sonativa.$$ = function(selector, parent) {
  return Array.from(
    (parent || document).querySelectorAll(selector)
  );
};

Sonativa.id = function(id) {
  return document.getElementById(id);
};


/* =========================================================
   SAFE STORAGE
   ========================================================= */

Sonativa.storage = {

  key(name) {
    return Sonativa.config.storagePrefix + name;
  },

  get(name, fallback = null) {
    try {
      const value = localStorage.getItem(
        this.key(name)
      );

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);

    } catch {
      return fallback;
    }
  },

  set(name, value) {
    try {
      localStorage.setItem(
        this.key(name),
        JSON.stringify(value)
      );

      return true;

    } catch {
      return false;
    }
  },

  remove(name) {
    try {
      localStorage.removeItem(
        this.key(name)
      );
    } catch {}
  }
};


/* =========================================================
   SECURITY HELPERS
   ========================================================= */

Sonativa.escapeHTML = function(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};


Sonativa.debounce = function(fn, delay = 300) {

  let timer;

  return function(...args) {

    clearTimeout(timer);

    timer = setTimeout(
      () => fn.apply(this, args),
      delay
    );
  };
};


Sonativa.throttle = function(fn, delay = 200) {

  let waiting = false;

  return function(...args) {

    if (waiting) {
      return;
    }

    waiting = true;

    fn.apply(this, args);

    setTimeout(() => {
      waiting = false;
    }, delay);
  };
};


/* =========================================================
   PAGE DETECTION
   ========================================================= */

Sonativa.getCurrentPage = function() {

  const path =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  return path || "index.html";
};


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

Sonativa.initNavigation = function() {

  const current =
    Sonativa.getCurrentPage();

  Sonativa.$$(".nav-item").forEach(item => {

    const href =
      item.getAttribute("href");

    if (!href || href === "#") {
      return;
    }

    const target =
      href.split("/").pop().toLowerCase();

    if (target === current) {
      item.classList.add("active");
      item.setAttribute(
        "aria-current",
        "page"
      );
    } else {
      item.classList.remove("active");
      item.removeAttribute(
        "aria-current"
      );
    }

  });
};


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

Sonativa.initMobileMenu = function() {

  const sidebar =
    Sonativa.id("sidebar");

  const button =
    Sonativa.id("menuButton");

  if (!sidebar || !button) {
    return;
  }

  const closeMenu = () => {
    sidebar.classList.remove("open");

    button.setAttribute(
      "aria-expanded",
      "false"
    );
  };

  button.setAttribute(
    "aria-expanded",
    "false"
  );

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      const opened =
        sidebar.classList.toggle("open");

      button.setAttribute(
        "aria-expanded",
        String(opened)
      );
    }
  );


  Sonativa.$$(".nav-item").forEach(item => {

    item.addEventListener(
      "click",
      () => {

        if (window.innerWidth <= 760) {
          closeMenu();
        }

      }
    );

  });


  document.addEventListener(
    "click",
    event => {

      if (window.innerWidth > 760) {
        return;
      }

      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !button.contains(event.target)
      ) {
        closeMenu();
      }

    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (window.innerWidth > 760) {
        closeMenu();
      }

    }
  );

};


/* =========================================================
   LANGUAGE SYSTEM
   ========================================================= */

Sonativa.languages = {
  en: {
    name: "English",
    dir: "ltr"
  },

  ar: {
    name: "العربية",
    dir: "rtl"
  },

  fr: {
    name: "Français",
    dir: "ltr"
  }
};


Sonativa.setLanguage = function(language) {

  if (!Sonativa.languages[language]) {
    language = "en";
  }

  const config =
    Sonativa.languages[language];

  document.documentElement.lang =
    language;

  document.documentElement.dir =
    config.dir;

  Sonativa.storage.set(
    "language",
    language
  );

  const select =
    Sonativa.id("languageSelect");

  if (select) {
    select.value = language;
  }

  document.dispatchEvent(
    new CustomEvent(
      "sonativa:languagechange",
      {
        detail: {
          language
        }
      }
    )
  );
};


Sonativa.initLanguage = function() {

  const select =
    Sonativa.id("languageSelect");

  const saved =
    Sonativa.storage.get(
      "language",
      "en"
    );

  Sonativa.setLanguage(saved);

  if (!select) {
    return;
  }

  select.addEventListener(
    "change",
    () => {
      Sonativa.setLanguage(
        select.value
      );
    }
  );
};


/* =========================================================
   THEME
   ========================================================= */

Sonativa.setTheme = function(theme) {

  const allowed = [
    "dark",
    "light",
    "system"
  ];

  if (!allowed.includes(theme)) {
    theme = "dark";
  }

  document.documentElement.dataset.theme =
    theme;

  Sonativa.storage.set(
    "theme",
    theme
  );

  document.dispatchEvent(
    new CustomEvent(
      "sonativa:themechange",
      {
        detail: {
          theme
        }
      }
    )
  );
};


Sonativa.initTheme = function() {

  const saved =
    Sonativa.storage.get(
      "theme",
      "dark"
    );

  Sonativa.setTheme(saved);
};


/* =========================================================
   REDUCED MOTION
   ========================================================= */

Sonativa.initAccessibility = function() {

  const media =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

  const apply = () => {

    document.documentElement.classList.toggle(
      "reduced-motion",
      media.matches
    );

  };

  apply();

  if (media.addEventListener) {
    media.addEventListener(
      "change",
      apply
    );
  }

};


/* =========================================================
   TOAST SYSTEM
   ========================================================= */

Sonativa.toast = function(
  message,
  type = "info",
  duration = 3500
) {

  let container =
    Sonativa.id("sonativaToastContainer");

  if (!container) {

    container =
      document.createElement("div");

    container.id =
      "sonativaToastContainer";

    container.setAttribute(
      "aria-live",
      "polite"
    );

    container.style.position =
      "fixed";

    container.style.right =
      "18px";

    container.style.bottom =
      "18px";

    container.style.zIndex =
      "99999";

    container.style.display =
      "flex";

    container.style.flexDirection =
      "column";

    container.style.gap =
      "10px";

    document.body.appendChild(
      container
    );
  }


  const toast =
    document.createElement("div");

  toast.className =
    "sonativa-toast sonativa-toast-" +
    type;

  toast.textContent =
    message;

  toast.style.padding =
    "12px 16px";

  toast.style.borderRadius =
    "10px";

  toast.style.background =
    "#111827";

  toast.style.color =
    "#ffffff";

  toast.style.border =
    "1px solid #293548";

  toast.style.fontSize =
    "12px";

  toast.style.maxWidth =
    "360px";

  toast.style.boxShadow =
    "0 15px 40px rgba(0,0,0,.35)";

  toast.style.opacity =
    "0";

  toast.style.transform =
    "translateY(8px)";

  toast.style.transition =
    "opacity .2s ease, transform .2s ease";

  container.appendChild(
    toast
  );


  requestAnimationFrame(() => {

    toast.style.opacity =
      "1";

    toast.style.transform =
      "translateY(0)";

  });


  window.setTimeout(() => {

    toast.style.opacity =
      "0";

    toast.style.transform =
      "translateY(8px)";

    window.setTimeout(() => {
      toast.remove();
    }, 250);

  }, duration);

};


/* =========================================================
   LOADING SYSTEM
   ========================================================= */

Sonativa.loading = {

  show(message = "Loading...") {

    let overlay =
      Sonativa.id(
        "sonativaLoading"
      );

    if (!overlay) {

      overlay =
        document.createElement("div");

      overlay.id =
        "sonativaLoading";

      overlay.style.position =
        "fixed";

      overlay.style.inset =
        "0";

      overlay.style.zIndex =
        "99998";

      overlay.style.display =
        "flex";

      overlay.style.alignItems =
        "center";

      overlay.style.justifyContent =
        "center";

      overlay.style.background =
        "rgba(3,6,11,.72)";

      overlay.style.backdropFilter =
        "blur(8px)";

      overlay.innerHTML = `
        <div
          style="
            min-width:220px;
            padding:22px;
            border:1px solid #273449;
            border-radius:14px;
            background:#0b111b;
            text-align:center;
          "
        >
          <div
            style="
              width:30px;
              height:30px;
              margin:0 auto 12px;
              border:3px solid #293548;
              border-top-color:#ffffff;
              border-radius:50%;
              animation:sonativaSpin .8s linear infinite;
            "
          ></div>

          <div
            id="sonativaLoadingMessage"
            style="
              color:#d9e0ea;
              font-size:12px;
            "
          ></div>
        </div>
      `;

      document.body.appendChild(
        overlay
      );


      if (!Sonativa.id(
        "sonativaLoadingStyle"
      )) {

        const style =
          document.createElement("style");

        style.id =
          "sonativaLoadingStyle";

        style.textContent = `
          @keyframes sonativaSpin {
            to {
              transform:rotate(360deg);
            }
          }
        `;

        document.head.appendChild(
          style
        );
      }

    }

    const messageElement =
      Sonativa.id(
        "sonativaLoadingMessage"
      );

    if (messageElement) {
      messageElement.textContent =
        message;
    }

    overlay.hidden = false;
  },


  hide() {

    const overlay =
      Sonativa.id(
        "sonativaLoading"
      );

    if (overlay) {
      overlay.hidden = true;
    }

  }

};


/* =========================================================
   MODAL SYSTEM
   ========================================================= */

Sonativa.modal = {

  open(content, options = {}) {

    this.close();

    const overlay =
      document.createElement("div");

    overlay.id =
      "sonativaModal";

    overlay.style.position =
      "fixed";

    overlay.style.inset =
      "0";

    overlay.style.zIndex =
      "99990";

    overlay.style.display =
      "flex";

    overlay.style.alignItems =
      "center";

    overlay.style.justifyContent =
      "center";

    overlay.style.padding =
      "20px";

    overlay.style.background =
      "rgba(0,0,0,.72)";

    overlay.style.backdropFilter =
      "blur(8px)";


    const box =
      document.createElement("div");

    box.style.width =
      "min(620px,100%)";

    box.style.maxHeight =
      "90vh";

    box.style.overflow =
      "auto";

    box.style.background =
      "#0b111b";

    box.style.border =
      "1px solid #293548";

    box.style.borderRadius =
      "15px";

    box.style.padding =
      "24px";

    box.style.boxShadow =
      "0 30px 100px rgba(0,0,0,.55)";


    if (options.title) {

      const title =
        document.createElement("div");

      title.textContent =
        options.title;

      title.style.fontSize =
        "17px";

      title.style.fontWeight =
        "800";

      title.style.marginBottom =
        "16px";

      box.appendChild(
        title
      );

    }


    const body =
      document.createElement("div");

    if (typeof content === "string") {
      body.innerHTML = content;
    } else if (content instanceof Node) {
      body.appendChild(content);
    }

    box.appendChild(body);


    overlay.appendChild(box);

    document.body.appendChild(
      overlay
    );


    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target === overlay &&
          options.closeOnBackdrop !== false
        ) {
          this.close();
        }

      }
    );


    document.addEventListener(
      "keydown",
      this.escapeHandler
    );

    return overlay;
  },


  escapeHandler(event) {

    if (event.key === "Escape") {
      Sonativa.modal.close();
    }

  },


  close() {

    const modal =
      Sonativa.id(
        "sonativaModal"
      );

    if (modal) {
      modal.remove();
    }

    document.removeEventListener(
      "keydown",
      this.escapeHandler
    );

  }

};


/* =========================================================
   PREMIUM SYSTEM
   ========================================================= */

Sonativa.premium = {

  isActive() {

    return (
      Sonativa.storage.get(
        "subscription",
        "free"
      ) === "premium"
    );

  },


  getPlan() {

    return Sonativa.storage.get(
      "subscription",
      "free"
    );

  },


  require(feature, callback) {

    if (
      Sonativa.premium.isActive()
    ) {

      if (typeof callback === "function") {
        return callback();
      }

      return true;
    }


    Sonativa.showPremium(feature);

    return false;
  }

};


Sonativa.showPremium = function(
  feature = "this feature"
) {

  const message = `
    <div style="line-height:1.7;color:#aeb8c8;font-size:13px;">
      <p style="margin-bottom:12px;">
        ${Sonativa.escapeHTML(
          feature
        )}
        is available in Sonativa Premium.
      </p>

      <p>
        Upgrade to unlock advanced Sonativa tools,
        analytics, AI and professional features.
      </p>

      <a
        href="pricing.html"
        style="
          display:inline-flex;
          margin-top:18px;
          padding:11px 16px;
          border-radius:9px;
          background:#ffffff;
          color:#05070c;
          text-decoration:none;
          font-weight:800;
          font-size:12px;
        "
      >
        View Premium
      </a>
    </div>
  `;

  Sonativa.modal.open(
    message,
    {
      title: "Sonativa Premium"
    }
  );

};


/* =========================================================
   PREMIUM FEATURE LOCKS
   ========================================================= */

Sonativa.initPremiumLocks = function() {

  Sonativa.$$(
    "[data-premium], .premium-feature"
  ).forEach(element => {

    const feature =
      element.dataset.premium ||
      element.dataset.feature ||
      "Premium feature";

    if (
      Sonativa.premium.isActive()
    ) {
      element.classList.add(
        "premium-unlocked"
      );

      return;
    }


    element.classList.add(
      "premium-locked"
    );


    if (
      element.tagName === "A"
    ) {

      element.addEventListener(
        "click",
        event => {

          event.preventDefault();

          Sonativa.showPremium(
            feature
          );

        }
      );

    } else {

      element.addEventListener(
        "click",
        () => {
          Sonativa.showPremium(
            feature
          );
        }
      );

    }

  });

};


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

Sonativa.initSearch = function() {

  const input =
    Sonativa.$(
      "[data-sonativa-search]"
    );

  if (!input) {
    return;
  }

  const items =
    Sonativa.$$(
      "[data-search-item]"
    );


  const search = Sonativa.debounce(
    () => {

      const query =
        input.value
          .trim()
          .toLowerCase();

      items.forEach(item => {

        const text =
          item.textContent
            .toLowerCase();

        item.hidden =
          query.length > 0 &&
          !text.includes(query);

      });

    },
    150
  );


  input.addEventListener(
    "input",
    search
  );

};


/* =========================================================
   FORM PROTECTION
   ========================================================= */

Sonativa.initForms = function() {

  document.addEventListener(
    "submit",
    event => {

      const form =
        event.target;

      if (
        !form.matches(
          "[data-sonativa-form]"
        )
      ) {
        return;
      }

      if (
        form.dataset.loading === "true"
      ) {
        event.preventDefault();
        return;
      }

      form.dataset.loading =
        "true";

      const button =
        form.querySelector(
          'button[type="submit"]'
        );

      if (button) {

        button.dataset.originalText =
          button.textContent;

        button.disabled =
          true;

        button.textContent =
          "Processing...";
      }

    }
  );

};


/* =========================================================
   COPY TO CLIPBOARD
   ========================================================= */

Sonativa.copy = async function(
  value,
  successMessage = "Copied."
) {

  try {

    await navigator.clipboard.writeText(
      String(value)
    );

    Sonativa.toast(
      successMessage,
      "success"
    );

    return true;

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      String(value);

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    let success = false;

    try {
      success =
        document.execCommand(
          "copy"
        );
    } catch {}

    textarea.remove();

    if (success) {
      Sonativa.toast(
        successMessage,
        "success"
      );
    } else {
      Sonativa.toast(
        "Unable to copy.",
        "error"
      );
    }

    return success;
  }

};


/* =========================================================
   COPY BUTTONS
   ========================================================= */

Sonativa.initCopyButtons = function() {

  Sonativa.$$(
    "[data-copy]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        const value =
          button.dataset.copy;

        if (!value) {
          return;
        }

        await Sonativa.copy(
          value,
          "Copied successfully."
        );

      }
    );

  });

};


/* =========================================================
   EXTERNAL LINK SAFETY
   ========================================================= */

Sonativa.initExternalLinks = function() {

  Sonativa.$$(
    'a[target="_blank"]'
  ).forEach(link => {

    const rel =
      link.getAttribute("rel") || "";

    const values =
      new Set(
        rel
          .split(/\s+/)
          .filter(Boolean)
      );

    values.add("noopener");
    values.add("noreferrer");

    link.setAttribute(
      "rel",
      Array.from(values).join(" ")
    );

  });

};


/* =========================================================
   SCROLL HEADER
   ========================================================= */

Sonativa.initScroll = function() {

  const topbar =
    document.querySelector(
      ".topbar"
    );

  if (!topbar) {
    return;
  }

  const update =
    Sonativa.throttle(
      () => {

        topbar.classList.toggle(
          "scrolled",
          window.scrollY > 10
        );

      },
      100
    );

  window.addEventListener(
    "scroll",
    update,
    {
      passive:true
    }
  );

  update();

};


/* =========================================================
   YEAR AUTO UPDATE
   ========================================================= */

Sonativa.initYear = function() {

  const year =
    new Date().getFullYear();

  Sonativa.$$(
    "[data-sonativa-year]"
  ).forEach(element => {
    element.textContent =
      year;
  });

};


/* =========================================================
   OFFLINE / ONLINE STATUS
   ========================================================= */

Sonativa.updateNetworkStatus =
function() {

  const online =
    navigator.onLine;

  document.documentElement.classList.toggle(
    "offline",
    !online
  );

  document.documentElement.classList.toggle(
    "online",
    online
  );

  document.dispatchEvent(
    new CustomEvent(
      "sonativa:network",
      {
        detail: {
          online
        }
      }
    )
  );

};


Sonativa.initNetworkStatus =
function() {

  window.addEventListener(
    "online",
    () => {

      Sonativa.updateNetworkStatus();

      Sonativa.toast(
        "Connection restored.",
        "success"
      );

    }
  );


  window.addEventListener(
    "offline",
    () => {

      Sonativa.updateNetworkStatus();

      Sonativa.toast(
        "You are currently offline.",
        "error"
      );

    }
  );


  Sonativa.updateNetworkStatus();

};


/* =========================================================
   WALLET EVENT BRIDGE
   ========================================================= */

Sonativa.wallet = {

  getAddress() {

    return Sonativa.storage.get(
      "walletAddress",
      null
    );

  },


  setAddress(address) {

    if (!address) {
      this.disconnect();
      return;
    }

    Sonativa.storage.set(
      "walletAddress",
      address
    );

    document.dispatchEvent(
      new CustomEvent(
        "sonativa:wallet",
        {
          detail: {
            connected:true,
            address
          }
        }
      )
    );

  },


  disconnect() {

    Sonativa.storage.remove(
      "walletAddress"
    );

    document.dispatchEvent(
      new CustomEvent(
        "sonativa:wallet",
        {
          detail: {
            connected:false,
            address:null
          }
        }
      )
    );

  },


  shorten(address, start = 6, end = 4) {

    if (!address) {
      return "Not connected";
    }

    if (
      address.length <=
      start + end + 3
    ) {
      return address;
    }

    return (
      address.slice(0,start) +
      "..." +
      address.slice(-end)
    );

  }

};


/* =========================================================
   WALLET UI
   ========================================================= */

Sonativa.updateWalletUI = function() {

  const address =
    Sonativa.wallet.getAddress();

  const elements =
    Sonativa.$$(
      "[data-wallet-address]"
    );

  elements.forEach(element => {

    element.textContent =
      address
      ?
      Sonativa.wallet.shorten(
        address
      )
      :
      "Not connected";

  });


  Sonativa.$$(
    "[data-wallet-status]"
  ).forEach(element => {

    element.textContent =
      address
      ?
      "Connected"
      :
      "Not connected";

  });

};


Sonativa.initWalletUI = function() {

  Sonativa.updateWalletUI();

  document.addEventListener(
    "sonativa:wallet",
    Sonativa.updateWalletUI
  );

};


/* =========================================================
   APP EVENTS
   ========================================================= */

Sonativa.events = {

  emit(name, detail = {}) {

    document.dispatchEvent(
      new CustomEvent(
        "sonativa:" + name,
        {
          detail
        }
      )
    );

  },

  on(name, callback) {

    document.addEventListener(
      "sonativa:" + name,
      callback
    );

  }

};


/* =========================================================
   ERROR HANDLING
   ========================================================= */

window.addEventListener(
  "error",
  event => {

    console.error(
      "[Sonativa]",
      event.error || event.message
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "[Sonativa] Unhandled Promise:",
      event.reason
    );

  }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

Sonativa.init = function() {

  try {

    Sonativa.initNavigation();

    Sonativa.initMobileMenu();

    Sonativa.initLanguage();

    Sonativa.initTheme();

    Sonativa.initAccessibility();

    Sonativa.initPremiumLocks();

    Sonativa.initSearch();

    Sonativa.initForms();

    Sonativa.initCopyButtons();

    Sonativa.initExternalLinks();

    Sonativa.initScroll();

    Sonativa.initYear();

    Sonativa.initNetworkStatus();

    Sonativa.initWalletUI();

    console.log(
      "Sonativa initialized:",
      Sonativa.config.version
    );


    document.dispatchEvent(
      new CustomEvent(
        "sonativa:ready",
        {
          detail: {
            version:
              Sonativa.config.version,
            page:
              Sonativa.getCurrentPage()
          }
        }
      )
    );

  } catch (error) {

    console.error(
      "Sonativa initialization error:",
      error
    );

  }

};


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    Sonativa.init,
    {
      once:true
    }
  );

} else {

  Sonativa.init();

}
