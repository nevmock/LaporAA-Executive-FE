"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { TindakanClientState } from "../../../../lib/types";
import axios from "../../../../utils/axiosInstance";
import { Plus, FileText, Video, Download } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import OPDSelect from "./opdSelect"
import { RiSave3Fill } from "react-icons/ri";

const MAX_MEDIA = 5;
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface SaveDataFunction {
    (nextStatus?: string): Promise<unknown>;
}

interface KesimpulanItem {
    text: string;
    timestamp: string;
}

export default function Proses({
    data,
    onChange,
    onConfirmChange,
    saveData,
}: {
    data: Partial<TindakanClientState>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanClientState>>>;
    onConfirmChange?: (val: boolean) => void;
    saveData?: SaveDataFunction;
}) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [newKesimpulan, setNewKesimpulan] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isFormSaving, setIsFormSaving] = useState(false); // Separate state for form save
    const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
    const [saveMessage, setSaveMessage] = useState("Data berhasil disimpan. Dan dikirimkan kepada Warga");
    const [initialData, setInitialData] = useState<Partial<TindakanClientState>>({});
    const [hasFormChanges, setHasFormChanges] = useState(false);

    // Track initial form data for change detection
    useEffect(() => {
        if (data && Object.keys(data).length > 0 && Object.keys(initialData).length === 0) {
            setInitialData({ ...data });
        }
    }, [data, initialData]);

    // Check for form changes whenever data changes
    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            const opdChanged = JSON.stringify(initialData.opd) !== JSON.stringify(data.opd);
            const statusChanged = initialData.status_laporan !== data.status_laporan;
            const photosChanged = JSON.stringify(initialData.photos) !== JSON.stringify(data.photos);

            setHasFormChanges(opdChanged || statusChanged || photosChanged);
            console.log("Form has changes:", opdChanged || statusChanged || photosChanged);
        }
    }, [data, initialData]);

    // Safety timeout to prevent infinite loading state
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;
        if (isSaving || isFormSaving) {
            // Reset loading state after 30 seconds if it's still saving
            timeoutId = setTimeout(() => {
                console.warn("Save operation timed out after 30 seconds");
                setIsSaving(false);
                setIsFormSaving(false);
                alert("Operasi menyimpan memakan waktu terlalu lama. Silakan coba lagi.");
            }, 30000);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isSaving, isFormSaving]);

    // Helper function to get file type and extension
    const getFileInfo = (filePath: string) => {
        const extension = filePath.toLowerCase().split('.').pop() || '';
        const fileName = filePath.split('/').pop() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
            return { type: 'image', extension, fileName };
        } else if (['mp4', 'avi', 'mov', 'mkv', 'webm', '3gp'].includes(extension)) {
            return { type: 'video', extension, fileName };
        } else if (extension === 'pdf') {
            return { type: 'pdf', extension, fileName };
        } else {
            return { type: 'other', extension, fileName };
        }
    };

    // Media preview component
    const MediaPreview = ({ mediaPath, index }: { mediaPath: string; index: number }) => {
        const fileInfo = getFileInfo(mediaPath);
        const fullUrl = `${API_URL}${mediaPath}`;

        const handleDownload = () => {
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = fileInfo.fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const handleView = () => {
            window.open(fullUrl, '_blank');
        };

        return (
            <div className="relative w-24 h-24 rounded-md overflow-hidden border border-yellow-300 bg-gray-100">
                {fileInfo.type === 'image' && (
                    <Image
                        src={fullUrl}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        width={96}
                        height={96}
                        onClick={handleView}
                    />
                )}
                
                {fileInfo.type === 'video' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 cursor-pointer" onClick={handleView}>
                        <Video className="w-8 h-8 text-blue-600 mb-1" />
                        <span className="text-xs text-blue-600 text-center px-1">
                            {fileInfo.extension.toUpperCase()}
                        </span>
                    </div>
                )}
                
                {fileInfo.type === 'pdf' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 cursor-pointer" onClick={handleView}>
                        <FileText className="w-8 h-8 text-red-600 mb-1" />
                        <span className="text-xs text-red-600 text-center px-1">PDF</span>
                    </div>
                )}
                
                {fileInfo.type === 'other' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 cursor-pointer" onClick={handleDownload}>
                        <Download className="w-8 h-8 text-gray-600 mb-1" />
                        <span className="text-xs text-gray-600 text-center px-1">
                            {fileInfo.extension.toUpperCase()}
                        </span>
                    </div>
                )}
                
                <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center hover:bg-red-700 transition"
                    title="Hapus media"
                >
                    ✕
                </button>
                
                {/* Action buttons overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center">
                        <button onClick={handleView} className="hover:text-blue-300" title="Lihat">
                            👁️
                        </button>
                        <button onClick={handleDownload} className="hover:text-green-300" title="Download">
                            💾
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    // Tambah Kesimpulan
    const handleAddKesimpulan = async () => {
        if (!newKesimpulan.trim() || !data._id) return;
        setIsSaving(true);
        try {
            const res = await axios.post(
                `${API_URL}/tindakan/${data._id}/kesimpulan`,
                { text: newKesimpulan.trim() }
            );
            onChange(prev => ({ ...prev, kesimpulan: res.data.kesimpulan }));
            setNewKesimpulan("");
            setSaveMessage("Tindak lanjut berhasil ditambahkan dan dikirimkan kepada Warga");
            setSaveSuccessModalVisible(true);
        } catch (err) {
            console.error("❌ Gagal menambahkan kesimpulan:", err);
            alert("Gagal menambahkan tindak lanjut. Silakan coba lagi.");
        }
        setIsSaving(false);
    };

    // Edit Kesimpulan
    const handleEditKesimpulan = async (index: number, newText: string) => {
        if (!data._id || !newText.trim()) return;
        try {
            const res = await axios.put(
                `${API_URL}/tindakan/${data._id}/kesimpulan/${index}`,
                { text: newText.trim() }
            );
            onChange(prev => ({ ...prev, kesimpulan: res.data.kesimpulan }));
        } catch (err) {
            console.error("❌ Gagal mengedit kesimpulan:", err);
        }
    };

    // Hapus Kesimpulan
    const handleDeleteKesimpulan = async (index: number) => {
        if (!data._id) return;
        try {
            const res = await axios.delete(
                `${API_URL}/tindakan/${data._id}/kesimpulan/${index}`
            );
            onChange(prev => ({ ...prev, kesimpulan: res.data.kesimpulan }));
        } catch (err) {
            console.error("❌ Gagal menghapus kesimpulan:", err);
        }
    };

    // Upload Media
    const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).slice(0, MAX_MEDIA - (data.photos?.length || 0));
        if (files.length === 0) return;

        // Validate file types
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
            'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/3gp',
            'application/pdf'
        ];

        const validFiles = files.filter(file => {
            if (!allowedTypes.includes(file.type)) {
                alert(`File ${file.name} tidak didukung. Hanya file gambar, video, dan PDF yang diizinkan.`);
                return false;
            }
            // Check file size (max 10MB for videos, 5MB for others)
            const maxSize = file.type.startsWith('video/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert(`File ${file.name} terlalu besar. Maksimal ${file.type.startsWith('video/') ? '10MB untuk video' : '5MB untuk file lainnya'}.`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setLoading(true);
        try {
            const formDataUpload = new FormData();
            validFiles.forEach(file => formDataUpload.append("photos", file));

            const res = await axios.post(`${API_URL}/api/upload-tindakan`, formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const uploadedPaths: string[] = res.data.paths || [];
            onChange(prev => ({
                ...prev,
                photos: [...(prev.photos || []), ...uploadedPaths].slice(0, MAX_MEDIA)
            }));
        } catch (err) {
            console.error("❌ Gagal upload media:", err);
            alert("Gagal mengunggah media. Silakan coba lagi.");
        }
        setLoading(false);
    };

    const handleRemovePhoto = (index: number) => {
        const updated = (data.photos || []).filter((_, i) => i !== index);
        onChange(prev => ({ ...prev, photos: updated }));
    };

    if (!isConfirmed && (!data.opd || (Array.isArray(data.opd) && data.opd.length === 0))) {
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
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition"
                        title="Buka Laporan SP4N Lapor"
                    >
                        Buka Laporan #{data.trackingId}
                    </button>
                    <button
                        onClick={() => {
                            setIsConfirmed(true);
                            onConfirmChange?.(true);
                        }}
                        className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 transition"
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

                {/* <hr className="border-t border-gray-200 my-4" /> */}

                <h3 className="text-lg font-medium mb-2">Tindak Lanjut</h3>
                <div className="mt-3 mb-3">
                    <button
                        onClick={() => window.open(`${data.url}`, "_blank")}
                        className="flex items-center px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition"
                        title="Buka Laporan SP4N Lapor"
                    >
                        <Image
                            src="/Spanlapor-icon.png"
                            alt="Icon"
                            className="w-5 h-5 mr-2"
                            width={20}
                            height={20}
                        />
                        Buka Laporan #{data.trackingId}
                    </button>
                </div>

                <ul className="space-y-2">

                    {/* Form OPD */}
                    <div className="grid grid-cols-4 items-start gap-2">
                        <label className="col-span-1 font-medium mt-2">Terdisposisi ke</label>
                        <div className="col-span-3">
                            <OPDSelect
                                value={data.opd || []}
                                onChange={(val) => onChange((prev) => ({ ...prev, opd: val }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Anda dapat menambahkan lebih dari satu OPD</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-2">
                        <div className="col-span-1">
                            <span className="font-medium">Status Laporan SP4N Lapor</span><br />
                        </div>
                        <div className="col-span-3">
                            <select
                                name="status_laporan"
                                value={data.status_laporan || ""}
                                onChange={handleChange}
                                className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md focus:ring-yellow-400 focus:border-yellow-500"
                            >
                                <option value="Sedang Diproses OPD Terkait">Sedang Diproses OPD Terkait</option>
                                <option value="Telah Diproses OPD Terkait">Selesai</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-2 flex justify-center">
                        {saveData ? (
                            <button
                                onClick={() => {
                                    // Enhanced version with reliable error handling and timeouts for Simpan Perubahan button
                                    setIsFormSaving(true);

                                    // Track start time to detect slow operations or hangs
                                    const startTime = Date.now();
                                    console.log("Starting form save operation at", new Date().toISOString());

                                    // Set a failsafe timeout to prevent permanent loading state
                                    const timeoutId = setTimeout(() => {
                                        console.warn("Form save operation timed out after 15 seconds");
                                        setIsFormSaving(false);
                                        alert("Operasi menyimpan memakan waktu terlalu lama. Silakan coba lagi.");
                                    }, 15000);

                                    try {
                                        // Direct saveData call with proper error handling
                                        console.log("Calling saveData function to save form data");
                                        saveData()
                                            .then(() => {
                                                console.log("Form save succeeded in", Date.now() - startTime, "ms");
                                                setSaveMessage("Perubahan berhasil disimpan");
                                                setSaveSuccessModalVisible(true);
                                                // Update tracked data after successful save
                                                setInitialData({ ...data });
                                                setHasFormChanges(false);
                                            })
                                            .catch((error: Error) => {
                                                console.error("Error in form save operation:", error);
                                                alert(`Gagal menyimpan perubahan: ${error?.message || 'Terjadi kesalahan'}`);
                                            })
                                            .finally(() => {
                                                console.log("Form save operation completed in", Date.now() - startTime, "ms");
                                                setIsFormSaving(false);
                                                clearTimeout(timeoutId);
                                            });
                                    } catch (error) {
                                        console.error("Unexpected error in save button handler:", error);
                                        setIsFormSaving(false);
                                        clearTimeout(timeoutId);
                                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                        alert(`Terjadi kesalahan tak terduga saat menyimpan: ${errorMessage}`);
                                    }
                                }}
                                disabled={isFormSaving || !hasFormChanges}
                                className={`px-4 py-2 rounded-md text-white text-sm flex items-center gap-2 transition ${isFormSaving || !hasFormChanges ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
                                    }`}
                            >
                                {isFormSaving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8H4z"
                                            ></path>
                                        </svg>
                                        <span>Sedang menyimpan...</span>
                                    </div>
                                ) : (
                                    <>                                <RiSave3Fill size={16} />
                                        <span>{!hasFormChanges ? "Tidak Ada Perubahan" : "Simpan Perubahan"}</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-2">Fitur simpan tidak tersedia pada tahap ini atau Anda berada dalam mode baca saja.</p>
                                <p className="text-xs text-yellow-600">Untuk melanjutkan, silahkan isi data yang diperlukan atau gunakan tombol navigasi di bawah.</p>
                            </div>
                        )}
                    </div>

                    {/* Tindak Lanjut List */}
                    <ul className="relative border-l-2 border-yellow-300 pl-6">
                        <span className="font-medium text-gray-800">Tindak Lanjut:</span>
                        {data.kesimpulan?.map((item: KesimpulanItem, idx: number) => (
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
                        // maxLength={250}
                        className="w-full border border-yellow-300 bg-yellow-50 p-2 rounded-md placeholder:text-grey-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Tempel atau Ketik Tindak Lanjut dari Halaman SP4N Lapor . . . . "
                    />
                    <p className="text-sm text-gray-500 text-right">
                        {newKesimpulan.length} karakter
                    </p>
                    <div className="mt-2 flex justify-center">
                        <button
                            onClick={handleAddKesimpulan}
                            disabled={isSaving || !newKesimpulan.trim()}
                            className={`px-4 py-2 rounded-md text-white text-sm flex items-center gap-1 transition ${isSaving ? "bg-gray-300 cursor-not-allowed" :
                                    !newKesimpulan.trim() ? "bg-gray-300 cursor-not-allowed" :
                                        "bg-emerald-500 hover:bg-emerald-600"
                                }`}
                        >
                            {isSaving ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Mengirimkan tindak lanjut...</span>
                                </div>
                            ) : (
                                <>
                                    <FaWhatsapp className="text-lg" />
                                    <span>Kirimkan Tindak Lanjut</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* � Upload Media */}
            <label className="col-span-1 font-medium">Media Pendukung
                <span className="text-red-500">*</span>
                <p className="text-gray-500">(Evidence Tindak Lanjut dari SP4N Lapor)</p>
                <p className="text-xs text-blue-600 mt-1">Foto, Video, PDF</p>
            </label>
            <div className="col-span-3 space-y-2">
                <div className="flex gap-2 flex-wrap">
                    {(data.photos || []).map((media, idx) => (
                        <MediaPreview key={idx} mediaPath={media} index={idx} />
                    ))}

                    {/* Tombol Upload */}
                    {(data.photos?.length || 0) < MAX_MEDIA && (
                        <div
                            onClick={() => !loading && fileRef.current?.click()}
                            className={`w-24 h-24 border-2 border-yellow-300 bg-yellow-50 border-dashed rounded-md flex items-center justify-center cursor-pointer transition
                        ${loading ? "border-yellow-300 bg-yellow-50" : "hover:border-green-500 hover:bg-green-50"}`}
                        >
                            {loading ? (
                                <div className="flex flex-col items-center text-gray-500 text-xs">
                                    <svg className="animate-spin h-5 w-5 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Upload...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500 text-xs">
                                    <Plus className="w-5 h-5 mb-1" />
                                    <span>Tambah</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*,video/*,application/pdf"
                                multiple
                                className="hidden"
                                ref={fileRef}
                                onChange={handleMediaSelect}
                            />
                        </div>
                    )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                    <p>• Maksimal {MAX_MEDIA} file</p>
                    <p>• Format: Gambar (JPG, PNG, GIF, WebP), Video (MP4, AVI, MOV, MKV), PDF</p>
                    <p>• Ukuran: Max 5MB untuk gambar/PDF, 10MB untuk video</p>
                </div>
            </div>

            {/* Modal Simpan Loading for Kirimkan Tindak Lanjut */}
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4">
                        <svg className="animate-spin h-10 w-10 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <p className="text-gray-700 font-semibold">Sedang mengirimkan tindak lanjut...</p>
                    </div>
                </div>
            )}

            {/* Modal Form Save Loading for Simpan Perubahan */}
            {isFormSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4">
                        <svg className="animate-spin h-10 w-10 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <p className="text-gray-700 font-semibold">Sedang menyimpan perubahan...</p>
                    </div>
                </div>
            )}

            {/* Modal Simpan Berhasil */}
            {saveSuccessModalVisible && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
                    onClick={() => setSaveSuccessModalVisible(false)}
                >
                    <div
                        className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-green-100 p-2 rounded-full mb-2">
                            <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-gray-700 font-semibold text-center">{saveMessage}</p>
                        <button
                            onClick={() => {
                                setSaveSuccessModalVisible(false);
                                window.location.reload();
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            Oke
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
