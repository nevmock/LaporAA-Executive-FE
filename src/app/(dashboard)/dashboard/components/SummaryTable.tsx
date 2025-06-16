"use client";
import React from "react";

interface SummaryTableProps {
    statusCounts: Record<string, number>;
}
const statusColors: Record<string, string> = {
    "Perlu Verifikasi": "#FF3131",
    "Verifikasi Situasi": "#5E17EB",
    "Verifikasi Kelengkapan Berkas": "#FF9F12",
    "Proses OPD Terkait": "rgb(250 204 21)", // yellow-400
    "Selesai Penanganan": "rgb(96 165 250)", // blue-400
    "Selesai Pengaduan": "rgb(74 222 128)", // green-400
    "Ditolak": "black",
};

const SummaryTable: React.FC<SummaryTableProps> = ({ statusCounts }) => {
    const orderedStatus = [
        "Perlu Verifikasi",
        "Verifikasi Situasi",
        "Verifikasi Kelengkapan Berkas",
        "Proses OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Ditolak"
    ];

    console.info("Status Counts:", statusCounts);

    const totalSemua = orderedStatus.reduce((sum, key) => sum + (statusCounts[key] || 0), 0);
    const totalTindakLanjut =
        (statusCounts["Verifikasi Situasi"] || 0) +
        (statusCounts["Verifikasi Kelengkapan Berkas"] || 0) +
        (statusCounts["Proses OPD Terkait"] || 0) +
        (statusCounts["Selesai Penanganan"] || 0) +
        (statusCounts["Selesai Pengaduan"] || 0);

    const persenTL = totalTindakLanjut > 0
        ? ((totalTindakLanjut / totalSemua) * 100).toFixed(1)
        : "0";

    const totalTanpaDitolak = orderedStatus
        .filter((s) => s !== "Ditolak")
        .reduce((sum, key) => sum + (statusCounts[key] || 0), 0);

    const persenPengaduan = (statusCounts["Selesai Pengaduan"] || 0) > 0
        ? ((statusCounts["Selesai Pengaduan"] / totalSemua) * 100).toFixed(1)
        : "0";

    const persenDitolak = (statusCounts["Ditolak"] || 0) > 0
        ? ((statusCounts["Ditolak"] / totalSemua) * 100).toFixed(1)
        : "0";

    return (
        <div className="bg-white shadow-md text-gray-800 rounded-lg p-4 overflow-y-auto max-h-[500px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ringkasan Status Pengaduan</h3>

            {/* Desktop layout: table */}
            <div className="hidden md:block overflow-auto">
                <table className="w-full text-xs text-center whitespace-nowrap border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            {orderedStatus.map((status) => (
                                <th
                                    key={status}
                                    className="border px-3 py-2 text-center whitespace-normal max-w-[160px]"
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Kontainer 1: lingkaran */}
                                        <div className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: statusColors[status] }}
                                        />

                                        {/* Kontainer 2: teks status */}
                                        <div className="break-words leading-tight">
                                            {status}
                                        </div>
                                    </div>
                                </th>
                            ))}

                            {/* Kolom total */}
                            <th className="border px-3 py-2 text-center whitespace-normal max-w-[120px]">
                                Total<br />Laporan Masuk
                            </th>
                            <th className="border px-3 py-2 text-center whitespace-normal max-w-[120px]">
                                Total<br />Tindak Lanjut
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-semibold">
                            {orderedStatus.map((status, i) => {
                                const count = statusCounts[status] || 0;
                                if (status === "Selesai Pengaduan") {
                                    return (
                                        <td key={i} className="border px-3 py-2">
                                            {count} ({persenPengaduan}%)
                                        </td>
                                    );
                                } else if (status === "Ditolak") {
                                    return (
                                        <td key={i} className="border px-3 py-2">
                                            {count} ({persenDitolak}%)
                                        </td>
                                    );
                                }
                                return (
                                    <td key={i} className="border px-3 py-2">{count}</td>
                                );
                            })}

                            <td className="border px-3 py-2">{totalSemua}</td>
                            <td className="border px-3 py-2">{totalTindakLanjut} ({persenTL}%)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Mobile layout: vertical summary */}
            <div className="md:hidden flex flex-col gap-3">
                {orderedStatus.map((status, i) => {
                    const count = statusCounts[status] || 0;
                    return (
                        <div key={i} className="flex justify-between items-center text-sm border-b py-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full inline-block"
                                    style={{ backgroundColor: statusColors[status] }}
                                />
                                {status}
                            </div>
                            <span>
                                {count} {status === "Selesai Pengaduan" ? `(${persenPengaduan}%)` : ""}
                                {status === "Ditolak" ? ` (${persenDitolak}%)` : ""}
                            </span>
                        </div>
                    );
                })}

                <div className="flex justify-between border-t pt-2 font-semibold text-sm mt-2">
                    <span>Total Laporan Masuk</span>
                    <span>{totalSemua}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Total Tindak Lanjut</span>
                    <span>{totalTindakLanjut} ({persenTL}%)</span>
                </div>

            </div>
        </div>
    );
};

export default SummaryTable;