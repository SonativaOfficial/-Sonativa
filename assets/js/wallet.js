/* =========================================================
   SONATIVA — WALLET.JS
   Solana Wallet / Phantom Integration
   ========================================================= */

import { supabase } from "./supabase.js";

/* =========================================================
   CONFIG
========================================================= */

const STORAGE_KEY = "sonativa_wallet";
const WALLET_NETWORK_KEY = "sonativa_wallet_network";

const NETWORKS = {
  mainnet: {
    name: "Solana Mainnet",
    cluster: "mainnet-beta"
  },

  devnet: {
    name: "Solana Devnet",
    cluster: "devnet"
  },

  testnet: {
    name: "Solana Testnet",
    cluster: "testnet"
  }
};

/*
  Mainnet token creation can remain disabled while
  Sonativa is being tested.
*/

let walletProvider = null;
let connectedPublicKey = null;

/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

/* =========================================================
   WALLET PROVIDER
========================================================= */

function detectPhantom() {
  if (
    window.phantom &&
    window.phantom.solana
  ) {
    return window.phantom.solana;
  }

  if (
    window.solana &&
    window.solana.isPhantom
  ) {
    return window.solana;
  }

  return null;
}

/* =========================================================
   PHANTOM DEEP LINK / BROWSER SUPPORT
========================================================= */

function isInsidePhantom() {
  const ua =
    navigator.userAgent ||
    "";

  return (
    /Phantom/i.test(ua) ||
    /PhantomBrowser/i.test(ua)
  );
}

function getCurrentPageUrl() {
  return window.location.href;
}

function openInsidePhantom() {
  const url =
    getCurrentPageUrl();

  const encoded =
    encodeURIComponent(url);

  /*
    Phantom's browser can open normal HTTPS pages.
    This fallback gives the user a clear way to
    continue when Phantom is not injected.
  */

  const phantomUrl =
    `https://phantom.app/ul/browse/${encoded}`;

  window.location.href =
    phantomUrl;
}

/* =========================================================
   INITIALIZE PROVIDER
========================================================= */

export function initializeWallet() {
  walletProvider =
    detectPhantom();

  return walletProvider;
}

/* =========================================================
   PUBLIC KEY
========================================================= */

export function getPublicKey() {
  if (connectedPublicKey) {
    return connectedPublicKey;
  }

  if (
    walletProvider &&
    walletProvider.publicKey
  ) {
    return walletProvider.publicKey
      .toString();
  }

  return null;
}

/* =========================================================
   FORMAT ADDRESS
========================================================= */

export function shortenAddress(
  address,
  start = 6,
  end = 6
) {
  if (!address) {
    return "Not connected";
  }

  const value =
    String(address);

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return (
    value.slice(0, start) +
    "..." +
    value.slice(-end)
  );
}

/* =========================================================
   COPY ADDRESS
========================================================= */

export async function copyAddress(
  address = getPublicKey()
) {
  if (!address) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(
      String(address)
    );

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   WALLET STATE
========================================================= */

export function getWalletState() {
  return {
    connected:
      !!getPublicKey(),

    address:
      getPublicKey(),

    shortened:
      shortenAddress(
        getPublicKey()
      ),

    provider:
      walletProvider
        ? "Phantom"
        : null,

    network:
      getStoredNetwork()
  };
}

/* =========================================================
   STORAGE
========================================================= */

function saveWallet(address) {
  if (!address) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    address
  );
}

function clearWalletStorage() {
  localStorage.removeItem(
    STORAGE_KEY
  );
}

function getStoredWallet() {
  return localStorage.getItem(
    STORAGE_KEY
  );
}

export function setNetwork(network) {
  if (
    !NETWORKS[network]
  ) {
    throw new Error(
      "Unsupported Solana network."
    );
  }

  localStorage.setItem(
    WALLET_NETWORK_KEY,
    network
  );

  updateWalletUI();

  return network;
}

export function getStoredNetwork() {
  return (
    localStorage.getItem(
      WALLET_NETWORK_KEY
    ) ||
    "devnet"
  );
}

/* =========================================================
   CONNECT PHANTOM
========================================================= */

