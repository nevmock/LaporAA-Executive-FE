import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";

const opdList = [
    "Bagian Administrasi Pemerintahan",
    "Bagian Administrasi Kesejahteraan Rakyat",
    "Bagian Hukum",
    "Bagian Administrasi Perekonomian",
    "Bagian Administrasi Pembangunan",
    "Bagian Administrasi Kerjasama",
    "Bagian Layanan Pengadaan Barang dan Jasa",
    "Bagian Organisasi",
    "Bagian Perlengkapan",
    "Bagian Umum",
    "Protokol dan Komunikasi Pimpinan",
    "Sekretariat DPRD",
    "Sekretariat KORPRI",
    "Inspektorat",
    "RSUD",
    "Dinas Pemberdayaan Perempuan dan Perlindungan Anak",
    "Dinas Kebudayaan, Pemuda dan Olahraga",
    "Dinas Ketahanan Pangan",
    "Dinas Pemadam Kebakaran",
    "Dinas Tenaga Kerja",
    "Dinas Arsip dan Perpustakaan",
    "Dinas Komunikasi, Informatika Persandian dan Statistik",
    "Dinas Koperasi dan UMKM",
    "Dinas Perikanan dan Kelautan",
    "Dinas Pertanian",
    "Dinas Perindustrian",
    "Dinas Sosial",
    "Dinas Penanaman Modal dan PTSP",
    "Dinas Pendidikan",
    "Dinas Kesehatan",
    "Dinas Perumahan Rakyat dan Kawasan Permukiman",
    "Dinas Lingkungan Hidup",
    "Dinas Kependudukan dan Pencatatan Sipil",
    "Dinas Pariwisata",
    "Dinas Pekerjaan Umum dan Penataan Ruang",
    "Dinas Pengendalian Penduduk dan Keluarga Berencana",
    "Dinas Pemberdayaan Masyarakat dan Desa",
    "Dinas Perhubungan",
    "Bappeda",
    "BKPSDM",
    "BPKD",
    "Bapenda",
    "Balitbangda",
    "BPBD",
    "Satpol PP",
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
