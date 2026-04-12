import {
    collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, where, Timestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface UploadedFile {
    fileUrl: string;
    storagePath: string;
    fileName: string;
    fileSize: number; // bytes
}

export interface HomeworkSubmission {
    id: string;
    studentUid: string;
    studentName: string;
    studentRoll: string;
    studentBatchName: string;
    teacherName: string;
    subject: string;
    // Legacy single-file fields (kept for backward compat)
    fileUrl?: string;
    storagePath?: string;
    fileName?: string;
    // New multi-file support
    files?: UploadedFile[];
    textContent?: string;
    submittedAt: any;
    submissionDate: string; // "30 Mar 26" format
    assignmentId?: string;
}

const HOMEWORK_COLLECTION = "homework_submissions";
const HOMEWORK_ASSIGNMENTS_COLLECTION = "homework_assignments";

export interface HomeworkAssignment {
    id: string;
    teacherUid: string;
    teacherName: string;
    title: string;
    deadlineDate: string; // YYYY-MM-DD format usually
    batchName: string; // "all" or specific batch
    createdAt: any;
}


/**
 * Format date as "30 Mar 26"
 */
export const formatHomeworkDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString("en", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
};

/**
 * Upload a homework file to local storage via API
 */
export const uploadHomeworkFile = (
    file: File,
    batchName: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileName: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            // Get a FRESH Firebase token before each upload to prevent expiry issues
            const currentUser = auth.currentUser;
            if (!currentUser) {
                reject(new Error("Not authenticated. Please log in again."));
                return;
            }
            const token = await currentUser.getIdToken(true); // force refresh

            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", "homework");
            formData.append("path", batchName.replace(/[^a-zA-Z0-9_]/g, "_"));

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(Math.round(percentComplete));
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            fileUrl: response.fileUrl,
                            storagePath: response.storagePath,
                            fileName: response.fileName
                        });
                    } catch (err) {
                        reject(new Error("Failed to parse upload response"));
                    }
                } else {
                    reject(new Error(xhr.responseText || "Upload failed"));
                }
            });

            xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
            xhr.open("POST", "/api/storage/upload");
            // Send token via Authorization header (avoids cookie expiry issues)
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(formData);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Upload multiple homework files sequentially, reporting combined progress
 * Returns an array of UploadedFile objects
 */
export const uploadMultipleHomeworkFiles = async (
    files: File[],
    batchName: string,
    onProgress?: (progress: number) => void
): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    let uploadedSize = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSizeBefore = uploadedSize;

        const result = await uploadHomeworkFile(
            file,
            batchName,
            (fileProgress) => {
                // Calculate overall progress across all files
                const fileContribution = (file.size / totalSize) * fileProgress;
                const prevContribution = (fileSizeBefore / totalSize) * 100;
                const overallProgress = Math.round(prevContribution + fileContribution * (file.size / totalSize));
                onProgress?.(Math.min(overallProgress, 99));
            }
        );

        results.push({
            fileUrl: result.fileUrl,
            storagePath: result.storagePath,
            fileName: result.fileName,
            fileSize: file.size,
        });

        uploadedSize += file.size;
        // Report accurate overall progress after each file completes
        onProgress?.(Math.round((uploadedSize / totalSize) * 100));
    }

    return results;
};

/**
 * Submit a homework entry to Firestore
 */
export const submitHomework = async (
    data: Omit<HomeworkSubmission, "id" | "submittedAt">
): Promise<string> => {
    try {
        const payload: any = {
            ...data,
            submittedAt: Timestamp.now(),
        };

        // Remove undefined fields to prevent Firestore errors
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        const docRef = await addDoc(collection(db, HOMEWORK_COLLECTION), payload);
        return docRef.id;
    } catch (error) {
        console.error("Error submitting homework:", error);
        throw error;
    }
};

/**
 * Fetch homework for a specific teacher
 */
export const getHomeworkByTeacher = async (teacherName: string): Promise<HomeworkSubmission[]> => {
    try {
        const q = query(
            collection(db, HOMEWORK_COLLECTION),
            where("teacherName", "==", teacherName)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as HomeworkSubmission));
        
        // Sort manually by submittedAt descending to avoid needing a Firestore composite index
        return docs.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());
    } catch (error) {
        console.error("Error fetching homework by teacher:", error);
        return [];
    }
};

/**
 * Fetch homework for a specific student
 */
export const getHomeworkByStudent = async (studentUid: string): Promise<HomeworkSubmission[]> => {
    try {
        const q = query(
            collection(db, HOMEWORK_COLLECTION),
            where("studentUid", "==", studentUid)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as HomeworkSubmission));
        
        // Sort manually by submittedAt descending to avoid needing a Firestore composite index
        return docs.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());
    } catch (error) {
        console.error("Error fetching homework by student:", error);
        return [];
    }
};

/**
 * Fetch all homework submissions (admin)
 */
