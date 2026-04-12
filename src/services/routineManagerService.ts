import { collection, doc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BatchRoutineEntry {
    id?: string;
    batch: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacherName: string;
    room: string;
}

/**
 * Fetch all routine entries for a specific batch.
 */
export const getRoutinesByBatch = async (batchName: string): Promise<BatchRoutineEntry[]> => {
    try {
        const q = query(
            collection(db, "batch_routines"),
            where("batch", "==", batchName)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BatchRoutineEntry));
    } catch (error) {
        console.error("Error fetching routines:", error);
        return [];
    }
};

/**
 * Sync batch routines:
 * 1. Find all existing routines for the specific batch and delete them.
 * 2. Add the newly passed routines.
 * We do a full replace per batch to make it robust and similar to an excel save.
 */
export const syncBatchRoutines = async (batchName: string, routines: BatchRoutineEntry[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const routinesRef = collection(db, "batch_routines");

        // 1. Delete all existing for this batch
        const q = query(routinesRef, where("batch", "==", batchName));
        const snapshot = await getDocs(q);
        snapshot.forEach((existingDoc) => {
            batch.delete(existingDoc.ref);
        });

        // 2. Add all new non-empty rows
        routines.forEach((row) => {
            // Check if row has some content (we consider subject or teacherName as mandatory indicator or just exclude fully empty ones)
            if (row.dayOfWeek || row.startTime || row.subject || row.teacherName || row.room) {
                const newDocRef = doc(routinesRef);
                const dataToSave = { ...row };
                delete dataToSave.id; // ensure no leftover id is saved inside the object itself
                // Ensure batch is explicitly set
                dataToSave.batch = batchName;
                batch.set(newDocRef, dataToSave);
            }
        });

        await batch.commit();
    } catch (error) {
        console.error("Error syncing routines:", error);
        throw error;
    }
};
