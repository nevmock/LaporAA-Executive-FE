"use client";

import React from "react";

interface Props {
    photoModal: string[];     // Daftar path foto relatif dari backend
    onClose: () => void;      // Fungsi untuk menutup modal
}

// Komponen modal untuk menampilkan galeri foto laporan
const PhotoModal: React.FC<Props> = ({ photoModal, onClose }) => {
    const baseUrl = process.env.NEXT_PUBLIC_BE_BASE_URL;

    // Handler untuk menutup modal ketika klik di backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
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

                {/* Judul */}
                <h2 className="mb-6 text-xl font-semibold text-gray-800 pr-10">
                    Foto Laporan
                </h2>

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
                        const fullUrl = `${baseUrl}${url}`;
                        return (
                            <div 
                                key={index}
                                className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                                style={{
                                    aspectRatio: '4/3',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#f9fafb'
                                }}
                            >
                                <img
                                    src={fullUrl}
                                    alt={`Foto ${index + 1}`}
                                    className="h-full w-full object-cover cursor-pointer transition-transform hover:scale-105"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease-in-out'
                                    }}
                                    onClick={() => window.open(fullUrl, "_blank")}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `
                                                <div style="
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    height: 100%;
                                                    color: #6b7280;
                                                    font-size: 0.875rem;
                                                ">
                                                    Gambar tidak dapat dimuat
                                                </div>
                                            `;
                                        }
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PhotoModal;
