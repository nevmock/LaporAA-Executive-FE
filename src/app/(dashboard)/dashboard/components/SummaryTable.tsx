"use client";
import React from "react";

interface SummaryTableProps {
    statusCounts: Record<string, number>;
}

const SummaryTable: React.FC<SummaryTableProps> = ({ statusCounts }) => {
    // Sesuai dengan enum dari skema MongoDB kamu
    const orderedStatus = [
        "Perlu Verifikasi",
        "Verifikasi Situasi",
        "Verifikasi Kelengkapan Berkas",
        "Proses OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Ditolak"
    ];

    // Hitung total
    const totalSemua = orderedStatus.reduce((sum, key) => sum + (statusCounts[key] || 0), 0);

    // Hitung total tanpa 'Ditolak'
    const totalTanpaDitolak = orderedStatus
        .filter((s) => s !== "Ditolak")
        .reduce((sum, key) => sum + (statusCounts[key] || 0), 0);

    // Hitung %TL, RTL, RHP
    const persenTL = statusCounts["Selesai Pengaduan"]
        ? ((statusCounts["Selesai Pengaduan"] / totalTanpaDitolak) * 100).toFixed(1)
        : "0";

    const rtl = statusCounts["Selesai Pengaduan"]
        ? (statusCounts["Selesai Pengaduan"] / totalTanpaDitolak).toFixed(2)
        : "0";

    const rhp =
        statusCounts["Selesai Pengaduan"] && statusCounts["Proses OPD Terkait"]
            ? (statusCounts["Selesai Pengaduan"] / statusCounts["Proses OPD Terkait"]).toFixed(2)
            : "0";

    // Ambil jumlah berdasarkan urutan
    const tableData = orderedStatus.map((status) => statusCounts[status] || 0);

    return (
        <div className="bg-white shadow-md text-gray-700 rounded-lg p-4 overflow-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Ringkasan Status Pengaduan</h3>
            <table className="w-full text-sm text-center whitespace-nowrap border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        {orderedStatus.map((status) => (
                            <th key={status} className="border px-3 py-2">
                                {status}
                            </th>
                        ))}
                        <th className="border px-3 py-2">Total</th>
                        <th className="border px-3 py-2">Total (Tanpa Ditolak)</th>
                        <th className="border px-3 py-2">%TL</th>
                        <th className="border px-3 py-2">RTL</th>
                        <th className="border px-3 py-2">RHP</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="font-semibold">
                        {tableData.map((val, i) => (
                            <td key={i} className="border px-3 py-2">{val}</td>
                        ))}
                        <td className="border px-3 py-2">{totalSemua}</td>
                        <td className="border px-3 py-2">{totalTanpaDitolak}</td>
                        <td className="border px-3 py-2">{persenTL}</td>
                        <td className="border px-3 py-2">{rtl}</td>
                        <td className="border px-3 py-2">{rhp}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SummaryTable;
