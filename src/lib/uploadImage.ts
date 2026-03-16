import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import imageCompression from "browser-image-compression";

/**
 * Compresses an image and uploads it to Firebase Storage.
 * @param file The image file to upload
 * @param path The path in Firebase Storage (e.g., 'images/blog')
 * @param onProgress Callback function for upload progress (0-100)
 * @returns The download URL of the uploaded image
 */
export const uploadImage = async (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        // 1. Compress the image aggressively for fast web loading
        const options = {
            maxSizeMB: 0.2,          // Max 200KB per image
            maxWidthOrHeight: 800,   // Max 800px (perfect for blog thumbnails)
            useWebWorker: true,
            initialQuality: 0.7,     // 70% quality — good balance
            fileType: 'image/webp',  // Convert to WebP for best compression
        };
        const compressedFile = await imageCompression(file, options);

        // 2. Create a unique filename to avoid overwrites
        const timestamp = Date.now();
        const cleanName = compressedFile.name.replace(/[^a-zA-Z0-9.]/g, '-');
        const filename = `${timestamp}-${cleanName}`;
        const storageRef = ref(storage, `${path}/${filename}`);

        // 3. Upload to Firebase Storage
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(error);
                },
                async () => {
                    // Upload completed successfully, now we can get the download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error("Error compressing or uploading image:", error);
        throw error;
    }
};
