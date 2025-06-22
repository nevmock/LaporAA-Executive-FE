"use client";

import React, { useEffect } from "react";
import {
    FaStar, FaIdCard, FaUser, FaPhone, FaMap,
    FaExclamationCircle, FaCheckCircle, FaBuilding, FaClock, FaPhotoVideo,
    FaHashtag
} from "react-icons/fa";
import { ImSwitch } from "react-icons/im";
import { IoTrashBin } from "react-icons/io5";
import { BsPinAngleFill, BsPersonFillCheck } from "react-icons/bs";
import { RiPushpin2Fill, RiPushpin2Line } from "react-icons/ri";
import axios from "../../utils/axiosInstance";
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
    selectedIds, toggleSingleSelect,
    handleDeleteSelected, toggleMode, setSelectedLoc, setPhotoModal,
    loading,
}) => {
    // State untuk modal OPD
    const [opdModalVisible, setOpdModalVisible] = React.useState(false);
    const [selectedOpds, setSelectedOpds] = React.useState<string[]>([]);
    const [modalTitle, setModalTitle] = React.useState("");
    const [pinnedReports, setPinnedReports] = React.useState<Record<string, boolean>>({});
    const [loadingPin, setLoadingPin] = React.useState<Record<string, boolean>>({});

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
                } catch (error) {
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
        <div className="px-2 py-2 h-full flex flex-col overflow-hidden bg-white">
            <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-300">
                <table className="min-w-full table-fixed text-left text-sm border-collapse">
                    {/* -------- Tabel Header -------- */}
                    <thead className="sticky top-0 z-[300] bg-gray-800 text-white">
                        <tr>
                            {/* Loop untuk membuat header dari kolom */}
                            {[
                                { key: 'prioritas', icon: <FaStar />, label: '' },
                                // { key: 'bot_switch', icon: <ImSwitch />, label: '' },
                                { key: 'pinned', icon: <BsPinAngleFill />, label: '' },
                                { key: 'admin', icon: <BsPersonFillCheck />, label: '' },
                                { key: 'tag', icon: <FaHashtag />, label: 'Tag' },
                                { key: 'sessionId', icon: <FaIdCard />, label: 'No. Id' },
                                { key: 'date', icon: <FaClock />, label: 'Tgl. Laporan' },
                                { key: 'user', icon: <FaUser />, label: 'Nama' },
                                // { key: 'from', icon: <FaPhone />, label: 'No. Kontak' },
                                { key: 'lokasi_kejadian', icon: <FaMap />, label: 'Lokasi Kejadian' },
                                { key: 'situasi', icon: <FaExclamationCircle />, label: 'Situasi' },
                                { key: 'status', icon: <FaCheckCircle />, label: 'Status' },
                                { key: 'opd', icon: <FaBuilding />, label: 'OPD Terkait' },
                                { key: 'timer', icon: <FaClock />, label: 'Waktu Berjalan' },
                                { key: 'photo', icon: <FaPhotoVideo />, label: 'Foto' },
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

                                        {/* Bot Switch */}
                                        {/* <td className="px-4 py-2">
                                            {(role === "Bupati" || role === "SuperAdmin") ? (
                                                <Switch
                                                    checked={isPrioritas}
                                                    onChange={(e) => toggleMode(chat.tindakan?.report!, e)}
                                                    className={`${isPrioritas ? 'bg-green-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPrioritas ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </Switch>
                                            ) : chat.tindakan?.prioritas || '-'}
                                        </td> */}

                                        {/* Pinned */}
                                        <td className="px-4 py-2">
                                            {(role === "Admin" || role === "SuperAdmin") ? (
                                                <button
                                                    onClick={() => togglePin(chat.sessionId)}
                                                    disabled={loadingPin[chat.sessionId]}
                                                    className="p-1 rounded-full hover:bg-gray-100 transition-all focus:outline-none"
                                                    title={pinnedReports[chat.sessionId] ? "Hapus pin laporan" : "Pin laporan"}
                                                >
                                                    {loadingPin[chat.sessionId] ? (
                                                        <div className="w-5 h-5 rounded-full border-2 border-gray-500 border-t-transparent animate-spin"></div>
                                                    ) : pinnedReports[chat.sessionId] ? (
                                                        <RiPushpin2Fill size={20} className="text-red-500" />
                                                    ) : (
                                                        <RiPushpin2Line size={20} className="text-gray-500" />
                                                    )}
                                                </button>
                                            ) : (
                                                chat.is_pinned ? (
                                                    <RiPushpin2Fill size={20} className="text-red-500 mx-auto" />
                                                ) : '-'
                                            )}
                                        </td>

                                        {/* Admin */}
                                        <td className="px-4 py-2">{chat?.processed_by?.nama_admin || '-'}</td>

                                        {/* Tag */}
                                        <td className="px-4 py-2">
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
                                                                    <span
                                                                        key={tagItem._id || `tag-obj-${index}`}
                                                                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full"
                                                                    >
                                                                        #{tagItem.hash_tag}
                                                                    </span>
                                                                );
                                                            }
                                                            // Jika string (legacy)
                                                            if (typeof tagItem === "string") {
                                                                return (
                                                                    <span
                                                                        key={`tag-str-${index}`}
                                                                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full"
                                                                    >
                                                                        #{tagItem}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })
                                                    }
                                                    {/* Render tags dari root (legacy, jika tindakan.tag kosong) */}
                                                    {(!chat.tindakan?.tag || chat.tindakan.tag.length === 0) && Array.isArray(chat.tags) && chat.tags.length > 0 &&
                                                        chat.tags.map((tag, idx) => (
                                                            <span
                                                                key={`legacy-root-tag-${idx}`}
                                                                className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            ) : (
                                                "-"
                                            )}
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

                                        {/* Nama Pelapor */}
                                        <td className="px-4 py-2">{chat.user || '-'}</td>

                                        {/* Nomor Telepon */}
                                        {/* <td className="px-4 py-2">{chat.from || '-'}</td> */}

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
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full inline-block"
                                                            style={{
                                                                backgroundColor: chat.tindakan.status && statusColors[chat.tindakan.status]
                                                                    ? statusColors[chat.tindakan.status]
                                                                    : 'gray'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-sm text-gray-800 font-medium">
                                                        {chat.tindakan.status}
                                                    </div>
                                                </div>
                                            ) : <span className="text-sm text-gray-500">-</span>}
                                        </td>
                                        <td className="px-4 py-2">
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

                                        {/* Timer */}
                                        <td className="px-4 py-2">{getElapsedTime(chat.createdAt)}</td>

                                        {/* Foto */}
                                        <td className="px-2 py-2">
                                            <div className="flex justify-center items-center">
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
                                            </div>
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

            {/* Modal untuk menampilkan daftar lengkap OPD */}
            {opdModalVisible && (
                <div
                    className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4"
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
    );
};

export default TableSection;