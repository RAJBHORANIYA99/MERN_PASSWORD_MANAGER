// Client-Side Zero-Knowledge Encryption/Decryption for Vault backups using Web Crypto API

const getPBKDF2Key = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// Converts ArrayBuffer to Hex String
const bufToHex = (buf) => {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

// Converts Hex String to Uint8Array/ArrayBuffer
const hexToBuf = (hex) => {
  if (!hex) return new Uint8Array(0);
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
};

/**
 * Encrypts vault JSON plaintext using AES-GCM-256 derived from master password
 * @param {string} password - Master Backup Password
 * @param {string} plaintextJson - JSON string of vault credentials
 * @returns {Promise<{salt: string, iv: string, ciphertext: string}>}
 */
export const encryptBackup = async (password, plaintextJson) => {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await getPBKDF2Key(password, salt);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(plaintextJson)
  );

  return {
    salt: bufToHex(salt),
    iv: bufToHex(iv),
    ciphertext: bufToHex(ciphertextBuffer)
  };
};

/**
 * Decrypts encrypted backup payload using AES-GCM-256 derived from master password
 * @param {string} password - Master Backup Password
 * @param {{salt: string, iv: string, ciphertext: string}} backupObj - Encrypted backup details
 * @returns {Promise<string>} Plaintext JSON string
 */
export const decryptBackup = async (password, backupObj) => {
  const salt = hexToBuf(backupObj.salt);
  const iv = hexToBuf(backupObj.iv);
  const ciphertext = hexToBuf(backupObj.ciphertext);

  const key = await getPBKDF2Key(password, salt);
  const dec = new TextDecoder();

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  return dec.decode(decryptedBuffer);
};
