"use client";

import { useEffect, useState } from "react";
import axios from "../../../../../../utils/axiosInstance";
import { TindakanData } from "../../../../../../lib/types";
import { FaStar } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function Selesai2({
    data,
}: {
    data: Partial<TindakanData> & { sessionId: string };
}) {
    const [reportDetail, setReportDetail] = useState<any | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            if (data.sessionId) {
                try {
                    const res = await axios.get(`${API_URL}/reports/${data.sessionId}`);
                    setReportDetail(res.data);
                } catch (err) {
                    console.error("Gagal mengambil detail report:", err);
                }
            }
        };

        fetchReport();
    }, [data.sessionId]);

    // Fungsi bantu untuk render bintang
    const renderStars = (rating?: number | null) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    className={`w-5 h-5 ${rating && i <= rating ? "text-yellow-500" : "text-gray-300"}`}
                />
            );
        }
        return stars;
    };

    return (
        <div className="space-y-6 text-sm text-gray-700">
            {/* Rating */}
            <div className="grid grid-cols-4 gap-2 items-center">
                <label className="col-span-1 font-medium">Rating Pelapor</label>
                <div className="col-span-3 flex items-center space-x-1">
                    {data.rating !== undefined && data.rating !== null
                        ? renderStars(data.rating)
                        : <span>- Belum diberikan -</span>}
                </div>
            </div>

            {/* Pesan selesai */}
            <div className="bg-green-50 border border-green-300 text-green-800 p-4 rounded-md">
                Pelapor telah memberikan tanggapan dan menilai proses penanganan ini. Laporan dinyatakan selesai.
            </div>

            {/* Dua kolom: Laporan dan Tindakan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom 1: Rangkuman Laporan */}
                <div className="border rounded-md p-4 bg-gray-50 space-y-2">
                    <h4 className="font-semibold text-gray-800">📄 Rangkuman Laporan</h4>
                    <div>
                        <span className="font-medium">Keluhan:</span><br />
                        <span>{reportDetail?.message || "-"}</span>
                    </div>
                    <div>
                        <span className="font-medium">Lokasi:</span><br />
                        <span>
                            {reportDetail?.location
                                ? `${reportDetail.location.desa}, ${reportDetail.location.kecamatan}, ${reportDetail.location.kabupaten}`
                                : "-"}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">Foto Pendukung:</span><br />
                        {reportDetail?.photos?.length > 0 ? (
                            <div className="flex gap-2 mt-1">
                                {reportDetail.photos.map((url: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={`${API_URL}${url}`}
                                        alt={`Foto ${idx + 1}`}
                                        className="w-24 h-24 object-cover rounded border"
                                    />
                                ))}
                            </div>
                        ) : (
                            <span>- Tidak ada foto -</span>
                        )}
                    </div>
                </div>

                {/* Kolom 2: Rangkuman Tindakan */}
                <div className="border rounded-md p-4 bg-gray-50 space-y-2">
                    <h4 className="font-semibold text-gray-800">🛠️ Rangkuman Tindakan</h4>
                    <div>
                        <span className="font-medium">Status:</span><br />
                        <span>{data.status || "-"}</span>
                    </div>
                    <div>
                        <span className="font-medium">Situasi:</span><br />
                        <span>{data.situasi || "-"}</span>
                    </div>
                    <div>
                        <span className="font-medium">OPD:</span><br />
                        <span>{data.opd || "-"}</span>
                    </div>
                    <div>
                        <span className="font-medium">Tindakan:</span><br />
                        <ul className="list-disc list-inside">
                            {Array.isArray(data.kesimpulan) && data.kesimpulan.length > 0 ? (
                                data.kesimpulan.map((item: any, idx: number) => (
                                    <li key={idx}>{item.text}</li>  // ✅ hanya tampilkan teks-nya
                                ))
                            ) : (
                                <li>- Tidak ada kesimpulan -</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <span className="font-medium">Tanggal Tindakan:</span><br />
                        <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleString("id-ID") : "-"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}