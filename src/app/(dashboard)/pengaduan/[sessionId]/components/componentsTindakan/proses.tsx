"use client";
import { useRef, useState } from "react";
import { TindakanClientState } from "../../../../../../lib/types";
import axios from "axios";
import { Plus } from "lucide-react";
import OPDSelect from "./opdSelect"

const MAX_PHOTOS = 5;
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function Proses({
    data,
    onChange,
    onConfirmChange
}: {
    data: Partial<TindakanClientState>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanClientState>>>;
    onConfirmChange?: (val: boolean) => void;
}) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [newKesimpulan, setNewKesimpulan] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    // Tambah Kesimpulan
    const handleAddKesimpulan = async () => {
        if (!newKesimpulan.trim() || !data._id) return;
        try {
            const res = await axios.post(`${API_URL}/tindakan/${data._id}/kesimpulan`, {
                text: newKesimpulan.trim(),
            });
            onChange(prev => ({ ...prev, kesimpulan: res.data.kesimpulan }));
            setNewKesimpulan("");
        } catch (err) {
            console.error("❌ Gagal menambahkan kesimpulan:", err);
        }
    };

    // Edit Kesimpulan
    const handleEditKesimpulan = async (index: number, newText: string) => {
        if (!data._id || !newText.trim()) return;
        try {
            const res = await axios.put(`${API_URL}/tindakan/${data._id}/kesimpulan/${index}`, {
                text: newText.trim(),
            });
            onChange(prev => ({ ...prev, kesimpulan: res.data.kesimpulan }));
        } catch (err) {
            console.error("❌ Gagal mengedit kesimpulan:", err);
        }
    };

    // Hapus Kesimpulan
    const handleDeleteKesimpulan = async (index: number) => {
        if (!data._id) return;
        try {
            const res = await axios.delete(`${API_URL}/tindakan/${data._id}/kesimpulan/${index}`);
            onChange(prev => ({ ...prev, kesimpulan: res.data.kesimpulan }));
        } catch (err) {
            console.error("❌ Gagal menghapus kesimpulan:", err);
        }
    };

    // Upload Foto
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).slice(0, MAX_PHOTOS - (data.photos?.length || 0));
        if (files.length === 0) return;

        setLoading(true);
        try {
            const formDataUpload = new FormData();
            files.forEach(file => formDataUpload.append("photos", file));

            const res = await axios.post(`${API_URL}/api/upload-tindakan`, formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const uploadedPaths: string[] = res.data.paths || [];
            onChange(prev => ({
                ...prev,
                photos: [...(prev.photos || []), ...uploadedPaths].slice(0, MAX_PHOTOS)
            }));
        } catch (err) {
            console.error("❌ Gagal upload foto:", err);
        }
        setLoading(false);
    };

    const handleRemovePhoto = (index: number) => {
        const updated = (data.photos || []).filter((_, i) => i !== index);
        onChange(prev => ({ ...prev, photos: updated }));
    };

    if (!isConfirmed) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
                <h3 className="text-md font-semibold text-yellow-800 mb-2">Konfirmasi Data SP4N Lapor</h3>
                <p className="text-sm text-gray-700">
                    Apakah laporan yang ada di SP4N Lapor sudah ditindak lanjuti?<br />
                    Klik tombol di bawah ini untuk mulai mengisi data tindak lanjut yang sudah tersedia di halaman SP4N Lapor.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => window.open(`${data.url}`, "_blank")}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                    >
                        Buka Laporan SP4N Lapor
                    </button>

                    <button
                        onClick={() => {
                            setIsConfirmed(true);
                            onConfirmChange?.(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                    >
                        Ya, Tindak Lanjut Sudah Tersedia di SP4N Lapor
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-2">
            {/* ✅ Kesimpulan */}
            <div className="col-span-4">
                <h3 className="font-semibold text-gray-700 mb-2">Tindak Lanjut</h3>
                <div className="mt-3 mb-3">
                    <button
                        onClick={() => window.open(`${data.url}`, "_blank")}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                    >
                        Buka Laporan SP4N Lapor
                    </button>
                </div>

                <ul className="space-y-2">
                    {/* Form Terdisposisi ke */}
                    <div className="grid grid-cols-4 items-center gap-2">
                        <div className="col-span-1">
                            <span className="font-medium text-gray-700">Terdisposisi ke</span><br />
                            <span className="font-small text-gray-500">(Salin dari SP4N Lapor)</span>
                        </div>
                        <div className="col-span-3">
                            <input
                                name="disposisi"
                                value={data.disposisi || ""}
                                onChange={handleChange}
                                className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-grey-700 focus:ring-yellow-400 focus:border-yellow-500"
                                placeholder="Tempel atau Ketik informasi disposisi dari SP4N Lapor"
                            />
                        </div>
                    </div>

                    {/* Form OPD */}
                    <div className="grid grid-cols-4 items-start gap-2">
                        <label className="col-span-1 font-medium text-gray-700 mt-2">OPD Terkait</label>
                        <div className="col-span-3">
                            <OPDSelect value={data.opd || ""} onChange={(val) => onChange((prev) => ({ ...prev, opd: val }))} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-2">
                        <div className="col-span-1">
                            <span className="font-medium text-gray-800">Status Laporan SP4N Lapor</span><br />
                            <span className="text-sm text-gray-500">(Salin dari SP4N Lapor)</span>
                        </div>
                        <div className="col-span-3">
                            <select
                                name="status_laporan"
                                value={data.status_laporan || ""}
                                onChange={handleChange}
                                className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md focus:ring-yellow-400 focus:border-yellow-500"
                            >
                                <option value="">-- Pilih Status --</option>
                                <option value="Menunggu Verifikasi Admin">Menunggu Verifikasi Admin</option>
                                <option value="Sedang Diproses OPD Terkait">Sedang Diproses OPD Terkait</option>
                                <option value="Telah Diproses OPD Terkait">Telah Diproses OPD Terkait</option>
                            </select>
                        </div>
                    </div>

                    
                    {/* Tindak Lanjut List */}
                    <ul className="relative border-l-2 border-yellow-300 pl-6">
                        <span className="font-medium text-gray-800">Tindak Lanjut:</span>    
                        {data.kesimpulan?.map((item: any, idx: number) => (
                            <li key={idx} className="mb-5 mt-3 relative">
                                {/* Titik bulat */}
                                {/* <span className="absolute -left-7 top-5 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full z-10"></span> */}

                                <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-md shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-500">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                        <div className="flex gap-2 text-xs">
                                            <button
                                                className="text-blue-600 hover:underline"
                                                onClick={() => {
                                                    const updated = prompt("Edit Tindak Lanjut:", item.text);
                                                    if (updated && updated.trim()) {
                                                        handleEditKesimpulan(idx, updated);
                                                    }
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-red-600 hover:underline"
                                                onClick={() => {
                                                    if (confirm("Yakin ingin menghapus tindak lanjut ini?")) {
                                                        handleDeleteKesimpulan(idx);
                                                    }
                                                }}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-700">{item.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </ul>

                {/* ➕ Tambah Kesimpulan */}
                <div className="mt-4">
                    <textarea
                        value={newKesimpulan}
                        onChange={(e) => setNewKesimpulan(e.target.value)}
                        rows={3}
                        className="w-full border border-yellow-300 bg-yellow-50 p-2 rounded-md placeholder:text-grey-700 focus:ring-yellow-400 focus:border-yellow-500 "
                        placeholder="Tempel atau Ketik Tindak Lanjut dari Halaman SP4N Lapor . . . . "
                    />
                    <button
                        onClick={handleAddKesimpulan}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1"
                    >Simpan Tindak Lanjut
                    </button>
                </div>
            </div>

            {/* 📸 Upload Foto */}
            <label className="col-span-1 font-medium">Foto Pendukung
                <span className="text-red-500">*</span>
                <p className="text-gray-500">(Evidence Tindak Lanjut dari SP4N Lapor)</p>
            </label>
            <div className="col-span-3 space-y-2">
                <div className="flex gap-2 flex-wrap">
                    {(data.photos || []).map((photo, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-md overflow-hidden border border-yellow-300">
                            <img
                                src={`${API_URL}${photo}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => handleRemovePhoto(idx)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* Tombol Upload */}
                    {(data.photos?.length || 0) < MAX_PHOTOS && (
                        <div
                            onClick={() => !loading && fileRef.current?.click()}
                            className={`w-24 h-24 border-2 border-yellow-300 bg-yellow-50 border-dashed rounded-md flex items-center justify-center cursor-pointer transition
                                ${loading ? "border-yellow-300 bg-yellow-50" : "hover:border-green-500 hover:bg-green-50"}`}
                        >
                            {loading ? (
                                <span className="text-xs text-gray-500">Mengunggah...</span>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500 text-xs">
                                    <Plus className="w-5 h-5" />
                                    <span>Tambah</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                ref={fileRef}
                                onChange={handlePhotoSelect}
                            />
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500">Maksimal {MAX_PHOTOS} foto</p>
            </div>
        </div>
    );
}
