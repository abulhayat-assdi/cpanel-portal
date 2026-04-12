import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface HomeVideoTestimonial {
    id: string;
    youtubeUrl: string;
    videoId: string; // Extracted from URL
    title: string;
    studentName?: string;
    order: number;
    createdAt?: any;
    updatedAt?: any;
}

const COLLECTION_NAME = 'homeVideoTestimonials';

export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,  // raw ID
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export const getVideos = async (): Promise<HomeVideoTestimonial[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as HomeVideoTestimonial;
        });
    } catch (error) {
        console.error("Error fetching homepage videos:", error);
        throw error;
    }
};

export const createVideo = async (video: Omit<HomeVideoTestimonial, 'id' | 'createdAt' | 'videoId'>): Promise<HomeVideoTestimonial> => {
    const videoId = extractVideoId(video.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...video,
        videoId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...video, videoId, createdAt: new Date().toISOString() } as HomeVideoTestimonial;
};

export const updateVideo = async (id: string, updates: Partial<HomeVideoTestimonial>): Promise<void> => {
    if (updates.youtubeUrl) {
        const videoId = extractVideoId(updates.youtubeUrl);
        if (!videoId) throw new Error("Invalid YouTube URL");
        updates.videoId = videoId;
    }
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteVideo = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};
