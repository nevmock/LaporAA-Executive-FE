"use client";

import Sidebar from "./sidebar";
import SidebarHorizontal from "./sidebarHorizontal";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [countPending, setCountPending] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
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
            setIsMobile(window.innerWidth < 640);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden flex-col sm:flex-row">
            {isMobile ? (
                <SidebarHorizontal countPending={countPending} onLogout={handleLogout} />
            ) : (
                <Sidebar countPending={countPending} />
            )}

            <main className="flex-1 overflow-y-auto bg-white">
                {children}
            </main>
        </div>
    );
}
