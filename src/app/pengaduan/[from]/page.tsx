"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Message from "./components/message";
import Profile from "./components/profile";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderAddress: string;
    senderStatus: string;
}

export default function ChatPage() {
    const params = useParams() as { from?: string };
    const from = params?.from;
    if (!from) return null; // atau loading state

    const [data, setData] = useState<Data[]>([]);
    const [activeTab, setActiveTab] = useState<"message" | "profile">("message");

    useEffect(() => {
        axios
            .get(`${API_URL}/chat`)
            .then((res) => {
                // Pastikan isi dari res.data itu array
                const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];
                setData(responseData);
                console.log("✅ res.data:", res.data);
            })
            .catch((err) => {
                console.error(err);
                setData([]); // fallback safe
            });
    }, []);

    const selectedUser = data.find((item) => item._id === from);

    return (
        <div className="w-full h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                    <div>
                        <p className="font-semibold text-gray-800">{selectedUser?.senderName}</p>
                        <p className="text-sm text-gray-500">{selectedUser?._id}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {/* Flag untuk Situasi */}
                    <div className="bg-gray-200 text-sm rounded-full px-4 py-1">Berpengawasan</div>
                    {/* Flag untuk Status */}
                    <div className="bg-gray-200 text-sm rounded-full px-4 py-1">Verifikasi</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6 bg-white">
                <button
                    className={`py-2 px-4 font-medium ${activeTab === "message" ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
                    onClick={() => setActiveTab("message")}
                >
                    Message
                </button>
                <button
                    className={`py-2 px-4 font-medium ${activeTab === "profile" ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
                    onClick={() => setActiveTab("profile")}
                >
                    Profile
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "message" ? <Message from={from} /> : <Profile from={from} />}
            </div>
        </div>
    );
}
