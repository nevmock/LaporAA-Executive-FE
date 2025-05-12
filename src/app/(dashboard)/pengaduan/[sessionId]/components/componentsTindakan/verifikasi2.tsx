"use client";
import { TindakanData } from "../../../../../../lib/types";

export default function Verifikasi2({
    data,
    onChange
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
}) {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    // const handleChangeSituasi = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //     const { name, value } = e.target;
    //     onChange((prev) => ({ ...prev, [name]: value }));
    // };

    return (
        <div className="grid grid-cols-1 gap-4">

            {/* Form Terdisposisi ke */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-700">
                        Terdisposisi ke
                    </label>
                </div>
                <div className="col-span-3">
                    <input
                        name="disposisi"
                        value={data.disposisi || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Ketik Informasi Terdisposisi kemana dari SP4N Lapor"
                    />
                </div>
            </div>

            {/* Form OPD Terkait */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-700">
                        OPD Terkait
                    </label>
                </div>
                <div className="col-span-3">
                    <input
                        name="opd"
                        value={data.opd || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Ketik Nama OPD yang berkaitan dengan informasi disposisi dari SP4N Lapor"
                    />
                </div>
            </div>

            {/* Form Tracking ID */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-700">
                        Tracking ID dari SP4N Lapor
                    </label>
                </div>
                <div className="col-span-3">
                    <input
                        name="trackingId"
                        type="number"
                        value={data.trackingId || ""}
                        onChange={handleChange}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Ketik Tracking ID dari SP4N Lapor"
                    />
                </div>
            </div>

            {/* Form Kesimpulan */}
            <div className="grid grid-cols-4 items-start gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-700">
                        Tindak Lanjut dari SP4N Lapor
                    </label>
                </div>
                <div className="col-span-3">
                    <textarea
                        name="kesimpulan"
                        value={data.kesimpulan || ""}
                        onChange={handleChange}
                        rows={4}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-yellow-700 focus:ring-yellow-400 focus:border-yellow-500"
                        placeholder="Tulis kesimpulan tindakan dari SP4N Lapor di sini..."
                    />
                </div>
            </div>
        </div>
    );
}
