// src/security/getSigner.js

/*
  ==========================================
  SIGNER FACTORY
  ==========================================

  Denna modul ansvarar för att välja vilken
  digital signaturalgoritm som ska användas.

  Valet styrs via miljövariabeln:

      SIG_ALG

  Exempel:
      SIG_ALG=ed25519
      SIG_ALG=slh-dsa

  Syftet är att göra systemet algoritm-agnostiskt,
  så att vi kan byta mellan klassisk och
  post-quantum kryptografi utan att ändra
  övrig applikationskod.
*/


// Importerar Ed25519-implementationen
const ed25519 = require("./ed25519");

// Importerar SLH-DSA-implementationen
const slhDsa = require("./slh-dsa");


function getSigner() {

  /*
    Läser vald algoritm från environment variables.
    Om ingen är satt används Ed25519 som standard.
  */
  const alg = (process.env.SIG_ALG || "ed25519").toLowerCase();


  // Om Ed25519 är vald → returnera dess implementation
  if (alg === "ed25519") {
    return ed25519;
  }


  // Om SLH-DSA är vald → returnera dess implementation
  if (alg === "slh-dsa" || alg === "slh-dsa-sha2-192s") {
    return slhDsa;
  }


  /*
    Om en okänd algoritm anges kastas ett tydligt fel.
    Detta förhindrar att systemet startar med fel konfiguration.
  */
  throw new Error(
    `Okänd SIG_ALG="${alg}". Tillåtna värden: ed25519, slh-dsa`
  );
}


// Exporterar factory-funktionen
module.exports = { getSigner };