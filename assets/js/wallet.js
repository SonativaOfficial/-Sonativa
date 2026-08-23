/* =========================================================
   SONATIVA — SOLANA WALLET CORE
   File: assets/js/wallet.js
   Version: 2026
   ========================================================= */

const WalletConfig = {
  network: "mainnet-beta",

  clusterUrl:
    "https://api.mainnet-beta.solana.com",

  commitment: "confirmed",

  supportedWallets: [
    "Phantom"
  ]
};


/* =========================================================
   STATE
========================================================= */

let walletProvider = null;
let walletAddress = null;
let listeners = [];


/* =========================================================
   PROVIDER DETECTION
========================================================= */

function getProvider() {

  if (
    window.phantom?.solana?.isPhantom
  ) {

    return window.phantom.solana;

  }


  if (
    window.solana?.isPhantom
  ) {

    return window.solana;

  }


  return null;

}


/* =========================================================
   PHANTOM DETECTION
========================================================= */

function isPhantomInstalled() {

  return Boolean(
    getProvider()
  );

}


/* =========================================================
   CONNECT
========================================================= */

async function connect(
  options = {}
) {

  const provider =
    getProvider();


  if (!provider) {

    const error =
      new Error(
        "Phantom wallet was not detected. Open Sonativa inside Phantom or install Phantom."
      );

    error.code =
      "PHANTOM_NOT_FOUND";

    throw error;

  }


  try {

    walletProvider =
      provider;


    const response =
      await provider.connect(
        {
          onlyIfTrusted:
            options.onlyIfTrusted === true
        }
      );


    walletAddress =
      response?.publicKey?.toString() ||
      provider.publicKey?.toString() ||
      null;


    notifyListeners();


    return {
      connected: true,
      address:
        walletAddress,
      provider
    };


  } catch (error) {

    walletProvider =
      null;

    walletAddress =
      null;


    throw normalizeWalletError(
      error
    );

  }

}


/* =========================================================
   SILENT CONNECT
========================================================= */

async function autoConnect() {

  const provider =
    getProvider();


  if (!provider) {
    return false;
  }


  try {

    walletProvider =
      provider;


    if (
      provider.publicKey
    ) {

      walletAddress =
        provider.publicKey.toString();

      notifyListeners();

      return true;

    }


    const result =
      await provider.connect({
        onlyIfTrusted: true
      });


    walletAddress =
      result?.publicKey?.toString() ||
      provider.publicKey?.toString() ||
      null;


    notifyListeners();


    return Boolean(
      walletAddress
    );


  } catch {

    walletProvider =
      null;

    walletAddress =
      null;

    return false;

  }

}


/* =========================================================
   DISCONNECT
========================================================= */

async function disconnect() {

  try {

    const provider =
      walletProvider ||
      getProvider();


    if (
      provider &&
      typeof provider.disconnect ===
        "function"
    ) {

      await provider.disconnect();

    }

  } catch (error) {

    console.warn(
      "[Sonativa Wallet] Disconnect:",
      error
    );

  } finally {

    walletProvider =
      null;

    walletAddress =
      null;

    notifyListeners();

  }

}


/* =========================================================
   STATE
========================================================= */

function isConnected() {

  const provider =
    walletProvider ||
    getProvider();


  return Boolean(
    provider?.publicKey ||
    walletAddress
  );

}


function getAddress() {

  const provider =
    walletProvider ||
    getProvider();


  return (
    walletAddress ||
    provider?.publicKey?.toString() ||
    null
  );

}


function getProviderInstance() {

  return (
    walletProvider ||
    getProvider()
  );

}


/* =========================================================
   ADDRESS FORMATTER
========================================================= */

function shortenAddress(
  address = getAddress(),
  start = 4,
  end = 4
) {

  if (!address) {
    return "Not connected";
  }


  if (
    address.length <=
    start + end
  ) {

    return address;

  }


  return `${address.slice(
    0,
    start
  )}...${address.slice(
    -end
  )}`;

}


/* =========================================================
   CHANGE EVENTS
========================================================= */

