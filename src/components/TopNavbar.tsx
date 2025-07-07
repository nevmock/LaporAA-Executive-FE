"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiLogOut, FiHome, FiInbox, FiUsers } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import MessageCounter from "./socket/MessageCounter";
import NotificationDropdown from "./socket/NotificationDropdown";

interface TopNavbarProps {
    title: string;
    userName: string;
    role: string | null;
    onLogout: () => void;
    isMobile?: boolean;
    // Note: countPending parameter removed as it's unused (replaced by real-time MessageCounter)
    namaAdmin?: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ title, userName, role, onLogout, isMobile = false, namaAdmin }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get user initials for avatar
    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        onLogout();
    };

    return (
        <div className={`border-b border-gray-200 px-4 py-2 shadow-sm text-sm flex justify-between items-center sticky top-0 z-[9000] h-12 ${
            isMobile 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-700'
        }`}>
            {/* Left side - Logo and Title for Mobile, just Title for Desktop */}
            <div className="flex items-center gap-3">
                {isMobile && (
                    <>
                        <Image
                            src="/LAPOR AA BUPATI.png"
                            alt="Logo LaporAA"
                            width={28}
                            height={28}
                            className="rounded-sm"
                        />
                        <span className="text-base font-bold tracking-wide">LaporAA</span>
                    </>
                )}
                {!isMobile && (
                    <h1 className="font-semibold text-lg text-gray-900">{title}</h1>
                )}
            </div>

            {/* Right side - Navigation for Mobile, Real-time indicators for Desktop */}
            <div className="flex items-center gap-4">
                {/* Real-time components - visible on both mobile and desktop */}
                <div className="flex items-center gap-2">
                    {/* Connection Status */}
                    {/* <ConnectionStatus showText={false} /> */}
                    
                    {/* Notifications Dropdown */}
                    <NotificationDropdown />
                </div>

                {isMobile && (
                    <nav className="flex items-center gap-4 text-white text-sm">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1 hover:text-red-400 transition"
                        >
                            <FiHome size={18} />
                        </Link>

                        <Link
                            href="/pengaduan"
                            className="relative flex items-center gap-1 hover:text-red-400 transition"
                        >
                            <FiInbox size={18} />
                            {/* Use real-time MessageCounter instead of static countPending */}
                            <MessageCounter 
                                className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow"
                                showIcon={false}
                            />
                        </Link>
                    </nav>
                )}
                
                {/* User Avatar Dropdown */}
                <div className="relative flex items-center gap-2" ref={dropdownRef}>
                    {/* Nama Admin - Desktop Only */}
                    {!isMobile && namaAdmin && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-medium">{namaAdmin}</span>
                        </div>
                    )}
                    
                    {/* User Avatar - Clickable */}
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                        {getUserInitials(userName)}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                            {/* User Info in Dropdown */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                        {getUserInitials(userName)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">{userName}</span>
                                        {role && (
                                            <span className="text-xs text-gray-500">{role}</span>
                                        )}
                                        {!isMobile && namaAdmin && (
                                            <span className="text-xs text-blue-600 font-medium">{namaAdmin}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                {/* User Management - SuperAdmin only */}
                                {role === 'SuperAdmin' && (
                                    <Link
                                        href="/user-management"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center gap-3 transition-all duration-200 mb-1"
                                    >
                                        <FiUsers size={16} className="text-blue-500" />
                                        <span>User Management</span>
                                    </Link>
                                )}
                                
                                <button
                                    onClick={handleLogoutClick}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md flex items-center gap-3 transition-all duration-200"
                                >
                                    <FiLogOut size={16} className="text-red-500" />
                                    <span>Sign out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopNavbar;