export async function connectWallet() {
  walletProvider =
    detectPhantom();

  if (!walletProvider) {
    throw new Error(
      "Phantom wallet was not detected. Open Sonativa inside Phantom or use a browser with Phantom installed."
    );
  }

  try {
    const response =
      await walletProvider.connect();

    const publicKey =
      response?.publicKey ||
      walletProvider.publicKey;

    if (!publicKey) {
      throw new Error(
        "Phantom did not return a wallet address."
      );
    }

    connectedPublicKey =
      publicKey.toString();

    saveWallet(
      connectedPublicKey
    );

    updateWalletUI();

    await syncWalletWithSupabase(
      connectedPublicKey
    );

    dispatchWalletEvent(
      "connected"
    );

    return connectedPublicKey;

  } catch (error) {
    console.error(
      "Sonativa wallet connection:",
      error
    );

    throw error;
  }
}

/* =========================================================
   DISCONNECT
========================================================= */

export async function disconnectWallet() {
  try {
    if (
      walletProvider &&
      typeof walletProvider.disconnect ===
        "function"
    ) {
      await walletProvider.disconnect();
    }
  } catch (error) {
    console.warn(
      "Phantom disconnect:",
      error
    );
  }

  connectedPublicKey = null;

  clearWalletStorage();

  updateWalletUI();

  dispatchWalletEvent(
    "disconnected"
  );

  return true;
}

/* =========================================================
   RECONNECT
========================================================= */

export async function reconnectWallet() {
  walletProvider =
    detectPhantom();

  if (!walletProvider) {
    return null;
  }

  try {
    /*
      onlyIfTrusted prevents Phantom from
      opening a new permission popup on every page.
    */

    let response = null;

    if (
      typeof walletProvider.connect ===
      "function"
    ) {
      response =
        await walletProvider.connect({
          onlyIfTrusted: true
        });
    }

    const publicKey =
      response?.publicKey ||
      walletProvider.publicKey;

    if (!publicKey) {
      connectedPublicKey = null;

      updateWalletUI();

      return null;
    }

    connectedPublicKey =
      publicKey.toString();

    saveWallet(
      connectedPublicKey
    );

    updateWalletUI();

    await syncWalletWithSupabase(
      connectedPublicKey
    );

    dispatchWalletEvent(
      "reconnected"
    );

    return connectedPublicKey;

  } catch (error) {
    /*
      User simply has not approved Sonativa yet.
      This is not treated as a fatal application error.
    */

    connectedPublicKey = null;

    updateWalletUI();

    return null;
  }
}

/* =========================================================
   SUPABASE WALLET SYNC
========================================================= */

async function syncWalletWithSupabase(
  address
) {
  if (!address) {
    return;
  }

  try {
    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();

    /*
      Wallet connection must remain usable
      without authentication.
    */

    if (!user) {
      return;
    }

    /*
      This updates user metadata only.
      It does not store private keys or seed phrases.
    */

    const {
      error
    } =
      await supabase.auth.updateUser({
        data: {
          wallet_address:
            address,
          wallet_provider:
            "phantom",
          wallet_network:
            getStoredNetwork()
        }
      });

    if (error) {
      console.warn(
        "Wallet profile sync:",
        error.message
      );
    }

  } catch (error) {
    console.warn(
      "Wallet Supabase sync:",
      error
    );
  }
}

/* =========================================================
   WALLET EVENTS
========================================================= */

function dispatchWalletEvent(
  type
) {
  window.dispatchEvent(
    new CustomEvent(
      "sonativa:wallet",
      {
        detail: {
          type,
          ...getWalletState()
        }
      }
    )
  );
}

/* =========================================================
   PHANTOM EVENTS
========================================================= */

function setupProviderEvents() {
  if (!walletProvider) {
    return;
  }

  if (
    typeof walletProvider.on !==
    "function"
  ) {
    return;
  }

  walletProvider.on(
    "connect",
    (publicKey) => {
      connectedPublicKey =
        publicKey?.toString() ||
        walletProvider.publicKey?.toString() ||
        null;

      if (connectedPublicKey) {
        saveWallet(
          connectedPublicKey
        );
      }

      updateWalletUI();

      dispatchWalletEvent(
        "connected"
      );
    }
  );

  walletProvider.on(
    "disconnect",
    () => {
      connectedPublicKey = null;

      clearWalletStorage();

      updateWalletUI();

      dispatchWalletEvent(
        "disconnected"
      );
    }
  );

  walletProvider.on(
    "accountChanged",
    async (publicKey) => {
      if (!publicKey) {
        connectedPublicKey = null;

        clearWalletStorage();

        updateWalletUI();

        dispatchWalletEvent(
          "accountChanged"
        );

        return;
      }

      connectedPublicKey =
        publicKey.toString();

      saveWallet(
        connectedPublicKey
      );

      updateWalletUI();

      await syncWalletWithSupabase(
        connectedPublicKey
      );

      dispatchWalletEvent(
        "accountChanged"
      );
    }
  );
}

