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
            <label className="col-span-1 font-medium">Tracking ID SP4N Lapor</label>
            <input
                name="trackingId"
                value={data.trackingId || ""}
                onChange={handleChange}
                className="col-span-3 border p-2 rounded-md"
                placeholder="Ketik Tracking ID dari SP4N Lapor"
            />

            <label className="col-span-1 font-medium">OPD Terkait</label>
            <input
                name="opd"
                value={data.opd || ""}
                onChange={handleChange}
                className="col-span-3 border p-2 rounded-md"
                placeholder="Ketik Nama OPD Terkait dari SP4N Lapor"
            />

            <label className="col-span-1 font-medium">Kesimpulan Tindakan</label>
            <textarea
                name="kesimpulan"
                value={data.kesimpulan || ""}
                onChange={handleChange}
                className="col-span-3 border p-2 rounded-md"
                rows={4}
                placeholder="Tulis kesimpulan tindakan dari SP4N Lapor di sini..."
            />
        </div>
    );
}
