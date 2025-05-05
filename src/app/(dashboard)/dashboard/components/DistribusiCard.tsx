"use client";
import { useEffect, useState } from "react";
import { formatWIBDate } from "../../../../utils/dateFormater";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function DistribusiCard() {
    const [stdDev, setStdDev] = useState({ value: 0, updated_at: "" });

    useEffect(() => {
        axios
            .get(`${API_URL}/dashboard/distribusi`)
            .then((res) => {
                setStdDev(res.data ?? { value: 0, updated_at: "" });
            })
            .catch(() => {
                setStdDev({ value: 0, updated_at: "" });
            });
    }, []);

    return (
        <div className="bg-green-400 text-white rounded-xl p-6 shadow">
            <p className="text-xl font-bold">{stdDev?.value.toFixed(2)}</p>
            <p className="text-sm mt-1">Distribusi Solusi</p>
            <p className="text-xs mt-2">Standar deviasi laporan selesai per wilayah</p>
            <p className="text-[10px] mt-1 italic">Updated at: {formatWIBDate(stdDev?.updated_at)}</p>
        </div>
    );
}
