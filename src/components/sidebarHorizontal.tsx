"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FiHome, FiInbox, FiFileText } from "react-icons/fi";

interface Props {
    countPending: number;
    onLogout: () => void;
}

export default function SidebarHorizontal({ countPending }: Props) {
    return (
        <header className="flex justify-between items-center px-4 py-2 bg-gray-900 text-white shadow-md">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <Image
                    src="/LAPOR AA BUPATI.png"
                    alt="Logo LaporAA"
                    width={32}
                    height={32}
                    className="rounded-sm"
                />
                <span className="text-lg font-bold tracking-wide">LaporAA</span>
            </div>

            {/* Menu Items */}
            <nav className="flex items-center gap-6 text-white text-sm relative">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-1 hover:text-red-400 transition"
                >
                    <FiHome size={20} />
                </Link>

                <Link
                    href="/pengaduan"
                    className="relative flex items-center gap-1 hover:text-red-400 transition"
                >
                    <FiInbox size={20} />
                    {countPending > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
                            {countPending}
                        </span>
                    )}
                </Link>

                <Link
                    href="/dashboard/buat-laporan"
                    className="flex items-center gap-1 hover:text-red-400 transition"
                >
                    <FiFileText size={20} />
                </Link>
            </nav>
        </header>
    );
}
