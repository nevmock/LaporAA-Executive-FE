"use client";
import { useEffect, useState } from "react";
import axios from "../../../../../utils/axiosInstance";
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

export default function Profile({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<Data | null>(null);

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

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                const responseData = res.data || null;
                setData(responseData);
                if (responseData) {
                    setEditedName(responseData.user.name);
                    setEditedSex(responseData.user.jenis_kelamin);
                }
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null);
            });
    }, [sessionId]);

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

    return (
        <div className="bg-gray-50 px-6 py-4 text-sm text-gray-800 border-l w-70 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Profil Pelapor</h2>
            <div className="space-y-3">
                <div className="flex">
                    <p className="w-28 font-medium">
                        Nama
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
                    </p>
                    <p>
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <textarea
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 text-sm resize-y"
                                    rows={3}
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
                            `: ${data.user.name}`
                        )}
                    </p>
                </div>
                <div className="flex">
                    <p className="w-28 font-medium">
                        Jenis Kelamin
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
                    </p>
                    <p>
                        {isEditingSex ? (
                        <div className="flex items-center gap-2">
                            <textarea
                                value={editedSex}
                                onChange={(e) => setEditedSex(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-sm resize-y"
                                rows={3}
                            />
                            <button
                                onClick={saveSex}
                                disabled={isSavingSex}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                                {isSavingSex ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    ) : (
                        `: ${data.user.jenis_kelamin}`
                    )}
                    </p>
                </div>
                <div className="flex">
                    <p className="w-28 font-medium">No. Telepon</p>
                    <p>: {data.from}</p>
                </div>
            </div>
        </div>
    );
}