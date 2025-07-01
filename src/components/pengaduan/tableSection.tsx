"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
    FaStar, FaUser,
    FaExclamationCircle, FaCheckCircle, FaBuilding, FaClock, FaPhotoVideo,
    FaHashtag, FaEye, FaRegStar, FaRobot, FaWhatsapp
} from "react-icons/fa";
import { IoTrashBin, IoWarning, IoSettingsSharp } from "react-icons/io5";
import { IoIosPin } from "react-icons/io";
import { PiChatsBold } from "react-icons/pi"; 
import axios from "../../utils/axiosInstance";
import Link from "next/link";
import { Switch } from "@headlessui/react";
import { Tooltip } from "./Tooltip";
import { Chat, SortKey } from "../../lib/types";
import { usePhotoDownloader } from "./PhotoDownloader";

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
    toggleForceMode: (from: string, currentForceMode: boolean) => void; // Toggle force mode bot
    forceModeStates: Record<string, boolean>; // Status force mode untuk setiap user
    loadingForceMode: Record<string, boolean>; // Loading state untuk force mode
    setSelectedLoc: (loc: { lat: number; lon: number; desa: string }) => void; // Pilih lokasi di peta
    setPhotoModal: (photos: string[], reportInfo?: { sessionId: string; userName: string }) => void; // Tampilkan modal galeri foto
    loading: boolean; // Status loading
    setSorts: (sorts: { key: SortKey; order: "asc" | "desc" }[]) => void; // Setter sorting (tidak dipakai langsung)
    setSearch: (search: string) => void; // Fungsi untuk set search box
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
    selectedIds, toggleSingleSelect,
    handleDeleteSelected, toggleMode, toggleForceMode, forceModeStates, loadingForceMode,
    setSelectedLoc, setPhotoModal,
    loading,
    setSearch,
}) => {
    // State untuk modal OPD
    const [opdModalVisible, setOpdModalVisible] = React.useState(false);
    const [selectedOpds, setSelectedOpds] = React.useState<string[]>([]);
    const [modalTitle, setModalTitle] = React.useState("");
    const [pinnedReports, setPinnedReports] = React.useState<Record<string, boolean>>({});
    const [loadingPin, setLoadingPin] = React.useState<Record<string, boolean>>({});
    
    // State untuk menyimpan informasi laporan untuk modal foto
    const [photoModalInfo, setPhotoModalInfo] = React.useState<{
        sessionId: string;
        userName: string;
    } | null>(null);

    // Fungsi untuk download foto tunggal dengan nama yang benar
    const downloadSinglePhoto = async (photoUrl: string, sessionId: string, userName: string, photoPath: string) => {
        try {
            // Fetch gambar sebagai blob
            const response = await fetch(photoUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Buat URL object untuk blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Generate nama file sesuai format DDMMYY_Nama_(nomor)_sessionId
            const fileExtension = photoPath.match(/\.([^.?]+)(\?|$)/)?.[1] || 'jpg';
            
            // Buat format tanggal DDMMYY dari hari ini
            const today = new Date();
            const day = today.getDate().toString().padStart(2, '0');
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear().toString().slice(-2); // Ambil 2 digit terakhir
            const dateString = `${day}${month}${year}`;
            
            // Bersihkan nama user dari karakter yang tidak valid untuk nama file
            const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_');
            
            const fileName = `${dateString}_${cleanUserName}_(1)_${sessionId}.${fileExtension}`;
            
            // Buat elemen anchor untuk download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading single photo:', error);
            // Fallback ke window.open jika download gagal
            window.open(photoUrl, '_blank');
        }
    };

    // Fungsi untuk toggle pin/unpin laporan
    const togglePin = async (sessionId: string) => {
        if (loadingPin[sessionId]) return; // Hindari multiple call

        try {
            setLoadingPin(prev => ({ ...prev, [sessionId]: true }));
            const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

            const response = await axios.put(`${API_URL}/reports/session/${sessionId}/toggle-pin`);
            const result = response.data;
            console.log('Pin toggled:', result);

            // Update state dengan status pin terbaru
            setPinnedReports(prev => ({
                ...prev,
                [sessionId]: result.report.is_pinned
            }));

            // Tambahkan pesan notifikasi sukses jika ingin
            // alert(result.message);
        } catch (error) {
            console.error('Error toggling pin status:', error);
        } finally {
            setLoadingPin(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    // Load initial pin status for all reports
    useEffect(() => {
        // Initialize pin status from data first
        const initialPinnedState: Record<string, boolean> = {};

        filteredData.forEach(chat => {
            if (chat.is_pinned) {
                initialPinnedState[chat.sessionId] = true;
            }
        });

        setPinnedReports(initialPinnedState);

        // Then check pin status from API for each report that's not pinned in the initial data
        const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

        filteredData.forEach(async chat => {
            if (!chat.is_pinned) {
                try {
                    const response = await axios.get(`${API_URL}/reports/pinned/${chat.sessionId}`);
                    if (response && response.data && response.data.is_pinned) {
                        setPinnedReports(prev => ({
                            ...prev,
                            [chat.sessionId]: true
                        }));
                    }
                } catch {
                    // Jika laporan memang tidak di-pin, API akan memberikan status 404
                    // Jadi tidak perlu menangani error dengan khusus
                    console.log(`Report ${chat.sessionId} is not pinned`);
                }
            }
        });
    }, [filteredData]);

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
        <div className="px-2 py-2 h-full flex-1 flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-[10pt] border-collapse">
                    {/* -------- Tabel Header -------- */}
                    <thead className="sticky top-0 z-[30] bg-gray-800 text-white">
                        <tr>
                            {/* Loop untuk membuat header dari kolom */}
                            {[
                                { key: 'prioritas', icon: <FaStar />, label: '' },
                                { key: 'controls', icon: <IoSettingsSharp />, label: 'Kontrol' },
                                { key: 'tag', icon: <FaHashtag />, label: 'Tag' },
                                { key: 'admin', icon: <FaEye />, label: 'Detail' },
                                { key: 'tracking_id', icon: <PiChatsBold />, label: 'Tracking' },
                                { key: 'date', icon: <FaClock />, label: 'Waktu' },
                                { key: 'user', icon: <FaUser />, label: 'Nama' },
                                { key: 'lokasi_kejadian', icon: <IoIosPin />, label: 'Lokasi' },
                                { key: 'status', icon: <FaCheckCircle />, label: 'Status' },
                                { key: 'situasi', icon: <FaExclamationCircle />, label: 'Situasi' },
                                { key: 'opd', icon: <FaBuilding />, label: 'OPD' },
                                { key: 'photo', icon: <FaPhotoVideo />, label: 'Foto' },
                            ].map(({ key, icon, label }) => (
                                <th
                                    key={key}
                                    onClick={() => toggleSort(key as SortKey)}
                                    className="px-6 py-3 select-none bg-gray-800 text-white hover:bg-white/20 transition cursor-pointer"
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
                                <th className="px-6 py-3 bg-gray-800 text-white text-center">
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
                                <td colSpan={10} className="py-8 text-center">
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
                                    <tr key={chat.sessionId} className={`border-b border-gray-300 hover:bg-gray-100 hover:bg-opacity-90 transition-colors duration-300 ${rowClass}`}>
                                        {/* Kolom prioritas toggle */}
                                        <td className="px-6 py-1.5">
                                            {(role === "Bupati" || role === "SuperAdmin") ? (
                                                <Switch
                                                    checked={isPrioritas}
                                                    onChange={(e) => toggleMode(chat.tindakan?.report!, e)}
                                                    className={`${isPrioritas ? 'bg-green-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPrioritas ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </Switch>
                                            ) : (
                                                chat.tindakan?.prioritas === 'Ya' ? (
                                                    <IoWarning size={30} className="text-red-500 text-xl mx-auto" title="Prioritas" />
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )
                                            )}
                                        </td>

                                        {/* Combined Bot Switch & Pinned Controls */}
                                        <td className="px-6 py-1.5">
                                            <div className="flex items-center justify-center gap-3">
                                                {/* Bot Control */}
                                                <div className="flex items-center justify-center">
                                                    {(role === "Bupati" || role === "SuperAdmin" || role === "Admin") ? (
                                                        loadingForceMode[chat.from] ? (
                                                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                                        ) : (
                                                            <button
                                                                onClick={() => toggleForceMode(chat.from, forceModeStates[chat.from] || false)}
                                                                className={`w-8 h-8 rounded-full border-2 hover:opacity-80 transition-all focus:outline-none flex items-center justify-center ${
                                                                    forceModeStates[chat.from] 
                                                                        ? 'border-green-500 bg-green-500' 
                                                                        : 'border-gray-500 bg-white'
                                                                }`}
                                                                title={forceModeStates[chat.from] ? 'Bot Mode OFF (Manual)' : 'Bot Mode ON (Auto)'}
                                                            >
                                                                {forceModeStates[chat.from] ? (
                                                                    <FaWhatsapp size={16} className="text-white" />
                                                                ) : (
                                                                    <FaRobot size={16} className="text-gray-500" />
                                                                )}
                                                            </button>
                                                        )
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                                            forceModeStates[chat.from] 
                                                                ? 'border-green-500 bg-green-500' 
                                                                : 'border-gray-500 bg-white'
                                                        }`}>
                                                            {forceModeStates[chat.from] ? (
                                                                <FaWhatsapp size={16} className="text-white" title="Bot OFF (Manual)" />
                                                            ) : (
                                                                <FaRobot size={16} className="text-gray-500" title="Bot ON (Auto)" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Pinned Control */}
                                                <div className="flex items-center justify-center">
                                                    {(role === "Admin" || role === "SuperAdmin") ? (
                                                        <button
                                                            onClick={() => togglePin(chat.sessionId)}
                                                            disabled={loadingPin[chat.sessionId]}
                                                            className="p-1 rounded-full hover:bg-gray-100 transition-all focus:outline-none"
                                                            title={pinnedReports[chat.sessionId] ? "Hapus star laporan" : "Star laporan"}
                                                        >
                                                            {loadingPin[chat.sessionId] ? (
                                                                <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin"></div>
                                                            ) : pinnedReports[chat.sessionId] ? (
                                                                <FaStar size={20} className="text-yellow-500" />
                                                            ) : (
                                                                <FaRegStar size={20} className="text-gray-500" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            {chat.is_pinned ? (
                                                                <FaStar size={20} className="text-yellow-500" />
                                                            ) : (
                                                                <FaRegStar size={20} className="text-gray-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Tag */}
                                        <td className="px-3 py-1.5">
                                            {(
                                                Array.isArray(chat.tindakan?.tag) && chat.tindakan.tag.length > 0
                                                || Array.isArray(chat.tags) && chat.tags.length > 0
                                            ) ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {/* Render tag dari tindakan.tag (bentuk baru) */}
                                                    {Array.isArray(chat.tindakan?.tag) && chat.tindakan.tag.length > 0 &&
                                                        chat.tindakan.tag.map((tagItem, index) => {
                                                            // Jika object
                                                            if (typeof tagItem === "object" && tagItem !== null && "hash_tag" in tagItem) {
                                                                return (
                                                                    <button
                                                                        key={tagItem._id || `tag-obj-${index}`}
                                                                        className="bg-blue-100 text-blue-800 text-xs font-medium px-0.5 py-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                                                                        onClick={() => setSearch(`${tagItem.hash_tag}`)}
                                                                        title={`Klik untuk mencari tag: #${tagItem.hash_tag}`}
                                                                    >
                                                                        #{tagItem.hash_tag}
                                                                    </button>
                                                                );
                                                            }
                                                            // Jika string (legacy)
                                                            if (typeof tagItem === "string") {
                                                                return (
                                                                    <button
                                                                        key={`tag-str-${index}`}
                                                                        className="bg-blue-100 text-blue-800 text-xs font-medium px-0.5 py-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                                                                        onClick={() => setSearch(`${tagItem}`)}
                                                                        title={`Klik untuk mencari tag: #${tagItem}`}
                                                                    >
                                                                        #{tagItem}
                                                                    </button>
                                                                );
                                                            }
                                                            return null;
                                                        })
                                                    }
                                                    {/* Render tags dari root (legacy, jika tindakan.tag kosong) */}
                                                    {(!chat.tindakan?.tag || chat.tindakan.tag.length === 0) && Array.isArray(chat.tags) && chat.tags.length > 0 &&
                                                        chat.tags.map((tag, idx) => (
                                                            <button
                                                                key={`legacy-root-tag-${idx}`}
                                                                className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                                                                onClick={() => setSearch(`${tag}`)}
                                                                title={`Klik untuk mencari tag: #${tag}`}
                                                            >
                                                                #{tag}
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        {/* Link ke halaman detail */}
                                        <td className="px-6 py-1.5">
                                            <div>
                                                <Link
                                                href={`/pengaduan/${chat.sessionId}`}
                                                className="w-[100px] justify-center mb-1 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap"
                                            >
                                                Lihat Detail
                                            </Link>
                                            <div
                                                className="w-[100px] inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-black text-xs font-medium rounded-lg shadow-sm whitespace-nowrap"
                                            >
                                                {/* Icon User dengan warna dinamis */}
                                                <FaUser
                                                    className={`w-3 h-3 ${chat?.processed_by?.role === "Bupati"
                                                        ? "text-red-600"
                                                        : "text-gray-400"
                                                        }`}
                                                />
                                                {/* Nama Admin, tetap di satu baris, jika panjang di-ellipsis */}
                                                <span
                                                    className="max-w-[100px] whitespace-nowrap overflow-hidden text-ellipsis block"
                                                    title={chat?.processed_by?.nama_admin || "-"}
                                                >
                                                    {chat?.processed_by?.nama_admin
                                                        ? chat.processed_by.nama_admin.length > 15
                                                            ? chat.processed_by.nama_admin.slice(0, 15) + "..."
                                                            : chat.processed_by.nama_admin
                                                        : "-"}
                                                </span>
                                            </div>
                                            </div>
                                        </td>

                                        {/* ID */}
                                        <td className="px-6 py-1.5">
                                            {chat?.tindakan?.url ? (
                                                <button
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 hover:text-blue-900 text-sm font-medium rounded-lg border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap max-w-[140px] cursor-pointer"
                                                    onClick={() => {
                                                        if (chat?.tindakan?.url) {
                                                            window.open(chat.tindakan.url, '_blank', 'noopener,noreferrer');
                                                        }
                                                    }}
                                                    title={`Klik untuk membuka link: ${chat.tindakan.url}`}
                                                >
                                                    <Image 
                                                        src="/Spanlapor-icon.png" 
                                                        alt="Spanlapor Icon" 
                                                        width={12} 
                                                        height={12} 
                                                        className="w-3 h-3 flex-shrink-0 object-contain" 
                                                    />
                                                    <span className="truncate">
                                                        {chat?.tindakan?.trackingId || '-'}
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-500 text-sm font-medium rounded-lg border border-gray-200 whitespace-nowrap max-w-[140px]">
                                                    <Image 
                                                        src="/Spanlapor-icon.png" 
                                                        alt="Spanlapor Icon" 
                                                        width={12} 
                                                        height={12} 
                                                        className="w-3 h-3 flex-shrink-0 object-contain opacity-50" 
                                                    />
                                                    <span className="truncate">
                                                        {chat?.tindakan?.trackingId || '-'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Tanggal laporan dengan timer */}
                                        <td className="px-1 py-1.5">
                                            <div className="flex flex-col items-center justify-center leading-tight">
                                                {/* Baris 1: Tanggal */}
                                                <div className="text-[10pt] font-medium">
                                                    {chat.createdAt
                                                        ? (() => {
                                                            const date = new Date(chat.createdAt);
                                                            const day = date.toLocaleDateString("id-ID", { day: "2-digit", timeZone: "Asia/Jakarta" });
                                                            const month = date.toLocaleDateString("id-ID", { month: "short", timeZone: "Asia/Jakarta" });
                                                            const year = date.toLocaleDateString("id-ID", { year: "numeric", timeZone: "Asia/Jakarta" });
                                                            const time = date.toLocaleTimeString("id-ID", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                timeZone: "Asia/Jakarta",
                                                                hour12: false,
                                                            });
                                                            return `${day} ${month} ${year}, ${time} WIB`;
                                                        })()
                                                        : "-"}
                                                </div>
                                                {/* Baris 2: Timer */}
                                                <div className="text-[9pt] text-gray-500 mt-0.5">
                                                    {getElapsedTime(chat.createdAt)}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Nama Pelapor */}
                                        <td className="px-6 py-1.5">
                                            <button
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 hover:text-blue-900 text-sm font-medium rounded-lg border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap max-w-[140px]"
                                                onClick={() => setSearch(`${chat.from || ''}`)}
                                                title={`Klik untuk mencari laporan dari: ${chat.user || 'Unknown'}`}
                                            >
                                                <span className="truncate">
                                                    {chat.user || '-'}
                                                </span>
                                            </button>
                                        </td>

                                        {/* Lokasi kejadian */}
                                        <td className="px-6 py-1.5">
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
                                        
                                        <td className="px-6 py-1.5">
                                            {chat.tindakan?.status ? (
                                                <div className="flex items-center">
                                                    <div className="w-6 flex justify-center">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full inline-block"
                                                            style={{
                                                                backgroundColor: chat.tindakan.status && statusColors[chat.tindakan.status]
                                                                    ? statusColors[chat.tindakan.status]
                                                                    : 'gray'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-gray-800 font-medium">
                                                        {chat.tindakan.status}
                                                    </div>
                                                </div>
                                            ) : <span className="text-sm text-gray-500">-</span>}
                                        </td>

                                        <td className="px-6 py-1.5">{chat.tindakan?.situasi || '-'}</td>

                                        <td className="px-6 py-1.5">
                                            {chat.tindakan?.opd ? (
                                                // Handle string array (actual API response)
                                                Array.isArray(chat.tindakan.opd) && chat.tindakan.opd.length > 0 ? (
                                                    <Tooltip text="Klik untuk melihat semua OPD terkait">
                                                        <button
                                                            className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                                            onClick={() => {
                                                                try {
                                                                    // Safely handle opd array with proper type checking
                                                                    const opdList = Array.isArray(chat.tindakan?.opd)
                                                                        ? chat.tindakan?.opd
                                                                        : typeof chat.tindakan?.opd === 'string'
                                                                            ? [chat.tindakan?.opd]
                                                                            : [];

                                                                    setSelectedOpds(opdList);
                                                                    setModalTitle(`OPD Terkait - ${chat.sessionId}`);
                                                                    setOpdModalVisible(true);
                                                                } catch (error) {
                                                                    console.error("Error showing OPD modal:", error);
                                                                    alert("Terjadi kesalahan saat menampilkan data OPD");
                                                                }
                                                            }}
                                                        >
                                                            {Array.isArray(chat.tindakan.opd) && chat.tindakan.opd.length > 1
                                                                ? `${chat.tindakan.opd[0]?.substring(0, 10) || ""}${(chat.tindakan.opd[0]?.length || 0) > 10 ? '...' : ''} +${chat.tindakan.opd.length - 1} lainnya`
                                                                : Array.isArray(chat.tindakan.opd) && chat.tindakan.opd.length === 1
                                                                    ? `${chat.tindakan.opd[0]?.substring(0, 15) || ""}${(chat.tindakan.opd[0]?.length || 0) > 15 ? '...' : ''}`
                                                                    : '-'
                                                            }
                                                        </button>
                                                    </Tooltip>
                                                )
                                                    // Handle legacy string value for backward compatibility
                                                    : typeof chat.tindakan.opd === "string" ? (
                                                        <Tooltip text="Klik untuk melihat detail OPD">
                                                            <button
                                                                className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                                                onClick={() => {
                                                                    // Using non-null assertion since we've already checked above
                                                                    setSelectedOpds([chat.tindakan?.opd as string]);
                                                                    setModalTitle(`OPD Terkait - ${chat.sessionId}`);
                                                                    setOpdModalVisible(true);
                                                                }}
                                                            >
                                                                {(chat.tindakan.opd as string).length > 15
                                                                    ? `${(chat.tindakan.opd as string).substring(0, 15)}...`
                                                                    : chat.tindakan.opd}
                                                            </button>
                                                        </Tooltip>
                                                    )
                                                        // Empty or unexpected format
                                                        : "-"
                                            ) : "-"}
                                        </td>

                                        {/* Foto */}
                                        <td className="px-2 py-1.5">
                                            <div className="flex justify-center items-center">
                                                {(() => {
                                                    // Validasi data foto
                                                    if (!chat.photos || !Array.isArray(chat.photos) || chat.photos.length === 0) {
                                                        return <span className="text-gray-400 text-xs">No Photo</span>;
                                                    }

                                                    const baseUrl = process.env.NEXT_PUBLIC_BE_BASE_URL;
                                                    if (!baseUrl) {
                                                        console.error('NEXT_PUBLIC_BE_BASE_URL tidak ditemukan');
                                                        return <span className="text-red-500 text-xs">Config Error</span>;
                                                    }

                                                    const firstPhoto = chat.photos[0];
                                                    if (!firstPhoto) {
                                                        return <span className="text-gray-400 text-xs">No Photo</span>;
                                                    }

                                                    // Buat URL yang benar
                                                    let photoUrl: string;
                                                    if (firstPhoto.startsWith('http')) {
                                                        // Jika sudah URL lengkap
                                                        photoUrl = firstPhoto;
                                                    } else {
                                                        // Jika path relatif, gabung dengan base URL
                                                        const cleanPath = firstPhoto.startsWith('/') ? firstPhoto : `/${firstPhoto}`;
                                                        photoUrl = `${baseUrl}${cleanPath}`;
                                                    }

                                                    console.log('Photo URL:', photoUrl);

                                                    return (
                                                        <Image
                                                            src={photoUrl}
                                                            alt="Foto pengaduan"
                                                            className="h-10 w-10 object-cover rounded border border-gray-300 cursor-pointer"
                                                            width={40}
                                                            height={40}
                                                            onClick={() => {
                                                                if (chat.photos.length > 1) {
                                                                    setPhotoModal(chat.photos, {
                                                                        sessionId: chat.sessionId,
                                                                        userName: chat.user || 'Unknown'
                                                                    });
                                                                } else {
                                                                    // Untuk foto tunggal, langsung download dengan nama yang benar
                                                                    downloadSinglePhoto(photoUrl, chat.sessionId, chat.user || 'Unknown', firstPhoto);
                                                                }
                                                            }}
                                                            onError={(e) => {
                                                                console.error('Error loading image:', photoUrl);
                                                                console.error('Photo data:', chat.photos);
                                                                // Instead of manipulating DOM, show alert directly
                                                                alert(`Gagal memuat gambar.\nURL: ${photoUrl}\nBase URL: ${baseUrl}\nPhoto Path: ${firstPhoto}\nFull Photos: ${JSON.stringify(chat.photos)}`);
                                                            }}
                                                            onLoad={() => {
                                                                console.log('✅ Image loaded successfully:', photoUrl);
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        </td>

                                        {/* Checkbox SuperAdmin */}
                                        {role === 'SuperAdmin' && (
                                            <td className="px-6 py-1.5">
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
                                <td colSpan={10} className="py-4 text-center text-gray-500">
                                    Tidak ada data ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Modal untuk menampilkan daftar lengkap OPD */}
                {opdModalVisible && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4"
                        onClick={() => setOpdModalVisible(false)}
                    >
                        <div
                            className="bg-white rounded-lg shadow-xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center border-b px-6 py-4">
                                <h3 className="font-semibold text-lg text-black">{modalTitle}</h3>
                                <button
                                    onClick={() => setOpdModalVisible(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-6 max-h-96 overflow-auto text-black">
                                {selectedOpds.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedOpds.map((opd, idx) => (
                                            <li key={idx} className="pb-2 border-b border-gray-100 last:border-0">
                                                <div className="flex">
                                                    <div className="font-semibold mr-2 text-black">{idx + 1}.</div>
                                                    <div className="text-black">{opd}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-4 text-gray-600">
                                        Tidak ada data OPD untuk ditampilkan
                                    </div>
                                )}
                            </div>
                            <div className="border-t px-6 py-4 flex justify-end">
                                <button
                                    onClick={() => setOpdModalVisible(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableSection;