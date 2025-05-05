"use client";
import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Report {
    _id: string;
    sessionId: string;
    message: string;
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
}

const customIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export default function MapPersebaran() {
    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/reports`)
            .then((res) => setReports(res.data || []))
            .catch((err) => {
                console.error("❌ Gagal ambil data laporan:", err);
            });
    }, []);

    // Hitung center rata-rata dari semua lokasi
    const mapCenter = useMemo<[number, number]>(() => {
        const filtered = reports.filter((r) => r?.location?.latitude && r?.location?.longitude);
        if (filtered.length === 0) return [0, 0];

        const avgLat = filtered.reduce((sum, r) => sum + r.location.latitude, 0) / filtered.length;
        const avgLon = filtered.reduce((sum, r) => sum + r.location.longitude, 0) / filtered.length;

        return [avgLat, avgLon];
    }, [reports]);

    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow">
            {reports.length > 0 ? (
                <MapContainer
                    center={mapCenter}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {reports.map((report) => (
                        <Marker
                            key={report._id}
                            position={[report.location.latitude, report.location.longitude]}
                            icon={customIcon}
                        >
                            <Popup>
                                <strong>{report.sessionId}</strong><br />
                                {report.message}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            ) : (
                <div className="p-6 text-center text-gray-500">Sedang memuat peta...</div>
            )}
        </div>
    );
}