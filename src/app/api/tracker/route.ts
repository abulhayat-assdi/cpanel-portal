import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request (Optional but recommended)
    const sessionCookie = request.cookies.get('__session')?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { adminAuth, adminDb } = getAdminServices();
    try {
        await adminAuth.verifyIdToken(sessionCookie);
    } catch (authError) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Parse the payload
    const data = await request.json();
    const { studentName, batchName, date, tasks, score } = data;

    if (!studentName || !batchName || !date || !tasks) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Save to Firestore
    const reportRef = adminDb.collection("daily_tracker_reports").doc();
    await reportRef.set({
        studentName,
        batchName,
        date,
        tasks,
        score: score || 0,
        createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, id: reportRef.id });
  } catch (err) {
    console.error("Tracker Submission Error:", err);
    const errorMessage = err instanceof Error ? err.message : "An internal error occurred while processing the request.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
