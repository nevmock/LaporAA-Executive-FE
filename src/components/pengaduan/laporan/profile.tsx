"use client";
import { useEffect, useState } from "react";
import axios from "../../../utils/axiosInstance";
import { useRouter } from "next/navigation";

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
        jenis_kelamin: string;
        reportHistory: string[];
    };
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
    status: string;
}

export default function Profile({ sessionId, data: propData }: { sessionId: string; data?: any }) {
    const [data, setData] = useState<Data | null>(propData || null);

    // Editable states and edit mode toggles
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingSex, setIsEditingSex] = useState(false);

    const [editedName, setEditedName] = useState("");
    const [editedSex, setEditedSex] = useState("");

    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingSex, setIsSavingSex] = useState(false);

    const [saveNameSuccess, setSaveNameSuccess] = useState(false);
    const [saveSexSuccess, setSaveSexSuccess] = useState(false);

    const [saveError, setSaveError] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Teks berhasil disalin ke clipboard");
        });
    };

    // Sync state jika propData berubah
    useEffect(() => {
        if (propData) {
            setData(propData);
            setEditedName(propData.user?.name || "");
            setEditedSex(propData.user?.jenis_kelamin || "");
        }
    }, [propData]);

    // Hapus useEffect fetch data utama

    // Save name update
    const saveName = async () => {
        if (!data) return;
        setIsSavingName(true);
        setSaveError(null);
        try {
            await axios.put(`${API_URL}/reports/${sessionId}`, {
                ...data,
                name: editedName,
            });
            setData((prev) => prev ? { ...prev, name: editedName } : prev);
            setSaveNameSuccess(true);
            setIsEditingName(false);
            setTimeout(() => setSaveNameSuccess(false), 2000);
        } catch (error) {
            setSaveError("Gagal menyimpan Isi Laporan.");
        } finally {
            setIsSavingName(false);
        }
    };

    // Save sex update
    const saveSex = async () => {
        if (!data) return;
        setIsSavingSex(true);
        setSaveError(null);
        try {
            await axios.put(`${API_URL}/reports/${sessionId}`, {
                ...data,
                jenis_kelamin: editedSex,
            });
            setData((prev) => prev ? { ...prev, jenis_kelamin: editedSex } : prev);
            setSaveSexSuccess(true);
            setIsEditingSex(false);
            setTimeout(() => setSaveSexSuccess(false), 2000);
        } catch (error) {
            setSaveError("Gagal menyimpan Isi Laporan.");
        } finally {
            setIsSavingSex(false);
        }
    };

    useEffect(() => {
        if (saveError) {
            alert(saveError);
            setSaveError(null);
        }
    }, [saveError]);

    if (!data) {
        return <p className="text-center text-gray-500">Memuat data profil...</p>;
    }

    // Layout seragam dengan Keluhan
    const rows = [
        {
            label: "Nama Pelapor",
            value: isEditingName ? (
                <div className="flex items-center gap-2">
                    <textarea
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                    <button
                        onClick={saveName}
                        disabled={isSavingName}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                        {isSavingName ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            ) : (
                data.user.name
            ),
            action: (
                <>
                    <button
                        onClick={() => setIsEditingName((prev) => !prev)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                        {isEditingName ? "Batal" : "Edit"}
                    </button>
                    <button
                        onClick={() => copyToClipboard(editedName)}
                        className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                    >
                        Salin
                    </button>
                </>
            )
        },
        {
            label: "Jenis Kelamin",
            value: isEditingSex ? (
                <div className="flex items-center gap-2">
                    <select
                        value={editedSex}
                        onChange={(e) => setEditedSex(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                    >
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="pria">pria</option>
                        <option value="wanita">wanita</option>
                    </select>
                    <button
                        onClick={saveSex}
                        disabled={isSavingSex}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                        {isSavingSex ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            ) : (
                data.user.jenis_kelamin || "-"
            ),
            action: (
                <>
                    <button
                        onClick={() => setIsEditingSex((prev) => !prev)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                        {isEditingSex ? "Batal" : "Edit"}
                    </button>
                    <button
                        onClick={() => copyToClipboard(editedSex)}
                        className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                    >
                        Salin
                    </button>
                </>
            )
        },
        {
            label: "No. Telepon",
            value: data.from,
            action: (
                <button
                    onClick={() => copyToClipboard(data.from)}
                    className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                >
                    Salin
                </button>
            )
        }
    ];

    return (
        <div className="border rounded-md overflow-hidden">
            <div className="border-b px-6 py-3 bg-gray-50">
                <h2 className="text-base font-semibold">Profil Pelapor</h2>
            </div>
            <div>
                {rows.map((item, index) => (
                    <div
                        key={index}
                        className={`grid grid-cols-12 items-center px-4 py-3 border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                        <div className="col-span-3 font-medium">{item.label}</div>
                        <div className="col-span-7 break-words">{item.value}</div>
                        <div className="col-span-2 flex gap-1 justify-end">{item.action}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}