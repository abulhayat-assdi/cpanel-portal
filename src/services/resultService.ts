import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, getDoc, query, orderBy, Timestamp } from "firebase/firestore";

export interface CustomColumn {
    id: string;
    label: string;
}

export interface ExamRecord {
    id: string;
    examName: string;
    subjects: Record<string, string>;
}

export interface ExamResult {
    id: string; // generated ID
    batchName: string;
    roll: string;
    name: string;
    
    // New tabular fields
    customColumns?: CustomColumn[];
    examRecords?: ExamRecord[];
    
    // Legacy fields
    marks?: number | string;
    remarks?: string;
    updatedAt?: Date;
}

const EXAM_RESULTS_COLLECTION = "exam_results";

export const createDefaultExamRecord = (examName: string = ""): ExamRecord => ({
    id: Math.random().toString(36).substring(2, 9),
    examName,
    subjects: {
        sales: "", service: "", careerPlanning: "", ai: "",
        metaMarketing: "", msOffice: "", landingPage: ""
    }
});

/**
 * Saves or updates results for an entire batch (Legacy/Initial sync).
 */
export const saveBatchResults = async (batchName: string, results: Omit<ExamResult, "id">[]): Promise<void> => {
    const savePromises = results.map(async (result) => {
        const docId = `${batchName.replace(/\s+/g, '_')}_${result.roll}`;
        const docRef = doc(db, EXAM_RESULTS_COLLECTION, docId);
        
        return setDoc(docRef, {
            ...result,
            id: docId,
            batchName,
            updatedAt: Timestamp.now()
        }, { merge: true });
    });

    await Promise.all(savePromises);
};

/**
 * Saves a single student's complete result grid.
 */
export const saveSingleResult = async (result: ExamResult): Promise<void> => {
    const docId = result.id || `${result.batchName.replace(/\s+/g, '_')}_${result.roll}`;
    const docRef = doc(db, EXAM_RESULTS_COLLECTION, docId);
    
    await setDoc(docRef, {
        ...result,
        id: docId,
        updatedAt: Timestamp.now()
    }, { merge: true });
}

/**
 * Retrieves all exam results across all batches.
 */
export const getAllExamResults = async (): Promise<ExamResult[]> => {
    const q = query(collection(db, EXAM_RESULTS_COLLECTION), orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            updatedAt: data.updatedAt?.toDate()
        } as ExamResult;
    });
};

/**
 * Retrieve specific student's result
 */
export const getStudentResult = async (batchName: string, roll: string): Promise<ExamResult | null> => {
    try {
        const docId = `${batchName.replace(/\\s+/g, '_')}_${roll}`;
        const docRef = doc(db, EXAM_RESULTS_COLLECTION, docId);
        const resultDoc = await getDoc(docRef);

        if (resultDoc.exists()) {
            const data = resultDoc.data();
            return {
                ...data,
                id: resultDoc.id,
                updatedAt: data.updatedAt?.toDate()
            } as ExamResult;
        }
        return null;
    } catch (error) {
        console.error("Error fetching single result:", error);
        return null;
    }
};
