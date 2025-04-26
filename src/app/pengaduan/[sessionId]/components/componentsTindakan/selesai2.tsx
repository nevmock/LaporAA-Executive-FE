"use client";
import { TindakanData } from "../../../../../lib/types";

export default function Selesai2({
    data,
}: {
    data: Partial<TindakanData>;
}) {
    return (
        <div className="space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-4 gap-2 items-center">
                <label className="col-span-1 font-medium">Rating Pelapor</label>
                <p className="col-span-3">
                    {data.rating !== undefined && data.rating !== null
                        ? `${data.rating} / 5`
                        : "- Belum diberikan -"}
                </p>
            </div>

            <div className="bg-green-50 border border-green-300 text-green-800 p-4 rounded-md">
                Pelapor telah memberikan tanggapan dan menilai proses penanganan ini. Laporan dinyatakan selesai.
            </div>
        </div>
    );
}
