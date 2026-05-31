import crypto from "crypto";

// AES-256-GCM needs a 32-byte key. We derive it from the JWT_SECRET env var.
const ALGORITHM = "aes-256-gcm";
const KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET ?? "fallback-secret")
  .digest(); // 32 bytes

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a single string: iv:authTag:ciphertext (all hex-encoded).
 */
export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

/**
 * Decrypts a string produced by encrypt().
 */
export const decrypt = (ciphertext: string): string => {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
