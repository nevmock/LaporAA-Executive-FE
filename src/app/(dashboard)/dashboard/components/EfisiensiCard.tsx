"use client";
import { useEffect, useState } from "react";
import { formatWIBDate } from "../../../../utils/dateFormater";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function EfisiensiCard() {
    const [efisiensi, setEfisiensi] = useState({ value: 0, updated_at: "" });

    useEffect(() => {
        axios
            .get(`${API_URL}/dashboard/efisiensi`)
            .then((res) => {
                setEfisiensi(res.data ?? { value: 0, updated_at: "" });
            })
            .catch(() => {
                setEfisiensi({ value: 0, updated_at: "" });
            });
    }, []);    

    return (
        <div className="bg-orange-400 text-white rounded-xl p-6 shadow">
            <p className="text-xl font-bold">{efisiensi?.value.toFixed(2)} %</p>
            <p className="text-sm mt-1">Efisiensi</p>
            <p className="text-xs mt-2">Jumlah pelapor yang dilayani</p>
            <p className="text-[10px] mt-1 italic">Updated at: {formatWIBDate(efisiensi?.updated_at)}</p>
        </div>
    );
}
