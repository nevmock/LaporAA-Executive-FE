"use client";
import { useEffect, useState } from "react";
import { formatWIBDate } from "../../../../utils/dateFormater";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function KepuasanCard() {
    const [kepuasan, setKepuasan] = useState({ value: 0, updated_at: "" });

    useEffect(() => {
        axios
            .get(`${API_URL}/dashboard/kepuasan`)
            .then((res) => {
                setKepuasan(res.data ?? { value: 0, updated_at: "" });
            })
            .catch(() => {
                setKepuasan({value : 0, updated_at: ""});
            });
    }, []);

    return (
        <div className="bg-cyan-400 text-white rounded-xl p-6 shadow">
            <p className="text-xl font-bold">{kepuasan?.value.toFixed(2)} %</p>
            <p className="text-sm mt-1">Kepuasan Solusi</p>
            <p className="text-xs mt-2">Skala dari pelapor (1–5)</p>
            <p className="text-[10px] mt-1 italic">Updated at: {formatWIBDate(kepuasan.updated_at)}</p>
        </div>
    );
}
