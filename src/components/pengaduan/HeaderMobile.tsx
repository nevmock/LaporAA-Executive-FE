"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaStar } from "react-icons/fa";
import { MdFilterAltOff } from "react-icons/md";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { getOPDShortName } from "../../utils/opdMapping";

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
    situasiList: Array<{ situasi: string; count: number }>;
    situasiTotal: number;
    opdList: Array<{ opd: string; count: number }>;
    opdTotal: number;
    selectedOpd: string;
    setSelectedOpd: (val: string) => void;
    isPinnedOnly: boolean;
    setIsPinnedOnly: (val: boolean) => void;
    isByMeOnly: boolean; // Optional prop for filtering by user
    setIsByMeOnly: (val: boolean) => void; // Optional setter for filtering by user
    totalReports: number; // Tambahan
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
    "Semua Status",
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditutup",
];

function ListBoxFilter({
    label,
    options,
    selected,
    setSelected,
    colorMap,
    statusCounts,
    opdCounts,
    situasiCounts,
    className = "",
    zIndex = 1000,
    isOpdFilter = false,
}: {
    label: string;
    options: string[];
    selected: string;
    setSelected: (val: string) => void;
    colorMap?: Record<string, string>;
    statusCounts?: Record<string, number>;
    opdCounts?: Record<string, number>;
    situasiCounts?: Record<string, number>;
    className?: string;
    zIndex?: number;
    isOpdFilter?: boolean;
}) {
    // Pakai counts yang tersedia
    const counts = statusCounts || opdCounts || situasiCounts;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // Dynamic dropdown position (biar dropdown tetap di bawah button)
    const updateDropdownPosition = useCallback(() => {
        if (buttonRef.current && typeof window !== 'undefined') {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed' as const,
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: zIndex + 1,
            });
        }
    }, [zIndex]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleScroll = () => updateDropdownPosition();
        const handleResize = () => updateDropdownPosition();
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, [updateDropdownPosition]);

    return (
        <div className={`relative w-full ${className || ""}`} style={{ zIndex }}>
            <span className="text-xs font-medium text-gray-700">{label}</span>
            <Listbox value={selected} onChange={setSelected}>
                {({ open }) => (
                    <div className="relative">
                        <Listbox.Button
                            ref={buttonRef}
                            className="w-full border rounded-lg h-10 text-sm bg-white text-left shadow-sm flex items-center justify-between text-gray-700 px-4 mt-1"
                            onClick={updateDropdownPosition}
                        >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                {colorMap && selected && !selected.startsWith("Semua") && (
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: colorMap[selected] }} />
                                )}
                                <span className="flex-1 break-words leading-tight">
                                    {isOpdFilter && !selected.startsWith("Semua") ? getOPDShortName(selected) : selected}
                                    {counts && (
                                        <span className="ml-1 font-bold text-blue-700">
                                            (
                                            {selected && selected.startsWith("Semua")
                                                ? Object.values(counts).reduce((a, b) => a + b, 0)
                                                : counts[selected] || 0} laporan
                                            )
                                        </span>
                                    )}
                                </span>
                            </div>
                            <span className="text-gray-400 text-xs ml-2 flex-shrink-0">▼</span>
                        </Listbox.Button>
                        {open && typeof window !== 'undefined' && (
                            <div
                                className="bg-white border rounded-lg shadow-xl max-h-60 overflow-auto absolute"
                                style={dropdownStyle}
                            >
                                <Listbox.Options static>
                                    {options.map((option) => (
                                        <Listbox.Option key={option} value={option}>
                                            {({ active, selected: isSelected }) => (
                                                <li className={`px-3 py-2 flex items-start gap-2 text-xs cursor-pointer ${active ? 'bg-gray-100' : ''} text-gray-700`}>
                                                    {colorMap && option && !option.startsWith("Semua") && (
                                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: colorMap[option] }} />
                                                    )}
                                                    <span className="flex-1 break-words leading-tight">
                                                        {isOpdFilter && !option.startsWith("Semua") ? (
                                                            <div>
                                                                <div className="font-medium">{getOPDShortName(option)}</div>
                                                                <div className="text-xs text-gray-500 truncate">{option}</div>
                                                            </div>
                                                        ) : (
                                                            option
                                                        )}
                                                        {counts && (
                                                            <span className="ml-1 font-bold text-blue-700">
                                                                (
                                                                {option && option.startsWith("Semua")
                                                                    ? Object.values(counts).reduce((a, b) => a + b, 0)
                                                                    : counts[option] || 0} laporan
                                                                )
                                                            </span>
                                                        )}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="text-blue-600 flex-shrink-0">✓</span>
                                                    )}
                                                </li>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </div>
                        )}
                    </div>
                )}
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
    page, // eslint-disable-line @typescript-eslint/no-unused-vars
    setPage,
    selectedSituasi,
    setSelectedSituasi,
    situasiList,
    // Note: situasiTotal removed as it was unused
    opdList,
    // Note: opdTotal removed as it was unused
    selectedOpd,
    setSelectedOpd,
    isPinnedOnly,
    setIsPinnedOnly,
    isByMeOnly,
    setIsByMeOnly,
    totalReports, // Tambahan
}) => {
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Prepare OPD options with counts
    const opdOptions = [
        { opd: "Semua OPD", count: totalReports }, // Ganti ke totalReports
        ...opdList
    ];

    // Prepare Situasi options with counts
    const situasiOptions = [
        { situasi: "Semua Situasi", count: totalReports }, // Ganti ke totalReports
        ...situasiList
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
                                className={`h-10 w-10 rounded-full border text-sm flex items-center justify-center transition ${isPinnedOnly ? 'border-yellow-600 bg-yellow-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                                title="Tampilkan hanya yang di-favoritkan"
                            >
                                <FaStar />
                            </button>

                            {/* By Me Only Button */}
                            <button
                                className={`h-10 w-10 rounded-full border text-sm flex items-center justify-center transition flex-shrink-0 ${isByMeOnly ? 'border-blue-600 bg-blue-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsByMeOnly(!isByMeOnly)}
                                title="Yang Di Kerjakan Saya"
                            >
                                <BsFillPersonLinesFill className="w-4 h-4" />
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Button - Positioned at the very top center */}
            <div className="sticky top-0 z-[210] bg-gray-100 flex justify-center">
                <button
                    onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                    className="h-5 w-20 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-all duration-300 text-lg flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105"
                    title={isHeaderVisible ? "Sembunyikan Header" : "Tampilkan Header"}
                >
                    <span className="transition-transform duration-300 ease-in-out">
                        {isHeaderVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
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
                                options={situasiOptions.map(opt => opt.situasi)}
                                selected={selectedSituasi}
                                setSelected={(val: string) => {
                                    setSelectedSituasi(val);
                                    setPage(1);
                                }}
                                situasiCounts={situasiOptions.reduce((acc, item) => {
                                    acc[item.situasi] = item.count;
                                    return acc;
                                }, {} as Record<string, number>)}
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
                                opdCounts={opdOptions.reduce((acc, item) => {
                                    acc[item.opd] = item.count;
                                    return acc;
                                }, {} as Record<string, number>)}
                                className="w-full"
                                zIndex={800}
                                isOpdFilter={true}
                            />
                            {/* Limit Dropdown */}
                            <ListBoxFilter
                                label="Items per Page"
                                options={[100, 200, 300, 500].map(num => `${num} Laporan`)}
                                selected={`${limit} Laporan`}
                                setSelected={(val: string) => {
                                    const numValue = parseInt(val.split(' ')[0]);
                                    setLimit(numValue);
                                    setPage(1);
                                }}
                                className="w-full"
                                zIndex={700}
                            />
                            {/* Reset Filter Button */}
                            <button
                                onClick={() => {
                                    setSelectedStatus("Semua Status");
                                    setSelectedSituasi("Semua Situasi");
                                    setSelectedOpd("Semua OPD");
                                    setIsPinnedOnly(false);
                                    setIsByMeOnly(false);
                                    setSearch(""); // Reset search juga
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
