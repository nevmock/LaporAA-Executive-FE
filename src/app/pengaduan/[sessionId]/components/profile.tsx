"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    sessionId: string;
    from: string;
    user: {
        _id: string;
        name: string;
        nik: string;
        address: string;
        email: string;
        reportHistory: string[];
    };
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
    status: string;
}

export default function Profile({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<Data | null>(null); // Ubah menjadi objek, bukan array

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                const responseData = res.data || null; // Pastikan respons adalah objek
                console.info("✅ Profile data:", responseData);
                setData(responseData);
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null); // fallback safe
            });
    }, [sessionId]);

    if (!data) {
        return <p className="text-center text-gray-500">Memuat data profil...</p>;
    }

    return (
        <div className="bg-gray-50 px-6 py-4 text-sm text-gray-800 border-l w-70 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Profil Pelapor</h2>
    
            <div className="space-y-3">
                <div className="flex">
                    <p className="w-28 font-medium">Nama</p>
                    <p>: {data.user.name}</p>
                </div>
                <div className="flex">
                    <p className="w-28 font-medium">NIK</p>
                    <p>: {data.user.nik}</p>
                </div>
                <div className="flex">
                    <p className="w-28 font-medium">Alamat</p>
                    <p>: {data.user.address}</p>
                </div>
                <div className="flex">
                    <p className="w-28 font-medium">No. Telepon</p>
                    <p>: {data.from}</p>
                </div>
                
            </div>
        </div>
    );       
}