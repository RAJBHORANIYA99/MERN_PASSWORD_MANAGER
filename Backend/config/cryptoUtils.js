import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * Derives a secure 32-byte key from JWT_SECRET or ENCRYPTION_KEY.
 */
const getEncryptionKey = () => {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "fallback_default_secret_key_32_chars_long";
    return crypto.scryptSync(secret, "password-manager-salt-salt", 32);
};

/**
 * Encrypts plain text to a string format: iv:authTag:ciphertext
 */
export const encrypt = (text) => {
    if (!text) return "";
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        
        const authTag = cipher.getAuthTag().toString("hex");
        
        return `${iv.toString("hex")}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Encryption failed");
    }
};

/**
 * Decrypts a string format iv:authTag:ciphertext back to plain text.
 * Falls back to returning the original string if not encrypted.
 */
export const decrypt = (cipherText) => {
    if (!cipherText) return "";
    
    const parts = cipherText.split(":");
    if (parts.length !== 3) {
        // Fallback for legacy plain text passwords
        return cipherText;
    }
    
    try {
        const [ivHex, authTagHex, encryptedText] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");
        
        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        // Fallback to original text if decryption fails
        return cipherText;
    }
};
