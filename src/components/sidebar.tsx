"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    FiHome,
    FiInbox,
    FiChevronLeft,
} from "react-icons/fi";
import { Tooltip } from "./Tooltip";

interface SidebarProps {
    countPending: number;
}

const Sidebar: React.FC<SidebarProps> = ({ countPending }) => {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(`${path}/`);

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
                    <Link href="/dashboard" passHref>
                        <div className={navItemClass(isActive("/dashboard"))}>
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
                        <div className={`relative ${navItemClass(isActive("/pengaduan"))}`}>
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
                                <div
                                    className={`absolute -top-3 left-6 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md`}
                                >
                                    {countPending}
                                </div>
                            )}
                        </div>
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;