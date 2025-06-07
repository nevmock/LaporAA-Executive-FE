"use client";
import { useState } from "react";
import { TindakanData } from "../../../../../../lib/types";


export default function Verifikasi2({
    data,
    onChange,
    onConfirmChange
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
    onConfirmChange?: (val: boolean) => void;
}) {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    if (!isConfirmed) {
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
                        placeholder="Tempel atau Ketik Tracking ID dari SP4N Lapor"
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

        </div>
    );
}