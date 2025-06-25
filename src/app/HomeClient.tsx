'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeClient() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        
        if (token) {
            // Jika sudah login, redirect ke dashboard
            router.push("/dashboard");
        } else {
            // Jika belum login, redirect ke login page
            router.push("/login");
        }
    }, [router]);

    // Tampilkan loading sementara sambil melakukan redirect
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat...</p>
            </div>
        </div>
    );
}
