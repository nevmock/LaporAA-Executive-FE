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
        <div className="p-6 bg-gray-100 text-sm text-gray-800">
            <div className="grid grid-cols-4 gap-2 mb-4">
                <p className="col-span-1 font-medium">Nama</p>
                <p className="col-span-3">: {data.user.name}</p>

                <p className="col-span-1 font-medium">KTP</p>
                <p className="col-span-3">: {data.user.nik}</p>

                <p className="col-span-1 font-medium">Nomor Telepon</p>
                <p className="col-span-3">: {data.from}</p>

                <p className="col-span-1 font-medium">Email</p>
                <p className="col-span-3">: {data.user.email}</p>

                <p className="col-span-1 font-medium">Alamat</p>
                <p className="col-span-3">: {data.user.address}</p>

                <p className="col-span-1 font-medium">Status</p>
                <p className="col-span-3">: {data.status}</p>
            </div>
        </div>
    );
}