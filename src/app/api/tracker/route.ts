import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { adminAuth, adminDb } = getAdminServices();

    // -- Dashboard Action --
    if (data.action === "getDashboardData") {
        const sessionCookie = request.cookies.get('__session')?.value;
        if (!sessionCookie) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        try {
            await adminAuth.verifySessionCookie(sessionCookie, true);
        } catch {
            return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
        }

        const { date, batch } = data.payload;
        if (!date || !batch) return NextResponse.json({ success: false, message: "Date and batch required" });

        // Only query by one field to avoid needing a composite index
        const snapshot = await adminDb.collection("daily_tracker_reports")
            .where("batchName", "==", batch)
            .get();

        const reports = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((d: any) => d.date === date)
            .map((d: any) => {
                return {
                    id: d.id,
                    captain: d.studentName,
                    score: d.score,
                    items: (d.tasks || []).map((t: any, idx: number) => ({
                        number: idx + 1,
                        label: t.question,
                        status: t.status,
                        reason: t.reason
                    }))
                };
            });

        return NextResponse.json({ success: true, reports });
    }

    // -- Export Action --
    if (data.action === "getExportData") {
        const sessionCookie = request.cookies.get('__session')?.value;
        if (!sessionCookie) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        try {
            await adminAuth.verifySessionCookie(sessionCookie, true);
        } catch {
            return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
        }

        const { batch, from, to } = data.payload;
        if (!batch || !from || !to) return NextResponse.json({ success: false, message: "Missing export parameters" });

        // Only query by one field and filter date manually
        const snapshot = await adminDb.collection("daily_tracker_reports")
            .where("batchName", "==", batch)
            .get();

        const docsInRange = snapshot.docs
            .map(doc => doc.data())
            .filter((d: any) => d.date >= from && d.date <= to)
            .sort((a: any, b: any) => a.date.localeCompare(b.date)); // sort by date ASC

        // Build headers dynamically from the first doc's tasks, or fallback
        const headers = ["Date", "Captains Name", "Batch", "Score"];
        const rows: any[] = [];
        
        docsInRange.forEach((d, idx) => {
            const tasks = d.tasks || [];
            
            if (idx === 0) {
                tasks.forEach((t: any) => headers.push(t.question));
            }

            const row = [d.date, d.studentName, d.batchName, d.score];
            tasks.forEach((t: any) => row.push(t.status || ""));
            rows.push(row);
        });

        return NextResponse.json({ 
            success: true, 
            headers, 
            rows,
            count: rows.length
        });
    }

    // -- Default: Submit Tracker Report --
    // Notice: Submission is open for Batch Captains. No session check is forced here.
    const { studentName, batchName, date, tasks, score } = data;

    if (!studentName || !batchName || !date || !tasks) {
        return NextResponse.json({ error: "Missing required fields for submission" }, { status: 400 });
    }

    // Save to Firestore
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
    const errorMessage = err instanceof Error ? err.message : "An internal error occurred.";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
