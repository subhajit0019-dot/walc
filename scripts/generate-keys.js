/**
 * Ed25519 Keypair Generator for Cursed Client Panel & C++ Client
 * Run with: node scripts/generate-keys.js
 */
const crypto = require("crypto");

function generateEd25519KeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");

  // Export raw 32-byte buffers
  const privKeyDer = privateKey.export({ format: "der", type: "pkcs8" });
  // In PKCS8 for Ed25519, the last 32 bytes of the DER is the raw seed/private key wrapped in an octet string
  const rawPrivate = privKeyDer.subarray(privKeyDer.length - 32);

  const pubKeyDer = publicKey.export({ format: "der", type: "spki" });
  // In SPKI for Ed25519, the last 32 bytes are the raw public key
  const rawPublic = pubKeyDer.subarray(pubKeyDer.length - 32);

  const privateHex = rawPrivate.toString("hex");
  const publicHex = rawPublic.toString("hex");

  console.log("=================================================================");
  console.log("             ED25519 CRYPTOGRAPHIC KEYPAIR GENERATED             ");
  console.log("=================================================================");
  console.log("\n[1] Server Vercel Environment Variables (.env.local):");
  console.log(`ED25519_PRIVATE_KEY="${privateHex}"`);
  console.log(`ED25519_PUBLIC_KEY="${publicHex}"`);

  console.log("\n[2] C++ Client Public Verification Key Format (ClientConfig.h / .cpp):");
  const byteArr = [];
  for (let i = 0; i < rawPublic.length; i++) {
    byteArr.push(`0x${rawPublic[i].toString(16).padStart(2, "0").toUpperCase()}`);
  }
  console.log(`const uint8_t SERVER_ED25519_PUBLIC_KEY[32] = {\n    ${byteArr.join(", ")}\n};`);
  console.log(`const char* SERVER_PUBLIC_KEY_HEX = "${publicHex}";`);
  console.log("=================================================================\n");
}

generateEd25519KeyPair();
