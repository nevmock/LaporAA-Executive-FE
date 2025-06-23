"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaHeart } from "react-icons/fa";
import { createPortal } from "react-dom";
import { MdFilterAltOff } from "react-icons/md";

interface HeaderDesktopProps {
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

const HeaderDesktop: React.FC<HeaderDesktopProps> = ({
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
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Prepare OPD options with counts
    const opdOptions = [
        { opd: "Semua", count: opdList.reduce((total, item) => total + item.count, 0) },
        ...opdList
    ];

    return (
        <>
            {/* Main Header Container */}
            <div className="sticky top-0 z-[200] bg-white border-b shadow-sm w-full">
                {/* Main Header */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isHeaderVisible ? 'opacity-100 max-h-96 pt-4 pb-4' : 'opacity-0 max-h-0 pt-0 pb-0'}`}>
                    <div className="w-full px-4 lg:px-6">
                        {/* Single Row: Search and Filters */}
                        <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                            {/* Search Box */}
                            <div className="flex-1 min-w-[200px] max-w-sm relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 pl-10 pr-3 rounded-full border border-gray-300 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-200 transition bg-white"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="min-w-[300px] max-w-[350px] relative z-[9999]">
                                <ListBoxFilter
                                    options={statusTabs}
                                    selected={selectedStatus}
                                    setSelected={(val) => {
                                        setSelectedStatus(val);
                                        setPage(1);
                                    }}
                                    colorMap={statusColors}
                                    statusCounts={statusCounts}
                                    zIndex={9999}
                                />
                            </div>

                            {/* Situasi Filter */}
                            <div className="min-w-[200px] max-w-[250px] relative z-[9998]">
                                <ListBoxFilter
                                    options={situasiOptions}
                                    selected={selectedSituasi}
                                    setSelected={(val) => {
                                        setSelectedSituasi(val);
                                        setPage(1);
                                    }}
                                    zIndex={9998}
                                />
                            </div>

                            {/* OPD Filter */}
                            <div className="min-w-[250px] max-w-[300px] relative z-[9997]">
                                <ListBoxFilter
                                    options={opdOptions.map(item => item.opd)}
                                    selected={selectedOpd}
                                    setSelected={(val) => {
                                        setSelectedOpd(val);
                                        setPage(1);
                                    }}
                                    zIndex={9997}
                                    opdCounts={opdOptions.reduce((acc, item) => {
                                        acc[item.opd] = item.count;
                                        return acc;
                                    }, {} as Record<string, number>)}
                                />
                            </div>

                            {/* Items per Page Filter */}
                            <div className="min-w-[100px] max-w-[120px] relative z-[9996]">
                                <ListBoxFilter
                                    options={[100, 200, 300, 500].map(String)}
                                    selected={String(limit)}
                                    setSelected={(val) => {
                                        setLimit(Number(val));
                                        setPage(1);
                                    }}
                                    zIndex={9996}
                                />
                            </div>

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

                            {/* Love Button */}
                            <button
                                className={`h-10 w-10 rounded-full border text-sm flex items-center justify-center transition flex-shrink-0 ${isPinnedOnly ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                                title="Tampilkan hanya yang di-love"
                            >
                                <FaHeart className="w-4 h-4" />
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
        </>
    );
};

// Helper Listbox for desktop filters
function ListBoxFilter({
    options,
    selected,
    setSelected,
    colorMap,
    statusCounts,
    opdCounts,
    zIndex = 1000,
}: {
    options: string[];
    selected: string;
    setSelected: (val: string) => void;
    colorMap?: Record<string, string>;
    statusCounts?: Record<string, number>;
    opdCounts?: Record<string, number>;
    zIndex?: number;
}) {
    const counts = statusCounts || opdCounts;
    const [isClient, setIsClient] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        setIsClient(true);
    }, []);

    const updateDropdownPosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 99999,
            });
        }
    };

    useEffect(() => {
        const handleScroll = updateDropdownPosition;
        const handleResize = updateDropdownPosition;
        
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="relative w-full" style={{ zIndex }}>
            <Listbox value={selected} onChange={setSelected}>
                {({ open }) => {
                    if (open && isClient) {
                        // Update position when dropdown opens
                        setTimeout(updateDropdownPosition, 0);
                    }
                    
                    return (
                        <>
                            <Listbox.Button 
                                ref={buttonRef}
                                className="w-full border rounded-full h-10 text-sm bg-white text-left shadow-sm flex items-center justify-between text-gray-700 hover:ring-2 hover:ring-blue-200 px-4 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {colorMap && selected !== "Semua" && (
                                        <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: colorMap[selected] }} />
                                    )}
                                    <span className="truncate">
                                        {selected}
                                        {counts && (
                                            <span className="ml-1 font-semibold text-blue-600 text-xs">
                                                ({selected === 'Semua'
                                                    ? Object.values(counts).reduce((a, b) => a + b, 0)
                                                    : counts[selected] || 0})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <span className="text-gray-400 text-xs ml-2 flex-shrink-0">▼</span>
                            </Listbox.Button>
                            
                            {open && isClient && createPortal(
                                <Listbox.Options
                                    className="bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
                                    style={dropdownStyle}
                                    static
                                >
                                    {options.map((option) => (
                                        <Listbox.Option key={option} value={option}>
                                            {({ active, selected: isSelected }) => (
                                                <li className={`px-4 py-2.5 flex items-center gap-2 text-sm cursor-pointer transition-colors ${active ? 'bg-blue-50' : ''
                                                    } ${isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                                                    }`}>
                                                    {colorMap && option !== "Semua" && (
                                                        <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: colorMap[option] }} />
                                                    )}
                                                    <span className="truncate flex-1">
                                                        {option}
                                                        {counts && (
                                                            <span className="ml-1 font-semibold text-blue-600 text-xs">
                                                                ({option === 'Semua'
                                                                    ? Object.values(counts).reduce((a, b) => a + b, 0)
                                                                    : counts[option] || 0})
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
                                </Listbox.Options>,
                                document.body
                            )}
                        </>
                    );
                }}
            </Listbox>
        </div>
    );
}

export default HeaderDesktop;
