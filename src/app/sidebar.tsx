"use client";

import {
    FiLogOut,
    FiHome,
    FiInbox,
    FiChevronLeft
} from "react-icons/fi";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tooltip } from "../components/Tooltip";
import Image from "next/image";

interface SidebarProps {
    countPending: number;
}

const Sidebar: React.FC<SidebarProps> = ({ countPending }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const navItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${isActive
            ? "bg-red-100 text-red-500 font-semibold"
            : "hover:bg-gray-800 text-white"
        }`;

    return (
        <div
            className={`h-screen bg-gray-900 text-white flex flex-col justify-between shadow-lg transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-[180px]"
                }`}
        >
            {/* TOP SECTION: Brand & Toggle */}
            <div className="w-full">
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`flex items-center gap-2 cursor-pointer px-4 py-3 ${isCollapsed ? "justify-center" : "justify-between"
                        } hover:bg-gray-800 transition`}
                >
                    <span className="text-lg font-bold tracking-wide">
                        {isCollapsed ? (
                            <img
                                src="/LAPOR AA BUPATI.png"
                                alt="Logo LaporAA"
                                style={{ width: "40px", height: "40px" }}
                            />
                        ) : (
                            "LaporAA"
                        )}

                    </span>
                    {!isCollapsed && (
                        <FiChevronLeft size={20} className="text-white" />
                    )}
                </div>

                {/* MENU */}
                <nav className="flex flex-col gap-4 mt-4 px-3">
                    {/* Dashboard */}
                    <Link href="/dashboard" passHref>
                        <div className={navItemClass(pathname === "/dashboard")}>
                            {isCollapsed ? (
                                <Tooltip text="Dashboard">
                                    <FiHome size={22} />
                                </Tooltip>
                            ) : (
                                <>
                                    <FiHome size={22} />
                                    <span className="text-sm font-medium">Dashboard</span>
                                </>
                            )}
                        </div>
                    </Link>

                    {/* Pengaduan */}
                    <Link href="/pengaduan" passHref>
                        <div className={`relative ${navItemClass(pathname.startsWith("/pengaduan"))}`}>
                            {isCollapsed ? (
                                <Tooltip text="Pengaduan">
                                    <FiInbox size={22} />
                                </Tooltip>
                            ) : (
                                <>
                                    <FiInbox size={22} />
                                    <span className="text-sm font-medium">Pengaduan</span>
                                </>
                            )}
                            {countPending > 0 && (
                                <div className={`absolute -top-2 ${isCollapsed ? "left-7" : "left-7"} bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md`}>
                                    {countPending}
                                </div>
                            )}
                        </div>
                    </Link>
                </nav>
            </div>

            {/* Logout */}
            <div className="mb-6 px-3">
                <div
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition"
                    onClick={handleLogout}
                >
                    {isCollapsed ? (
                        <Tooltip text="Logout">
                            <FiLogOut size={22} />
                        </Tooltip>
                    ) : (
                        <>
                            <FiLogOut size={22} />
                            <span className="text-sm font-medium">Logout</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;