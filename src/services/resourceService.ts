import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Resource {
    id: string; // Firestore Doc ID
    title: string;
    category: "Course Module" | "Class Routine" | "Notes" | "Assignment" | "Exam / Practice";
    uploadedByUid: string;
    uploadedByName: string;
    uploadDate: string; // Formatting to string for UI, or keep as Date object? UI expects string.
    createdAt: any; // Firestore Timestamp
    description?: string;
    fileUrl: string;
}

/**
 * Fetch all resources from Firestore
 */
export const getAllResources = async (): Promise<Resource[]> => {
    try {
        const resourcesRef = collection(db, "resources");
        const q = query(resourcesRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                category: data.category,
                uploadedByUid: data.uploadedByUid,
                uploadedByName: data.uploadedByName,
                description: data.description,
                fileUrl: data.fileUrl,
                createdAt: data.createdAt,
                // Convert timestamp to readable date string for initial UI requirement
                uploadDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            } as Resource;
        });
    } catch (error) {
        console.error("Error fetching resources:", error);
        return [];
    }
};

/**
 * Add a new resource to Firestore
 */
export const addResource = async (resource: Omit<Resource, "id" | "uploadDate" | "createdAt">): Promise<string> => {
    try {
        const resourcesRef = collection(db, "resources");
        const data: any = {
            ...resource,
            createdAt: Timestamp.now(),
        };

        // Remove undefined fields if they exist (Firestore doesn't allow undefined)
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const docRef = await addDoc(resourcesRef, data);
        return docRef.id;
    } catch (error) {
        console.error("Error adding resource:", error);
        throw error;
    }
};

/**
 * Update an existing resource in Firestore
 */
export const updateResource = async (
    id: string,
    data: Partial<Omit<Resource, "id" | "uploadDate" | "createdAt">>
): Promise<void> => {
    try {
        const resourceRef = doc(db, "resources", id);
        // Remove undefined fields
        const updateData: any = { ...data };
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        
        await updateDoc(resourceRef, updateData);
    } catch (error) {
        console.error("Error updating resource:", error);
        throw error;
    }
};

/**
 * Delete a resource from Firestore
 */
export const deleteResource = async (id: string): Promise<void> => {
    try {
        const resourceRef = doc(db, "resources", id);
        await deleteDoc(resourceRef);
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw error;
    }
};