/* =========================================================
   UI UPDATE
========================================================= */

export function updateWalletUI() {
  const address =
    getPublicKey();

  const connected =
    !!address;

  const short =
    shortenAddress(address);

  /*
    Standard selectors
  */

  $all(
    "[data-wallet-address]"
  ).forEach(
    (element) => {
      element.textContent =
        address || "Not connected";
    }
  );

  $all(
    "[data-wallet-short]"
  ).forEach(
    (element) => {
      element.textContent =
        connected
          ? short
          : "Connect Wallet";
    }
  );

  $all(
    "[data-wallet-status]"
  ).forEach(
    (element) => {
      element.textContent =
        connected
          ? "Connected"
          : "Not connected";

      element.dataset.connected =
        connected
          ? "true"
          : "false";
    }
  );

  $all(
    "[data-wallet-network]"
  ).forEach(
    (element) => {
      const network =
        getStoredNetwork();

      element.textContent =
        NETWORKS[network]?.name ||
        network;
    }
  );

  /*
    Connect buttons
  */

  $all(
    "[data-wallet-connect]"
  ).forEach(
    (button) => {
      button.textContent =
        connected
          ? short
          : "Connect Phantom";

      button.dataset.connected =
        connected
          ? "true"
          : "false";
    }
  );

  /*
    Disconnect buttons
  */

  $all(
    "[data-wallet-disconnect]"
  ).forEach(
    (button) => {
      button.hidden =
        !connected;
    }
  );

  /*
    Elements visible only when connected
  */

  $all(
    "[data-wallet-only-connected]"
  ).forEach(
    (element) => {
      element.hidden =
        !connected;
    }
  );

  /*
    Elements visible only when disconnected
  */

  $all(
    "[data-wallet-only-disconnected]"
  ).forEach(
    (element) => {
      element.hidden =
        connected;
    }
  );

  /*
    Sidebar / dashboard compatibility
  */

  const walletStatus =
    $("#walletStatus");

  if (walletStatus) {
    walletStatus.textContent =
      connected
        ? "Connected"
        : "Guest";
  }

  const walletAddress =
    $("#walletAddress");

  if (walletAddress) {
    walletAddress.textContent =
      connected
        ? short
        : "Not connected";
  }
}

/* =========================================================
   CONNECT BUTTON BINDING
========================================================= */

function bindWalletButtons() {
  $all(
    "[data-wallet-connect]"
  ).forEach(
    (button) => {
      button.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();

          if (getPublicKey()) {
            return;
          }

          button.disabled = true;

          const originalText =
            button.textContent;

          button.textContent =
            "Connecting...";

          try {
            await connectWallet();

          } catch (error) {
            console.error(
              "Wallet connect:",
              error
            );

            /*
              If Phantom is not available,
              offer the Phantom browser route.
            */

            const message =
              error?.message ||
              "Unable to connect wallet.";

            if (
              message
                .toLowerCase()
                .includes(
                  "not detected"
                )
            ) {
              const open =
                window.confirm(
                  "Phantom was not detected. Open this Sonativa page inside Phantom?"
                );

              if (open) {
                openInsidePhantom();
                return;
              }
            }

            alert(message);

          } finally {
            button.disabled =
              false;

            if (
              !getPublicKey()
            ) {
              button.textContent =
                originalText ||
                "Connect Phantom";
            }
          }
        }
      );
    }
  );

  $all(
    "[data-wallet-disconnect]"
  ).forEach(
    (button) => {
      button.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();

          button.disabled =
            true;

          try {
            await disconnectWallet();
          } catch (error) {
            console.error(
              "Wallet disconnect:",
              error
            );
          } finally {
            button.disabled =
              false;
          }
        }
      );
    }
  );

  $all(
    "[data-wallet-copy]"
  ).forEach(
    (button) => {
      button.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();

          const address =
            getPublicKey();

          if (!address) {
            return;
          }

          const copied =
            await copyAddress(
              address
            );

          const oldText =
            button.textContent;

          button.textContent =
            copied
              ? "Copied ✓"
              : "Copy failed";

          setTimeout(
            () => {
              button.textContent =
                oldText;
            },
            1500
          );
        }
      );
    }
  );
}

