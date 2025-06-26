"use client";

import Sidebar from "../components/sidebar";
import TopNavbar from "../components/TopNavbar";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [countPending, setCountPending] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [namaAdmin, setNamaAdmin] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const [role, setRole] = useState<string | null>(null);

    // Get page title based on pathname
    const getPageTitle = () => {
        if (pathname.includes('/dashboard')) {
            return 'Dashboard';
        } else if (pathname.includes('/pengaduan')) {
            return 'Daftar Pengaduan';
        }
        return 'Laporan AA';
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            const username = localStorage.getItem("username");
            const role = localStorage.getItem("role");
            const namaAdminLocal = localStorage.getItem("nama_admin");
            setUserName(username || "Pengguna");
            setRole(role);
            setNamaAdmin(namaAdminLocal);
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        axios
            .get(`${API_URL}/reportCount`)
            .then((res) => {
                const data = res.data?.count ?? 0;
                setCountPending(data);
            })
            .catch(() => {
                setCountPending(0);
            });
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1080);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex h-screen w-screen flex-col sm:flex-row">
            {isMobile ? (
                <>
                    <div className="flex flex-col h-screen overflow-hidden">
                        {/* Combined TopNavbar with SidebarHorizontal for Mobile */}
                        <TopNavbar 
                            title={getPageTitle()}
                            userName={userName || "Pengguna"}
                            role={role}
                            onLogout={handleLogout}
                            isMobile={true}
                            countPending={countPending}
                            namaAdmin={namaAdmin || undefined}
                        />

                        {/* CONTENT */}
                        <div className="flex-1 overflow-auto bg-white">
                            {children}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <Sidebar countPending={countPending} />
                    <main className="flex-1 bg-gray-900 text-white flex flex-col overflow-hidden">
                        {/* TOP NAVBAR */}
                        <TopNavbar 
                            title={getPageTitle()}
                            userName={userName || "Pengguna"}
                            role={role}
                            onLogout={handleLogout}
                            isMobile={false}
                            countPending={countPending}
                            namaAdmin={namaAdmin || undefined}
                        />

                        {/* CONTENT */}
                        <div className="flex-1 overflow-auto bg-white">
                            {children}
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}
