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
    return (
        // Overlay latar belakang hitam transparan
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
            {/* Kontainer utama modal */}
            <div className="relative w-[90%] max-w-md rounded-lg bg-white p-4 shadow-lg">
                {/* Tombol tutup modal */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-2 text-lg text-gray-700 hover:text-black"
                >
                    ✕
                </button>

                {/* Judul modal, menampilkan nama desa */}
                <h2 className="mb-2 text-lg font-semibold">{selectedLoc.desa}</h2>

                {/* Komponen MapPopup yang menampilkan peta berdasarkan lat & lon */}
                <MapPopup
                    lat={selectedLoc.lat}
                    lon={selectedLoc.lon}
                    description={selectedLoc.desa}
                />
            </div>
        </div>
    );
};

export default MapModal;
