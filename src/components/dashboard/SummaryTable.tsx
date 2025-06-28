"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from '../../utils/axiosInstance';
import dayjs from "dayjs";

const STATUS_ORDER = [
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditutup",
];

const STATUS_COLORS: Record<string, string> = {
    "Perlu Verifikasi": "#FF3131",
    "Verifikasi Situasi": "#5E17EB",
    "Verifikasi Kelengkapan Berkas": "#FF9F12",
    "Proses OPD Terkait": "rgb(250 204 21)",
    "Selesai Penanganan": "rgb(96 165 250)",
    "Selesai Pengaduan": "rgb(74 222 128)",
    "Ditutup": "black",
};

const FILTERS = [
    { label: "All Time", value: "all" },
    { label: "Yearly", value: "yearly" },
    { label: "Monthly", value: "monthly" },
    { label: "Weekly", value: "weekly" },
];

const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const now = dayjs();
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface StatusCounts {
    [key: string]: number;
}

export default function SummaryTable() {
    const [filter, setFilter] = useState("all"); // Default: all time
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
    const [loading, setLoading] = useState(false);

    // Generate list tahun
    const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.year() - i), []);

    // Reset week saat filter/ganti bulan/tahun
    useEffect(() => {
        setWeek(1);
    }, [filter, month, year]);

    // Fetch data dari API (axiosInstance)
    const fetchData = React.useCallback(() => {
        setLoading(true);
        const url = `${API_URL}/dashboard/summary-dashboard`;
        // Query param pakai object (lebih aman & readable)
        const params: Record<string, string | number> = {};
        if (filter !== "all") {
            params.mode = filter;
            params.year = year;
            if (filter !== "yearly") params.month = month;
            if (filter === "weekly") params.week = week;
        } else {
            params.mode = "all";
        }
        axios.get(url, { params })
            .then(res => setStatusCounts(res.data || {}))
            .catch(() => setStatusCounts({}))
            .finally(() => setLoading(false));
    }, [filter, year, month, week]);

    // Logic table
    const totalAll = STATUS_ORDER.reduce((sum, key) => sum + (statusCounts[key] || 0), 0);
    const totalFollowUp =
        (statusCounts["Verifikasi Situasi"] || 0) +
        (statusCounts["Verifikasi Kelengkapan Berkas"] || 0) +
        (statusCounts["Proses OPD Terkait"] || 0) +
        (statusCounts["Selesai Penanganan"] || 0) +
        (statusCounts["Selesai Pengaduan"] || 0);

    const percentFollowUp = totalAll > 0 ? ((totalFollowUp / totalAll) * 100).toFixed(1) : "0";
    const percentSelesai = totalAll > 0 ? ((statusCounts["Selesai Pengaduan"] || 0) / totalAll * 100).toFixed(1) : "0";
    const percentDitutup = totalAll > 0 ? ((statusCounts["Ditutup"] || 0) / totalAll * 100).toFixed(1) : "0";

    // Weeks in Month
    function getWeeksInMonth(y: number, m: number) {
        const start = dayjs(`${y}-${m}-01`);
        const end = start.endOf("month");
        let count = 1;
        let current = start.startOf("week").add(1, "day");
        while (current.isBefore(end)) {
            count++;
            current = current.add(1, "week");
        }
        return count;
    }

    // Export CSV
    const handleDownloadCSV = () => {
        let filterInfo = "";
        if (filter === "yearly") filterInfo = `,${year}`;
        else if (filter === "monthly") filterInfo = `,${months[month - 1]},${year}`;
        else if (filter === "weekly") filterInfo = `,Minggu ke-${week},${months[month - 1]},${year}`;
        let csv = `Status,Total,Persen${filterInfo ? ',Filter' : ''}\n`;
        STATUS_ORDER.forEach((status) => {
            const percent =
                status === "Selesai Pengaduan"
                    ? percentSelesai
                    : status === "Ditutup"
                        ? percentDitutup
                        : "";
            csv += `${status},${statusCounts[status] || 0}${percent ? `,${percent}%` : ""}${filterInfo ? ',' + filterInfo.replace(/,/g, ' ') : ''}\n`;
        });
        csv += `Total Laporan Masuk,${totalAll},\n`;
        csv += `Total Tindak Lanjut,${totalFollowUp},${percentFollowUp}%\n`;

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ringkasan-status-${filter === "all" ? "all-time" : filter}-${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 5 * 60 * 1000); // 5 menit
        console.info("✅ Memperbarui data");
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header & filter */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4 mx-4">
                <h4 className="text-lg font-semibold text-gray-800">Ringkasan Status Pengaduan</h4>
                <div className="flex flex-wrap gap-2 items-center justify-end mt-5">
                    {/* Filter waktu */}
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="border rounded px-2 py-1 text-sm text-black"
                    >
                        {FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {/* Pilih tahun */}
                    {filter !== "all" && (
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm text-black"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    )}
                    {/* Pilih bulan */}
                    {(filter === "monthly" || filter === "weekly") && (
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm text-black"
                        >
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    )}
                    {/* Pilih minggu */}
                    {filter === "weekly" && (
                        <select
                            value={week}
                            onChange={e => setWeek(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm text-black"
                        >
                            {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Minggu ke-{w}</option>
                            ))}
                        </select>
                    )}
                    {/* Export CSV */}
                    <button
                        onClick={handleDownloadCSV}
                        className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600"
                        type="button"
                    >
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Tabel dan mobile */}
            <div className="bg-white shadow-md text-gray-800 rounded-lg p-4 overflow-y-auto max-h-[500px]">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-auto">
                            <table className="w-full text-xs text-center whitespace-nowrap border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        {STATUS_ORDER.map((status) => (
                                            <th key={status} className="border px-3 py-2 max-w-[160px] whitespace-normal text-center align-middle">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                                                    <div className="break-words leading-tight text-center">{status}</div>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="border px-3 py-2 max-w-[120px] whitespace-normal text-center align-middle">
                                            Total<br />Laporan Masuk
                                        </th>
                                        <th className="border px-3 py-2 max-w-[120px] whitespace-normal text-center align-middle">
                                            Total<br />Tindak Lanjut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="font-semibold">
                                        {STATUS_ORDER.map((status, i) => {
                                            const count = statusCounts[status] || 0;
                                            const percent =
                                                status === "Selesai Pengaduan"
                                                    ? percentSelesai
                                                    : status === "Ditutup"
                                                        ? percentDitutup
                                                        : null;
                                            return (
                                                <td key={i} className="border px-3 py-2">
                                                    {percent ? `${count} (${percent}%)` : count}
                                                </td>
                                            );
                                        })}
                                        <td className="border px-3 py-2">{totalAll}</td>
                                        <td className="border px-3 py-2">{totalFollowUp} ({percentFollowUp}%)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile */}
                        <div className="md:hidden flex flex-col gap-3 mt-2">
                            {STATUS_ORDER.map((status, i) => {
                                const count = statusCounts[status] || 0;
                                const percent =
                                    status === "Selesai Pengaduan"
                                        ? percentSelesai
                                        : status === "Ditutup"
                                            ? percentDitutup
                                            : null;
                                return (
                                    <div key={i} className="flex justify-between items-center text-sm border-b py-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full inline-block"
                                                style={{ backgroundColor: STATUS_COLORS[status] }}
                                            />
                                            {status}
                                        </div>
                                        <span>{percent ? `${count} (${percent}%)` : count}</span>
                                    </div>
                                );
                            })}
                            <div className="flex justify-between border-t pt-2 font-semibold text-sm mt-2">
                                <span>Total Laporan Masuk</span>
                                <span>{totalAll}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Total Tindak Lanjut</span>
                                <span>{totalFollowUp} ({percentFollowUp}%)</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}