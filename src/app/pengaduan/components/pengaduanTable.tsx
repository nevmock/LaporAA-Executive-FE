"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

interface Chat {
    _id: string[]; // Sesuai dengan MongoDB ObjectId
    sessionId: string; // Ditambahkan dari skema
    from: string; // Ditambahkan dari skema
    user: string[]; // Mengacu pada ObjectId dari UserProfile
    address: string; // Ditambahkan dari skema
    location: string; // Ditambahkan dari skema
    message: string; // Ditambahkan dari skema
    photos: string[]; // URL foto, default array kosong
    status: "in_progress" | "done" | "rejected"; // Enum status
    createdAt?: string; // Ditambahkan karena timestamps
    updatedAt?: string; // Ditambahkan karena timestamps
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

    // 🔁 Handle Klik Sort
    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    // 🔍 Filter + Sort
    const filteredData = useMemo(() => {
        const lowerSearch = search.toLowerCase();

        const filtered = data.filter(
            (item) =>
                //   item._id.toLowerCase().includes(lowerSearch) ||
                item.sessionId.toLowerCase().includes(lowerSearch) ||
                item.from.toLowerCase().includes(lowerSearch) ||
                item.address.toLowerCase().includes(lowerSearch) ||
                item.location.toLowerCase().includes(lowerSearch) ||
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
            {/* Search Input */}
            <div>
                <input
                    type="text"
                    placeholder="Cari data pengaduan. . ."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Tabel */}
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
                                    <td className="px-4 py-2">{chat.location || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.prioritas || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.situasi || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.status || "-"}</td>
                                    <td className="px-4 py-2">{chat?.tindakan?.[0]?.opd || "-"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="text-center py-4 text-gray-500">
                                    Tidak ada data ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
