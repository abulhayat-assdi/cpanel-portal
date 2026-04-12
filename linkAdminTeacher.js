const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function run() {
  console.log("Starting script...");
  
  // 1. Link Teacher ID to the portal owner's user account
  const portalOwnerEmail = "mohammadabulhayatt@gmail.com";
  try {
      const user = await auth.getUserByEmail(portalOwnerEmail);
      console.log(`Found user ${user.uid} for ${portalOwnerEmail}`);
      await db.collection("users").doc(user.uid).update({
          teacherId: "65"
      });
      console.log("Successfully linked teacherId 65 to portal owner!");
  } catch (e) {
      console.log("Could not link teacher ID:", e.message);
  }
}

run().catch(console.error).finally(() => process.exit(0));
