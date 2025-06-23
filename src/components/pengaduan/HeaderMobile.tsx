"use client";

import React, { Fragment, useState } from "react";
import { Search, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaHeart } from "react-icons/fa";
import { MdFilterAltOff } from "react-icons/md";

interface HeaderMobileProps {
    search: string;
    setSearch: (val: string) => void;
    statusCounts: Record<string, number>;
    selectedStatus: string;
    setSelectedStatus: (val: string) => void;
    limit: number;
    setLimit: (val: number) => void;
    page: number;
    setPage: (val: number) => void;
    selectedSituasi: string;
    setSelectedSituasi: (val: string) => void;
    opdList: Array<{ opd: string; count: number }>;
    selectedOpd: string;
    setSelectedOpd: (val: string) => void;
    isPinnedOnly: boolean;
    setIsPinnedOnly: (val: boolean) => void;
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

const situasiOptions = [
    "Semua",
    "Darurat",
    "Permintaan Informasi",
    "Berpengawasan",
    "Tidak Berpengawasan"
];

// Helper Listbox untuk filter mobile
function ListBoxFilter({
    label,
    options,
    selected,
    setSelected,
    colorMap,
    statusCounts,
    opdCounts,
    className = "",
    zIndex = 1000,
}: {
    label: string;
    options: string[];
    selected: string;
    setSelected: (val: string) => void;
    colorMap?: Record<string, string>;
    statusCounts?: Record<string, number>;
    opdCounts?: Record<string, number>;
    className?: string;
    zIndex?: number;
}) {
    // Determine which counts to use
    const counts = statusCounts || opdCounts;
    return (
        <div className={`flex flex-col ${className}`} style={{ position: 'relative' }}>
            <span className="text-xs font-semibold text-gray-700 mb-1 ml-1">{label}</span>
            <Listbox value={selected} onChange={setSelected}>
                <div className="relative w-full" style={{ zIndex }}>
                    <Listbox.Button className="w-full border rounded-lg h-10 text-xs bg-white text-left shadow flex items-center justify-between text-gray-700 hover:ring-2 hover:ring-blue-200 px-3">
                        <div className="flex items-center gap-2">
                            {colorMap && selected !== "Semua" && (
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: colorMap[selected] }} />
                            )}
                            <span className="truncate">
                                {selected}
                                {counts && (
                                    <span className="ml-1 font-bold text-blue-700">
                                        ({selected === 'Semua'
                                            ? Object.values(counts).reduce((a, b) => a + b, 0)
                                            : counts[selected] || 0})
                                    </span>
                                )}
                            </span>
                        </div>
                        <span className="text-gray-500">▼</span>
                    </Listbox.Button>
                    <Listbox.Options
                        className="absolute mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: zIndex + 1 }}
                    >
                        {options.map((option) => (
                            <Listbox.Option key={option} value={option} as={Fragment}>
                                {({ active }) => (
                                    <li className={`px-3 py-2 flex items-center gap-2 text-xs cursor-pointer ${active ? 'bg-gray-100' : ''} text-gray-700`}>
                                        {colorMap && option !== "Semua" && (
                                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: colorMap[option] }} />
                                        )}
                                        <span className="truncate">
                                            {option}
                                            {counts && (
                                                <span className="ml-1 font-bold text-blue-700">
                                                    ({option === 'Semua'
                                                        ? Object.values(counts).reduce((a, b) => a + b, 0)
                                                        : counts[option] || 0})
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </div>
            </Listbox>
        </div>
    );
}

const HeaderMobile: React.FC<HeaderMobileProps> = ({
    search,
    setSearch,
    statusCounts,
    selectedStatus,
    setSelectedStatus,
    limit,
    setLimit,
    page,
    setPage,
    selectedSituasi,
    setSelectedSituasi,
    opdList,
    selectedOpd,
    setSelectedOpd,
    isPinnedOnly,
    setIsPinnedOnly,
}) => {
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Prepare OPD options with counts
    const opdOptions = [
        { opd: "Semua", count: opdList.reduce((total, item) => total + item.count, 0) },
        ...opdList
    ];

    return (
        <>
            {/* Main Header Container */}
            <div className="sticky top-0 z-[200] bg-white shadow-sm w-full">
                {/* Main Header */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isHeaderVisible ? 'opacity-100 max-h-96 pt-3 pb-3' : 'opacity-0 max-h-0 pt-0 pb-0'}`}>
                    <div className="w-full flex flex-col gap-2 px-3">
                        {/* Search Row */}
                        <div className="flex items-center gap-2 w-full">
                            {/* Search Box */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari No. ID, Nama, OPD, Tag, atau Lokasi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 text-sm text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-200 transition"
                                />
                            </div>

                            {/* Filter Button */}
                            <button
                                className="h-10 w-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-sm flex items-center justify-center transition"
                                onClick={() => setShowMobileFilters(true)}
                                title="Filter pengaduan"
                            >
                                <Filter className="w-4 h-4" />
                            </button>

                            {/* Love Button */}
                            <button
                                className={`h-10 w-10 rounded-full border text-sm flex items-center justify-center transition ${isPinnedOnly ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                                title="Tampilkan hanya yang di-love"
                            >
                                <FaHeart />
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Button - Positioned at the very top center */}
            <div className="sticky top-0 z-[210] bg-gray-100 flex justify-center">
                <button
                    onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                    className="h-5 w-20 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition text-lg flex items-center justify-center shadow-md"
                    title={isHeaderVisible ? "Sembunyikan Header" : "Tampilkan Header"}
                >
                    {isHeaderVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Mobile Filters Overlay */}
            {showMobileFilters && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-25 z-[250]"
                        onClick={() => setShowMobileFilters(false)}
                    />

                    {/* Filters Panel */}
                    <div className="fixed top-[120px] left-3 right-3 bg-white rounded-lg shadow-xl border z-[300] p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-900">Filter Pengaduan</h3>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Status Dropdown */}
                            <ListBoxFilter
                                label="Status"
                                options={statusTabs}
                                selected={selectedStatus}
                                setSelected={(val: string) => {
                                    setSelectedStatus(val);
                                    setPage(1);
                                }}
                                colorMap={statusColors}
                                statusCounts={statusCounts}
                                className="w-full"
                                zIndex={1000}
                            />

                            {/* Situasi Dropdown */}
                            <ListBoxFilter
                                label="Situasi"
                                options={situasiOptions}
                                selected={selectedSituasi}
                                setSelected={(val: string) => {
                                    setSelectedSituasi(val);
                                    setPage(1);
                                }}
                                className="w-full"
                                zIndex={900}
                            />

                            {/* OPD Dropdown */}
                            <ListBoxFilter
                                label="OPD"
                                options={opdOptions.map(item => item.opd)}
                                selected={selectedOpd}
                                setSelected={(val: string) => {
                                    setSelectedOpd(val);
                                    setPage(1);
                                }}
                                className="w-full"
                                zIndex={800}
                                opdCounts={opdOptions.reduce((acc, item) => {
                                    acc[item.opd] = item.count;
                                    return acc;
                                }, {} as Record<string, number>)}
                            />

                            {/* Limit Dropdown */}
                            <ListBoxFilter
                                label="Items per Page"
                                options={[100, 200, 300, 500].map(String)}
                                selected={String(limit)}
                                setSelected={(val: string) => {
                                    setLimit(Number(val));
                                    setPage(1);
                                }}
                                className="w-full"
                                zIndex={700}
                            />

                            {/* Reset Filter Button */}
                            <button
                                onClick={() => {
                                    setSelectedStatus("Semua");
                                    setSelectedSituasi("Semua");
                                    setSelectedOpd("Semua");
                                    setIsPinnedOnly(false);
                                    setPage(1);
                                }}
                                className="h-10 w-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition text-sm flex items-center justify-center flex-shrink-0"
                                title="Reset Filter"
                            >
                                <MdFilterAltOff className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default HeaderMobile;
