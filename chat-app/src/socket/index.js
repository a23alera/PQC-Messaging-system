// Importerar signer-factory som väljer algoritm (Ed25519 / SLH-DSA)
const { getSigner } = require("../security/getSigner");

/*
  Metrics-objekt används för att lagra
  benchmark-data som senare exponeras via /metrics.
*/
const metrics = {
  signTimes: [],
  verifyTimes: [],
  signatureSizes: [],
  algorithm: null,
};

// Hämtar vald signaturalgoritm baserat på SIG_ALG
const signer = getSigner();
metrics.algorithm = signer.name;

/*
  In-memory key store.
  Sparar genererade nyckelpar per användare.
*/
const keyStore = new Map();

/*
  Hjälpfunktion: hantera både sync och async returnvärden.
*/
async function maybeAwait(value) {
  return value && typeof value.then === "function" ? await value : value;
}

/*
  Skapar eller hämtar nycklar för en användare.

  Viktigt:
  - Om generateKeypair() är async (SLH-DSA) lagrar vi Promise i map:en.
  - Om den är sync (Ed25519) lagrar vi objektet direkt.
*/
function getOrCreateKeysForUser(userId) {
  const keyId = `${signer.name}:${userId}`;

  if (!keyStore.has(keyId)) {
    keyStore.set(keyId, signer.generateKeypair());
  }

  return keyStore.get(keyId);
}

/*
  Tolkar nyckelobjektet oavsett om det heter:
  - { publicKey, secretKey } (vår nya standard)
  - { publicKey, privateKey } (din gamla Ed25519-stil)
*/
function normalizeKeys(keys) {
  const publicKey = keys.publicKey;
  const secretKey = keys.secretKey || keys.privateKey;

  if (!publicKey || !secretKey) {
    throw new Error(
      `Nyckelobjekt saknar publicKey/secretKey (eller privateKey). Fick: ${Object.keys(keys).join(", ")}`
    );
  }

  return { publicKey, secretKey };
}

/*
  Tolkar signatur oavsett format:
  - Uint8Array/Buffer (SLH-DSA)
  - base64-string (Ed25519 om du gör så idag)
*/
function signatureSizeInBytes(signature) {
  if (typeof signature === "string") {
    return Buffer.from(signature, "base64").length;
  }
  return Buffer.from(signature).length;
}

module.exports = (io, socket) => {
  socket.on("send-message", async (data) => {
    const { sender, receiver, message } = data;

    const payload = JSON.stringify({ sender, receiver, message });

    const rawKeys = await maybeAwait(getOrCreateKeysForUser(sender));
    const { publicKey, secretKey } = normalizeKeys(rawKeys);

    const signStart = process.hrtime.bigint();

    /*
      Vi försöker först med bytes (funkar för SLH-DSA).
      Om din Ed25519 vill ha string kan den ändå fungera,
      men om den inte gör det fångar vi och provar med payload-string.
    */
    let signature;
    try {
      const messageBytes = Buffer.from(payload, "utf8");
      signature = await maybeAwait(signer.sign(messageBytes, secretKey));
    } catch (err) {
      signature = await maybeAwait(signer.sign(payload, secretKey));
    }

    const signEnd = process.hrtime.bigint();
    const signTimeNs = Number(signEnd - signStart);
    metrics.signTimes.push(signTimeNs);

    const sigSize = signatureSizeInBytes(signature);
    metrics.signatureSizes.push(sigSize);

    const verifyStart = process.hrtime.bigint();

    let isValid;
    try {
      const messageBytes = Buffer.from(payload, "utf8");
      isValid = await maybeAwait(signer.verify(messageBytes, signature, publicKey));
    } catch (err) {
      isValid = await maybeAwait(signer.verify(publicKey, payload, signature));
    }

    const verifyEnd = process.hrtime.bigint();
    const verifyTimeNs = Number(verifyEnd - verifyStart);
    metrics.verifyTimes.push(verifyTimeNs);

    socket.emit("benchmark-result", {
      algorithm: signer.name,
      valid: isValid,
      signTimeNs,
      verifyTimeNs,
      signatureSize: sigSize,
    });
  });
};

module.exports.metrics = metrics;