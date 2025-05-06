"use client";
import { useRef, useState } from "react";
import { TindakanClientState } from "../../../../../../lib/types";
import axios from "axios";
import { Plus } from "lucide-react";

const MAX_PHOTOS = 5;
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function Proses({
    data,
    onChange
}: {
    data: Partial<TindakanClientState>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanClientState>>>;
}) {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange(prev => ({ ...prev, [name]: value }));
    };

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

    return (
        <div className="grid grid-cols-4 gap-2">
            <label className="col-span-1 font-medium">Kesimpulan Tindakan
                <span className="text-red-500">*</span>
                <p className="text-gray-500">(Update Jika ada Informasi Terbaru dari SP4N Lapor)</p>
            </label>
            <textarea
                name="kesimpulan"
                value={data.kesimpulan || ""}
                onChange={handleChange}
                className="col-span-3 border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                rows={4}
                placeholder="Tulis kesimpulan tindakan dari SP4N Lapor di sini..."
            />


            <label className="col-span-1 font-medium">Foto Pendukung
                <span className="text-red-500">*</span>
                <p className="text-gray-500">(Evidence Tindakan dari SP4N Lapor)</p>
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
