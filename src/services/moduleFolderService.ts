import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
    query, where, Timestamp, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

export interface ModuleFolder {
    id: string;
    moduleId: string;           // Firestore doc ID of the parent Course Module
    moduleTitle: string;        // Title of the parent Course Module (for display)
    teacherUid: string;         // UID of the teacher who created the folder
    teacherName: string;        // Display name of the teacher
    title: string;              // e.g. "MS Word", "MS Excel"
    description?: string;
    visibleForBatches: string[]; // ["all"] or ["Batch_09", "Batch_10"]
    isHidden: boolean;
    createdAt?: any;
    updatedAt?: any;
}

// ─────────────────────────────────────────────────────────────
//  Create
// ─────────────────────────────────────────────────────────────

export const addModuleFolder = async (
    data: Omit<ModuleFolder, "id">
): Promise<string> => {
    const docRef = await addDoc(collection(db, "module_folders"), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
};

// ─────────────────────────────────────────────────────────────
//  Read
// ─────────────────────────────────────────────────────────────

/**
 * Get all folders for a specific module (by moduleId)
 */
export const getModuleFoldersByModule = async (
    moduleId: string
): Promise<ModuleFolder[]> => {
    try {
        const q = query(
            collection(db, "module_folders"),
            where("moduleId", "==", moduleId)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleFolder));
        return results.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return aTime - bTime;
        });
    } catch (err) {
        console.error("Error fetching module folders:", err);
        return [];
    }
};

/**
 * Get all folders created by a specific teacher
 */
export const getModuleFoldersByTeacher = async (
    teacherUid: string
): Promise<ModuleFolder[]> => {
    try {
        const q = query(
            collection(db, "module_folders"),
            where("teacherUid", "==", teacherUid)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleFolder));
        return results.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return aTime - bTime;
        });
    } catch (err) {
        console.error("Error fetching teacher folders:", err);
        return [];
    }
};

// ─────────────────────────────────────────────────────────────
//  Update
// ─────────────────────────────────────────────────────────────

export const updateModuleFolder = async (
    id: string,
    data: Partial<Omit<ModuleFolder, "id" | "createdAt">>
): Promise<void> => {
    await updateDoc(doc(db, "module_folders", id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
};

export const toggleModuleFolderVisibility = async (
    id: string,
    isHidden: boolean
): Promise<void> => {
    await updateDoc(doc(db, "module_folders", id), {
        isHidden,
        updatedAt: Timestamp.now(),
    });
};

// ─────────────────────────────────────────────────────────────
//  Delete
// ─────────────────────────────────────────────────────────────

/**
 * Delete a folder document (caller must also delete child resources)
 */
export const deleteModuleFolder = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "module_folders", id));
};
