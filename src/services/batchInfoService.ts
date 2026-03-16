import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";

export interface StudentBatchInfo {
    id: string; // usually roll or a generated ID
    batchName: string;
    roll: string;
    name: string;
    phone: string;
    address: string;
    courseStatus: "Completed" | "Incomplete" | "Expelled" | "";
    currentlyDoing: "Job" | "Business" | "Studying Further" | "Nothing" | "";
    companyName: string;
    businessName: string;
    salary: number;
    createdAt?: Date;
}

const BATCH_INFO_COLLECTION = "batch_info";

/**
 * Saves or updates a full batch of students.
 * For simplicity, we store each student as a document in the `batch_info` collection,
 * searchable and groupable by `batchName`.
 */
export const saveBatchInfo = async (batchName: string, students: Omit<StudentBatchInfo, "id">[]): Promise<void> => {
    // 1. Get all existing students for this batch to find deletions
    const q = query(collection(db, BATCH_INFO_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const existingIds = snapshot.docs
        .filter(doc => doc.data().batchName === batchName)
        .map(doc => doc.id);

    const newIds = new Set<string>();

    // 2. Save or update the incoming students
    const savePromises = students.map(async (student) => {
        // Create a unique deterministic ID based on Batch + Roll to easily update existing ones
        const docId = `${batchName.replace(/\s+/g, '_')}_${student.roll}`;
        newIds.add(docId);
        
        const docRef = doc(db, BATCH_INFO_COLLECTION, docId);
        
        return setDoc(docRef, {
            ...student,
            id: docId,
            batchName,
            salary: Number(student.salary) || 0, // ensure salary is a number
            createdAt: Timestamp.now()
        }, { merge: true });
    });

    await Promise.all(savePromises);

    // 3. Delete any student documents that were removed in this edit
    const deletePromises = existingIds
        .filter(id => !newIds.has(id))
        .map(id => deleteDoc(doc(db, BATCH_INFO_COLLECTION, id)));
        
    await Promise.all(deletePromises);
};

/**
 * Retrieves all students across all batches for aggregation.
 */
export const getAllBatchInfo = async (): Promise<StudentBatchInfo[]> => {
    const q = query(collection(db, BATCH_INFO_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate()
        } as StudentBatchInfo;
    });
};
