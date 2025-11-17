const admin = require("firebase-admin");

let appInitialized = false;

function initFirebase() {
  if (!appInitialized) {
    const credentials = process.env.GOOGLE_CREDENTIALS;

    if (!credentials) {
      console.error("❌ GOOGLE_CREDENTIALS is missing");
      throw new Error("Missing GOOGLE_CREDENTIALS");
    }

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(credentials))
    });

    appInitialized = true;
  }

  return admin;
}

module.exports = { initFirebase };
