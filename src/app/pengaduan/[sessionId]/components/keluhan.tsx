"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("./MapViews"), { ssr: false }); // ⛔️ SSR-safe


const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    sessionId: string;
    message: string;
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
    photos: string[];
}

export default function Keluhan({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<Data | null>(null); // Ubah menjadi objek, bukan array

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                const responseData = res.data || null; // Pastikan respons adalah objek
                console.info("✅ Keluhan data:", responseData);
                setData(responseData);
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null); // fallback safe
            });
    }, [sessionId]);

    if (!data) {
        return <p className="text-center text-gray-500">Memuat data keluhan...</p>;
    }

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800 space-y-6">
            <div className="grid grid-cols-4 gap-2">
                <p className="col-span-1 font-medium">Keluhan</p>
                <p className="col-span-3">: {data.message}</p>
    
                <p className="col-span-1 font-medium">Lokasi</p>
                <div className="col-span-3">
                <MapView
                    lat={data.location.latitude}
                    lon={data.location.longitude}
                    description={data.location.description}
                />
                </div>
    
                <p className="col-span-1 font-medium">Foto</p>
                <div className="col-span-3 flex gap-2 flex-wrap">
                    {data.photos.length > 0 ? (
                        data.photos.map((photo, index) => (
                            <img
                                key={index}
                                src={photo}
                                alt={`Foto ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-md"
                            />
                        ))
                    ) : (
                        <p className="text-gray-500">Tidak ada foto</p>
                    )}
                </div>
            </div>
        </div>
    );    
}