"use client";
import { useState, useEffect } from "react";
import { TindakanData } from "../../../../lib/types";
import { RiSave3Fill } from "react-icons/ri";

export default function Verifikasi2({
    data,
    onChange,
    onConfirmChange,
    saveData
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
    onConfirmChange?: (val: boolean) => void;
    saveData?: (nextStatus?: string) => Promise<any>;
}) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
    const [saveMessage, setSaveMessage] = useState("Data berhasil disimpan");
    const [initialData, setInitialData] = useState<Partial<TindakanData>>({});
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
            const trackingIdChanged = initialData.trackingId !== data.trackingId;
            const urlChanged = initialData.url !== data.url;
            const statusChanged = initialData.status_laporan !== data.status_laporan;

            setHasFormChanges(trackingIdChanged || urlChanged || statusChanged);
        }
    }, [data, initialData]);

    // Safety timeout to prevent infinite loading state
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;
        if (isSaving) {
            // Reset loading state after 30 seconds if it's still saving
            timeoutId = setTimeout(() => {
                console.warn("Save operation timed out after 30 seconds");
                setIsSaving(false);
                alert("Operasi menyimpan memakan waktu terlalu lama. Silakan coba lagi.");
            }, 30000);
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isSaving]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    if (!isConfirmed && !data.trackingId) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
                <h3 className="text-md font-semibold text-yellow-800 mb-2">Konfirmasi Data SP4N Lapor</h3>
                <p className="text-sm text-gray-700">
                    Apakah sudah mengisi data ke SP4N Lapor, dan mendapatkan Tracking ID ?<br />
                    Klik tombol di bawah ini untuk mulai mengisi data yang sudah tersedia di halaman SP4N Lapor.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => window.open("https://www.lapor.go.id", "_blank")}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition"
                    >
                        Buka SP4N Lapor
                    </button>

                    <button
                        onClick={() => {
                            setIsConfirmed(true);
                            onConfirmChange?.(true);
                        }}
                        className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 transition"
                    >
                        Ya, Saya Sudah Mengisi Data
                    </button>

                </div>
            </div>
        );
    }

    // Form setelah konfirmasi
    return (
        <div className="grid grid-cols-1 gap-4">

            {/* Form Tracking ID */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="col-span-1 font-medium text-gray-800">
                    <span className="font-medium text-gray-800">Tracking ID</span><br />
                    <span className="font-small text-gray-500">(Salin dari SP4N Lapor)</span>
                </div>
                <div className="col-span-3">
                    <input
                        name="trackingId"
                        type="number"
                        value={data.trackingId || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Tempel atau Ketik Tracking ID dari SP4N Lapor (contoh: 1234567890)"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
                <div className="col-span-1">
                    <span className="font-medium text-gray-800">URL / Link Laporan SP4N Lapor</span><br />
                    <span className="font-small text-gray-500">(Salin dari SP4N Lapor)</span>
                </div>
                <div className="col-span-3">
                    <input
                        name="url"
                        value={data.url || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Tempel Link halaman laporan dari SP4N Lapor"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
                <div className="col-span-1">
                    <span className="font-medium text-gray-800">Status Laporan SP4N Lapor</span><br />
                </div>
                <div className="col-span-3">
                    <select
                        name="status_laporan"
                        value={data.status_laporan || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md focus:ring-yellow-400 focus:border-yellow-500"
                    >
                        <option value="Menunggu Diproses OPD Terkait">Menunggu Diproses OPD Terkait</option>
                        <option value="Sedang Diproses OPD Terkait">Sedang Diproses OPD Terkait</option>
                    </select>
                </div>
            </div>

            <div className="mt-2 flex justify-center">
                {saveData ? (
                    <button
                        onClick={() => {
                            setIsSaving(true);
                            // Track start time to detect slow operations
                            const startTime = Date.now();
                            console.log("Starting form save operation at", new Date().toISOString());
                            
                            // Set a failsafe timeout to prevent permanent loading state
                            const timeoutId = setTimeout(() => {
                                console.warn("Form save operation timed out after 15 seconds");
                                setIsSaving(false);
                                alert("Operasi menyimpan memakan waktu terlalu lama. Silakan coba lagi.");
                            }, 15000);
                            
                            try {
                                saveData()
                                    .then((result) => {
                                        console.log("Form save succeeded in", Date.now() - startTime, "ms");
                                        setSaveMessage("Perubahan berhasil disimpan");
                                        setSaveSuccessModalVisible(true);
                                        // Update tracked data after successful save
                                        setInitialData({...data});
                                        setHasFormChanges(false);
                                    })
                                    .catch((error: any) => {
                                        console.error("Error in form save operation:", error);
                                        alert(`Gagal menyimpan perubahan: ${error?.message || 'Terjadi kesalahan'}`);
                                    })
                                    .finally(() => {
                                        console.log("Form save operation completed in", Date.now() - startTime, "ms");
                                        setIsSaving(false);
                                        clearTimeout(timeoutId);
                                    });
                            } catch (error: any) {
                                console.error("Unexpected error in save button handler:", error);
                                setIsSaving(false);
                                clearTimeout(timeoutId);
                                alert(`Terjadi kesalahan tak terduga saat menyimpan: ${error?.message || ""}`);
                            }
                        }}
                        disabled={isSaving || !hasFormChanges}
                        className={`px-4 py-2 rounded-md text-white text-sm flex items-center gap-2 transition ${
                            isSaving || !hasFormChanges ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                    >
                        {isSaving ? (
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
                            </div>
                        ) : (
                            <>
                                <RiSave3Fill size={16} />
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
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4">
                        <svg className="animate-spin h-10 w-10 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <p className="text-gray-700 font-semibold">Sedang menyimpan...</p>
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
                            onClick={() => setSaveSuccessModalVisible(false)}
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