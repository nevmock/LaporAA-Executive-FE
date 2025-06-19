"use client";

import React from "react";
import {
    FaStar, FaIdCard, FaUser, FaPhone, FaMap,
    FaExclamationCircle, FaCheckCircle, FaBuilding, FaClock,
} from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";
import Link from "next/link";
import { Switch } from "@headlessui/react";
import { Tooltip } from "./Tooltip";
import { Chat, SortKey } from "../../lib/types";

// Props interface untuk komponen TableSection
interface Props {
    filteredData: Chat[]; // Data yang sudah difilter dan siap ditampilkan
    sorts: { key: SortKey; order: "asc" | "desc" }[]; // Sorting aktif
    toggleSort: (key: SortKey) => void; // Fungsi untuk mengubah sorting
    role: string | null; // Role user (misalnya 'SuperAdmin', 'Bupati')
    selectedIds: string[]; // ID yang terpilih (untuk hapus batch)
    toggleSingleSelect: (id: string) => void; // Toggle satu checkbox
    toggleSelectAll: () => void; // Toggle semua checkbox
    allSelected: boolean; // Status semua terpilih
    handleDeleteSelected: () => void; // Fungsi untuk hapus data terpilih
    toggleMode: (tindakanId: string, prioritas: boolean) => void; // Ubah status prioritas
    setSelectedLoc: (loc: { lat: number; lon: number; desa: string }) => void; // Pilih lokasi di peta
    setPhotoModal: (photos: string[]) => void; // Tampilkan modal galeri foto
    loading: boolean; // Status loading
    setSorts: (sorts: { key: SortKey; order: "asc" | "desc" }[]) => void; // Setter sorting (tidak dipakai langsung)
}

// Warna status untuk ikon status
const statusColors: Record<string, string> = {
    "Perlu Verifikasi": "#FF3131",
    "Verifikasi Situasi": "#5E17EB",
    "Verifikasi Kelengkapan Berkas": "#FF9F12",
    "Proses OPD Terkait": "rgb(250 204 21)",
    "Selesai Penanganan": "rgb(96 165 250)",
    "Selesai Pengaduan": "rgb(74 222 128)",
    "Ditutup": "black",
};

// Fungsi untuk menghitung waktu berlalu sejak laporan dibuat
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

