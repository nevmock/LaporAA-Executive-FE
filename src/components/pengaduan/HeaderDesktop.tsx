"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaStar } from "react-icons/fa";
import { createPortal } from "react-dom";
import { MdFilterAltOff } from "react-icons/md";
import { BsFillPersonLinesFill } from "react-icons/bs";

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
    situasiList: Array<{ situasi: string; count: number }>;
    situasiTotal: number;
    opdList: Array<{ opd: string; count: number }>;
    opdTotal: number;
    selectedOpd: string;
    setSelectedOpd: (val: string) => void;
    isPinnedOnly: boolean;
    setIsPinnedOnly: (val: boolean) => void;
    isByMeOnly: boolean;
    setIsByMeOnly: (val: boolean) => void;
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
    situasiList,
    situasiTotal,
    opdList,
    opdTotal,
    selectedOpd,
    setSelectedOpd,
    isPinnedOnly,
    setIsPinnedOnly,
    isByMeOnly,
    setIsByMeOnly,
}) => {
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydration effect - run once on mount to prevent flicker
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Prepare OPD options with counts
    const opdOptions = [
        { opd: "Semua OPD", count: opdTotal },
        ...opdList
    ];

    // Prepare Situasi options with counts
    const situasiOptions = [
        { situasi: "Semua Situasi", count: situasiTotal },
        ...situasiList
    ];

    return (
        <>
            {/* Main Header Container - Remove sticky and let parent handle it */}
            <div className="bg-white border-b shadow-sm w-full">
                {/* Main Header - Add smooth transition */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isHeaderVisible 
                        ? 'pt-4 pb-4 opacity-100 max-h-96' 
                        : 'pt-0 pb-0 opacity-0 max-h-0'
                }`}>
                    <div className="w-full px-4 lg:px-6">
                        {/* Single Row: Search and Filters */}
                        <div className="flex flex-wrap items-center gap-3 lg:gap-4 header-filters">
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
                            <div className="min-w-[300px] max-w-[350px] relative z-[10]">
                                {!isHydrated ? (
                                    <FilterSkeleton 
                                        selected={selectedStatus}
                                        counts={statusCounts}
                                        colorMap={statusColors}
                                    />
                                ) : (
                                    <ListBoxFilter
                                        options={statusTabs}
                                        selected={selectedStatus}
                                        setSelected={(val) => {
                                            setSelectedStatus(val);
                                            setPage(1);
                                        }}
                                        colorMap={statusColors}
                                        statusCounts={statusCounts}
                                        zIndex={10}
                                    />
                                )}
                            </div>

                            {/* Situasi Filter */}
                            <div className="min-w-[200px] max-w-[250px] relative z-[9]">
                                {!isHydrated ? (
                                    <FilterSkeleton 
                                        selected={selectedSituasi}
                                        counts={situasiOptions.reduce((acc, item) => {
                                            acc[item.situasi] = item.count;
                                            return acc;
                                        }, {} as Record<string, number>)}
                                    />
                                ) : (
                                    <ListBoxFilter
                                        options={situasiOptions.map(item => item.situasi)}
                                        selected={selectedSituasi}
                                        setSelected={(val) => {
                                            setSelectedSituasi(val);
                                            setPage(1);
                                        }}
                                        zIndex={9}
                                        situasiCounts={situasiOptions.reduce((acc, item) => {
                                            acc[item.situasi] = item.count;
                                            return acc;
                                        }, {} as Record<string, number>)}
                                        isSituasiFilter={true}
                                    />
                                )}
                            </div>

                            {/* OPD Filter */}
                            <div className="min-w-[250px] max-w-[400px] relative z-[8]">
                                {!isHydrated ? (
                                    <FilterSkeleton 
                                        selected={selectedOpd}
                                        counts={opdOptions.reduce((acc, item) => {
                                            acc[item.opd] = item.count;
                                            return acc;
                                        }, {} as Record<string, number>)}
                                    />
                                ) : (
                                    <ListBoxFilter
                                        options={opdOptions.map(item => item.opd)}
                                        selected={selectedOpd}
                                        setSelected={(val) => {
                                            setSelectedOpd(val);
                                            setPage(1);
                                        }}
                                        zIndex={8}
                                        opdCounts={opdOptions.reduce((acc, item) => {
                                            acc[item.opd] = item.count;
                                            return acc;
                                        }, {} as Record<string, number>)}
                                        isOpdFilter={true}
                                    />
                                )}
                            </div>

                            {/* Items per Page Filter */}
                            <div className="min-w-[150px] max-w-[170px] relative z-[7]">
                                {!isHydrated ? (
                                    <FilterSkeleton 
                                        selected={`${limit} Laporan`}
                                    />
                                ) : (
                                    <ListBoxFilter
                                        options={[100, 200, 300, 500].map(num => `${num} Laporan`)}
                                        selected={`${limit} Laporan`}
                                        setSelected={(val) => {
                                            const numValue = parseInt(val.split(' ')[0]);
                                            setLimit(numValue);
                                            setPage(1);
                                        }}
                                        zIndex={7}
                                    />
                                )}
                            </div>

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

                            {/* Love Button */}
                            <button
                                className={`h-10 w-10 rounded-full border text-sm flex items-center justify-center transition flex-shrink-0 ${isPinnedOnly ? 'border-yellow-600 bg-yellow-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => setIsPinnedOnly(!isPinnedOnly)}
                                title="Tampilkan hanya yang di-love"
                            >
                                <FaStar className="w-4 h-4" />
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

            {/* Toggle Button - Let parent handle positioning */}
            <div className="bg-gray-100 flex justify-center">
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
        </>
    );
};

// Skeleton component that matches the exact appearance of ListBoxFilter
function FilterSkeleton({
    selected,
    counts,
    colorMap,
}: {
    selected: string;
    counts?: Record<string, number>;
    colorMap?: Record<string, string>;
}) {
    // Determine which "Semua" option to check based on selected value
    const isAllOption = selected.startsWith("Semua");
    
    return (
        <div className="relative w-full">
            <button
                className="w-full border rounded-full h-10 text-sm bg-white text-left shadow-sm flex items-center justify-between text-gray-700 px-4 cursor-default"
                disabled
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {colorMap && !isAllOption && (
                        <span 
                            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" 
                            style={{ backgroundColor: colorMap[selected] }} 
                        />
                    )}
                    <span className="truncate">
                        {selected}
                        {counts && (
                            <span className="ml-1 font-semibold text-blue-600 text-xs">
                                ({isAllOption
                                    ? Object.values(counts).reduce((a, b) => a + b, 0)
                                    : counts[selected] || 0} laporan)
                            </span>
                        )}
                    </span>
                </div>
                <span className="text-gray-400 text-xs ml-2 flex-shrink-0">▼</span>
            </button>
        </div>
    );
}

// Helper Listbox for desktop filters
function ListBoxFilter({
    options,
    selected,
    setSelected,
    colorMap,
    statusCounts,
    opdCounts,
    situasiCounts,
    zIndex = 1000,
    isOpdFilter = false,
    isSituasiFilter = false,
}: {
    options: string[];
    selected: string;
    setSelected: (val: string) => void;
    colorMap?: Record<string, string>;
    statusCounts?: Record<string, number>;
    opdCounts?: Record<string, number>;
    situasiCounts?: Record<string, number>;
    zIndex?: number;
    isOpdFilter?: boolean;
    isSituasiFilter?: boolean;
}) {
    const counts = statusCounts || opdCounts || situasiCounts;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const updateDropdownPosition = () => {
        if (buttonRef.current && typeof window !== 'undefined') {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed' as const,
                top: rect.bottom + 4,
                left: rect.left,
                width: (isOpdFilter || isSituasiFilter) ? 'auto' : rect.width,
                minWidth: (isOpdFilter || isSituasiFilter) ? rect.width : undefined,
                maxWidth: (isOpdFilter || isSituasiFilter) ? '500px' : undefined,
                zIndex: zIndex + 100,
            });
        }
    };

    // Debounced version to prevent excessive updates
    const debouncedUpdatePosition = useRef<NodeJS.Timeout | null>(null);
    const debouncedUpdate = () => {
        if (debouncedUpdatePosition.current) {
            clearTimeout(debouncedUpdatePosition.current);
        }
        debouncedUpdatePosition.current = setTimeout(() => {
            if (typeof window !== 'undefined') {
                updateDropdownPosition();
            }
        }, 16); // Increased to 16ms (60fps) for smoother performance
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleScroll = () => {
            debouncedUpdate();
        };
        
        const handleResize = () => {
            debouncedUpdate();
        };
        
        // Use passive listeners for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            if (debouncedUpdatePosition.current) {
                clearTimeout(debouncedUpdatePosition.current);
            }
        };
    }, []);

    return (
        <div className="relative w-full" style={{ zIndex }}>
            <Listbox value={selected} onChange={setSelected}>
                {({ open }) => (
                    <div className="relative">
                        <Listbox.Button
                            ref={buttonRef}
                            className="w-full border rounded-full h-10 text-sm bg-white text-left shadow-sm flex items-center justify-between text-gray-700 px-4 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            onClick={updateDropdownPosition}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {colorMap && selected && !selected.startsWith("Semua") && (
                                    <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: colorMap[selected] }} />
                                )}
                                <span className="truncate">
                                    {selected}
                                    {counts && (
                                        <span className="ml-1 font-semibold text-blue-600 text-xs">
                                            ({(selected && selected.startsWith("Semua"))
                                                ? counts["Semua OPD"] || counts["Semua Status"] || counts["Semua Situasi"] || Object.values(counts).reduce((a, b) => a + b, 0)
                                                : counts[selected] || 0} laporan)
                                        </span>
                                    )}
                                </span>
                            </div>
                            <span className="text-gray-400 text-xs ml-2 flex-shrink-0">▼</span>
                        </Listbox.Button>

                        {open && typeof window !== 'undefined' && createPortal(
                            <Listbox.Options
                                className={`bg-white border rounded-lg shadow-xl max-h-60 overflow-auto dropdown-options dropdown-portal ${(isOpdFilter || isSituasiFilter) ? 'whitespace-nowrap' : ''}`}
                                style={dropdownStyle}
                                static
                            >
                                {options.map((option: string) => (
                                    <Listbox.Option key={option} value={option}>
                                        {({ active, selected: isSelected }) => (
                                            <li className={`px-4 py-2.5 flex items-center gap-2 text-sm cursor-pointer transition-colors ${active ? 'bg-blue-50' : ''
                                                } ${isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                                                } ${(isOpdFilter || isSituasiFilter) ? 'whitespace-nowrap' : ''}`}>
                                                {colorMap && option && !option.startsWith("Semua") && (
                                                    <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: colorMap[option] }} />
                                                )}
                                                <span className={`flex-1 ${(isOpdFilter || isSituasiFilter) ? 'whitespace-nowrap' : 'truncate'}`}>
                                                    {option}
                                                    {counts && (
                                                        <span className="ml-1 font-semibold text-blue-600 text-xs">
                                                            ({(option && option.startsWith("Semua"))
                                                                ? counts["Semua OPD"] || counts["Semua Status"] || counts["Semua Situasi"] || Object.values(counts).reduce((a, b) => a + b, 0)
                                                                : counts[option] || 0} laporan)
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
                    </div>
                )}
            </Listbox>
        </div>
    );
}

export default HeaderDesktop;
