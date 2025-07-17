"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
// import "leaflet/dist/leaflet.css"; // Moved to globals.css

// Fix icon leaflet (tanpa ini marker invisible)
L.Icon.Default.prototype.options.iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
L.Icon.Default.prototype.options.iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
L.Icon.Default.prototype.options.shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const MapView = ({
    lat,
    lon,
    description
}: {
    lat: number;
    lon: number;
    description: string;
}) => {
    // Function to open Google Maps
    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps?q=${lat},${lon}&z=17`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="w-full h-72 rounded-md overflow-hidden z-0 relative group">
            {/* Button to open Google Maps */}
            <button
                onClick={openGoogleMaps}
                className="absolute top-2 right-2 z-[100] bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
                title="Buka di Google Maps"
            >
                <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Google Maps
                </div>
            </button>

            {/* Overlay for click-to-open functionality */}
            <div 
                className="absolute inset-0 z-[60] bg-transparent cursor-pointer hover:bg-black hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center"
                onClick={openGoogleMaps}
                title="Klik untuk membuka di Google Maps"
            >
                <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg pointer-events-none">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Klik untuk buka di Google Maps
                    </div>
                </div>
            </div>

            <MapContainer center={[lat, lon]} zoom={17} scrollWheelZoom={false} className="h-full w-full z-[50]">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
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

export default MapView;
