// app/page.tsx (client component, bisa taruh di file `HomeClient.tsx`)
'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomeClient() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6">
            <img
                src="/LAPOR AA BUPATI.png"
                alt="Logo LaporAA"
                style={{ width: "400px", height: "400px" }}
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Selamat datang di Dashboard Lapor AA👋</h1>
            <p className="text-gray-600 mb-6">Silakan masuk untuk melihat data laporan.</p>

            <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                {isLoggedIn ? "Masuk ke Dashboard" : "Login Sekarang"}
            </Link>
        </div>
    );
}
