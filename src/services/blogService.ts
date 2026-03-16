import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage?: string;
    content: string;
    category?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    status: 'draft' | 'published';
    createdAt: any; // Timestamp
    publishedAt?: any; // Timestamp
    updatedAt?: any; // Timestamp
}

const COLLECTION_NAME = 'posts';

export const getPosts = async (): Promise<BlogPost[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Timestamps to dates/strings if needed for UI, 
                // keeping as raw data here for now or handling in UI
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                publishedAt: data.publishedAt?.toDate?.().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as BlogPost;
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

export const getPost = async (id: string): Promise<BlogPost | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                publishedAt: data.publishedAt?.toDate?.().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as BlogPost;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        throw error;
    }
};

export const createPost = async (post: Omit<BlogPost, 'id' | 'createdAt'>): Promise<BlogPost> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...post,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return {
            id: docRef.id,
            ...post,
            createdAt: new Date().toISOString(), // Optimistic return
        } as BlogPost;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const updatePost = async (id: string, updates: Partial<BlogPost>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
};

export const deletePost = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};

export const publishPost = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status: 'published',
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error publishing post:", error);
        throw error;
    }
};
