"use client";

import React from "react";
import HeaderDesktop from "./HeaderDesktop";
import HeaderMobile from "./HeaderMobile";

// Props interface untuk mendefinisikan properti yang dibutuhkan komponen
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
    selectedSituasi: string;
    setSelectedSituasi: (val: string) => void;
    situasiList: Array<{situasi: string; count: number}>;
    situasiTotal: number;
    opdList: Array<{opd: string; count: number}>;
    opdTotal: number;
    selectedOpd: string;
    setSelectedOpd: (val: string) => void;
    isPinnedOnly: boolean;
    setIsPinnedOnly: (val: boolean) => void;
    isByMeOnly: boolean;
    setIsByMeOnly: (val: boolean) => void;
    totalReports: number; // Tambahan
}

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
    totalReports, // Tambahan
}) => {
    const headerProps = {
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
        totalReports, // Tambahan
    };

    return !isMobile ? <HeaderDesktop {...headerProps} /> : <HeaderMobile {...headerProps} />;
};

export default HeaderSection;