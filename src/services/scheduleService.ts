import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    orderBy,
    writeBatch,
    doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ClassSchedule {
    teacherId: string;
    teacherName: string;
    date: string;
    day: string;
    batch: string;
    subject: string;
    time: string;
    // Normalized status for frontend logic
    // REQUEST_TO_COMPLETE added
    status: "Completed" | "Scheduled" | "Upcoming" | "Pending" | "Today" | "Requested";
}

// Helper to normalize date string to YYYY-MM-DD
const getNormalizedDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const day = d.padStart(2, '0');
        const month = m.padStart(2, '0');
        return `${y}-${month}-${day}`;
    }
    // Fallback: try standard Date parse
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    } catch (e) { }
    return dateStr;
};

/**
 * Fetch class schedules for a specific teacher via API (Sheets) 
 * AND Firestore (for overrides/requests)
 */
export const getClassesByTeacherId = async (teacherId: string): Promise<ClassSchedule[]> => {
    try {
        // 1. Fetch Request/Status Overrides from Firestore
        // These are actions the teacher or admin took that might not be in Sheets yet
        // OR are pending admin approval
        const firestoreClasses: any[] = [];
        try {
            const classesRef = collection(db, "classes");
            const q = query(classesRef, where("teacherUid", "==", teacherId));
            // We fetch all for this teacher to catch matching overrides
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => firestoreClasses.push(doc.data()));
        } catch (e) {
            console.error("Firestore fetch error (skipping override):", e);
        }

        // 1.5 Fetch Newly Added Schedules from `class_schedules`
        const customSchedules: ClassSchedule[] = [];
        try {
            const schedulesRef = collection(db, "class_schedules");
            const qs = query(schedulesRef, where("teacherId", "==", teacherId));
            const snap = await getDocs(qs);
            snap.forEach(doc => customSchedules.push(doc.data() as ClassSchedule));
        } catch (e) {
            console.error("Error fetching custom schedules:", e);
        }

        // 2. Fetch Base Schedule from Sheets API
        // 2. Mock Data Replacement for API (Free Plan Limitation)
        // const response = await fetch('/api/schedule', ...);

        // Mock Response Data
        const result = {
            data: [
                {
                    teacherId: teacherId,
                    teacherName: "Mock Teacher",
                    date: "2026-01-30",
                    day: "Friday",
                    time: "10:00-12:00",
                    batch: "Batch_06",
                    subject: "Test Class (Mock)",
                    status: "Scheduled" as const
                },
                {
                    teacherId: teacherId,
                    teacherName: "Mock Teacher",
                    date: "2026-02-05",
                    day: "Wednesday",
                    time: "14:00-16:00",
                    batch: "Batch_07",
                    subject: "Mock Subject",
                    status: "Scheduled" as const
                }
            ]
        };

        // const result = await response.json();
        let classes: ClassSchedule[] = Array.isArray(result.data) ? result.data : [];

        // Merge custom schedules with mock/sheet schedules
        classes = [...classes, ...customSchedules];

        // 3. Merge & Process Logic based on Date
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return classes.map(cls => {
            const normalizedDate = getNormalizedDate(cls.date);
            const currentStatusLower = (cls.status || "").toLowerCase().trim();

            // Check if there is a Firestore Override for this specific class slot
            // Matches Date + Time + Batch + Subject (assuming uniqueness)
            const override = firestoreClasses.find(fc =>
                getNormalizedDate(fc.date) === normalizedDate &&
                fc.startTime === cls.time.split('-')[0].trim() && // Match start time approx? 
                // Wait, Sheet time is "10.00-12.00". Firestore split logic needed.
                // Let's rely on Batch + Subject + Date primarily as unique enough for now?
                // Or string match Time?
                // Firestore stores "startTime" separately. Sheet has "Time" range.
                // Let's try exact batch/subject/date match.
                fc.batch === cls.batch &&
                fc.subject === cls.subject
            );

            let computedStatus = "Upcoming";

            // If Firestore status exists, it takes precedence (e.g. REQUEST_TO_COMPLETE, COMPLETED)
            if (override) {
                if (override.status === "REQUEST_TO_COMPLETE") {
                    computedStatus = "Requested";
                } else if (override.status === "COMPLETED") {
                    computedStatus = "Completed";
                } else if (override.status === "PENDING") {
                    // Admin might have "Rejected" (if we used explicit reject) or it's just created.
                    // If it matches Pending logic effectively.
                    computedStatus = "Requested"; // Actually if it is in Firestore as PENDING, it IS requested.
                }
            } else {
                // Default Logic if no override
                if (currentStatusLower === 'completed') {
                    computedStatus = "Completed";
                } else {
                    if (normalizedDate === today) {
                        computedStatus = "Today";
                    } else if (normalizedDate < today) {
                        computedStatus = "Pending";
                    } else {
                        computedStatus = "Upcoming";
                    }
                }
            }

            return {
                ...cls,
                status: computedStatus as any
            };
        }).sort((a, b) => {
            const dateA = getNormalizedDate(a.date);
            const dateB = getNormalizedDate(b.date);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });

    } catch (error) {
        console.error("Error fetching class schedule:", error);
        return [];
    }
};

