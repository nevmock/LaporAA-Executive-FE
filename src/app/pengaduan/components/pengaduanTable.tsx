"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

interface Location {
    latitude: number;
    longitude: number;
    description: string;
}

interface Tindakan {
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
}

interface Chat {
    _id: string;
    sessionId: string;
    from: string;
    user: string;
    address: string;
    location: Location;
    message: string;
    photos: string[];
    createdAt?: string;
    updatedAt?: string;
    tindakan?: Tindakan;
    rating?: number;
}

type SortKey = "sessionId" | "user" | "from" | "address" | "description" | "prioritas" | "situasi" | "status" | "opd" | "timer";

function getElapsedTime(createdAt?: string): string {
    if (!createdAt) return "-";
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
    if (diffDays > 0) return `${diffDays} hari ${diffHours} jam lalu`;
    if (diffHours > 0) return `${diffHours} jam ${diffMinutes} menit lalu`;
    if (diffMinutes > 0) return `${diffMinutes} menit lalu`;
    return "Baru saja";
}

const statusOrder = ["Perlu Verifikasi", "Sedang di Verifikasi", "Proses Penyelesaian", "Proses Penyelesaian Ulang", "Selesai"];

export default function PengaduanTable({ data }: { data: Chat[] }) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("sessionId");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const [selectedLoc, setSelectedLoc] = useState<{ lat: number; lon: number; description: string } | null>(null);

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
        const filtered = data.filter((item) =>
            item.sessionId.toLowerCase().includes(lowerSearch) ||
            item.from.toLowerCase().includes(lowerSearch) ||
            item.address.toLowerCase().includes(lowerSearch) ||
            item.location.description.toLowerCase().includes(lowerSearch) ||
            item.message.toLowerCase().includes(lowerSearch)
        );

        return filtered.sort((a, b) => {
            // Prioritas dulu
            const aPrioritas = a.tindakan?.prioritas === "Ya" ? 1 : 0;
            const bPrioritas = b.tindakan?.prioritas === "Ya" ? 1 : 0;
            if (aPrioritas !== bPrioritas) return bPrioritas - aPrioritas;

            // Status sorting by predefined order
            const aStatusIdx = statusOrder.indexOf(a.tindakan?.status || "");
            const bStatusIdx = statusOrder.indexOf(b.tindakan?.status || "");
            return aStatusIdx - bStatusIdx;
        });
    }, [data, search]);

    const renderSortArrow = (key: SortKey) => {
        if (key !== sortKey) return "";
        return sortOrder === "asc" ? "↑" : "↓";
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Cari data pengaduan. . ."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th onClick={() => handleSort("prioritas")} className="px-4 py-2 cursor-pointer select-none">Prioritas Bupati {renderSortArrow("prioritas")}</th>
                            <th onClick={() => handleSort("sessionId")} className="px-4 py-2 cursor-pointer select-none">No. Pengaduan {renderSortArrow("sessionId")}</th>
                            <th onClick={() => handleSort("user")} className="px-4 py-2 cursor-pointer select-none">Nama {renderSortArrow("user")}</th>
                            <th onClick={() => handleSort("from")} className="px-4 py-2 cursor-pointer select-none">No. Kontak {renderSortArrow("from")}</th>
                            <th onClick={() => handleSort("address")} className="px-4 py-2 cursor-pointer select-none">Domisili {renderSortArrow("address")}</th>
                            <th onClick={() => handleSort("description")} className="px-4 py-2 cursor-pointer select-none">Lokasi Kejadian {renderSortArrow("description")}</th>
                            <th onClick={() => handleSort("situasi")} className="px-4 py-2 cursor-pointer select-none">Situasi {renderSortArrow("situasi")}</th>
                            <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none">Status {renderSortArrow("status")}</th>
                            <th onClick={() => handleSort("opd")} className="px-4 py-2 cursor-pointer select-none">OPD Terkait {renderSortArrow("opd")}</th>
                            <th onClick={() => handleSort("timer")} className="px-4 py-2 cursor-pointer select-none">Waktu Berjalan {renderSortArrow("timer")}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-100 text-gray-900">
                        {filteredData.length > 0 ? (
                            filteredData.map((chat) => {
                                const isPrioritas = chat.tindakan?.prioritas === "Ya";
                                const isPerluVerifikasi = chat.tindakan?.status === "Perlu Verifikasi";
                                const rowClass = isPrioritas
                                    ? "bg-red-100"
                                    : isPerluVerifikasi
                                    ? "bg-yellow-100"
                                    : "";

                                return (
                                    <tr key={chat.sessionId} className={`border-b border-gray-300 ${rowClass}`}>
                                        <td className="px-4 py-2">{chat.tindakan?.prioritas || "-"}</td>
                                        <td className="px-4 py-2">
                                            <Link href={`/pengaduan/${chat.sessionId}`} className="text-blue-600 hover:underline">
                                                {chat.sessionId}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">{chat.user || "-"}</td>
                                        <td className="px-4 py-2">{chat.from || "-"}</td>
                                        <td className="px-4 py-2">{chat.address || "-"}</td>
                                        <td className="px-4 py-2">
                                            {chat.location?.description ? (
                                                <button
                                                    onClick={() => setSelectedLoc({
                                                        lat: chat.location.latitude,
                                                        lon: chat.location.longitude,
                                                        description: chat.location.description
                                                    })}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {chat.location.description}
                                                </button>
                                            ) : "-"}
                                        </td>
                                        <td className="px-4 py-2">{chat.tindakan?.situasi || "-"}</td>
                                        <td className="px-4 py-2">{chat.tindakan?.status || "-"}</td>
                                        <td className="px-4 py-2">{chat.tindakan?.opd || "-"}</td>
                                        <td className="px-4 py-2">{getElapsedTime(chat.createdAt)}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={11} className="text-center py-4 text-gray-500">Tidak ada data ditemukan.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 w-[90%] max-w-md relative shadow-lg">
                        <button onClick={() => setSelectedLoc(null)} className="absolute top-2 right-3 text-gray-700 hover:text-black text-lg">✕</button>
                        <h2 className="text-lg font-semibold mb-2">{selectedLoc.description}</h2>
                        <MapPopup lat={selectedLoc.lat} lon={selectedLoc.lon} description={selectedLoc.description} />
                    </div>
                </div>
            )}
        </div>
    );
}
