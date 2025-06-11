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

    const totalSemua = orderedStatus.reduce((sum, key) => sum + (statusCounts[key] || 0), 0);
    const totalTanpaDitolak = orderedStatus
        .filter((s) => s !== "Ditolak")
        .reduce((sum, key) => sum + (statusCounts[key] || 0), 0);

    const persenTL = totalSemua
        ? ((totalTanpaDitolak / totalSemua) * 100).toFixed(1)
        : "0";

    return (
        <div className="bg-white shadow-md text-gray-700 rounded-lg p-4 overflow-y-auto max-h-[500px]">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Ringkasan Status Pengaduan</h3>

            {/* Desktop layout: table */}
            <div className="hidden md:block overflow-auto">
                <table className="w-full text-sm text-center whitespace-nowrap border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            {orderedStatus.map((status) => (
                                <th key={status} className="border px-3 py-2 text-left">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-3 h-3 rounded-full inline-block"
                                            style={{ backgroundColor: statusColors[status] }}
                                        />
                                        {status}
                                    </div>
                                </th>
                            ))}

                            <th className="border px-3 py-2">
                                Total<br />
                                Laporan Masuk
                            </th>
                            <th className="border px-3 py-2">
                                Total<br />
                                Tindak Lanjut
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-semibold">
                            {orderedStatus.map((status, i) => (
                                <td key={i} className="border px-3 py-2">{statusCounts[status] || 0}</td>
                            ))}
                            <td className="border px-3 py-2">{totalSemua}</td>
                            <td className="border px-3 py-2">{totalTanpaDitolak} ({persenTL}%)</td>

                            {/* <td className="border px-3 py-2">{rhp}</td> */}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Mobile layout: vertical summary */}
            <div className="md:hidden flex flex-col gap-3">
                {orderedStatus.map((status, i) => (
                    <div key={i} className="flex justify-between border-b pb-1 text-sm">
                        <span className="font-medium">{status}</span>
                        <span>{statusCounts[status] || 0}</span>
                    </div>
                ))}

                <div className="flex justify-between border-t pt-2 font-semibold text-sm mt-2">
                    <span>Total</span>
                    <span>{totalSemua}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Total (Tanpa Ditolak)</span>
                    <span>{totalTanpaDitolak} ({persenTL}%)</span>
                </div>

            </div>
        </div>
    );
};

export default SummaryTable;