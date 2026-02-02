const crypto = require("node:crypto");

const metrics = {
  signTimes: [],
  verifyTimes: [],
  signatureSizes: [],
};

const {
  generateEd25519Keypair,
  signEd25519,
  verifyEd25519,
} = require("../security/signature");

const keyStore = new Map();

function getOrCreateKeysForUser(userId) {
  if (!keyStore.has(userId)) {
    keyStore.set(userId, generateEd25519Keypair());
  }
  return keyStore.get(userId);
}

module.exports = (io, socket) => {
  socket.on("send-message", (data) => {
    const { sender, receiver, message } = data;
    const payload = JSON.stringify({ sender, receiver, message });

    const { privateKey, publicKey } = getOrCreateKeysForUser(sender);

    const signStart = process.hrtime.bigint();
    const signature = signEd25519(privateKey, payload);
    const signEnd = process.hrtime.bigint();

    const signTimeNs = Number(signEnd - signStart);
    metrics.signTimes.push(signTimeNs);
    metrics.signatureSizes.push(
      Buffer.from(signature, "base64").length
    );

    const verifyStart = process.hrtime.bigint();
    const isValid = verifyEd25519(publicKey, payload, signature);
    const verifyEnd = process.hrtime.bigint();

    const verifyTimeNs = Number(verifyEnd - verifyStart);
    metrics.verifyTimes.push(verifyTimeNs);

    socket.emit("benchmark-result", {
      valid: isValid,
      signTimeNs,
      verifyTimeNs,
      signatureSize: Buffer.from(signature, "base64").length,
    });
  });
};

module.exports.metrics = metrics;
