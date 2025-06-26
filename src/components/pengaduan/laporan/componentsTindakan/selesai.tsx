"use client";

import { TindakanData } from "../../../../lib/types";

export default function Selesai({
    data,
    // reportData,
    saveData // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
    data: Partial<TindakanData> & { sessionId: string };
    reportData?: any;
    saveData?: (nextStatus?: string) => Promise<any>;
}) {
    // Jika data tidak ada, tampilkan error/loading
    if (!data) {
        return <div className="text-red-500">Data laporan tidak tersedia.</div>;
    }

    return (
        <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
                ✅ Tindakan telah selesai. Mohon menunggu tanggapan dari pelapor.
            </div>
        </div>
    );
}
