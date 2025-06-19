"use client";
import { TindakanData } from "../../../../lib/types";

export default function Verifikasi1({
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

            {/* Form Tingkat Kedaruratan */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-800">
                        Tingkat Kedaruratan
                    </label>
                </div>
                <div className="col-span-3">
                    <select
                        name="situasi"
                        value={data.situasi || ""}
                        onChange={handleChangeSituasi}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-grey-700 focus:ring-yellow-400 focus:border-yellow-500"
                    >
                        <option value="">-- Pilih Opsi --</option>
                        <option value="Darurat">Darurat</option>
                        <option value="Permintaan Informasi">Permintaan Informasi</option>
                        <option value="Berpengawasan">Berpengawasan</option>
                        <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                    </select>
                </div>
            </div>
            
        </div>
    );
}
