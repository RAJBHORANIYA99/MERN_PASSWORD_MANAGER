// Secure client-side check for pwned passwords using Have I Been Pwned API (k-Anonymity)

const sha1 = async (str) => {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await window.crypto.subtle.digest("SHA-1", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

/**
 * Checks a password against Have I Been Pwned API using k-Anonymity
 * @param {string} password - Plain text password to check
 * @returns {Promise<number>} Number of times pwned (0 if safe)
 */
export const checkPasswordBreach = async (password) => {
  if (!password || password.length < 1) return 0;
  try {
    const fullHash = await sha1(password);
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      return 0;
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [lineSuffix, countStr] = line.trim().split(":");
      if (lineSuffix === suffix) {
        return parseInt(countStr, 10);
      }
    }
    return 0;
  } catch (error) {
    console.error("Have I Been Pwned check failed:", error);
    return 0;
  }
};
