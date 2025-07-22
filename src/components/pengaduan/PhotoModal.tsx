"use client";

import React from "react";
import { FaDownload } from "react-icons/fa";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import { PhotoDisplay, VideoDisplay } from "./PhotoDisplay";
import { constructPhotoUrl, extractAndValidatePhotoPath } from "../../utils/urlUtils";

interface Props {
    photoModal: string[] | any[];  // Support both string and object formats from backend
    onClose: () => void;           // Function to close modal
    reportInfo?: {                 // Additional info for file naming
        sessionId?: string;
        userName?: string;
    };
}

// Modal component for displaying media gallery of reports
const PhotoModal: React.FC<Props> = ({ photoModal, onClose, reportInfo }) => {
    const [downloadingAll, setDownloadingAll] = React.useState(false);
    const [downloadingIndex, setDownloadingIndex] = React.useState<number | null>(null);
    const [abortController, setAbortController] = React.useState<AbortController | null>(null);
    const [previewMedia, setPreviewMedia] = React.useState<{ mediaPath: string; mediaUrl: string; isVideo: boolean; index: number } | null>(null);

    // Cleanup function untuk membersihkan ongoing downloads saat komponen unmount
    React.useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    // Fungsi untuk membuat nama file yang sesuai format
    const generateFileName = (index: number, extension: string = 'jpg'): string => {
        const sessionId = reportInfo?.sessionId || 'Unknown';
        const userName = reportInfo?.userName || 'Unknown';
        const mediaNumber = index + 1;
        
        // Buat format tanggal DDMMYY dari hari ini
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2); // Ambil 2 digit terakhir
        const dateString = `${day}${month}${year}`;
        
        // Bersihkan nama user dari karakter yang tidak valid untuk nama file
        const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_');
        
        return `${dateString}_${cleanUserName}_(${mediaNumber})_${sessionId}.${extension}`;
    };

    // Fungsi untuk mengekstrak ekstensi file dari URL
    const getFileExtension = (url: string): string => {
        const match = url.match(/\.([^.?]+)(\?|$)/);
        return match ? match[1] : 'jpg';
    };

    // Handler untuk menutup modal ketika klik di backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handler untuk menutup preview modal
    const handlePreviewClose = () => {
        setPreviewMedia(null);
    };

    // Handler untuk navigasi preview (previous/next)
    const handlePreviewNavigation = (direction: 'prev' | 'next') => {
        if (!previewMedia) return;
        
        const currentIndex = previewMedia.index;
        let newIndex: number;
        
        if (direction === 'prev') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : photoModal.length - 1;
        } else {
            newIndex = currentIndex < photoModal.length - 1 ? currentIndex + 1 : 0;
        }
        
        const newMedia = photoModal[newIndex];
        const newMediaPath = extractAndValidatePhotoPath(newMedia);
        
        // Skip if media path is invalid
        if (!newMediaPath) {
            return; // Skip setting preview for invalid media
        }
        
        const newMediaUrl = constructPhotoUrl(newMediaPath);
        const newIsVideo = newMediaPath.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi)$/);
        
        setPreviewMedia({
            mediaPath: newMediaPath,
            mediaUrl: newMediaUrl,
            isVideo: !!newIsVideo,
            index: newIndex
        });
    };

    // Fungsi untuk download semua media satu per satu
    const downloadAllPhotos = async () => {
        if (!photoModal || photoModal.length === 0) {
            alert('Tidak ada media untuk didownload');
            return;
        }

        setDownloadingAll(true);
        
        // Create master abort controller for the entire operation
        const masterController = new AbortController();
        setAbortController(masterController);

        for (let i = 0; i < photoModal.length; i++) {
            // Check if operation was cancelled
            if (masterController.signal.aborted) {
                break;
            }
            
            setDownloadingIndex(i);
            
            // Extract media path safely
            const mediaPath = extractAndValidatePhotoPath(photoModal[i]);
            
            // Skip media if path is invalid
            if (!mediaPath) {
                console.warn(`Download skipped for invalid media path at index ${i}:`, photoModal[i]);
                continue;
            }
            
            // Build media URL safely
            const mediaUrl = constructPhotoUrl(mediaPath);
            
            // Create individual AbortController for timeout management
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Download timeout for photo ${i + 1} after 10 seconds`);
                controller.abort();
            }, 10000); // Reduced to 10 seconds timeout
            
            try {
                // Fetch media as blob with timeout
                const response = await fetch(mediaUrl, {
                    signal: controller.signal,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Accept': 'image/*,*/*;q=0.8',
                        'User-Agent': 'Mozilla/5.0 (compatible; LaporAA-App/1.0)',
                    },
                    mode: 'cors',
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    // Try direct download fallback
                    console.warn(`HTTP ${response.status} for media ${i + 1}, trying direct download`);
                    window.open(mediaUrl, '_blank');
                    continue;
                }
                
                const blob = await response.blob();
                
                // Buat URL object untuk blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Generate nama file sesuai format yang diminta
                const fileExtension = getFileExtension(mediaPath);
                const fileName = generateFileName(i, fileExtension);
                
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
                
                // Delay sejenak antara download untuk menghindari browser blocking
                if (i < photoModal.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                clearTimeout(timeoutId);
                
                // Note: errorMessage variable removed as it was unused
                const isAbortError = error instanceof Error && error.name === 'AbortError';
                
                if (isAbortError) {
                    console.warn(`Download timeout for media ${i + 1} after 10 seconds`);
                    // Just continue to next media silently
                } else {
                    console.error(`Error downloading media ${i + 1}:`, error);
                    // Don't show alert to user to prevent disruption
                }
                
                // Continue to next media even if one fails
                continue;
            }
        }

        setDownloadingAll(false);
        setDownloadingIndex(null);
        setAbortController(null);
    };

    return (
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10000,
                padding: '1rem'
            }}
        >
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
                style={{
                    width: '100%',
                    maxWidth: '56rem',
                    maxHeight: '90vh',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Tombol close dengan styling yang lebih baik */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors z-10"
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}
                >
                    ✕
                </button>

                {/* Header dengan judul dan tombol download */}
                <div className="flex justify-between items-center mb-6 pr-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Media Laporan ({photoModal.length} media)
                    </h2>
                    
                    {/* Tombol Download All */}
                    <div className="flex gap-2">
                        {downloadingAll && (
                            <button
                                onClick={() => {
                                    if (abortController) {
                                        abortController.abort();
                                        setDownloadingAll(false);
                                        setDownloadingIndex(null);
                                        setAbortController(null);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium rounded-lg border border-red-300 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                title="Batalkan download"
                            >
                                ✕ Batalkan
                            </button>
                        )}
                        
                        <button
                            onClick={downloadAllPhotos}
                            disabled={downloadingAll}
                            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                downloadingAll 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            title={downloadingAll ? "Sedang mendownload..." : "Download semua media satu per satu"}
                        >
                            {downloadingAll ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {downloadingIndex !== null ? `Downloading ${downloadingIndex + 1}/${photoModal.length}` : 'Downloading...'}
                                </>
                            ) : (
                                <>
                                    <FaDownload className="w-4 h-4" />
                                    Download Semua
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Galeri media dengan grid yang responsif */}
                <div 
                    className="grid gap-4"
                    style={{
                        display: 'grid',
                        gap: '1rem',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                    }}
                >
                    {photoModal.map((media, index) => {
                        // Extract media path safely - handle both string and object formats
                        const mediaPath = extractAndValidatePhotoPath(media);
                        
                        // Skip media if path is invalid
                        if (!mediaPath) {
                            console.warn(`PhotoModal: Invalid media path at index ${index}:`, media);
                            return null;
                        }
                        
                        // Build media URL safely
                        const mediaUrl = constructPhotoUrl(mediaPath);
                        
                        // Determine media type
                        const isVideo = mediaPath.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi)$/);
                        const isImage = !isVideo; // Default to image if not video
                        
                        // Fungsi download untuk media individual
                        const downloadSinglePhoto = async () => {
                            // Create AbortController for timeout management
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
                            
                            try {
                                // Fetch media as blob with timeout
                                const response = await fetch(mediaUrl, {
                                    signal: controller.signal,
                                    headers: {
                                        'Cache-Control': 'no-cache',
                                        'Accept': 'image/*,video/*,*/*;q=0.8',
                                        'User-Agent': 'Mozilla/5.0 (compatible; LaporAA-App/1.0)',
                                    },
                                    mode: 'cors',
                                });
                                
                                clearTimeout(timeoutId);
                                
                                if (!response.ok) {
                                    // Fallback: open in new tab if fetch fails
                                    console.warn(`HTTP ${response.status} for media download, opening in new tab`);
                                    window.open(mediaUrl, '_blank');
                                    return;
                                }
                                
                                const blob = await response.blob();
                                
                                // Buat URL object untuk blob
                                const blobUrl = window.URL.createObjectURL(blob);
                                
                                // Generate nama file sesuai format yang diminta
                                const fileExtension = getFileExtension(mediaPath);
                                const fileName = generateFileName(index, fileExtension);
                                
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
                            } catch (error) {
                                clearTimeout(timeoutId);
                                
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                const isAbortError = error instanceof Error && error.name === 'AbortError';
                                
                                if (isAbortError) {
                                    console.error(`Download timeout for media:`, error);
                                    alert(`Download media timeout setelah 30 detik. Silakan coba lagi.`);
                                } else {
                                    console.error(`Error downloading media:`, error);
                                    alert(`Gagal mendownload media: ${errorMessage}`);
                                }
                            }
                        };
                        
                        return (
                            <div 
                                key={index}
                                className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 group"
                                style={{
                                    aspectRatio: '4/3',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#f9fafb'
                                }}
                            >
                                {isVideo ? (
                                    <div 
                                        className="relative w-full h-full cursor-pointer"
                                        onClick={() => {
                                            console.log('Setting preview for video:', { mediaPath, mediaUrl, index });
                                            setPreviewMedia({ mediaPath, mediaUrl, isVideo: true, index });
                                        }}
                                    >
                                        <VideoDisplay
                                            photoPath={mediaPath}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Video play icon overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg pointer-events-none">
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="w-full h-full cursor-pointer"
                                        onClick={() => {
                                            console.log('Setting preview for image:', { mediaPath, mediaUrl, index });
                                            setPreviewMedia({ mediaPath, mediaUrl, isVideo: false, index });
                                        }}
                                    >
                                        <PhotoDisplay
                                            photoPath={mediaPath}
                                            alt={`Media ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={() => {
                                                console.error('Failed to load media:', mediaPath);
                                            }}
                                        />
                                    </div>
                                )}
                                
                                {/* Download button di pojok kanan atas */}
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await downloadSinglePhoto();
                                    }}
                                    className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black z-10"
                                    title={`Download ${isVideo ? 'video' : 'media'} ini`}
                                >
                                    <FaDownload className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Preview Media */}
            {previewMedia && (
                <div 
                    className="fixed inset-0 z-[20000] flex items-center justify-center bg-black bg-opacity-90 p-4"
                    onClick={handlePreviewClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 20000,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)'
                    }}
                >
                    <div 
                        className="relative max-w-7xl max-h-[95vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handlePreviewClose}
                            className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200"
                        >
                            ✕
                        </button>

                        {/* Navigation buttons */}
                        {photoModal.length > 1 && (
                            <>
                                <button
                                    onClick={() => handlePreviewNavigation('prev')}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => handlePreviewNavigation('next')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200"
                                >
                                    →
                                </button>
                            </>
                        )}

                        {/* Media content */}
                        <div className="flex items-center justify-center w-full h-full">
                            {previewMedia.isVideo ? (
                                <video
                                    src={previewMedia.mediaUrl}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[95vh] object-contain rounded-lg"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '95vh',
                                        objectFit: 'contain'
                                    }}
                                    onError={() => {
                                        console.error('Failed to load video in preview:', previewMedia.mediaUrl);
                                        console.error('Original mediaPath:', previewMedia.mediaPath);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Zoom>
                                        <PhotoDisplay
                                            photoPath={previewMedia.mediaPath}
                                            alt={`Media ${previewMedia.index + 1}`}
                                            className="max-w-full max-h-[95vh] object-contain rounded-lg cursor-zoom-in"
                                            onError={() => {
                                                console.error('Failed to load image in preview:', previewMedia.mediaUrl);
                                                console.error('Original mediaPath:', previewMedia.mediaPath);
                                            }}
                                        />
                                    </Zoom>
                                </div>
                            )}
                        </div>

                        {/* Media info */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                            {previewMedia.index + 1} dari {photoModal.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoModal;
