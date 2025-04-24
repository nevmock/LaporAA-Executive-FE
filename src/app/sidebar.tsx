import { FiSettings, FiHome, FiInbox } from "react-icons/fi";
import Link from "next/link";
import React from "react";

interface SidebarProps {
    countPending: number;
}

const Sidebar: React.FC<SidebarProps> = ({ countPending }) => {

    return (
        <div className="w-24 bg-gray-900 text-white flex flex-col items-center py-6 shadow-lg">
            <Link href="/dashboard" passHref>
                <div className="text-4xl my-4 cursor-pointer transition-transform hover:scale-110">
                    <FiHome />
                </div>
            </Link>
            <Link href="/pengaduan" passHref>
                <div className="relative text-4xl my-4 cursor-pointer transition-transform hover:scale-110">
                    <FiInbox />
                    {countPending > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                            {countPending}
                        </div>
                    )}
                </div>
            </Link>
            <div className="text-3xl mt-auto mb-4 cursor-pointer transition-transform hover:scale-110">
                <FiSettings />
            </div>
        </div>
    );
};

export default Sidebar;
