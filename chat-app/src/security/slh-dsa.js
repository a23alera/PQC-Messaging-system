
// Cachear en enda WASM-instans (initiering är tung)
let instancePromise = null;

async function getOrCreateInstance() {

  // Skapar instansen endast första gången
  if (!instancePromise) {

    // Dynamisk import eftersom @oqs/liboqs-js är ESM-only
    instancePromise = import("@oqs/liboqs-js")

      // Skapar SLH-DSA (SHA2-192s-simple) instans från liboqs
      .then((lib) => lib.createSlhDsaSha2192s());
  }

  // Återanvänder samma instans för alla sign/verify-anrop
  return instancePromise;
}

module.exports = {

  // Används av signer-factory för att identifiera algoritmen
  name: "SLH-DSA-SHA2-192s",

  async generateKeypair() {
    try {
      // Hämtar (eller skapar) liboqs-instansen
      const sig = await getOrCreateInstance();

      // Genererar nyckelpar via liboqs (ingen egen kryptologi i JS)
      const { publicKey, secretKey } = sig.generateKeyPair();

      return { publicKey, secretKey };

    } catch (err) {
      // Lägger till kontext om vilken operation som misslyckades
      throw wrapError("generateKeypair", err);
    }
  },

  async sign(message, secretKey) {
    try {
      // Hämtar samma WASM-instans
      const sig = await getOrCreateInstance();

      // Signerar med SLH-DSA via liboqs
      return sig.sign(message, secretKey);

    } catch (err) {
      throw wrapError("sign", err);
    }
  },

  async verify(message, signature, publicKey) {
    try {
      // Hämtar samma WASM-instans
      const sig = await getOrCreateInstance();

      // Verifierar signaturen via liboqs
      return sig.verify(message, signature, publicKey);

    } catch (err) {
      throw wrapError("verify", err);
    }
  },
};