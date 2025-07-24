"use client";

import React from "react";
import { FaDownload } from "react-icons/fa";
import SmartImage from "../common/SmartImage";

interface Props {
    photoModal: string[];     // Daftar path foto relatif dari backend
    onClose: () => void;      // Fungsi untuk menutup modal
    reportInfo?: {            // Info tambahan untuk penamaan file
        sessionId?: string;
        userName?: string;
    };
}

// Komponen modal untuk menampilkan galeri foto laporan
const PhotoModal: React.FC<Props> = ({ photoModal, onClose, reportInfo }) => {
    const baseUrl = process.env.NEXT_PUBLIC_BE_BASE_URL;
    const [downloadingAll, setDownloadingAll] = React.useState(false);
    const [downloadingIndex, setDownloadingIndex] = React.useState<number | null>(null);
    const [abortController, setAbortController] = React.useState<AbortController | null>(null);

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
        const photoNumber = index + 1;
        
        // Buat format tanggal DDMMYY dari hari ini
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2); // Ambil 2 digit terakhir
        const dateString = `${day}${month}${year}`;
        
        // Bersihkan nama user dari karakter yang tidak valid untuk nama file
        const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_');
        
        return `${dateString}_${cleanUserName}_(${photoNumber})_${sessionId}.${extension}`;
    };

    // Fungsi untuk mengekstrak ekstensi file dari URL
    const getFileExtension = (url: string): string => {
        const match = url.match(/\.([^.?]+)(\?|$)/);
        return match ? match[1] : 'jpg';
    };

    // Fungsi untuk mengekstrak nama file dari path
    const extractFileName = (path: string): string => {
        const parts = path.split('/');
        return parts[parts.length - 1];
    };

    // Fungsi untuk konstruksi URL foto dengan multiple fallbacks
    const constructPhotoUrl = (photoPath: string): string[] => {
        if (!baseUrl) {
            return [photoPath]; // Return original path if no baseUrl
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const fileName = extractFileName(photoPath);
        
        // Jika sudah URL lengkap, return as is
        if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
            return [photoPath];
        }

        // Daftar kemungkinan path yang akan dicoba
        const possiblePaths = [
            // Path asli
            photoPath.startsWith('/') ? photoPath : `/${photoPath}`,
            
            // Path dengan uploads prefix jika belum ada
            photoPath.includes('/uploads/') 
                ? (photoPath.startsWith('/') ? photoPath : `/${photoPath}`)
                : `/uploads/${photoPath.replace(/^\//, '')}`,
            
            // Path langsung di folder uploads dengan nama file saja
            `/uploads/${fileName}`,
            
            // Kemungkinan sub-folder umum dalam uploads
            `/uploads/images/${fileName}`,
            `/uploads/photos/${fileName}`,
            `/uploads/reports/${fileName}`,
            `/uploads/pengaduan/${fileName}`,
            
            // Kemungkinan dengan struktur tahun/bulan
            ...((() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                return [
                    `/uploads/${year}/${month}/${fileName}`,
                    `/uploads/${year}/${fileName}`,
                ];
            })()),
            
            // Fallback ke path original tanpa processing
            photoPath
        ];

        // Remove duplicates dan construct full URLs
        const uniquePaths = [...new Set(possiblePaths)];
        return uniquePaths.map(path => `${cleanBaseUrl}${path}`);
    };

    // Fungsi untuk mencoba load gambar dari multiple URLs
    const tryLoadImage = async (urls: string[]): Promise<string> => {
        for (const url of urls) {
            try {
                const response = await fetch(url, { 
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });
                if (response.ok) {
                    console.log(`✅ Found image at: ${url}`);
                    return url;
                }
            } catch (error) {
                console.log(`❌ Failed to load: ${url}`);
                continue;
            }
        }
        
        // Jika semua gagal, return URL pertama sebagai fallback
        console.warn(`⚠️ All URLs failed, using fallback: ${urls[0]}`);
        return urls[0];
    };

    // Handler untuk menutup modal ketika klik di backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Fungsi untuk download semua foto satu per satu
    const downloadAllPhotos = async () => {
        if (!photoModal || photoModal.length === 0) {
            alert('Tidak ada foto untuk didownload');
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
            
            // Construct photo URL with multiple fallbacks
            let photoUrl: string;
            try {
                const photoPath = photoModal[i];
                const possibleUrls = constructPhotoUrl(photoPath);
                photoUrl = await tryLoadImage(possibleUrls);
            } catch (error) {
                console.error(`Error constructing URL for photo ${i + 1}:`, error);
                // Fallback ke konstruksi sederhana
                const photoPath = photoModal[i];
                if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
                    photoUrl = photoPath;
                } else {
                    const cleanBaseUrl = baseUrl?.replace(/\/$/, '') || '';
                    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
                    photoUrl = `${cleanBaseUrl}${cleanPath}`;
                }
            }
            
            // Create individual AbortController for timeout management
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Download timeout for photo ${i + 1} after 10 seconds`);
                controller.abort();
            }, 10000); // Reduced to 10 seconds timeout
            
            try {
                // Fetch gambar sebagai blob dengan timeout
                const response = await fetch(photoUrl, {
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
                    console.warn(`HTTP ${response.status} for photo ${i + 1}, trying direct download`);
                    window.open(photoUrl, '_blank');
                    continue;
                }
                
                const blob = await response.blob();
                
                // Buat URL object untuk blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Generate nama file sesuai format yang diminta
                const fileExtension = getFileExtension(photoModal[i]);
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
                
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isAbortError = error instanceof Error && error.name === 'AbortError';
                
                if (isAbortError) {
                    console.warn(`Download timeout for photo ${i + 1} after 10 seconds`);
                    // Just continue to next photo silently
                } else {
                    console.error(`Error downloading photo ${i + 1}:`, error);
                    // Don't show alert to user to prevent disruption
                }
                
                // Continue to next photo even if one fails
                continue;
            }
        }

        setDownloadingAll(false);
        setDownloadingIndex(null);
        setAbortController(null);
    };

    // Fungsi download individual photo yang menggunakan SmartImage logic
    const downloadIndividualPhoto = async (photoPath: string, index: number) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
            // Construct photo URL using the same logic as SmartImage
            const possibleUrls = constructPhotoUrl(photoPath);
            const workingUrl = await tryLoadImage(possibleUrls);
            
            const response = await fetch(workingUrl, {
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
                console.warn(`HTTP ${response.status} for photo download, opening in new tab`);
                window.open(workingUrl, '_blank');
                return;
            }
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const fileExtension = getFileExtension(photoPath);
            const fileName = generateFileName(index, fileExtension);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            clearTimeout(timeoutId);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isAbortError = error instanceof Error && error.name === 'AbortError';
            
            if (isAbortError) {
                console.error(`Download timeout for photo:`, error);
                alert(`Download foto timeout setelah 30 detik. Silakan coba lagi.`);
            } else {
                console.error(`Error downloading photo:`, error);
                alert(`Gagal mendownload foto: ${errorMessage}`);
            }
        }
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
                        Foto Laporan ({photoModal.length} foto)
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
                            title={downloadingAll ? "Sedang mendownload..." : "Download semua foto satu per satu"}
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

                {/* Galeri gambar dengan grid yang responsif */}
                <div 
                    className="grid gap-4"
                    style={{
                        display: 'grid',
                        gap: '1rem',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                    }}
                >
                    {photoModal.map((url, index) => {
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
                                <SmartImage
                                    src={url}
                                    alt={`Foto ${index + 1}`}
                                    className="h-full w-full object-cover cursor-pointer transition-transform hover:scale-105"
                                    width={300}
                                    height={225}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease-in-out'
                                    }}
                                    onClick={() => window.open(url, "_blank")}
                                    fallbackText="Foto tidak dapat dimuat"
                                    showDirectLink={true}
                                />
                                
                                {/* Overlay dengan tombol download individual */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            // Gunakan path asli untuk download
                                            await downloadIndividualPhoto(url, index);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 px-3 py-2 bg-white text-gray-800 text-xs font-medium rounded-lg shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Download foto ini"
                                    >
                                        <FaDownload className="w-3 h-3 inline mr-1" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PhotoModal;
