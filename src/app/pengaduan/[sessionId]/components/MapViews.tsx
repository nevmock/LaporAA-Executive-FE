"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
}) => (
    <div className="w-full h-72 rounded-md overflow-hidden z-0">
        <MapContainer center={[lat, lon]} zoom={17} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[lat, lon]}>
                <Popup>{description}</Popup>
            </Marker>
        </MapContainer>
    </div>
);

export default MapView;
