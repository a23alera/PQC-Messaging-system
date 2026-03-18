const { getSigner } = require("../security/getSigner");
const fs = require("fs");
const path = require("path");
const { stringify } = require('csv-stringify');


function yieldToEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

function getProcessMemorySnapshot() {
  const mem = process.memoryUsage();

  return {
    rssMB: Number((mem.rss / 1024 / 1024).toFixed(3)),
    heapTotalMB: Number((mem.heapTotal / 1024 / 1024).toFixed(3)),
    heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(3)),
    externalMB: Number((mem.external / 1024 / 1024).toFixed(3)),
    arrayBuffersMB: Number((((mem.arrayBuffers || 0)) / 1024 / 1024).toFixed(3)),
  };
}

function getMemoryDelta(before, after) {
  return {
    rssMB: Number((after.rssMB - before.rssMB).toFixed(3)),
    heapTotalMB: Number((after.heapTotalMB - before.heapTotalMB).toFixed(3)),
    heapUsedMB: Number((after.heapUsedMB - before.heapUsedMB).toFixed(3)),
    externalMB: Number((after.externalMB - before.externalMB).toFixed(3)),
    arrayBuffersMB: Number((after.arrayBuffersMB - before.arrayBuffersMB).toFixed(3)),
  };
}

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

function saveRunToJson({ algorithm, iterations, messageSizeBytes, samples, memoryBefore,
  memoryAfter,
  memoryDelta,
  memoryStatus, }) {
  return new Promise((resolve, reject) => {
    const resultsDir = path.join(__dirname, "..", "results");
    ensureDir(resultsDir);

    const filePathJson = path.join(resultsDir, `${safeFilename(algorithm)}_latest.json`);
    const filePathCsv = path.join(resultsDir, `${safeFilename(algorithm)}_${safeFilename(messageSizeBytes)}_latest.csv`);

    const payload = {
      meta: {
        algorithm,
        iterations,
        messageSizeBytes,
        startedAt: new Date().toISOString(),
      },
      memory: {
        before: memoryBefore,
        after: memoryAfter,
        delta: memoryDelta,
        status: memoryStatus,
      },
      samples,
    };

    fs.writeFileSync(filePathJson, JSON.stringify(payload, null, 2), "utf8");

    const csvData = samples.map(sample => ({
      iteration: sample.i,
      signTimeMs: sample.signTimeMs,
      verifyTimeMs: sample.verifyTimeMs,
      payloadSizeBytes: sample.payloadSizeBytes,
      signatureSizeBytes: sample.signatureSizeBytes,
      valid: sample.valid,
      algorithm: algorithm,
      rssMB: sample.rssMB,
    }));

    stringify(csvData, { header: true }, (err, csv) => {
      if (err) return reject(err);
      fs.writeFileSync(filePathCsv, csv, "utf8");
      resolve({ filePathJson, filePathCsv });
    });
  });
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
    const memoryBefore = getProcessMemorySnapshot();

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
      const iterationMemory = getProcessMemorySnapshot();

      samples.push({
        i,
        signTimeMs,
        verifyTimeMs,
        payloadSizeBytes,
        signatureSizeBytes: sigSize,
        valid: isValid,
        rssMB: iterationMemory.rssMB,
      });

      //Store globally for this run
      metrics.signTimes.push(signTimeMs);
      metrics.verifyTimes.push(verifyTimeMs);
      metrics.signatureSizes.push(sigSize);

      if (i % 5 === 0) {
        await yieldToEventLoop();
      }

    }

    const messageSizeBytes = payloadSizeBytes;

    const memoryAfter = getProcessMemorySnapshot();
    const memoryDelta = getMemoryDelta(memoryBefore, memoryAfter);
    const memoryStatus = getMemoryStatus(memoryAfter, 128, 256);


    function getMemoryStatus(snapshot, warningThresholdMB = 128, criticalThresholdMB = 256) {
      return {
        isWarning: snapshot.heapUsedMB >= warningThresholdMB,
        isCritical: snapshot.heapUsedMB >= criticalThresholdMB,
      };
    }

    try {
      const { filePathJson, filePathCsv } = await saveRunToJson({
        algorithm: signer.name,
        iterations,
        messageSizeBytes,
        samples,
        memoryBefore,
        memoryAfter,
        memoryDelta,
        memoryStatus,
      });

      socket.emit("benchmark-result", {
        algorithm: signer.name,
        iterations,
        savedPathJson: filePathJson,
        savedPathCsv: filePathCsv,
        samples,
        memory: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryDelta,
          status: memoryStatus,
        },
        last: samples[samples.length - 1],
      });
    } catch (err) {
      console.error("Error saving benchmark results:", err);
      socket.emit("benchmark-error", { error: "Failed to save benchmark results." });
    }
  });
}
module.exports.metrics = metrics;