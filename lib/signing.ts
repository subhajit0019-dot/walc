import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import crypto from "crypto";
import { bytesToHex, hexToBytes } from "./utils";

// Configure ed25519 sha512 synchronous hasher
if (sha512) {
  ed.etc.sha512Sync = (...m: Uint8Array[]) => {
    const h = sha512.create();
    for (const msg of m) h.update(msg);
    return h.digest();
  };
} else {
  ed.etc.sha512Sync = (...m: Uint8Array[]) => {
    const hash = crypto.createHash("sha512");
    for (const msg of m) hash.update(msg);
    return new Uint8Array(hash.digest());
  };
}

/**
 * Signs a canonical string payload using the Ed25519 private key.
 * Returns a 64-byte signature hex encoded.
 */
export async function signPayload(message: string, privateKeyHex: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const privKeyBytes = hexToBytes(privateKeyHex);
  const signatureBytes = await ed.signAsync(messageBytes, privKeyBytes);
  return bytesToHex(signatureBytes);
}

/**
 * Verifies an Ed25519 signature against the message and public key.
 */
export async function verifySignature(
  signatureHex: string,
  message: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const signatureBytes = hexToBytes(signatureHex);
    const messageBytes = new TextEncoder().encode(message);
    const pubKeyBytes = hexToBytes(publicKeyHex);
    return await ed.verifyAsync(signatureBytes, messageBytes, pubKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Computes an HMAC-SHA256 signature for client requests.
 */
export function computeHmacSha256(data: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
}
