// Cachear en enda WASM-instans (initiering är tung)
let instancePromise = null;

async function getOrCreateInstance() {
  if (!instancePromise) {
    // Dynamisk import och skapande av ML-DSA-65-instans
    instancePromise = import("@oqs/liboqs-js")
      .then(({ createMLDSA65 }) => createMLDSA65());
  }
  return instancePromise;
}

module.exports = {
  name: "ml-dsa65",

  async generateKeypair() {
    try {
      const signer = await getOrCreateInstance();
      const { publicKey, secretKey } = signer.generateKeyPair();
      return { publicKey, secretKey };
    } catch (err) {
      throw new Error(`generateKeypair failed: ${err.message}`);
    }
  },

  async sign(message, secretKey) {
    try {
      const signer = await getOrCreateInstance();
      // Ensure message is a Uint8Array
      const msgBytes = new TextEncoder().encode(message);
      return signer.sign(msgBytes, secretKey);
    } catch (err) {
      throw new Error(`sign failed: ${err.message}`);
    }
  },

  async verify(message, signature, publicKey) {
    try {
      const signer = await getOrCreateInstance();
      // Ensure message is a Uint8Array
      const msgBytes = new TextEncoder().encode(message);
      return signer.verify(msgBytes, signature, publicKey);
    } catch (err) {
      throw new Error(`verify failed: ${err.message}`);
    }
  },

  // Optional: Add a method to destroy the instance if needed
  async destroy() {
    const signer = await instancePromise;
    if (signer) signer.destroy();
    instancePromise = null;
  },
};
