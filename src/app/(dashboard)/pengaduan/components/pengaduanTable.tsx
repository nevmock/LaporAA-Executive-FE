"use client";

import React, {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Chat, SortKey  } from "../../../../lib/types";
import {Switch} from "@headlessui/react";
import axios from "axios";
import { FaStar, FaIdCard, FaUser, FaPhone, FaMapMarkerAlt, FaMap, FaExclamationCircle, FaCheckCircle, FaBuilding, FaClock } from "react-icons/fa";

const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

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

const statusOrder = ["Perlu Verifikasi", "Verifikasi Kelengkapan Berkas", "Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan", "Ditolak"];

export default function PengaduanTable() {
    const [data, setData] = useState<Chat[]>([]);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("sessionId");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selectedLoc, setSelectedLoc] = useState<{ lat: number; lon: number; description: string } | null>(null);

    useEffect(() => {
        getReports().then(() => {

        })
    }, []);

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
            // // Prioritas dulu
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

    const toggleMode = async (tindakanId: string, prioritas: boolean) => {
        // setLoadingMode(true);
        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/tindakan/${tindakanId}/prioritas`, { prioritas: prioritas ? "Ya" : "Tidak" }).then(async () => {
                await getReports()
            })
        } catch (err) {
            console.error("Gagal mengubah mode:", err);
            alert("❌ Gagal mengubah mode.");
        } finally {
            // setLoadingMode(false);
        }
    };

    const getReports = async () => {
        axios
            .get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`)
            .then((res) => {
                const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];

                // Transform user object (jika masih object) jadi string name
                const processedData: Chat[] = responseData.map((item: any) => ({
                    ...item,
                    user: typeof item.user === "object" ? item.user.name : item.user,
                    address: typeof item.user === "object" ? item.user.address : item.address,
                }));

                setData(processedData);
                console.log("✅ fetched data:", processedData);
            })
            .catch((err) => {
                console.error("❌ fetch error:", err);
                setData([]);
            });
    }

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
                        <th onClick={() => handleSort("prioritas")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaStar className={`inline mr-1`}/> Prioritas Bupati {renderSortArrow("prioritas")}
                        </th>
                        <th onClick={() => handleSort("sessionId")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaIdCard className={`inline mr-1`}/> No. Pengaduan {renderSortArrow("sessionId")}
                        </th>
                        <th onClick={() => handleSort("user")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaUser className={`inline mr-1`}/> Nama {renderSortArrow("user")}
                        </th>
                        <th onClick={() => handleSort("from")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaPhone className={`inline mr-1`}/> No. Kontak {renderSortArrow("from")}
                        </th>
                        <th onClick={() => handleSort("address")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaMapMarkerAlt className={`inline mr-1`}/> Domisili {renderSortArrow("address")}
                        </th>
                        <th onClick={() => handleSort("description")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaMap className={`inline mr-1`}/> Lokasi Kejadian {renderSortArrow("description")}
                        </th>
                        <th onClick={() => handleSort("situasi")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaExclamationCircle className={`inline mr-1`}/> Situasi {renderSortArrow("situasi")}
                        </th>
                        <th onClick={() => handleSort("status")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaCheckCircle className={`inline mr-1`}/> Status {renderSortArrow("status")}
                        </th>
                        <th onClick={() => handleSort("opd")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaBuilding className={`inline mr-1`}/> OPD Terkait {renderSortArrow("opd")}
                        </th>
                        <th onClick={() => handleSort("timer")} className="px-4 py-2 cursor-pointer select-none gap-2">
                            <FaClock className={`inline mr-1`}/> Waktu Berjalan {renderSortArrow("timer")}
                        </th>
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
                                        {
                                            localStorage.getItem('role') == 'Bupati' ?
                                                <td className="px-4 py-2">
                                                    <Switch
                                                        checked={chat.tindakan?.prioritas === "Ya"}
                                                        onChange={async (e) => {
                                                            await toggleMode(chat.tindakan?.report!, e)
                                                        }}
                                                        className={`${chat.tindakan?.prioritas === "Ya" ? "bg-green-500" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                    >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${chat.tindakan?.prioritas === "Ya" ? "translate-x-6" : "translate-x-1"}`}
                    />
                                                    </Switch>
                                                </td>
                                                :
                                                <td className="px-4 py-2">{chat.tindakan?.prioritas || "-"}</td>
                                        }
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
