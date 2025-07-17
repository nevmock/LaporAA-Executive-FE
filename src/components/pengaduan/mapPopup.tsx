"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
// import "leaflet/dist/leaflet.css"; // Moved to globals.css

// 🔧 Fix bug ikon invisible pada Leaflet (penting untuk SSR di Next.js)
L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🧩 Props type untuk posisi dan deskripsi marker
interface MapPopupProps {
    lat: number;          // Latitude lokasi
    lon: number;          // Longitude lokasi
    description: string;  // Deskripsi yang ditampilkan pada popup marker
}

// 📍 Komponen MapPopup – digunakan untuk menampilkan peta lokasi
const MapPopup: React.FC<MapPopupProps> = ({ lat, lon, description }) => {
    // Function to open Google Maps
    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps?q=${lat},${lon}&z=17`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="w-full h-[300px] z-0 relative group">
            {/* Overlay untuk menunjukkan bahwa peta bisa diklik */}
            <div 
                className="absolute inset-0 z-10 bg-transparent cursor-pointer group-hover:bg-black group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center"
                onClick={openGoogleMaps}
                title="Klik untuk membuka di Google Maps"
            >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Buka di Google Maps
                    </div>
                </div>
            </div>
            
            <MapContainer
                center={[lat, lon]}
                zoom={17}
                scrollWheelZoom={false}
                className="w-full h-full z-0"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[lat, lon]}>
                    <Popup>
                        <div className="text-center">
                            <p className="font-medium mb-2">{description}</p>
                            <button
                                onClick={openGoogleMaps}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                Google Maps
                            </button>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapPopup;
