"use client";

import React, { Fragment } from "react";
import { Search } from "lucide-react";
import { Listbox } from "@headlessui/react";

interface Props {
    search: string;
    setSearch: (val: string) => void;
    statusCounts: Record<string, number>;
    selectedStatus: string;
    setSelectedStatus: (val: string) => void;
    isMobile: boolean;
    limit: number;
    setLimit: (val: number) => void;
    page: number;
    setPage: (val: number) => void;
}

const statusColors: Record<string, string> = {
    "Perlu Verifikasi": "#FF3131",
    "Verifikasi Situasi": "#5E17EB",
    "Verifikasi Kelengkapan Berkas": "#FF9F12",
    "Proses OPD Terkait": "rgb(250 204 21)",
    "Selesai Penanganan": "rgb(96 165 250)",
    "Selesai Pengaduan": "rgb(74 222 128)",
    "Ditutup": "black",
};

const statusTabs = [
    "Semua",
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditutup",
];

const HeaderSection: React.FC<Props> = ({
    search,
    setSearch,
    statusCounts,
    selectedStatus,
    setSelectedStatus,
    isMobile,
    limit,
    setLimit,
    page,
    setPage,
}) => {
    return (
        <div className="z-[500] bg-white pt-3">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 px-3">Daftar Pengaduan</h2>

            {/* Desktop Controls */}
            {!isMobile && (
                <>
                    <div className="flex items-end justify-between gap-4 px-3 mb-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari No. ID, Nama, OPD, atau Lokasi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 rounded-md border text-sm text-gray-700 shadow-md focus:outline-none hover:ring-2 hover:ring-blue-200"
                            />
                        </div>

                        {/* Limit View */}
                        <div className="flex items-center z-[500] gap-2">
                            <p className="text-sm font-semibold z-[500] text-gray-700 whitespace-nowrap">View</p>
                            <Listbox value={limit} onChange={(val) => { setLimit(val); setPage(1); }}>
                                <div className="relative w-[200px] z-[500]">
                                    <Listbox.Button className="w-full h-10 border rounded-md px-3 py-2 text-sm bg-white text-left shadow-md flex items-center justify-between text-gray-700 focus:outline-none hover:ring-2 hover:ring-blue-200">
                                        <span>Tampilkan {limit}</span>
                                        <span className="text-gray-500">▼</span>
                                    </Listbox.Button>
                                    <Listbox.Options className="absolute mt-1 w-full bg-white border rounded shadow-lg z-[500] max-h-60 overflow-auto">
                                        {[100, 200, 300, 500].map((val) => (
                                            <Listbox.Option key={val} value={val} as={Fragment}>
                                                {({ active }) => (
                                                    <li className={`px-3 py-2 text-xs cursor-pointer ${active ? "bg-gray-100" : ""} text-gray-700`}>
                                                        Tampilkan {val}
                                                    </li>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            </Listbox>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="px-3 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Filter Status Laporan</p>
                        <div className="flex flex-wrap gap-2">
                            {statusTabs.map((status) => {
                                const count = status === "Semua"
                                    ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                                    : statusCounts[status] || 0;
                                const color = statusColors[status];

                                return (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setSelectedStatus(status);
                                            setPage(1);
                                        }}
                                        className={`flex items-center gap-2 rounded-full px-4 py-1 text-[12px] font-semibold border ${selectedStatus === status
                                            ? 'border-pink-600 bg-pink-600 text-white'
                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {status !== 'Semua' && (
                                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
                                        )}
                                        <span>{status} ({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Controls */}
            {isMobile && (
                <div className="flex flex-col gap-3 px-3 mb-4 z-[400]">
                    {/* Search */}
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari No. ID, Nama, OPD, atau Lokasi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border text-sm text-gray-700 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-200"
                        />
                    </div>

                    {/* Filter Status */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1 ml-1">Filter Status Laporan</p>
                        <Listbox value={selectedStatus} onChange={(val) => { setSelectedStatus(val); setPage(1); }}>
                            <div className="relative w-full z-[500]">
                                <Listbox.Button className="w-full border rounded px-3 py-2 text-xs bg-white text-left shadow-sm flex items-center justify-between text-gray-700 hover:ring-2 hover:ring-blue-200">
                                    <div className="flex items-center gap-2">
                                        {selectedStatus !== 'Semua' && (
                                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: statusColors[selectedStatus] }} />
                                        )}
                                        <span className="truncate">
                                            {selectedStatus} ({selectedStatus === 'Semua'
                                                ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                                                : statusCounts[selectedStatus] || 0})
                                        </span>
                                    </div>
                                    <span className="text-gray-500">▼</span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute mt-1 w-full bg-white border rounded shadow-lg z-[999] max-h-60 overflow-auto">
                                    {statusTabs.map((status) => {
                                        const count = status === "Semua"
                                            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                                            : statusCounts[status] || 0;
                                        const color = statusColors[status];

                                        return (
                                            <Listbox.Option key={status} value={status} as={Fragment}>
                                                {({ active }) => (
                                                    <li className={`px-3 py-2 flex items-center gap-2 text-xs cursor-pointer ${active ? 'bg-gray-100' : ''} text-gray-700`}>
                                                        {status !== 'Semua' && (
                                                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                                                        )}
                                                        <span>{status} ({count})</span>
                                                    </li>
                                                )}
                                            </Listbox.Option>
                                        );
                                    })}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                    </div>

                    {/* Limit View */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1 ml-1">View</p>
                        <Listbox value={limit} onChange={(val) => { setLimit(val); setPage(1); }}>
                            <div className="relative w-full z-[400]">
                                <Listbox.Button className="w-full h-10 border rounded-md px-3 py-2 text-xs bg-white text-left shadow-md flex items-center justify-between text-gray-700 focus:outline-none hover:ring-2 hover:ring-blue-200">
                                    <span>Tampilkan {limit}</span>
                                    <span className="text-gray-500">▼</span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute mt-1 w-full bg-white border rounded shadow-lg z-[999] max-h-60 overflow-auto">
                                    {[100, 200, 300, 500].map((val) => (
                                        <Listbox.Option key={val} value={val} as="div">
                                            {({ active }) => (
                                                <div className={`px-3 py-2 flex items-center gap-2 text-xs cursor-pointer ${active ? 'bg-gray-100' : ''} text-gray-700`}>
                                                    Tampilkan {val}
                                                </div>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeaderSection;