const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log("Starting script...");
  
  // 1. Delete all existing class_schedules
  console.log("Fetching existing class_schedules...");
  const schedulesRef = db.collection("class_schedules");
  const snapshot = await schedulesRef.get();
  
  console.log(`Found ${snapshot.size} schedules to delete.`);
  
  const batch1 = db.batch();
  snapshot.docs.forEach((doc) => {
    batch1.delete(doc.ref);
  });
  
  if (snapshot.size > 0) {
    await batch1.commit();
    console.log("Deleted all old schedules.");
  }

  // 2. Insert dummy schedule for ID 65
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // Current date

  const dummySchedule = {
      date: dateStr,
      day: "Monday", // Dummy
      batch: "Dummy_Batch",
      subject: "Test Subject",
      time: "10:00 - 11:00",
      teacherId: "65",
      teacherName: "Abul Hayat",
      status: "Scheduled",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  console.log("Inserting dummy class schedule:", dummySchedule);
  await schedulesRef.add(dummySchedule);
  
  console.log("Successfully inserted dummy schedule.");
}

run().catch(console.error).finally(() => process.exit(0));
