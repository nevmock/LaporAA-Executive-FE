"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from '../../../utils/axiosInstance';
import dayjs from "dayjs";
import { ModernStatCard } from '../modern';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiTrendingUp,
  FiAlertCircle 
} from 'react-icons/fi';

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
    "Perlu Verifikasi": "#ef4444",        // red
    "Verifikasi Situasi": "#a855f7",      // violet
    "Verifikasi Kelengkapan Berkas": "#f97316", // orange
    "Proses OPD Terkait": "#eab308",      // yellow
    "Selesai Penanganan": "#3b82f6",      // blue
    "Selesai Pengaduan": "#22c55e",       // green
    "Ditutup": "#374151",                 // black/gray
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

    return (
        <div className="space-y-8">
            {/* Modern Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernStatCard
                    icon={FiFileText}
                    title="Total Laporan"
                    value={totalAll.toLocaleString()}
                    color="blue"
                    description="Total laporan masuk"
                />
                <ModernStatCard
                    icon={FiClock}
                    title="Tindak Lanjut"
                    value={totalFollowUp.toLocaleString()}
                    trend="up"
                    trendValue={`${percentFollowUp}%`}
                    color="orange"
                    description="Laporan dalam proses"
                />
                <ModernStatCard
                    icon={FiCheckCircle}
                    title="Selesai"
                    value={(statusCounts["Selesai Pengaduan"] || 0).toLocaleString()}
                    trend="up"
                    trendValue={`${percentSelesai}%`}
                    color="green"
                    description="Pengaduan selesai"
                />
                <ModernStatCard
                    icon={FiXCircle}
                    title="Ditutup"
                    value={(statusCounts["Ditutup"] || 0).toLocaleString()}
                    trend="down"
                    trendValue={`${percentDitutup}%`}
                    color="red"
                    description="Pengaduan ditutup"
                />
            </div>

            {/* Status Detail Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Detail Status Pengaduan
                        </h3>
                        <p className="text-base text-gray-700">
                            Ringkasan status untuk setiap kategori pengaduan
                        </p>
                    </div>
                    
                    <div className="mt-6 lg:mt-0">
                        <button
                            onClick={handleDownloadCSV}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                            type="button"
                        >
                            <FiTrendingUp size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Time Filter */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">
                                Filter Waktu
                            </label>
                            <select
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                            >
                                {FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        {/* Year Filter */}
                        {filter !== "all" && (
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-2">
                                    Tahun
                                </label>
                                <select
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Month Filter */}
                        {(filter === "monthly" || filter === "weekly") && (
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-2">
                                    Bulan
                                </label>
                                <select
                                    value={month}
                                    onChange={e => setMonth(Number(e.target.value))}
                                    className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[130px]"
                                >
                                    {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Week Filter */}
                        {filter === "weekly" && (
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-2">
                                    Minggu
                                </label>
                                <select
                                    value={week}
                                    onChange={e => setWeek(Number(e.target.value))}
                                    className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                                >
                                    {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                        <option key={w} value={w}>Minggu ke-{w}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-gray-600 font-medium">Memuat data...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto bg-white rounded-lg border border-gray-200">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white border-b-2 border-gray-200">
                                        <th className="text-left py-4 px-6 font-bold text-gray-900 text-base">
                                            Status
                                        </th>
                                        <th className="text-right py-4 px-6 font-bold text-gray-900 text-base">
                                            Jumlah
                                        </th>
                                        <th className="text-right py-4 px-6 font-bold text-gray-900 text-base">
                                            Persentase
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {STATUS_ORDER.map((status, i) => {
                                        const count = statusCounts[status] || 0;
                                        const percent = totalAll > 0 ? ((count / totalAll) * 100).toFixed(1) : "0";
                                        return (
                                            <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div 
                                                            className="w-4 h-4 rounded-full shadow-sm"
                                                            style={{ backgroundColor: STATUS_COLORS[status] }}
                                                        />
                                                        <span className="text-gray-900 font-semibold text-base">
                                                            {status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-bold text-gray-900 text-lg">
                                                    {count.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right font-semibold text-gray-700 text-base">
                                                    {percent}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4">
                            {STATUS_ORDER.map((status, i) => {
                                const count = statusCounts[status] || 0;
                                const percent = totalAll > 0 ? ((count / totalAll) * 100).toFixed(1) : "0";
                                return (
                                    <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="w-4 h-4 rounded-full shadow-sm"
                                                    style={{ backgroundColor: STATUS_COLORS[status] }}
                                                />
                                                <span className="font-semibold text-gray-900 text-base">
                                                    {status}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {count.toLocaleString()}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-600">
                                                    {percent}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
