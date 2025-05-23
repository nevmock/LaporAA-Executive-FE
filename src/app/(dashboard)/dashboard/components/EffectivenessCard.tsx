"use client";
import { useEffect, useState } from "react";
import { formatWIBDate } from "../../../../utils/dateFormater";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function EffectivenessCard() {
    const [effectiveness, setEffectiveness] = useState({ value: 0, updated_at: "" });

    useEffect(() => {
        axios
            .get(`${API_URL}/dashboard/effectiveness`)
            .then((res) => {
                setEffectiveness(res.data ?? { value: 0, updated_at: "" });
            })
            .catch(() => {
                setEffectiveness({ value: 0, updated_at: "" });
            });
    }, []);

    return (
        <div className="bg-pink-400 text-white rounded-xl p-6 shadow-md">
            <p className="text-xl font-bold">{effectiveness?.value.toFixed(2)} %</p>
            <p className="text-sm mt-1">Effectiveness</p>
            <p className="text-xs mt-2">Jumlah laporan yang diselesaikan</p>
            <p className="text-[10px] mt-1 italic">Updated at: {formatWIBDate(effectiveness?.updated_at)}</p>
        </div>
    );
}
