"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    FiHome,
    FiInbox,
    FiChevronLeft,
    FiFileText,
    FiSettings,
} from "react-icons/fi";
import { Tooltip } from "./Tooltip";

interface SidebarProps {
    countPending: number;
    role?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ countPending, role }) => {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const isActive = (path: string) => {
        // Exact match untuk semua paths - tidak ada partial matching
        return pathname === path;
    };

    const navItemClass = (active: boolean) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${active
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
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    className={`flex items-center gap-2 cursor-pointer px-4 py-3 ${isCollapsed ? "justify-center" : "justify-between"
                        } hover:bg-gray-800 transition`}
                >
                    {isCollapsed ? (
                        <Image
                            src="/LAPOR AA BUPATI.png"
                            alt="Logo LaporAA"
                            width={40}
                            height={40}
                        />
                    ) : (
                        <span className="text-lg font-bold tracking-wide">LaporAA</span>
                    )}
                    {!isCollapsed && <FiChevronLeft size={20} className="text-white" />}
                </div>

                {/* MENU */}
                <nav className="flex flex-col gap-5 mt-4 px-3">
                    {/* Dashboard */}
                    <Link href="/dashboard" className={navItemClass(isActive("/dashboard"))}>
                        {isCollapsed ? (
                            <Tooltip text="Dashboard" position="right">
                                <div className="flex items-center justify-center">
                                    <FiHome size={22} />
                                </div>
                            </Tooltip>
                        ) : (
                            <>
                                <FiHome size={22} />
                                <span className="text-sm font-medium">Dashboard</span>
                            </>
                        )}
                    </Link>

                    {/* Pengaduan */}
                    <Link href="/pengaduan" className={`relative ${navItemClass(isActive("/pengaduan"))}`}>
                        {isCollapsed ? (
                            <Tooltip text="Pengaduan" position="right">
                                <div className="flex items-center justify-center">
                                    <FiInbox size={22} />
                                </div>
                            </Tooltip>
                        ) : (
                            <>
                                <FiInbox size={22} />
                                <span className="text-sm font-medium">Pengaduan</span>
                            </>
                        )}
                        {countPending > 0 && (
                            <div
                                className={`absolute -top-3 ${isCollapsed ? 'left-4' : 'left-6'} bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md`}
                            >
                                {countPending}
                            </div>
                        )}
                    </Link>

                    {/* Buat Laporan */}
                    <Link href="/dashboard/buat-laporan" className={navItemClass(isActive("/dashboard/buat-laporan"))}>
                        {isCollapsed ? (
                            <Tooltip text="Buat Laporan" position="right">
                                <div className="flex items-center justify-center">
                                    <FiFileText size={22} />
                                </div>
                            </Tooltip>
                        ) : (
                            <>
                                <FiFileText size={22} />
                                <span className="text-sm font-medium">Buat Laporan</span>
                            </>
                        )}
                    </Link>

                    {/* User Management - SuperAdmin only */}
                    {/* {role === 'SuperAdmin' && (
                        <Link href="/user-management" className={navItemClass(isActive("/user-management"))}>
                            {isCollapsed ? (
                                <Tooltip text="Pengaturan" position="right">
                                    <div className="flex items-center justify-center">
                                        <FiSettings size={22} />
                                    </div>
                                </Tooltip>
                            ) : (
                                <>
                                    <FiSettings size={22} />
                                    <span className="text-sm font-medium">Pengaturan</span>
                                </>
                            )}
                        </Link>
                    )} */}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
