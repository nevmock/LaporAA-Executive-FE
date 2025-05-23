import { FiLogOut, FiHome, FiInbox } from "react-icons/fi";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
    countPending: number;
}

const Sidebar: React.FC<SidebarProps> = ({ countPending }) => {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col items-center py-6 shadow-lg transition-all duration-300">
            {/* Home */}
            <Link href="/dashboard" passHref>
                <div className="text-4xl my-4 cursor-pointer transition-transform hover:scale-110">
                    <FiHome />
                </div>
            </Link>

            {/* Pengaduan */}
            <Link href="/pengaduan" passHref>
                <div className="relative text-4xl my-4 cursor-pointer transition-transform hover:scale-110">
                    <FiInbox />
                    {countPending > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                            {countPending}
                        </div>
                    )}
                </div>
            </Link>

            {/* Logout */}
            <div className="mt-auto mb-4">
                <div className="text-4xl cursor-pointer transition-transform hover:scale-110">
                    <FiLogOut onClick={handleLogout} />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;