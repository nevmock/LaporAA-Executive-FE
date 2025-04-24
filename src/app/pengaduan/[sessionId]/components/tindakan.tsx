"use client";
import { useEffect, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import axios from "axios";
import Keluhan from "./keluhan";

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

const STATUS_LIST = [
    "Perlu Verifikasi",
    "Sedang di Verifikasi",
    "Proses Penyelesaian",
    "Selesai",
    "Proses Penyelesaian Ulang"
];

export default function Tindakan({
    tindakan,
    sessionId,
    onTindakanSaved
}: {
    tindakan: TindakanData | null;
    sessionId: string;
    onTindakanSaved?: () => void;
}) {
    const [formData, setFormData] = useState<Partial<TindakanData>>({});
    const [tempPhotos, setTempPhotos] = useState<File[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const maxPhotos = 5;

    useEffect(() => {
        if (tindakan) {
            setFormData(tindakan);
            console.info("✅ Data tindakan dimuat:", tindakan);
        }
    }, [tindakan]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        setFormData(updated);
        console.info("📝 Form diubah:", updated);
    };

    const handlePhotoSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).slice(0, maxPhotos - (formData.photos?.length || 0));
        setTempPhotos((prev) => [...prev, ...newFiles]);
        console.info("🖼️ Foto ditambahkan:", newFiles);
    };

    const handleRemovePhoto = (index: number) => {
        const updatedPhotos = formData.photos?.filter((_, i) => i !== index) || [];
        setFormData((prev) => ({ ...prev, photos: updatedPhotos }));
        console.info("❌ Foto dihapus, sisa:", updatedPhotos);
    };

    const handleCancel = () => {
        setTempPhotos([]);
        console.info("🚫 Upload foto dibatalkan");
    };

    const handleSave = async () => {
        try {
            console.info("🔄 Proses simpan dimulai...");
            let uploadedPaths: string[] = [];

            if (tempPhotos.length > 0) {
                const formDataUpload = new FormData();
                tempPhotos.forEach((file) => formDataUpload.append("photos", file));
                const res = await axios.post(`${API_URL}/api/upload-tindakan`, formDataUpload, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                uploadedPaths = res.data.paths || [];
                console.info("📤 Foto berhasil diupload:", uploadedPaths);
            }

            const updatedData = {
                ...formData,
                photos: [...(formData.photos || []), ...uploadedPaths].slice(0, maxPhotos),
                updatedAt: new Date().toISOString()
            };

            await axios.put(`${API_URL}/tindakan/${formData.report}`, updatedData);
            console.info("✅ Data berhasil disimpan:", updatedData);

            setFormData(updatedData);
            setTempPhotos([]);
            onTindakanSaved?.();
        } catch (err) {
            console.error("❌ Gagal menyimpan:", err);
        }
    };

    const handlers = useSwipeable({
        onSwipedLeft: () =>
            setActivePhotoIndex((prev) => (prev < (formData.photos?.length || 0) - 1 ? prev + 1 : 0)),
        onSwipedRight: () =>
            setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : (formData.photos?.length || 0) - 1)),
        trackMouse: true
    });

    const currentStatusIndex = STATUS_LIST.indexOf(formData.status || "");

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800 space-y-6">
            {/* Progress */}
            <div>
                <h2 className="text-lg font-medium mb-2">Progress Tindakan</h2>
                <div className="flex justify-between items-center">
                    {STATUS_LIST.map((status, idx) => {
                        const current = formData.status === status;
                        const done = currentStatusIndex > idx;

                        return (
                            <div key={status} className="flex-1 flex flex-col items-center text-xs relative">
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10
                  ${current ? "bg-green-700 text-white" : done ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}
                `}>
                                    {idx + 1}
                                </div>
                                <span className={`mt-1 text-center ${current ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                                    {status}
                                </span>
                                {idx < STATUS_LIST.length - 1 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-1 ${done ? "bg-green-500" : "bg-gray-300"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Keluhan */}
            <div className="border-b pb-4">
                <Keluhan sessionId={sessionId} />
            </div>

            {/* Form */}
            <div className="border-b pb-4">
                <h2 className="text-lg font-medium mb-4">Data Tindakan</h2>
                <div className="grid grid-cols-4 gap-2 mb-4">

                    <label className="col-span-1 font-medium">Situasi</label>
                    <select name="situasi" value={formData.situasi || ""} onChange={handleFormChange} className="col-span-3 border p-2 rounded-md">
                        <option value="Verifikasi Data">Verifikasi Data</option>
                        <option value="Darurat">Darurat</option>
                        <option value="Permintaan Informasi">Permintaan Informasi</option>
                        <option value="Berpengawasan">Berpengawasan</option>
                        <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                    </select>

                    <label className="col-span-1 font-medium">Status</label>
                    <select name="status" value={formData.status || ""} onChange={handleFormChange} className="col-span-3 border p-2 rounded-md">
                        {STATUS_LIST.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>

                    <label className="col-span-1 font-medium">OPD Terkait</label>
                    <input
                        name="opd"
                        value={formData.opd || ""}
                        onChange={handleFormChange}
                        className={`col-span-3 border p-2 rounded-md ${!formData.opd ? "bg-yellow-100" : ""
                            }`}
                    />

                    <label className="col-span-1 font-medium">Kesimpulan</label>
                    <textarea
                        name="kesimpulan"
                        value={formData.kesimpulan || ""}
                        onChange={handleFormChange}
                        className={`col-span-3 border p-2 rounded-md ${!formData.kesimpulan ? "bg-yellow-100" : ""
                            }`}
                    />

                    <label className="col-span-1 font-medium">Foto Tindakan</label>
                    <div className="col-span-3 flex gap-2 flex-wrap">
                        {(formData.photos || []).map((photo, index) => (
                            <div key={index} className="relative w-24 h-24">
                                <img src={`${API_URL}${photo}`} className="w-full h-full object-cover rounded-md cursor-pointer"
                                    onClick={() => {
                                        setActivePhotoIndex(index);
                                        setShowModal(true);
                                    }}
                                />
                                <button className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto(index);
                                    }}
                                >✕</button>
                            </div>
                        ))}
                        {(formData.photos?.length || 0) + tempPhotos.length < maxPhotos && (
                            <label className="w-24 h-24 border-dashed border-2 border-gray-400 flex items-center justify-center rounded-md cursor-pointer">
                                <span className="text-gray-500 text-xl">+</span>
                                <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoSelect(e.target.files)} className="hidden" />
                            </label>
                        )}
                        {tempPhotos.map((file, index) => (
                            <div key={`temp-${index}`} className="w-24 h-24 bg-gray-300 flex items-center justify-center text-xs text-gray-600 rounded-md">
                                {file.name}
                            </div>
                        ))}
                    </div>

                    <label className="col-span-1 font-medium">Tanggal Diperbarui</label>
                    <p className="col-span-3">{new Date(formData.updatedAt || "").toLocaleString()}</p>

                </div>

                <div className="flex justify-end gap-2">
                    <button className="bg-gray-500 text-white px-4 py-2 rounded-md" onClick={handleCancel}>Batalkan</button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded-md" onClick={handleSave}>Simpan</button>
                </div>
            </div>



            {/* Modal Zoom */}
            {showModal && formData.photos && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <div className="relative bg-white rounded-md p-4 max-w-lg w-[90%] shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowModal(false)} className="absolute top-2 right-3 text-gray-600 hover:text-black text-lg">✕</button>
                        <div {...handlers}>
                            <Zoom>
                                <img src={`${API_URL}${formData.photos[activePhotoIndex]}`} className="w-full h-96 object-contain rounded-md cursor-zoom-in" />
                            </Zoom>
                        </div>
                        <div className="flex justify-between mt-4 text-sm font-medium">
                            <button onClick={() => setActivePhotoIndex((prev) => prev > 0 ? prev - 1 : formData.photos!.length - 1)} className="text-blue-600 hover:underline">←</button>
                            <span>Foto {activePhotoIndex + 1} dari {formData.photos.length}</span>
                            <button onClick={() => setActivePhotoIndex((prev) => prev < formData.photos!.length - 1 ? prev + 1 : 0)} className="text-blue-600 hover:underline">→</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
