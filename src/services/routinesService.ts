import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ClassRoutine {
    id: string;
    title: string;
    batch?: string;
    date: string;
    fileUrl: string;
    uploadedByUid: string;
    uploadedByName: string;
    createdAt: Date;
}

/**
 * Fetch all class routines, ordered by creation date (newest first)
 */
export const getClassRoutines = async (): Promise<ClassRoutine[]> => {
    try {
        const routinesRef = collection(db, "class_routines");
        const q = query(routinesRef, orderBy("createdAt", "desc"));

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                batch: data.batch,
                date: data.date || "N/A",
                fileUrl: data.fileUrl,
                uploadedByUid: data.uploadedByUid,
                uploadedByName: data.uploadedByName,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            } as ClassRoutine;
        });
    } catch (error) {
        console.error("Error fetching class routines:", error);
        return [];
    }
};

/**
 * Add a new class routine to Firestore
 */
export const addClassRoutine = async (routine: Omit<ClassRoutine, "id" | "createdAt">): Promise<string> => {
    try {
        const routinesRef = collection(db, "class_routines");
        const docRef = await addDoc(routinesRef, {
            ...routine,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding class routine:", error);
        throw error;
    }
};