function notifyListeners() {

  const state = {
    connected:
      isConnected(),
    address:
      getAddress(),
    provider:
      walletProvider
  };


  listeners.forEach(
    (listener) => {

      try {

        listener(
          state
        );

      } catch (error) {

        console.error(
          "[Sonativa Wallet] Listener:",
          error
        );

      }

    }
  );


  window.dispatchEvent(
    new CustomEvent(
      "sonativa:wallet",
      {
        detail:
          state
      }
    )
  );

}


/* =========================================================
   SUBSCRIBE
========================================================= */

function onChange(
  callback
) {

  if (
    typeof callback !==
    "function"
  ) {

    return () => {};

  }


  listeners.push(
    callback
  );


  return () => {

    listeners =
      listeners.filter(
        (item) =>
          item !== callback
      );

  };

}


/* =========================================================
   PHANTOM EVENTS
========================================================= */

function bindProviderEvents() {

  const provider =
    getProvider();


  if (!provider) {
    return;
  }


  provider.on(
    "connect",
    (publicKey) => {

      walletProvider =
        provider;

      walletAddress =
        publicKey?.toString() ||
        provider.publicKey?.toString() ||
        null;

      notifyListeners();

    }
  );


  provider.on(
    "disconnect",
    () => {

      walletProvider =
        null;

      walletAddress =
        null;

      notifyListeners();

    }
  );


  provider.on(
    "accountChanged",
    (publicKey) => {

      if (!publicKey) {

        walletAddress =
          null;

        notifyListeners();

        return;

      }


      walletAddress =
        publicKey.toString();

      walletProvider =
        provider;

      notifyListeners();

    }
  );

}


/* =========================================================
   SIGN MESSAGE
========================================================= */

async function signMessage(
  message
) {

  const provider =
    getProviderInstance();


  if (!provider) {

    throw walletError(
      "PHANTOM_NOT_FOUND",
      "Phantom wallet was not detected."
    );

  }


  if (
    !provider.publicKey
  ) {

    await connect();

  }


  const encoded =
    typeof message ===
      "string"
      ? new TextEncoder().encode(
          message
        )
      : message;


  if (
    !encoded ||
    !encoded.length
  ) {

    throw new Error(
      "Message cannot be empty."
    );

  }


  if (
    typeof provider.signMessage !==
      "function"
  ) {

    throw new Error(
      "This Phantom wallet does not support message signing."
    );

  }


  try {

    const result =
      await provider.signMessage(
        encoded,
        "utf8"
      );


    return {
      signature:
        result?.signature ||
        null,

      publicKey:
        result?.publicKey?.toString() ||
        provider.publicKey?.toString() ||
        null

    };

  } catch (error) {

    throw normalizeWalletError(
      error
    );

  }

}


/* =========================================================
   SIGN TRANSACTION
========================================================= */

async function signTransaction(
  transaction
) {

  const provider =
    getProviderInstance();


  if (!provider) {

    throw walletError(
      "PHANTOM_NOT_FOUND",
      "Phantom wallet was not detected."
    );

  }


  if (
    !transaction
  ) {

    throw new Error(
      "Transaction is required."
    );

  }


  if (
    !provider.publicKey
  ) {

    await connect();

  }


  if (
    typeof provider.signTransaction !==
      "function"
  ) {

    throw new Error(
      "Phantom does not support transaction signing."
    );

  }


  try {

    return await provider.signTransaction(
      transaction
    );

  } catch (error) {

    throw normalizeWalletError(
      error
    );

  }

}


/* =========================================================
   SIGN AND SEND TRANSACTION
========================================================= */

async function signAndSendTransaction(
  transaction,
  options = {}
) {

  const provider =
    getProviderInstance();


  if (!provider) {

    throw walletError(
      "PHANTOM_NOT_FOUND",
      "Phantom wallet was not detected."
    );

  }


  if (
    !transaction
  ) {

    throw new Error(
      "Transaction is required."
    );

  }


  if (
    !provider.publicKey
  ) {

    await connect();

  }


  if (
    typeof provider.signAndSendTransaction !==
      "function"
  ) {

    throw new Error(
      "Phantom does not support transaction sending."
    );

  }


  try {

    const result =
      await provider.signAndSendTransaction(
        transaction,
        {
          preflightCommitment:
            options.preflightCommitment ||
            WalletConfig.commitment
        }
      );


    return {
      signature:
        typeof result === "string"
          ? result
          : result?.signature ||
            null
    };

  } catch (error) {

    throw normalizeWalletError(
      error
    );

  }

}


