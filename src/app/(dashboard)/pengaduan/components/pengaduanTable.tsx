"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "axios";
import { Switch } from "@headlessui/react";
import {
    FaStar, FaIdCard, FaUser, FaPhone, FaMapMarkerAlt, FaMap,
    FaExclamationCircle, FaCheckCircle, FaBuilding, FaClock
} from "react-icons/fa";
import { IoIosRefresh } from "react-icons/io";
import { Chat, SortKey } from "../../../../lib/types";
const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

function getElapsedTime(createdAt?: string): string {
    if (!createdAt) return "-";
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now.getTime() - created.getTime();
    const mins = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} hari ${hours} jam lalu`;
    if (hours > 0) return `${hours} jam ${mins} menit lalu`;
    if (mins > 0) return `${mins} menit lalu`;
    return "Baru saja";
}

const statusOrder = ["Perlu Verifikasi", "Verifikasi Kelengkapan Berkas", "Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan", "Ditolak"];

export default function PengaduanTable() {
    const [data, setData] = useState<Chat[]>([]);
    const [search, setSearch] = useState("");
    const [sorts, setSorts] = useState<{ key: SortKey; order: "asc" | "desc" }[]>([
        { key: "prioritas", order: "desc" },
        { key: "status", order: "asc" },
    ]);
    const [selectedLoc, setSelectedLoc] = useState<{ lat: number; lon: number; desa: string } | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
    const [limit, setLimit] = useState(15);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    const statusTabs = [
        "Semua",
        "Perlu Verifikasi",
        "Verifikasi Situasi",
        "Verifikasi Kelengkapan Berkas",
        "Proses OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Ditolak"
    ];

    const getReports = async (statusParam = selectedStatus, pageParam = page, limitParam = limit) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`, {
                params: {
                    page: pageParam,
                    limit: limitParam,
                    status: statusParam !== "Semua" ? statusParam : undefined
                }
            });

            const responseData = Array.isArray(res.data?.data) ? res.data.data : [];

            const processedData: Chat[] = responseData.map((item: any) => ({
                ...item,
                user: typeof item.user === "object" ? item.user.name : item.user,
                address: typeof item.user === "object" ? item.user.address : item.address,
            }));

            setData(processedData);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error("❌ Fetch error:", err);
            setData([]);
        }
    };

    const getSummary = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports/summary`);
            setStatusCounts(res.data || {});
        } catch (err) {
            console.error("❌ Failed to fetch summary:", err);
            setStatusCounts({});
        }
    };

    const toggleSort = (key: SortKey) => {
        setSorts((prev) => {
            const existing = prev.find((s) => s.key === key);
            if (!existing) return [...prev, { key, order: "asc" }];
            if (existing.order === "asc") return prev.map(s => s.key === key ? { key, order: "desc" } : s);
            return prev.filter((s) => s.key !== key); // reset
        });
    };

    const renderSortArrow = (key: SortKey) => {
        const found = sorts.find((s) => s.key === key);
        if (!found) return "";
        return found.order === "asc" ? "↑" : "↓";
    };

    const toggleMode = async (tindakanId: string, prioritas: boolean) => {
        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/tindakan/${tindakanId}/prioritas`, { prioritas: prioritas ? "Ya" : "-" });
            await getReports();
        } catch (err) {
            console.error("Gagal ubah mode:", err);
        }
    };

    const filteredData = useMemo(() => {
        return [...data].filter((item) => {
            const lower = search.toLowerCase();
            return item.sessionId.toLowerCase().includes(lower) ||
                item.user.toLowerCase().includes(lower) ||
                item.from.toLowerCase().includes(lower) ||
                item.address.toLowerCase().includes(lower) ||
                item.location.desa.toLowerCase().includes(lower) ||
                item.location.kecamatan.toLowerCase().includes(lower) ||
                item.location.kabupaten.toLowerCase().includes(lower);
        }).sort((a, b) => {
            for (const { key, order } of sorts) {
                let valA: any = "", valB: any = "";

                if (key === "prioritas") {
                    valA = a.tindakan?.prioritas === "Ya" ? 1 : 0;
                    valB = b.tindakan?.prioritas === "Ya" ? 1 : 0;
                } else if (key === "status") {
                    valA = statusOrder.indexOf(a.tindakan?.status || "");
                    valB = statusOrder.indexOf(b.tindakan?.status || "");
                } else if (key === "situasi") {
                    valA = a.tindakan?.situasi || "";
                    valB = b.tindakan?.situasi || "";
                } else if (key === "opd") {
                    valA = a.tindakan?.opd || "";
                    valB = b.tindakan?.opd || "";
                } else if (key === "timer") {
                    valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                } else {
                    valA = (a as any)[key] || "";
                    valB = (b as any)[key] || "";
                }

                if (valA < valB) return order === "asc" ? -1 : 1;
                if (valA > valB) return order === "asc" ? 1 : -1;
            }
            return 0;
        });
    }, [data, search, sorts]);

    useEffect(() => {
        getSummary(); // ambil saat awal render
    }, []);

    useEffect(() => {
        getReports(selectedStatus, page, limit);
    }, [selectedStatus, page, limit]);

    return (
        <div className="flex flex-col h-screen">

            <div className="sticky top-0 z-50 m-3">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Daftar Pengaduan</h2>
                <input
                    type="text"
                    placeholder="Cari data pengaduan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm text-gray-700 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sticky top-0 bg-white z-[500] shadow-md"
                />

                <div className="flex items-center justify-between mb-3 mt-5">
                    <div className="flex flex-wrap gap-3">
                        {statusTabs.map((status) => {
                            const label = status === "Semua"
                                ? `Semua (${Object.values(statusCounts).reduce((a, b) => a + b, 0)})`
                                : `${status} (${statusCounts[status] || 0})`;

                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setSelectedStatus(status);
                                        setPage(1);
                                    }}
                                    className={`px-4 py-1 rounded-full text-sm font-semibold border ${selectedStatus === status
                                        ? "bg-pink-600 text-white border-pink-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center space-x-3 mr-3">
                        <button
                            onClick={() => getReports()}
                            title="Refresh data"
                            className="text-gray-500 hover:bg-gray-100 hover:text-black hover:outline-none hover:ring-1 hover:ring-grey-500 px-2 py-1 border border-gray-300"
                        >
                            <IoIosRefresh />
                        </button>

                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1); // reset ke halaman 1 juga saat ganti limit
                            }}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 hover:outline-none hover:ring-1 hover:ring-grey-500"
                        >
                            {[10, 15, 20, 30, 50].map((l) => (
                                <option key={l} value={l}>
                                    Tampilkan {l}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            <div className="flex-1 overflow-y-auto ml-3 mr-3 rounded-t-lg">

                <div className="rounded-lg border border-gray-400">
                    <table className="w-full text-sm text-left h-full">
                        <thead className="bg-gray-800 text-white sticky top-0 text-center z-[500]">
                            <tr>
                                {[
                                    { key: "prioritas", icon: <FaStar />, label: "Prioritas Bupati" },
                                    { key: "sessionId", icon: <FaIdCard />, label: "No. Pengaduan" },
                                    { key: "user", icon: <FaUser />, label: "Nama" },
                                    { key: "from", icon: <FaPhone />, label: "No. Kontak" },
                                    { key: "address", icon: <FaMapMarkerAlt />, label: "Domisili" },
                                    { key: "lokasi_kejadian", icon: <FaMap />, label: "Lokasi Kejadian" },
                                    { key: "situasi", icon: <FaExclamationCircle />, label: "Situasi" },
                                    { key: "status", icon: <FaCheckCircle />, label: "Status" },
                                    { key: "opd", icon: <FaBuilding />, label: "OPD Terkait" },
                                    { key: "timer", icon: <FaClock />, label: "Waktu Berjalan" },
                                ].map(({ key, icon, label }) => (
                                    <th
                                        key={key}
                                        onClick={() => toggleSort(key as SortKey)}
                                        className="px-4 py-2 cursor-pointer select-none whitespace-nowrap w-1/12"
                                    >
                                        {icon} {label} {renderSortArrow(key as SortKey)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-100 text-gray-900 text-center">
                            {filteredData.length > 0 ? (
                                filteredData.map((chat) => {
                                    const isPrioritas = chat.tindakan?.prioritas === "Ya";
                                    const rowClass = isPrioritas
                                        ? "bg-red-100"
                                        : chat.tindakan?.status === "Perlu Verifikasi"
                                            ? "bg-yellow-100"
                                            : "";

                                    return (
                                        <tr key={chat.sessionId} className={`border-b border-gray-300 ${rowClass}`}>
                                            {localStorage.getItem("role") === "Bupati" ? (
                                                <td className="px-4 py-2">
                                                    <Switch
                                                        checked={isPrioritas}
                                                        onChange={(e) => toggleMode(chat.tindakan?.report!, e)}
                                                        className={`${isPrioritas ? "bg-green-500" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPrioritas ? "translate-x-6" : "translate-x-1"}`}
                                                        />
                                                    </Switch>
                                                </td>
                                            ) : (
                                                <td className="px-4 py-2">{chat.tindakan?.prioritas || "-"}</td>
                                            )}
                                            <td className="px-4 py-2">
                                                <Link href={`/pengaduan/${chat.sessionId}`} className="text-blue-600 hover:underline">
                                                    {chat.sessionId}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2">{chat.user || "-"}</td>
                                            <td className="px-4 py-2">{chat.from || "-"}</td>
                                            <td className="px-4 py-2">{chat.address || "-"}</td>
                                            <td className="px-4 py-2">
                                                {chat.location?.desa ? (
                                                    <button
                                                        onClick={() =>
                                                            setSelectedLoc({ lat: chat.location.latitude, lon: chat.location.longitude, desa: chat.location.desa })
                                                        }
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {chat.location.desa}, {chat.location.kecamatan}
                                                    </button>
                                                ) : (
                                                    "-"
                                                )}
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
                                    <td colSpan={11} className="text-center py-4 text-gray-500">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="sticky bottom-0 bg-white z-40 border-t border-gray-200 py-3 px-4">
                <div className="flex justify-center items-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-600">Halaman {page} dari {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {selectedLoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 w-[90%] max-w-md relative shadow-lg">
                        <button onClick={() => setSelectedLoc(null)} className="absolute top-2 right-3 text-gray-700 hover:text-black text-lg">✕</button>
                        <h2 className="text-lg font-semibold mb-2">{selectedLoc.desa}</h2>
                        <MapPopup lat={selectedLoc.lat} lon={selectedLoc.lon} description={selectedLoc.desa} />
                    </div>
                </div>
            )}
        </div>
    );
}