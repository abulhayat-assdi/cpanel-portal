/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
}

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection("daily_tracker_reports").orderBy("createdAt", "desc").limit(5).get();
  if (snapshot.empty) {
    console.log("No reports found.");
    return;
  }
  snapshot.forEach(doc => {
    console.log("DocID:", doc.id);
    console.log("Data:", JSON.stringify(doc.data(), null, 2));
  });
}

check().catch(console.error);