/* =========================================================
   SEND SOL
   Requires @solana/web3.js on the page.
========================================================= */

async function sendSOL(
  recipient,
  lamports,
  options = {}
) {

  if (
    !recipient
  ) {

    throw new Error(
      "Recipient address is required."
    );

  }


  if (
    !Number.isInteger(
      lamports
    ) ||
    lamports <= 0
  ) {

    throw new Error(
      "Amount must be a positive integer in lamports."
    );

  }


  const web3 =
    window.solanaWeb3;


  if (!web3) {

    throw new Error(
      "Solana Web3 library is not loaded."
    );

  }


  const provider =
    getProviderInstance();


  if (!provider) {

    throw walletError(
      "PHANTOM_NOT_FOUND",
      "Phantom wallet was not detected."
    );

  }


  if (
    !provider.publicKey
  ) {

    await connect();

  }


  const connection =
    new web3.Connection(
      options.rpcUrl ||
      WalletConfig.clusterUrl,
      WalletConfig.commitment
    );


  const transaction =
    new web3.Transaction();


  transaction.add(
    web3.SystemProgram.transfer(
      {
        fromPubkey:
          provider.publicKey,

        toPubkey:
          new web3.PublicKey(
            recipient
          ),

        lamports
      }
    )
  );


  transaction.feePayer =
    provider.publicKey;


  const latestBlockhash =
    await connection.getLatestBlockhash(
      WalletConfig.commitment
    );


  transaction.recentBlockhash =
    latestBlockhash.blockhash;


  const signed =
    await signTransaction(
      transaction
    );


  const signature =
    await connection.sendRawTransaction(
      signed.serialize(),
      {
        skipPreflight:
          false
      }
    );


  if (
    options.confirm !== false
  ) {

    await connection.confirmTransaction(
      {
        signature,
        blockhash:
          latestBlockhash.blockhash,
        lastValidBlockHeight:
          latestBlockhash.lastValidBlockHeight
      },
      WalletConfig.commitment
    );

  }


  return {
    signature,
    explorer:
      `https://solscan.io/tx/${signature}`
  };

}


/* =========================================================
   ERROR HELPERS
========================================================= */

function walletError(
  code,
  message
) {

  const error =
    new Error(
      message
    );

  error.code =
    code;

  return error;

}


function normalizeWalletError(
  error
) {

  if (!error) {

    return new Error(
      "Wallet operation failed."
    );

  }


  const code =
    error.code;


  if (
    code === 4001 ||
    code === "4001"
  ) {

    return walletError(
      "USER_REJECTED",
      "Transaction or wallet request was rejected."
    );

  }


  if (
    code === -32002 ||
    code === "-32002"
  ) {

    return walletError(
      "REQUEST_PENDING",
      "A Phantom wallet request is already pending."
    );

  }


  return error;

}


/* =========================================================
   NETWORK INFO
========================================================= */

function getNetwork() {

  return {
    network:
      WalletConfig.network,

    cluster:
      WalletConfig.clusterUrl,

    commitment:
      WalletConfig.commitment
  };

}


/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

  bindProviderEvents();

  autoConnect()
    .catch(
      () => {}
    );

}


/* =========================================================
   PUBLIC API
========================================================= */

export const SonativaWallet = {

  connect,

  autoConnect,

  disconnect,

  isConnected,

  getAddress,

  getProvider:
    getProviderInstance,

  isPhantomInstalled,

  shortenAddress,

  onChange,

  signMessage,

  signTransaction,

  signAndSendTransaction,

  sendSOL,

  getNetwork,

  config:
    WalletConfig

};


window.SonativaWallet =
  SonativaWallet;


/* =========================================================
   START
========================================================= */

initialize();


console.info(
  "Sonativa Wallet initialized."
);
