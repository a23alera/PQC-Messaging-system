/*
  ==========================================
  ED25519 ADAPTER
  ==========================================

  Adapter som kopplar signer-factory till Node.js inbyggda
  Ed25519-implementation (OpenSSL via crypto-modulen).
*/

const crypto = require("crypto");

module.exports = {

  // Identifierar algoritmen i signer-factory och metrics
  name: "Ed25519",

  generateKeypair() {

    // Genererar Ed25519-nyckelpar via Node/OpenSSL
    const { publicKey, privateKey } =
      crypto.generateKeyPairSync("ed25519");

    // Anpassar namnet så det matchar vårt gemensamma interface
    return { publicKey, secretKey: privateKey };
  },

  sign(messageBytes, secretKey) {

    // Säkerställer att meddelandet är en Buffer
    const msg = Buffer.isBuffer(messageBytes)
      ? messageBytes
      : Buffer.from(messageBytes);

    // Ed25519 använder null som digest (hash ingår i algoritmen)
    // Returnerar en 64-byte signatur
    return crypto.sign(null, msg, secretKey);
  },

  verify(messageBytes, signatureBytes, publicKey) {

    // Säkerställer att meddelandet är en Buffer
    const msg = Buffer.isBuffer(messageBytes)
      ? messageBytes
      : Buffer.from(messageBytes);

    // Säkerställer att signaturen är en Buffer
    const sig = Buffer.isBuffer(signatureBytes)
      ? signatureBytes
      : Buffer.from(signatureBytes);

    // Verifierar signaturen via Node/OpenSSL
    return crypto.verify(null, msg, publicKey, sig);
  },
};