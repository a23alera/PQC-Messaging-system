// Importerar Node.js kryptobibliotek
const crypto = require("node:crypto");



// 1. Nyckelgenerering för (Ed25519) en private och en public
function generateEd25519Keypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  return { publicKey, privateKey };
}

// 2. Signering, digital signature av payload med hjälp av private key
function signEd25519(privateKey, payload) {
  const signature = crypto.sign(
    // MÅSTE vara null för Ed25519, ed25519 hashar internt
    null, 

    // payload är json string format, utf8 är standad 
    Buffer.from(payload, "utf8"),
    privateKey
  );

  // Vi skickar signaturen som Base64 
  return signature.toString("base64");
}

// 3. Verifiering
// tar emot publickey för verifering, tar emot payload (meddelandet) och signaturen för textformat
function verifyEd25519(publicKey, payload, signatureBase64) {
// anropar node.js crypto api, kontrollerar digitala signaturer
  return crypto.verify(
    // MÅSTE vara null för Ed25519
    null,

    // konverterar text till bytes
    Buffer.from(payload, "utf8"),

    // Skickar publick key. 
    publicKey,

    // Gör till binär data igen. 
    Buffer.from(signatureBase64, "base64")
  );
}

module.exports = {
  generateEd25519Keypair,
  signEd25519,
  verifyEd25519,
};
