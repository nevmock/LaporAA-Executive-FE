const Legend: React.FC = () => {
    return (
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-50 rounded shadow p-3 text-[8px] z-[1000] text-gray-800">
            <ul className="space-y-1">
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-[#FF3131]" /> Perlu Verifikasi
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-[#5E17EB]" /> Verifikasi Situasi
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-[#FF9F12]" /> Verifikasi Kelengkapan Berkas
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-yellow-400" /> Proses OPD Terkait
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-blue-400" /> Selesai Penanganan
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-green-400" /> Selesai Pengaduan
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-3 h-3 inline-block rounded-full bg-black" /> Ditutup
                </li>
            </ul>
        </div>
    )
}

export default Legend;