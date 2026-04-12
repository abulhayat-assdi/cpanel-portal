import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/teachers
 * Public API to fetch all teachers from Firestore using Firebase Admin SDK.
 * This is safe to call from server components.
 */
export async function GET() {
    try {
        const { adminDb } = getAdminServices();
        const snapshot = await adminDb
            .collection("teachers")
            .orderBy("order", "asc")
            .get();

        const teachers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        // Try without ordering if index is missing
        try {
            const { adminDb } = getAdminServices();
            const snapshot = await adminDb.collection("teachers").get();
            const teachers = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            return NextResponse.json(teachers);
        } catch (innerError) {
            console.error("Error fetching teachers (fallback):", innerError);
            return NextResponse.json([], { status: 500 });
        }
    }
}
