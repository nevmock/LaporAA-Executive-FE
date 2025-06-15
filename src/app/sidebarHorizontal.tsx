// components/SidebarHorizontal.tsx
"use client";
import React from "react";
import Link from "next/link";
import { FiHome, FiInbox, FiLogOut } from "react-icons/fi";

interface Props {
    countPending: number;
    onLogout: () => void;
}

export default function SidebarHorizontal({ countPending, onLogout }: Props) {
    return (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-white shadow-md">
            <div className="flex items-center gap-4">
                <img src="/LAPOR AA BUPATI.png" alt="Logo" className="w-8 h-8" />
                <span className="text-lg font-bold">LaporAA</span>
            </div>
            <div className="flex items-center gap-6 text-white text-sm">
                <Link href="/dashboard" className="flex items-center gap-1">
                    <FiHome />
                    <span>Dashboard</span>
                </Link>
                <Link href="/pengaduan" className="relative flex items-center gap-1">
                    <FiInbox />
                    <span>Pengaduan</span>
                    {countPending > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-1 rounded-full">
                            {countPending}
                        </span>
                    )}
                </Link>
                <button onClick={onLogout} className="flex items-center gap-1">
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