export const getAllHomework = async (): Promise<HomeworkSubmission[]> => {
    try {
        const snapshot = await getDocs(collection(db, HOMEWORK_COLLECTION));
        const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as HomeworkSubmission));
        // Sort in-memory to avoid needing a Firestore composite index
        return docs.sort((a, b) => {
            const aMs = a.submittedAt?.toMillis?.() ?? 0;
            const bMs = b.submittedAt?.toMillis?.() ?? 0;
            return bMs - aMs;
        });
    } catch (error) {
        console.error("Error fetching all homework:", error);
        return [];
    }
};

/**
 * Delete a single homework submission (Firestore doc + local file)
 */
export const deleteHomework = async (id: string, storagePath?: string): Promise<void> => {
    try {
        // Delete file from local storage via API if it exists
        if (storagePath) {
            try {
                await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, { 
                    method: "DELETE" 
                });
            } catch (err) {
                console.warn("Storage deletion failed:", err);
            }
        }
        // Delete Firestore document
        await deleteDoc(doc(db, HOMEWORK_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting homework:", error);
        throw error;
    }
};

/**
 * Auto-cleanup: Delete all homework for batches that have been completed for 3+ days.
 * This runs on teacher/admin dashboard load.
 *
 * @param completedBatches - Array of { batchName, completedAt (Date) }
 */
export const cleanupCompletedBatchHomework = async (
    completedBatches: { batchName: string; completedAt: Date }[]
): Promise<number> => {
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    for (const batch of completedBatches) {
        const elapsed = now.getTime() - batch.completedAt.getTime();
        if (elapsed < THREE_DAYS_MS) continue; // Not yet 3 days

        try {
            // Find all homework for this batch
            const q = query(
                collection(db, HOMEWORK_COLLECTION),
                where("studentBatchName", "==", batch.batchName)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) continue;

            // Delete each homework document + its storage file
            const deletePromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                if (data.storagePath) {
                    try {
                        await fetch(`/api/storage/delete?path=${encodeURIComponent(data.storagePath)}`, { 
                            method: "DELETE" 
                        });
                    } catch (err) {
                        console.warn(`Failed to delete local file: ${data.storagePath}`, err);
                    }
                }
                await deleteDoc(doc(db, HOMEWORK_COLLECTION, docSnap.id));
            });

            await Promise.all(deletePromises);
            totalDeleted += snapshot.docs.length;

        } catch (error) {
            console.error(`Error cleaning up homework for batch ${batch.batchName}:`, error);
        }
    }

    return totalDeleted;
};

/**
 * ASSIGNMENTS
 */

export const createHomeworkAssignment = async (
    data: Omit<HomeworkAssignment, "id" | "createdAt">
): Promise<string> => {
    try {
        const payload = {
            ...data,
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, HOMEWORK_ASSIGNMENTS_COLLECTION), payload);
        return docRef.id;
    } catch (error) {
        console.error("Error creating homework assignment:", error);
        throw error;
    }
};

export const getHomeworkAssignmentsByTeacher = async (teacherName: string): Promise<HomeworkAssignment[]> => {
    try {
        const q = query(
            collection(db, HOMEWORK_ASSIGNMENTS_COLLECTION),
            where("teacherName", "==", teacherName)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HomeworkAssignment));
        return docs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    } catch (error) {
        console.error("Error fetching assignments by teacher:", error);
        return [];
    }
};

export const getActiveHomeworkAssignmentsForStudent = async (studentBatchName: string): Promise<HomeworkAssignment[]> => {
    try {
        const snapshot = await getDocs(collection(db, HOMEWORK_ASSIGNMENTS_COLLECTION));
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HomeworkAssignment));
        
        const nowStr = new Date().toISOString().split('T')[0];

        // Filter valid assignments for this student
        const filtered = docs.filter(a => {
            const matchesBatch = a.batchName === "all" || a.batchName === studentBatchName;
            const notExpired = a.deadlineDate >= nowStr;
            return matchesBatch && notExpired;
        });

        // Sort in-memory descending
        return filtered.sort((a, b) => {
            const aMs = a.createdAt?.toMillis?.() ?? 0;
            const bMs = b.createdAt?.toMillis?.() ?? 0;
            return bMs - aMs;
        });
    } catch (error) {
        console.error("Error fetching assignments for student:", error);
        return [];
    }
};

export const deleteHomeworkAssignment = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, HOMEWORK_ASSIGNMENTS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting assignment:", error);
        throw error;
    }
};

export const updateHomeworkAssignment = async (
    id: string,
    updates: Partial<Pick<HomeworkAssignment, "title" | "batchName" | "deadlineDate">>
): Promise<void> => {
    try {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, HOMEWORK_ASSIGNMENTS_COLLECTION, id), updates);
    } catch (error) {
        console.error("Error updating assignment:", error);
        throw error;
    }
};
