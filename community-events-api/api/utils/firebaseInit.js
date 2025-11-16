const admin = require('firebase-admin');

function initFirebase() {
  const projectId = process.env.PROJECT_ID;
  const clientEmail = process.env.CLIENT_EMAIL;
  const privateKey = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase admin credentials. Set PROJECT_ID, CLIENT_EMAIL and PRIVATE_KEY in env.');
    process.exit(1);
  }

  const credential = { projectId, clientEmail, privateKey };

  admin.initializeApp({
    credential: admin.credential.cert(credential),
    storageBucket: process.env.STORAGE_BUCKET || undefined
  });

  return admin;
}

module.exports = { initFirebase };
