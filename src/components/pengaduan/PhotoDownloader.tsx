"use client";

import React from "react";
import { constructPhotoUrl, extractPhotoPath, getApiUrl } from "../../utils/urlUtils";

interface PhotoDownloaderProps {
    sessionId: string;
    userName: string;
    photos: (string | { url: string; type?: string; caption?: string; originalUrl?: string })[];
    children: React.ReactNode;
    className?: string;
    onDownloadComplete?: () => void;
}

// Komponen untuk menangani download foto dengan nama yang sesuai format
const PhotoDownloader: React.FC<PhotoDownloaderProps> = ({
    sessionId,
    userName,
    photos,
    children,
    className = "",
    onDownloadComplete
}) => {
    const baseUrl = getApiUrl();

    // Fungsi untuk membuat nama file sesuai format DDMMYY_Nama_(nomor)_sessionId
    const generateFileName = (index: number, photoPath: string): string => {
        // Buat format tanggal DDMMYY dari hari ini
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2); // Ambil 2 digit terakhir
        const dateString = `${day}${month}${year}`;
        
        // Bersihkan nama user dari karakter yang tidak valid untuk nama file
        const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_');
        
        // Ekstrak ekstensi file
        const fileExtension = photoPath.match(/\.([^.?]+)(\?|$)/)?.[1] || 'jpg';
        const photoNumber = index + 1;
        
        return `${dateString}_${cleanUserName}_(${photoNumber})_${sessionId}.${fileExtension}`;
    };

    // Fungsi untuk download foto tunggal
    const downloadSinglePhoto = async (photo: string | { url: string; type?: string; caption?: string; originalUrl?: string }, index: number) => {
        if (!baseUrl) {
            console.error('NEXT_PUBLIC_BE_BASE_URL tidak ditemukan');
            alert('Konfigurasi base URL tidak ditemukan');
            return;
        }

        // Extract photo path from both string and object format
        let photoPath: string;
        if (typeof photo === 'string') {
            photoPath = photo;
        } else if (typeof photo === 'object' && photo !== null) {
            photoPath = photo.url || photo.originalUrl || '';
        } else {
            console.error('Invalid photo format:', photo);
            alert('Format foto tidak valid');
            return;
        }

        try {
            // Extract photo path safely
            const photoPath = extractPhotoPath(photo);
            if (!photoPath || photoPath.trim() === '') {
                console.warn('Empty photo path, skipping');
                return;
            }

            // Construct photo URL safely
            const photoUrl = constructPhotoUrl(photoPath);

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Download timeout for photo ${index + 1}`);
                controller.abort();
            }, 15000); // 15 second timeout

            // Fetch gambar sebagai blob dengan better headers
            const response = await fetch(photoUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'image/*,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (compatible; LaporAA-App/1.0)',
                },
                mode: 'cors',
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // Fallback: open in new tab
                console.warn(`HTTP ${response.status} for photo download, opening in new tab`);
                window.open(photoUrl, '_blank');
                return;
            }
            
            const blob = await response.blob();
            
            // Buat URL object untuk blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Generate nama file
            const fileName = generateFileName(index, photoPath);
            
            // Buat elemen anchor untuk download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            if (onDownloadComplete) {
                onDownloadComplete();
            }
        } catch (error) {
            console.error('Error downloading photo:', error);
            
            // Fallback: Try to open in new tab with constructed URL
            const fallbackUrl = constructPhotoUrl(photoPath);
            if (fallbackUrl !== '/placeholder-image.svg') {
                console.log('Fallback: Opening photo in new tab');
                window.open(fallbackUrl, '_blank');
            } else {
                alert('Gagal download foto: URL tidak valid');
            }
        }
    };

    // Fungsi untuk download semua foto
    const downloadAllPhotos = async () => {
        if (!photos || photos.length === 0) {
            alert('Tidak ada foto untuk didownload');
            return;
        }

        for (let i = 0; i < photos.length; i++) {
            try {
                await downloadSinglePhoto(photos[i], i);
                
                // Delay sejenak antara download untuk menghindari browser blocking
                if (i < photos.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`Error downloading photo ${i + 1}:`, error);
                alert(`Gagal mendownload foto ${i + 1}: ${error}`);
                break; // Stop jika ada error
            }
        }

        if (onDownloadComplete) {
            onDownloadComplete();
        }
    };

    // Handler untuk klik pada children
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (photos.length === 1) {
            // Download foto tunggal
            downloadSinglePhoto(photos[0], 0);
        } else if (photos.length > 1) {
            // Download semua foto
            downloadAllPhotos();
        }
    };

    return (
        <div className={className} onClick={handleClick}>
            {children}
        </div>
    );
};

export default PhotoDownloader;

// Hook untuk penggunaan yang lebih fleksibel
export const usePhotoDownloader = () => {
    const baseUrl = getApiUrl();

    const generateFileName = (sessionId: string, userName: string, index: number, photoPath: string): string => {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2);
        const dateString = `${day}${month}${year}`;
        
        const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_');
        const fileExtension = photoPath.match(/\.([^.?]+)(\?|$)/)?.[1] || 'jpg';
        const photoNumber = index + 1;
        
        return `${dateString}_${cleanUserName}_(${photoNumber})_${sessionId}.${fileExtension}`;
    };

    const downloadPhoto = async (sessionId: string, userName: string, photoPath: string, index: number = 0) => {
        try {
            // Construct photo URL safely
            const photoUrl = constructPhotoUrl(photoPath);
            
            // Check if we got a valid URL (not fallback)
            if (photoUrl === '/placeholder-image.svg') {
                throw new Error('URL foto tidak valid');
            }

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Download timeout for photo`);
                controller.abort();
            }, 15000);

            const response = await fetch(photoUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'image/*,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (compatible; LaporAA-App/1.0)',
                },
                mode: 'cors',
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // Fallback: open in new tab
                console.warn(`HTTP ${response.status} for photo download, opening in new tab`);
                window.open(photoUrl, '_blank');
                return;
            }
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const fileName = generateFileName(sessionId, userName, index, photoPath);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading photo:', error);
            throw error;
        }
    };

    const downloadMultiplePhotos = async (sessionId: string, userName: string, photos: string[]) => {
        for (let i = 0; i < photos.length; i++) {
            try {
                await downloadPhoto(sessionId, userName, photos[i], i);
                
                if (i < photos.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`Error downloading photo ${i + 1}:`, error);
                throw error;
            }
        }
    };

    return {
        downloadPhoto,
        downloadMultiplePhotos
    };
};
