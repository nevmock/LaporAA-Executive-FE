"use client";
import { TindakanData } from "../../../../../lib/types";

export default function Verifikasi({
    data,
    onChange,
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
}) {
    const handleChangeSituasi = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-4">
            {/* Informasi SP4N Lapor */}
            <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3 text-sm text-gray-700">
                <p className="mb-2">
                    Silakan input data-data di atas ke sistem <strong>SP4N Lapor</strong> sebagai bentuk tindak lanjut resmi.
                </p>
                <a
                    href="https://www.lapor.go.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Buka SP4N Lapor
                </a>
            </div>

            {/* Form Tingkat Kedaruratan */}
            <div className="grid grid-cols-4 gap-2 items-center">
                <div className="relative w-fit col-span-1">
                    <label className="font-medium text-gray-700">Tingkat Kedaruratan</label>
                    <span className="absolute -top-1 -right-3 text-red-500 text-sm">*</span>
                </div>
                <select
                    name="situasi"
                    value={data.situasi || ""}
                    onChange={handleChangeSituasi}
                    className="col-span-3 border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                >
                    <option value="">-- Pilih Opsi --</option>
                    <option value="Darurat">Darurat</option>
                    <option value="Permintaan Informasi">Permintaan Informasi</option>
                    <option value="Berpengawasan">Berpengawasan</option>
                    <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                </select>
            </div>
        </div>
    );
}
