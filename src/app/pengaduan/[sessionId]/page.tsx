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
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderAddress: string;
    senderStatus: string;
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
                    {/* Situasi Dropdown */}
                    <div className="flex flex-col">
                        <label htmlFor="situasi" className="text-sm text-gray-700 mb-1">
                            Situasi
                        </label>
                        <select
                            id="situasi"
                            className="bg-gray-200 text-sm rounded-full px-4 py-1 focus:outline-none"
                            defaultValue="Berpengawasan"
                        >
                            <option value="Darurat">Darurat</option>
                            <option value="Permintaan Informasi">Permintaan Informasi</option>
                            <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                            <option value="Berpengawasan">Berpengawasan</option>
                        </select>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col">
                        <label htmlFor="status" className="text-sm text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            className="bg-gray-200 text-sm rounded-full px-4 py-1 focus:outline-none"
                            defaultValue="Verifikasi Data"
                        >
                            <option value="Verifikasi Data">Verifikasi Data</option>
                            <option value="Dalam Proses">Dalam Proses</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Proses Ulang">Proses Ulang</option>
                        </select>
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
                        <Message from={data?.from || ""} /> // Gunakan `from` dari objek
                    ) : activeTab === "profile" ? (
                        <Profile sessionId={sessionId} />
                    ) : activeTab === "keluhan" ? (
                        <Keluhan sessionId={sessionId} />
                    ) : (
                        <Tindakan sessionId={sessionId} />
                    )
                }
            </div>
        </div>
    );
}