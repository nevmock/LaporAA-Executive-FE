"use client";
import { useEffect, useState } from "react";
import { TindakanData } from "../../../../../lib/types";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function Selesai2({
    data,
}: {
    data: Partial<TindakanData>;
}) {
    const [rating, setRating] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRating = async () => {
            if (!data?.report) return;
            try {
                const res = await axios.get(`${API_URL}/reports/${data.report}`);
                setRating(res.data?.rating ?? null);
            } catch (err) {
                console.error("❌ Gagal ambil data report:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRating();
    }, [data?.report]);

    return (
        <div className="space-y-4 text-sm text-gray-700">

            <div className="grid grid-cols-4 gap-2 items-center">
                <label className="col-span-1 font-medium">Rating Pelapor</label>
                <p className="col-span-3">
                    {loading ? "Memuat..." : rating !== null ? `${rating} / 5` : "- Belum diberikan -"}
                </p>
            </div>

            <div className="bg-green-50 border border-green-300 text-green-800 p-4 rounded-md">
                Pelapor telah memberikan tanggapan dan menilai proses penanganan ini. Laporan dinyatakan selesai.
            </div>
        </div>
    );
}