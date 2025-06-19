"use client";
import { TindakanData } from "../../../../lib/types";

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

    return (
        <div className="space-y-4">
            {/* Informasi SP4N Lapor */}
            {/* <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3 text-sm text-gray-700">
                <p className="mb-2">
                    Silakan input data-data di atas ke sistem <strong>SP4N Lapor</strong> sebagai bentuk tindak lanjut resmi.
                </p>
                <a
                    href="https://www.lapor.go.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Buka SP4N Lapor
                </a>
            </div> */}
        </div>
    );
}
