"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

interface Chat {
    _id: string;
    senderName: string;
    senderPhone?: string;
    senderAddress?: string;
    date?: string;
    priority?: string;
    situation?: string;
    status?: string;
    relatedDepartments?: string[];
    opd?: string;
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
                item._id.toLowerCase().includes(lowerSearch) ||
                item.senderName?.toLowerCase().includes(lowerSearch) ||
                item.senderPhone?.toLowerCase().includes(lowerSearch)
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
                    placeholder="Cari data pengaduan . . ."
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
                            <th onClick={() => handleSort("_id")} className="px-4 py-2 cursor-pointer select-none">
                                No. Tiket {renderSortArrow("_id")}
                            </th>
                            <th onClick={() => handleSort("date")} className="px-4 py-2 cursor-pointer select-none">
                                Tanggal {renderSortArrow("date")}
                            </th>
                            <th onClick={() => handleSort("senderName")} className="px-4 py-2 cursor-pointer select-none">
                                Nama {renderSortArrow("senderName")}
                            </th>
                            <th onClick={() => handleSort("senderPhone")} className="px-4 py-2 cursor-pointer select-none">
                                Kontak {renderSortArrow("senderPhone")}
                            </th>
                            <th onClick={() => handleSort("senderAddress")} className="px-4 py-2 cursor-pointer select-none">
                                Lokasi {renderSortArrow("senderAddress")}
                            </th>
                            <th onClick={() => handleSort("priority")} className="px-4 py-2 cursor-pointer select-none">
                                Prioritas {renderSortArrow("priority")}
                            </th>
                            <th onClick={() => handleSort("situation")} className="px-4 py-2 cursor-pointer select-none">
                                Situasi {renderSortArrow("situation")}
                            </th>
                            <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none">
                                Status {renderSortArrow("status")}
                            </th>
                            <th onClick={() => handleSort("opd")} className="px-4 py-2 cursor-pointer select-none">
                                OPD Terkait {renderSortArrow("opd")}
                            </th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-100 text-gray-900">
                        {filteredData.length > 0 ? (
                            filteredData.map((chat) => (
                                <tr key={chat._id} className="border-b border-gray-300">
                                    <td className="px-4 py-2">
                                        <Link
                                            href={`/pengaduan/${chat._id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {chat._id}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">{chat.date || "-"}</td>
                                    <td className="px-4 py-2">{chat.senderName || "-"}</td>
                                    <td className="px-4 py-2">{chat._id || "-"}</td>
                                    <td className="px-4 py-2">{chat.senderAddress || "-"}</td>
                                    <td className="px-4 py-2">{chat.priority || "-"}</td>
                                    <td className="px-4 py-2">{chat.situation || "-"}</td>
                                    <td className="px-4 py-2">{chat.status || "-"}</td>
                                    <td className="px-4 py-2">
                                        {chat.relatedDepartments?.join(", ") || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-center">▾</td>
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