/**
 * Fetch all class schedules from Firestore (For Admin)
 */
export const getAllClassesSchedules = async (): Promise<ClassSchedule[]> => {
    try {
        const schedulesRef = collection(db, "class_schedules");
        // For admin overview, we could fetch all schedules, or maybe limit to current week.
        // Returning all for now, frontend will filter/sort.
        const snapshot = await getDocs(schedulesRef);
        
        const schedules: ClassSchedule[] = [];
        snapshot.forEach(doc => {
            schedules.push({ ...doc.data(), status: doc.data().status || "Scheduled" } as ClassSchedule);
        });

        // Compute dynamic status for these as well
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return schedules.map(cls => {
            const normalizedDate = getNormalizedDate(cls.date);
            let computedStatus = "Upcoming";

            if (normalizedDate === today) {
                computedStatus = "Today";
            } else if (normalizedDate < today) {
                computedStatus = "Pending";
            }

            // Note: we're not checking completion overrides here for simplicity unless requested
            // Normally you would fetch the 'classes' overrides as well and merge.
            
            return {
                ...cls,
                status: computedStatus as any
            };
        }).sort((a, b) => {
            const dateA = getNormalizedDate(a.date);
            const dateB = getNormalizedDate(b.date);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });
    } catch (error) {
        console.error("Error fetching all class schedules:", error);
        return [];
    }
};

/**
 * Bulk add class schedules to Firestore 'class_schedules' collection
 */
export const addBatchClassSchedules = async (schedules: Omit<ClassSchedule, "status">[]) => {
    try {
        // 1. Filter out empty rows (Require at least Date, Batch, Teacher ID)
        const validSchedules = schedules.filter(s => s.date?.trim() && s.batch?.trim() && s.teacherId?.trim());

        if (validSchedules.length === 0) return true;

        // 2. Chunk processing (Firestore batch limit is 500 operations)
        // We'll use 400 to be safe
        const CHUNK_SIZE = 400;
        const schedulesRef = collection(db, "class_schedules");
        
        const chunks = [];
        for (let i = 0; i < validSchedules.length; i += CHUNK_SIZE) {
            chunks.push(validSchedules.slice(i, i + CHUNK_SIZE));
        }

        // 3. Process batches concurrently
        const batchPromises = chunks.map(chunk => {
            const batch = writeBatch(db);
            chunk.forEach(schedule => {
                const newDocRef = doc(schedulesRef);
                // Strip out any empty/extra fields we don't need or standardizing
                batch.set(newDocRef, {
                    date: schedule.date?.trim() || "",
                    day: schedule.day?.trim() || "",
                    batch: schedule.batch?.trim() || "",
                    subject: schedule.subject?.trim() || "",
                    time: schedule.time?.trim() || "",
                    teacherId: schedule.teacherId?.trim() || "",
                    teacherName: schedule.teacherName?.trim() || "",
                    status: "Scheduled", // Default status
                    createdAt: serverTimestamp()
                });
            });
            return batch.commit();
        });

        await Promise.all(batchPromises);
        return true;
    } catch (error) {
        console.error("Error saving batch schedules:", error);
        throw error;
    }
};

/**
 * Request Admin to Complete a Class
 * Creates a record in Firestore 'classes' collection
 */
export const requestClassCompletion = async (
    teacherId: string,
    teacherName: string,
    scheduleItem: ClassSchedule
) => {
    try {
        const normalizedDate = getNormalizedDate(scheduleItem.date);
        // Extract start/end time from "10.00-12.00" format
        const [start, end] = scheduleItem.time.split(/[-–]/).map(t => t.trim());

        await addDoc(collection(db, "classes"), {
            teacherUid: teacherId,
            teacherName: teacherName,
            date: normalizedDate,
            startTime: start || scheduleItem.time,
            endTime: end || "",
            timeRange: scheduleItem.time, // Exact string from Sheet logic validation
            batch: scheduleItem.batch,
            subject: scheduleItem.subject,
            status: "REQUEST_TO_COMPLETE",
            completedByUid: null,
            completedAt: null,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error requesting completion:", error);
        throw error;
    }
};
