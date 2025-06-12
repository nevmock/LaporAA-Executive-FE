import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";

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
    "Kecamatan Babelan",
    "Kecamatan Setu",
    "Kecamatan Cikarang Utara",
    "Kecamatan Karangbahagia",
    "Kecamatan Tambun Utara",
    "Kecamatan Tambelang",
    "Kecamatan Bojongmangu",
    "Kecamatan Cabangbungin",
    "Kecamatan Cibarusah",
    "Kecamatan Cibitung",
    "Kecamatan Cikarang Barat",
    "Kecamatan Cikarang Pusat",
    "Kecamatan Cikarang Selatan",
    "Kecamatan Cikarang Timur",
    "Kecamatan Kedungwaringin",
    "Kecamatan Muara Gembong",
    "Kecamatan Pebayuran",
    "Kecamatan Serang Baru",
    "Kecamatan Sukakarya",
    "Kecamatan Sukatani",
    "Kecamatan Sukawangi",
    "Kecamatan Tambun selatan",
    "Kecamatan Tarumajaya",
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
    "Kelurahan Kertasari",
    "Kelurahan Setia Asih",
    "Kelurahan Bahagia",
    "Kelurahan Jatimulya",
    "Kelurahan Wanasari",
    "Kelurahan Telaga Asih",
    "Kelurahan Kebalen",
    "Mall Pelayanan Publik"
];


export default function OPDSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [query, setQuery] = useState("");

    const filtered = query === ""
        ? opdList
        : opdList.filter((opd) => opd.toLowerCase().includes(query.toLowerCase()));

    return (
        <Combobox value={value} onChange={onChange}>
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
    );
}
