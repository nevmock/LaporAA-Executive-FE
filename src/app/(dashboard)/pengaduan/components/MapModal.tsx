"use client";

import React from "react";
import dynamic from "next/dynamic";

const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

interface Props {
    selectedLoc: {
        lat: number;
        lon: number;
        desa: string;
    };
    onClose: () => void;
}

const MapModal: React.FC<Props> = ({ selectedLoc, onClose }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-[90%] max-w-md rounded-lg bg-white p-4 shadow-lg">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-2 text-lg text-gray-700 hover:text-black"
                >
                    ✕
                </button>
                <h2 className="mb-2 text-lg font-semibold">{selectedLoc.desa}</h2>
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
