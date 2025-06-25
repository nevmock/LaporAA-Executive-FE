"use client";
import { TindakanData } from "../../../../lib/types";
import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

export default function Verifikasi({
    data,
    onChange,
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
}) {
    const handleChangeSituasi = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    const isClosed = data?.status === "Ditutup";

    return (
        <div className="space-y-4">
            {isClosed ? (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <div className="flex-shrink-0 mr-3">
                        <FiAlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-red-800">Laporan Ditutup</h3>
                        <div className="mt-1 text-sm text-red-700">
                            <p>Laporan ini telah ditutup dan tidak dapat diproses lebih lanjut.</p>
                            {data.keterangan && (
                                <div className="mt-2">
                                    <p className="font-medium">Alasan penutupan:</p>
                                    <p className="italic mt-1">{data.keterangan}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                    <div className="flex-shrink-0 mr-3">
                        <FiCheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-green-800">Laporan Terverifikasi</h3>
                        <div className="mt-1 text-sm text-green-700">
                            <p>Laporan ini telah diverifikasi dan sedang dalam proses penanganan.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
