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
    return (
        <div className="w-full h-[300px] z-0">
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
                    <Popup>{description}</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapPopup;
