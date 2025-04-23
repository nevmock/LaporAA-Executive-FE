"use client";
import dynamic from "next/dynamic";
const MapPersebaran = dynamic(() => import("./components/MapPersebaran"), { ssr: false });


export default function Home() {
    return (
        <div className="w-full h-screen bg-white p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Halaman Home</h2>

            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 rounded-xl p-6 shadow text-center">
                    <p className="font-medium text-gray-700">Pengaduan belum dibaca</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-6 shadow text-center">
                    <p className="font-medium text-gray-700">Responsiveness</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-6 shadow text-center">
                    <p className="font-medium text-gray-700">Persebaran</p>
                </div>
            </div>

            {/* Maps Container */}
            <div className="bg-gray-200 rounded-xl h-[300px] flex items-center justify-center shadow">
                <MapPersebaran />
            </div>
        </div>
    );
}
