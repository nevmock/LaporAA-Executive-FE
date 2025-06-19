"use client";

import React from "react";

interface SummaryTableProps {
    statusCounts: Record<string, number>;
}

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

const SummaryTable: React.FC<SummaryTableProps> = ({ statusCounts }) => {
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

    return (
        <div className="bg-white shadow-md text-gray-800 rounded-lg p-4 overflow-y-auto max-h-[500px]">
            <h3 className="text-lg font-bold mb-4">Ringkasan Status Pengaduan</h3>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-auto">
                <table className="w-full text-xs text-center whitespace-nowrap border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            {STATUS_ORDER.map((status) => (
                                <th key={status} className="border px-3 py-2 max-w-[160px] whitespace-normal">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                                        <div className="break-words leading-tight">{status}</div>
                                    </div>
                                </th>
                            ))}
                            <th className="border px-3 py-2 max-w-[120px] whitespace-normal">
                                Total<br />Laporan Masuk
                            </th>
                            <th className="border px-3 py-2 max-w-[120px] whitespace-normal">
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

            {/* Mobile Layout */}
            <div className="md:hidden flex flex-col gap-3">
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
        </div>
    );
};

export default SummaryTable;
