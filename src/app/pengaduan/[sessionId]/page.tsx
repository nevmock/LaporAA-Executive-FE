"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Message from "./components/message";
import Profile from "./components/profile";
import Tindakan from "./components/tindakan";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface TindakanData {
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
}

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
    tindakan?: TindakanData;
}

export default function ChatPage() {
    const params = useParams() as { sessionId?: string };
    const sessionId = params?.sessionId;
    const router = useRouter();

    const [data, setData] = useState<Data | null>(null);
    const [activeTab, setActiveTab] = useState<"pesan" | "profile" | "tindakan">("tindakan");

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/reports/${sessionId}`);
            setData(res.data);
        } catch (err) {
            console.error("❌ Gagal ambil data:", err);
            setData(null);
        }
    };

    useEffect(() => {
        if (sessionId) fetchData();
    }, [sessionId]);

    if (!sessionId) return null;

    return (
        <div className="w-full h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/pengaduan")}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <div>
                        <p className="font-semibold text-gray-800">{data?.user?.name}</p>
                        <p className="text-sm text-gray-500">+{data?.from}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6 bg-white">
                {["tindakan", "profile", "pesan"].map((tab) => (
                    <button
                        key={tab}
                        className={`py-2 px-4 font-medium ${
                            activeTab === tab ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"
                        }`}
                        onClick={() => setActiveTab(tab as any)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "pesan" ? (
                    <Message from={data?.from || ""} />
                ) : activeTab === "profile" ? (
                    <Profile sessionId={sessionId} />
                ) : (
                    <Tindakan tindakan={data?.tindakan || null} sessionId={sessionId} />
                )}
            </div>
        </div>
    );
}
