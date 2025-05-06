"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icon bawaan Leaflet (tanpa ini marker akan invisible)
// Removed invalid property '_getIconUrl' as it does not exist on 'L.Icon.Default.prototype'
L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapPopup = ({ lat, lon, description }: { lat: number; lon: number; description: string }) => (
    <div className="w-full h-[300px] z-0">
        <MapContainer center={[lat, lon]} zoom={17} scrollWheelZoom={false} className="w-full h-full z-0">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[lat, lon]}>
                <Popup>{description}</Popup>
            </Marker>
        </MapContainer>
    </div>
);

export default MapPopup;
