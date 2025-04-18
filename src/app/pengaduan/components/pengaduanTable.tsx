"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

interface Chat {
    _id: string[];
    sessionId: string;
    from: string;
    user: string[];
    address: string;
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
    message: string;
    photos: string[];
    status: "in_progress" | "done" | "rejected";
    createdAt?: string;
    updatedAt?: string;
    tindakan?: [{
        _id: string;
        report: string;
        hasil: string;
        kesimpulan: string;
        prioritas: string;
        situasi: string;
        status: string;
        opd: string;
        photos: string[];
        createdAt: string;
        updatedAt: string;
    }];
}

type SortKey = keyof Chat;

export default function PengaduanTable({ data }: { data: Chat[] }) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("_id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const [selectedLoc, setSelectedLoc] = useState<{
        lat: number;
        lon: number;
        description: string;
    } | null>(null);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    const filteredData = useMemo(() => {
        const lowerSearch = search.toLowerCase();

        const filtered = data.filter(
            (item) =>
                item.sessionId.toLowerCase().includes(lowerSearch) ||
                item.from.toLowerCase().includes(lowerSearch) ||
                item.address.toLowerCase().includes(lowerSearch) ||
                item.location.description.toLowerCase().includes(lowerSearch) ||
                item.message.toLowerCase().includes(lowerSearch)
        );

        return filtered.sort((a, b) => {
            const aValue = a[sortKey] ?? "";
            const bValue = b[sortKey] ?? "";

            return sortOrder === "asc"
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [data, search, sortKey, sortOrder]);

    const renderSortArrow = (key: SortKey) => {
        if (key !== sortKey) return "";
        return sortOrder === "asc" ? "↑" : "↓";
    };

    return (
        <div className="space-y-4">
            {/* 🔍 Search */}
            <div>
                <input
                    type="text"
                    placeholder="Cari data pengaduan. . ."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* 📋 Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th onClick={() => handleSort("sessionId")} className="px-4 py-2 cursor-pointer select-none">
                                No. Pengaduan {renderSortArrow("sessionId")}
                            </th>
                            <th onClick={() => handleSort("createdAt")} className="px-4 py-2 cursor-pointer select-none">
                                Tanggal Laporan {renderSortArrow("createdAt")}
                            </th>
                            <th onClick={() => handleSort("updatedAt")} className="px-4 py-2 cursor-pointer select-none">
                                Tanggal Update {renderSortArrow("updatedAt")}
                            </th>
                            <th onClick={() => handleSort("user")} className="px-4 py-2 cursor-pointer select-none">
                                Nama {renderSortArrow("user")}
                            </th>
                            <th onClick={() => handleSort("from")} className="px-4 py-2 cursor-pointer select-none">
                                No. Kontak {renderSortArrow("from")}
                            </th>
                            <th onClick={() => handleSort("address")} className="px-4 py-2 cursor-pointer select-none">
                                Domisili {renderSortArrow("address")}
                            </th>
                            <th onClick={() => handleSort("location")} className="px-4 py-2 cursor-pointer select-none">
                                Lokasi Kejadian {renderSortArrow("location")}
                            </th>
                            <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none">
                                Prioritas {renderSortArrow("status")}
                            </th>
                            <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none">
                                Situasi {renderSortArrow("status")}
                            </th>
                            <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none">
                                Status {renderSortArrow("status")}
                            </th>
                            <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none">
                                OPD Terkait {renderSortArrow("status")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-100 text-gray-900">
                        {filteredData.length > 0 ? (
                            filteredData.map((chat) => (
                                <tr key={chat.sessionId} className="border-b border-gray-300">
                                    <td className="px-4 py-2">
                                        <Link
                                            href={`/pengaduan/${chat.sessionId}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {chat.sessionId}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">{chat.createdAt || "-"}</td>
                                    <td className="px-4 py-2">{chat.updatedAt || "-"}</td>
                                    <td className="px-4 py-2">{chat.user || "-"}</td>
                                    <td className="px-4 py-2">{chat.from || "-"}</td>
                                    <td className="px-4 py-2">{chat.address || "-"}</td>
                                    <td className="px-4 py-2">
                                        {chat.location?.description ? (
                                            <button
                                                onClick={() =>
                                                    setSelectedLoc({
                                                        lat: chat.location.latitude,
                                                        lon: chat.location.longitude,
                                                        description: chat.location.description
                                                    })
                                                }
                                                className="text-blue-600 hover:underline"
                                            >
                                                {chat.location.description}
                                            </button>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.prioritas || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.situasi || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.status || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.opd || "-"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={11} className="text-center py-4 text-gray-500">
                                    Tidak ada data ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🗺️ Modal Map */}
            {selectedLoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 w-[90%] max-w-md relative shadow-lg">
                        <button
                            onClick={() => setSelectedLoc(null)}
                            className="absolute top-2 right-3 text-gray-700 hover:text-black text-lg"
                        >
                            ✕
                        </button>
                        <h2 className="text-lg font-semibold mb-2">{selectedLoc.description}</h2>
                        <MapPopup lat={selectedLoc.lat} lon={selectedLoc.lon} description={selectedLoc.description} />
                    </div>
                </div>
            )}
        </div>
    );
}
