"use client";
import React from "react";

interface SummaryTableProps {
    statusCounts: Record<string, number>;
}

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

    const persenTL = statusCounts["Selesai Pengaduan"]
        ? ((statusCounts["Selesai Pengaduan"] / totalTanpaDitolak) * 100).toFixed(1)
        : "0";

    const rtl = statusCounts["Selesai Pengaduan"]
        ? (statusCounts["Selesai Pengaduan"] / totalTanpaDitolak).toFixed(2)
        : "0";

    // const rhp =
    //     statusCounts["Selesai Pengaduan"] && statusCounts["Proses OPD Terkait"]
    //         ? (statusCounts["Selesai Pengaduan"] / statusCounts["Proses OPD Terkait"]).toFixed(2)
    //         : "0";

    return (
        <div className="bg-white shadow-md text-gray-700 rounded-lg p-4 overflow-y-auto max-h-[500px]">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Ringkasan Status Pengaduan</h3>

            {/* Desktop layout: table */}
            <div className="hidden md:block overflow-auto">
                <table className="w-full text-sm text-center whitespace-nowrap border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            {orderedStatus.map((status) => (
                                <th key={status} className="border px-3 py-2">{status}</th>
                            ))}
                            <th className="border px-3 py-2">Total</th>
                            <th className="border px-3 py-2">Total (Tanpa Ditolak)</th>
                            
                            {/* <th className="border px-3 py-2">RHP</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-semibold">
                            {orderedStatus.map((status, i) => (
                                <td key={i} className="border px-3 py-2">{statusCounts[status] || 0}</td>
                            ))}
                            <td className="border px-3 py-2">{totalSemua}</td>
                            <td className="border px-3 py-2">{totalTanpaDitolak}</td>
                            
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
                    <span>{totalTanpaDitolak}</span>
                </div>
                
            </div>
        </div>
    );
};

export default SummaryTable;