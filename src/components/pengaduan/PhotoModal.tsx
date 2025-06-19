"use client";

import React from "react";

interface Props {
    photoModal: string[];
    onClose: () => void;
}

const PhotoModal: React.FC<Props> = ({ photoModal, onClose }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative max-h-[90%] w-[90%] max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
                {/* Tombol close */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-2 text-lg text-gray-700 hover:text-black"
                >
                    ✕
                </button>

                {/* Judul */}
                <h2 className="mb-3 text-lg font-semibold">Foto Laporan</h2>

                {/* Galeri gambar */}
                <div className="grid grid-cols-2 gap-4">
                    {photoModal.map((url, index) => (
                        <img
                            key={index}
                            src={`${process.env.NEXT_PUBLIC_BE_BASE_URL}${url}`}
                            alt={`Foto ${index + 1}`}
                            className="max-h-60 w-full rounded border border-gray-300 object-cover cursor-pointer"
                            onClick={() =>
                                window.open(`${process.env.NEXT_PUBLIC_BE_BASE_URL}${url}`, "_blank")
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PhotoModal;
