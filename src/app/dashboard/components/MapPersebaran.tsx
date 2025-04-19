"use client";
import { useEffect, useState } from "react";
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

export default function MapPersebaran() {
    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/reports`)
            .then((res) => setReports(res.data || []))
            .catch((err) => {
                console.error("❌ Gagal ambil data laporan:", err);
            });
    }, []);

    // Icon default Leaflet fix (supaya marker muncul di Next.js)
    useEffect(() => {
        (L.Icon.Default as any).mergeOptions({
            iconUrl: "/leaflet/marker-icon.png",
            iconRetinaUrl: "/leaflet/marker-icon-2x.png",
            shadowUrl: "/leaflet/marker-shadow.png",
        });
    }, []);

    return (
        <div className="w-full h-[300px] rounded-xl overflow-hidden shadow">
            <MapContainer
                center={[-6.9175, 107.6191]} // Koordinat default Bandung
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
                    >
                        <Popup>
                            <strong>{report.sessionId}</strong><br />
                            {report.message}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
