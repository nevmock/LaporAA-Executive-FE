"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamic import komponen MapPopup karena menggunakan fitur yang tidak bisa di-render di server
const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

// Tipe properti yang dibutuhkan oleh komponen MapModal
interface Props {
    selectedLoc: {
        lat: number;     // Latitude dari lokasi yang dipilih
        lon: number;     // Longitude dari lokasi yang dipilih
        desa: string;    // Nama desa untuk ditampilkan dan deskripsi map
    };
    onClose: () => void; // Fungsi untuk menutup modal
}

// Komponen MapModal akan menampilkan popup peta lokasi pengaduan
const MapModal: React.FC<Props> = ({ selectedLoc, onClose }) => {
    // Handler untuk menutup modal ketika klik di backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // Overlay latar belakang hitam transparan dengan fixed positioning yang lebih robust
        <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50 p-4"
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
                zIndex: 1000,
                padding: '1rem'
            }}
        >
            {/* Kontainer utama modal dengan ukuran yang lebih responsif */}
            <div 
                className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
                style={{
                    maxHeight: '90vh',
                    width: '100%',
                    maxWidth: '32rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Tombol tutup modal dengan styling yang lebih baik */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
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
                        justifyContent: 'center'
                    }}
                >
                    ✕
                </button>

                {/* Judul modal, menampilkan nama desa */}
                <h2 className="mb-4 text-xl font-semibold text-gray-800 pr-8">
                    {selectedLoc.desa}
                </h2>

                {/* Tombol buka Google Maps */}
                <div className="mb-4">
                    <button
                        onClick={() => {
                            const url = `https://www.google.com/maps?q=${selectedLoc.lat},${selectedLoc.lon}&z=17`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Buka di Google Maps
                    </button>
                </div>

                {/* Container untuk peta dengan aspect ratio yang tetap */}
                <div 
                    className="w-full overflow-hidden rounded-lg border border-gray-200"
                    style={{
                        aspectRatio: '16/9',
                        minHeight: '300px'
                    }}
                >
                    {/* Komponen MapPopup yang menampilkan peta berdasarkan lat & lon */}
                    <MapPopup
                        lat={selectedLoc.lat}
                        lon={selectedLoc.lon}
                        description={selectedLoc.desa}
                    />
                </div>
            </div>
        </div>
    );
};

export default MapModal;
