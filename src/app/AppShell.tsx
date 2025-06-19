"use client";

import Sidebar from "../components/sidebar";
import SidebarHorizontal from "../components/sidebarHorizontal";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { FiLogOut } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [countPending, setCountPending] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const router = useRouter();

    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            const username = localStorage.getItem("username");
            const role = localStorage.getItem("role");
            setUserName(username || "Pengguna");
            setRole(role);
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

            <main className="flex-1 overflow-y-auto bg-gray-900 text-white flex flex-col">
                {/* TOP NAVBAR */}
                <div className="bg-gray-900 px-4 py-3 h-[35px] shadow-lg text-white text-xs flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {role && (
                            <span className={`w-2.5 h-2.5 rounded-full bg-white`} />
                        )}
                        <span>
                            User : {userName || "Pengguna"}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 flex items-center gap-1"
                    >
                        Logout <FiLogOut size={12} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {children}
                </div>
            </main>
        </div>
    );
}
