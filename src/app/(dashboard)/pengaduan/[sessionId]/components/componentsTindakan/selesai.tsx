"use client";

import { useEffect, useState } from "react";
import axios from "../../../../../../utils/axiosInstance";
import { TindakanData } from "../../../../../../lib/types";
import { FaStar } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function Selesai({
    data
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

    return (
        <div className="space-y-4 text-sm text-gray-700">

            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
                ✅ Tindakan telah selesai. Mohon menunggu tanggapan dari pelapor.
            </div>

            {/* Dua kolom: Laporan dan Tindakan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom 1: Rangkuman Laporan */}
                <div className="border rounded-md p-4 bg-gray-50 space-y-2">
                    <h4 className="font-semibold text-gray-800">📄 Rangkuman Laporan</h4>
                    <div>
                        <span className="font-semibold font-medium">Keluhan:</span><br />
                        <span>{reportDetail?.message || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold font-medium">Lokasi:</span><br />
                        <span>
                            {reportDetail?.location
                                ? `${reportDetail.location.desa}, ${reportDetail.location.kecamatan}, ${reportDetail.location.kabupaten}`
                                : "-"}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold font-medium">Foto Pendukung:</span><br />
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
                        <span className="font-semibold font-medium">Status:</span><br />
                        <span>{data.status || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold font-medium">Situasi:</span><br />
                        <span>{data.situasi || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold font-medium">OPD:</span><br />
                        <span>{data.opd || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold font-medium">Tindakan:</span><br />
                        <ul className="list-disc list-inside">
                            {Array.isArray(data.kesimpulan) && data.kesimpulan.length > 0 ? (
                                data.kesimpulan.map((item: any, idx: number) => (
                                    <li key={idx}>
                                        {dayjs(item.timestamp).tz("Asia/Jakarta").format("DD MMMM YYYY HH:mm") + " WIB"}
                                        <br />
                                        {item.text}
                                    </li>
                                ))
                            ) : (
                                <li>- Tidak ada kesimpulan -</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <span className="font-semibold font-medium">Tanggal Tindakan:</span><br />
                        <span>
                            {data.updatedAt
                                ? dayjs(data.updatedAt)
                                    .tz("Asia/Jakarta")
                                    .format("DD MMMM YYYY HH:mm") + " WIB"
                                : "-"}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}
