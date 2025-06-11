"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "../../../../utils/axiosInstance";
import { Switch } from "@headlessui/react";
import {
    FaStar,
    FaIdCard,
    FaUser,
    FaPhone,
    FaMap,
    FaExclamationCircle,
    FaCheckCircle,
    FaBuilding,
    FaClock
} from "react-icons/fa";
import { IoIosRefresh } from "react-icons/io";
import { Chat, SortKey } from "../../../../lib/types";
import { Tooltip } from "./Tooltip";
const MapPopup = dynamic(() => import("./mapPopup"), { ssr: false });

/* ------------------------- Utils ------------------------- */
function getElapsedTime(createdAt?: string): string {
    if (!createdAt) return "-";
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now.getTime() - created.getTime();
    const mins = Math.floor(diff / 60000) % 60;
    const hours = Math.floor(diff / 3600000) % 24;
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days} hari ${hours} jam lalu`;
    if (hours > 0) return `${hours} jam ${mins} menit lalu`;
    if (mins > 0) return `${mins} menit lalu`;
    return "Baru saja";
}

const statusOrder = [
    "Perlu Verifikasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditolak"
];

/* ======================================================== */
/*                  KOMPONEN PENGADUAN TABLE                */
/* ======================================================== */

export default function PengaduanTable() {
    /* -------------------- State -------------------- */
    const [data, setData] = useState<Chat[]>([]);
    const [search, setSearch] = useState("");
    const [sorts, setSorts] = useState<
        { key: SortKey; order: "asc" | "desc" }[]
    >([
        { key: "prioritas", order: "desc" },
        { key: "status", order: "asc" }
    ]);
    const [selectedLoc, setSelectedLoc] = useState<{
        lat: number;
        lon: number;
        desa: string;
    } | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
    const [limit, setLimit] = useState(15);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [photoModal, setPhotoModal] = useState<string[] | null>(null);

    const statusColors: Record<string, string> = {
        "Perlu Verifikasi": "#FF3131",
        "Verifikasi Situasi": "#5E17EB",
        "Verifikasi Kelengkapan Berkas": "#FF9F12",
        "Proses OPD Terkait": "rgb(250 204 21)",
        "Selesai Penanganan": "rgb(96 165 250)",
        "Selesai Pengaduan": "rgb(74 222 128)",
        "Ditolak": "black",
    };

    /* ------------------ Status Tabs ----------------- */
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

    /* -------------------- API ----------------------- */
    const getReports = async (
        statusParam = selectedStatus,
        pageParam = page,
        limitParam = limit
    ) => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`,
                {
                    params: {
                        page: pageParam,
                        limit: limitParam,
                        status: statusParam !== "Semua" ? statusParam : undefined
                    }
                }
            );

            const responseData = Array.isArray(res.data?.data)
                ? res.data.data
                : [];

            const processedData: Chat[] = responseData.map((item: any) => ({
                ...item,
                user: typeof item.user === "object" ? item.user.name : item.user,
                address:
                    typeof item.user === "object" ? item.user.address : item.address
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
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports/summary`
            );
            setStatusCounts(res.data || {});
        } catch (err) {
            console.error("❌ Failed to fetch summary:", err);
            setStatusCounts({});
        }
    };

    /* ------------------- Sorting -------------------- */
    const toggleSort = (key: SortKey) => {
        setSorts(prev => {
            const existing = prev.find(s => s.key === key);
            if (!existing) return [...prev, { key, order: "asc" }];
            if (existing.order === "asc")
                return prev.map(s =>
                    s.key === key ? { key, order: "desc" } : s
                );
            return prev.filter(s => s.key !== key); // reset
        });
    };

    const renderSortArrow = (key: SortKey) => {
        const found = sorts.find(s => s.key === key);
        if (!found) return null;

        const arrow = found.order === "asc" ? "↑" : "↓";

        return (
            <span className="ml-1 text-cyan-500 font-semibold">
                {arrow}
            </span>
        );
    };

    /* ----------------- Toggle Mode ------------------ */
    const toggleMode = async (tindakanId: string, prioritas: boolean) => {
        try {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/tindakan/${tindakanId}/prioritas`,
                { prioritas: prioritas ? "Ya" : "-" }
            );
            await getReports();
        } catch (err) {
            console.error("Gagal ubah mode:", err);
        }
    };

    /* --------------- Filter + Sort ------------------ */
    const filteredData = useMemo(() => {
        return [...data]
            .filter(item => {
                const lower = search.toLowerCase();
                return (
                    item.sessionId.toLowerCase().includes(lower) ||
                    item.user.toLowerCase().includes(lower) ||
                    item.from.toLowerCase().includes(lower) ||
                    item.location.desa.toLowerCase().includes(lower) ||
                    item.location.kecamatan.toLowerCase().includes(lower)
                );
            })
            .sort((a, b) => {
                for (const { key, order } of sorts) {
                    let valA: any = "",
                        valB: any = "";

                    if (key === "prioritas") {
                        valA = a.tindakan?.prioritas === "Ya" ? 1 : 0;
                        valB = b.tindakan?.prioritas === "Ya" ? 1 : 0;
                    } else if (key === "status") {
                        valA = statusOrder.indexOf(a.tindakan?.status || "");
                        valB = statusOrder.indexOf(b.tindakan?.status || "");
                    } else if (key === "situasi") {
                        valA = a.tindakan?.situasi || "";
                        valB = b.tindakan?.situasi || "";
                    } else if (key === "lokasi_kejadian") {
                        valA = a.location?.desa || "";
                        valB = b.location?.desa || "";
                    } else if (key === "opd") {
                        valA = a.tindakan?.opd || "";
                        valB = b.tindakan?.opd || "";
                    } else if (key === "timer") {
                        valA = a.createdAt
                            ? new Date(a.createdAt).getTime()
                            : 0;
                        valB = b.createdAt
                            ? new Date(b.createdAt).getTime()
                            : 0;
                    } else if (key === "date") {
                        valA = a.createdAt
                            ? new Date(a.createdAt).getTime()
                            : 0;
                        valB = b.createdAt
                            ? new Date(b.createdAt).getTime()
                            : 0;
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

    /* ---------------- Lifecycle --------------------- */
    useEffect(() => {
        getSummary();
    }, []);

    useEffect(() => {
        getReports(selectedStatus, page, limit);
    }, [selectedStatus, page, limit]);

    /* =================== RENDER ===================== */
    return (
        <div className="flex h-screen flex-col">
            {/* ------------ Header & Search ------------- */}
            <div className="sticky top-0 z-50 m-3">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Daftar Pengaduan
                </h2>
                <input
                    type="text"
                    placeholder="Cari data pengaduan..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="sticky top-0 w-full rounded-md border p-2 text-sm text-gray-700 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* ------------- Tabs & Controls ------------ */}
                <div className="mb-3 mt-5 flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-3">
                        {statusTabs.map(status => {
                            const labelCount =
                                status === "Semua"
                                    ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                                    : statusCounts[status] || 0;

                            const color = statusColors[status];

                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setSelectedStatus(status);
                                        setPage(1);
                                    }}
                                    className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold border ${selectedStatus === status
                                            ? "border-pink-600 bg-pink-600 text-white"
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {status !== "Semua" && (
                                        <span
                                            className="w-3 h-3 rounded-full inline-block"
                                            style={{ backgroundColor: color }}
                                        />
                                    )}
                                    <span>
                                        {status} ({labelCount})
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Refresh & Page size */}
                    <div className="mr-3 flex items-center space-x-3">
                        <button
                            onClick={() => getReports()}
                            title="Refresh data"
                            className="hover:outline-grey-500 hover:bg-gray-100 hover:text-black flex items-center rounded border border-gray-300 px-2 py-1 text-gray-500 hover:ring-1"
                        >
                            <IoIosRefresh />
                        </button>

                        <select
                            value={limit}
                            onChange={e => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="hover:outline-grey-500 rounded border border-gray-300 px-2 py-1 text-sm text-gray-500 hover:ring-1"
                        >
                            {[10, 15, 20, 30, 50].map(l => (
                                <option key={l} value={l}>
                                    Tampilkan {l}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ----------------- TABLE ------------------ */}
            <div className="ml-3 mr-3 flex-1 overflow-y-auto rounded-t-lg">
                <div className="w-full overflow-x-auto box-border rounded-lg border border-gray-400">
                    <table className="min-w-full table-fixed text-left text-sm">
                        {/* Head */}
                        <thead className="sticky top-0 z-[500] bg-gray-800 text-center text-white">
                            <tr>
                                {[
                                    {
                                        key: "prioritas",
                                        icon: <FaStar />,
                                        label: "Prioritas Bupati"
                                    },
                                    {
                                        key: "sessionId",
                                        icon: <FaIdCard />,
                                        label: "No. Id"
                                    },
                                    {
                                        key: "date",
                                        icon: <FaClock />,
                                        label: "Tgl. Laporan"
                                    },
                                    {
                                        key: "user",
                                        icon: <FaUser />,
                                        label: "Nama"
                                    },
                                    {
                                        key: "from",
                                        icon: <FaPhone />,
                                        label: "No. Kontak"
                                    },
                                    {
                                        key: "lokasi_kejadian",
                                        icon: <FaMap />,
                                        label: "Lokasi Kejadian"
                                    },
                                    {
                                        key: "situasi",
                                        icon: <FaExclamationCircle />,
                                        label: "Situasi"
                                    },
                                    {
                                        key: "status",
                                        icon: <FaCheckCircle />,
                                        label: "Status"
                                    },
                                    {
                                        key: "opd",
                                        icon: <FaBuilding />,
                                        label: "OPD Terkait"
                                    },
                                    {
                                        key: "timer",
                                        icon: <FaClock />,
                                        label: "Waktu Berjalan"
                                    },
                                    { key: "photo", icon: null, label: "Foto" } // 🔧 kolom foto
                                ].map(({ key, icon, label }) => (
                                    <th
                                        key={key}
                                        onClick={() => toggleSort(key as SortKey)}
                                        className="px-4 py-2 cursor-pointer select-none whitespace-nowrap"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            {icon} {label} {renderSortArrow(key as SortKey)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="bg-gray-100 text-center text-gray-900">
                            {filteredData.length > 0 ? (
                                filteredData.map(chat => {
                                    const isPrioritas =
                                        chat.tindakan?.prioritas === "Ya";
                                    const rowClass = isPrioritas
                                        ? "bg-red-100"
                                        : chat.tindakan?.status ===
                                            "Perlu Verifikasi"
                                            ? "bg-yellow-100"
                                            : "";

                                    return (
                                        <tr
                                            key={chat.sessionId}
                                            className={`border-b border-gray-300 ${rowClass}`}
                                        >
                                            {/* Prioritas switch / label */}
                                            {localStorage.getItem("role") ===
                                                "Bupati" ? (
                                                <td className="px-4 py-2">
                                                    <Switch
                                                        checked={isPrioritas}
                                                        onChange={e =>
                                                            toggleMode(
                                                                chat.tindakan
                                                                    ?.report!,
                                                                e
                                                            )
                                                        }
                                                        className={`${isPrioritas
                                                            ? "bg-green-500"
                                                            : "bg-gray-300"
                                                            } relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPrioritas
                                                                ? "translate-x-6"
                                                                : "translate-x-1"
                                                                }`}
                                                        />
                                                    </Switch>
                                                </td>
                                            ) : (
                                                <td className="px-4 py-2">
                                                    {chat.tindakan?.prioritas ||
                                                        "-"}
                                                </td>
                                            )}

                                            {/* No. Pengaduan + tooltip */}
                                            <td className="px-4 py-2">
                                                <Tooltip text="Klik di sini untuk melihat detail laporan">
                                                    <Link
                                                        href={`/pengaduan/${chat.sessionId}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {chat.sessionId}
                                                    </Link>
                                                </Tooltip>
                                            </td>

                                            {/* Tanggal */}
                                            <td className="px-4 py-2">
                                                {chat.createdAt
                                                    ? new Date(chat.createdAt).toLocaleString("id-ID", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        timeZone: "Asia/Jakarta",
                                                        hour12: false
                                                    })
                                                    : "-"}
                                            </td>

                                            {/* Nama */}
                                            <td className="px-4 py-2">
                                                {chat.user || "-"}
                                            </td>

                                            {/* No. kontak */}
                                            <td className="px-4 py-2">
                                                {chat.from?.startsWith("62")
                                                    ? `0${chat.from.slice(2)}`
                                                    : chat.from || "-"}
                                            </td>

                                            {/* Lokasi kejadian + tooltip */}
                                            <td className="px-4 py-2">
                                                {chat.location?.desa ? (
                                                    <Tooltip text="Klik di sini untuk melihat detail lokasi">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedLoc({
                                                                    lat: chat
                                                                        .location
                                                                        .latitude,
                                                                    lon: chat
                                                                        .location
                                                                        .longitude,
                                                                    desa: chat
                                                                        .location
                                                                        .desa
                                                                })
                                                            }
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {
                                                                chat.location
                                                                    .desa
                                                            }
                                                            ,{" "}
                                                            {
                                                                chat.location
                                                                    .kecamatan
                                                            }
                                                        </button>
                                                    </Tooltip>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            {/* Situasi */}
                                            <td className="px-4 py-2">
                                                {chat.tindakan?.situasi || "-"}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-2">
                                                {chat.tindakan?.status || "-"}
                                            </td>

                                            {/* OPD */}
                                            <td className="px-4 py-2">
                                                {chat.tindakan?.opd || "-"}
                                            </td>

                                            {/* Timer */}
                                            <td className="px-4 py-2">
                                                {getElapsedTime(chat.createdAt)}
                                            </td>

                                            {/* Foto thumbnail */}
                                            <td className="px-2 py-2">
                                                {Array.isArray(chat.photos) && chat.photos.length > 0 ? (
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_BE_BASE_URL}${chat.photos[0]}`}
                                                        alt="Foto pengaduan"
                                                        className="h-10 w-10 object-cover rounded border border-gray-300 cursor-pointer"
                                                        onClick={() => {
                                                            if (chat.photos.length > 1) {
                                                                setPhotoModal(chat.photos);
                                                            } else {
                                                                window.open(
                                                                    `${process.env.NEXT_PUBLIC_BE_BASE_URL}${chat.photos[0]}`,
                                                                    "_blank"
                                                                );
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="py-4 text-center text-gray-500"
                                    >
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ------------- Pagination --------------- */}
            <div className="sticky bottom-0 z-40 border-t border-gray-200 bg-white py-3 px-4">
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="rounded bg-gray-200 px-3 py-1 text-gray-800 disabled:opacity-50"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-600">
                        Halaman {page} dari {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="rounded bg-gray-200 px-3 py-1 text-gray-800 disabled:opacity-50"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* ------------- Map Modal --------------- */}
            {selectedLoc && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative w-[90%] max-w-md rounded-lg bg-white p-4 shadow-lg">
                        <button
                            onClick={() => setSelectedLoc(null)}
                            className="absolute right-3 top-2 text-lg text-gray-700 hover:text-black"
                        >
                            ✕
                        </button>
                        <h2 className="mb-2 text-lg font-semibold">
                            {selectedLoc.desa}
                        </h2>
                        <MapPopup
                            lat={selectedLoc.lat}
                            lon={selectedLoc.lon}
                            description={selectedLoc.desa}
                        />
                    </div>
                </div>
            )}

            {/* ------------- Photo Modal --------------- */}
            {photoModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative max-h-[90%] w-[90%] max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
                        <button
                            onClick={() => setPhotoModal(null)}
                            className="absolute right-3 top-2 text-lg text-gray-700 hover:text-black"
                        >
                            ✕
                        </button>
                        <h2 className="mb-3 text-lg font-semibold">Foto Laporan</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {photoModal.map((url, index) => (
                                <img
                                    key={index}
                                    src={`${process.env.NEXT_PUBLIC_BE_BASE_URL}${url}`}
                                    alt={`Foto ${index + 1}`}
                                    className="max-h-60 w-full rounded border border-gray-300 object-cover cursor-pointer"
                                    onClick={() =>
                                        window.open(
                                            `${process.env.NEXT_PUBLIC_BE_BASE_URL}${url}`,
                                            "_blank"
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}