const TableSection: React.FC<Props> = ({
    filteredData, sorts, toggleSort, role,
    selectedIds, toggleSingleSelect, toggleSelectAll, allSelected,
    handleDeleteSelected, toggleMode, setSelectedLoc, setPhotoModal,
    loading,
}) => {
    // Menampilkan panah naik/turun jika kolom sedang di-sort
    const renderSortArrow = (key: SortKey) => {
        const found = sorts.find((s) => s.key === key);
        if (!found) return null;
        return (
            <span className="text-cyan-400 text-sm">
                {found.order === "asc" ? "↑" : "↓"}
            </span>
        );
    };

    return (
        <div className="px-2 h-full flex flex-col overflow-hidden bg-white">
            <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-300">
                <table className="min-w-full table-fixed text-left text-sm border-collapse">
                    {/* -------- Tabel Header -------- */}
                    <thead className="sticky top-0 z-[300] bg-gray-800 text-white">
                        <tr>
                            {/* Loop untuk membuat header dari kolom */}
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
                                    onClick={() => toggleSort(key as SortKey)}
                                    className="sticky top-0 z-[300] px-4 py-2 select-none bg-gray-800 text-white hover:bg-white/20 transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="w-6 flex justify-center">{icon}</div>
                                        <div className="flex flex-col items-center text-[12px] leading-tight text-center">
                                            {label.split(" ").map((word, i) => <span key={i}>{word}</span>)}
                                        </div>
                                        <div>{renderSortArrow(key as SortKey)}</div>
                                    </div>
                                </th>
                            ))}
                            {/* Kolom hapus jika SuperAdmin */}
                            {role === 'SuperAdmin' && (
                                <th className="sticky top-0 z-[300] px-4 py-2 bg-gray-800 text-white text-center">
                                    {selectedIds.length > 0 ? (
                                        <button
                                            className="flex items-center gap-1 justify-center bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded transition"
                                            onClick={handleDeleteSelected}
                                            title="Hapus Terpilih"
                                        >
                                            <IoTrashBin className="w-4 h-4" /> ({selectedIds.length})
                                        </button>
                                    ) : "Hapus"}
                                </th>
                            )}
                        </tr>
                    </thead>

                    {/* -------- Tabel Body -------- */}
                    <tbody className="bg-white text-center text-gray-900">
                        {loading ? (
                            // Loading spinner
                            <tr>
                                <td colSpan={12} className="py-8 text-center">
                                    <div className="flex justify-center items-center space-x-2">
                                        <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin" />
                                        <span className="text-sm text-gray-600">Memuat data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredData.length > 0 ? (
                            // Render baris data
                            filteredData.map((chat) => {
                                const isPrioritas = chat.tindakan?.prioritas === 'Ya';
                                const rowClass = isPrioritas
                                    ? 'bg-red-100'
                                    : chat.tindakan?.status === 'Perlu Verifikasi'
                                        ? 'bg-yellow-100'
                                        : '';

                                return (
                                    <tr key={chat.sessionId} className={`border-b border-gray-300 ${rowClass}`}>
                                        {/* Kolom prioritas toggle */}
                                        <td className="px-4 py-2">
                                            {(role === "Bupati" || role === "SuperAdmin") ? (
                                                <Switch
                                                    checked={isPrioritas}
                                                    onChange={(e) => toggleMode(chat.tindakan?.report!, e)}
                                                    className={`${isPrioritas ? 'bg-green-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPrioritas ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </Switch>
                                            ) : chat.tindakan?.prioritas || '-'}
                                        </td>

                                        {/* Link ke halaman detail */}
                                        <td className="px-4 py-2">
                                            <Tooltip text="Klik di sini untuk melihat detail laporan">
                                                <Link href={`/pengaduan/${chat.sessionId}`} className="text-blue-600 hover:underline">
                                                    {chat.sessionId}
                                                </Link>
                                            </Tooltip>
                                        </td>

                                        {/* Tanggal laporan */}
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

                                        {/* Lokasi kejadian */}
                                        <td className="px-4 py-2">
                                            {chat.location?.desa ? (
                                                <Tooltip text="Klik untuk lihat detail lokasi">
                                                    <button
                                                        onClick={() => setSelectedLoc({
                                                            lat: chat.location.latitude,
                                                            lon: chat.location.longitude,
                                                            desa: chat.location.desa,
                                                        })}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {chat.location.desa}, {chat.location.kecamatan}
                                                    </button>
                                                </Tooltip>
                                            ) : "-"}
                                        </td>

                                        {/* Situasi, Status, OPD */}
                                        <td className="px-4 py-2">{chat.tindakan?.situasi || '-'}</td>
                                        <td className="px-4 py-2">
                                            {chat.tindakan?.status ? (
                                                <div className="flex items-center">
                                                    <div className="w-6 flex justify-center">
                                                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: statusColors[chat.tindakan.status] || 'gray' }} />
                                                    </div>
                                                    <div className="flex-1 text-sm text-gray-800 font-medium">
                                                        {chat.tindakan.status}
                                                    </div>
                                                </div>
                                            ) : <span className="text-sm text-gray-500">-</span>}
                                        </td>
                                        <td className="px-4 py-2">{chat.tindakan?.opd || '-'}</td>

                                        {/* Timer */}
                                        <td className="px-4 py-2">{getElapsedTime(chat.createdAt)}</td>

                                        {/* Foto */}
                                        <td className="px-2 py-2">
                                            {Array.isArray(chat.photos) && chat.photos.length > 0 ? (
                                                <img
                                                    src={`${process.env.NEXT_PUBLIC_BE_BASE_URL}${chat.photos[0]}`}
                                                    alt="Foto pengaduan"
                                                    className="h-10 w-10 object-cover rounded border border-gray-300 cursor-pointer"
                                                    onClick={() =>
                                                        chat.photos.length > 1
                                                            ? setPhotoModal(chat.photos)
                                                            : window.open(`${process.env.NEXT_PUBLIC_BE_BASE_URL}${chat.photos[0]}`, '_blank')
                                                    }
                                                />
                                            ) : '-'}
                                        </td>

                                        {/* Checkbox SuperAdmin */}
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
                            // Data kosong
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
    );
};

export default TableSection;