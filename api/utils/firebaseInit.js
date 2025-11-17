const admin = require("firebase-admin");

let initialized = false;

function initFirebase() {
  if (!initialized) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!privateKey) {
      console.error("FIREBASE_PRIVATE_KEY is missing");
      throw new Error("Missing FIREBASE_PRIVATE_KEY");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined
    });

    initialized = true;
  }

  return admin;
}

module.exports = { initFirebase };
