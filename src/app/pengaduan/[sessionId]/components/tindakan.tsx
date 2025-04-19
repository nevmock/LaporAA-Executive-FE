"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
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

export default function Tindakan({ _id }: { _id: string }) {
    const [data, setData] = useState<Data[]>([]);
    const [formData, setFormData] = useState<Partial<Data>>({});
    const [originalData, setOriginalData] = useState<Partial<Data>>({});
    const [tempPhotos, setTempPhotos] = useState<File[]>([]);
    const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const maxPhotos = 5;

    useEffect(() => {
        axios
            .get(`${API_URL}/tindakan/${_id}`)
            .then((res) => {
                const responseData = Array.isArray(res.data) ? res.data : [];
                setData(responseData);
                if (responseData.length > 0) {
                    setFormData(responseData[0]);
                    setOriginalData(responseData[0]);
                }
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData([]);
            });
    }, [_id]);

    useEffect(() => {
        const escListener = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowModal(false);
        };
        window.addEventListener("keydown", escListener);
        return () => window.removeEventListener("keydown", escListener);
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).slice(0, maxPhotos - (formData.photos?.length || 0));
        setTempPhotos((prev) => [...prev, ...newFiles]);
    };

    const handleRemovePhoto = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos?.filter((_, i) => i !== index),
        }));
    };

    const handleCancel = () => {
        setFormData(originalData);
        setTempPhotos([]);
    };

    const handleSave = async () => {
        try {
            let uploadedPaths: string[] = [];

            if (tempPhotos.length > 0) {
                const formDataUpload = new FormData();
                tempPhotos.forEach((file) => formDataUpload.append("photos", file));

                const res = await axios.post(`${API_URL}/api/upload-tindakan`, formDataUpload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                uploadedPaths = res.data.paths || [];
            }

            const newEntry = {
                ...formData,
                photos: [...(formData.photos || []), ...uploadedPaths].slice(0, maxPhotos),
                reportId: _id,
                createdAt: formData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const response = await axios.post(`${API_URL}/tindakan`, newEntry);
            setData((prev) => [response.data, ...prev]);
            setOriginalData(response.data);
            setFormData(response.data);
            setTempPhotos([]);
        } catch (err) {
            console.error("❌ Gagal menyimpan:", err);
        }
    };

    const handlers = useSwipeable({
        onSwipedLeft: () =>
            setActivePhotoIndex((prev) =>
                prev < (formData.photos?.length || 0) - 1 ? prev + 1 : 0
            ),
        onSwipedRight: () =>
            setActivePhotoIndex((prev) =>
                prev > 0 ? prev - 1 : (formData.photos?.length || 0) - 1
            ),
        trackMouse: true,
    });

    if (data.length === 0) {
        return <p className="text-center text-gray-500">Memuat data tindakan...</p>;
    }

    const history = data.slice(1);
    const visibleHistory = history.slice(0, visibleHistoryCount);

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800">
            {/* Form */}
            <div className="mb-6 border-b pb-4">
                <h2 className="text-lg font-medium mb-4">Data Terbaru</h2>
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <label className="col-span-1 font-medium">OPD Terkait</label>
                    <input name="opd" value={formData.opd || ""} onChange={handleFormChange} className="col-span-3 border p-2 rounded-md" />

                    <label className="col-span-1 font-medium">Kesimpulan</label>
                    <textarea name="kesimpulan" value={formData.kesimpulan || ""} onChange={handleFormChange} className="col-span-3 border p-2 rounded-md" />

                    <label className="col-span-1 font-medium">Hasil</label>
                    <textarea name="hasil" value={formData.hasil || ""} onChange={handleFormChange} className="col-span-3 border p-2 rounded-md" />

                    <label className="col-span-1 font-medium">Bukti Foto</label>
                    <div className="col-span-3 flex gap-2 flex-wrap">
                        {(formData.photos || []).map((photo, index) => (
                            <div key={index} className="relative w-24 h-24">
                            <img
                                src={`${API_URL}${photo}`}
                                className="w-full h-full object-cover rounded-md cursor-pointer"
                                onClick={() => {
                                    setActivePhotoIndex(index);
                                    setShowModal(true);
                                }}
                            />
                            <button
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                onClick={(e) => {
                                    e.stopPropagation(); // Biar nggak buka modal saat klik ✕
                                    handleRemovePhoto(index);
                                }}
                            >
                                ✕
                            </button>
                        </div>                        
                        ))}
                        {(formData.photos?.length || 0) + tempPhotos.length < maxPhotos && (
                            <label className="w-24 h-24 border-dashed border-2 border-gray-400 flex items-center justify-center rounded-md cursor-pointer">
                                <span className="text-gray-500 text-xl">+</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handlePhotoSelect(e.target.files)}
                                    className="hidden"
                                />
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

            {/* History */}
            <div>
                <h2 className="text-lg font-medium mb-4">History</h2>
                {visibleHistory.map((item) => (
                    <div key={item._id} className="mb-6 border-b pb-4">
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <p className="col-span-1 font-medium">OPD Terkait</p>
                            <p className="col-span-3">: {item.opd}</p>

                            <p className="col-span-1 font-medium">Kesimpulan</p>
                            <p className="col-span-3">: {item.kesimpulan}</p>

                            <p className="col-span-1 font-medium">Hasil</p>
                            <p className="col-span-3">: {item.hasil}</p>

                            <p className="col-span-1 font-medium">Situasi</p>
                            <p className="col-span-3">: {item.situasi}</p>

                            <p className="col-span-1 font-medium">Status</p>
                            <p className="col-span-3">: {item.status}</p>

                            <p className="col-span-1 font-medium">Tanggal Diperbarui</p>
                            <p className="col-span-3">: {new Date(item.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {visibleHistoryCount < history.length && (
                    <div className="text-center">
                        <button className="text-blue-600 hover:underline text-sm" onClick={() => setVisibleHistoryCount((prev) => prev + 3)}>
                            Tampilkan lebih banyak...
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Galeri */}
            {showModal && formData.photos && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <div
                        className="relative bg-white rounded-md p-4 max-w-lg w-[90%] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-3 text-gray-600 hover:text-black text-lg"
                        >
                            ✕
                        </button>

                        <div {...handlers}>
                            <Zoom>
                                <img
                                    src={`${API_URL}${formData.photos[activePhotoIndex]}`}
                                    className="w-full h-96 object-contain rounded-md cursor-zoom-in"
                                    alt={`Foto ${activePhotoIndex + 1}`}
                                />
                            </Zoom>
                        </div>

                        <div className="flex justify-between mt-4 text-sm font-medium">
                            <button
                                onClick={() =>
                                    setActivePhotoIndex((prev) =>
                                        prev > 0 ? prev - 1 : formData.photos!.length - 1
                                    )
                                }
                                className="text-blue-600 hover:underline"
                            >
                                ←
                            </button>
                            <span>
                                Foto {activePhotoIndex + 1} dari {formData.photos.length}
                            </span>
                            <button
                                onClick={() =>
                                    setActivePhotoIndex((prev) =>
                                        prev < formData.photos!.length - 1 ? prev + 1 : 0
                                    )
                                }
                                className="text-blue-600 hover:underline"
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}