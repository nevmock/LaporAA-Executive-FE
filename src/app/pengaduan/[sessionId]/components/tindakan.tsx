"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    sessionId: string;
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderAddress: string;
    senderStatus: string;
}

export default function Tindakan({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<Data | null>(null); // Ubah menjadi objek, bukan array

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                const responseData = res.data || null; // Pastikan respons adalah objek
                console.info("✅ Tindakan data:", responseData);
                setData(responseData);
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null); // fallback safe
            });
    }, [sessionId]);

    if (!data) {
        return <p className="text-center text-gray-500">Memuat data tindakan...</p>;
    }

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800">
            <div className="grid grid-cols-4 gap-2 mb-4">
                <p className="col-span-1 font-medium">Kesimpulan</p>
                <div className="col-span-3">
                    <div className="w-full max-w-sm h-48 bg-gray-300 rounded-md" />
                </div>

                <p className="col-span-1 font-medium">Hasil Tindakan</p>
                <div className="col-span-3">
                    <div className="w-full max-w-sm h-48 bg-gray-300 rounded-md" />
                </div>
            </div>
        </div>
    );
}