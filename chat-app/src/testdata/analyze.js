const fs = require("fs");
const path = require("path");

function mean(arr) {
  if (arr.length === 0) return null;
  let sum = 0;
  for (const x of arr) sum += x;
  return sum / arr.length;
}

function median(arr) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function min(arr) {
  if (arr.length === 0) return null;
  return Math.min(...arr);
}

function max(arr) {
  if (arr.length === 0) return null;
  return Math.max(...arr);
}

function summarize(samples, key) {
  const values = samples
    .map((s) => s[key])
    .filter((v) => Number.isFinite(v));

  return {
    count: values.length,
    mean: mean(values),
    median: median(values),
    min: min(values),
    max: max(values),
  };
}

function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    console.log("Usage:");
    console.log("node testdata/analyze.js src/results/<file>.json");
    process.exit(1);
  }

  const filePath = path.isAbsolute(fileArg)
    ? fileArg
    : path.join(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  const { meta, samples } = data;

  console.log("\n========== META ==========");
  console.log(meta);

  console.log("\n========== SIGN (Ms) ==========");
  console.log(JSON.stringify(summarize(samples, "signTimeMs")));

  console.log("\n========== VERIFY (Ms) ==========");
  console.log(JSON.stringify(summarize(samples, "verifyTimeMs")));

  console.log("\n========== Payload size (bytes) ==========");
  if (samples.length > 0) {
    console.log(samples[0].payloadSizeBytes);
  } else {
    console.log("No samples");
  }
}

main();