import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const uploadFile = async (file, path, type = 'file') => {
    if (!file) return null;

    try {
        const formData = new FormData();
        formData.append('path', path || 'general');
        formData.append('file', file);

        // Determine endpoint based on type or use generic file endpoint
        let endpoint = `${API_BASE_URL}/api/upload/file`;
        if (type === 'image') endpoint = `${API_BASE_URL}/api/upload/image`;
        else if (type === 'video') endpoint = `${API_BASE_URL}/api/upload/video`;
        else if (type === 'audio') endpoint = `${API_BASE_URL}/api/upload/audio`;

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
            // Note: Content-Type header is NOT set manually; browser sets it with boundary for FormData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Upload failed");
        }

        return data.url;

    } catch (error) {
        console.error("Backend Proxy Upload Failed:", error);
        throw error;
    }
};

export const uploadImage = (file, path) => uploadFile(file, path, 'image');
export const uploadVideo = (file, path) => uploadFile(file, path, 'video');
export const uploadAudio = (file, path) => uploadFile(file, path, 'audio');
