import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getImageUrl } from "@/lib/getImageUrl";
import { COLLECTIONS } from "@/lib/constants";

const TEACHER_IMAGES: Record<string, string> = {
    "Golam Kibria": "instructors/golam-kibria.jpeg",
    "Shaibal Shariar": "instructors/shaibal-shariar.jpg",
    "Mohammad Abu Zabar Rezvhe": "instructors/abu-zabar-rezvhe.jpg",
    "Md. Nesar Uddin": "instructors/nesar-uddin.jpg",
    "Abul Hayat": "instructors/abul-hayat.jpg",
    "M M Naim Amran": "instructors/naim-amran.jpg",
};

export interface Teacher {
    id: string; // Firestore Doc ID
    teacherId: string; // Custom ID like ID-101
    name: string;
    designation: string;
    about: string;
    phone: string;
    email: string;
    profileImageUrl?: string;
    isAdmin: boolean;
    order?: number; // Serial number for sorting
}

/**
 * Fetch all teachers from Firestore
 */
export const getAllTeachers = async (): Promise<Teacher[]> => {
    try {
        const teachersRef = collection(db, COLLECTIONS.TEACHERS);
        const q = query(teachersRef, orderBy("order", "asc"));
        const snapshot = await getDocs(q);

        const teachers = snapshot.docs.map(doc => {
            const data = doc.data() as Omit<Teacher, 'id'>;
            // Fallback to public images if their profileImageUrl is missing
            if (!data.profileImageUrl && TEACHER_IMAGES[data.name]) {
                data.profileImageUrl = getImageUrl(TEACHER_IMAGES[data.name]);
            }
            return {
                id: doc.id,
                ...data
            } as Teacher;
        });

        return teachers;
    } catch (error: unknown) {
        console.error("Error fetching teachers:", error);
        // Fallback: If orderBy fails (e.g., missing index or missing field on old docs), try without ordering
        try {
            const teachersRef = collection(db, COLLECTIONS.TEACHERS);
            const snapshot = await getDocs(teachersRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Teacher));
        } catch (innerError) {
            return [];
        }
    }
};

/**
 * Add a new teacher to Firestore
 */
export const addTeacher = async (data: {
    teacherId: string;
    name: string;
    designation: string;
    about: string;
    phone: string;
    email: string;
    profileImageUrl?: string;
    isAdmin?: boolean;
    order?: number;
}): Promise<string> => {
    try {
        const teachersRef = collection(db, COLLECTIONS.TEACHERS);
        const docRef = await addDoc(teachersRef, {
            teacherId: data.teacherId,
            name: data.name,
            designation: data.designation,
            about: data.about || "",
            phone: data.phone,
            email: data.email,
            profileImageUrl: data.profileImageUrl || "",
            isAdmin: data.isAdmin || false,
            order: data.order || 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error: unknown) {
        console.error("Error adding teacher:", error);
        throw new Error("Failed to add teacher to directory.");
    }
};

/**
 * Update an existing teacher in Firestore
 */
export const updateTeacher = async (
    id: string,
    data: Partial<Omit<Teacher, 'id'>>
): Promise<void> => {
    try {
        const teacherRef = doc(db, COLLECTIONS.TEACHERS, id);
        await updateDoc(teacherRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error: unknown) {
        console.error("Error updating teacher:", error);
        throw new Error("Failed to update teacher information.");
    }
};

/**
 * Delete a teacher from Firestore
 */
export const deleteTeacher = async (id: string): Promise<void> => {
    try {
        const teacherRef = doc(db, COLLECTIONS.TEACHERS, id);
        await deleteDoc(teacherRef);
    } catch (error: unknown) {
        console.error("Error deleting teacher:", error);
        throw new Error("Failed to delete teacher.");
    }
};
