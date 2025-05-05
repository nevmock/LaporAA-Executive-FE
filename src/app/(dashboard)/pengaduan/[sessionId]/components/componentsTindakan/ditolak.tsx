"use client";
import { TindakanData } from "../../../../../../lib/types";

export default function Ditolak({ data }: { data: Partial<TindakanData> }) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <h3 className="font-semibold mb-2">Laporan Ditolak</h3>
            <p>
                Alasan penolakan:
                <br />
                <strong>{data.kesimpulan || "Tidak ada alasan yang diberikan."}</strong>
            </p>
        </div>
    );
}
