"use client";

import Sidebar from "./sidebar";
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [countPending, setCountPending] = useState(0);

    useEffect(() => {
        axios
            .get(`${API_URL}/reportCount`)
            .then((res) => {
                const data = res.data?.count ?? 0;
                console.info("Jumlah laporan:", data);
                setCountPending(data);
            })
            .catch((err) => {
                console.error("Gagal mengambil jumlah laporan:", err);
                setCountPending(0);
            });
    }, []);

    return (
        <div className="flex h-full w-full">
            <Sidebar countPending={countPending} />
            <main className="flex-1 flex flex-col h-full w-full">{children}</main>
        </div>
    );
}
