"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "../../utils/axiosInstance";
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
import { IoTrashBin } from "react-icons/io5";
import { Search } from "lucide-react";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";
import { Chat, SortKey } from "../../lib/types";
import { Tooltip } from "./Tooltip";
import { Listbox } from "@headlessui/react";
import { Fragment } from "react";
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
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditutup"
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
        { key: "date", order: "desc" }
    ]);
    const [selectedLoc, setSelectedLoc] = useState<{
        lat: number;
        lon: number;
        desa: string;
    } | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
    const [limit, setLimit] = useState(100);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [photoModal, setPhotoModal] = useState<string[] | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [role, setRole] = useState<string | null>(null);

    const statusColors: Record<string, string> = {
        "Perlu Verifikasi": "#FF3131",
        "Verifikasi Situasi": "#5E17EB",
        "Verifikasi Kelengkapan Berkas": "#FF9F12",
        "Proses OPD Terkait": "rgb(250 204 21)",
        "Selesai Penanganan": "rgb(96 165 250)",
        "Selesai Pengaduan": "rgb(74 222 128)",
        "Ditutup": "black",
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
        "Ditutup"
    ];

    /* -------------------- API ----------------------- */
    const getReports = async (
        statusParam = selectedStatus,
        pageParam = page,
        limitParam = limit,
        searchParam = search
    ) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`, {
                params: {
                    page: pageParam,
                    limit: limitParam,
                    status: statusParam !== "Semua" ? statusParam : undefined,
                    search: searchParam?.trim() || undefined,
                    sorts: JSON.stringify(sorts) // Kirim array [{ key: "prioritas", order: "asc" }]
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
            <span className="text-cyan-500 text-sm">
                {arrow}
            </span>
        );
    };

    // Toggle satu ID (jika checkbox diklik)
    const toggleSingleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(chat => chat.sessionId));
        }
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
        return [...data].sort((a, b) => {
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
                } else if (key === "lokasi_kejadian") {
                    valA = a.location?.desa || "";
                    valB = b.location?.desa || "";
                } else if (key === "opd") {
                    valA = a.tindakan?.opd || "";
                    valB = b.tindakan?.opd || "";
                } else if (key === "timer" || key === "date") {
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
    }, [data, sorts]);

    // Toggle semua ID (checkbox di header)
    const allSelected =
        filteredData.length > 0 &&
        selectedIds.length === filteredData.length;

    const handleDeleteSelected = async () => {
        const confirm = window.confirm("Yakin ingin menghapus laporan yang dipilih?");
        if (!confirm) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`, {
                data: { sessionIds: selectedIds }, // <- sesuai backend kamu
            });

            setSelectedIds([]);      // Reset selection
            await getReports();      // Refresh data
            await getSummary();      // Refresh summary/statistik
        } catch (err) {
            console.error("❌ Gagal menghapus:", err);
            alert("Terjadi kesalahan saat menghapus laporan.");
        }
    };

    /* ---------------- Lifecycle --------------------- */

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedRole = localStorage.getItem("role");
            setRole(storedRole);
        }
    }, []);

    useEffect(() => {
        getSummary();
    }, []);

    useEffect(() => {
        setPage(1);
        getReports(selectedStatus, 1, limit, search);
    }, [selectedStatus]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setPage(1);
            getReports(selectedStatus, 1, limit, search);
        }, 400); // debounce 400ms

        return () => clearTimeout(delayDebounce);
    }, [search]);

    useEffect(() => {
        getReports(selectedStatus, page, limit, search);
    }, [page, limit]);

    useEffect(() => {
        setPage(1); // reset ke halaman 1 saat sort berubah
        getReports(selectedStatus, 1, limit, search);
    }, [sorts]);


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1200);
        };

        handleResize(); // inisialisasi
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /* =================== RENDER ===================== */
    return (
        <div className="flex h-screen flex-col">

            {/* ------------ Header & Search ------------- */}
            <div className="z-[400] sticky top-0 bg-white pt-3">
                <h2 className="mb-2 text-2xl font-bold text-gray-900 px-3">Daftar Pengaduan</h2>

                {/* Desktop Controls */}
                <div className="hidden md:flex items-end justify-between gap-4 px-3 mb-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari No. ID, Nama, OPD, atau Lokasi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border text-sm text-gray-700 shadow-md focus:outline-none hover:ring-2 hover:ring-blue-200"
                        />
                    </div>

                    {/* View */}
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">View</p>
                        <Listbox value={limit} onChange={(val) => {
                            setLimit(val);
                            setPage(1);
                        }}>
                            <div className="relative w-[200px] z-[400]">
                                <Listbox.Button className="w-full h-10 border rounded-md px-3 py-2 text-sm bg-white text-left shadow-md flex items-center justify-between text-gray-700 focus:outline-none hover:ring-2 hover:ring-blue-200">
                                    <span>Tampilkan {limit}</span>
                                    <span className="text-gray-500">▼</span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute mt-1 w-full bg-white border rounded shadow-lg z-[999] max-h-60 overflow-auto">
                                    {[100, 200, 300, 500].map((val) => (
                                        <Listbox.Option key={val} value={val} as={Fragment}>
                                            {({ active }) => (
                                                <li className={`px-3 py-2 text-xs cursor-pointer ${active ? "bg-gray-100" : ""} text-gray-700`}>
                                                    Tampilkan {val}
                                                </li>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                    </div>
                </div>

                {/* Desktop Filter Buttons */}
                <div className="hidden md:block px-3 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Filter Status Laporan</p>
                    <div className="flex flex-wrap gap-2">
                        {statusTabs.map((status) => {
                            const count = status === "Semua"
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
                                    className={`flex items-center gap-2 rounded-full px-4 py-1 text-[12px] font-semibold border ${selectedStatus === status
                                        ? 'border-pink-600 bg-pink-600 text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {status !== 'Semua' && (
                                        <span
                                            className="w-3 h-3 rounded-full inline-block"
                                            style={{ backgroundColor: color }}
                                        />
                                    )}
                                    <span>{status} ({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Controls */}
                <div className="md:hidden flex flex-col gap-3 px-3 mb-4 z-[400]">
                    {/* Search */}
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari No. ID, Nama, OPD, atau Lokasi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border text-sm text-gray-700 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-200"
                        />
                    </div>

                    {/* Filter Status */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1 ml-1">Filter Status Laporan</p>
                        <Listbox value={selectedStatus} onChange={(val) => {
                            setSelectedStatus(val);
                            setPage(1);
                        }}>
                            <div className="relative w-full z-[500]">
                                <Listbox.Button className="w-full border rounded px-3 py-2 text-xs bg-white text-left shadow-sm flex items-center justify-between text-gray-700 hover:ring-2 hover:ring-blue-200">
                                    <div className="flex items-center gap-2">
                                        {selectedStatus !== 'Semua' && (
                                            <span
                                                className="w-2.5 h-2.5 rounded-full inline-block"
                                                style={{ backgroundColor: statusColors[selectedStatus] }}
                                            />
                                        )}
                                        <span className="truncate">
                                            {selectedStatus} ({selectedStatus === 'Semua'
                                                ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                                                : statusCounts[selectedStatus] || 0})
                                        </span>
                                    </div>
                                    <span className="text-gray-500">▼</span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute mt-1 w-full bg-white border rounded shadow-lg z-[999] max-h-60 overflow-auto">
                                    {statusTabs.map((status) => {
                                        const count = status === "Semua"
                                            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                                            : statusCounts[status] || 0;
                                        const color = statusColors[status];

                                        return (
                                            <Listbox.Option key={status} value={status} as={Fragment}>
                                                {({ active }) => (
                                                    <li className={`px-3 py-2 flex items-center gap-2 text-xs cursor-pointer ${active ? 'bg-gray-100' : ''} text-gray-700`}>
                                                        {status !== 'Semua' && (
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full inline-block"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        )}
                                                        <span>{status} ({count})</span>
                                                    </li>
                                                )}
                                            </Listbox.Option>
                                        );
                                    })}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                    </div>

                    {/* View */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1 ml-1">View</p>
                        <Listbox value={limit} onChange={(val) => {
                            setLimit(val);
                            setPage(1);
                        }}>
                            <div className="relative w-full z-[400]">
                                <Listbox.Button className="w-full h-10 border rounded-md px-3 py-2 text-xs bg-white text-left shadow-md flex items-center justify-between text-gray-700 focus:outline-none hover:ring-2 hover:ring-blue-200">
                                    <span>Tampilkan {limit}</span>
                                    <span className="text-gray-500">▼</span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute mt-1 w-full bg-white border rounded shadow-lg z-[999] max-h-60 overflow-auto">
                                    {[100, 200, 300, 500].map((val) => (
                                        <Listbox.Option key={val} value={val} as="div">
                                            {({ active }) => (
                                                <div className={`px-3 py-2 flex items-center gap-2 text-xs cursor-pointer ${active ? 'bg-gray-100' : ''} text-gray-700`}>
                                                    Tampilkan {val}
                                                </div>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                    </div>

                </div>
            </div>

            {/* ----------------- TABLE ------------------ */}
            <div className="mx-3 flex-1 overflow-hidden rounded-t-lg border border-gray-300">
                <div className="w-full max-h-[calc(100vh-260px)] overflow-auto rounded-lg">
                    <table className="min-w-full table-fixed text-left text-sm border-collapse">
                        <thead className="sticky top-0 z-[300] bg-gray-800 text-white">
                            <tr>
                                {[
                                    { key: 'prioritas', icon: <FaStar />, label: 'Prioritas' },
                                    { key: 'sessionId', icon: <FaIdCard />, label: 'No. Id' },
                                    { key: 'date', icon: <FaClock />, label: 'Tgl. Laporan' },
                                    { key: 'user', icon: <FaUser />, label: 'Nama' },
                                    { key: 'from', icon: <FaPhone />, label: 'No. Kontak' },
                                    { key: 'lokasi_kejadian', icon: <FaMap />, label: 'Lokasi Kejadian' },
                                    { key: 'situasi', icon: <FaExclamationCircle />, label: 'Situasi' },
                                    { key: 'status', icon: <FaCheckCircle />, label: 'Status' },
                                    { key: 'opd', icon: <FaBuilding />, label: 'OPD Terkait' },
                                    { key: 'timer', icon: <FaClock />, label: 'Waktu Berjalan' },
                                    { key: 'photo', icon: null, label: 'Foto' },
                                ].map(({ key, icon, label }) => (
                                    <th
                                        key={key}
                                        className="sticky top-0 z-[300] px-4 py-2 select-none bg-gray-800 text-white hover:bg-white/20 transition cursor-pointer"
                                        onClick={() => toggleSort(key as SortKey)}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center justify-center w-6">{icon}</div>
                                            <div className="flex flex-col items-center text-[12px] leading-tight text-center">
                                                {label.split(' ').map((word, i) => <span key={i}>{word}</span>)}
                                            </div>
                                            <button className="text-sm rounded px-1 py-[2px]">
                                                {renderSortArrow(key as SortKey) || ''}
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                {role === 'SuperAdmin' && (
                                    <th className="sticky top-0 z-[300] px-4 py-2 bg-gray-800 text-white text-center">
                                        {selectedIds.length > 0 ? (
                                            <button
                                                className="flex items-center gap-1 justify-center bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded transition"
                                                onClick={handleDeleteSelected}
                                                title="Hapus Terpilih"
                                            >
                                                <IoTrashBin className="w-4 h-4" />({selectedIds.length})
                                            </button>
                                        ) : (
                                            <span>Hapus</span>
                                        )}
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="bg-white text-center text-gray-900">
                            {filteredData.length > 0 ? (
                                filteredData.map((chat) => {
                                    const isPrioritas = chat.tindakan?.prioritas === 'Ya';
                                    const rowClass = isPrioritas
                                        ? 'bg-red-100'
                                        : chat.tindakan?.status === 'Perlu Verifikasi'
                                            ? 'bg-yellow-100'
                                            : '';

                                    return (
                                        <tr key={chat.sessionId} className={`border-b border-gray-300 ${rowClass}`}>
                                            <td className="px-4 py-2">
                                                {(role === "Bupati" || role === "SuperAdmin") ? (
                                                    <Switch
                                                        checked={isPrioritas}
                                                        onChange={(e) => toggleMode(chat.tindakan?.report!, e)}
                                                        className={`${isPrioritas ? 'bg-green-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPrioritas ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </Switch>
                                                ) : (
                                                    chat.tindakan?.prioritas || '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Tooltip text="Klik di sini untuk melihat detail laporan">
                                                    <Link href={`/pengaduan/${chat.sessionId}`} className="text-blue-600 hover:underline">
                                                        {chat.sessionId}
                                                    </Link>
                                                </Tooltip>
                                            </td>
                                            <td className="px-4 py-2">
                                                {chat.createdAt
                                                    ? new Date(chat.createdAt).toLocaleString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        timeZone: 'Asia/Jakarta',
                                                        hour12: false,
                                                    })
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-2">{chat.user || '-'}</td>
                                            <td className="px-4 py-2">{chat.from || '-'}</td>
                                            <td className="px-4 py-2">
                                                {chat.location?.desa ? (
                                                    <Tooltip text="Klik untuk lihat detail lokasi">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedLoc({
                                                                    lat: chat.location.latitude,
                                                                    lon: chat.location.longitude,
                                                                    desa: chat.location.desa,
                                                                })
                                                            }
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {chat.location.desa}, {chat.location.kecamatan}
                                                        </button>
                                                    </Tooltip>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-2">{chat.tindakan?.situasi || '-'}</td>
                                            <td className="px-4 py-2">
                                                {chat.tindakan?.status ? (
                                                    <div className="flex items-center">
                                                        <div className="w-6 flex justify-center">
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full inline-block"
                                                                style={{ backgroundColor: statusColors[chat.tindakan.status] || 'gray' }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 text-sm text-gray-800 font-medium">
                                                            {chat.tindakan.status}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">{chat.tindakan?.opd || '-'}</td>
                                            <td className="px-4 py-2">{getElapsedTime(chat.createdAt)}</td>
                                            <td className="px-2 py-2">
                                                {Array.isArray(chat.photos) && chat.photos.length > 0 ? (
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_BE_BASE_URL}${chat.photos[0]}`}
                                                        alt="Foto pengaduan"
                                                        className="h-10 w-10 object-cover rounded border border-gray-300 cursor-pointer"
                                                        onClick={() => {
                                                            chat.photos.length > 1
                                                                ? setPhotoModal(chat.photos)
                                                                : window.open(`${process.env.NEXT_PUBLIC_BE_BASE_URL}${chat.photos[0]}`, '_blank');
                                                        }}
                                                    />
                                                ) : '-'}
                                            </td>
                                            {role === 'SuperAdmin' && (
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(chat.sessionId)}
                                                        onChange={() => toggleSingleSelect(chat.sessionId)}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={12} className="py-4 text-center text-gray-500">
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
                        className="flex items-center gap-1 rounded bg-[#2463eb] px-3 py-1 text-gray-200 text-xs disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 hover:bg-[#1d4fbb]"
                    >
                        <GrLinkPrevious size={12} /> Prev
                    </button>

                    <span className="text-xs text-gray-600">
                        {page} dari {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="flex items-center gap-1 rounded bg-[#2463eb] px-3 py-1 text-gray-200 text-xs disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 hover:bg-[#1d4fbb]"
                    >
                        Next <GrLinkNext size={12} />
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