"use client";

import { TindakanData } from "../../../../lib/types";

interface SaveDataFunction {
    (nextStatus?: string): Promise<unknown>;
}

export default function Ditutup({
    data,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    saveData
}: {
    data: Partial<TindakanData> & { sessionId: string };
    saveData?: SaveDataFunction;
}) {

    return (
        <div className="space-y-6 text-sm text-red-700">
            {/* Alert Box */}
            <div className="bg-red-50 border border-red-300 p-4 rounded-md">
                <h3 className="font-semibold mb-2 text-red-700">Laporan Ditutup</h3>
                <p>
                    Alasan ditutup:
                    <br />
                    <strong>{data.keterangan || "Tidak ada alasan yang diberikan."}</strong>
                </p>
            </div>
        </div>
    );
}
