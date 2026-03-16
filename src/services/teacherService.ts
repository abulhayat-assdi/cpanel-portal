import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getImageUrl } from "@/lib/getImageUrl";

const TEACHER_ORDER = [
    "Golam Kibria",
    "Shaibal Shariar",
    "Mohammad Abu Zabar Rezvhe",
    "Md. Nesar Uddin",
    "Abul Hayat",
    "M M Naim Amran"
];

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
}

/**
 * Fetch all teachers from Firestore
 */
export const getAllTeachers = async (): Promise<Teacher[]> => {
    try {
        const teachersRef = collection(db, "teachers");
        const snapshot = await getDocs(teachersRef);

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

        // Sort by custom required order first, then alphabetical
        return teachers.sort((a, b) => {
            const indexA = TEACHER_ORDER.indexOf(a.name);
            const indexB = TEACHER_ORDER.indexOf(b.name);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return [];
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
}): Promise<string> => {
    try {
        const teachersRef = collection(db, "teachers");
        const docRef = await addDoc(teachersRef, {
            teacherId: data.teacherId,
            name: data.name,
            designation: data.designation,
            about: data.about || "",
            phone: data.phone,
            email: data.email,
            profileImageUrl: data.profileImageUrl || "",
            isAdmin: data.isAdmin || false,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding teacher:", error);
        throw error;
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
        const teacherRef = doc(db, "teachers", id);
        await updateDoc(teacherRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating teacher:", error);
        throw error;
    }
};

/**
 * Delete a teacher from Firestore
 */
export const deleteTeacher = async (id: string): Promise<void> => {
    try {
        const teacherRef = doc(db, "teachers", id);
        await deleteDoc(teacherRef);
    } catch (error) {
        console.error("Error deleting teacher:", error);
        throw error;
    }
};


