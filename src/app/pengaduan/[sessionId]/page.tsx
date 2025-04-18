"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Message from "./components/message";
import Profile from "./components/profile";
import Keluhan from "./components/keluhan";
import Tindakan from "./components/tindakan";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    from: string;
    sessionId: string;
    user: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
    message: string;
    photos: string[];
    tindakan: [{
        _id: string;
        report: string;
        hasil: string;
        kesimpulan: string;
        situasi: string;
        status: string;
        opd: string;
        photos: string[];
        createdAt: string;
        updatedAt: string;
    }];
}

export default function ChatPage() {
    const params = useParams() as { sessionId?: string };
    const sessionId = params?.sessionId;
    if (!sessionId) return null; // atau loading state

    const [data, setData] = useState<Data | null>(null); // Ubah menjadi objek, bukan array
    const [activeTab, setActiveTab] = useState<"pesan" | "profile" | "keluhan" | "tindakan">("keluhan");

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                const responseData = res.data || null; // Pastikan respons adalah objek
                console.info("✅ page data:", responseData);
                setData(responseData);
            })
            .catch((err) => {
                console.error(err);
                setData(null); // fallback safe
            });
    }, [sessionId]);

    return (
        <div className="w-full h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                    <div>
                        <p className="font-semibold text-gray-800">{data?.user?.name}</p>
                        <p className="text-sm text-gray-500">+{data?.from}</p>
                    </div>
                </div>
                <div className="flex gap-6 items-end">
                    {/* Situasi */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-700 mb-1">Situasi</label>
                        <p className="text-sm text-gray-800">{data?.tindakan?.[0]?.situasi || "Tidak ada data"}</p>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-700 mb-1">Status</label>
                        <p className="text-sm text-gray-800">{data?.tindakan?.[0]?.status || "Tidak ada data"}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6 bg-white">
                <button
                    className={`py-2 px-4 font-medium ${activeTab === "pesan" ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
                    onClick={() => setActiveTab("pesan")}
                >
                    Pesan
                </button>
                <button
                    className={`py-2 px-4 font-medium ${activeTab === "profile" ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
                    onClick={() => setActiveTab("profile")}
                >
                    Profile
                </button>
                <button
                    className={`py-2 px-4 font-medium ${activeTab === "keluhan" ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
                    onClick={() => setActiveTab("keluhan")}
                >
                    Keluhan
                </button>
                <button
                    className={`py-2 px-4 font-medium ${activeTab === "tindakan" ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
                    onClick={() => setActiveTab("tindakan")}
                >
                    Tindakan
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {
                    activeTab === "pesan" ? (
                        <Message from={data?.from || ""} />
                    ) : activeTab === "profile" ? (
                        <Profile sessionId={sessionId} />
                    ) : activeTab === "keluhan" ? (
                        <Keluhan sessionId={sessionId} />
                    ) : (
                        <Tindakan _id={data?._id || ""} />
                    )
                }
            </div>
        </div>
    );
}