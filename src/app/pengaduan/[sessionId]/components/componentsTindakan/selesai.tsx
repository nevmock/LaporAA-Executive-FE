"use client";
import { TindakanData } from "../../../../../lib/types";

export default function Selesai({
    data
}: {
    data: Partial<TindakanData>;
}) {
    return (
        <div className="space-y-4 text-sm text-gray-700">

            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
                ✅ Tindakan telah selesai. Mohon menunggu tanggapan dari pelapor.
            </div>
            
        </div>
    );
}
