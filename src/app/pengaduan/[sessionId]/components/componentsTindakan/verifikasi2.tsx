"use client";
import { TindakanData } from "../../../../../lib/types";

export default function Verifikasi2({
    data,
    onChange
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
}) {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="grid grid-cols-4 gap-2">


            <div className="relative w-fit col-span-1">
                <label className="font-medium text-gray-700">Terdisposisi ke</label>
                <span className="absolute -top-1 -right-3 text-red-500 text-sm">*</span>
            </div>
            <input
                name="disposisi"
                value={data.disposisi || ""}
                onChange={handleChange}
                className="col-span-3 border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                placeholder="Ketik Informasi Terdisposisi kemana dari SP4N Lapor"
            />

            <div className="relative w-fit col-span-1">
                <label className="font-medium text-gray-700">OPD Terkait</label>
                <span className="absolute -top-1 -right-3 text-red-500 text-sm">*</span>
            </div>
            <input
                name="opd"
                value={data.opd || ""}
                onChange={handleChange}
                className="col-span-3 border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                placeholder="Ketik Nama OPD yang berkaitan dengan informasi disposisi dari SP4N Lapor"
            />

            <div className="relative w-fit col-span-1">
                <label className="font-medium text-gray-700">Tracking ID dari SP4N Lapor</label>
                <span className="absolute -top-1 -right-3 text-red-500 text-sm">*</span>
            </div>
            <input
                name="trackingId"
                value={data.trackingId || ""}
                onChange={handleChange}
                className="col-span-3 border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                placeholder="Ketik Tracking ID dari SP4N Lapor"
            />

            <div className="relative w-fit col-span-1">
                <label className="font-medium text-gray-700">Tindak Lanjut dari SP4N Lapor</label>
                <span className="absolute -top-1 -right-3 text-red-500 text-sm">*</span>
            </div>
            <textarea
                name="kesimpulan"
                value={data.kesimpulan || ""}
                onChange={handleChange}
                className="col-span-3 border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                rows={4}
                placeholder="Tulis kesimpulan tindakan dari SP4N Lapor di sini..."
            />
        </div>
    );
}