/* =========================================================
   NETWORK SELECTOR
========================================================= */

function bindNetworkSelector() {
  $all(
    "[data-wallet-network-select]"
  ).forEach(
    (select) => {
      select.value =
        getStoredNetwork();

      select.addEventListener(
        "change",
        () => {
          try {
            setNetwork(
              select.value
            );
          } catch (error) {
            console.error(
              "Network selection:",
              error
            );
          }
        }
      );
    }
  );
}

/* =========================================================
   PHANTOM SECURITY CHECK
========================================================= */

export function isValidSolanaAddress(
  address
) {
  if (!address) {
    return false;
  }

  /*
    Solana public keys are base58 encoded
    and normally 32 bytes / 32-44 characters.
  */

  if (
    typeof address !==
    "string"
  ) {
    return false;
  }

  if (
    address.length < 32 ||
    address.length > 44
  ) {
    return false;
  }

  /*
    Base58 alphabet.
  */

  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(
    address
  );
}

/* =========================================================
   TRANSACTION AUTHORIZATION
========================================================= */

export async function signTransaction(
  transaction
) {
  if (!walletProvider) {
    walletProvider =
      detectPhantom();
  }

  if (!walletProvider) {
    throw new Error(
      "Phantom wallet was not detected."
    );
  }

  if (!getPublicKey()) {
    await connectWallet();
  }

  if (
    typeof walletProvider.signTransaction !==
    "function"
  ) {
    throw new Error(
      "This Phantom wallet does not support transaction signing."
    );
  }

  return walletProvider.signTransaction(
    transaction
  );
}

/* =========================================================
   SIGN MESSAGE
========================================================= */

export async function signMessage(
  message
) {
  if (!walletProvider) {
    walletProvider =
      detectPhantom();
  }

  if (!walletProvider) {
    throw new Error(
      "Phantom wallet was not detected."
    );
  }

  if (!getPublicKey()) {
    await connectWallet();
  }

  if (
    typeof walletProvider.signMessage !==
    "function"
  ) {
    throw new Error(
      "This wallet does not support message signing."
    );
  }

  const encoded =
    typeof message ===
    "string"
      ? new TextEncoder().encode(
          message
        )
      : message;

  return walletProvider.signMessage(
    encoded,
    "utf8"
  );
}

/* =========================================================
   NEVER REQUEST SEED PHRASE
========================================================= */

export function walletSecurityNotice() {
  return {
    privateKeyRequested:
      false,

    seedPhraseRequested:
      false,

    custodial:
      false,

    message:
      "Sonativa never requests or stores your Phantom seed phrase or private key."
  };
}

/* =========================================================
   FULL INITIALIZATION
========================================================= */

export async function initWallet() {
  initializeWallet();

  setupProviderEvents();

  bindWalletButtons();

  bindNetworkSelector();

  /*
    Attempt silent reconnection.
    This keeps the connection available when
    the user returns from Phantom to Sonativa.
  */

  await reconnectWallet();

  updateWalletUI();

  return getWalletState();
}

/* =========================================================
   WALLET EVENTS FOR OTHER PAGES
========================================================= */

window.addEventListener(
  "sonativa:wallet",
  (event) => {
    updateWalletUI();

    if (
      event.detail?.address
    ) {
      console.info(
        "Sonativa wallet:",
        event.detail.address
      );
    }
  }
);

/* =========================================================
   GLOBAL API
========================================================= */

window.SonativaWallet = {
  initializeWallet,
  connectWallet,
  disconnectWallet,
  reconnectWallet,
  getPublicKey,
  getWalletState,
  shortenAddress,
  copyAddress,
  setNetwork,
  getStoredNetwork,
  isValidSolanaAddress,
  signTransaction,
  signMessage,
  walletSecurityNotice,
  updateWalletUI,
  initWallet
};

/* =========================================================
   AUTO START
========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      initWallet();
    },
    { once: true }
  );
} else {
  initWallet();
}
