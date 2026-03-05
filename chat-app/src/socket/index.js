const { getSigner } = require("../security/getSigner");
const fs = require("fs");
const path = require("path");

//Metrics are used to store the benchmark data
const metrics = {
  signTimes: [],
  verifyTimes: [],
  signatureSizes: [],
  algorithm: null,
};

//Fetches the chosen signature algorithm
const signer = getSigner();
metrics.algorithm = signer.name;

const keyStore = new Map();

async function maybeAwait(value) {
  return value && typeof value.then === "function" ? await value : value;
}
function getOrCreateKeysForUser(userId) {
  const keyId = `${signer.name}:${userId}`;

  if (!keyStore.has(keyId)) {
    keyStore.set(keyId, signer.generateKeypair());
  }

  return keyStore.get(keyId);
}

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

function signatureSizeInBytes(signature) {
  if (typeof signature === "string") {
    return Buffer.from(signature, "base64").length;
  }
  return Buffer.from(signature).length;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeFilename(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function saveRunToJson({ algorithm, iterations, messageSizeBytes, samples }) {
  const resultsDir = path.join(__dirname, "..", "results");
  ensureDir(resultsDir);

  const filePath = path.join(resultsDir, `${safeFilename(algorithm)}_latest.json`);

  const payload = {
    meta: {
      algorithm,
      iterations,
      messageSizeBytes,
      startedAt: new Date().toISOString(),
    },
    samples,
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  return filePath;
}

module.exports = (io, socket) => {
  socket.on("send-message", async (data) => {
    const { sender, receiver, message } = data;

    const payload = JSON.stringify({ sender, receiver, message });

    const rawKeys = await maybeAwait(getOrCreateKeysForUser(sender));
    const { publicKey, secretKey } = normalizeKeys(rawKeys);

    const payloadMessageBytes = Buffer.from(message, "base64");
    const payloadSizeBytes = payloadMessageBytes.length;

    //Reset metric values för next benchmark run
    metrics.signTimes = [];
    metrics.verifyTimes = [];
    metrics.signatureSizes = [];
    metrics.algorithm = signer.name;

    const iterations = data.benchmark?.iterations ?? 10;
    const samples = [];

    for (let i = 1; i <= iterations; i++) {
      const signStart = process.hrtime.bigint();

      let signature;
      try {
        const messageBytes = Buffer.from(payload, "utf8");
        signature = await maybeAwait(signer.sign(messageBytes, secretKey));
      } catch (err) {
        signature = await maybeAwait(signer.sign(payload, secretKey));
      }

      const signEnd = process.hrtime.bigint();


      const signTimeMs = Number(signEnd - signStart) / 1_000_000;
      const sigSize = signatureSizeInBytes(signature);
      const msgSize = Buffer.byteLength(payload, "utf8");

      const verifyStart = process.hrtime.bigint();


      let isValid;
      try {
        const messageBytes = Buffer.from(payload, "utf8");
        isValid = await maybeAwait(signer.verify(messageBytes, signature, publicKey));
      } catch (err) {
        isValid = await maybeAwait(signer.verify(publicKey, payload, signature));
      }

      const verifyEnd = process.hrtime.bigint();
      const verifyTimeMs = Number(verifyEnd - verifyStart) / 1_000_000;

      //Store locally for this run
      samples.push({
        i,
        signTimeMs,
        verifyTimeMs,
        payloadSizeBytes,
        valid: isValid,
      });

      //Store globally for this run
      metrics.signTimes.push(signTimeMs);
      metrics.verifyTimes.push(verifyTimeMs);
      metrics.signatureSizes.push(sigSize);
    }

    const messageSizeBytes = payloadSizeBytes;

    const savedPath = saveRunToJson({
      algorithm: signer.name,
      iterations,
      messageSizeBytes,
      samples,
    });

    socket.emit("benchmark-result", {
      algorithm: signer.name,
      iterations,
      savedPath,
      samples,
      last: samples[samples.length - 1],
    });

  });
};

module.exports.metrics = metrics;