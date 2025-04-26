"use client";
import { TindakanData } from "../../../../../lib/types";

export default function Verifikasi({
    data,
    onChange
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
}) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="grid grid-cols-4 gap-2">
            <label className="col-span-1 font-medium">Tingkat Kedaruratan</label>
            <select
                name="situasi"
                value={data.situasi || ""}
                onChange={handleChange}
                className="col-span-3 border p-2 rounded-md"
            >
                <option value="Darurat">Darurat</option>
                <option value="Permintaan Informasi">Permintaan Informasi</option>
                <option value="Berpengawasan">Berpengawasan</option>
                <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
            </select>
        </div>
    );
}
