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
    if (!sessionId) return null;

    const [data, setData] = useState<Data | null>(null);
    const [activeTab, setActiveTab] = useState<"pesan" | "profile" | "keluhan" | "tindakan">("keluhan");
    const [formData, setFormData] = useState({ situasi: "", status: "" });

    // Fetch initial data
    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/reports/${sessionId}`);
            setData(res.data || null);

            if (res.data?.tindakan?.[0]) {
                setFormData({
                    situasi: res.data.tindakan[0].situasi,
                    status: res.data.tindakan[0].status,
                });
            }
        } catch (err) {
            console.error("❌ Gagal ambil data:", err);
            setData(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sessionId]);

    // Auto-save handler
    const handleFormChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        setFormData(updated);

        if (!data?._id || !data?.tindakan?.[0]?._id) return;

        try {
            await axios.post(`${API_URL}/tindakan`, {
                ...data.tindakan[0],
                [name]: value,
                reportId: data._id,
                createdAt: data.tindakan[0].createdAt,
                updatedAt: new Date().toISOString(),
            });

            await fetchData(); // Refresh data
        } catch (err) {
            console.error("❌ Gagal update data:", err);
        }
    };

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
                        <select
                            name="situasi"
                            value={formData.situasi}
                            onChange={handleFormChange}
                            className="col-span-3 border p-2 text-gray-700 rounded-md"
                        >
                            <option value="Verifikasi Data">Verifikasi Data</option>
                            <option value="Darurat">Darurat</option>
                            <option value="Permintaan Informasi">Permintaan Informasi</option>
                            <option value="Berpengawasan">Berpengawasan</option>
                            <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleFormChange}
                            className="col-span-3 border p-2 text-gray-700 rounded-md"
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
