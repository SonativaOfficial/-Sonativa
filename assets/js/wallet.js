/* =========================================================
   SONATIVA — WALLET SYSTEM
   File: assets/js/wallet.js

   Supports:
   • Phantom
   • Solana wallet connection
   • Connect / disconnect
   • Account change detection
   • Network detection
   • Public address display
   • SOL balance
   • Safe transaction signing
   • No private key / seed phrase access
   ========================================================= */

import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction
} from "https://esm.sh/@solana/web3.js@1.98.4";

import { supabase } from "./supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const SONATIVA_NETWORK =
  "mainnet-beta";

const SOLANA_RPC =
  "https://api.mainnet-beta.solana.com";

const connection =
  new Connection(
    SOLANA_RPC,
    "confirmed"
  );


/* =========================================================
   STATE
========================================================= */

let walletPublicKey = null;

let walletProvider = null;

let walletConnected = false;


/* =========================================================
   FIND PHANTOM
========================================================= */

function getPhantomProvider() {

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
   GET PROVIDER
========================================================= */

export function getWalletProvider() {

  if (walletProvider) {
    return walletProvider;
  }

  walletProvider =
    getPhantomProvider();

  return walletProvider;
}


/* =========================================================
   PHANTOM DETECTION
========================================================= */

export function isPhantomInstalled() {

  return !!getPhantomProvider();

}


/* =========================================================
   CONNECT
========================================================= */

export async function connectWallet() {

  const provider =
    getWalletProvider();

  if (!provider) {

    throw new Error(
      "Phantom Wallet was not detected. Open Sonativa inside Phantom or use a browser with Phantom installed."
    );

  }

  try {

    const response =
      await provider.connect();

    const publicKey =
      response?.publicKey ||
      provider.publicKey;

    if (!publicKey) {
      throw new Error(
        "Phantom did not return a wallet address."
      );
    }

    walletPublicKey =
      publicKey instanceof PublicKey
        ? publicKey
        : new PublicKey(
            publicKey.toString()
          );

    walletConnected = true;

    saveWalletState();

    await updateWalletUI();

    return walletPublicKey.toString();

  } catch (error) {

    console.error(
      "Sonativa wallet connection error:",
      error
    );

    throw error;

  }

}


/* =========================================================
   DISCONNECT
========================================================= */

export async function disconnectWallet() {

  const provider =
    getWalletProvider();

  try {

    if (provider) {
      await provider.disconnect();
    }

  } catch (error) {

    console.warn(
      "Wallet disconnect warning:",
      error
    );

  }

  walletPublicKey = null;

  walletConnected = false;

  clearWalletState();

  await updateWalletUI();

}


/* =========================================================
   CURRENT WALLET
========================================================= */

export function getWalletAddress() {

  if (walletPublicKey) {
    return walletPublicKey.toString();
  }

  const provider =
    getWalletProvider();

  if (
    provider &&
    provider.publicKey
  ) {

    try {

      walletPublicKey =
        new PublicKey(
          provider.publicKey.toString()
        );

      walletConnected = true;

      return walletPublicKey.toString();

    } catch {
      return null;
    }

  }

  return null;

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

export function isWalletConnected() {

  return !!getWalletAddress();

}


/* =========================================================
   NETWORK
========================================================= */

export function getNetwork() {

  return SONATIVA_NETWORK;

}


/* =========================================================
   SOL BALANCE
========================================================= */

export async function getSolBalance(
  address = null
) {

  const wallet =
    address ||
    getWalletAddress();

  if (!wallet) {
    return 0;
  }

  try {

    const publicKey =
      new PublicKey(wallet);

    const lamports =
      await connection.getBalance(
        publicKey,
        "confirmed"
      );

    return lamports / 1_000_000_000;

  } catch (error) {

    console.error(
      "SOL balance error:",
      error
    );

    return 0;

  }

}


/* =========================================================
   WALLET INFO
========================================================= */

export async function getWalletInfo() {

  const address =
    getWalletAddress();

  if (!address) {

    return {
      connected: false,
      address: null,
      network: SONATIVA_NETWORK,
      balance: 0
    };

  }

  const balance =
    await getSolBalance(address);

  return {

    connected: true,

    address,

    network:
      SONATIVA_NETWORK,

    balance

  };

}


/* =========================================================
   SAFE TRANSACTION SIGNING
========================================================= */

export async function signTransaction(
  transaction
) {

  const provider =
    getWalletProvider();

  if (!provider) {

    throw new Error(
      "Phantom Wallet is not available."
    );

  }

  if (!getWalletAddress()) {

    throw new Error(
      "Connect your Phantom wallet first."
    );

  }

  if (!transaction) {

    throw new Error(
      "Transaction is required."
    );

  }

  try {

    const signed =
      await provider.signTransaction(
        transaction
      );

    return signed;

  } catch (error) {

    console.error(
      "Transaction signing failed:",
      error
    );

    throw error;

  }

}


/* =========================================================
   SIGN AND SEND TRANSACTION
========================================================= */

export async function signAndSendTransaction(
  transaction
) {

  const provider =
    getWalletProvider();

  if (!provider) {

    throw new Error(
      "Phantom Wallet is not available."
    );

  }

  if (!getWalletAddress()) {

    throw new Error(
      "Connect your Phantom wallet first."
    );

  }

  try {

    const signed =
      await provider.signAndSendTransaction(
        transaction
      );

    const signature =
      signed?.signature ||
      signed;

    if (!signature) {

      throw new Error(
        "Phantom did not return a transaction signature."
      );

    }

    await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    return signature;

  } catch (error) {

    console.error(
      "Transaction failed:",
      error
    );

    throw error;

  }

}


/* =========================================================
   SIGN MESSAGE
========================================================= */

export async function signMessage(
  message
) {

  const provider =
    getWalletProvider();

  if (!provider) {

    throw new Error(
      "Phantom Wallet is not available."
    );

  }

  if (!getWalletAddress()) {

    throw new Error(
      "Connect your Phantom wallet first."
    );

  }

  if (!message) {

    throw new Error(
      "Message is required."
    );

  }

  const encoded =
    new TextEncoder().encode(
      message
    );

  const result =
    await provider.signMessage(
      encoded,
      "utf8"
    );

  return result;

}


/* =========================================================
   SAVE LOCAL WALLET STATE
========================================================= */

function saveWalletState() {

  const address =
    getWalletAddress();

  if (!address) {
    return;
  }

  localStorage.setItem(
    "sonativa_wallet_connected",
    "true"
  );

  localStorage.setItem(
    "sonativa_wallet_address",
    address
  );

}


/* =========================================================
   CLEAR LOCAL STATE
========================================================= */

function clearWalletState() {

  localStorage.removeItem(
    "sonativa_wallet_connected"
  );

  localStorage.removeItem(
    "sonativa_wallet_address"
  );

}


/* =========================================================
   WALLET UI
========================================================= */

export async function updateWalletUI() {

  const address =
    getWalletAddress();

  const connected =
    !!address;

  const elements =
    document.querySelectorAll(
      "[data-wallet-address]"
    );

  elements.forEach(
    element => {

      element.textContent =
        connected
          ? shortenAddress(address)
          : "Not connected";

    }
  );


  document
    .querySelectorAll(
      "[data-wallet-status]"
    )
    .forEach(
      element => {

        element.textContent =
          connected
            ? "Connected"
            : "Not connected";

      }
    );


  document
    .querySelectorAll(
      "[data-wallet-balance]"
    )
    .forEach(
      async element => {

        if (!connected) {

          element.textContent =
            "0 SOL";

          return;

        }

        const balance =
          await getSolBalance(address);

        element.textContent =
          `${balance.toFixed(4)} SOL`;

      }
    );


  document
    .querySelectorAll(
      "[data-wallet-connect]"
    )
    .forEach(
      button => {

        button.textContent =
          connected
            ? shortenAddress(address)
            : "Connect Phantom";

      }
    );

}


/* =========================================================
   SHORT ADDRESS
========================================================= */

export function shortenAddress(
  address,
  start = 5,
  end = 5
) {

  if (!address) {
    return "";
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

export async function copyWalletAddress() {

  const address =
    getWalletAddress();

  if (!address) {

    throw new Error(
      "No wallet is connected."
    );

  }

  await navigator.clipboard.writeText(
    address
  );

  return address;

}


/* =========================================================
   PHANTOM EVENTS
========================================================= */

function setupWalletEvents() {

  const provider =
    getWalletProvider();

  if (!provider) {
    return;
  }


  provider.on(
    "connect",
    async publicKey => {

      try {

        walletPublicKey =
          publicKey instanceof PublicKey
            ? publicKey
            : new PublicKey(
                publicKey.toString()
              );

        walletConnected = true;

        saveWalletState();

        await updateWalletUI();

      } catch (error) {

        console.error(
          "Wallet connect event error:",
          error
        );

      }

    }
  );


  provider.on(
    "disconnect",
    async () => {

      walletPublicKey = null;

      walletConnected = false;

      clearWalletState();

      await updateWalletUI();

    }
  );


  provider.on(
    "accountChanged",
    async publicKey => {

      if (!publicKey) {

        walletPublicKey = null;

        walletConnected = false;

        clearWalletState();

        await updateWalletUI();

        return;

      }

      try {

        walletPublicKey =
          new PublicKey(
            publicKey.toString()
          );

        walletConnected = true;

        saveWalletState();

        await updateWalletUI();

      } catch (error) {

        console.error(
          "Account change error:",
          error
        );

      }

    }
  );

}


/* =========================================================
   CONNECT BUTTONS
========================================================= */

function setupConnectButtons() {

  document
    .querySelectorAll(
      "[data-wallet-connect]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.preventDefault();

            try {

              await connectWallet();

            } catch (error) {

              showWalletError(
                error
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-wallet-disconnect]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.preventDefault();

            await disconnectWallet();

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-wallet-copy]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.preventDefault();

            try {

              await copyWalletAddress();

              const oldText =
                button.textContent;

              button.textContent =
                "Copied";

              setTimeout(
                () => {
                  button.textContent =
                    oldText;
                },
                1500
              );

            } catch (error) {

              showWalletError(
                error
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showWalletError(error) {

  const message =
    error?.message ||
    "Wallet operation failed.";

  console.error(
    "Sonativa Wallet:",
    message
  );

  const errorElements =
    document.querySelectorAll(
      "[data-wallet-error]"
    );

  errorElements.forEach(
    element => {

      element.textContent =
        message;

      element.hidden = false;

    }
  );

}


/* =========================================================
   RESTORE CONNECTION
========================================================= */

export async function restoreWallet() {

  const provider =
    getWalletProvider();

  if (!provider) {
    return null;
  }

  try {

    const response =
      await provider.connect({
        onlyIfTrusted: true
      });

    const publicKey =
      response?.publicKey ||
      provider.publicKey;

    if (!publicKey) {
      return null;
    }

    walletPublicKey =
      new PublicKey(
        publicKey.toString()
      );

    walletConnected = true;

    saveWalletState();

    await updateWalletUI();

    return walletPublicKey.toString();

  } catch {

    return null;

  }

}


/* =========================================================
   INIT
========================================================= */

export async function initWallet() {

  setupWalletEvents();

  setupConnectButtons();

  await restoreWallet();

  await updateWalletUI();

}


/* =========================================================
   AUTO START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initWallet
  );

} else {

  initWallet();

}


/* =========================================================
   PUBLIC API
========================================================= */

window.SonativaWallet = {

  connect:
    connectWallet,

  disconnect:
    disconnectWallet,

  getAddress:
    getWalletAddress,

  getInfo:
    getWalletInfo,

  getBalance:
    getSolBalance,

  signTransaction,

  signAndSendTransaction,

  signMessage,

  copyAddress:
    copyWalletAddress,

  isConnected:
    isWalletConnected,

  isPhantomInstalled,

  shortenAddress

};
