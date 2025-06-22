"use client";

import { TindakanData } from "../../../../lib/types";
import { FaStar } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Selesai2({
    data,
    reportData,
    saveData
}: {
    data: Partial<TindakanData> & { sessionId: string };
    reportData?: any;
    saveData?: (nextStatus?: string) => Promise<any>;
}) {
    // Gunakan reportData untuk info laporan utama
    const laporan = reportData || {};
    // Fungsi bantu untuk render bintang
    const renderStars = (rating?: number | null) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    className={`w-5 h-5 ${rating && i <= rating ? "text-yellow-500" : "text-gray-300"}`}
                />
            );
        }
        return stars;
    };
    return (
        <div className="space-y-6 text-sm text-gray-700">
            {/* Rating */}
            <div className="grid grid-cols-4 gap-2 items-center">
                <label className="col-span-1 font-medium">Rating Pelapor</label>
                <div className="col-span-3 flex items-center space-x-1">
                    {laporan.rating !== undefined && laporan.rating !== null
                        ? renderStars(laporan.rating)
                        : <span className="text-gray-400">Belum ada rating</span>}
                </div>
            </div>
        </div>
    );
}