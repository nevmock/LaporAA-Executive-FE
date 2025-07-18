import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { X } from "lucide-react";

const opdList = [
    "Dinas Pendidikan Kabupaten Bekasi",
    "Dinas Kesehatan Kabupaten Bekasi",
    "Dinas Komunikasi, Informatika, Persandian dan Statistik",
    "Bagian Hukum Kabupaten Bekasi",
    "Bagian Administrasi Perekonomian Kabupaten Bekasi",
    "Bagian Administrasi Pembangunan Kabupaten Bekasi",
    "Bagian Administrasi Kerjasama Kabupaten Bekasi",
    "Bagian Layanan Pengadaan Barang dan Jasa Kabupaten Bekasi",
    "Bagian Organisasi Kabupaten Bekasi",
    "Bagian Perencanaan Keuangan Kabupaten Bekasi",
    "Bagian Umum Kabupaten Bekasi",
    "Sekretariat DPRD Kabupaten Bekasi",
    "Inspektorat Kabupaten Bekasi",
    "Dinas Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Bekasi",
    "Dinas Kebudayaan, Pemuda, dan Olahraga Kabupaten Bekasi",
    "Dinas Ketahanan Pangan Kabupaten Bekasi",
    "Dinas Pemadam Kebakaran Kabupaten Bekasi",
    "Dinas Perdagangan Kabupaten Bekasi",
    "Dinas Ketenagakerjaan Kabupaten Bekasi",
    "Dinas Arsip dan Perpustakaan Kabupaten Bekasi",
    "Dinas Koperasi dan UMKM Kabupaten Bekasi",
    "Dinas Perikanan Kabupaten Bekasi",
    "Dinas Pertanian Kabupaten Bekasi",
    "Dinas Perindustrian Kabupaten Bekasi",
    "Dinas Sosial Kabupaten Bekasi",
    "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Kabupaten Bekasi",
    "Dinas Pengendalian Penduduk dan Keluarga Berencana Kabupaten Bekasi",
    "Dinas Pariwisata Kabupaten Bekasi",
    "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Bekasi",
    "Dinas Perumahan Rakyat, Kawasan Permukiman dan Pertanahan Kabupaten Bekasi",
    "Dinas Pemberdayaan Masyarakat dan Desa Kabupaten Bekasi",
    "Dinas Lingkungan Hidup Kabupaten Bekasi",
    "Badan Perencanaan Pembangunan Daerah Kabupaten Bekasi",
    "Satuan Polisi Pamong Praja (SATPOL-PP) Kabupaten Bekasi",
    "Dinas Perhubungan Kabupaten Bekasi",
    "Rumah Sakit Umum Daerah Kabupaten Bekasi",
    "Bagian Tata Pemerintahan Kabupaten Bekasi",
    "Bagian Administrasi Kesejahteraan Rakyat Kabupaten Bekasi",
    "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
    "Badan Penanggulangan Bencana Daerah Kabupaten Bekasi",
    "Badan Pengelola Keuangan Daerah Kabupaten Bekasi",
    "Badan Pendapatan Daerah Kabupaten Bekasi",
    "Badan Kesatuan Bangsa dan Politik Kabupaten Bekasi",
    "Badan Penelitian dan Pengembangan Daerah Kabupaten Bekasi",
    "Bagian Protokol dan Komunikasi Pimpinan Kabupaten Bekasi",
    "Dinas Cipta Karya dan Tata Ruang",
    "Dinas Sumber Daya Air, Bina Marga dan Bina Konstruksi",
    "Perumda Tirta Bhagasasi",
    "RSUD Cabangbungin Kabupaten Bekasi",
    "Mall Pelayanan Publik",
    "Kelurahan Kertasari",
    "Kelurahan Setia Asih",
    "Kelurahan Bahagia",
    "Kelurahan Jatimulya",
    "Kelurahan Wanasari",
    "Kelurahan Telaga Asih",
    "Kelurahan Kebalen",
    "Kecamatan Babelan",
    "Kecamatan Bojongmangu",
    "Kecamatan Cabangbungin",
    "Kecamatan Cibarusah",
    "Kecamatan Cibitung",
    "Kecamatan Cikarang Barat",
    "Kecamatan Cikarang Pusat",
    "Kecamatan Cikarang Selatan",
    "Kecamatan Cikarang Timur",
    "Kecamatan Cikarang Utara",
    "Kecamatan Karangbahagia",
    "Kecamatan Kedungwaringin",
    "Kecamatan Muara Gembong",
    "Kecamatan Pebayuran",
    "Kecamatan Serang Baru",
    "Kecamatan Setu",
    "Kecamatan Sukakarya",
    "Kecamatan Sukatani",
    "Kecamatan Sukawangi",
    "Kecamatan Tambelang",
    "Kecamatan Tambun Selatan",
    "Kecamatan Tambun Utara",
    "Kecamatan Tarumajaya"
];



export default function OPDSelect({ value, onChange }: { value: string[] | string; onChange: (val: string[]) => void }) {
    const [query, setQuery] = useState("");
    const selectedOPDs = Array.isArray(value) ? value : value ? [value] : [];

    const filtered = query === ""
        ? opdList.filter(opd => !selectedOPDs.includes(opd))
        : opdList.filter((opd) => opd.toLowerCase().includes(query.toLowerCase()) && !selectedOPDs.includes(opd));

    const handleSelect = (opd: string) => {
        if (!selectedOPDs.includes(opd)) {
            onChange([...selectedOPDs, opd]);
            setQuery("");
        }
    };

    const handleRemove = (opd: string) => {
        onChange(selectedOPDs.filter(item => item !== opd));
    };

    return (
        <div>
            {/* Selected OPDs */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedOPDs.map((opd) => (
                    <div key={opd} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center text-sm">
                        <span>{opd}</span>
                        <button
                            onClick={() => handleRemove(opd)}
                            className="ml-2 text-yellow-700 hover:text-yellow-900"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <Combobox value="" onChange={handleSelect}>
                <div className="relative">
                    <Combobox.Input
                        className="w-full border border-yellow-300 bg-yellow-50 text-grey-700 p-2 rounded-md focus:ring-yellow-400 focus:border-yellow-500"
                        onChange={(e) => setQuery(e.target.value)}
                        displayValue={(opd: string) => opd}
                        placeholder="Ketik dan Cari OPD terkait"
                    />
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                    >
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-2 text-gray-500">Tidak ditemukan</div>
                            ) : (
                                filtered.map((opd) => (
                                    <Combobox.Option
                                        key={opd}
                                        value={opd}
                                        className={({ active }) =>
                                            `cursor-pointer select-none relative px-4 py-2 ${active ? "bg-yellow-100 text-yellow-900" : "text-gray-900"}`
                                        }
                                    >
                                        {opd}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}
