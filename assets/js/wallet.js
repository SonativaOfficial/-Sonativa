/* =========================================================
   SONATIVA — WALLET ENGINE
   Version: 2026
   Supports Phantom / Solana Wallet Standard
   ========================================================= */

const SonativaWallet = (() => {

  "use strict";

  const state = {
    connected: false,
    publicKey: null,
    provider: null,
    network: "mainnet-beta"
  };

  const listeners = new Set();

  function emit() {
    const snapshot = {
      connected: state.connected,
      publicKey: state.publicKey,
      address: state.publicKey,
      network: state.network
    };

    listeners.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error("[Sonativa Wallet] Listener error:", error);
      }
    });

    window.dispatchEvent(
      new CustomEvent("sonativa:wallet", {
        detail: snapshot
      })
    );
  }

  function getProvider() {
    if (window.phantom?.solana) {
      return window.phantom.solana;
    }

    if (window.solana?.isPhantom) {
      return window.solana;
    }

    return null;
  }

  function getAddress() {
    if (!state.publicKey) return null;

    return typeof state.publicKey === "string"
      ? state.publicKey
      : state.publicKey.toString();
  }

  async function connect() {

    const provider = getProvider();

    if (!provider) {
      throw new Error(
        "Phantom wallet was not detected. Open Sonativa inside Phantom or use a browser with Phantom installed."
      );
    }

    state.provider = provider;

    try {

      const response = await provider.connect();

      state.connected = true;

      state.publicKey =
        response?.publicKey ||
        provider.publicKey ||
        null;

      if (!state.publicKey) {
        throw new Error(
          "Wallet connected but no public address was returned."
        );
      }

      saveSession();

      emit();

      return {
        connected: true,
        address: getAddress(),
        publicKey: state.publicKey
      };

    } catch (error) {

      console.error(
        "[Sonativa Wallet] Connection failed:",
        error
      );

      throw error;
    }
  }

  async function disconnect() {

    const provider =
      state.provider || getProvider();

    try {

      if (provider?.disconnect) {
        await provider.disconnect();
      }

    } catch (error) {

      console.warn(
        "[Sonativa Wallet] Disconnect warning:",
        error
      );

    } finally {

      clearSession();

      state.connected = false;
      state.publicKey = null;
      state.provider = null;

      emit();
    }
  }

  async function reconnect() {

    const provider = getProvider();

    if (!provider) {
      return false;
    }

    state.provider = provider;

    try {

      const response =
        await provider.connect({
          onlyIfTrusted: true
        });

      state.connected = true;

      state.publicKey =
        response?.publicKey ||
        provider.publicKey ||
        null;

      if (state.publicKey) {
        saveSession();
        emit();
        return true;
      }

    } catch (error) {

      console.info(
        "[Sonativa Wallet] Silent reconnect unavailable."
      );

    }

    return false;
  }

  function saveSession() {

    try {

      localStorage.setItem(
        "sonativa_wallet_connected",
        "true"
      );

      localStorage.setItem(
        "sonativa_wallet_address",
        getAddress() || ""
      );

    } catch (error) {

      console.warn(
        "[Sonativa Wallet] Local storage unavailable."
      );
    }
  }

  function clearSession() {

    try {

      localStorage.removeItem(
        "sonativa_wallet_connected"
      );

      localStorage.removeItem(
        "sonativa_wallet_address"
      );

    } catch (error) {

      console.warn(
        "[Sonativa Wallet] Could not clear session."
      );
    }
  }

  function isConnected() {
    return Boolean(
      state.connected &&
      getAddress()
    );
  }

  function getWalletAddress() {
    return getAddress();
  }

  function getNetwork() {
    return state.network;
  }

  function onChange(callback) {

    if (typeof callback !== "function") {
      return () => {};
    }

    listeners.add(callback);

    return () => {
      listeners.delete(callback);
    };
  }

  function updateUI() {

    const address = getAddress();

    document
      .querySelectorAll("[data-wallet-address]")
      .forEach((element) => {

        element.textContent =
          address
            ? `${address.slice(0, 4)}...${address.slice(-4)}`
            : "Not connected";
      });

    document
      .querySelectorAll("[data-wallet-full-address]")
      .forEach((element) => {

        element.textContent =
          address || "Not connected";
      });

    document
      .querySelectorAll("[data-wallet-status]")
      .forEach((element) => {

        element.textContent =
          isConnected()
            ? "Connected"
            : "Not connected";

        element.dataset.connected =
          isConnected()
            ? "true"
            : "false";
      });

    document
      .querySelectorAll("[data-wallet-connect]")
      .forEach((button) => {

        button.textContent =
          isConnected()
            ? "Connected"
            : "Connect Phantom";

        button.disabled =
          false;
      });

    document
      .querySelectorAll("[data-wallet-disconnect]")
      .forEach((button) => {

        button.style.display =
          isConnected()
            ? ""
            : "none";
      });
  }

  function attachProviderEvents() {

    const provider =
      state.provider || getProvider();

    if (!provider) return;

    state.provider = provider;

    if (
      typeof provider.on === "function"
    ) {

      provider.on(
        "connect",
        (publicKey) => {

          state.connected = true;

          state.publicKey =
            publicKey ||
            provider.publicKey ||
            null;

          saveSession();
          emit();
          updateUI();
        }
      );

      provider.on(
        "disconnect",
        () => {

          state.connected = false;
          state.publicKey = null;
          state.provider = null;

          clearSession();
          emit();
          updateUI();
        }
      );

      provider.on(
        "accountChanged",
        (publicKey) => {

          if (!publicKey) {

            state.connected = false;
            state.publicKey = null;

            clearSession();

          } else {

            state.connected = true;
            state.publicKey = publicKey;

            saveSession();
          }

          emit();
          updateUI();
        }
      );
    }
  }

  async function initialize() {

    const provider = getProvider();

    if (!provider) {

      updateUI();

      return {
        detected: false,
        connected: false
      };
    }

    state.provider = provider;

    attachProviderEvents();

    const silentlyConnected =
      await reconnect();

    updateUI();

    return {
      detected: true,
      connected: silentlyConnected,
      address: getAddress()
    };
  }

  function bindButtons() {

    document
      .querySelectorAll("[data-wallet-connect]")
      .forEach((button) => {

        if (
          button.dataset.walletBound === "true"
        ) {
          return;
        }

        button.dataset.walletBound = "true";

        button.addEventListener(
          "click",
          async () => {

            const originalText =
              button.textContent;

            button.disabled = true;
            button.textContent = "Connecting...";

            try {

              await connect();

            } catch (error) {

              console.error(
                "[Sonativa Wallet]",
                error
              );

              showError(
                error.message ||
                "Unable to connect wallet."
              );

            } finally {

              button.disabled = false;

              if (!isConnected()) {
                button.textContent =
                  originalText ||
                  "Connect Phantom";
              }

              updateUI();
            }
          }
        );
      });

    document
      .querySelectorAll("[data-wallet-disconnect]")
      .forEach((button) => {

        if (
          button.dataset.walletBound === "true"
        ) {
          return;
        }

        button.dataset.walletBound = "true";

        button.addEventListener(
          "click",
          async () => {

            await disconnect();
            updateUI();
          }
        );
      });
  }

  function showError(message) {

    const existing =
      document.getElementById(
        "sonativaWalletError"
      );

    if (existing) {
      existing.remove();
    }

    const box =
      document.createElement("div");

    box.id =
      "sonativaWalletError";

    box.textContent =
      message;

    Object.assign(
      box.style,
      {
        position: "fixed",
        left: "20px",
        right: "20px",
        bottom: "20px",
        zIndex: "999999",
        padding: "14px 16px",
        border: "1px solid #553333",
        borderRadius: "10px",
        background: "#160b0b",
        color: "#ffb4b4",
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        boxShadow: "0 15px 40px rgba(0,0,0,.35)"
      }
    );

    document.body.appendChild(box);

    setTimeout(() => {

      box.remove();

    }, 6000);
  }

  return {
    connect,
    disconnect,
    reconnect,
    initialize,
    isConnected,
    getAddress: getWalletAddress,
    getNetwork,
    getProvider,
    onChange,
    updateUI,
    bindButtons,
    state
  };

})();

window.SonativaWallet =
  SonativaWallet;

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await SonativaWallet.initialize();

    SonativaWallet.bindButtons();

    SonativaWallet.updateUI();

  }
);
