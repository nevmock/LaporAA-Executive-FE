"use client";
import { useState } from "react";
import { TindakanData } from "../../../../../../lib/types";
import OPDSelect from "./opdSelect"

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    if (!isConfirmed) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
                <h3 className="text-md font-semibold text-yellow-800 mb-2">Konfirmasi Data SP4N Lapor</h3>
                <p className="text-sm text-gray-700">
                    Silakan pastikan bahwa Anda sudah mengisi data di SP4N Lapor dan laporan tersebut sudah diverifikasi.<br/>
                    Klik tombol di bawah ini untuk mulai mengisi data yang sudah tersedia di halaman SP4N Lapor.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => window.open("https://www.lapor.go.id", "_blank")}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                    >
                        Buka SP4N Lapor
                    </button>

                    <button
                        onClick={() => {
                            setIsConfirmed(true);
                            onConfirmChange?.(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                    >
                        Ya, Saya Sudah Mengisi dan Verifikasi
                    </button>

                </div>
            </div>
        );
    }

    // Form setelah konfirmasi
    return (
        <div className="grid grid-cols-1 gap-4">
            {/* Form Terdisposisi ke */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="col-span-1">
                    <span className= "font-medium text-gray-700">Terdisposisi ke</span><br/>
                    <span className= "font-small text-gray-500">(Salin dari SP4N Lapor)</span>
                </div>
                <div className="col-span-3">
                    <input
                        name="disposisi"
                        value={data.disposisi || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Tempel atau Ketik informasi disposisi dari SP4N Lapor"
                    />
                </div>
            </div>

            {/* Form Tracking ID */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="col-span-1 font-medium text-gray-700">
                    <span className= "font-medium text-gray-700">Tracking ID</span><br/>
                    <span className= "font-small text-gray-500">(Salin dari SP4N Lapor)</span>
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
                    <span className= "font-medium text-gray-700">URL / Link Laporan SP4N Lapor</span><br/>
                    <span className= "font-small text-gray-500">(Salin dari SP4N Lapor)</span>
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

            {/* Form OPD */}
            <div className="grid grid-cols-4 items-start gap-2">
                <label className="col-span-1 font-medium text-gray-700 mt-2">OPD Terkait</label>
                <div className="col-span-3">
                    <OPDSelect value={data.opd || ""} onChange={(val) => onChange((prev) => ({ ...prev, opd: val }))} />
                </div>
            </div>
        </div>
    );
}